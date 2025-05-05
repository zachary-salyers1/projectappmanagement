import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

const dbTest: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    context.log("Starting db-test function");
    const cred = new DefaultAzureCredential();
    context.log("Getting token");
    const token = await cred.getToken("https://database.windows.net/.default");
    context.log("Got token, setting up connection");
    
    const connStr = process.env["SQLCONNSTR_SqlConnectionString"];
    if (!connStr) {
      context.log.error("Connection string not found");
      context.res = {
        status: 500,
        body: { error: "Database connection string not found" }
      };
      return;
    }
    
    context.log("Connection string:", connStr);
    
    const config: sql.config = {
      connectionString: connStr,
      options: { encrypt: true },
      authentication: {
        type: "azure-active-directory-access-token",
        options: { token: token.token }
      }
    };
    
    context.log("Connecting to database");
    await sql.connect(config);
    context.log("Connected to database, executing query");
    
    const result = await sql.query`SELECT 1 AS isConnected`;
    context.log("Query executed");
    
    context.res = {
      status: 200,
      body: {
        message: "Database connection successful",
        result: result.recordset[0]
      }
    };
  } catch (e: any) {
    context.log.error("Database connection failed:", e);
    context.log.error("Error message:", e.message);
    context.log.error("Error stack:", e.stack);
    
    let errorDetails = {
      message: e.message,
      stack: e.stack,
      name: e.name
    };
    
    if (e.code) {
      errorDetails = { ...errorDetails, code: e.code };
    }
    
    if (e.number) {
      errorDetails = { ...errorDetails, sqlErrorNumber: e.number };
    }
    
    context.res = {
      status: 500,
      body: {
        error: "Database connection failed",
        details: errorDetails
      }
    };
  }
};

export default dbTest; 