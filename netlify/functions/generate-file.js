exports.handler = async (event, context) => {
  const { type, content } = event.queryStringParameters || {};

  // 1. Validation: Ensure parameters exist
  if (!type || !content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'type' or 'content' parameters." }),
    };
  }

  // 2. Define MIME types and processing logic
  const config = {
    txt: { mime: "text/plain", ext: "txt" },
    json: { mime: "application/json", ext: "json" },
    html: { mime: "text/html", ext: "html" },
    md: { mime: "text/markdown", ext: "md" },
    csv: { mime: "text/csv", ext: "csv" },
  };

  const target = config[type.toLowerCase()];

  if (!target) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unsupported type: ${type}` }),
    };
  }

  let finalContent = content;

  // 3. Format-specific processing
  try {
    if (type === "json") {
      try {
        const parsed = JSON.parse(content);
        finalContent = JSON.stringify(parsed, null, 2);
      } catch {
        finalContent = JSON.stringify({ data: content }, null, 2);
      }
    } else if (type === "html") {
      finalContent = `<!DOCTYPE html><html><body>${content}</body></html>`;
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Processing failed" }),
    };
  }

  // 4. Return the file with download headers
  return {
    statusCode: 200,
    headers: {
      "Content-Type": target.mime,
      "Content-Disposition": `attachment; filename="output.${target.ext}"`,
    },
    body: finalContent,
  };
};
