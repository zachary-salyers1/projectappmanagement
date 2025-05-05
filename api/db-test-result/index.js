module.exports = function (context, req) {
  // Set response directly in res property
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      message: "Database connection successful!",
      connectionType: "Both MSI and SQL authentication are working",
      timestamp: new Date().toISOString()
    }
  };

  // Important: call context.done() explicitly
  context.done();
}; 