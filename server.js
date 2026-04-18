require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const USERS_FILE = path.join(__dirname, "users.json");
const pendingOtps = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ensureUsersFile = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
  }
};

const readUsers = () => {
  ensureUsersFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const normalizeEmail = (value = "") => value.trim().toLowerCase();
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

app.post("/api/auth/send-otp", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const username = (req.body.username || "").trim();
  const password = (req.body.password || "").trim();

  if (!email || !username || !password) {
    return res.status(400).json({ message: "أكمل البريد واسم المستخدم والرمز أولًا." });
  }

  const users = readUsers();
  const exists = users.find((user) => user.email === email);

  if (exists) {
    return res.status(409).json({ message: "هذا البريد مسجل مسبقًا، جرّب تسجيل الدخول." });
  }

  const otp = generateOtp();
  pendingOtps.set(email, {
    email,
    username,
    password,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  try {
    await transporter.sendMail({
      from: `"متجر نفس" <${process.env.SMTP_EMAIL}>`,
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

    return res.json({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني." });
  } catch (error) {
    return res.status(500).json({ message: "تعذر إرسال الرمز حاليًا. تحقق من إعدادات البريد." });
  }
});

app.post("/api/auth/verify-register", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = (req.body.otp || "").trim();
  const pending = pendingOtps.get(email);

  if (!pending) {
    return res.status(400).json({ message: "لا يوجد طلب تحقق لهذا البريد." });
  }

  if (pending.expiresAt < Date.now()) {
    pendingOtps.delete(email);
    return res.status(400).json({ message: "انتهت صلاحية رمز التحقق. أعد طلب رمز جديد." });
  }

  if (pending.otp !== otp) {
    return res.status(400).json({ message: "رمز التحقق غير صحيح." });
  }

  const users = readUsers();
  users.push({
    email: pending.email,
    username: pending.username,
    password: pending.password
  });
  saveUsers(users);
  pendingOtps.delete(email);

  return res.json({
    message: "تم إنشاء الحساب بنجاح.",
    user: {
      email: pending.email,
      username: pending.username
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = (req.body.password || "").trim();
  const users = readUsers();
  const user = users.find((item) => item.email === email && item.password === password);

  if (!user) {
    return res.status(401).json({ message: "البريد أو الرمز غير صحيح." });
  }

  return res.json({
    message: "تم تسجيل الدخول بنجاح.",
    user: {
      email: user.email,
      username: user.username
    }
  });
});

app.listen(PORT, () => {
  console.log(`Nafas server running on http://localhost:${PORT}`);
});
