import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export default async function hello(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Hello function processed a request.');

  return {
    status: 200,
    jsonBody: {
      message: "Hello from Azure Static Web App Function",
      timestamp: new Date().toISOString(),
      functionName: "hello"
    }
  };
} 