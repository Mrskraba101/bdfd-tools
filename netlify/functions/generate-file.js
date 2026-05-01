exports.handler = async (event) => {
  const { type, content } = event.queryStringParameters || {};

  if (!type || !content) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing parameters." }),
    };
  }

  // Map types to Mime-Types
  const mimeTypes = {
    txt: "text/plain",
    json: "application/json",
    html: "text/html",
    md: "text/markdown",
    csv: "text/csv"
  };

  const contentType = mimeTypes[type.toLowerCase()] || "text/plain";
  let finalBody = content;

  // Process JSON specifically to ensure it's pretty
  if (type.toLowerCase() === 'json') {
    try {
      finalBody = JSON.stringify(JSON.parse(content), null, 2);
    } catch (e) {
      // If it's not valid JSON, we just return the raw string
      finalBody = content;
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="bdfd_export.${type.toLowerCase()}"`,
      // Prevents browsers from trying to "sniff" the file type and changing it
      "X-Content-Type-Options": "nosniff"
    },
    body: finalBody,
  };
};
