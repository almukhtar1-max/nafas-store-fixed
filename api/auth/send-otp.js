const crypto = require("crypto");
const nodemailer = require("nodemailer");

const OTP_TTL_MS = 10 * 60 * 1000;

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

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
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const signPayload = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.OTP_SECRET || "nafas-otp-secret")
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
};

const readEnv = (name) => String(process.env[name] || "").trim();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "Method not allowed." });
  }

  const body = parseBody(req.body);
  const email = normalizeEmail(body.email);
  const username = (body.username || "").trim();
  const password = (body.password || "").trim();

  if (!email || !username || !password) {
    return json(res, 400, { message: "أكمل البريد واسم المستخدم والرمز أولًا." });
  }

  const smtpEmail = readEnv("SMTP_EMAIL");
  const smtpPassword = readEnv("SMTP_PASSWORD");
  const missingVars = ["SMTP_EMAIL", "SMTP_PASSWORD", "OTP_SECRET"].filter((name) => !readEnv(name));

  if (missingVars.length) {
    return json(res, 500, {
      message: `إعدادات Vercel الناقصة: ${missingVars.join(" , ")}`
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword
    }
  });

  const otp = generateOtp();
  const registerToken = signPayload({
    email,
    username,
    password,
    otp,
    expiresAt: Date.now() + OTP_TTL_MS
  });

  try {
    await transporter.sendMail({
      from: `"متجر نفس" <${smtpEmail}>`,
      to: email,
      subject: "رمز التحقق لتسجيل حسابك في متجر نفس",
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2 style="color:#d93b2f;">متجر نفس</h2>
          <p>رمز التحقق الخاص بك هو:</p>
          <p style="font-size:28px; font-weight:700; color:#ff8b44; letter-spacing:4px;">${otp}</p>
          <p>هذا الرمز صالح لمدة 10 دقائق.</p>
        </div>
      `
    });

    return json(res, 200, {
      message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
      registerToken
    });
  } catch {
    return json(res, 500, { message: "تعذر إرسال الرمز حاليًا. تحقق من إعدادات البريد." });
  }
};
