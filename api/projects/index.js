// Simple mock implementation without dependencies
module.exports = async function (context, req) {
  try {
    context.log("Projects API called", req.method);
    
    // Mock data for projects
    const mockProjects = [
      {
        projectId: 1,
        name: "Mock Project 1",
        description: "This is a test project",
        status: "Not Started",
        priority: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        projectId: 2,
        name: "Mock Project 2",
        description: "Another test project",
        status: "In Progress",
        priority: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const id = req.params.id;
    
    switch (req.method) {
      case "GET":
        if (id) {
          const project = mockProjects.find(p => p.projectId === parseInt(id));
          if (project) {
            context.res = { status: 200, body: project };
          } else {
            context.res = { status: 404, body: { error: "Project not found" } };
          }
        } else {
          context.res = { status: 200, body: mockProjects };
        }
        break;
        
      case "POST":
        try {
          const newProject = req.body;
          const createdProject = {
            ...newProject,
            projectId: Math.floor(Math.random() * 1000) + 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          context.res = { status: 201, body: createdProject };
        } catch (e) {
          context.log.error("Error creating project:", e);
          context.res = { status: 400, body: { error: "Invalid project data" } };
        }
        break;
        
      case "PATCH":
        if (id) {
          const project = mockProjects.find(p => p.projectId === parseInt(id));
          if (project) {
            const updatedProject = {
              ...project,
              ...req.body,
              projectId: project.projectId, // Ensure ID doesn't change
              updatedAt: new Date().toISOString()
            };
            context.res = { status: 200, body: updatedProject };
          } else {
            context.res = { status: 404, body: { error: "Project not found" } };
          }
        } else {
          context.res = { status: 400, body: { error: "Project ID is required" } };
        }
        break;
        
      case "DELETE":
        if (id) {
          // Pretend to delete
          context.res = { status: 204 };
        } else {
          context.res = { status: 400, body: { error: "Project ID is required" } };
        }
        break;
        
      default:
        context.res = { status: 405, body: { error: "Method not allowed" } };
    }
  } catch (error) {
    context.log.error("Error in projects API:", error);
    context.res = {
      status: 500,
      body: {
        error: "Internal Server Error",
        message: error.message
      }
    };
  }
}; 