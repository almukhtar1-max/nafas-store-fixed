const { json, ensureDatabase, getStorefrontData, getUsersData } = require("../_lib/database");

const readDatabaseUrl = () =>
  String(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      ""
  ).trim();

const toMessage = (error) => {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || "Unknown error";
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { message: "Method not allowed." });
  }

  const result = {
    databaseUrlPresent: Boolean(readDatabaseUrl()),
    databaseConnection: { ok: false, message: "" },
    storefrontRead: { ok: false, message: "" },
    usersRead: { ok: false, message: "" }
  };

  try {
    await ensureDatabase();
    result.databaseConnection = { ok: true, message: "Database connection is working." };
  } catch (error) {
    result.databaseConnection = { ok: false, message: toMessage(error) };
  }

  try {
    const data = await getStorefrontData();
    result.storefrontRead = {
      ok: true,
      storesCount: Array.isArray(data.stores) ? data.stores.length : 0,
      productsCount: Array.isArray(data.products) ? data.products.length : 0,
      reviewsCount: Array.isArray(data.reviews) ? data.reviews.length : 0
    };
  } catch (error) {
    result.storefrontRead = { ok: false, message: toMessage(error) };
  }

  try {
    const data = await getUsersData();
    result.usersRead = {
      ok: true,
      usersCount: Array.isArray(data.users) ? data.users.length : 0
    };
  } catch (error) {
    result.usersRead = { ok: false, message: toMessage(error) };
  }

  return json(res, 200, result);
};
