const { json, upsertProduct } = require("../_lib/database");

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
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  try {
    const body = parseBody(req.body);
    const product = body.product || {};

    if (
      !product.id ||
      !product.ownerEmail ||
      !product.name ||
      !product.description ||
      !product.category ||
      !product.governorate ||
      !product.wilaya ||
      !product.price
    ) {
      return json(res, 400, { message: "أكمل بيانات المنتج قبل الحفظ." });
    }

    const savedProduct = await upsertProduct({
      ...product,
      gallery: Array.isArray(product.gallery) ? product.gallery : []
    });

    return json(res, 200, { message: "تم حفظ المنتج بنجاح.", product: savedProduct });
  } catch (error) {
    console.error("api/data/product error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر حفظ المنتج حاليًا." });
  }
};
