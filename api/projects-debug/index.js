module.exports = async function (context, req) {
  try {
    // List environment variables (without exposing secrets)
    const envVars = {};
    for (const key in process.env) {
      // Skip secrets
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') || key.includes('CONN')) {
        envVars[key] = '[REDACTED]';
      } else {
        envVars[key] = process.env[key];
      }
    }

    // Try to get the SQL connection string (redacted)
    const hasSqlConn = !!process.env["SQLCONNSTR_SqlConnectionString"];
    const sqlConnLength = hasSqlConn ? process.env["SQLCONNSTR_SqlConnectionString"].length : 0;

    // Check for modules
    const modules = {
      mssql: true,
      azureIdentity: true
    };
    
    try {
      require('mssql');
    } catch (e) {
      modules.mssql = false;
    }
    
    try {
      require('@azure/identity');
    } catch (e) {
      modules.azureIdentity = false;
    }

    // Return diagnostic information
    context.res = {
      status: 200,
      body: {
        message: "Diagnostic successful",
        requestUrl: req.url,
        requestHeaders: req.headers,
        environment: {
          nodeVersion: process.version,
          hasEnvVars: Object.keys(envVars).length > 0 ? true : false,
          envVarCount: Object.keys(envVars).length,
          hasSqlConnection: hasSqlConn,
          sqlConnectionStringLength: sqlConnLength,
          environment: process.env.AZURE_FUNCTIONS_ENVIRONMENT || 'unknown',
          hasIdentityEndpoint: !!process.env.IDENTITY_ENDPOINT,
          hasFunctionCodePath: !!process.env.AzureWebJobsScriptRoot
        },
        modules: modules,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        error: "Diagnostic failed",
        message: error.message,
        stack: error.stack
      }
    };
  }
}; 