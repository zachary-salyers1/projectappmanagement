import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export default async function dbInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Get all environment variables related to SQL
    const envVars = Object.keys(process.env)
      .filter(key => 
        key.includes('SQL') || 
        key.includes('Database') || 
        key.includes('DB') || 
        key.includes('Connection')
      )
      .reduce((obj, key) => {
        // Hide actual connection string values for security
        let value = process.env[key] || '';
        if (
          value.includes('Server=') || 
          value.includes('Password=') || 
          value.includes('User ID=') || 
          value.includes('Authentication=')
        ) {
          value = '[REDACTED - Connection String]';
        }
        obj[key] = value;
        return obj;
      }, {} as Record<string, string>);

    // Check if we have the expected environment variables
    const hasSqlConnStr = Object.keys(process.env).some(key => 
      key === 'SQLCONNSTR_SqlConnectionString' || 
      key === 'SqlConnectionString'
    );

    // Get Static Web App specific information
    const swaInfo = {
      hostname: request.headers.get('host'),
      clientIP: request.headers.get('x-forwarded-for'),
      identityEnabled: process.env['WEBSITE_AUTH_ENABLED'] === 'True',
      identityProvider: process.env['WEBSITE_AUTH_DEFAULT_PROVIDER'] || 'Unknown',
      nodeVersion: process.version,
      systemInfo: {
        platform: process.platform,
        arch: process.arch
      }
    };

    return {
      status: 200,
      jsonBody: {
        message: "Database configuration info",
        hasConnectionString: hasSqlConnStr,
        environment: envVars,
        staticWebAppInfo: swaInfo,
        headers: Object.fromEntries(request.headers.entries())
      }
    };
  } catch (error: any) {
    context.error(`Error in dbInfo: ${error.message}`);
    return {
      status: 500,
      jsonBody: {
        error: error.message,
        stack: error.stack
      }
    };
  }
} 