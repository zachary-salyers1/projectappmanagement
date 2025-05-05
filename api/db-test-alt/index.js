const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting alternative database connection test");
    
    // Check query parameter for auth type
    const authType = req.query.auth || "default";
    let config = {
      server: 'salyersaipmapp.database.windows.net',
      database: 'ProjectManageApp',
      port: 1433,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    // Set authentication method based on query parameter
    switch (authType.toLowerCase()) {
      case "sql":
        // Using SQL authentication
        config.user = 'ProjectAppUser';
        config.password = 'StrongP@ssword123!';
        break;
        
      case "msi":
        // Using Managed Identity
        config.options.authentication = 'azure-active-directory-msi-app-service';
        break;
        
      case "service":
        // For service principal (would need real values)
        config.options.authentication = 'azure-active-directory-service-principal-secret';
        config.user = 'YOUR_APP_ID'; // Replace with real app ID
        config.password = 'YOUR_APP_SECRET'; // Replace with real secret
        break;
        
      default:
        // Active Directory Default
        config.options.authentication = 'azure-active-directory-default';
        break;
    }
    
    context.log(`Using auth type: ${authType}`);
    
    try {
      // Test connection
      context.log("Connecting to database...");
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      
      context.log("Running test query...");
      const result = await pool.request().query("SELECT 1 AS isConnected");
      
      await pool.close();
      
      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          message: `Successfully connected to the database using ${authType} authentication`,
          data: result.recordset[0],
          timestamp: new Date().toISOString()
        }
      };
    } catch (sqlError) {
      context.log.error(`SQL Error: ${sqlError.message}`);
      
      context.res = {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: false,
          message: `SQL error occurred using ${authType} authentication`,
          error: sqlError.message,
          errorCode: sqlError.code || sqlError.number || 'unknown',
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    context.log.error(`General error: ${error.message}`);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        message: "Failed to execute database test",
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
} 