import React from 'react';
import axios from 'axios';
import useChangeLanguage from '../LanguageProvider/hooks/useChangeLanguage';
import { auth } from 'strapi-helper-plugin';
import { useHistory } from 'react-router-dom';

// Get returned token (code not used here)
let idToken = "";
const cognitoReturnedToken = location.hash.replace('#', '?');
if (cognitoReturnedToken) {
  const searchParams = new URLSearchParams(cognitoReturnedToken);
  idToken = searchParams.get("id_token");
}

const AwsCognitoLogin = () => {
  const changeLocale = useChangeLanguage();
  const { push } = useHistory();

  const acquireToken = async () => {
    await verifyToken({
      ssoToken: idToken
    }, '/verifyToken');
  }

  const verifyToken = async (body, requestURL) => {
    try {
      const {
        data: {
          data: { token, user },
        },
      } = await axios({
        method: 'POST',
        url: `${strapi.backendURL}${requestURL}`,
        data: body,
      });

      if (user.preferedLanguage) {
        changeLocale(user.preferedLanguage);
      }

      auth.setToken(token, false);
      auth.setUserInfo(user, false);

      idToken = "";
      push('/');
    } catch (err) {
      console.log('aws cognito login error', err);
      strapi.notification.error('Unable to login to AWS Cognito Login');
    }
  };

  if (!idToken) {
    location.href = `${FE_CUSTOM_VARIABLES.COGNITO_DOMAIN}/login?client_id=${FE_CUSTOM_VARIABLES.COGNITO_CLIENT_ID}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${FE_CUSTOM_VARIABLES.COGNITO_REDIRECT_URI}`;
  } else {
    acquireToken();
  }

  return (
    <div></div>
  )
}

export default AwsCognitoLogin;
