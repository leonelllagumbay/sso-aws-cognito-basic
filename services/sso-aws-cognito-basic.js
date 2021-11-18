'use strict';

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const { sanitizeEntity } = require('strapi-utils');

/**
 * sso-aws-cognito-basic.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

let ssoService = {};

/**
 * Validate and decode token to get more info
 * @param {*} ssoToken 
 * @returns 
 */
ssoService.getTokenInfo = async (ssoToken) => {
  return new Promise(async (resolve, reject) => {
    AWS.config.credentials.get(async (err) => {
      if (!err) {
        const jwks = process.env.COGNITO_JWKS ? JSON.parse(process.env.COGNITO_JWKS) : {};
        // See Amazon cognito API to get jwks
        // { "keys": [{ "alg": "RS256", "e": "AQAB", "kid": "Z2MsSpAMRQTIFjNSk1srITFdyfgZWM0ixym7PpyGZMs=", "kty": "RSA", "n": "wpKO6kRICmnE-Q_eVI5C7OB2xHgehu9EC6RvczvUEB3orV8wjltYKFN6kfqUawIKyPPKgUEZKasuPTlMlNExZZEtJL2EYC94EcdZWprXDdnutNWYMcciLsg9Kr1PzFnsgrDRpJRQMxxVk7xXj1SLMJLqlqQreuqBeNE6AtAGBrJJKuzsAO_2J9bgG-DGSN79R5lKKqzxvj1ZhcA95wiC5nN9vykUbkKDaV3-nfniE_BVvSMjnO-y_NDFpVA60MmTWJVlrvs4lGsIMMhI17kHzEk0Lfan44y02L-jIA1ygATUP8wcJFLOVY1WYbLW9KSg2G3594ux9HF_ps5q-klj-w", "use": "sig" }, { "alg": "RS256", "e": "AQAB", "kid": "T1wa7JZwouSg/hrnWMnmSnS6CT6E7TAy/bk2Arfwm3Q=", "kty": "RSA", "n": "tYuW15Eo0GMiLPwCcEd3LmXR3J1U1aW8qkm31dkqGFmSzXe5D8j7tIEfWwyfuwyKLMNfDYhI9mTZIiZrqgcRP9bp9xdxJLGY86rZiU9Zapx4XtGbJii2Rrjyz3TZ4leSien00SY7PYMk45w_Zx1A6xZ517cxLHuyFHRK0LepX5Q4zLydqzU3GfkKR1Fkxib0OMEybe0Dt9fJBeupwi5a5u--zZNvOX1QoD8ud4NSL-Si7sbbIpXeOfCjTMMxe5LSREv2_7wKsVSbhxHayMJlsjQLhjWNWSL_jTjrWZvvzwfVf6fwok_HIPwvxng90txBy8OXUzlkIzNgS1UTthRuzw", "use": "sig" }] };
        const [headerEncoded] = ssoToken.split('.');
        const buff = Buffer.from(headerEncoded, 'base64');
        const header = JSON.parse(buff.toString('ascii'));
        let jsonWebKey;
        for (let jwk of jwks.keys) {
          if (jwk.kid === header.kid) {
            jsonWebKey = jwk;
          }
        }
        const pem = jwkToPem(jsonWebKey);
        const payload = jwt.verify(ssoToken, pem, { algorithms: ['RS256'] });
        resolve(payload);
      } else {
        reject(err.toString());
      }
    });
  });
}

/**
 * Handle API users login using AWS Cognito token
 * The token will be passed by the frontend
 * @param {*} ctx 
 * @returns 
 */
ssoService.verifyTokenAPIUser = async (ctx) => {
  const { ssoToken } = ctx.request.body;

  const region = process.env.COGNITO_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID; // 'us-east-1:122db3b7-8819-45c0-8c93-abbcad58de1f';
  AWS.config.region = region;

  const Logins = {};
  Logins[
    `cognito-idp.${region}.amazonaws.com/${userPoolId}`
  ] = ssoToken;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins,
  });

  try {
    const tokenInfo = await ssoService.getTokenInfo(ssoToken);
    // Query user by email
    const userModel = await strapi.query('user', 'users-permissions').findOne({
      email: tokenInfo.email
    });
    let rolesToAdd = [];
    // Update user role
    // Map your user's AWS Cognito roles to Strapi roles of API users
    const roleMap = process.env.COGNITO_ROLE_MAPPING_API_USERS ? JSON.parse(process.env.COGNITO_ROLE_MAPPING_API_USERS) : [];

    if (userModel) {
      for (let role of roleMap) {
        if (tokenInfo['cognito:roles'].indexOf(role.awsRole) > -1) {
          const correspondingRoleInStapi = await strapi.query('role', 'users-permissions').findOne({
            name: role.strapiRole
          }, ['name']);
          rolesToAdd.push(correspondingRoleInStapi.id);
        }
      }

      await strapi.query('user', 'users-permissions').update({
        id: userModel.id
      }, {
        role: rolesToAdd[0],
        username: tokenInfo['cognito:username'],
        email: tokenInfo.email,
        blocked: false,
        confirmed: true,
        provider: 'local'
      });
    } else {
      for (let role of roleMap) {
        if (tokenInfo['cognito:roles'].indexOf(role.awsRole) > -1) {
          const correspondingRoleInStapi = await strapi.query('role', 'users-permissions').findOne({
            name: role.strapiRole
          }, ['name']);
          rolesToAdd.push(correspondingRoleInStapi.id);
        }
      }
      await strapi.query('user', 'users-permissions').create({
        username: tokenInfo['cognito:username'],
        email: tokenInfo.email,
        role: rolesToAdd[0],
        blocked: false,
        confirmed: true,
        provider: 'local'
      })
    }

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: tokenInfo.email
    });

    ctx.send({
      jwt: strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query('user', 'users-permissions').model,
      }),
    });
  } catch (error) {
    console.log('error', error)
    return ctx.badRequest(error.toString());
  }
}

/**
 * Handle CMS users login using AWS Cognito token
 * The token will be passed by the frontend
 * @param {*} ctx 
 * @returns 
 */
ssoService.verifyToken = async (ctx) => {
  const { ssoToken } = ctx.request.body;
  console.log("verify token sso A");

  const region = process.env.COGNITO_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID; // 'us-east-1:122db3b7-8819-45c0-8c93-abbcad58de1f';
  AWS.config.region = region;
  console.log("AWS.config.region", AWS.config.region);
  const Logins = {};
  Logins[
    `cognito-idp.${region}.amazonaws.com/${userPoolId}`
  ] = ssoToken;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins,
  });
  console.log("identityPoolId", identityPoolId);

  try {
    const tokenInfo = await ssoService.getTokenInfo(ssoToken);
    console.log("token info", tokenInfo);
    // Query user by email
    const userModel = await strapi.query('user', 'admin').findOne({
      email: tokenInfo.email
    });
    let rolesToAdd = [];
    // Update user role
    // Map your user's AWS Cognito roles to Strapi roles
    const roleMap = process.env.COGNITO_ROLE_MAPPING ? JSON.parse(process.env.COGNITO_ROLE_MAPPING) : [];

    if (userModel) {
      for (let role of roleMap) {
        if (tokenInfo['cognito:roles'].indexOf(role.awsRole) > -1) {
          const correspondingRoleInStapi = await strapi.query('role', 'admin').findOne({
            name: role.strapiRole
          }, ['name']);
          rolesToAdd.push(correspondingRoleInStapi.id);
        }
      }

      await strapi.query('user', 'admin').update({
        id: userModel.id
      }, {
        roles: rolesToAdd,
        firstname: tokenInfo['given_name'],
        lastname: tokenInfo['family_name'],
        username: tokenInfo['cognito:username'],
        email: tokenInfo.email,
        isActive: true,
        blocked: false,
      });
    } else {
      for (let role of roleMap) {
        if (tokenInfo['cognito:roles'].indexOf(role.awsRole) > -1) {
          const correspondingRoleInStapi = await strapi.query('role', 'admin').findOne({
            name: role.strapiRole
          }, ['name']);
          rolesToAdd.push(correspondingRoleInStapi.id);
        }
      }
      await strapi.query('user', 'admin').create({
        username: tokenInfo['cognito:username'],
        email: tokenInfo.email,
        roles: [rolesToAdd],
        isActive: true,
        blocked: false,
        firstname: tokenInfo['given_name'],
        lastname: tokenInfo['family_name']
      })
    }

    const processedUser = await strapi.query('user', 'admin').findOne({ email: tokenInfo.email });
    ctx.state.user = processedUser;

    const { user } = ctx.state;

    strapi.eventHub.emit('admin.auth.success', { user, provider: 'local' });

    ctx.body = {
      data: {
        token: strapi.admin.services.token.createJwtToken(user),
        user: strapi.admin.services.user.sanitizeUser(ctx.state.user), // TODO: fetch more detailed info
      },
    };
  } catch (error) {
    console.log("error in be", error);
    return ctx.badRequest(error);
  }
}

module.exports = ssoService;

