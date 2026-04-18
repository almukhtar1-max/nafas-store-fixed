const crypto = require("crypto");
const { json, findUserByEmail, createUser } = require("../_lib/database");

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const verifyToken = (token) => {
  const [body, signature] = String(token || "").split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", process.env.OTP_SECRET || "nafas-otp-secret")
    .update(body)
    .digest("base64url");

  if (signature !== expected) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  try {
    const body = parseBody(req.body);
    const email = normalizeEmail(body.email);
    const otp = (body.otp || "").trim();
    const registerToken = body.registerToken || "";
    const payload = verifyToken(registerToken);

    if (!payload) {
      return json(res, 400, { message: "تعذر التحقق من طلب التسجيل. أعد طلب رمز جديد." });
    }

    if (payload.expiresAt < Date.now()) {
      return json(res, 400, { message: "انتهت صلاحية رمز التحقق. أعد طلب رمز جديد." });
    }

    if (normalizeEmail(payload.email) !== email) {
      return json(res, 400, { message: "البريد الإلكتروني لا يطابق طلب التحقق." });
    }

    if (payload.otp !== otp) {
      return json(res, 400, { message: "رمز التحقق غير صحيح." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return json(res, 400, { message: "هذا البريد مسجل مسبقًا، جرّب تسجيل الدخول." });
    }

    const nextUser = {
      email: payload.email,
      username: payload.username,
      password: payload.password
    };

    await createUser(nextUser);

    return json(res, 200, {
      message: "تم إنشاء الحساب بنجاح.",
      user: nextUser
    });
  } catch (error) {
    console.error("api/auth/verify-register error:", error);
    if (error.code === "missing_database_url") {
      return json(res, 500, { message: "إعدادات قاعدة البيانات غير مكتملة على Vercel." });
    }
    return json(res, 500, { message: "تعذر إكمال التسجيل حاليًا." });
  }
};
