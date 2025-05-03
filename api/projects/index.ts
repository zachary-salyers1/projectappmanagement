import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Mock data for development
const projects = [
  {
    id: "1",
    title: "Sample Project 1",
    description: "This is a sample project for testing",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Sample Project 2",
    description: "Another sample project",
    createdAt: new Date().toISOString()
  }
];

export default async function projectsApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const id = request.params.id;

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
}

async function handleGet(id?: string): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database query using SQL client
    if (id) {
      const project = projects.find(p => p.id === id);
      if (project) {
        return { status: 200, jsonBody: project };
      } else {
        return { status: 404, jsonBody: { error: "Project not found" } };
      }
    } else {
      return { status: 200, jsonBody: projects };
    }
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(data: any): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database insert using SQL client
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title,
      description: data.description || "",
      createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    return { status: 201, jsonBody: newProject };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePatch(id: string, data: any): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Project ID is required" } };
    }

    // TODO: Replace with actual database update using SQL client
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return { status: 404, jsonBody: { error: "Project not found" } };
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...data,
      id // Ensure ID doesn't change
    };
    projects[projectIndex] = updatedProject;
    
    return { status: 200, jsonBody: updatedProject };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handleDelete(id?: string): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Project ID is required" } };
    }

    // TODO: Replace with actual database delete using SQL client
    const projectIndex = projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return { status: 404, jsonBody: { error: "Project not found" } };
    }

    projects.splice(projectIndex, 1);
    return { status: 204 };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 