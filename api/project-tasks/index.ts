import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Import from the shared mock data in the tasks API
// When we implement the actual database, this will be replaced with direct database queries
import { tasks } from "../tasks/index";

export default async function projectTasksApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const projectId = request.params.projectId;

  if (!projectId) {
    return { status: 400, jsonBody: { error: "Project ID is required" } };
  }

  switch (method) {
    case "GET":
      return handleGet(projectId);
    case "POST":
      return handlePost(projectId, await request.json());
    default:
      return { status: 405, jsonBody: { error: "Method not allowed" } };
  }
}

async function handleGet(projectId: string): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database query using SQL client
    const filteredTasks = tasks.filter(t => t.projectId === projectId);
    return { status: 200, jsonBody: filteredTasks };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(projectId: string, data: any): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database insert using SQL client
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate || "",
      completed: data.completed || false,
      attachments: []
    };
    tasks.push(newTask);
    return { status: 201, jsonBody: newTask };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 