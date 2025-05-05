import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

/**
 * Database utility with flexible connection options
 */
export class DbUtils {
  private static server = "salyersaipmapp.database.windows.net";
  private static database = "ProjectManageApp";
  
  /**
   * Get connection configuration for SQL Server
   * Will try multiple authentication methods in order:
   * 1. Azure AD token authentication (Managed Identity)
   * 2. Connection string from environment variable
   */
  static async getConnectionConfig(): Promise<sql.config> {
    try {
      // First try to get Azure AD token
      const credential = new DefaultAzureCredential();
      const token = await credential.getToken("https://database.windows.net/.default");
      
      return {
        server: this.server,
        database: this.database,
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
    } catch (error) {
      console.error("Failed to get Azure AD token:", error);
      
      // Throw the error as we're out of connection options
      throw new Error("All database connection methods failed. Please check your configuration.");
    }
  }
  
  /**
   * Connect to the database and execute a query with parameters
   */
  static async executeQuery<T>(
    query: string, 
    params: { [key: string]: any } = {}
  ): Promise<T[]> {
    let pool: sql.ConnectionPool | null = null;
    
    try {
      const config = await this.getConnectionConfig();
      pool = await sql.connect(config);
      
      const request = pool.request();
      
      // Add parameters to the request
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch {}
      }
    }
  }
  
  /**
   * Run a database diagnostics check
   */
  static async runDiagnostics() {
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      config: {
        server: this.server,
        database: this.database
      },
      identity: {
        success: false,
        error: null
      },
      connection: {
        success: false,
        error: null
      },
      tables: {
        found: [],
        notFound: [],
        error: null
      }
    };
    
    try {
      // Check AAD token
      try {
        const credential = new DefaultAzureCredential();
        await credential.getToken("https://database.windows.net/.default");
        diagnosticResults.identity.success = true;
      } catch (tokenErr) {
        diagnosticResults.identity.success = false;
        diagnosticResults.identity.error = tokenErr.message;
      }
      
      // Check database connection
      try {
        const config = await this.getConnectionConfig();
        const pool = await sql.connect(config);
        diagnosticResults.connection.success = true;
        
        // Check tables
        const requiredTables = ['Projects', 'Tasks'];
        for (const table of requiredTables) {
          try {
            const query = `
              SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_NAME = @tableName AND TABLE_SCHEMA = 'dbo'
            `;
            
            const result = await this.executeQuery(query, { 
              tableName: table 
            });
            
            if (result[0].count > 0) {
              diagnosticResults.tables.found.push(table);
            } else {
              diagnosticResults.tables.notFound.push(table);
            }
          } catch (tableErr) {
            diagnosticResults.tables.error = tableErr.message;
          }
        }
        
        await pool.close();
      } catch (connErr) {
        diagnosticResults.connection.success = false;
        diagnosticResults.connection.error = connErr.message;
      }
    } catch (error) {
      console.error("Diagnostics error:", error);
    }
    
    return diagnosticResults;
  }
  
  /**
   * Setup database schema (create tables and stored procedures)
   */
  static async setupSchema() {
    const results = {
      success: false,
      operations: [],
      errors: []
    };
    
    try {
      const config = await this.getConnectionConfig();
      const pool = await sql.connect(config);
      results.operations.push("Connected to database");
      
      // Create Projects table if it doesn't exist
      await pool.request().query(`
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
      `);
      results.operations.push("Projects table check/creation completed");
      
      // Create Tasks table if it doesn't exist
      await pool.request().query(`
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
      `);
      results.operations.push("Tasks table check/creation completed");
      
      // Create stored procedures
      await pool.request().query(`
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
      `);
      results.operations.push("CreateProject procedure check/creation completed");
      
      await pool.request().query(`
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
      `);
      results.operations.push("CreateTask procedure check/creation completed");
      
      await pool.close();
      results.success = true;
    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
      console.error("Schema setup error:", error);
    }
    
    return results;
  }
} 