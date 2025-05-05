import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

const dbTest: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    // Get a token from Azure AD
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken("https://database.windows.net/.default");
    
    // Get connection string from environment
    const connStr = process.env["SQLCONNSTR_SqlConnectionString"] || "";
    
    // Parse connection info from connection string if available
    let server = "salyersaipmapp.database.windows.net";
    let database = "ProjectManageApp";
    
    if (connStr) {
      const connParts = connStr.split(';');
      for (const part of connParts) {
        if (part.toLowerCase().startsWith('server=')) server = part.split('=')[1];
        if (part.toLowerCase().startsWith('database=')) database = part.split('=')[1];
      }
    }
    
    // Create connection config with AAD token
    const config: sql.config = {
      server,
      database,
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
    
    // Connect and run test query
    await sql.connect(config);
    const result = await sql.query`SELECT 1 AS isConnected`;
    
    context.res = {
      status: 200,
      body: {
        success: true,
        message: "Connected successfully using AAD authentication",
        data: result.recordset[0]
      }
    };
  } catch (e) {
    context.log.error(e);
    context.res = {
      status: 500,
      body: {
        success: false,
        message: e.message,
        details: e.toString()
      }
    };
  } finally {
    try {
      await sql.close();
    } catch {}
  }
};

export default dbTest; 