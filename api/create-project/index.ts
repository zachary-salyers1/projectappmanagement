import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

const createProject: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  // Check if we have the required name
  if (!req.body || !req.body.name) {
    context.res = {
      status: 400,
      body: { error: "Project name is required" }
    };
    return;
  }

  try {
    // Get token from Azure AD
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken("https://database.windows.net/.default");
    
    // Create connection config
    const config: sql.config = {
      server: "salyersaipmapp.database.windows.net",
      database: "ProjectManageApp",
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

    // Connect to the database
    await sql.connect(config);
    
    // Extract project data from request
    const { name, description } = req.body;
    
    // Check if Projects table exists, create if not
    const tableExists = await sql.query`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Projects' AND TABLE_SCHEMA = 'dbo'
    `;
    
    // If table doesn't exist, create it
    if (tableExists.recordset[0].count === 0) {
      await sql.query`
        CREATE TABLE dbo.Projects (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL,
          Description NVARCHAR(500) NULL,
          Created DATETIME NOT NULL DEFAULT GETDATE(),
          Modified DATETIME NULL,
          IsCompleted BIT NOT NULL DEFAULT 0
        );
      `;
      context.log("Created Projects table");
    }
    
    // Insert the new project
    const result = await sql.query`
      INSERT INTO Projects (Name, Description, Created)
      OUTPUT INSERTED.*
      VALUES (${name}, ${description}, GETDATE())
    `;
    
    // Return the created project
    context.res = {
      status: 201,
      body: result.recordset[0]
    };
  } catch (error: any) {
    context.log.error("Error creating project:", error);
    
    const errorResponse = {
      message: "Failed to create project",
      details: error.message,
      stack: error.stack
    };
    
    context.res = {
      status: 500,
      body: errorResponse
    };
  } finally {
    try {
      await sql.close();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

export default createProject; 