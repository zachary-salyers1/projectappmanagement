const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting database connection test");
    
    // Use explicit connection string for testing
    const connStr = "Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=\"Active Directory Default\";";
    
    // Configuration for SQL connection
    const config = {
      connectionString: connStr,
      options: { 
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000 // 30 seconds timeout
      }
    };
    
    try {
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
          message: "Successfully connected to the database",
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