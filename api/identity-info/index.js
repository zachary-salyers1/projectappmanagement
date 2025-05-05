module.exports = async function (context, req) {
  try {
    // Get server environment information
    const serverInfo = {
      hostname: process.env.WEBSITE_HOSTNAME || 'unknown',
      siteName: process.env.WEBSITE_SITE_NAME || 'unknown',
      resourceGroup: process.env.WEBSITE_RESOURCE_GROUP || 'unknown',
      defaultHostname: process.env.WEBSITE_DEFAULT_HOSTNAME || 'unknown',
      slotName: process.env.WEBSITE_SLOT_NAME || 'production',
      instanceId: process.env.WEBSITE_INSTANCE_ID || 'unknown',
      nodeVersion: process.version || 'unknown'
    };

    // Get identity information
    const identityInfo = {
      identityEnabled: process.env.IDENTITY_ENDPOINT ? true : false,
      identityEndpoint: process.env.IDENTITY_ENDPOINT || 'not available',
      identityHeader: process.env.IDENTITY_HEADER ? 'available' : 'not available'
    };

    // Get authorization information
    const authInfo = {
      authEnabled: process.env.WEBSITE_AUTH_ENABLED === 'True',
      authProvider: process.env.WEBSITE_AUTH_DEFAULT_PROVIDER || 'none'
    };

    // Get all environment variables (filtering out sensitive information)
    const allEnvVars = Object.keys(process.env)
      .filter(key => 
        !key.includes('KEY') && 
        !key.includes('SECRET') && 
        !key.includes('PASSWORD') && 
        !key.includes('TOKEN')
      )
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        message: "Identity information",
        server: serverInfo,
        identity: identityInfo,
        authentication: authInfo,
        requestHeaders: req.headers,
        timestamp: new Date().toISOString(),
        environmentVariables: allEnvVars
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: error.message,
        stack: error.stack
      }
    };
  }
} 