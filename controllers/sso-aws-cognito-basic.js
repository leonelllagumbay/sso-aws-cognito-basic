'use strict';

/**
 * sso-aws-cognito.js controller
 *
 * @description: A set of functions called "actions" of the `sso-aws-cognito-basic` plugin.
 */

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  index: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: 'ok'
    });
  },

  verifyToken: async (ctx) => {
    await strapi.plugins['sso-aws-cognito-basic'].services['sso-aws-cognito-basic'].verifyToken(ctx);
  },

  verifyTokenAPIUser: async (ctx) => {
    await strapi.plugins['sso-aws-cognito-basic'].services['sso-aws-cognito-basic'].verifyTokenAPIUser(ctx);
  }
};
