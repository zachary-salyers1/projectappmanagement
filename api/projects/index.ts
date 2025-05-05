import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import * as sql from "mssql";

// Project interface to match frontend
interface Project {
  projectId?: number;
  name: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status: string;
  priority: number;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default async function projectsApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const id = request.params.id;

  try {
    switch (method) {
      case "GET":
        return handleGet(id);
      case "POST":
        return handlePost(await request.json());
      case "PATCH":
        return handlePatch(id, await request.json());
      case "DELETE":
        return handleDelete(id);
      default:
        return { status: 405, jsonBody: { error: "Method not allowed" } };
    }
  } catch (error: any) {
    context.log.error("Error in projects API:", error);
    return { status: 500, jsonBody: { error: error.message || "Internal server error" } };
  }
}

async function getDbConnection() {
  const cred = new DefaultAzureCredential();
  const token = await cred.getToken("https://database.windows.net/.default");
  const connStr = process.env["SQLCONNSTR_SqlConnectionString"];
  
  if (!connStr) {
    throw new Error("Database connection string not found");
  }
  
  const config: sql.config = {
    connectionString: connStr,
    options: { encrypt: true },
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token }
    }
  };
  
  return await sql.connect(config);
}

async function handleGet(id?: string): Promise<HttpResponseInit> {
  try {
    const pool = await getDbConnection();
    
    if (id) {
      const result = await pool.request()
        .input('ProjectId', sql.Int, parseInt(id))
        .query('SELECT * FROM Projects WHERE ProjectId = @ProjectId');
        
      if (result.recordset.length === 0) {
        return { status: 404, jsonBody: { error: "Project not found" } };
      }
      
      return { status: 200, jsonBody: result.recordset[0] };
    } else {
      const result = await pool.request().query('SELECT * FROM Projects ORDER BY CreatedAt DESC');
      return { status: 200, jsonBody: result.recordset };
    }
  } catch (error: any) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(data: Project): Promise<HttpResponseInit> {
  try {
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .input('Name', sql.NVarChar(100), data.name)
      .input('Description', sql.NVarChar(500), data.description || null)
      .input('StartDate', sql.DateTime, data.startDate ? new Date(data.startDate) : null)
      .input('DueDate', sql.DateTime, data.dueDate ? new Date(data.dueDate) : null)
      .input('Status', sql.NVarChar(50), data.status || 'Not Started')
      .input('Priority', sql.Int, data.priority || 2)
      .input('Owner', sql.NVarChar(100), data.owner || null)
      .execute('CreateProject');
    
    if (result.recordset && result.recordset.length > 0) {
      const projectId = result.recordset[0].ProjectId;
      
      // Get the full project details
      const projectResult = await pool.request()
        .input('ProjectId', sql.Int, projectId)
        .query('SELECT * FROM Projects WHERE ProjectId = @ProjectId');
        
      return { status: 201, jsonBody: projectResult.recordset[0] };
    } else {
      throw new Error("Failed to create project");
    }
  } catch (error: any) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePatch(id: string, data: Partial<Project>): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Project ID is required" } };
    }
    
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .input('ProjectId', sql.Int, parseInt(id))
      .input('Name', sql.NVarChar(100), data.name)
      .input('Description', sql.NVarChar(500), data.description)
      .input('StartDate', sql.DateTime, data.startDate ? new Date(data.startDate) : null)
      .input('DueDate', sql.DateTime, data.dueDate ? new Date(data.dueDate) : null)
      .input('Status', sql.NVarChar(50), data.status)
      .input('Priority', sql.Int, data.priority)
      .input('Owner', sql.NVarChar(100), data.owner)
      .execute('UpdateProject');
    
    if (result.recordset && result.recordset.length > 0) {
      return { status: 200, jsonBody: result.recordset[0] };
    } else {
      return { status: 404, jsonBody: { error: "Project not found" } };
    }
  } catch (error: any) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handleDelete(id?: string): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Project ID is required" } };
    }
    
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .input('ProjectId', sql.Int, parseInt(id))
      .query('DELETE FROM Projects WHERE ProjectId = @ProjectId');
    
    if (result.rowsAffected[0] === 0) {
      return { status: 404, jsonBody: { error: "Project not found" } };
    }
    
    return { status: 204 };
  } catch (error: any) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 