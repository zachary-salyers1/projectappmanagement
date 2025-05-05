const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting simple database test");
    
    // Log identity info
    const identityEnabled = process.env.IDENTITY_ENDPOINT ? "Yes" : "No";
    context.log(`Identity enabled: ${identityEnabled}`);
    
    // Use a timeout to ensure we don't hang indefinitely
    const timeout = 20000; // 20 seconds
    
    // Create a SQL connection config
    const sqlConfig = {
      server: 'salyersaipmapp.database.windows.net',
      database: 'ProjectManageApp',
      authentication: {
        type: 'azure-active-directory-msi-app-service'
      },
      options: {
        encrypt: true
      },
      connectionTimeout: timeout,
      requestTimeout: timeout,
      pool: {
        max: 5,
        min: 1,
        idleTimeoutMillis: timeout
      }
    };
    
    try {
      context.log("Connecting to database...");
      const pool = await sql.connect(sqlConfig);
      context.log("Connected successfully!");
      
      const result = await pool.request().query('SELECT 1 as success');
      context.log(`Query result: ${JSON.stringify(result.recordset)}`);
      
      await pool.close();
      context.log("Connection closed");
      
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          message: "Connected to database successfully",
          result: result.recordset,
          config: {
            server: sqlConfig.server,
            database: sqlConfig.database,
            authType: sqlConfig.authentication.type
          }
        }
      };
    } catch (dbError) {
      context.log.error(`Database error: ${dbError.message}`);
      if (dbError.code) context.log.error(`Error code: ${dbError.code}`);
      if (dbError.number) context.log.error(`SQL error number: ${dbError.number}`);
      
      // Try system-assigned identity as fallback
      try {
        context.log("Trying system-assigned identity as fallback...");
        const sysConfig = {
          server: 'salyersaipmapp.database.windows.net',
          database: 'ProjectManageApp',
          authentication: {
            type: 'default'
          },
          options: {
            encrypt: true
          }
        };
        
        const pool2 = await sql.connect(sysConfig);
        const result2 = await pool2.request().query('SELECT 1 as success');
        await pool2.close();
        
        return {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            message: "Connected to database using system-assigned identity",
            result: result2.recordset
          }
        };
      } catch (sysError) {
        context.log.error(`System identity error: ${sysError.message}`);
        
        return {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            message: "Failed to connect to database",
            userAssignedError: dbError.message,
            systemAssignedError: sysError.message,
            identityInfo: {
              enabled: identityEnabled,
              resourceId: process.env.WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID || "Not available"
            }
          }
        };
      }
    }
  } catch (error) {
    context.log.error(`General error: ${error.message}`);
    
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        message: "Failed due to general error",
        error: error.message,
        stack: error.stack
      }
    };
  }
}; 