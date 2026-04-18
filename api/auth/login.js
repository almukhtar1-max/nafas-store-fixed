const { json, findUserByCredentials } = require("../_lib/database");

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
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return json(res, 400, { message: "أدخل البريد والرمز أولًا." });
    }

    const user = await findUserByCredentials(email, password);

    if (!user) {
      return json(res, 401, { message: "البريد أو الرمز غير صحيح." });
    }

    return json(res, 200, {
      message: "تم تسجيل الدخول بنجاح.",
      user: {
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("api/auth/login error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر تسجيل الدخول حاليًا." });
  }
};
