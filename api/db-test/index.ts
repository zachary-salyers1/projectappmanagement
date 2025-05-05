import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

export default async function dbTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    context.log("Starting database connection test");
    
    // Print environment variables (without sensitive info)
    const envKeys = Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PASSWORD'));
    context.log(`Available environment variables: ${envKeys.join(', ')}`);
    
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
    
    context.log("Connection string found (hidden for security)");
    
    // When using managed identity, don't use explicit token-based auth
    const config: sql.config = {
      connectionString: connStr,
      options: { 
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000 // 30 seconds timeout
      }
    };
    
    context.log("Attempting to connect to SQL database with config:", JSON.stringify({
      ...config,
      connectionString: "[HIDDEN]" // Don't log the connection string
    }));
    
    try {
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      context.log("Connected successfully");
      
      const result = await pool.request().query("SELECT 1 AS isConnected");
      context.log("Query executed successfully");
      
      await pool.close();
      
      return { 
        status: 200, 
        jsonBody: { 
          success: true,
          message: "Successfully connected to database",
          data: result.recordset[0] 
        } 
      };
    } catch (sqlError: any) {
      context.error(`SQL error: ${sqlError.message}`);
      if (sqlError.code) context.error(`SQL error code: ${sqlError.code}`);
      if (sqlError.number) context.error(`SQL error number: ${sqlError.number}`);
      if (sqlError.state) context.error(`SQL error state: ${sqlError.state}`);
      if (sqlError.lineNumber) context.error(`SQL error line: ${sqlError.lineNumber}`);
      
      return { 
        status: 500, 
        jsonBody: {
          success: false,
          message: "SQL error occurred",
          error: sqlError.message,
          code: sqlError.code || sqlError.number || 'unknown'
        } 
      };
    }
  } catch (e: any) {
    context.error(`General error: ${e.message}`);
    context.error(`Stack trace: ${e.stack}`);
    
    return { 
      status: 500, 
      jsonBody: {
        success: false,
        message: "Failed to connect to database",
        error: e.message,
        stack: e.stack
      } 
    };
  }
} 