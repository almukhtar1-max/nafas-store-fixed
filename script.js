const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const accountTrigger = $(".account-trigger");
const dropdownPanel = $(".dropdown-panel");
const accountLabel = $(".account-label");
const statNumbers = $$(".stat-number");

const storeSearch = $("#storeSearch");
const productResultsGrid = $("#productResultsGrid");
const catalogCategories = $("#catalogCategories");
const emptyState = $("#emptyState");

const authForm = $("#authForm");
const authTabs = $$(".auth-tab");
const authSwitchText = $("#authSwitchText");
const authTitle = $("#loginTitle");
const authSubtitle = $("#authSubtitle");
const authMessage = $("#authMessage");
const submitAuthBtn = $("#submitAuthBtn");
const usernameField = $("#usernameField");
const usernameInput = $("#username");
const otpField = $("#otpField");
const otpInput = $("#otp");
const guestBtn = $("#guestBtn");

const merchantMessage = $("#merchantMessage");
const merchantGreeting = $("#merchantGreeting");
const merchantStoreForm = $("#merchantStoreForm");
const merchantStoreSummary = $("#merchantStoreSummary");
const summaryStoreName = $("#summaryStoreName");
const summaryStorePhone = $("#summaryStorePhone");
const summaryStoreDescription = $("#summaryStoreDescription");
const editStoreBtn = $("#editStoreBtn");
const showProductFormBtn = $("#showProductFormBtn");
const merchantProductEditor = $("#merchantProductEditor");
const merchantProductForm = $("#merchantProductForm");
const productEditorTitle = $("#productEditorTitle");
const productIdInput = $("#productId");
const productGovernorate = $("#productGovernorate");
const productWilaya = $("#productWilaya");
const productMainImage = $("#productMainImage");
const productGalleryImages = $("#productGalleryImages");
const productImagePreview = $("#productImagePreview");
const cancelProductEditBtn = $("#cancelProductEditBtn");
const merchantProductsListSection = $("#merchantProductsListSection");
const merchantProductsGrid = $("#merchantProductsGrid");

const productDetailShell = $("#productDetailShell");
const productDetailGalleryMain = $("#productDetailGalleryMain");
const productDetailThumbs = $("#productDetailThumbs");
const productDetailName = $("#productDetailName");
const productDetailDescription = $("#productDetailDescription");
const productDetailPrice = $("#productDetailPrice");
const productWhatsappLink = $("#productWhatsappLink");
const productStoreName = $("#productStoreName");
const productRatingSummary = $("#productRatingSummary");
const productReviewsList = $("#productReviewsList");
const reviewForm = $("#reviewForm");
const reviewRating = $("#reviewRating");
const reviewComment = $("#reviewComment");
const reviewEmpty = $("#reviewEmpty");

const STORAGE_KEYS = {
  user: "nafasUser",
  registerToken: "nafasRegisterToken",
  legacyUsers: "nafasUsers"
};

const OMAN_LOCATIONS = {
  "مسقط": ["مسقط", "مطرح", "السيب", "بوشر", "العامرات"],
  "ظفار": ["صلالة", "طاقة", "مرباط", "سدح", "ثمريت"],
  "شمال الباطنة": ["صحار", "شناص", "لوى", "صحم", "الخابورة"],
  "جنوب الباطنة": ["الرستاق", "بركاء", "المصنعة", "العوابي", "نخل"],
  "الداخلية": ["نزوى", "بهلاء", "الحمراء", "أدم", "منح"],
  "شمال الشرقية": ["إبراء", "المضيبي", "بدية", "القابل", "وادي بني خالد"],
  "جنوب الشرقية": ["صور", "جعلان بني بوعلي", "جعلان بني بوحسن", "الكامل والوافي", "مصيرة"],
  "الظاهرة": ["عبري", "ينقل", "ضنك"],
  "البريمي": ["البريمي", "محضة", "السنينة"],
  "الوسطى": ["هيما", "الدقم", "الجازر", "محوت"],
  "مسندم": ["خصب", "دبا", "بخاء", "مدحاء"]
};

const sharedState = {
  stores: [],
  products: [],
  reviews: []
};

let sharedDataPromise = null;
const currentUser = readCurrentUser();

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null");
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.user);
}

function setRegisterToken(token) {
  localStorage.setItem(STORAGE_KEYS.registerToken, token);
}

function readRegisterToken() {
  return localStorage.getItem(STORAGE_KEYS.registerToken) || "";
}

function clearRegisterToken() {
  localStorage.removeItem(STORAGE_KEYS.registerToken);
}

function readLegacyUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyUsers) || "[]");
  } catch {
    return [];
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeArabic(value = "") {
  return value.toLowerCase().trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "تعذر الوصول إلى خدمة الموقع.");
  }

  if (!isJson) {
    throw new Error("الخادم أعاد استجابة غير متوقعة.");
  }

  return data;
}

async function loadSharedData(force = false) {
  if (sharedDataPromise && !force) {
    return sharedDataPromise;
  }

  sharedDataPromise = requestJson("/api/data/storefront")
    .then((data) => {
      sharedState.stores = Array.isArray(data.stores) ? data.stores : [];
      sharedState.products = Array.isArray(data.products) ? data.products : [];
      sharedState.reviews = Array.isArray(data.reviews) ? data.reviews : [];
      return sharedState;
    })
    .catch((error) => {
      if (force) {
        sharedDataPromise = null;
      }
      throw error;
    });

  return sharedDataPromise;
}

function getStoreByOwner(ownerEmail) {
  return sharedState.stores.find((item) => item.ownerEmail === ownerEmail) || null;
}

function getProductsByOwner(ownerEmail) {
  return sharedState.products.filter((item) => item.ownerEmail === ownerEmail);
}

function showAuthMessage(message) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.hidden = !message;
}

function showMerchantMessage(message) {
  if (!merchantMessage) return;
  merchantMessage.textContent = message;
  merchantMessage.hidden = !message;
}

function formatPrice(value) {
  return `${Number(value).toFixed(3)} ر.ع`;
}

if (accountLabel) {
  accountLabel.textContent = currentUser?.username ? `مرحبًا يا ${currentUser.username}` : "تسجيل الدخول";
}

const logoutLink = dropdownPanel?.querySelector("a:last-child");
if (logoutLink) {
  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    clearCurrentUser();
    window.location.href = "index.html";
  });
}

if (accountTrigger && dropdownPanel) {
  accountTrigger.addEventListener("click", () => {
    if (!readCurrentUser()) {
      window.location.href = "login.html";
      return;
    }
    const isOpen = dropdownPanel.classList.toggle("open");
    accountTrigger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-menu")) {
      dropdownPanel.classList.remove("open");
      accountTrigger.setAttribute("aria-expanded", "false");
    }
  });
}

if (authForm) {
  let authMode = "login";
  let otpRequested = false;

  const setAuthMode = (mode) => {
    authMode = mode;
    otpRequested = false;
    clearRegisterToken();
    authTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authMode === mode));
    const isRegister = mode === "register";
    if (authTitle) authTitle.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
    if (authSubtitle) authSubtitle.textContent = isRegister
      ? "أنشئ حسابك ثم أرسل رمز تحقق إلى بريدك الإلكتروني لإكمال التسجيل"
      : "أدخل بريدك الإلكتروني والرمز للانتقال مباشرة إلى المتجر";
    if (submitAuthBtn) submitAuthBtn.textContent = isRegister ? "إرسال رمز التحقق" : "تسجيل الدخول";
    if (authSwitchText) {
      authSwitchText.innerHTML = isRegister
        ? 'لديك حساب بالفعل؟ <a href="#" id="authSwitchLink">سجل الدخول</a>'
        : 'ليس لديك حساب؟ <a href="#" id="authSwitchLink">سجل الآن</a>';
      attachSwitchHandler();
    }
    if (usernameField) usernameField.hidden = !isRegister;
    if (usernameInput) usernameInput.required = isRegister;
    if (otpField) otpField.hidden = true;
    if (otpInput) {
      otpInput.required = false;
      otpInput.value = "";
    }
    showAuthMessage("");
  };

  const attachSwitchHandler = () => {
    const switchLink = document.querySelector("#authSwitchLink");
    if (switchLink) {
      switchLink.onclick = (event) => {
        event.preventDefault();
        setAuthMode(authMode === "login" ? "register" : "login");
      };
    }
  };

  authTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      setAuthMode(tab.dataset.authMode);
    })
  );

  setAuthMode("login");

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = authForm.email.value.trim().toLowerCase();
    const password = authForm.password.value.trim();
    const username = usernameInput.value.trim();
    const otp = otpInput.value.trim();

    if (authMode === "register") {
      if (!otpRequested) {
        if (!email || !password || !username) {
          showAuthMessage("أكمل البريد واسم المستخدم والرمز أولًا.");
          return;
        }

        try {
          const data = await requestJson("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password })
          });
          otpRequested = true;
          otpField.hidden = false;
          otpInput.required = true;
          setRegisterToken(data.registerToken);
          submitAuthBtn.textContent = "تأكيد وإنشاء الحساب";
          showAuthMessage(data.message);
        } catch (error) {
          showAuthMessage(error.message);
        }
        return;
      }

      if (!otp) {
        showAuthMessage("أدخل رمز التحقق الذي وصلك على البريد.");
        return;
      }

      try {
        const data = await requestJson("/api/auth/verify-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, registerToken: readRegisterToken() })
        });
        clearRegisterToken();
        setCurrentUser({ email: data.user.email, username: data.user.username });
        window.location.href = "stores.html";
      } catch (error) {
        showAuthMessage(error.message);
      }
      return;
    }

    try {
      const data = await requestJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      setCurrentUser(data.user);
      window.location.href = "stores.html";
    } catch (error) {
      const legacyUser = readLegacyUsers().find((item) => item.email === email && item.password === password);
      if (legacyUser) {
        setCurrentUser({ email: legacyUser.email, username: legacyUser.username });
        window.location.href = "stores.html";
        return;
      }
      showAuthMessage(error.message);
    }
  });

  guestBtn?.addEventListener("click", () => {
    window.location.href = "stores.html";
  });
}

if (statNumbers.length) {
  statNumbers.forEach((stat) => {
    const target = Number(stat.dataset.target || 0);
    stat.textContent = target.toLocaleString("ar-EG");
  });
}

function buildProductCard(product, editable = false) {
  const gallery = [product.mainImage, ...(product.gallery || [])].filter(Boolean);
  const sliderId = `gallery-${product.id}`;
  return `
    <article class="store-card">
      <div class="product-card-media ${gallery.length ? "" : "is-empty"}" data-slider="${sliderId}">
        ${
          gallery.length
            ? gallery
                .map(
                  (image, index) =>
                    `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" class="product-slide ${
                      index === 0 ? "is-active" : ""
                    }">`
                )
                .join("")
            : '<div class="product-placeholder">صورة المنتج</div>'
        }
        ${
          gallery.length > 1
            ? `<button class="product-slide-btn prev" type="button" data-direction="prev" data-slider-target="${sliderId}">&lt;</button>
               <button class="product-slide-btn next" type="button" data-direction="next" data-slider-target="${sliderId}">&gt;</button>`
            : ""
        }
      </div>
      <div class="product-card-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-meta">
          <span>${escapeHtml(product.storeName)}</span>
          <span>${escapeHtml(product.governorate)} - ${escapeHtml(product.wilaya)}</span>
          <span>${escapeHtml(product.category)}</span>
        </div>
        <strong class="product-price">${formatPrice(product.price)}</strong>
        <a class="product-detail-link" href="product.html?id=${encodeURIComponent(product.id)}">عرض المنتج</a>
        ${editable ? `<button class="secondary-btn product-edit-btn" type="button" data-edit-product="${escapeHtml(product.id)}">تعديل المنتج</button>` : ""}
      </div>
    </article>
  `;
}

function bindProductSliders(scope = document) {
  scope.querySelectorAll(".product-slide-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const box = scope.querySelector(`[data-slider="${button.dataset.sliderTarget}"]`);
      if (!box) return;
      const slides = [...box.querySelectorAll(".product-slide")];
      const activeIndex = slides.findIndex((item) => item.classList.contains("is-active"));
      const nextIndex =
        button.dataset.direction === "next"
          ? (activeIndex + 1) % slides.length
          : (activeIndex - 1 + slides.length) % slides.length;
      slides.forEach((slide, index) => slide.classList.toggle("is-active", index === nextIndex));
    });
  });
}

async function renderStoreCatalog() {
  if (!storeSearch || !productResultsGrid || !catalogCategories) return;

  try {
    await loadSharedData();
  } catch (error) {
    productResultsGrid.innerHTML = "";
    catalogCategories.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = error.message;
    return;
  }

  const products = sharedState.products;
  const query = normalizeArabic(storeSearch.value);
  const categories = ["فطور", "غداء", "عشاء", "حلويات"];

  if (query) {
    const matches = products.filter((product) =>
      normalizeArabic(
        [product.name, product.description, product.storeName, product.category, product.governorate, product.wilaya].join(" ")
      ).includes(query)
    );

    catalogCategories.hidden = true;
    catalogCategories.innerHTML = "";
    productResultsGrid.innerHTML = matches.map((product) => buildProductCard(product)).join("");
    emptyState.hidden = matches.length !== 0;
    emptyState.textContent = "لا توجد منتجات مطابقة لكلمة البحث الحالية.";
    bindProductSliders(productResultsGrid);
    return;
  }

  productResultsGrid.innerHTML = "";
  emptyState.hidden = true;
  catalogCategories.hidden = false;
  catalogCategories.innerHTML = categories
    .map((category) => {
      const items = shuffle(products.filter((product) => product.category === category));
      if (!items.length) return "";
      return `
        <section class="category-block">
          <div class="category-block-head"><h2>${category}</h2></div>
          <div class="category-product-row">${items.map((product) => buildProductCard(product)).join("")}</div>
        </section>
      `;
    })
    .join("");
  bindProductSliders(catalogCategories);
}

if (storeSearch && productResultsGrid && catalogCategories) {
  storeSearch.addEventListener("input", () => {
    renderStoreCatalog();
  });
  renderStoreCatalog();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function populateGovernorates() {
  if (!productGovernorate) return;
  productGovernorate.innerHTML =
    '<option value="">اختر المحافظة</option>' +
    Object.keys(OMAN_LOCATIONS)
      .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
      .join("");
  if (productWilaya) productWilaya.innerHTML = '<option value="">اختر الولاية</option>';
}

function populateWilayas(governorate, selected = "") {
  if (!productWilaya) return;
  productWilaya.innerHTML =
    '<option value="">اختر الولاية</option>' +
    (OMAN_LOCATIONS[governorate] || [])
      .map(
        (item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`
      )
      .join("");
}

function renderImagePreview(images) {
  if (!productImagePreview) return;
  productImagePreview.innerHTML = images
    .filter(Boolean)
    .map((image) => `<img src="${escapeHtml(image)}" alt="معاينة">`)
    .join("");
}

function resetProductForm() {
  if (!merchantProductForm) return;
  merchantProductForm.reset();
  if (productIdInput) productIdInput.value = "";
  merchantProductForm.dataset.existingMainImage = "";
  merchantProductForm.dataset.existingGallery = "[]";
  populateGovernorates();
  renderImagePreview([]);
  if (productEditorTitle) productEditorTitle.textContent = "إضافة منتج جديد";
}

function renderMerchantProducts() {
  if (!merchantProductsGrid || !merchantProductsListSection || !currentUser) return;
  const products = getProductsByOwner(currentUser.email);
  merchantProductsListSection.hidden = !products.length;
  merchantProductsGrid.innerHTML = products.map((product) => buildProductCard(product, true)).join("");
  bindProductSliders(merchantProductsGrid);

  merchantProductsGrid.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.id === button.dataset.editProduct);
      if (!product || !merchantProductForm) return;
      merchantProductEditor.hidden = false;
      productEditorTitle.textContent = "تعديل المنتج";
      productIdInput.value = product.id;
      merchantProductForm.productName.value = product.name;
      merchantProductForm.description.value = product.description;
      merchantProductForm.category.value = product.category;
      merchantProductForm.price.value = product.price;
      productGovernorate.value = product.governorate;
      populateWilayas(product.governorate, product.wilaya);
      merchantProductForm.dataset.existingMainImage = product.mainImage || "";
      merchantProductForm.dataset.existingGallery = JSON.stringify(product.gallery || []);
      renderImagePreview([product.mainImage, ...(product.gallery || [])]);
      merchantProductEditor.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderMerchantStore() {
  if (!merchantStoreForm || !currentUser) return;
  const store = getStoreByOwner(currentUser.email);
  merchantGreeting.textContent = store
    ? `مرحبًا يا ${currentUser.username}، هذه بيانات متجرك الحالية.`
    : `مرحبًا يا ${currentUser.username}، أدخل بيانات متجرك للبدء.`;

  if (!store) {
    merchantStoreForm.hidden = false;
    merchantStoreSummary.hidden = true;
    merchantProductsListSection.hidden = true;
    return;
  }

  merchantStoreForm.hidden = true;
  merchantStoreSummary.hidden = false;
  summaryStoreName.textContent = store.storeName;
  summaryStorePhone.textContent = `+968 ${store.phone}`;
  summaryStoreDescription.textContent = store.description;
  renderMerchantProducts();
}

async function uploadFile(file) {
  if (!file) return null;
  const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    body: file,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "فشل رفع الصورة.");
  }
  const blob = await response.json();
  return blob.url;
}

async function initMerchantPage() {
  if (!merchantStoreForm && !merchantProductForm) return;

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  populateGovernorates();

  try {
    await loadSharedData();
    renderMerchantStore();
  } catch (error) {
    showMerchantMessage(error.message);
  }

  merchantStoreForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const phone = merchantStoreForm.phone.value.trim();
    if (!/^\d{8}$/.test(phone)) {
      showMerchantMessage("اكتب رقم هاتف عماني صحيح من 8 أرقام بعد +968.");
      return;
    }

    try {
      await requestJson("/api/data/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: currentUser.email,
          ownerUsername: currentUser.username,
          storeName: merchantStoreForm.storeName.value.trim(),
          phone,
          description: merchantStoreForm.description.value.trim()
        })
      });
      await loadSharedData(true);
      showMerchantMessage("تم حفظ بيانات متجرك بنجاح.");
      renderMerchantStore();
    } catch (error) {
      showMerchantMessage(error.message);
    }
  });

  editStoreBtn?.addEventListener("click", () => {
    const store = getStoreByOwner(currentUser.email);
    if (!store) return;
    merchantStoreForm.hidden = false;
    merchantStoreSummary.hidden = true;
    merchantStoreForm.storeName.value = store.storeName;
    merchantStoreForm.phone.value = store.phone;
    merchantStoreForm.description.value = store.description;
  });

  showProductFormBtn?.addEventListener("click", () => {
    resetProductForm();
    merchantProductEditor.hidden = false;
  });

  productGovernorate?.addEventListener("change", () => populateWilayas(productGovernorate.value));

  productMainImage?.addEventListener("change", async () => {
    const main = await readFileAsDataUrl(productMainImage.files?.[0]);
    const gallery = await Promise.all([...(productGalleryImages.files || [])].map(readFileAsDataUrl));
    renderImagePreview([main || merchantProductForm.dataset.existingMainImage, ...gallery]);
  });

  productGalleryImages?.addEventListener("change", async () => {
    const main = await readFileAsDataUrl(productMainImage.files?.[0]);
    const gallery = await Promise.all([...(productGalleryImages.files || [])].map(readFileAsDataUrl));
    renderImagePreview([main || merchantProductForm.dataset.existingMainImage, ...gallery]);
  });

  cancelProductEditBtn?.addEventListener("click", () => {
    merchantProductEditor.hidden = true;
    resetProductForm();
  });

  merchantProductForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const store = getStoreByOwner(currentUser.email);
    if (!store) {
      showMerchantMessage("احفظ بيانات متجرك أولًا قبل إضافة المنتجات.");
      return;
    }

    showMerchantMessage("جاري حفظ المنتج ورفع الصور...");
    submitAuthBtn.disabled = true;

    try {
      const mainImage =
        (await uploadFile(productMainImage.files?.[0])) || merchantProductForm.dataset.existingMainImage || "";
      const galleryFiles = await Promise.all([...(productGalleryImages.files || [])].map(uploadFile));
      const gallery = galleryFiles.filter(Boolean).length 
        ? galleryFiles.filter(Boolean) 
        : JSON.parse(merchantProductForm.dataset.existingGallery || "[]");

      const product = {
      id: productIdInput.value || `product-${Date.now()}`,
      ownerEmail: currentUser.email,
      storeName: store.storeName,
      phone: `+968 ${store.phone}`,
      storeDescription: store.description,
      name: merchantProductForm.productName.value.trim(),
      description: merchantProductForm.description.value.trim(),
      category: merchantProductForm.category.value,
      governorate: merchantProductForm.governorate.value,
      wilaya: merchantProductForm.wilaya.value,
      price: merchantProductForm.price.value,
      mainImage,
      gallery
    };

    try {
      await requestJson("/api/data/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });
      await loadSharedData(true);
      showMerchantMessage("تم حفظ المنتج بنجاح.");
      merchantProductEditor.hidden = true;
      resetProductForm();
      renderMerchantProducts();
    } catch (error) {
      showMerchantMessage(error.message);
    } finally {
      submitAuthBtn.disabled = false;
    }
  });
}

function renderProductReviews(productId) {
  if (!productReviewsList || !reviewEmpty || !productRatingSummary) return;
  const reviews = sharedState.reviews.filter((item) => item.productId === productId);
  if (!reviews.length) {
    productRatingSummary.textContent = "لا يوجد تقييم بعد";
    productReviewsList.innerHTML = "";
    reviewEmpty.hidden = false;
    return;
  }

  const average = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
  productRatingSummary.textContent = `${average.toFixed(1)} من 5 (${reviews.length} تقييم)`;
  reviewEmpty.hidden = true;
  productReviewsList.innerHTML = reviews
    .map(
      (review) => `
        <article class="review-item">
          <strong>${escapeHtml(review.username)}</strong>
          <div class="rating-pill">${escapeHtml(String(review.rating))} / 5</div>
          <p>${escapeHtml(review.comment)}</p>
        </article>
      `
    )
    .join("");
}

async function initProductPage() {
  if (!productDetailShell) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  try {
    await loadSharedData();
  } catch (error) {
    productDetailShell.innerHTML = `<div class="product-detail-card"><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  const product = sharedState.products.find((item) => item.id === productId);

  if (!product) {
    productDetailShell.innerHTML = '<div class="product-detail-card"><p>المنتج غير موجود.</p></div>';
    return;
  }

  const images = [product.mainImage, ...(product.gallery || [])].filter(Boolean);
  productDetailName.textContent = product.name;
  productDetailDescription.textContent = product.description;
  productDetailPrice.textContent = formatPrice(product.price);
  productStoreName.textContent = product.storeName;
  productWhatsappLink.href = `https://wa.me/968${String(product.phone || "")
    .replace(/\D/g, "")
    .slice(-8)}?text=${encodeURIComponent(`مرحبًا، أريد طلب ${product.name}`)}`;
  productDetailGalleryMain.innerHTML = images.length
    ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}">`
    : '<div class="product-placeholder">صورة المنتج</div>';
  productDetailThumbs.innerHTML = images
    .map((image) => `<button type="button"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}"></button>`)
    .join("");

  productDetailThumbs.querySelectorAll("button").forEach((button, index) => {
    button.addEventListener("click", () => {
      productDetailGalleryMain.innerHTML = `<img src="${escapeHtml(images[index])}" alt="${escapeHtml(product.name)}">`;
    });
  });

  renderProductReviews(product.id);

  reviewForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reviewer = readCurrentUser();
    if (!reviewer) {
      alert("سجل الدخول أولًا حتى تتمكن من التقييم.");
      return;
    }

    try {
      await requestJson("/api/data/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: {
            productId: product.id,
            username: reviewer.username,
            rating: Number(reviewRating.value),
            comment: reviewComment.value.trim()
          }
        })
      });
      await loadSharedData(true);
      reviewForm.reset();
      renderProductReviews(product.id);
    } catch (error) {
      alert(error.message);
    }
  });
}

initMerchantPage();
initProductPage();
