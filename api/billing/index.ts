import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// Mock data for development
const billingServices = [
  {
    id: "1",
    projectId: "1",
    name: "Web Hosting",
    amount: 19.99,
    dueDate: "2025-06-01",
    paid: false,
    attachments: []
  },
  {
    id: "2",
    projectId: "1",
    name: "Design Services",
    amount: 250.00,
    dueDate: "2025-05-15",
    paid: true,
    attachments: []
  },
  {
    id: "3",
    projectId: "2",
    name: "Database Hosting",
    amount: 49.99,
    dueDate: "2025-05-25",
    paid: false,
    attachments: []
  }
];

export default async function billingApi(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      const billing = billingServices.find(b => b.id === id);
      if (billing) {
        return { status: 200, jsonBody: billing };
      } else {
        return { status: 404, jsonBody: { error: "Billing service not found" } };
      }
    } else if (projectId) {
      const filteredBilling = billingServices.filter(b => b.projectId === projectId);
      return { status: 200, jsonBody: filteredBilling };
    } else {
      return { status: 200, jsonBody: billingServices };
    }
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePost(data: any): Promise<HttpResponseInit> {
  try {
    // TODO: Replace with actual database insert using SQL client
    const newBilling = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: data.projectId,
      name: data.name,
      amount: data.amount,
      dueDate: data.dueDate || null,
      paid: data.paid || false,
      attachments: []
    };
    billingServices.push(newBilling);
    return { status: 201, jsonBody: newBilling };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handlePatch(id: string, data: any): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Billing service ID is required" } };
    }

    // TODO: Replace with actual database update using SQL client
    const billingIndex = billingServices.findIndex(b => b.id === id);
    if (billingIndex === -1) {
      return { status: 404, jsonBody: { error: "Billing service not found" } };
    }

    const updatedBilling = {
      ...billingServices[billingIndex],
      ...data,
      id, // Ensure ID doesn't change
      projectId: data.projectId || billingServices[billingIndex].projectId // Ensure projectId doesn't get lost
    };
    billingServices[billingIndex] = updatedBilling;
    
    return { status: 200, jsonBody: updatedBilling };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
}

async function handleDelete(id?: string): Promise<HttpResponseInit> {
  try {
    if (!id) {
      return { status: 400, jsonBody: { error: "Billing service ID is required" } };
    }

    // TODO: Replace with actual database delete using SQL client
    const billingIndex = billingServices.findIndex(b => b.id === id);
    if (billingIndex === -1) {
      return { status: 404, jsonBody: { error: "Billing service not found" } };
    }

    billingServices.splice(billingIndex, 1);
    return { status: 204 };
  } catch (error) {
    return { status: 500, jsonBody: { error: error.message } };
  }
} 