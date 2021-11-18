# Strapi plugin sso-aws-cognito-basic

This is a basic plugin using Amazon Cognito for Single Sign On (SSO).
The configurations are controlled by environment variables inside .env file.

# How it works

Normally you get the token to authenticate and authorize your app to access Amazon services. Can I use it to authorize Strapi services? Yes by using Cognito token to authenticate a user in Strapi. The idea is to map AWS Cognito roles with the Strapi roles. If the role match then the user will be authenticated and it will return Strapi generated JWT token as if the user logs in. This works even if the user is not yet created. If authenticated and the role match the user will be created automatically. If the user already exist, the user information will be updated. This way you can use it to authorize AWS services at the same time authorize your own Strapi services by either using the Strapi token or the Cognito token.

To authenticate, use the returned token as parameter. After authenticated, it will still use the Strapi jwt token since you are just accessing its internal APIs.

This will work both for admin and API users.

For API users, in the client pass the ssoToken (token returned after logging in to Cognito) to /verifyTokenAPIUser endpoint.
  

# Supported Strapi versions:

Strapi v3.6.x and above

# Installation

npm install strapi-plugin-sso-aws-cognito-basic --save

or

yarn add strapi-plugin-sso-aws-cognito-basic


# Copy required files


Inside plugin strapi-files copy admin to admin/ project root directory and copy hooks.js to Strapi config. Also copy the hooks folder to the Strapi root directory. If the folders already exist, only copy the files or code that are missing.
  

# Setup up environment variables

Create .env if not yet available on the project root directory

Add the following variables:

COGNITO_DOMAIN=https://{username}.auth.{region}.amazoncognito.com

COGNITO_CLIENT_ID=45ishi11kmir29u23p0qpih5as

COGNITO_REDIRECT_URI=http://localhost:8000/admin/auth/login

COGNITO_REGION=us-east-1

COGNITO_USER_POOL_ID=us-east-1_DdcKJ1Eeb

COGNITO_IDENTITY_POOL_ID=us-east-1:122db3b7-3232-45c2-8c93-abbcad58de1f

COGNITO_ROLE_MAPPING=[{"awsRole":"arn:aws:iam::994583806537:role/Admin","strapiRole":"Super Admin"},

COGNITO_ROLE_MAPPING_API_USERS=[] # If using API users

COGNITO_JWKS={"keys":[{"alg":"RS256","e":"AQAB","kid":"Z2MsSpAMRQTIFjNSk1srITFdyfgZWM0ixym7PpyGZMs=","kty":"RSA","n":"wpKO6kRICmnE...","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"T1wa7JZwouSg/hrnWMnmSnS6CT6E7TAy/bk2Arfwm3Q=","kty":"RSA","n":"tYuW15E...","use":"sig"}]}

  See the official AWS Cognito documentation on how to get those values.

## For array value like COGNITO_ROLE_MAPPING,:

[{
	awsRole: 'arn:aws:iam::994583806537:role/Admin',
	strapiRole: 'Super Admin'
}, {
awsRole: 'arn:aws:iam::994583806537:role/Technologist',
strapiRole: 'Technologist'
}]

### convert it to string like so

[{"awsRole":"arn:aws:iam::994583806537:role/Admin","strapiRole":"Super Admin"},{"awsRole":"arn:aws:iam::994583806537:role/Technologist","strapiRole":"Technologist"}]
  

### It is required that you map your Strapi roles to the corresponding role from AWS Cognito.
  

## Copy hooks file and folder

This will make sure that the verifytoken and verifytokenapiuser api is public


# Run the project


## npm

npm run build && npm run develop
  
## yarn

yarn build && yarn develop