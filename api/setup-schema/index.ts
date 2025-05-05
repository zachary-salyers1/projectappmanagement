import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

const setupSchema: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const results = {
    success: false,
    operations: [] as string[],
    errors: [] as string[]
  };

  try {
    // Get AAD token
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken("https://database.windows.net/.default");
    
    // Setup connection
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

    await sql.connect(config);
    results.operations.push("Connected to database");
    
    // Create Projects table if it doesn't exist
    await sql.query`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Projects' AND TABLE_SCHEMA = 'dbo')
      BEGIN
        CREATE TABLE dbo.Projects (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL,
          Description NVARCHAR(500) NULL,
          Created DATETIME NOT NULL DEFAULT GETDATE(),
          Modified DATETIME NULL,
          IsCompleted BIT NOT NULL DEFAULT 0
        );
        
        PRINT 'Projects table created';
      END
      ELSE
      BEGIN
        PRINT 'Projects table already exists';
      END
    `;
    results.operations.push("Projects table check/creation completed");
    
    // Create Tasks table if it doesn't exist
    await sql.query`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Tasks' AND TABLE_SCHEMA = 'dbo')
      BEGIN
        CREATE TABLE dbo.Tasks (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          ProjectId INT NOT NULL,
          Title NVARCHAR(100) NOT NULL,
          Description NVARCHAR(500) NULL,
          Created DATETIME NOT NULL DEFAULT GETDATE(),
          DueDate DATETIME NULL,
          IsCompleted BIT NOT NULL DEFAULT 0,
          CONSTRAINT FK_Tasks_Projects FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(Id)
        );
        
        PRINT 'Tasks table created';
      END
      ELSE
      BEGIN
        PRINT 'Tasks table already exists';
      END
    `;
    results.operations.push("Tasks table check/creation completed");
    
    // Create stored procedures
    await sql.query`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateProject]') AND type in (N'P', N'PC'))
      BEGIN
        EXEC('
          CREATE PROCEDURE [dbo].[CreateProject]
            @Name NVARCHAR(100),
            @Description NVARCHAR(500) = NULL
          AS
          BEGIN
            SET NOCOUNT ON;
            
            INSERT INTO dbo.Projects (Name, Description, Created)
            OUTPUT INSERTED.*
            VALUES (@Name, @Description, GETDATE());
          END
        ');
        
        PRINT 'CreateProject procedure created';
      END
      ELSE
      BEGIN
        PRINT 'CreateProject procedure already exists';
      END
    `;
    results.operations.push("CreateProject procedure check/creation completed");
    
    await sql.query`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateTask]') AND type in (N'P', N'PC'))
      BEGIN
        EXEC('
          CREATE PROCEDURE [dbo].[CreateTask]
            @ProjectId INT,
            @Title NVARCHAR(100),
            @Description NVARCHAR(500) = NULL,
            @DueDate DATETIME = NULL
          AS
          BEGIN
            SET NOCOUNT ON;
            
            INSERT INTO dbo.Tasks (ProjectId, Title, Description, Created, DueDate)
            OUTPUT INSERTED.*
            VALUES (@ProjectId, @Title, @Description, GETDATE(), @DueDate);
          END
        ');
        
        PRINT 'CreateTask procedure created';
      END
      ELSE
      BEGIN
        PRINT 'CreateTask procedure already exists';
      END
    `;
    results.operations.push("CreateTask procedure check/creation completed");
    
    results.success = true;
  } catch (error: any) {
    results.success = false;
    results.errors.push(error.message);
    context.log.error("Schema setup error:", error);
  } finally {
    try {
      await sql.close();
    } catch {}
    
    context.res = {
      status: results.success ? 200 : 500,
      body: results
    };
  }
};

export default setupSchema; 