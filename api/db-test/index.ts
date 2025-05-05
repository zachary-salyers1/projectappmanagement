import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

export default async function dbTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    context.log("Starting database connection test");
    
    // Check connection string
    // Azure Static Web Apps Database Connections feature adds this environment variable
    let connStr = process.env["SQLCONNSTR_SqlConnectionString"];
    if (!connStr) {
      // Fallback to regular environment variable
      connStr = process.env["SqlConnectionString"];
    }
    
    if (!connStr) {
      context.log.error("Connection string environment variable is not set");
      return {
        status: 500,
        jsonBody: {
          success: false,
          message: "SQL connection string environment variable is not set. Please check Azure Static Web App configuration."
        }
      };
    }
    
    context.log("Connection string found");
    
    // When using system-assigned managed identity, we don't need to manually acquire a token
    // Azure Static Web App's Database Connections feature handles this automatically
    const config: sql.config = {
      connectionString: connStr,
      options: { 
        encrypt: true,
        trustServerCertificate: false
      }
    };
    
    context.log("Attempting to connect to SQL database");
    await sql.connect(config);
    context.log("Connected successfully");
    
    const result = await sql.query`SELECT 1 AS isConnected`;
    context.log("Query executed successfully");
    
    return { 
      status: 200, 
      jsonBody: { 
        success: true,
        message: "Successfully connected to database",
        data: result.recordset[0] 
      } 
    };
  } catch (e) {
    context.error(`Database connection error: ${e.message}`);
    
    if (e.code) {
      context.error(`Error code: ${e.code}`);
    }
    
    return { 
      status: 500, 
      jsonBody: {
        success: false,
        message: "Failed to connect to database",
        error: e.message,
        errorCode: e.code || 'unknown'
      } 
    };
  } finally {
    try {
      await sql.close();
    } catch (e) {
      context.log(`Error closing SQL connection: ${e.message}`);
    }
  }
} 