module.exports = async function (context, req) {
  try {
    // Simple function with minimal dependencies
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Hello from Azure Static Web App Function",
        timestamp: new Date().toISOString(),
        requestUrl: req.url,
        method: req.method
      })
    };
  } catch (error) {
    // Comprehensive error handling
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
} 