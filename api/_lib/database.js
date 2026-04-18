const { Pool } = require("pg");

const DEFAULT_PRODUCTS = [
  {
    id: "default-1",
    ownerEmail: "seed1",
    storeName: "بيت المندي",
    phone: "+968 90000001",
    storeDescription: "أطباق مندي وبخاري بطبخ منزلي.",
    name: "مندي دجاج",
    description: "دجاج متبل على الأصول مع أرز مندي فاخر وسلطة جانبية.",
    category: "غداء",
    governorate: "مسقط",
    wilaya: "السيب",
    price: "3.800",
    mainImage: "",
    gallery: []
  },
  {
    id: "default-2",
    ownerEmail: "seed2",
    storeName: "سفرة الدار",
    phone: "+968 90000002",
    storeDescription: "وجبات شعبية منزلية يومية.",
    name: "كبسة لحم",
    description: "كبسة منزلية غنية بالنكهة مع لحم طري وتتبيلة عربية.",
    category: "غداء",
    governorate: "الداخلية",
    wilaya: "نزوى",
    price: "4.500",
    mainImage: "",
    gallery: []
  },
  {
    id: "default-3",
    ownerEmail: "seed3",
    storeName: "مذاق الشام",
    phone: "+968 90000003",
    storeDescription: "فطائر وشاورما بوصفات شامية.",
    name: "شاورما عربي",
    description: "شاورما دجاج ملفوفة مع بطاطس وصوص الثوم.",
    category: "عشاء",
    governorate: "مسقط",
    wilaya: "بوشر",
    price: "2.200",
    mainImage: "",
    gallery: []
  },
  {
    id: "default-4",
    ownerEmail: "seed4",
    storeName: "ركن الحلويات",
    phone: "+968 90000004",
    storeDescription: "حلويات بيتية يومية.",
    name: "كيك تمر منزلي",
    description: "كيك طري بالتمر وصوص خفيف مناسب للضيافة.",
    category: "حلويات",
    governorate: "شمال الباطنة",
    wilaya: "صحار",
    price: "2.900",
    mainImage: "",
    gallery: []
  },
  {
    id: "default-5",
    ownerEmail: "seed5",
    storeName: "فطور الضيعة",
    phone: "+968 90000005",
    storeDescription: "فطور منزلي متنوع.",
    name: "فطائر جبن وزعتر",
    description: "تشكيلة فطائر شامية خفيفة مناسبة للفطور والعشاء.",
    category: "فطور",
    governorate: "جنوب الباطنة",
    wilaya: "بركاء",
    price: "1.800",
    mainImage: "",
    gallery: []
  }
];

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const readDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              process.env.POSTGRES_PRISMA_URL || 
              "";
  return String(url).trim();
};

const ensureDatabaseUrl = () => {
  const connectionString = readDatabaseUrl();
  if (!connectionString || connectionString === "base") {
    const error = new Error("DATABASE_URL is missing or invalid.");
    error.code = "missing_database_url";
    throw error;
  }
  return connectionString;
};

let pool;
let initPromise;

const getPool = () => {
  if (!pool) {
    const connectionString = ensureDatabaseUrl();
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
};

const normalizeGallery = (gallery) => {
  if (Array.isArray(gallery)) return gallery;
  if (!gallery) return [];
  try {
    const parsed = typeof gallery === "string" ? JSON.parse(gallery) : gallery;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapProductRow = (row) => ({
  id: row.id,
  ownerEmail: row.owner_email,
  storeName: row.store_name,
  phone: row.phone,
  storeDescription: row.store_description,
  name: row.name,
  description: row.description,
  category: row.category,
  governorate: row.governorate,
  wilaya: row.wilaya,
  price: Number(row.price).toFixed(3),
  mainImage: row.main_image || "",
  gallery: normalizeGallery(row.gallery)
});

const mapStoreRow = (row) => ({
  ownerEmail: row.owner_email,
  ownerUsername: row.owner_username,
  storeName: row.store_name,
  phone: row.phone,
  description: row.description
});

const mapReviewRow = (row) => ({
  productId: row.product_id,
  username: row.username,
  rating: Number(row.rating),
  comment: row.comment
});

const seedDefaultProducts = async (client) => {
  const existing = await client.query("SELECT COUNT(*)::int AS count FROM products");
  if (existing.rows[0].count > 0) return;

  for (const product of DEFAULT_PRODUCTS) {
    await client.query(
      `
        INSERT INTO products (
          id, owner_email, store_name, phone, store_description, name, description,
          category, governorate, wilaya, price, main_image, gallery
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13::jsonb
        )
      `,
      [
        product.id,
        product.ownerEmail,
        product.storeName,
        product.phone,
        product.storeDescription,
        product.name,
        product.description,
        product.category,
        product.governorate,
        product.wilaya,
        product.price,
        product.mainImage,
        JSON.stringify(product.gallery || [])
      ]
    );
  }
};

const ensureDatabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      const poolInstance = getPool();
      const client = await poolInstance.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS app_users (
            email TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS stores (
            owner_email TEXT PRIMARY KEY,
            owner_username TEXT NOT NULL,
            store_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            description TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            owner_email TEXT NOT NULL,
            store_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            store_description TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            governorate TEXT NOT NULL,
            wilaya TEXT NOT NULL,
            price NUMERIC(10,3) NOT NULL,
            main_image TEXT NOT NULL DEFAULT '',
            gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id BIGSERIAL PRIMARY KEY,
            product_id TEXT NOT NULL,
            username TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query("CREATE INDEX IF NOT EXISTS idx_products_owner_email ON products(owner_email);");
        await client.query("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);");
        await client.query("CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);");

        await seedDefaultProducts(client);
      } finally {
        client.release();
      }
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
};

const getStorefrontData = async () => {
  await ensureDatabase();
  const poolInstance = getPool();

  const [storesResult, productsResult, reviewsResult] = await Promise.all([
    poolInstance.query(
      "SELECT owner_email, owner_username, store_name, phone, description FROM stores ORDER BY updated_at DESC"
    ),
    poolInstance.query(
      `
        SELECT id, owner_email, store_name, phone, store_description, name, description,
               category, governorate, wilaya, price, main_image, gallery
        FROM products
        ORDER BY updated_at DESC, id ASC
      `
    ),
    poolInstance.query(
      "SELECT product_id, username, rating, comment FROM reviews ORDER BY created_at DESC, id DESC"
    )
  ]);

  return {
    stores: storesResult.rows.map(mapStoreRow),
    products: productsResult.rows.map(mapProductRow),
    reviews: reviewsResult.rows.map(mapReviewRow)
  };
};

const getStoreByOwnerEmail = async (ownerEmail) => {
  await ensureDatabase();
  const poolInstance = getPool();
  const result = await poolInstance.query(
    "SELECT owner_email, owner_username, store_name, phone, description FROM stores WHERE owner_email = $1 LIMIT 1",
    [ownerEmail]
  );
  return result.rows[0] ? mapStoreRow(result.rows[0]) : null;
};

const upsertStore = async ({ ownerEmail, ownerUsername, storeName, phone, description }) => {
  await ensureDatabase();
  const poolInstance = getPool();
  const client = await poolInstance.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO stores (owner_email, owner_username, store_name, phone, description, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (owner_email)
        DO UPDATE SET
          owner_username = EXCLUDED.owner_username,
          store_name = EXCLUDED.store_name,
          phone = EXCLUDED.phone,
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
      [ownerEmail, ownerUsername, storeName, phone, description]
    );

    await client.query(
      `
        UPDATE products
        SET store_name = $2,
            phone = $3,
            store_description = $4,
            updated_at = NOW()
        WHERE owner_email = $1
      `,
      [ownerEmail, storeName, `+968 ${phone}`, description]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getStoreByOwnerEmail(ownerEmail);
};

const upsertProduct = async (product) => {
  await ensureDatabase();
  const poolInstance = getPool();

  await poolInstance.query(
    `
      INSERT INTO products (
        id, owner_email, store_name, phone, store_description, name, description,
        category, governorate, wilaya, price, main_image, gallery, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13::jsonb, NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        owner_email = EXCLUDED.owner_email,
        store_name = EXCLUDED.store_name,
        phone = EXCLUDED.phone,
        store_description = EXCLUDED.store_description,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        governorate = EXCLUDED.governorate,
        wilaya = EXCLUDED.wilaya,
        price = EXCLUDED.price,
        main_image = EXCLUDED.main_image,
        gallery = EXCLUDED.gallery,
        updated_at = NOW()
    `,
    [
      product.id,
      product.ownerEmail,
      product.storeName,
      product.phone,
      product.storeDescription,
      product.name,
      product.description,
      product.category,
      product.governorate,
      product.wilaya,
      product.price,
      product.mainImage || "",
      JSON.stringify(product.gallery || [])
    ]
  );

  const result = await poolInstance.query(
    `
      SELECT id, owner_email, store_name, phone, store_description, name, description,
             category, governorate, wilaya, price, main_image, gallery
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [product.id]
  );

  return result.rows[0] ? mapProductRow(result.rows[0]) : null;
};

const addReview = async ({ productId, username, rating, comment }) => {
  await ensureDatabase();
  const poolInstance = getPool();

  await poolInstance.query(
    `
      INSERT INTO reviews (product_id, username, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `,
    [productId, username, rating, comment]
  );

  const result = await poolInstance.query(
    "SELECT product_id, username, rating, comment FROM reviews WHERE product_id = $1 ORDER BY created_at DESC, id DESC",
    [productId]
  );

  return result.rows.map(mapReviewRow);
};

const getUsersData = async () => {
  await ensureDatabase();
  const poolInstance = getPool();
  const result = await poolInstance.query(
    "SELECT email, username, password FROM app_users ORDER BY created_at DESC"
  );
  return {
    users: result.rows.map((row) => ({
      email: row.email,
      username: row.username,
      password: row.password
    }))
  };
};

const findUserByEmail = async (email) => {
  await ensureDatabase();
  const poolInstance = getPool();
  const result = await poolInstance.query(
    "SELECT email, username, password FROM app_users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0]
    ? {
        email: result.rows[0].email,
        username: result.rows[0].username,
        password: result.rows[0].password
      }
    : null;
};

const findUserByCredentials = async (email, password) => {
  await ensureDatabase();
  const poolInstance = getPool();
  const result = await poolInstance.query(
    "SELECT email, username FROM app_users WHERE email = $1 AND password = $2 LIMIT 1",
    [email, password]
  );
  return result.rows[0]
    ? {
        email: result.rows[0].email,
        username: result.rows[0].username
      }
    : null;
};

const createUser = async ({ email, username, password }) => {
  await ensureDatabase();
  const poolInstance = getPool();
  await poolInstance.query(
    `
      INSERT INTO app_users (email, username, password, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (email) DO NOTHING
    `,
    [email, username, password]
  );
  return { email, username, password };
};

module.exports = {
  DEFAULT_PRODUCTS,
  json,
  ensureDatabase,
  getStorefrontData,
  getStoreByOwnerEmail,
  upsertStore,
  upsertProduct,
  addReview,
  getUsersData,
  findUserByEmail,
  findUserByCredentials,
  createUser
};
