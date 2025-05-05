// Attempt direct database connection using tedious
// Tedious is the underlying driver used by mssql
const tedious = require('tedious');

module.exports = async function (context, req) {
  try {
    context.log("Starting direct database connection test");
    
    // Get identity information
    const identityInfo = {
      enabled: process.env.IDENTITY_ENDPOINT ? true : false,
      endpoint: process.env.IDENTITY_ENDPOINT || 'not available',
      headerName: process.env.IDENTITY_HEADER ? 'available' : 'not available',
      resourceId: process.env.WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID || 'not available'
    };
    
    // Log what we're trying to do
    context.log("Creating connection to database using user-assigned managed identity");
    
    let connectionSuccess = false;
    let errorMessage = '';
    
    try {
      // Create connection with Azure AD authentication
      const config = {
        server: 'salyersaipmapp.database.windows.net',
        authentication: {
          type: 'azure-active-directory-msi-app-service',
          options: {
            // Explicitly set the clientId to use the user-assigned managed identity
            clientId: '6aa1e9bbbc6a47319fe8d20522571a8c-mi'
          }
        },
        options: {
          database: 'ProjectManageApp',
          encrypt: true,
          port: 1433,
          rowCollectionOnRequestCompletion: true,
          useColumnNames: true
        }
      };
      
      // Create a connection to the database
      const connection = new tedious.Connection(config);
      
      // Handle connection events
      connection.on('connect', function(err) {
        if (err) {
          connectionSuccess = false;
          errorMessage = err.message;
          context.log.error(`Connection error: ${err.message}`);
          return;
        }
        
        connectionSuccess = true;
        context.log("Connected to database");
        
        // Execute a simple query
        const request = new tedious.Request("SELECT 1 AS isConnected", function(err, rowCount, rows) {
          if (err) {
            context.log.error(`Query error: ${err.message}`);
            return;
          }
          
          context.log(`Query completed, ${rowCount} rows returned`);
          connection.close();
        });
        
        // Execute the SQL statement
        connection.execSql(request);
      });
      
      // Connect
      connection.connect();
      
      // Wait for connection events to fire (for demo purposes)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (tediousError) {
      connectionSuccess = false;
      errorMessage = tediousError.message;
      context.log.error(`Tedious error: ${tediousError.message}`);
    }
    
    context.res = {
      status: connectionSuccess ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: connectionSuccess,
        message: connectionSuccess ? 
          "Successfully connected to database directly" : 
          "Failed to connect to database directly",
        error: errorMessage,
        identity: identityInfo,
        resourceId: process.env.WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    context.log.error(`General error: ${error.message}`);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        message: "Failed to execute direct database test",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    };
  }
} 