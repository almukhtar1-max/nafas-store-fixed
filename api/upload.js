const { put } = require("@vercel/blob");
const { json } = require("./_lib/database");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  try {
    const filename = req.query.filename;
    if (!filename) {
      return json(res, 400, { message: "Missing filename parameter." });
    }

    // Vercel Blob requires BLOB_READ_WRITE_TOKEN environment variable
    const blob = await put(filename, req, {
      access: "public",
    });

    return json(res, 200, blob);
  } catch (error) {
    console.error("Upload error:", error);
    return json(res, 500, { message: "تعذر رفع الصورة حاليًا.", error: error.message });
  }
};
