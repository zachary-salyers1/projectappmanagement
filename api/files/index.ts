import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Mock data for development
const fileAttachments = [
  {
    id: "file1",
    entityType: "task",
    entityId: "1",
    name: "design-mockup.pdf",
    path: "/attachments/design-mockup.pdf",
    contentType: "application/pdf",
    size: 1024 * 1024 * 2, // 2MB
    downloadUrl: "https://example.com/files/design-mockup.pdf"
  },
  {
    id: "file2",
    entityType: "billing",
    entityId: "2",
    name: "invoice-001.pdf",
    path: "/attachments/invoice-001.pdf",
    contentType: "application/pdf",
    size: 1024 * 512, // 512KB
    downloadUrl: "https://example.com/files/invoice-001.pdf"
  }
];

export default async function filesApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const method = request.method;
  const entityType = request.params.entityType as "task" | "billing";
  const entityId = request.params.entityId;
  const fileId = request.query.get("fileId") || undefined;

  if (!entityType || !["task", "billing"].includes(entityType)) {
    return { status: 400, jsonBody: { error: "Invalid entity type. Must be 'task' or 'billing'." } };
  }

  if (!entityId) {
    return { status: 400, jsonBody: { error: "Entity ID is required" } };
  }

  switch (method) {
    case "GET":
      return handleGet(entityType, entityId, fileId);
    case "POST":
      return handlePost(entityType, entityId, request);
    case "DELETE":
      return handleDelete(fileId);
    default:
      return { status: 405, jsonBody: { error: "Method not allowed" } };
  }
}

async function handleGet(entityType: "task" | "billing", entityId: string, fileId?: string): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual Microsoft Graph API calls
    if (fileId) {
      const file = fileAttachments.find(f => f.id === fileId);
      if (file) {
        return { status: 200, jsonBody: file };
      } else {
        return { status: 404, jsonBody: { error: "File attachment not found" } };
      }
    } else {
      const files = fileAttachments.filter(f => f.entityType === entityType && f.entityId === entityId);
      return { status: 200, jsonBody: files };
    }
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(entityType: "task" | "billing", entityId: string, request: HttpRequest): Promise<HttpResponseInit> {
  try {
    // In a real implementation, this would:
    // 1. Extract the file from the multipart form data
    // 2. Upload it to OneDrive/SharePoint using Microsoft Graph
    // 3. Save metadata to the database

    // For now, just mock the response
    const newFileId = `file${Math.random().toString(36).substr(2, 9)}`;
    const newFile = {
      id: newFileId,
      entityType,
      entityId,
      name: `mock-file-${newFileId}.pdf`,
      path: `/attachments/mock-file-${newFileId}.pdf`,
      contentType: "application/pdf",
      size: 1024 * 1024, // 1MB
      downloadUrl: `https://example.com/files/mock-file-${newFileId}.pdf`
    };

    fileAttachments.push(newFile);
    return { status: 201, jsonBody: newFile };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handleDelete(fileId?: string): Promise<HttpResponseInit> {
  try {
    if (!fileId) {
      return { status: 400, jsonBody: { error: "File ID is required" } };
    }

    // TODO: Replace with actual Microsoft Graph API calls to delete the file
    const fileIndex = fileAttachments.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      return { status: 404, jsonBody: { error: "File attachment not found" } };
    }

    fileAttachments.splice(fileIndex, 1);
    return { status: 204 };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 