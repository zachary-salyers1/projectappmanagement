const sql = require('mssql');

// Configuration for direct SQL connection
const sqlConfig = {
  user: 'test_app_user',
  password: 'ProjectApp2024!',
  server: 'salyersaipmapp.database.windows.net',
  database: 'ProjectManageApp',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

module.exports = async function (context, req) {
  context.log('Starting DB diagnostic test...');
  
  const diagnosticResults = {
    connection: { success: false, error: null },
    tables: { found: [], notFound: [], error: null },
    testInsert: { success: false, error: null, data: null },
    schema: { success: false, projects: null, tasks: null },
    permissions: { select: false, insert: false, error: null }
  };
  
  try {
    // Step 1: Test connection
    try {
      const pool = await sql.connect(sqlConfig);
      diagnosticResults.connection.success = true;
      context.log("Database connection successful");
      
      // Step 2: Check for tables
      try {
        const tableResult = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        
        const tables = tableResult.recordset.map(r => r.TABLE_NAME);
        diagnosticResults.tables.found = tables;
        
        const expectedTables = ['Projects', 'Tasks'];
        diagnosticResults.tables.notFound = expectedTables.filter(t => !tables.includes(t));
        
        // Step 3: Check table schema
        if (tables.includes('Projects')) {
          const projectSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Projects'
          `);
          diagnosticResults.schema.projects = projectSchema.recordset;
        }
        
        if (tables.includes('Tasks')) {
          const taskSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Tasks'
          `);
          diagnosticResults.schema.tasks = taskSchema.recordset;
        }
        
        diagnosticResults.schema.success = true;
        
        // Step 4: Test permissions
        try {
          // Check SELECT permission
          await pool.request().query('SELECT TOP 1 * FROM Projects');
          diagnosticResults.permissions.select = true;
          
          // Check INSERT permission with a test project
          const testProject = {
            name: "DIAGNOSTIC TEST " + new Date().toISOString(),
            description: "This is a test project created by the diagnostic tool",
            status: "Not Started",
            priority: 2
          };
          
          const insertResult = await pool.request()
            .input('name', sql.NVarChar, testProject.name)
            .input('description', sql.NVarChar, testProject.description)
            .input('status', sql.NVarChar, testProject.status)
            .input('priority', sql.Int, testProject.priority)
            .query(`
              INSERT INTO Projects (Name, Description, Status, Priority, CreatedAt, UpdatedAt)
              VALUES (@name, @description, @status, @priority, GETDATE(), GETDATE());
              
              DECLARE @newId INT = SCOPE_IDENTITY();
              
              SELECT * FROM Projects WHERE ProjectId = @newId;
            `);
          
          if (insertResult.recordset && insertResult.recordset.length > 0) {
            diagnosticResults.testInsert.success = true;
            diagnosticResults.testInsert.data = insertResult.recordset[0];
            diagnosticResults.permissions.insert = true;
          } else {
            diagnosticResults.testInsert.error = "Insert succeeded but no data returned";
          }
        } catch (permError) {
          diagnosticResults.permissions.error = permError.message;
          context.log.error("Permission test error:", permError);
        }
        
      } catch (tableError) {
        diagnosticResults.tables.error = tableError.message;
        context.log.error("Table check error:", tableError);
      }
      
      // Close the connection
      await pool.close();
      
    } catch (connError) {
      diagnosticResults.connection.error = connError.message;
      context.log.error("Connection error:", connError);
    }
    
    // Return all diagnostic results
    context.res = {
      status: 200,
      body: {
        timestamp: new Date().toISOString(),
        config: {
          server: sqlConfig.server,
          database: sqlConfig.database,
          user: sqlConfig.user
        },
        diagnostics: diagnosticResults
      }
    };
    
  } catch (error) {
    context.log.error("Overall diagnostic error:", error);
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