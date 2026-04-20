const POS_ROUTES = window.POS_ROUTES || {};
const INITIAL_BOOTSTRAP = window.POS_BOOTSTRAP || null;
const POS_BRAND = window.POS_BRAND || {};
const BRAND_LOGO = POS_BRAND.logo || "/pos/logolj2.png";
const BRAND_NAME = POS_BRAND.name || "TB. Losari Jaya 2";
const BRAND_TAGLINE = POS_BRAND.tagline || "Industrial Atelier POS";
const DEFAULT_CATEGORY_OPTIONS = [
  "Material Dasar",
  "Finishing & Cat",
  "Perkakas",
  "Plumbing & Pipa",
  "Struktur",
  "Aksesoris",
  "Listrik"
];
const DEFAULT_UNIT_OPTIONS = [
  "pcs",
  "kg",
  "gram",
  "sak",
  "box",
  "btg",
  "lembar",
  "kaleng",
  "meter",
  "liter",
  "roll"
];

let state;
let els;

document.addEventListener("DOMContentLoaded", () => {
  state = createEmptyState();
  cacheElements();
  populateYearOptions();
  bindEvents();
  setBootState(INITIAL_BOOTSTRAP, { preserveUi: false });
  syncAuthView();
  renderAll();
});

function createEmptyState() {
  return {
    inventory: [],
    categories: [],
    units: [],
    suppliers: [],
    goodsIn: [],
    sales: [],
    cart: [],
    lastReceipt: null,
    auth: {
      isLoggedIn: false,
      userName: ""
    },
    ui: {
      activeView: "dashboard",
      isSidebarOpen: false,
      searchQuery: "",
      inventoryMode: "catalog",
      inventoryCategory: "all",
      cashierCategory: "Semua",
      reportType: "sales",
      reportPeriod: "monthly",
      reportDate: formatDateInput(new Date()),
      reportMonth: formatMonthInput(new Date()),
      reportYear: String(new Date().getFullYear()),
      discount: 0,
      payment: 0
    }
  };
}

function setBootState(bootState, options = {}) {
  const preserveUi = options.preserveUi ?? true;
  const empty = createEmptyState();
  const next = {
    ...empty,
    inventory: Array.isArray(bootState?.inventory) ? bootState.inventory : empty.inventory,
    categories: Array.isArray(bootState?.categories) ? bootState.categories : empty.categories,
    units: Array.isArray(bootState?.units) ? bootState.units : empty.units,
    suppliers: Array.isArray(bootState?.suppliers) ? bootState.suppliers : empty.suppliers,
    goodsIn: Array.isArray(bootState?.goodsIn) ? bootState.goodsIn : empty.goodsIn,
    sales: Array.isArray(bootState?.sales) ? bootState.sales : empty.sales,
    cart: [],
    lastReceipt: bootState?.lastReceipt || (Array.isArray(bootState?.sales) ? bootState.sales[0] || null : null),
    auth: {
      ...empty.auth,
      ...(bootState?.auth || {})
    },
    ui: {
      ...empty.ui
    }
  };

  if (state && preserveUi) {
    next.ui = {
      ...next.ui,
      activeView: state.ui.activeView,
      isSidebarOpen: false,
      searchQuery: state.ui.searchQuery,
      inventoryMode: state.ui.inventoryMode,
      inventoryCategory: state.ui.inventoryCategory,
      cashierCategory: state.ui.cashierCategory,
      reportType: state.ui.reportType,
      reportPeriod: state.ui.reportPeriod,
      reportDate: state.ui.reportDate,
      reportMonth: state.ui.reportMonth,
      reportYear: state.ui.reportYear
    };
  }

  state = next;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin"
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Terjadi kesalahan saat memproses permintaan.";
    throw new Error(message);
  }

  return payload;
}

function cacheElements() {
  els = {
    toastContainer: document.getElementById("toastContainer"),
    loginView: document.getElementById("loginView"),
    appView: document.getElementById("appView"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    menuToggle: document.getElementById("menuToggle"),
    logoutBtn: document.getElementById("logoutBtn"),
    resetDemoBtn: document.getElementById("resetDemoBtn"),
    navItems: document.querySelectorAll("[data-nav]"),
    pages: document.querySelectorAll(".page"),
    headerEyebrow: document.getElementById("headerEyebrow"),
    headerTitle: document.getElementById("headerTitle"),
    headerSubtitle: document.getElementById("headerSubtitle"),
    headerDate: document.getElementById("headerDate"),
    globalSearch: document.getElementById("globalSearch"),
    dashboardExportBtn: document.getElementById("dashboardExportBtn"),
    restockShortcutBtn: document.getElementById("restockShortcutBtn"),
    metricTransactions: document.getElementById("metricTransactions"),
    metricTransactionsDelta: document.getElementById("metricTransactionsDelta"),
    metricRevenue: document.getElementById("metricRevenue"),
    metricRevenueDelta: document.getElementById("metricRevenueDelta"),
    metricSku: document.getElementById("metricSku"),
    metricSkuDetail: document.getElementById("metricSkuDetail"),
    metricLowStock: document.getElementById("metricLowStock"),
    metricLowStockDetail: document.getElementById("metricLowStockDetail"),
    salesTrendChart: document.getElementById("salesTrendChart"),
    lowStockList: document.getElementById("lowStockList"),
    recentSalesList: document.getElementById("recentSalesList"),
    goodsInSnapshot: document.getElementById("goodsInSnapshot"),
    openAddItemBtn: document.getElementById("openAddItemBtn"),
    openAddSupplierBtn: document.getElementById("openAddSupplierBtn"),
    inventoryModeButtons: document.querySelectorAll("[data-inventory-mode]"),
    inventoryCatalogPanel: document.getElementById("inventoryCatalogPanel"),
    inventoryIncomingPanel: document.getElementById("inventoryIncomingPanel"),
    inventorySuppliersPanel: document.getElementById("inventorySuppliersPanel"),
    inventoryMastersPanel: document.getElementById("inventoryMastersPanel"),
    inventorySearch: document.getElementById("inventorySearch"),
    inventoryCategoryFilter: document.getElementById("inventoryCategoryFilter"),
    inventoryTableBody: document.getElementById("inventoryTableBody"),
    supplierSummaryCount: document.getElementById("supplierSummaryCount"),
    supplierTableBody: document.getElementById("supplierTableBody"),
    categoryMasterCount: document.getElementById("categoryMasterCount"),
    categoryMasterForm: document.getElementById("categoryMasterForm"),
    categoryMasterName: document.getElementById("categoryMasterName"),
    categoryMasterList: document.getElementById("categoryMasterList"),
    unitMasterCount: document.getElementById("unitMasterCount"),
    unitMasterForm: document.getElementById("unitMasterForm"),
    unitMasterName: document.getElementById("unitMasterName"),
    unitMasterList: document.getElementById("unitMasterList"),
    incomingForm: document.getElementById("incomingForm"),
    incomingDate: document.getElementById("incomingDate"),
    incomingSupplier: document.getElementById("incomingSupplier"),
    incomingItem: document.getElementById("incomingItem"),
    incomingQuantity: document.getElementById("incomingQuantity"),
    incomingCost: document.getElementById("incomingCost"),
    incomingNote: document.getElementById("incomingNote"),
    incomingHistoryList: document.getElementById("incomingHistoryList"),
    cashierSearch: document.getElementById("cashierSearch"),
    cashierCategoryChips: document.getElementById("cashierCategoryChips"),
    productGrid: document.getElementById("productGrid"),
    cartOrderNumber: document.getElementById("cartOrderNumber"),
    clearCartBtn: document.getElementById("clearCartBtn"),
    cartList: document.getElementById("cartList"),
    cartSubtotal: document.getElementById("cartSubtotal"),
    discountInput: document.getElementById("discountInput"),
    cartTotal: document.getElementById("cartTotal"),
    exactCashBtn: document.getElementById("exactCashBtn"),
    paymentInput: document.getElementById("paymentInput"),
    cartChange: document.getElementById("cartChange"),
    printReceiptBtn: document.getElementById("printReceiptBtn"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    reportTypeButtons: document.querySelectorAll("[data-report-type]"),
    reportPeriod: document.getElementById("reportPeriod"),
    reportDateField: document.getElementById("reportDateField"),
    reportDateInput: document.getElementById("reportDateInput"),
    reportMonthField: document.getElementById("reportMonthField"),
    reportMonthInput: document.getElementById("reportMonthInput"),
    reportYearField: document.getElementById("reportYearField"),
    reportYearInput: document.getElementById("reportYearInput"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    printReportBtn: document.getElementById("printReportBtn"),
    reportPrimaryLabel: document.getElementById("reportPrimaryLabel"),
    reportPrimaryValue: document.getElementById("reportPrimaryValue"),
    reportPrimaryHint: document.getElementById("reportPrimaryHint"),
    reportSecondaryLabel: document.getElementById("reportSecondaryLabel"),
    reportSecondaryValue: document.getElementById("reportSecondaryValue"),
    reportSecondaryHint: document.getElementById("reportSecondaryHint"),
    reportTertiaryLabel: document.getElementById("reportTertiaryLabel"),
    reportTertiaryValue: document.getElementById("reportTertiaryValue"),
    reportTertiaryHint: document.getElementById("reportTertiaryHint"),
    reportTableTitle: document.getElementById("reportTableTitle"),
    reportTableHead: document.getElementById("reportTableHead"),
    reportTableBody: document.getElementById("reportTableBody"),
    itemModal: document.getElementById("itemModal"),
    itemModalBackdrop: document.getElementById("itemModalBackdrop"),
    closeItemModalBtn: document.getElementById("closeItemModalBtn"),
    cancelItemModalBtn: document.getElementById("cancelItemModalBtn"),
    itemModalTitle: document.getElementById("itemModalTitle"),
    itemForm: document.getElementById("itemForm"),
    itemId: document.getElementById("itemId"),
    itemSku: document.getElementById("itemSku"),
    itemName: document.getElementById("itemName"),
    itemCategory: document.getElementById("itemCategory"),
    itemUnit: document.getElementById("itemUnit"),
    itemSupplier: document.getElementById("itemSupplier"),
    itemStock: document.getElementById("itemStock"),
    itemMinStock: document.getElementById("itemMinStock"),
    itemPrice: document.getElementById("itemPrice"),
    itemDescription: document.getElementById("itemDescription"),
    supplierModal: document.getElementById("supplierModal"),
    supplierModalBackdrop: document.getElementById("supplierModalBackdrop"),
    closeSupplierModalBtn: document.getElementById("closeSupplierModalBtn"),
    cancelSupplierModalBtn: document.getElementById("cancelSupplierModalBtn"),
    supplierModalTitle: document.getElementById("supplierModalTitle"),
    supplierForm: document.getElementById("supplierForm"),
    supplierId: document.getElementById("supplierId"),
    supplierName: document.getElementById("supplierName")
  };
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.menuToggle.addEventListener("click", toggleSidebar);
  els.sidebarOverlay.addEventListener("click", closeSidebar);
  els.logoutBtn.addEventListener("click", logout);
  els.resetDemoBtn.addEventListener("click", resetDemo);

  els.navItems.forEach((item) => {
    item.addEventListener("click", () => showView(item.dataset.nav));
  });

  els.globalSearch.addEventListener("input", handleSearchChange);
  els.inventorySearch.addEventListener("input", handleSearchChange);
  els.cashierSearch.addEventListener("input", handleSearchChange);

  els.dashboardExportBtn.addEventListener("click", () => {
    showView("reports");
    renderAll();
    printCurrentReport();
  });

  els.restockShortcutBtn.addEventListener("click", () => {
    showView("inventory");
    setInventoryMode("incoming");
    renderAll();
  });

  els.openAddItemBtn.addEventListener("click", () => openItemModal());
  els.openAddSupplierBtn.addEventListener("click", () => openSupplierModal());

  els.inventoryModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setInventoryMode(button.dataset.inventoryMode);
      renderAll();
    });
  });

  els.inventoryCategoryFilter.addEventListener("change", (event) => {
    state.ui.inventoryCategory = event.target.value;
    renderAll();
  });

  els.inventoryTableBody.addEventListener("click", handleInventoryTableClick);
  els.supplierTableBody.addEventListener("click", handleSupplierTableClick);
  els.categoryMasterForm.addEventListener("submit", handleCategoryMasterSubmit);
  els.unitMasterForm.addEventListener("submit", handleUnitMasterSubmit);
  els.incomingForm.addEventListener("submit", handleIncomingSubmit);

  els.productGrid.addEventListener("click", handleProductGridClick);
  els.cashierCategoryChips.addEventListener("click", handleCashierCategoryClick);
  els.cartList.addEventListener("click", handleCartListClick);
  els.cartList.addEventListener("change", handleCartQuantityChange);
  els.clearCartBtn.addEventListener("click", clearCart);
  els.discountInput.addEventListener("input", handleDiscountInput);
  els.paymentInput.addEventListener("input", handlePaymentInput);
  els.exactCashBtn.addEventListener("click", setExactPayment);
  els.printReceiptBtn.addEventListener("click", printReceipt);
  els.checkoutBtn.addEventListener("click", checkoutCart);

  els.reportTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.reportType = button.dataset.reportType;
      renderAll();
    });
  });

  els.reportPeriod.addEventListener("change", (event) => {
    state.ui.reportPeriod = event.target.value;
    renderAll();
  });

  els.reportDateInput.addEventListener("change", (event) => {
    state.ui.reportDate = event.target.value;
    renderAll();
  });

  els.reportMonthInput.addEventListener("change", (event) => {
    state.ui.reportMonth = event.target.value;
    renderAll();
  });

  els.reportYearInput.addEventListener("change", (event) => {
    state.ui.reportYear = event.target.value;
    renderAll();
  });

  els.exportCsvBtn.addEventListener("click", exportCurrentReportCsv);
  els.printReportBtn.addEventListener("click", printCurrentReport);

  els.closeItemModalBtn.addEventListener("click", closeItemModal);
  els.cancelItemModalBtn.addEventListener("click", closeItemModal);
  els.itemModalBackdrop.addEventListener("click", closeItemModal);
  els.itemForm.addEventListener("submit", handleItemSubmit);
  els.closeSupplierModalBtn.addEventListener("click", closeSupplierModal);
  els.cancelSupplierModalBtn.addEventListener("click", closeSupplierModal);
  els.supplierModalBackdrop.addEventListener("click", closeSupplierModal);
  els.supplierForm.addEventListener("submit", handleSupplierSubmit);
}

function createSeedState() {
  const inventory = [
    {
      id: "SMN-001",
      sku: "SMN-001",
      name: "Semen Tiga Roda 50kg",
      category: "Material Dasar",
      unit: "sak",
      supplier: "PT Tiga Roda",
      stock: 18,
      minStock: 10,
      price: 65000,
      description: "Semen utama untuk kebutuhan struktur dan pasangan bata."
    },
    {
      id: "PKU-050",
      sku: "PKU-050",
      name: "Paku Beton 5cm (Box)",
      category: "Perkakas",
      unit: "box",
      supplier: "UD Baja Prima",
      stock: 120,
      minStock: 20,
      price: 25000,
      description: "Paku beton standar untuk kebutuhan pemasangan."
    },
    {
      id: "CAT-102",
      sku: "CAT-102",
      name: "Cat Avian Putih 5kg",
      category: "Finishing & Cat",
      unit: "kaleng",
      supplier: "PT Avian Brands",
      stock: 2,
      minStock: 5,
      price: 145000,
      description: "Cat dasar interior warna putih."
    },
    {
      id: "PVC-004",
      sku: "PVC-004",
      name: "Pipa PVC Maspion 1\"",
      category: "Plumbing & Pipa",
      unit: "btg",
      supplier: "PT Maspion",
      stock: 30,
      minStock: 8,
      price: 32000,
      description: "Pipa PVC ukuran 1 inci untuk instalasi air."
    },
    {
      id: "BES-010",
      sku: "BES-010",
      name: "Besi Beton Polos 10mm",
      category: "Struktur",
      unit: "btg",
      supplier: "CV Baja Sejahtera",
      stock: 4,
      minStock: 8,
      price: 78000,
      description: "Besi beton polos untuk kebutuhan konstruksi ringan."
    },
    {
      id: "TRP-005",
      sku: "TRP-005",
      name: "Triplek Meranti 12mm",
      category: "Material Dasar",
      unit: "lembar",
      supplier: "CV Kayu Indah",
      stock: 50,
      minStock: 10,
      price: 145000,
      description: "Triplek meranti untuk finishing dan meubel."
    },
    {
      id: "DLX-045",
      sku: "DLX-045",
      name: "Cat Dulux Weathershield 2.5L",
      category: "Finishing & Cat",
      unit: "kaleng",
      supplier: "PT Dulux",
      stock: 5,
      minStock: 6,
      price: 285000,
      description: "Cat eksterior premium tahan cuaca."
    },
    {
      id: "PVC-088",
      sku: "PVC-088",
      name: "Pipa PVC Wavin 4\" AW",
      category: "Plumbing & Pipa",
      unit: "btg",
      supplier: "PT Wavin",
      stock: 2,
      minStock: 5,
      price: 95000,
      description: "Pipa AW tekanan tinggi untuk saluran air."
    },
    {
      id: "SMG-001",
      sku: "SMG-001",
      name: "Semen Gresik 50kg",
      category: "Material Dasar",
      unit: "sak",
      supplier: "PT Semen Gresik",
      stock: 120,
      minStock: 15,
      price: 65000,
      description: "Alternatif semen proyek dengan pasokan stabil."
    }
  ];

  const goodsInSpecs = [
    { daysAgo: 1, hour: 8, itemId: "SMN-001", quantity: 30, cost: 61000, supplier: "PT Tiga Roda", note: "Restock untuk proyek perumahan baru." },
    { daysAgo: 2, hour: 10, itemId: "PVC-088", quantity: 12, cost: 90000, supplier: "PT Wavin", note: "Persiapan stok pipa AW menjelang akhir pekan." },
    { daysAgo: 3, hour: 9, itemId: "DLX-045", quantity: 24, cost: 260000, supplier: "PT Dulux", note: "Restock cat eksterior berdasarkan permintaan pelanggan." },
    { daysAgo: 5, hour: 11, itemId: "BES-010", quantity: 20, cost: 72000, supplier: "CV Baja Sejahtera", note: "Pengadaan besi polos untuk proyek cor." }
  ];

  const salesSpecs = [
    { daysAgo: 0, hour: 8, minute: 30, items: [["SMN-001", 2], ["PKU-050", 1]], discount: 0, payment: 160000 },
    { daysAgo: 0, hour: 10, minute: 15, items: [["CAT-102", 1]], discount: 5000, payment: 150000 },
    { daysAgo: 0, hour: 11, minute: 20, items: [["PVC-004", 4]], discount: 0, payment: 150000 },
    { daysAgo: 0, hour: 13, minute: 45, items: [["SMG-001", 3], ["TRP-005", 1]], discount: 10000, payment: 350000 },
    { daysAgo: 0, hour: 15, minute: 5, items: [["BES-010", 2]], discount: 0, payment: 200000 },
    { daysAgo: 1, hour: 9, minute: 5, items: [["SMN-001", 1], ["DLX-045", 1]], discount: 15000, payment: 360000 },
    { daysAgo: 1, hour: 14, minute: 40, items: [["PVC-088", 2]], discount: 0, payment: 200000 },
    { daysAgo: 2, hour: 10, minute: 0, items: [["TRP-005", 2], ["PKU-050", 3]], discount: 5000, payment: 400000 },
    { daysAgo: 2, hour: 16, minute: 20, items: [["SMG-001", 5]], discount: 0, payment: 330000 },
    { daysAgo: 3, hour: 8, minute: 55, items: [["DLX-045", 1], ["CAT-102", 1]], discount: 20000, payment: 450000 },
    { daysAgo: 4, hour: 13, minute: 15, items: [["PVC-004", 10]], discount: 5000, payment: 350000 },
    { daysAgo: 5, hour: 12, minute: 5, items: [["BES-010", 4], ["PKU-050", 2]], discount: 0, payment: 380000 },
    { daysAgo: 6, hour: 10, minute: 45, items: [["TRP-005", 3]], discount: 0, payment: 450000 },
    { daysAgo: 7, hour: 15, minute: 35, items: [["SMN-001", 4], ["PVC-088", 1]], discount: 10000, payment: 360000 },
    { daysAgo: 8, hour: 9, minute: 50, items: [["SMG-001", 6], ["PKU-050", 4]], discount: 20000, payment: 500000 },
    { daysAgo: 9, hour: 14, minute: 0, items: [["CAT-102", 2], ["PVC-004", 3]], discount: 10000, payment: 420000 }
  ];

  const goodsIn = goodsInSpecs.map((entry, index) => {
    const item = inventory.find((current) => current.id === entry.itemId);
    return {
      id: `IN-${index + 1}-${Date.now()}`,
      date: createIsoDate(entry.daysAgo, entry.hour, 0),
      itemId: entry.itemId,
      itemName: item.name,
      quantity: entry.quantity,
      cost: entry.cost,
      supplier: entry.supplier,
      note: entry.note
    };
  });

  const sales = salesSpecs.map((entry, index) => createSaleRecord(entry, inventory, index + 1));

  return {
    version: "legacy-demo-state",
    inventory,
    goodsIn,
    sales,
    cart: [],
    lastReceipt: sales[0] || null,
    auth: {
      isLoggedIn: false,
      userName: "Admin Losari"
    },
    ui: {
      activeView: "dashboard",
      isSidebarOpen: false,
      searchQuery: "",
      inventoryMode: "catalog",
      inventoryCategory: "all",
      cashierCategory: "Semua",
      reportType: "sales",
      reportPeriod: "monthly",
      reportDate: formatDateInput(new Date()),
      reportMonth: formatMonthInput(new Date()),
      reportYear: String(new Date().getFullYear()),
      discount: 0,
      payment: 0
    }
  };
}

function createSaleRecord(entry, inventory, index) {
  const items = entry.items.map(([itemId, quantity]) => {
    const item = inventory.find((current) => current.id === itemId);
    return {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity,
      price: item.price
    };
  });

  const subtotal = items.reduce((sum, item) => sum + Math.round(normalizeQuantity(item.quantity) * item.price), 0);
  const discount = entry.discount || 0;
  const total = subtotal - discount;
  const payment = Math.max(entry.payment || total, total);

  return {
    id: createTransactionNumberFromDate(createIsoDate(entry.daysAgo, entry.hour, entry.minute), index),
    date: createIsoDate(entry.daysAgo, entry.hour, entry.minute),
    items,
    subtotal,
    discount,
    total,
    payment,
    change: payment - total
  };
}

function renderAll() {
  syncAuthView();
  updateSidebarAndPage();
  updateHeader();
  syncSearchInputs();
  renderDashboard();
  renderInventory();
  renderCashier();
  renderReports();
  updateReportControls();
  updateInventoryMode();
}

function syncAuthView() {
  els.loginView.classList.toggle("hidden", state.auth.isLoggedIn);
  els.appView.classList.toggle("hidden", !state.auth.isLoggedIn);
}

function updateSidebarAndPage() {
  els.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === state.ui.activeView);
  });

  els.pages.forEach((page) => {
    page.classList.toggle("active", page.dataset.view === state.ui.activeView);
  });

  els.appView.classList.toggle("sidebar-open", state.ui.isSidebarOpen);
}

function updateHeader() {
  const copy = {
    dashboard: {
      eyebrow: "Overview",
      title: "Dashboard",
      subtitle: "Ringkasan utama persediaan dan transaksi toko."
    },
    inventory: {
      eyebrow: "Data Master",
      title: "Manajemen Barang",
      subtitle: "Kelola barang dan restock dari supplier."
    },
    cashier: {
      eyebrow: "Kasir",
      title: "Transaksi Penjualan",
      subtitle: "Pilih barang, proses pembayaran, dan cetak nota."
    },
    reports: {
      eyebrow: "Analitik",
      title: "Laporan Operasional",
      subtitle: "Pantau performa penjualan dan stok berdasarkan periode."
    }
  }[state.ui.activeView];

  els.headerEyebrow.textContent = copy.eyebrow;
  els.headerTitle.textContent = copy.title;
  els.headerSubtitle.textContent = copy.subtitle;
  els.headerDate.textContent = formatLongDate(new Date());
}

function syncSearchInputs() {
  const value = state.ui.searchQuery;
  els.globalSearch.value = value;
  els.inventorySearch.value = value;
  els.cashierSearch.value = value;
  els.discountInput.value = formatPlainNumber(state.ui.discount);
  els.paymentInput.value = formatPlainNumber(state.ui.payment);
  els.reportPeriod.value = state.ui.reportPeriod;
  els.reportDateInput.value = state.ui.reportDate;
  els.reportMonthInput.value = state.ui.reportMonth;
  els.reportYearInput.value = state.ui.reportYear;
  els.inventoryCategoryFilter.value = state.ui.inventoryCategory;
}

function renderDashboard() {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));
  const todaySales = filterSalesByDate(today);
  const yesterdaySales = filterSalesByDate(yesterday);
  const lowStockItems = getLowStockItems();
  const query = state.ui.searchQuery.trim().toLowerCase();

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
  const transactionDelta = todaySales.length - yesterdaySales.length;
  const revenueDelta = todayRevenue - yesterdayRevenue;

  els.metricTransactions.textContent = formatNumber(todaySales.length);
  els.metricTransactionsDelta.textContent =
    transactionDelta === 0
      ? "Sama dengan aktivitas kemarin"
      : `${transactionDelta > 0 ? "+" : ""}${transactionDelta} transaksi dibanding kemarin`;

  els.metricRevenue.textContent = formatCurrency(todayRevenue);
  els.metricRevenueDelta.textContent =
    revenueDelta === 0
      ? "Nilai penjualan stabil dibanding kemarin"
      : `${revenueDelta > 0 ? "+" : ""}${formatCurrency(Math.abs(revenueDelta))} dibanding kemarin`;

  els.metricSku.textContent = formatNumber(state.inventory.length);
  els.metricSkuDetail.textContent = `${countSuppliers()} supplier aktif dalam data master`;
  els.metricLowStock.textContent = formatNumber(lowStockItems.length);
  els.metricLowStockDetail.textContent =
    lowStockItems.length > 0
      ? `${lowStockItems[0].name} paling membutuhkan restock`
      : "Semua stok berada di atas batas minimum";

  renderTrendChart();

  const filteredLowStock = lowStockItems.filter((item) => matchesQuery([item.name, item.sku, item.category], query));
  const filteredRecentSales = getRecentSales().filter((sale) =>
    matchesQuery([sale.id, summarizeTransactionItems(sale), formatCurrency(sale.total)], query)
  );
  const filteredGoodsIn = getRecentGoodsIn().filter((entry) =>
    matchesQuery([entry.itemName, entry.supplier, entry.note], query)
  );

  els.lowStockList.innerHTML = filteredLowStock.length
    ? filteredLowStock
      .map((item) => {
        const low = item.stock <= item.minStock;
        return `
          <article class="list-card">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.category)} | ${escapeHtml(item.sku)}</small>
            </div>
            <span class="stock-pill ${low ? "low" : "ok"}">${formatQuantity(item.stock)} ${escapeHtml(item.unit)}</span>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Tidak ada barang stok minimum yang sesuai dengan pencarian.");

  els.recentSalesList.innerHTML = filteredRecentSales.length
    ? filteredRecentSales
      .map((sale) => {
        return `
          <article class="activity-card">
            <strong>${escapeHtml(sale.id)}</strong>
            <small>${escapeHtml(summarizeTransactionItems(sale))}</small>
            <div class="activity-meta">
              <span>${formatShortDateTime(sale.date)}</span>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Belum ada transaksi yang sesuai dengan pencarian.");

  els.goodsInSnapshot.innerHTML = filteredGoodsIn.length
    ? filteredGoodsIn
      .map((entry) => {
        const item = getItemById(entry.itemId);
        const unit = item?.unit || "unit";
        return `
          <article class="activity-card">
            <strong>${escapeHtml(entry.itemName)}</strong>
            <small>${escapeHtml(entry.supplier)} | ${formatQuantity(entry.quantity)} ${escapeHtml(unit)}</small>
            <div class="activity-meta">
              <span>${formatShortDateTime(entry.date)}</span>
              <strong>${formatCurrency(entry.cost)}</strong>
            </div>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Belum ada catatan barang masuk yang sesuai.");
}

function renderTrendChart() {
  const data = getLastSevenDaySales();
  const maxValue = Math.max(...data.map((item) => item.total), 1);

  els.salesTrendChart.innerHTML = data
    .map((item) => {
      const height = Math.max(16, Math.round((item.total / maxValue) * 210));
      return `
        <div class="chart-bar">
          <span class="chart-bar-value">${formatCompactCurrency(item.total)}</span>
          <div class="chart-bar-fill" style="height:${height}px"></div>
          <span class="chart-bar-label">${escapeHtml(item.label)}</span>
        </div>
      `;
    })
    .join("");
}

function renderInventory() {
  populateInventoryFilters();
  populateItemCategoryOptions();
  populateItemUnitOptions();
  populateSupplierOptions();
  updateInventoryMode();
  populateIncomingItemOptions();

  const query = state.ui.searchQuery.trim().toLowerCase();
  const category = state.ui.inventoryCategory;

  const inventoryRows = state.inventory
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "id"))
    .filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const searchMatch = matchesQuery([item.name, item.sku, item.supplier, item.category], query);
      return categoryMatch && searchMatch;
    });

  els.inventoryTableBody.innerHTML = inventoryRows.length
    ? inventoryRows
      .map((item) => {
        const stockClass = item.stock <= item.minStock ? "low" : "ok";
        return `
          <tr>
            <td>
              <div class="name-cell">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.sku)}</small>
              </div>
            </td>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.supplier)}</td>
            <td><span class="stock-pill ${stockClass}">${formatQuantity(item.stock)} ${escapeHtml(item.unit)}</span></td>
            <td>${formatCurrency(item.price)}</td>
            <td class="align-right">
              <div class="table-actions">
                <button class="mini-button" type="button" data-action="edit" data-item-id="${escapeHtml(item.id)}">Edit</button>
                <button class="mini-button" type="button" data-action="restock" data-item-id="${escapeHtml(item.id)}">Restock</button>
                <button class="mini-button danger" type="button" data-action="delete" data-item-id="${escapeHtml(item.id)}">Hapus</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("")
    : `
      <tr>
        <td colspan="6">${renderEmptyState("Barang tidak ditemukan. Coba ubah kata kunci atau kategori.")}</td>
      </tr>
    `;

  const incomingRows = state.goodsIn
    .slice()
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .filter((entry) => matchesQuery([entry.itemName, entry.supplier, entry.note], query));

  els.incomingHistoryList.innerHTML = incomingRows.length
    ? incomingRows
      .map((entry) => {
        const item = getItemById(entry.itemId);
        const unit = item?.unit || "unit";
        return `
          <article class="activity-card">
            <strong>${escapeHtml(entry.itemName)}</strong>
            <small>${escapeHtml(entry.supplier)} | ${formatQuantity(entry.quantity)} ${escapeHtml(unit)} | ${formatCurrency(entry.cost)} / ${escapeHtml(unit)}</small>
            <div class="activity-meta">
              <span>${formatShortDateTime(entry.date)}</span>
              <span>${escapeHtml(entry.note || "Tanpa catatan")}</span>
            </div>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Belum ada riwayat barang masuk yang sesuai dengan pencarian.");

  const suppliers = state.suppliers
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "id"))
    .filter((supplier) => matchesQuery([supplier.name], query));

  els.supplierSummaryCount.textContent = `${formatNumber(state.suppliers.length)} Supplier`;
  els.supplierTableBody.innerHTML = suppliers.length
    ? suppliers
      .map((supplier) => {
        const canDelete = supplier.itemsCount === 0 && supplier.receiptsCount === 0;
        return `
          <tr>
            <td>
              <div class="name-cell">
                <strong>${escapeHtml(supplier.name)}</strong>
                <small>ID Supplier #${escapeHtml(supplier.id)}</small>
              </div>
            </td>
            <td>${formatNumber(supplier.itemsCount)}</td>
            <td>${formatNumber(supplier.receiptsCount)}</td>
            <td class="align-right">
              <div class="table-actions">
                <button class="mini-button" type="button" data-supplier-action="edit" data-supplier-id="${escapeHtml(supplier.id)}">Edit</button>
                <button class="mini-button danger" type="button" data-supplier-action="delete" data-supplier-id="${escapeHtml(supplier.id)}" ${canDelete ? "" : "disabled"}>Hapus</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("")
    : `
      <tr>
        <td colspan="4">${renderEmptyState("Supplier tidak ditemukan. Coba ubah kata kunci pencarian.")}</td>
      </tr>
    `;

  renderMasterDataPanel(query);

  if (!els.incomingDate.value) {
    els.incomingDate.value = formatDateInput(new Date());
  }
}

function renderCashier() {
  const categories = ["Semua", ...new Set(state.inventory.map((item) => item.category))];
  els.cashierCategoryChips.innerHTML = categories
    .map((category) => {
      const active = category === state.ui.cashierCategory;
      return `
        <button class="chip-filter ${active ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `;
    })
    .join("");

  const query = state.ui.searchQuery.trim().toLowerCase();
  const products = state.inventory.filter((item) => {
    const categoryMatch = state.ui.cashierCategory === "Semua" || item.category === state.ui.cashierCategory;
    const searchMatch = matchesQuery([item.name, item.sku, item.category, item.supplier], query);
    return categoryMatch && searchMatch;
  });

  els.productGrid.innerHTML = products.length
    ? products
      .map((item) => {
        const icon = getItemIcon(item.category);
        const low = item.stock <= item.minStock;
        const disabled = item.stock <= 0;
        return `
          <article class="product-card">
            <span class="stock-pill product-stock ${low ? "low" : "ok"}">
              ${disabled ? "Habis" : `Stok ${formatQuantity(item.stock)} ${escapeHtml(item.unit)}`}
            </span>
            <div class="product-visual">
              <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="product-meta">
              <small>${escapeHtml(item.sku)}</small>
              <h4>${escapeHtml(item.name)}</h4>
              <p>${escapeHtml(item.category)}</p>
            </div>
            <div class="product-footer">
              <div>
                <div class="product-price">${formatCurrency(item.price)}</div>
                <small>${escapeHtml(item.unit)}</small>
              </div>
              <button class="icon-button" type="button" data-add-item="${escapeHtml(item.id)}" ${disabled ? "disabled" : ""}>
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Tidak ada barang yang cocok dengan filter kasir saat ini.");

  renderCart();
}

function renderCart() {
  const totals = calculateCartTotals();
  const orderNumber = createTransactionNumberFromDate(new Date().toISOString(), state.sales.length + 1);
  els.cartOrderNumber.textContent = orderNumber;
  els.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  els.cartTotal.textContent = formatCurrency(totals.total);
  els.cartChange.textContent = formatCurrency(totals.change);

  els.cartList.innerHTML = state.cart.length
    ? state.cart
      .map((entry) => {
        const item = getItemById(entry.itemId);
        const step = getQuantityStep(item);
        const lineTotal = Math.round(normalizeQuantity(entry.quantity) * item.price);
        return `
          <article class="cart-item">
            <div class="cart-item-head">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${formatCurrency(item.price)} / ${escapeHtml(item.unit)}</small>
              </div>
              <button class="icon-button" type="button" data-cart-action="remove" data-item-id="${escapeHtml(item.id)}">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="cart-qty-row">
              <div class="qty-stepper">
                <button type="button" data-cart-action="decrease" data-item-id="${escapeHtml(item.id)}">
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <input
                  class="qty-input"
                  type="number"
                  min="0.001"
                  step="${escapeHtml(step)}"
                  value="${escapeHtml(formatDecimalInput(entry.quantity))}"
                  data-cart-action="set"
                  data-item-id="${escapeHtml(item.id)}"
                  aria-label="Jumlah ${escapeHtml(item.name)}"
                >
                <button type="button" data-cart-action="increase" data-item-id="${escapeHtml(item.id)}">
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
              <strong>${formatCurrency(lineTotal)}</strong>
            </div>
          </article>
        `;
      })
      .join("")
    : renderEmptyState("Keranjang masih kosong. Pilih barang dari katalog di sebelah kiri.");

  els.checkoutBtn.disabled = totals.total <= 0 || state.ui.payment < totals.total;
}

function renderReports() {
  const context = getReportContext();

  els.reportPrimaryLabel.textContent = context.summary.primaryLabel;
  els.reportPrimaryValue.textContent = context.summary.primaryValue;
  els.reportPrimaryHint.textContent = context.summary.primaryHint;
  els.reportSecondaryLabel.textContent = context.summary.secondaryLabel;
  els.reportSecondaryValue.textContent = context.summary.secondaryValue;
  els.reportSecondaryHint.textContent = context.summary.secondaryHint;
  els.reportTertiaryLabel.textContent = context.summary.tertiaryLabel;
  els.reportTertiaryValue.textContent = context.summary.tertiaryValue;
  els.reportTertiaryHint.textContent = context.summary.tertiaryHint;
  els.reportTableTitle.textContent = context.tableTitle;

  els.reportTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.reportType === state.ui.reportType);
  });

  els.reportTableHead.innerHTML = `
    <tr>
      ${context.headers
        .map((header) => `<th class="${header.align === "right" ? "align-right" : ""}">${escapeHtml(header.label)}</th>`)
        .join("")}
    </tr>
  `;

  els.reportTableBody.innerHTML = context.rows.length
    ? context.rows
      .map((row) => {
        return `
          <tr>
            ${context.headers
              .map((header) => `<td class="${header.align === "right" ? "align-right" : ""}">${row[header.key]}</td>`)
              .join("")}
          </tr>
        `;
      })
      .join("")
    : `
      <tr>
        <td colspan="${context.headers.length}">
          ${renderEmptyState("Tidak ada data laporan yang cocok dengan periode dan pencarian saat ini.")}
        </td>
      </tr>
    `;
}

function updateInventoryMode() {
  const mode = state.ui.inventoryMode;
  els.inventoryCatalogPanel.classList.toggle("hidden", mode !== "catalog");
  els.inventoryIncomingPanel.classList.toggle("hidden", mode !== "incoming");
  els.inventorySuppliersPanel.classList.toggle("hidden", mode !== "suppliers");
  els.inventoryMastersPanel.classList.toggle("hidden", mode !== "masters");
  els.openAddItemBtn.classList.toggle("hidden", mode === "suppliers" || mode === "masters");
  els.openAddSupplierBtn.classList.toggle("hidden", mode !== "suppliers");
  els.inventoryModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.inventoryMode === mode);
  });
}

function updateReportControls() {
  const period = state.ui.reportPeriod;
  els.reportDateField.classList.toggle("hidden", period !== "daily");
  els.reportMonthField.classList.toggle("hidden", period !== "monthly");
  els.reportYearField.classList.toggle("hidden", period !== "yearly");
}

function populateYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  els.reportYearInput.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
}

function populateInventoryFilters() {
  const categories = ["all", ...getCategoryOptions()];
  const currentValue = state.ui.inventoryCategory;
  els.inventoryCategoryFilter.innerHTML = categories
    .map((category) => {
      const label = category === "all" ? "Semua Kategori" : category;
      return `<option value="${escapeHtml(category)}">${escapeHtml(label)}</option>`;
    })
    .join("");
  els.inventoryCategoryFilter.value = categories.includes(currentValue) ? currentValue : "all";
}

function getCategoryOptions(extraValue = "") {
  return uniqueSorted([
    ...DEFAULT_CATEGORY_OPTIONS,
    ...getMasterNames(state.categories),
    ...state.inventory.map((item) => item.category),
    extraValue
  ]);
}

function getUnitOptions(extraValue = "") {
  return uniqueSorted([
    ...DEFAULT_UNIT_OPTIONS,
    ...getMasterNames(state.units),
    ...state.inventory.map((item) => item.unit),
    extraValue
  ]);
}

function getSupplierOptions(extraValue = "") {
  const masterSuppliers = Array.isArray(state.suppliers)
    ? state.suppliers.map((supplier) => supplier.name)
    : [];

  return uniqueSorted([
    ...masterSuppliers,
    ...state.inventory.map((item) => item.supplier),
    ...state.goodsIn.map((entry) => entry.supplier),
    extraValue
  ]);
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "id"));
}

function getMasterNames(entries) {
  return Array.isArray(entries)
    ? entries.map((entry) => typeof entry === "string" ? entry : entry?.name).filter(Boolean)
    : [];
}

function hasOption(options, value) {
  const normalized = String(value || "").trim().toLowerCase();
  return options.some((option) => option.toLowerCase() === normalized);
}

function setSelectOptions(select, options, currentValue, placeholder) {
  const selectedValue = String(currentValue || "").trim();
  const normalizedOptions = selectedValue && !options.includes(selectedValue)
    ? uniqueSorted([...options, selectedValue])
    : options;

  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...normalizedOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
  ].join("");
  select.value = normalizedOptions.includes(selectedValue) ? selectedValue : "";
}

function populateItemCategoryOptions(currentValue = els.itemCategory.value) {
  setSelectOptions(els.itemCategory, getCategoryOptions(currentValue), currentValue, "Pilih kategori");
}

function populateItemUnitOptions(currentValue = els.itemUnit.value) {
  setSelectOptions(els.itemUnit, getUnitOptions(currentValue), currentValue, "Pilih satuan");
}

function populateSupplierOptions(
  itemSupplierValue = els.itemSupplier.value,
  incomingSupplierValue = els.incomingSupplier.value
) {
  const suppliers = getSupplierOptions(itemSupplierValue || incomingSupplierValue);
  setSelectOptions(els.itemSupplier, suppliers, itemSupplierValue, "Pilih supplier");
  setSelectOptions(els.incomingSupplier, suppliers, incomingSupplierValue, "Pilih supplier");
}

function populateIncomingItemOptions() {
  const currentValue = els.incomingItem.value;
  els.incomingItem.innerHTML = state.inventory
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "id"))
    .map((item) => {
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} | ${escapeHtml(item.sku)}</option>`;
    })
    .join("");

  if (currentValue && state.inventory.some((item) => String(item.id) === String(currentValue))) {
    els.incomingItem.value = currentValue;
  }
}

function renderMasterDataPanel(query = "") {
  const categories = getCategoryOptions().filter((category) => matchesQuery([category], query));
  const units = getUnitOptions().filter((unit) => matchesQuery([unit], query));

  els.categoryMasterCount.textContent = `${formatNumber(categories.length)} kategori aktif`;
  els.unitMasterCount.textContent = `${formatNumber(units.length)} satuan aktif`;
  els.categoryMasterList.innerHTML = renderMasterChips(categories, "category");
  els.unitMasterList.innerHTML = renderMasterChips(units, "unit");
}

function renderMasterChips(values, type) {
  if (!values.length) {
    return renderEmptyState(type === "category" ? "Belum ada kategori yang cocok." : "Belum ada satuan yang cocok.");
  }

  return values
    .map((value) => {
      const itemCount = state.inventory.filter((item) => item[type] === value).length;
      return `
        <span class="master-chip">
          <strong>${escapeHtml(value)}</strong>
          <small>${formatNumber(itemCount)} barang memakai ${type === "category" ? "kategori" : "satuan"} ini</small>
        </span>
      `;
    })
    .join("");
}

async function handleCategoryMasterSubmit(event) {
  event.preventDefault();
  const name = els.categoryMasterName.value.trim();

  if (!name) {
    showToast("danger", "Kategori kosong", "Isi nama kategori terlebih dahulu.");
    return;
  }

  if (hasOption(getCategoryOptions(), name)) {
    showToast("info", "Kategori sudah tersedia", `${name} sudah ada di master kategori.`);
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.categoriesStore, {
      method: "POST",
      body: { name }
    });
    setBootState(response.state);
    els.categoryMasterForm.reset();
    renderAll();
    showToast("success", "Kategori ditambahkan", response.message || `${name} masuk ke master kategori.`);
  } catch (error) {
    showToast("danger", "Gagal menyimpan kategori", error.message);
  }
}

async function handleUnitMasterSubmit(event) {
  event.preventDefault();
  const name = els.unitMasterName.value.trim();

  if (!name) {
    showToast("danger", "Satuan kosong", "Isi nama satuan terlebih dahulu.");
    return;
  }

  if (hasOption(getUnitOptions(), name)) {
    showToast("info", "Satuan sudah tersedia", `${name} sudah ada di master satuan.`);
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.unitsStore, {
      method: "POST",
      body: { name }
    });
    setBootState(response.state);
    els.unitMasterForm.reset();
    renderAll();
    showToast("success", "Satuan ditambahkan", response.message || `${name} masuk ke master satuan.`);
  } catch (error) {
    showToast("danger", "Gagal menyimpan satuan", error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value.trim();

  try {
    const response = await apiRequest(POS_ROUTES.login, {
      method: "POST",
      body: {
        username,
        password
      }
    });

    setBootState(response.state, { preserveUi: false });
    state.ui.isSidebarOpen = false;
    renderAll();
    showToast("success", "Login berhasil", "Selamat datang di sistem informasi TB. Losari Jaya 2.");
  } catch (error) {
    showToast("danger", "Login gagal", error.message);
  }
}

function toggleSidebar() {
  state.ui.isSidebarOpen = !state.ui.isSidebarOpen;
  renderAll();
}

function closeSidebar() {
  state.ui.isSidebarOpen = false;
  renderAll();
}

async function logout() {
  try {
    await apiRequest(POS_ROUTES.logout, {
      method: "POST"
    });
    window.location.reload();
    return;
  } catch (error) {
    showToast("danger", "Logout gagal", error.message);
  }
}

async function resetDemo() {
  if (!window.confirm("Reset semua data demo ke kondisi awal?")) {
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.reset, {
      method: "POST"
    });
    setBootState(response.state);
    renderAll();
    showToast("info", "Data demo direset", response.message || "Seluruh data demo dikembalikan ke kondisi awal.");
  } catch (error) {
    showToast("danger", "Reset gagal", error.message);
  }
}

function showView(view) {
  state.ui.activeView = view;
  state.ui.isSidebarOpen = false;
  renderAll();
}

function setInventoryMode(mode) {
  state.ui.inventoryMode = mode;
}

function handleSearchChange(event) {
  state.ui.searchQuery = event.target.value;
  renderAll();
}

async function handleInventoryTableClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const itemId = button.dataset.itemId;
  const action = button.dataset.action;
  const item = getItemById(itemId);

  if (action === "edit") {
    openItemModal(item);
    return;
  }

  if (action === "restock") {
    setInventoryMode("incoming");
    showView("inventory");
    renderAll();
    els.incomingItem.value = item.id;
    els.incomingSupplier.value = item.supplier;
    els.incomingQuantity.focus();
    return;
  }

  if (action === "delete") {
    if (window.confirm(`Hapus barang ${item.name}?`)) {
      try {
        const response = await apiRequest(`${POS_ROUTES.itemsBase}/${itemId}`, {
          method: "DELETE"
        });
        setBootState(response.state);
        renderAll();
        showToast("info", "Barang dihapus", response.message || `${item.name} berhasil dihapus dari data master.`);
      } catch (error) {
        showToast("danger", "Gagal menghapus", error.message);
      }
    }
  }
}

async function handleIncomingSubmit(event) {
  event.preventDefault();
  const item = getItemById(els.incomingItem.value);
  const quantity = normalizeQuantity(els.incomingQuantity.value);
  const cost = parseInteger(els.incomingCost.value);
  const selectedSupplier = els.incomingSupplier.value.trim();

  if (!item || !selectedSupplier || quantity <= 0 || cost < 0) {
    showToast("danger", "Data belum valid", "Periksa kembali pilihan barang, supplier, jumlah, dan harga beli.");
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.goodsIn, {
      method: "POST",
      body: {
        date: els.incomingDate.value,
        supplier: selectedSupplier,
        itemId: Number(item.id),
        quantity,
        cost,
        note: els.incomingNote.value.trim()
      }
    });

    setBootState(response.state);
    els.incomingForm.reset();
    els.incomingDate.value = formatDateInput(new Date());
    els.incomingSupplier.value = selectedSupplier;
    els.incomingItem.value = String(item.id);
    renderAll();
    showToast("success", "Barang masuk tercatat", response.message || `Stok ${item.name} bertambah ${formatQuantity(quantity)} ${item.unit}.`);
  } catch (error) {
    showToast("danger", "Gagal menyimpan restock", error.message);
  }
}

function handleProductGridClick(event) {
  const button = event.target.closest("[data-add-item]");
  if (!button) {
    return;
  }

  addToCart(button.dataset.addItem);
}

function handleCashierCategoryClick(event) {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }

  state.ui.cashierCategory = button.dataset.category;
  renderAll();
}

function handleCartListClick(event) {
  const button = event.target.closest("button[data-cart-action]");
  if (!button) {
    return;
  }

  const itemId = button.dataset.itemId;
  const action = button.dataset.cartAction;
  const cartItem = state.cart.find((entry) => String(entry.itemId) === String(itemId));
  const item = getItemById(itemId);

  if (!cartItem || !item) {
    return;
  }

  const step = getQuantityStep(item);

  if (action === "increase") {
    const nextQuantity = normalizeQuantity(cartItem.quantity + step);
    if (nextQuantity > normalizeQuantity(item.stock)) {
      showToast("danger", "Stok tidak cukup", `Stok ${item.name} tidak mencukupi untuk ditambah lagi.`);
      return;
    }
    cartItem.quantity = nextQuantity;
  }

  if (action === "decrease") {
    const nextQuantity = normalizeQuantity(cartItem.quantity - step);
    if (nextQuantity <= 0) {
      state.cart = state.cart.filter((entry) => String(entry.itemId) !== String(itemId));
    } else {
      cartItem.quantity = nextQuantity;
    }
  }

  if (action === "remove") {
    state.cart = state.cart.filter((entry) => String(entry.itemId) !== String(itemId));
  }

  renderAll();
}

function handleCartQuantityChange(event) {
  const input = event.target.closest("input[data-cart-action='set']");
  if (!input) {
    return;
  }

  const itemId = input.dataset.itemId;
  const item = getItemById(itemId);
  const cartItem = state.cart.find((entry) => String(entry.itemId) === String(itemId));

  if (!item || !cartItem) {
    return;
  }

  const nextQuantity = normalizeQuantity(input.value);
  if (nextQuantity <= 0) {
    state.cart = state.cart.filter((entry) => String(entry.itemId) !== String(itemId));
    renderAll();
    return;
  }

  const stock = normalizeQuantity(item.stock);
  cartItem.quantity = Math.min(nextQuantity, stock);

  if (nextQuantity > stock) {
    showToast("danger", "Stok tidak cukup", `Jumlah ${item.name} disesuaikan ke stok tersedia: ${formatQuantity(stock)} ${item.unit}.`);
  }

  renderAll();
}

function handleDiscountInput(event) {
  state.ui.discount = parseInteger(event.target.value);
  renderAll();
}

function handlePaymentInput(event) {
  state.ui.payment = parseInteger(event.target.value);
  renderAll();
}

function setExactPayment() {
  const totals = calculateCartTotals();
  state.ui.payment = totals.total;
  renderAll();
}

function clearCart() {
  state.cart = [];
  state.ui.discount = 0;
  state.ui.payment = 0;
  renderAll();
}

function addToCart(itemId) {
  const item = getItemById(itemId);
  if (!item) {
    return;
  }

  const existing = state.cart.find((entry) => String(entry.itemId) === String(itemId));
  const step = getQuantityStep(item);
  const stock = normalizeQuantity(item.stock);
  const currentQuantity = existing ? normalizeQuantity(existing.quantity) : 0;

  if (currentQuantity >= stock) {
    showToast("danger", "Stok tidak cukup", `Stok ${item.name} saat ini hanya ${formatQuantity(stock)} ${item.unit}.`);
    return;
  }

  const nextQuantity = Math.min(normalizeQuantity(currentQuantity + step), stock);

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    state.cart.push({
      itemId: item.id,
      quantity: nextQuantity
    });
  }

  renderAll();
}

async function checkoutCart() {
  const totals = calculateCartTotals();
  const cartLines = getCartLineItems();
  if (!state.cart.length) {
    showToast("danger", "Keranjang kosong", "Tambahkan barang ke keranjang sebelum melakukan pembayaran.");
    return;
  }

  if (hasInvalidCartItems(cartLines)) {
    showToast("danger", "Keranjang perlu diperbarui", "Ada barang di keranjang yang tidak ditemukan atau jumlahnya tidak valid. Hapus barang tersebut lalu pilih ulang.");
    return;
  }

  if (state.ui.payment < totals.total) {
    showToast("danger", "Pembayaran kurang", "Nilai uang bayar harus sama atau lebih besar dari total tagihan.");
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.checkout, {
      method: "POST",
      body: {
        items: cartLines.map(({ entry, item }) => ({
          itemId: Number(item.id),
          quantity: normalizeQuantity(entry.quantity)
        })),
        discount: totals.discount,
        payment: state.ui.payment
      }
    });

    setBootState(response.state);
    renderAll();
    showToast("success", "Transaksi berhasil", response.message || "Transaksi berhasil disimpan.");
  } catch (error) {
    showToast("danger", "Checkout gagal", error.message);
  }
}

function printReceipt() {
  const totals = calculateCartTotals();
  let receipt = null;

  if (state.cart.length) {
    const cartLines = getCartLineItems();
    if (hasInvalidCartItems(cartLines)) {
      showToast("danger", "Nota belum bisa dicetak", "Ada barang di keranjang yang tidak ditemukan atau jumlahnya tidak valid. Hapus barang tersebut lalu pilih ulang.");
      return;
    }

    receipt = {
      id: createTransactionNumberFromDate(new Date().toISOString(), state.sales.length + 1),
      date: new Date().toISOString(),
      items: cartLines.map(({ entry, item }) => {
        return {
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: entry.quantity,
          price: item.price
        };
      }),
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      payment: state.ui.payment,
      change: totals.change
    };
  } else if (state.lastReceipt) {
    receipt = state.lastReceipt;
  }

  if (!receipt) {
    showToast("danger", "Belum ada nota", "Tambahkan barang ke keranjang atau selesaikan transaksi lebih dulu.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(buildReceiptHtml(receipt));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
}

function getReportContext() {
  if (state.ui.reportType === "inventory") {
    return getInventoryReportContext();
  }
  return getSalesReportContext();
}

function getSalesReportContext() {
  const query = state.ui.searchQuery.trim().toLowerCase();
  const period = state.ui.reportPeriod;
  const sales = filterSalesBySelectedPeriod();

  let headers = [];
  let rows = [];
  let tableTitle = "";

  if (period === "daily") {
    headers = [
      { key: "transaction", label: "No Transaksi" },
      { key: "items", label: "Ringkasan Item" },
      { key: "total", label: "Total", align: "right" }
    ];
    rows = sales
      .map((sale) => ({
        transaction: `<div class="name-cell"><strong>${escapeHtml(sale.id)}</strong><small>${formatShortDateTime(sale.date)}</small></div>`,
        items: escapeHtml(summarizeTransactionItems(sale)),
        total: formatCurrency(sale.total)
      }))
      .filter((row) => matchesQuery([stripHtml(row.transaction), row.items, row.total], query));
    tableTitle = "Transaksi Harian";
  }

  if (period === "monthly") {
    headers = [
      { key: "date", label: "Tanggal" },
      { key: "transactions", label: "Total Transaksi", align: "right" },
      { key: "revenue", label: "Total Pendapatan", align: "right" }
    ];
    rows = groupSalesByDay(sales)
      .map((entry) => ({
        date: `<div class="name-cell"><strong>${escapeHtml(entry.label)}</strong><small>${formatNumber(entry.count)} transaksi</small></div>`,
        transactions: formatNumber(entry.count),
        revenue: formatCurrency(entry.total)
      }))
      .filter((row) => matchesQuery([stripHtml(row.date), row.transactions, row.revenue], query));
    tableTitle = "Ringkasan Bulanan";
  }

  if (period === "yearly") {
    headers = [
      { key: "month", label: "Bulan" },
      { key: "transactions", label: "Total Transaksi", align: "right" },
      { key: "revenue", label: "Total Pendapatan", align: "right" }
    ];
    rows = groupSalesByMonth(sales)
      .map((entry) => ({
        month: `<div class="name-cell"><strong>${escapeHtml(entry.label)}</strong><small>${formatNumber(entry.count)} transaksi</small></div>`,
        transactions: formatNumber(entry.count),
        revenue: formatCurrency(entry.total)
      }))
      .filter((row) => matchesQuery([stripHtml(row.month), row.transactions, row.revenue], query));
    tableTitle = "Ringkasan Tahunan";
  }

  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const average = sales.length ? Math.round(revenue / sales.length) : 0;

  return {
    type: "sales",
    tableTitle,
    headers,
    rows,
    exportRows: rows.map((row) => normalizeRowForExport(row, headers)),
    summary: {
      primaryLabel: "Total Pendapatan",
      primaryValue: formatCurrency(revenue),
      primaryHint: `Periode ${describeSelectedPeriod()}`,
      secondaryLabel: "Total Transaksi",
      secondaryValue: formatNumber(sales.length),
      secondaryHint: "Jumlah transaksi pada periode aktif",
      tertiaryLabel: "Rata-rata Transaksi",
      tertiaryValue: formatCurrency(average),
      tertiaryHint: "Nilai penjualan rata-rata per transaksi"
    }
  };
}

function getInventoryReportContext() {
  const query = state.ui.searchQuery.trim().toLowerCase();
  const rows = state.inventory
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "id"))
    .filter((item) => matchesQuery([item.name, item.sku, item.category, item.supplier], query))
    .map((item) => {
      const low = item.stock <= item.minStock;
      return {
        name: `<div class="name-cell"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.sku)}</small></div>`,
        category: escapeHtml(item.category),
        stock: `${formatQuantity(item.stock)} ${escapeHtml(item.unit)}`,
        min: formatQuantity(item.minStock),
        price: formatCurrency(item.price),
        status: `<span class="stock-pill ${low ? "low" : "ok"}">${low ? "Perlu Restock" : "Aman"}</span>`
      };
    });

  const totalStockValue = state.inventory.reduce((sum, item) => sum + Math.round(normalizeQuantity(item.stock) * item.price), 0);
  const lowStock = getLowStockItems().length;

  const headers = [
    { key: "name", label: "Nama Barang" },
    { key: "category", label: "Kategori" },
    { key: "stock", label: "Stok", align: "right" },
    { key: "min", label: "Minimum", align: "right" },
    { key: "price", label: "Harga", align: "right" },
    { key: "status", label: "Status", align: "right" }
  ];

  return {
    type: "inventory",
    tableTitle: "Snapshot Stok Barang",
    headers,
    rows,
    exportRows: rows.map((row) => normalizeRowForExport(row, headers)),
    summary: {
      primaryLabel: "Nilai Persediaan",
      primaryValue: formatCurrency(totalStockValue),
      primaryHint: `Snapshot ${describeSelectedPeriod()}`,
      secondaryLabel: "SKU Aktif",
      secondaryValue: formatNumber(state.inventory.length),
      secondaryHint: "Jumlah barang aktif dalam data master",
      tertiaryLabel: "Stok Minimum",
      tertiaryValue: formatNumber(lowStock),
      tertiaryHint: "Jumlah barang yang berada di bawah batas minimum"
    }
  };
}

function filterSalesBySelectedPeriod() {
  const period = state.ui.reportPeriod;

  if (period === "daily") {
    const selected = startOfDay(new Date(state.ui.reportDate));
    return filterSalesByDate(selected);
  }

  if (period === "monthly") {
    return state.sales.filter((sale) => sale.date.slice(0, 7) === state.ui.reportMonth);
  }

  return state.sales.filter((sale) => new Date(sale.date).getFullYear() === Number(state.ui.reportYear));
}

function exportCurrentReportCsv() {
  const context = getReportContext();
  const headers = context.headers.map((header) => header.label);
  const rows = context.exportRows.map((row) => context.headers.map((header) => row[header.key] || ""));
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${context.type}-report-${Date.now()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("success", "Laporan diekspor", "File CSV berhasil dibuat dari data laporan aktif.");
}

function printCurrentReport() {
  if (!POS_ROUTES.reportPdf) {
    const context = getReportContext();
    const win = window.open("", "_blank", "width=1024,height=768");
    if (!win) {
      showToast("danger", "Popup diblokir", "Izinkan popup browser untuk mencetak laporan.");
      return;
    }

    win.document.write(buildReportHtml(context));
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      win.print();
    }, 250);
    return;
  }

  const query = new URLSearchParams({
    type: state.ui.reportType,
    period: state.ui.reportPeriod,
    date: state.ui.reportDate,
    month: state.ui.reportMonth,
    year: state.ui.reportYear
  });
  const reportWindow = window.open(`${POS_ROUTES.reportPdf}?${query.toString()}`, "_blank");
  if (!reportWindow) {
    showToast("danger", "Popup diblokir", "Izinkan popup browser untuk membuka file PDF laporan.");
  }
}

function openItemModal(item = null) {
  els.itemModal.classList.remove("hidden");
  populateItemCategoryOptions(item?.category || "");
  populateItemUnitOptions(item?.unit || "");
  populateSupplierOptions(item?.supplier || "", els.incomingSupplier.value);
  if (item) {
    els.itemModalTitle.textContent = "Edit Barang";
    els.itemId.value = item.id;
    els.itemSku.value = item.sku;
    els.itemName.value = item.name;
    els.itemCategory.value = item.category;
    els.itemUnit.value = item.unit;
    els.itemSupplier.value = item.supplier;
    els.itemStock.value = formatDecimalInput(item.stock);
    els.itemMinStock.value = formatDecimalInput(item.minStock);
    els.itemPrice.value = item.price;
    els.itemDescription.value = item.description || "";
  } else {
    els.itemModalTitle.textContent = "Tambah Barang";
    els.itemForm.reset();
    els.itemId.value = "";
    populateItemUnitOptions("pcs");
    els.itemStock.value = 0;
    els.itemMinStock.value = 5;
    els.itemPrice.value = 0;
  }
}

function closeItemModal() {
  els.itemModal.classList.add("hidden");
}

function openSupplierModal(supplier = null) {
  els.supplierModal.classList.remove("hidden");
  if (supplier) {
    els.supplierModalTitle.textContent = "Edit Supplier";
    els.supplierId.value = supplier.id;
    els.supplierName.value = supplier.name;
  } else {
    els.supplierModalTitle.textContent = "Tambah Supplier";
    els.supplierForm.reset();
    els.supplierId.value = "";
  }
}

function closeSupplierModal() {
  els.supplierModal.classList.add("hidden");
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const previousId = els.itemId.value.trim();
  const payload = {
    id: previousId || els.itemSku.value.trim().toUpperCase(),
    sku: els.itemSku.value.trim().toUpperCase(),
    name: els.itemName.value.trim(),
    category: els.itemCategory.value.trim(),
    unit: els.itemUnit.value.trim(),
    supplier: els.itemSupplier.value.trim(),
    stock: normalizeQuantity(els.itemStock.value),
    minStock: normalizeQuantity(els.itemMinStock.value),
    price: parseInteger(els.itemPrice.value),
    description: els.itemDescription.value.trim()
  };

  if (!payload.sku || !payload.name || !payload.category || !payload.unit || !payload.supplier) {
    showToast("danger", "Data belum lengkap", "Mohon isi seluruh data barang yang wajib.");
    return;
  }

  const duplicate = state.inventory.find((item) => item.sku === payload.sku && String(item.id) !== String(previousId));
  if (duplicate) {
    showToast("danger", "SKU sudah digunakan", `SKU ${payload.sku} sudah dipakai oleh ${duplicate.name}.`);
    return;
  }

  try {
    const isUpdate = Boolean(previousId);
    const response = await apiRequest(
      isUpdate ? `${POS_ROUTES.itemsBase}/${previousId}` : POS_ROUTES.itemsStore,
      {
        method: isUpdate ? "PUT" : "POST",
        body: {
          sku: payload.sku,
          name: payload.name,
          category: payload.category,
          unit: payload.unit,
          supplier: payload.supplier,
          stock: payload.stock,
          minStock: payload.minStock,
          price: payload.price,
          description: payload.description
        }
      }
    );

    setBootState(response.state);
    closeItemModal();
    renderAll();
    showToast("success", isUpdate ? "Barang diperbarui" : "Barang ditambahkan", response.message || payload.name);
  } catch (error) {
    showToast("danger", "Gagal menyimpan barang", error.message);
  }
}

async function handleSupplierTableClick(event) {
  const button = event.target.closest("[data-supplier-action]");
  if (!button) {
    return;
  }

  const supplierId = button.dataset.supplierId;
  const action = button.dataset.supplierAction;
  const supplier = state.suppliers.find((entry) => String(entry.id) === String(supplierId));

  if (!supplier) {
    return;
  }

  if (action === "edit") {
    openSupplierModal(supplier);
    return;
  }

  if (action === "delete") {
    if (!window.confirm(`Hapus supplier ${supplier.name}?`)) {
      return;
    }

    try {
      const response = await apiRequest(`${POS_ROUTES.suppliersBase}/${supplierId}`, {
        method: "DELETE"
      });
      setBootState(response.state);
      renderAll();
      showToast("info", "Supplier dihapus", response.message || `${supplier.name} berhasil dihapus.`);
    } catch (error) {
      showToast("danger", "Gagal menghapus supplier", error.message);
    }
  }
}

async function handleSupplierSubmit(event) {
  event.preventDefault();
  const supplierId = els.supplierId.value.trim();
  const name = els.supplierName.value.trim();

  if (!name) {
    showToast("danger", "Nama supplier kosong", "Isi nama supplier terlebih dahulu.");
    return;
  }

  try {
    const response = await apiRequest(
      supplierId ? `${POS_ROUTES.suppliersBase}/${supplierId}` : POS_ROUTES.suppliersStore,
      {
        method: supplierId ? "PUT" : "POST",
        body: { name }
      }
    );
    setBootState(response.state);
    closeSupplierModal();
    renderAll();
    showToast("success", supplierId ? "Supplier diperbarui" : "Supplier ditambahkan", response.message || name);
  } catch (error) {
    showToast("danger", "Gagal menyimpan supplier", error.message);
  }
}

function calculateCartTotals() {
  const subtotal = state.cart.reduce((sum, entry) => {
    const item = getItemById(entry.itemId);
    if (!item) {
      return sum;
    }
    return sum + Math.round(item.price * normalizeQuantity(entry.quantity));
  }, 0);

  const roundedSubtotal = Math.round(subtotal);
  const discount = Math.min(Math.max(state.ui.discount, 0), roundedSubtotal);
  const total = Math.max(roundedSubtotal - discount, 0);
  const payment = Math.max(state.ui.payment, 0);
  const change = Math.max(payment - total, 0);

  return {
    subtotal: roundedSubtotal,
    discount,
    total,
    payment,
    change
  };
}

function getCartLineItems() {
  return state.cart.map((entry) => ({
    entry,
    item: getItemById(entry.itemId)
  }));
}

function hasInvalidCartItems(cartLines) {
  return cartLines.some(({ entry, item }) => {
    if (!item) {
      return true;
    }
    const quantity = normalizeQuantity(entry.quantity);
    return quantity <= 0 || quantity > normalizeQuantity(item.stock);
  });
}

function filterSalesByDate(day) {
  const target = formatDateInput(day);
  return state.sales.filter((sale) => formatDateInput(new Date(sale.date)) === target);
}

function getLastSevenDaySales() {
  const days = [];
  for (let index = 6; index >= 0; index -= 1) {
    const day = startOfDay(addDays(new Date(), -index));
    const total = filterSalesByDate(day).reduce((sum, sale) => sum + sale.total, 0);
    days.push({
      label: formatDayShort(day),
      total
    });
  }
  return days;
}

function getRecentSales() {
  return state.sales
    .slice()
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 5);
}

function getRecentGoodsIn() {
  return state.goodsIn
    .slice()
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 5);
}

function getLowStockItems() {
  return state.inventory
    .filter((item) => item.stock <= item.minStock)
    .sort((left, right) => left.stock - right.stock);
}

function countSuppliers() {
  return new Set(state.inventory.map((item) => item.supplier)).size;
}

function groupSalesByDay(sales) {
  const grouped = new Map();
  sales.forEach((sale) => {
    const key = formatDateInput(new Date(sale.date));
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: formatShortDate(new Date(sale.date)),
        total: 0,
        count: 0
      });
    }
    const current = grouped.get(key);
    current.total += sale.total;
    current.count += 1;
  });
  return Array.from(grouped.values()).sort((left, right) => right.key.localeCompare(left.key));
}

function groupSalesByMonth(sales) {
  const grouped = new Map();
  sales.forEach((sale) => {
    const monthKey = sale.date.slice(0, 7);
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, {
        label: formatMonthLabel(monthKey),
        total: 0,
        count: 0
      });
    }
    const current = grouped.get(monthKey);
    current.total += sale.total;
    current.count += 1;
  });
  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map((entry) => entry[1]);
}

function getItemById(itemId) {
  return state.inventory.find((item) => String(item.id) === String(itemId));
}

function matchesQuery(values, query) {
  if (!query) {
    return true;
  }
  return values.some((value) => String(value || "").toLowerCase().includes(query));
}

function summarizeTransactionItems(transaction) {
  return transaction.items
    .map((item) => `${item.name} x${formatQuantity(item.quantity)}`)
    .join(", ");
}

function createIsoDate(daysAgo, hour = 9, minute = 0) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function createTransactionNumberFromDate(iso, index) {
  const date = new Date(iso);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `TR-${yy}${mm}${dd}-${String(index).padStart(3, "0")}`;
}

function createTransactionNumberForNow() {
  return createTransactionNumberFromDate(new Date().toISOString(), state.sales.length + 1);
}

function describeSelectedPeriod() {
  if (state.ui.reportPeriod === "daily") {
    return formatLongDate(new Date(state.ui.reportDate));
  }
  if (state.ui.reportPeriod === "monthly") {
    return formatMonthLabel(state.ui.reportMonth);
  }
  return state.ui.reportYear;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatCompactCurrency(value) {
  if (!value) {
    return "Rp 0";
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}Jt`;
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)}rb`;
  }
  return formatCurrency(value);
}

function formatPlainNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3
  }).format(Number(value) || 0);
}

function formatQuantity(value) {
  return formatNumber(normalizeQuantity(value));
}

function formatDecimalInput(value) {
  const number = normalizeQuantity(value);
  return Number.isInteger(number)
    ? String(number)
    : String(number).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

function formatShortDateTime(date) {
  return `${formatShortDate(date)} | ${new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date))}`;
}

function formatDayShort(date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short"
  }).format(new Date(date));
}

function formatDateInput(date) {
  const current = new Date(date);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthInput(date) {
  const current = new Date(date);
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function startOfDay(date) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  return current;
}

function addDays(date, amount) {
  const current = new Date(date);
  current.setDate(current.getDate() + amount);
  return current;
}

function parseInteger(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function parseDecimal(value) {
  const normalized = String(value ?? "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function normalizeQuantity(value) {
  return Math.max(0, Math.round(parseDecimal(value) * 1000) / 1000);
}

function getQuantityStep(item) {
  return supportsDecimalQuantity(item) ? 0.25 : 1;
}

function supportsDecimalQuantity(item) {
  const unit = String(item?.unit || "").toLowerCase();
  const decimalUnits = ["kg", "kilo", "gram", "gr", "liter", "ltr", "meter"];
  return decimalUnits.some((current) => unit.includes(current)) || !Number.isInteger(normalizeQuantity(item?.stock));
}

function renderEmptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function showToast(type, title, message) {
  const icons = {
    success: "check_circle",
    danger: "error",
    info: "info"
  };

  const node = document.createElement("div");
  node.className = `toast toast-${type}`;
  node.innerHTML = `
    <span class="material-symbols-outlined">${icons[type] || "info"}</span>
    <div class="toast-copy">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  els.toastContainer.appendChild(node);

  window.setTimeout(() => {
    node.remove();
  }, 3500);
}

function getItemIcon(category) {
  const map = {
    "Material Dasar": "architecture",
    "Perkakas": "hardware",
    "Finishing & Cat": "format_paint",
    "Plumbing & Pipa": "water_drop",
    Struktur: "construction"
  };
  return map[category] || "inventory_2";
}

function normalizeRowForExport(row, headers) {
  return headers.reduce((result, header) => {
    result[header.key] = stripHtml(row[header.key] || "");
    return result;
  }, {});
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return temp.textContent || temp.innerText || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReceiptHtml(receipt) {
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Nota ${escapeHtml(receipt.id)}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 24px; color: #191c1d; }
          .receipt { max-width: 360px; margin: 0 auto; }
          .receipt-brand { margin-bottom: 20px; text-align: center; }
          .receipt-logo { width: 190px; max-width: 100%; height: auto; margin: 0 auto 8px; }
          .brand-note { margin: 0; color: #466270; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
          h1 { margin: 0; font-size: 24px; letter-spacing: -0.04em; }
          p { margin: 4px 0; color: #424752; }
          .block { margin-top: 24px; }
          .row { display: flex; justify-content: space-between; gap: 12px; margin: 10px 0; }
          .item { padding: 12px 0; border-bottom: 1px dashed rgba(25,28,29,.14); }
        .item strong { display: block; margin-bottom: 4px; }
        .total { margin-top: 18px; padding-top: 18px; border-top: 2px solid rgba(25,28,29,.16); }
        .total strong { font-size: 22px; }
      </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-brand">
            <img class="receipt-logo" src="${escapeHtml(BRAND_LOGO)}" alt="${escapeHtml(BRAND_NAME)}">
            <p class="brand-note">${escapeHtml(BRAND_TAGLINE)}</p>
          </div>
          <div class="block">
            <p><strong>${escapeHtml(receipt.id)}</strong></p>
            <p>${escapeHtml(formatShortDateTime(receipt.date))}</p>
        </div>
        <div class="block">
          ${receipt.items.map((item) => `
            <div class="item">
              <strong>${escapeHtml(item.name)}</strong>
              <div class="row">
                <span>${escapeHtml(formatQuantity(item.quantity))} x ${escapeHtml(formatCurrency(item.price))}</span>
                <span>${escapeHtml(formatCurrency(Math.round(normalizeQuantity(item.quantity) * item.price)))}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="block total">
          <div class="row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(receipt.subtotal))}</span></div>
          <div class="row"><span>Diskon</span><span>${escapeHtml(formatCurrency(receipt.discount))}</span></div>
          <div class="row"><strong>Total</strong><strong>${escapeHtml(formatCurrency(receipt.total))}</strong></div>
          <div class="row"><span>Bayar</span><span>${escapeHtml(formatCurrency(receipt.payment))}</span></div>
          <div class="row"><span>Kembalian</span><span>${escapeHtml(formatCurrency(receipt.change))}</span></div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildReportHtml(context) {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan ${escapeHtml(context.type)}</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 40px; color: #191c1d; background: #f8f9fa; }
        .report-brand { margin-bottom: 20px; }
        .report-logo { width: 220px; max-width: 100%; height: auto; }
        h1 { margin: 0; font-size: 36px; letter-spacing: -0.05em; }
        p { color: #424752; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 28px 0; }
        .card { background: #fff; border-radius: 24px; padding: 20px; box-shadow: 0 12px 26px rgba(25,28,29,.06); }
        .card span { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .16em; color: #466270; }
        .card strong { display: block; margin-top: 10px; font-size: 28px; letter-spacing: -0.04em; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 20px; overflow: hidden; }
        th, td { padding: 16px 18px; text-align: left; }
        thead { background: #edeeef; }
        th { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #424752; }
        tbody tr:nth-child(even) { background: #f7f8f9; }
      </style>
    </head>
    <body>
      <div class="report-brand">
        <img class="report-logo" src="${escapeHtml(BRAND_LOGO)}" alt="${escapeHtml(BRAND_NAME)}">
      </div>
      <h1>Laporan ${escapeHtml(context.type === "sales" ? "Penjualan" : "Stok Barang")}</h1>
      <p>Periode ${escapeHtml(describeSelectedPeriod())}</p>
      <div class="summary">
        <div class="card">
          <span>${escapeHtml(context.summary.primaryLabel)}</span>
          <strong>${escapeHtml(context.summary.primaryValue)}</strong>
        </div>
        <div class="card">
          <span>${escapeHtml(context.summary.secondaryLabel)}</span>
          <strong>${escapeHtml(context.summary.secondaryValue)}</strong>
        </div>
        <div class="card">
          <span>${escapeHtml(context.summary.tertiaryLabel)}</span>
          <strong>${escapeHtml(context.summary.tertiaryValue)}</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>${context.headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${context.exportRows.map((row) => `
            <tr>
              ${context.headers.map((header) => `<td>${escapeHtml(row[header.key] || "")}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
