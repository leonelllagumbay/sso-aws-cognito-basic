module.exports = {
  webpack: (config, webpack) => {
    // Add your variable using the DefinePlugin
    config.plugins.push(
      new webpack.DefinePlugin({
        //All your custom ENVs that you want to use in frontend
        FE_CUSTOM_VARIABLES: {
          COGNITO_DOMAIN: JSON.stringify(process.env.COGNITO_DOMAIN),
          COGNITO_CLIENT_ID: JSON.stringify(process.env.COGNITO_CLIENT_ID),
          COGNITO_REDIRECT_URI: JSON.stringify(process.env.COGNITO_REDIRECT_URI),
        },
      })
    );
    // Important: return the modified config
    return config;
  },
};