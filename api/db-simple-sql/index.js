const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log("Starting SQL authentication database test");
    
    // Use SQL authentication as a last resort
    const sqlConfig = {
      user: 'ProjectAppUser',
      password: 'StrongP@ssword123!',
      server: 'salyersaipmapp.database.windows.net',
      database: 'ProjectManageApp',
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      connectionTimeout: 30000
    };
    
    try {
      context.log("Connecting to database using SQL authentication...");
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
          message: "Connected to database using SQL authentication",
          result: result.recordset
        }
      };
    } catch (sqlError) {
      context.log.error(`SQL authentication error: ${sqlError.message}`);
      if (sqlError.code) context.log.error(`Error code: ${sqlError.code}`);
      if (sqlError.number) context.log.error(`SQL error number: ${sqlError.number}`);
      
      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: false,
          message: "Failed to connect using SQL authentication",
          error: sqlError.message,
          code: sqlError.code || sqlError.number || 'unknown'
        }
      };
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