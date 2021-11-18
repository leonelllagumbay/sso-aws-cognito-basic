module.exports = strapi => {
  const hook = {
    /**
     * Default options
     */

    defaults: {
      // config object
    },

    /**
     * Initialize the hook
     */

    async initialize() {
      try {
        // Make sure verifytoken api is public
        const userRole = await strapi.query('role', 'users-permissions').findOne({
          name: 'Public'
        }, ['name']);
        let permissionsForPublic = [];
        if (userRole) {
          permissionsForPublic = [{
            type: 'sso-aws-cognito-basic',
            role: userRole.id,
            controller: 'sso-aws-cognito-basic',
            action: 'verifytoken',
            enabled: true,
          }, {
            type: 'sso-aws-cognito-basic',
            role: userRole.id,
            controller: 'sso-aws-cognito-basic',
            action: 'verifytokenapiuser',
            enabled: true,
          }];
        }

        const permissions = [...permissionsForPublic];

        for (let permission of permissions) {
          const userPermissions = await strapi.query('permission', 'users-permissions').findOne({
            type: permission.type,
            role: permission.role,
            controller: permission.controller,
            action: permission.action
          });
          if (userPermissions) {
            try {
              await strapi.query('permission', 'users-permissions').update({
                id: userPermissions.id
              }, {
                enabled: true
              });
            } catch (err) {
              console.log('public permission err 1', err);
            }
          } else {
            try {
              await strapi.query('permission', 'users-permissions').create({
                type: permission.type,
                role: permission.role,
                controller: permission.controller,
                action: permission.action,
                enabled: true
              });
            } catch (err) {
              console.log('public permission err 2', err);
            }
          }
        }
      } catch (err) {
        console.log('hook permission err', err);
      }
    }
  };

  return hook;
}

