// A super-simple database test that tries both connection methods
module.exports = async function (context, req) {
  context.log("Starting simple DB test");
  
  try {
    const results = {
      directConnectionAttempted: false,
      directConnectionError: null,
      directConnectionSuccess: false,
      
      adConnectionAttempted: false,
      adConnectionError: null,
      adConnectionSuccess: false,
      
      sqlConnectionString: false,
      identityEndpoint: false,
      
      diagnostics: {}
    };
    
    // Check environment
    results.sqlConnectionString = !!process.env["SQLCONNSTR_SqlConnectionString"];
    results.identityEndpoint = !!process.env.IDENTITY_ENDPOINT;
    
    // 1. Try direct SQL authentication with connection string only
    try {
      results.directConnectionAttempted = true;
      
      // First let's check if mssql is available
      let sql;
      try {
        sql = require('mssql');
        results.diagnostics.mssqlLoaded = true;
      } catch (e) {
        results.diagnostics.mssqlLoaded = false;
        results.diagnostics.mssqlError = e.message;
        throw new Error("Could not load mssql module: " + e.message);
      }
      
      // Now try a direct connection with explicit config
      const directConfig = {
        user: 'azure',
        password: '',
        server: 'salyersaipmapp.database.windows.net',
        database: 'ProjectManageApp',
        options: {
          encrypt: true,
          trustServerCertificate: false,
          authentication: 'default'
        }
      };
      
      context.log("Attempting direct connection");
      const directPool = await sql.connect(directConfig);
      const directResult = await directPool.request().query("SELECT 1 AS directTest");
      await directPool.close();
      
      results.directConnectionSuccess = true;
      results.diagnostics.directResult = directResult.recordset[0];
    } catch (error) {
      results.directConnectionSuccess = false;
      results.directConnectionError = {
        message: error.message,
        code: error.code || null,
        number: error.number || null
      };
    }
    
    // 2. Try Azure AD authentication
    try {
      results.adConnectionAttempted = true;
      
      // Check if we have @azure/identity
      let identity;
      try {
        identity = require('@azure/identity');
        results.diagnostics.identityLoaded = true;
      } catch (e) {
        results.diagnostics.identityLoaded = false;
        results.diagnostics.identityError = e.message;
        throw new Error("Could not load @azure/identity module: " + e.message);
      }
      
      // Get SQL and set up the connection
      const sql = require('mssql');
      const DefaultAzureCredential = identity.DefaultAzureCredential;
      
      const credential = new DefaultAzureCredential();
      const token = await credential.getToken("https://database.windows.net/.default");
      
      const adConfig = {
        server: 'salyersaipmapp.database.windows.net',
        database: 'ProjectManageApp',
        options: {
          encrypt: true,
          trustServerCertificate: false
        },
        authentication: {
          type: 'azure-active-directory-access-token',
          options: {
            token: token.token
          }
        }
      };
      
      context.log("Attempting Azure AD connection");
      const adPool = await sql.connect(adConfig);
      const adResult = await adPool.request().query("SELECT 1 AS adTest");
      await adPool.close();
      
      results.adConnectionSuccess = true;
      results.diagnostics.adResult = adResult.recordset[0];
    } catch (error) {
      results.adConnectionSuccess = false;
      results.adConnectionError = {
        message: error.message,
        code: error.code || null,
        number: error.number || null
      };
    }
    
    // Send results
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: results
    };
  } catch (error) {
    context.log.error("Error in DB simple test:", error);
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: "Test failed",
        message: error.message,
        stack: error.stack
      }
    };
  }
}; 