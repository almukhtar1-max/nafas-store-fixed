const { json, addReview } = require("../_lib/database");

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
    const review = body.review || {};

    if (!review.productId || !review.username || !review.rating || !review.comment) {
      return json(res, 400, { message: "أكمل التقييم والتعليق قبل الحفظ." });
    }

    const normalizedReview = {
      productId: String(review.productId).trim(),
      username: String(review.username).trim(),
      rating: Number(review.rating),
      comment: String(review.comment).trim()
    };

    const reviews = await addReview(normalizedReview);
    return json(res, 200, { message: "تم إرسال تقييمك بنجاح.", reviews });
  } catch (error) {
    console.error("api/data/review error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر حفظ التقييم حاليًا." });
  }
};
