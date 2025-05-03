import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

export default async function dbTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const cred = new DefaultAzureCredential();
  const token = await cred.getToken("https://database.windows.net/.default");
  const connStr = process.env["SqlConnectionString"];
  
  if (!connStr) {
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "SqlConnectionString environment variable is not set"
      }
    };
  }
  
  const config: sql.config = {
    connectionString: connStr,
    options: { encrypt: true },
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token }
    }
  };
  
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT 1 AS isConnected`;
    return { 
      status: 200, 
      jsonBody: { 
        success: true,
        message: "Successfully connected to database",
        data: result.recordset[0] 
      } 
    };
  } catch (e) {
    context.error(e);
    return { 
      status: 500, 
      jsonBody: {
        success: false,
        message: "Failed to connect to database",
        error: e.message
      } 
    };
  } finally {
    await sql.close();
  }
} 