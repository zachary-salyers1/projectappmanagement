const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting Microsoft Entra authentication database test");
    
    // Connection string using Microsoft Entra authentication (Active Directory Default)
    const connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;Authentication=Active Directory Default;";
    
    context.log("Using Microsoft Entra authentication");
    
    try {
      // Create connection with default config
      const pool = new sql.ConnectionPool({
        connectionString: connStr
      });
      
      context.log("Connecting to database...");
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
          message: "Successfully connected to the database using Microsoft Entra authentication",
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
          message: "SQL error occurred",
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