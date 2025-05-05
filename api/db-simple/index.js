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
  context.log('JavaScript HTTP trigger function processed a request.');
  
  try {
    // Connect to SQL
    let pool = await sql.connect(sqlConfig);
    context.log("Connected to SQL database");
    
    // Handle different method types
    if (req.method === "GET") {
      // GET request - return all projects or a specific project
      const projectId = req.query.id;
      
      if (projectId) {
        // Get specific project
        const result = await pool.request()
          .input('projectId', sql.Int, projectId)
          .query('SELECT * FROM Projects WHERE ProjectId = @projectId');
        
        if (result.recordset.length === 0) {
          context.res = { status: 404, body: { error: "Project not found" } };
        } else {
          context.res = { status: 200, body: result.recordset[0] };
        }
      } else {
        // Get all projects
        const result = await pool.request()
          .query('SELECT * FROM Projects ORDER BY CreatedAt DESC');
        
        context.res = { status: 200, body: result.recordset };
      }
    } 
    else if (req.method === "POST") {
      // POST request - create a new project
      const project = req.body;
      
      if (!project || !project.name) {
        context.res = { status: 400, body: { error: "Project name is required" } };
        return;
      }
      
      // Insert new project using standard parameters
      const result = await pool.request()
        .input('name', sql.NVarChar, project.name)
        .input('description', sql.NVarChar, project.description || null)
        .input('startDate', sql.DateTime, project.startDate ? new Date(project.startDate) : null)
        .input('dueDate', sql.DateTime, project.dueDate ? new Date(project.dueDate) : null)
        .input('status', sql.NVarChar, project.status || 'Not Started')
        .input('priority', sql.Int, project.priority || 2)
        .input('owner', sql.NVarChar, project.owner || null)
        .query(`
          INSERT INTO Projects (Name, Description, StartDate, DueDate, Status, Priority, Owner, CreatedAt, UpdatedAt)
          VALUES (@name, @description, @startDate, @dueDate, @status, @priority, @owner, GETDATE(), GETDATE());
          
          DECLARE @newId INT = SCOPE_IDENTITY();
          
          SELECT * FROM Projects WHERE ProjectId = @newId;
        `);
      
      context.res = {
        status: 201,
        body: result.recordset[0]
      };
    }
    
    // Close the connection
    await pool.close();
    
  } catch (error) {
    context.log.error("Database error:", error);
    
    // Return error with details
    context.res = {
      status: 500,
      body: {
        error: "Database operation failed",
        message: error.message,
        code: error.code || null
      }
    };
  }
}; 