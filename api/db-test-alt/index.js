const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting alternative database connection test");
    
    // Check query parameter for auth type
    const authType = req.query.auth || "default";
    let connStr = "";
    
    // Try different authentication methods based on query parameter
    switch (authType.toLowerCase()) {
      case "sql":
        // Using the SQL user created in the database
        connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;User Id=ProjectAppUser;Password=StrongP@ssword123!;";
        break;
        
      case "msi":
        // Try different MSI format
        connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;Authentication=ActiveDirectoryMSI;";
        break;
        
      case "service":
        // For service principal authentication (would need to be configured)
        // WARNING: Replace placeholders with actual values for testing
        connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;Authentication=ActiveDirectoryServicePrincipal;User Id=APP_ID;Password=APP_SECRET;";
        break;
        
      default:
        // Use active directory default
        connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;Authentication=Active Directory Default;";
        break;
    }
    
    context.log(`Using auth type: ${authType}`);
    
    // Configuration for SQL connection
    const config = {
      connectionString: connStr
    };
    
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