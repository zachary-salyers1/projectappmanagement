import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Mock data for development
export const tasks = [
  {
    id: "1",
    projectId: "1",
    title: "Design homepage",
    description: "Create wireframes for the homepage",
    dueDate: "2025-05-15",
    completed: false,
    attachments: []
  },
  {
    id: "2",
    projectId: "1",
    title: "Implement login functionality",
    description: "Add user authentication",
    dueDate: "2025-05-20",
    completed: false,
    attachments: []
  },
  {
    id: "3",
    projectId: "2",
    title: "Create database schema",
    description: "Design the initial database structure",
    dueDate: "2025-05-10",
    completed: true,
    attachments: []
  }
];

export default async function tasksApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const id = request.params.id;
  const projectId = request.query.get("projectId") || undefined;

  switch (method) {
    case "GET":
      return handleGet(id, projectId);
    case "POST":
      return handlePost(await request.json());
    case "PATCH":
      return handlePatch(id, await request.json());
    case "DELETE":
      return handleDelete(id);
    default:
      return { status: 405, jsonBody: { error: "Method not allowed" } };
  }
}

async function handleGet(id?: string, projectId?: string): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database query using SQL client
    if (id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        return { status: 200, jsonBody: task };
      } else {
        return { status: 404, jsonBody: { error: "Task not found" } };
      }
    } else if (projectId) {
      const filteredTasks = tasks.filter(t => t.projectId === projectId);
      return { status: 200, jsonBody: filteredTasks };
    } else {
      return { status: 200, jsonBody: tasks };
    }
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(data: any): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database insert using SQL client
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: data.projectId,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate || null,
      completed: data.completed || false,
      attachments: []
    };
    tasks.push(newTask);
    return { status: 201, jsonBody: newTask };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePatch(id: string, data: any): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Task ID is required" } };
    }

    // TODO: Replace with actual database update using SQL client
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return { status: 404, jsonBody: { error: "Task not found" } };
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...data,
      id, // Ensure ID doesn't change
      projectId: data.projectId || tasks[taskIndex].projectId // Ensure projectId doesn't get lost
    };
    tasks[taskIndex] = updatedTask;
    
    return { status: 200, jsonBody: updatedTask };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handleDelete(id?: string): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Task ID is required" } };
    }

    // TODO: Replace with actual database delete using SQL client
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return { status: 404, jsonBody: { error: "Task not found" } };
    }

    tasks.splice(taskIndex, 1);
    return { status: 204 };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 