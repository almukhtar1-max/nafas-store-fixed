const { json, getStorefrontData } = require("../_lib/database");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { message: "Method not allowed." });
  }

  try {
    const data = await getStorefrontData();
    return json(res, 200, {
      stores: data.stores,
      products: data.products,
      reviews: data.reviews
    });
  } catch (error) {
    console.error("api/data/storefront error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر تحميل بيانات المتجر حاليًا." });
  }
};
