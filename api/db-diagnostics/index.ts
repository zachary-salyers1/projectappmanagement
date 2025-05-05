import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

const dbDiagnostics: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    config: {
      server: "salyersaipmapp.database.windows.net",
      database: "ProjectManageApp"
    },
    identity: {
      success: false,
      token: null,
      error: null
    },
    connection: {
      success: false,
      error: null
    },
    adAccounts: {
      success: false,
      accounts: [],
      error: null
    },
    tables: {
      found: [],
      notFound: [],
      error: null
    },
    testInsert: {
      success: false,
      error: null,
      data: null
    }
  };

  try {
    // Step 1: Try to get Azure AD token
    const credential = new DefaultAzureCredential();
    try {
      const token = await credential.getToken("https://database.windows.net/.default");
      diagnosticResults.identity.success = true;
      diagnosticResults.identity.token = token.token.substring(0, 10) + "..." + token.token.slice(-5);
    } catch (tokenErr: any) {
      diagnosticResults.identity.success = false;
      diagnosticResults.identity.error = tokenErr.message;
      throw new Error(`Failed to get Azure AD token: ${tokenErr.message}`);
    }

    // Step 2: Attempt database connection with AAD token
    const config: sql.config = {
      server: diagnosticResults.config.server,
      database: diagnosticResults.config.database,
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: (await credential.getToken("https://database.windows.net/.default")).token
        }
      }
    };

    try {
      await sql.connect(config);
      diagnosticResults.connection.success = true;
    } catch (connErr: any) {
      diagnosticResults.connection.success = false;
      diagnosticResults.connection.error = connErr.message;
      throw new Error(`Failed to connect to database: ${connErr.message}`);
    }

    // Step 3: Check AAD accounts in the database
    try {
      const aadAccountsQuery = await sql.query`
        SELECT name, type_desc, authentication_type_desc
        FROM sys.database_principals
        WHERE authentication_type_desc = 'EXTERNAL'
        OR type_desc IN ('EXTERNAL_GROUP', 'EXTERNAL_USER');
      `;
      
      diagnosticResults.adAccounts.success = true;
      diagnosticResults.adAccounts.accounts = aadAccountsQuery.recordset.map(record => ({
        name: record.name,
        type: record.type_desc,
        authType: record.authentication_type_desc
      }));
    } catch (aadErr: any) {
      diagnosticResults.adAccounts.success = false;
      diagnosticResults.adAccounts.error = aadErr.message;
    }

    // Step 4: Check tables existence
    const requiredTables = ['Projects', 'Tasks'];
    for (const table of requiredTables) {
      try {
        const tableCheck = await sql.query`
          SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = ${table} AND TABLE_SCHEMA = 'dbo'
        `;
        if (tableCheck.recordset[0].count > 0) {
          diagnosticResults.tables.found.push(table);
        } else {
          diagnosticResults.tables.notFound.push(table);
        }
      } catch (tableErr: any) {
        diagnosticResults.tables.error = tableErr.message;
      }
    }

    // Step 5: Try a test insert if Projects table exists
    if (diagnosticResults.tables.found.includes('Projects')) {
      try {
        // First try a temp test table to check permissions
        await sql.query`
          IF OBJECT_ID('tempdb..#TestTempTable') IS NOT NULL DROP TABLE #TestTempTable;
          CREATE TABLE #TestTempTable (ID INT, Name NVARCHAR(100));
          INSERT INTO #TestTempTable VALUES (1, 'Test diagnostic entry');
          SELECT * FROM #TestTempTable;
          DROP TABLE #TestTempTable;
        `;
        
        // Then try a test insert with rollback
        await sql.transaction(async (transaction) => {
          const insertResult = await transaction.request()
            .input('name', sql.NVarChar, 'Test Project - DIAGNOSTICS')
            .input('description', sql.NVarChar, 'This is a test project created by diagnostics')
            .query`
              INSERT INTO Projects (Name, Description, Created)
              OUTPUT INSERTED.*
              VALUES (@name, @description, GETDATE());
            `;
          
          diagnosticResults.testInsert.success = true;
          diagnosticResults.testInsert.data = insertResult.recordset[0];
          
          // Roll back the test insert
          throw new Error('Rolling back test insert');
        });
      } catch (insertErr: any) {
        if (insertErr.message === 'Rolling back test insert') {
          // This is expected for our rollback
          diagnosticResults.testInsert.success = true;
        } else {
          diagnosticResults.testInsert.error = insertErr.message;
        }
      }
    }

  } catch (error: any) {
    // Main error is already recorded in the diagnostics object
    context.log.error(error);
  } finally {
    try {
      await sql.close();
    } catch {}
    
    // Return the diagnostic results
    context.res = {
      status: 200,
      body: diagnosticResults
    };
  }
};

export default dbDiagnostics; 