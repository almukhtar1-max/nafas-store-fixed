const { json, getStoreByOwnerEmail, upsertStore } = require("../_lib/database");

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const ownerEmail = String(req.query?.ownerEmail || "").trim().toLowerCase();
      if (!ownerEmail) {
        return json(res, 400, { message: "أدخل البريد المرتبط بالمتجر." });
      }

      const store = await getStoreByOwnerEmail(ownerEmail);
      return json(res, 200, { store });
    }

    if (req.method === "POST") {
      const body = parseBody(req.body);
      const ownerEmail = String(body.ownerEmail || "").trim().toLowerCase();
      const ownerUsername = String(body.ownerUsername || "").trim();
      const storeName = String(body.storeName || "").trim();
      const phone = String(body.phone || "").trim();
      const description = String(body.description || "").trim();

      if (!ownerEmail || !ownerUsername || !storeName || !phone || !description) {
        return json(res, 400, { message: "أكمل جميع بيانات المتجر أولًا." });
      }

      const store = await upsertStore({ ownerEmail, ownerUsername, storeName, phone, description });
      return json(res, 200, { message: "تم حفظ بيانات المتجر بنجاح.", store });
    }

    return json(res, 405, { message: "Method not allowed." });
  } catch (error) {
    console.error("api/data/store error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر حفظ بيانات المتجر حاليًا." });
  }
};
