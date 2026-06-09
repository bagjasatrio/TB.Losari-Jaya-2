const POS_ROUTES = window.POS_ROUTES || {};
const INITIAL_BOOTSTRAP = window.POS_BOOTSTRAP || null;
const POS_BRAND = window.POS_BRAND || {};
const BRAND_LOGO = POS_BRAND.logo || "/pos/logolj2.png";
const BRAND_NAME = POS_BRAND.name || "TB. Losari Jaya 2";
const BRAND_TAGLINE = POS_BRAND.tagline || "Industrial Atelier POS";
const DEFAULT_CATEGORY_OPTIONS = Array.isArray(window.LOSARI_CATEGORY_OPTIONS) ? window.LOSARI_CATEGORY_OPTIONS : [];
const DEFAULT_UNIT_OPTIONS = Array.isArray(window.LOSARI_UNIT_OPTIONS) ? window.LOSARI_UNIT_OPTIONS : [];

let state;
let els;
let activeSaleId = null;
let isSyncingInventoryScroll = false;

const ADMIN_VIEWS = ["dashboard", "inventory", "cashier", "finance", "reports", "users", "customers", "void", "returns", "opnames"];
const CASHIER_VIEWS = ["cashier"];

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
    users: [],
    goodsIn: [],
    sales: [],
    voidLogs: [],
    returns: [],
    lastReturn: null,
    opnames: [],
    customers: [],
    cart: [],
    lastReceipt: null,
    auth: {
      isLoggedIn: false,
      userName: "",
      role: "",
      roleLabel: "",
      canManage: false
    },
    ui: {
      activeView: "dashboard",
      isSidebarOpen: false,
      inventoryMode: "catalog",
      inventoryCategory: "all",
      cashierCategory: "Semua",
      reportType: "sales",
      reportPeriod: "monthly",
      reportPrevPeriod: null,
      reportPrevDate: null,
      reportDate: formatDateInput(new Date()),
      reportMonth: formatMonthInput(new Date()),
      reportYear: String(new Date().getFullYear()),
      opnameSearch: "",
      opnameCategory: "all",
      discount: 0,
      payment: 0,
      paymentMethod: "tunai",
      proofBase64: null,
      hutangCustomerName: "",
      hutangPhone: "",
      hutangAddress: "",
      hutangDp: 0,
      customerSearch: ""
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
    users: Array.isArray(bootState?.users) ? bootState.users : empty.users,
    goodsIn: Array.isArray(bootState?.goodsIn) ? bootState.goodsIn : empty.goodsIn,
    sales: Array.isArray(bootState?.sales) ? bootState.sales : empty.sales,
    voidLogs: Array.isArray(bootState?.voidLogs) ? bootState.voidLogs : empty.voidLogs,
    opnames: Array.isArray(bootState?.opnames) ? bootState.opnames : empty.opnames,
    customers: Array.isArray(bootState?.customers) ? bootState.customers : empty.customers,
    returns: Array.isArray(bootState?.returns) ? bootState.returns : empty.returns,
    lastReturn: bootState?.lastReturn || null,
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
      inventoryMode: state.ui.inventoryMode,
      inventoryCategory: state.ui.inventoryCategory,
      cashierCategory: state.ui.cashierCategory,
      reportType: state.ui.reportType,
      reportPeriod: state.ui.reportPeriod,
      reportPrevPeriod: state.ui.reportPrevPeriod,
      reportPrevDate: state.ui.reportPrevDate,
      reportDate: state.ui.reportDate,
      reportMonth: state.ui.reportMonth,
      reportYear: state.ui.reportYear
    };
  }

  const allowedViews = getAllowedViews(next.auth);
  if (!allowedViews.includes(next.ui.activeView)) {
    next.ui.activeView = allowedViews[0] || "cashier";
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
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().find(Boolean)
      : null;
    const message = translateApiMessage(validationMessage || payload?.message || "Terjadi kesalahan saat memproses permintaan.");
    throw new Error(message);
  }

  // Update CSRF token from response if provided (handles session regeneration)
  if (payload?.csrfToken) {
    document.querySelector('meta[name="csrf-token"]')?.setAttribute("content", payload.csrfToken);
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
    headerRoleLabel: document.getElementById("headerRoleLabel"),
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
    inventoryTableShell: document.querySelector("[data-scroll-target='inventory']"),
    inventoryScrollSync: document.querySelector("[data-scroll-sync='inventory']"),
    inventoryScrollSyncInner: document.querySelector("[data-scroll-sync='inventory'] > div"),
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
    reportBackBtn: document.getElementById("reportBackBtn"),
    financeRevenue: document.getElementById("financeRevenue"),
    financeExpense: document.getElementById("financeExpense"),
    financeGrossProfit: document.getElementById("financeGrossProfit"),
    financeGrossProfitHint: document.getElementById("financeGrossProfitHint"),
    financeProfit: document.getElementById("financeProfit"),
    financeMargin: document.getElementById("financeMargin"),
    financeIncomeHint: document.getElementById("financeIncomeHint"),
    financeExpenseHint: document.getElementById("financeExpenseHint"),
    financeProfitHint: document.getElementById("financeProfitHint"),
    financeMarginHint: document.getElementById("financeMarginHint"),
    financeLedgerBody: document.getElementById("financeLedgerBody"),
    userForm: document.getElementById("userForm"),
    userName: document.getElementById("userName"),
    userUsername: document.getElementById("userUsername"),
    userRole: document.getElementById("userRole"),
    userPassword: document.getElementById("userPassword"),
    userEmail: document.getElementById("userEmail"),
    userSummaryCount: document.getElementById("userSummaryCount"),
    userTableBody: document.getElementById("userTableBody"),
    userModal: document.getElementById("userModal"),
    userModalBackdrop: document.getElementById("userModalBackdrop"),
    closeUserModalBtn: document.getElementById("closeUserModalBtn"),
    cancelUserModalBtn: document.getElementById("cancelUserModalBtn"),
    userEditForm: document.getElementById("userEditForm"),
    userEditId: document.getElementById("userEditId"),
    userEditName: document.getElementById("userEditName"),
    userEditUsername: document.getElementById("userEditUsername"),
    userEditRole: document.getElementById("userEditRole"),
    userEditPassword: document.getElementById("userEditPassword"),
    userEditEmail: document.getElementById("userEditEmail"),
    itemModal: document.getElementById("itemModal"),
    itemModalBackdrop: document.getElementById("itemModalBackdrop"),
    closeItemModalBtn: document.getElementById("closeItemModalBtn"),
    cancelItemModalBtn: document.getElementById("cancelItemModalBtn"),
    voidTransactionBtn: document.getElementById("voidTransactionBtn"),
    voidModal: document.getElementById("voidModal"),
    voidModalBackdrop: document.getElementById("voidModalBackdrop"),
    closeVoidModalBtn: document.getElementById("closeVoidModalBtn"),
    cancelVoidBtn: document.getElementById("cancelVoidBtn"),
    confirmVoidBtn: document.getElementById("confirmVoidBtn"),
    voidReasonInput: document.getElementById("voidReasonInput"),
    voidSaleId: document.getElementById("voidSaleId"),
    voidSaleDate: document.getElementById("voidSaleDate"),
    voidSaleTotal: document.getElementById("voidSaleTotal"),
    voidSaleItems: document.getElementById("voidSaleItems"),
    voidSearch: document.getElementById("voidSearch"),
    voidTableBody: document.getElementById("voidTableBody"),
    returnTotalCount: document.getElementById("returnTotalCount"),
    returnTotalRefund: document.getElementById("returnTotalRefund"),
    returnRefundHint: document.getElementById("returnRefundHint"),
    returnItemCount: document.getElementById("returnItemCount"),
    returnItemHint: document.getElementById("returnItemHint"),
    returnSearch: document.getElementById("returnSearch"),
    returnTableBody: document.getElementById("returnTableBody"),
    returnModal: document.getElementById("returnModal"),
    returnModalBackdrop: document.getElementById("returnModalBackdrop"),
    returnModalTitle: document.getElementById("returnModalTitle"),
    returnModalMeta: document.getElementById("returnModalMeta"),
    returnSaleId: document.getElementById("returnSaleId"),
    returnSaleDate: document.getElementById("returnSaleDate"),
    returnSaleTotal: document.getElementById("returnSaleTotal"),
    returnItemsList: document.getElementById("returnItemsList"),
    returnReasonInput: document.getElementById("returnReasonInput"),
    returnRefundTotal: document.getElementById("returnRefundTotal"),
    returnForm: document.getElementById("returnForm"),
    returnTransactionBtn: document.getElementById("returnTransactionBtn"),
    openReturnModalBtn: document.getElementById("openReturnModalBtn"),
    confirmReturnBtn: document.getElementById("confirmReturnBtn"),
    cancelReturnBtn: document.getElementById("cancelReturnBtn"),
    closeReturnModalBtn: document.getElementById("closeReturnModalBtn"),
    voidTotalCount: document.getElementById("voidTotalCount"),
    voidTotalNominal: document.getElementById("voidTotalNominal"),
    voidTotalHint: document.getElementById("voidTotalHint"),
    voidRestoredCount: document.getElementById("voidRestoredCount"),
    voidRestoredHint: document.getElementById("voidRestoredHint"),
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
    itemPurchasePrice: document.getElementById("itemPurchasePrice"),
    itemDescription: document.getElementById("itemDescription"),
    supplierModal: document.getElementById("supplierModal"),
    supplierModalBackdrop: document.getElementById("supplierModalBackdrop"),
    closeSupplierModalBtn: document.getElementById("closeSupplierModalBtn"),
    cancelSupplierModalBtn: document.getElementById("cancelSupplierModalBtn"),
    supplierModalTitle: document.getElementById("supplierModalTitle"),
    supplierForm: document.getElementById("supplierForm"),
    supplierId: document.getElementById("supplierId"),
    supplierName: document.getElementById("supplierName"),
    transactionModal: document.getElementById("transactionModal"),
    transactionModalBackdrop: document.getElementById("transactionModalBackdrop"),
    closeTransactionModalBtn: document.getElementById("closeTransactionModalBtn"),
    printTransactionModalBtn: document.getElementById("printTransactionModalBtn"),
    closeTransactionBtn: document.getElementById("closeTransactionBtn"),
    transactionModalTitle: document.getElementById("transactionModalTitle"),
    transactionModalMeta: document.getElementById("transactionModalMeta"),
    transactionDetailItems: document.getElementById("transactionDetailItems"),
    transactionDetailSummary: document.getElementById("transactionDetailSummary"),
    // Opname
    openOpnameBtn: document.getElementById("openOpnameBtn"),
    opnameSearch: document.getElementById("opnameSearch"),
    opnameTableBody: document.getElementById("opnameTableBody"),
    opnameTotalCount: document.getElementById("opnameTotalCount"),
    opnameTotalHint: document.getElementById("opnameTotalHint"),
    opnameDiscrepancyCount: document.getElementById("opnameDiscrepancyCount"),
    opnameDiscrepancyHint: document.getElementById("opnameDiscrepancyHint"),
    opnameAdjustmentTotal: document.getElementById("opnameAdjustmentTotal"),
    opnameAdjustmentHint: document.getElementById("opnameAdjustmentHint"),
    opnameModal: document.getElementById("opnameModal"),
    opnameModalBackdrop: document.getElementById("opnameModalBackdrop"),
    closeOpnameModalBtn: document.getElementById("closeOpnameModalBtn"),
    cancelOpnameBtn: document.getElementById("cancelOpnameBtn"),
    confirmOpnameBtn: document.getElementById("confirmOpnameBtn"),
    opnameModalSearch: document.getElementById("opnameModalSearch"),
    opnameCategoryFilter: document.getElementById("opnameCategoryFilter"),
    opnameModalBody: document.getElementById("opnameModalBody"),
    opnameSummaryTotal: document.getElementById("opnameSummaryTotal"),
    opnameSummaryMatched: document.getElementById("opnameSummaryMatched"),
    opnameSummaryDiscrepancy: document.getElementById("opnameSummaryDiscrepancy"),
    opnameSummaryAdjustment: document.getElementById("opnameSummaryAdjustment"),
    opnameNotesInput: document.getElementById("opnameNotesInput"),
    confirmModal: document.getElementById("confirmModal"),
    changePasswordBtn: document.getElementById("changePasswordBtn"),
    passwordModal: document.getElementById("passwordModal"),
    passwordModalBackdrop: document.getElementById("passwordModalBackdrop"),
    closePasswordModalBtn: document.getElementById("closePasswordModalBtn"),
    cancelPasswordBtn: document.getElementById("cancelPasswordBtn"),
    passwordForm: document.getElementById("passwordForm"),
    passwordCurrent: document.getElementById("passwordCurrent"),
    passwordNew: document.getElementById("passwordNew"),
    passwordConfirm: document.getElementById("passwordConfirm"),
    confirmModalBackdrop: document.getElementById("confirmModalBackdrop"),
    closeConfirmModalBtn: document.getElementById("closeConfirmModalBtn"),
    cancelConfirmBtn: document.getElementById("cancelConfirmBtn"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
    confirmModalEyebrow: document.getElementById("confirmModalEyebrow"),
    confirmModalTitle: document.getElementById("confirmModalTitle"),
    confirmModalWarningTitle: document.getElementById("confirmModalWarningTitle"),
    confirmModalMessage: document.getElementById("confirmModalMessage"),
    confirmItemName: document.getElementById("confirmItemName"),
    confirmItemBox: document.getElementById("confirmItemBox"),
    // Payment
    paymentMethodInput: document.getElementById("paymentMethodInput"),
    paymentBoxTunai: document.getElementById("paymentBoxTunai"),
    // Hutang fields (kasir)
    hutangFields: document.getElementById("hutangFields"),
    hutangCustomerInput: document.getElementById("hutangCustomerInput"),
    customerAutocomplete: document.getElementById("customerAutocomplete"),
    hutangPhoneInput: document.getElementById("hutangPhoneInput"),
    hutangAddressInput: document.getElementById("hutangAddressInput"),
    hutangDpInput: document.getElementById("hutangDpInput"),
    // Customer page
    addCustomerBtn: document.getElementById("addCustomerBtn"),
    customerSearch: document.getElementById("customerSearch"),
    customerTableBody: document.getElementById("customerTableBody"),
    customerMetricTotal: document.getElementById("customerMetricTotal"),
    customerMetricHint: document.getElementById("customerMetricHint"),
    customerMetricDebt: document.getElementById("customerMetricDebt"),
    customerMetricDebtHint: document.getElementById("customerMetricDebtHint"),
    // Customer modal
    customerModal: document.getElementById("customerModal"),
    customerModalBackdrop: document.getElementById("customerModalBackdrop"),
    closeCustomerModalBtn: document.getElementById("closeCustomerModalBtn"),
    cancelCustomerModalBtn: document.getElementById("cancelCustomerModalBtn"),
    customerModalTitle: document.getElementById("customerModalTitle"),
    customerForm: document.getElementById("customerForm"),
    customerFormId: document.getElementById("customerFormId"),
    customerFormName: document.getElementById("customerFormName"),
    customerFormPhone: document.getElementById("customerFormPhone"),
    customerFormAddress: document.getElementById("customerFormAddress"),
    customerFormNotes: document.getElementById("customerFormNotes"),
    // Customer detail modal
    customerDetailModal: document.getElementById("customerDetailModal"),
    customerDetailBackdrop: document.getElementById("customerDetailBackdrop"),
    closeCustomerDetailBtn: document.getElementById("closeCustomerDetailBtn"),
    customerDetailTitle: document.getElementById("customerDetailTitle"),
    customerDetailMeta: document.getElementById("customerDetailMeta"),
    customerDetailInfo: document.getElementById("customerDetailInfo"),
    customerDetailTotalDebt: document.getElementById("customerDetailTotalDebt"),
    customerDebtList: document.getElementById("customerDebtList"),
    // Bukti pembayaran
    proofFileInput: document.getElementById("proofFileInput"),
    proofUploadBtn: document.getElementById("proofUploadBtn"),
    proofPreview: document.getElementById("proofPreview"),
    proofPreviewImg: document.getElementById("proofPreviewImg"),
    proofFileName: document.getElementById("proofFileName"),
    proofFileSize: document.getElementById("proofFileSize"),
    proofClearBtn: document.getElementById("proofClearBtn"),
    copyButtons: document.querySelectorAll(".copy-btn")
  };
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.menuToggle.addEventListener("click", toggleSidebar);
  els.sidebarOverlay.addEventListener("click", closeSidebar);
  els.logoutBtn.addEventListener("click", logout);
  els.resetDemoBtn.addEventListener("click", resetDemo);
  if (els.changePasswordBtn) {
    els.changePasswordBtn.addEventListener("click", openPasswordModal);
  }
  if (els.closePasswordModalBtn) {
    els.closePasswordModalBtn.addEventListener("click", closePasswordModal);
  }
  if (els.cancelPasswordBtn) {
    els.cancelPasswordBtn.addEventListener("click", closePasswordModal);
  }
  if (els.passwordModalBackdrop) {
    els.passwordModalBackdrop.addEventListener("click", closePasswordModal);
  }
  if (els.passwordForm) {
    els.passwordForm.addEventListener("submit", handlePasswordChange);
  }

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
  bindInventoryScrollSync();
  window.addEventListener("resize", updateInventoryScrollSync);
  els.supplierTableBody.addEventListener("click", handleSupplierTableClick);
  els.categoryMasterForm.addEventListener("submit", handleCategoryMasterSubmit);
  els.unitMasterForm.addEventListener("submit", handleUnitMasterSubmit);
  els.incomingForm.addEventListener("submit", handleIncomingSubmit);
  els.recentSalesList.addEventListener("click", handleSaleActionClick);
  if (els.voidTableBody) {
    els.voidTableBody.addEventListener("click", handleVoidTableClick);
  }

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
    state.ui.reportPrevPeriod = null;
    state.ui.reportPrevDate = null;
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
  els.reportTableBody.addEventListener("click", handleReportTableClick);
  if (els.reportBackBtn) {
    els.reportBackBtn.addEventListener("click", handleReportBackClick);
  }
  els.userForm.addEventListener("submit", handleUserSubmit);

  els.voidTransactionBtn.addEventListener("click", openVoidModal);
  els.closeVoidModalBtn.addEventListener("click", closeVoidModal);
  els.cancelVoidBtn.addEventListener("click", closeVoidModal);
  els.voidModalBackdrop.addEventListener("click", closeVoidModal);
  els.confirmVoidBtn.addEventListener("click", handleVoidConfirm);
  els.voidReasonInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleVoidConfirm();
    }
  });
  if (els.voidSearch) {
    els.voidSearch.addEventListener("input", handleVoidSearch);
  }

  // Return event listeners
  if (els.returnSearch) {
    els.returnSearch.addEventListener("input", handleReturnSearch);
  }
  if (els.returnTransactionBtn) {
    els.returnTransactionBtn.addEventListener("click", openReturnModal);
  }
  if (els.closeReturnModalBtn) {
    els.closeReturnModalBtn.addEventListener("click", closeReturnModal);
  }
  if (els.returnModalBackdrop) {
    els.returnModalBackdrop.addEventListener("click", closeReturnModal);
  }
  if (els.cancelReturnBtn) {
    els.cancelReturnBtn.addEventListener("click", closeReturnModal);
  }
  if (els.confirmReturnBtn) {
    els.confirmReturnBtn.addEventListener("click", handleReturnSubmit);
  }

  // Opname event listeners
  if (els.openOpnameBtn) {
    els.openOpnameBtn.addEventListener("click", openOpnameModal);
  }
  if (els.opnameSearch) {
    els.opnameSearch.addEventListener("input", function () { renderAll(); });
  }
  if (els.opnameTableBody) {
    els.opnameTableBody.addEventListener("click", handleOpnameTableClick);
  }
  if (els.closeOpnameModalBtn) {
    els.closeOpnameModalBtn.addEventListener("click", closeOpnameModal);
  }
  if (els.opnameModalBackdrop) {
    els.opnameModalBackdrop.addEventListener("click", closeOpnameModal);
  }
  if (els.cancelOpnameBtn) {
    els.cancelOpnameBtn.addEventListener("click", closeOpnameModal);
  }
  if (els.confirmOpnameBtn) {
    els.confirmOpnameBtn.addEventListener("click", handleOpnameSubmit);
  }
  if (els.opnameModalSearch) {
    els.opnameModalSearch.addEventListener("input", handleOpnameModalFilter);
  }
  if (els.opnameCategoryFilter) {
    els.opnameCategoryFilter.addEventListener("change", handleOpnameModalFilter);
  }

  // User modal event listeners
  if (els.userTableBody) {
    els.userTableBody.addEventListener("click", handleUserTableClick);
  }
  if (els.userEditForm) {
    els.userEditForm.addEventListener("submit", handleUserEditSubmit);
  }
  if (els.closeUserModalBtn) {
    els.closeUserModalBtn.addEventListener("click", closeUserModal);
  }
  if (els.cancelUserModalBtn) {
    els.cancelUserModalBtn.addEventListener("click", closeUserModal);
  }
  if (els.userModalBackdrop) {
    els.userModalBackdrop.addEventListener("click", closeUserModal);
  }

  els.closeItemModalBtn.addEventListener("click", closeItemModal);
  els.cancelItemModalBtn.addEventListener("click", closeItemModal);
  els.itemModalBackdrop.addEventListener("click", closeItemModal);
  els.itemForm.addEventListener("submit", handleItemSubmit);
  els.closeSupplierModalBtn.addEventListener("click", closeSupplierModal);
  els.cancelSupplierModalBtn.addEventListener("click", closeSupplierModal);
  els.supplierModalBackdrop.addEventListener("click", closeSupplierModal);
  els.supplierForm.addEventListener("submit", handleSupplierSubmit);
  els.closeTransactionModalBtn.addEventListener("click", closeTransactionModal);
  els.transactionModalBackdrop.addEventListener("click", closeTransactionModal);
  els.printTransactionModalBtn.addEventListener("click", () => printSaleReceipt(activeSaleId));
  els.closeTransactionBtn.addEventListener("click", closeTransactionModal);
  els.confirmModalBackdrop.addEventListener("click", closeConfirmModal);
  els.closeConfirmModalBtn.addEventListener("click", closeConfirmModal);
  els.cancelConfirmBtn.addEventListener("click", closeConfirmModal);
  els.confirmDeleteBtn.addEventListener("click", handleConfirmDelete);

  if (els.paymentMethodInput) {
    els.paymentMethodInput.addEventListener("change", handlePaymentMethodChange);
  }
  if (els.addCustomerBtn) {
    els.addCustomerBtn.addEventListener("click", () => openCustomerModal(null));
  }
  if (els.customerSearch) {
    els.customerSearch.addEventListener("input", () => renderCustomers());
  }
  if (els.closeCustomerModalBtn) els.closeCustomerModalBtn.addEventListener("click", closeCustomerModal);
  if (els.cancelCustomerModalBtn) els.cancelCustomerModalBtn.addEventListener("click", closeCustomerModal);
  if (els.customerModalBackdrop) els.customerModalBackdrop.addEventListener("click", closeCustomerModal);
  if (els.customerForm) els.customerForm.addEventListener("submit", handleCustomerSubmit);
  if (els.closeCustomerDetailBtn) els.closeCustomerDetailBtn.addEventListener("click", closeCustomerDetail);
  if (els.customerDetailBackdrop) els.customerDetailBackdrop.addEventListener("click", closeCustomerDetail);
  if (els.hutangCustomerInput) {
    els.hutangCustomerInput.addEventListener("input", handleHutangCustomerInput);
    els.hutangCustomerInput.addEventListener("blur", () => {
      setTimeout(() => { if (els.customerAutocomplete) els.customerAutocomplete.classList.add("hidden"); }, 150);
    });
  }
  if (els.hutangPhoneInput) {
    els.hutangPhoneInput.addEventListener("input", (e) => { state.ui.hutangPhone = e.target.value; });
  }
  if (els.hutangAddressInput) {
    els.hutangAddressInput.addEventListener("input", (e) => { state.ui.hutangAddress = e.target.value; });
  }
  if (els.hutangDpInput) {
    els.hutangDpInput.addEventListener("input", (e) => { state.ui.hutangDp = parseInteger(e.target.value); });
  }
  if (els.proofUploadBtn) {
    els.proofUploadBtn.addEventListener("click", () => els.proofFileInput?.click());
  }
  if (els.proofFileInput) {
    els.proofFileInput.addEventListener("change", handleProofFileChange);
  }
  if (els.proofClearBtn) {
    els.proofClearBtn.addEventListener("click", clearProof);
  }
  if (els.proofPreviewImg) {
    els.proofPreviewImg.addEventListener("click", () => {
      if (state.ui.proofBase64) window.open(state.ui.proofBase64, "_blank", "noopener");
    });
  }
  if (els.copyButtons) {
    els.copyButtons.forEach(btn => {
      btn.addEventListener("click", handleCopyClick);
    });
  }
}

function bindInventoryScrollSync() {
  const topScroll = els.inventoryScrollSync;
  const tableScroll = els.inventoryTableShell;

  if (!topScroll || !tableScroll) {
    return;
  }

  topScroll.addEventListener("scroll", () => syncInventoryScroll(topScroll, tableScroll));
  tableScroll.addEventListener("scroll", () => syncInventoryScroll(tableScroll, topScroll));
}

function syncInventoryScroll(source, target) {
  if (isSyncingInventoryScroll) {
    return;
  }

  isSyncingInventoryScroll = true;
  target.scrollLeft = source.scrollLeft;
  requestAnimationFrame(() => {
    isSyncingInventoryScroll = false;
  });
}

function updateInventoryScrollSync() {
  const topScroll = els.inventoryScrollSync;
  const topScrollInner = els.inventoryScrollSyncInner;
  const tableScroll = els.inventoryTableShell;

  if (!topScroll || !topScrollInner || !tableScroll) {
    return;
  }

  const scrollWidth = tableScroll.scrollWidth;
  const canScroll = scrollWidth > tableScroll.clientWidth + 1;

  topScrollInner.style.width = `${scrollWidth}px`;
  topScroll.classList.toggle("hidden", !canScroll);
  topScroll.scrollLeft = tableScroll.scrollLeft;
}

function createSeedState() {
  const seed = createOperationalSeed(createInventorySeed());
  const supplierName = "TB. Losari Jaya 2";

  return {
    version: "excel-inventory-state",
    inventory: seed.inventory,
    categories: getSeedCategoryOptions(seed.inventory),
    units: getSeedUnitOptions(seed.inventory),
    suppliers: [{ id: "SUP-001", name: supplierName, itemsCount: seed.inventory.length, receiptsCount: seed.goodsIn.length }],
    users: [],
    goodsIn: seed.goodsIn,
    sales: seed.sales,
    cart: [],
    lastReceipt: seed.sales[0] || null,
    auth: {
      isLoggedIn: false,
      userName: "Admin Losari",
      role: "admin",
      roleLabel: "Admin",
      canManage: true
    },
    ui: {
      activeView: "dashboard",
      isSidebarOpen: false,
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

function createInventorySeed() {
  const source = Array.isArray(window.LOSARI_INVENTORY_DATA) ? window.LOSARI_INVENTORY_DATA : [];

  return source.map((item, index) => {
    const sku = String(item.sku || item.id || "LJ2-" + String(index + 1).padStart(3, "0"));
    const priceTexts = getItemPriceTexts(item);

    return {
      id: String(item.id || sku),
      sku,
      name: String(item.name || "Barang Tanpa Nama"),
      category: String(item.category || "Tanpa Kategori"),
      unit: String(item.unit || "pcs"),
      supplier: String(item.supplier || "TB. Losari Jaya 2"),
      stock: normalizeQuantity(item.stock),
      minStock: normalizeQuantity(item.minStock ?? 1),
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      basePriceText: priceTexts.base,
      storePriceText: priceTexts.store,
      retailPriceText: priceTexts.retail,
      description: String(item.description || "")
    };
  });
}

function createOperationalSeed(inventory) {
  const seededInventory = inventory.map((item, index) => {
    const stock = normalizeQuantity(item.stock) > 0 ? normalizeQuantity(item.stock) : deriveSeedStock(item, index);

    return {
      ...item,
      stock,
      minStock: deriveSeedMinStock(item, index, stock)
    };
  });

  const goodsIn = createGoodsInSeed(seededInventory);
  const sales = createSalesSeed(seededInventory);

  return {
    inventory: seededInventory,
    goodsIn,
    sales
  };
}

function createGoodsInSeed(inventory) {
  return inventory
    .filter((item, index) => item.price > 0 && (index < 12 || index % 7 === 0))
    .slice(0, 24)
    .map((item, index) => {
      const quantity = deriveRestockQuantity(item, index);
      const cost = parsePriceTextNumber(item.basePriceText) || Math.round(item.price * 0.85);

      return {
        id: index + 1,
        date: createIsoDate((index % 12) + 1, 8 + (index % 5), 0),
        itemId: item.id,
        itemName: item.name,
        quantity,
        cost,
        supplier: item.supplier || "TB. Losari Jaya 2",
        note: `Restock awal ${item.category} berdasarkan dataset Excel.`
      };
    });
}

function createSalesSeed(inventory) {
  const candidates = inventory.filter((item) => item.price > 0 && item.stock > item.minStock);
  const daysAgo = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  if (!candidates.length) {
    return [];
  }

  return daysAgo
    .map((day, index) => {
      const date = createIsoDate(day, 8 + (index % 9), (index * 10) % 60);
      const itemCount = 1 + (index % 3);
      const usedIds = new Set();
      const items = [];

      for (let offset = 0; offset < itemCount; offset += 1) {
        const item = candidates[(index * 7 + offset * 13) % candidates.length];
        if (!item || usedIds.has(item.id)) {
          continue;
        }

        usedIds.add(item.id);
        const quantity = deriveSaleQuantity(item, index + offset);
        items.push({
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity,
          price: item.price
        });
      }

      const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * item.quantity), 0);
      const discount = subtotal > 250000 && index % 3 === 0 ? roundToNearest(Math.min(subtotal * 0.03, 25000), 1000) : 0;
      const total = Math.max(0, subtotal - discount);
      const payment = roundUpTo(total, 10000);

      return {
        id: createTransactionNumberFromDate(date, index + 1),
        date,
        items,
        subtotal,
        discount,
        total,
        payment,
        change: payment - total
      };
    })
    .filter((sale) => sale.items.length && sale.total > 0)
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

function deriveSeedStock(item, index) {
  const price = Number(item.price || 0);
  const unit = String(item.unit || "").toLowerCase();
  let stock = 20 + (index % 14) * 2;

  if (unit.includes("kg")) {
    stock = 12 + (index % 8) * 2;
  } else if (unit.includes("sak")) {
    stock = 10 + (index % 6) * 3;
  } else if (unit.includes("btg")) {
    stock = 16 + (index % 10) * 3;
  } else if (unit.includes("roll")) {
    stock = 8 + (index % 6) * 2;
  } else if (unit.includes("lembar")) {
    stock = 14 + (index % 7) * 3;
  }

  if (price >= 1000000) {
    stock = Math.max(2, Math.round(stock * 0.25));
  } else if (price >= 500000) {
    stock = Math.max(3, Math.round(stock * 0.35));
  } else if (price >= 200000) {
    stock = Math.max(5, Math.round(stock * 0.55));
  }

  if ((index + 1) % 17 === 0) {
    stock = Math.max(1, Math.min(stock, 3));
  }

  return normalizeQuantity(stock);
}

function deriveSeedMinStock(item, index, stock) {
  const currentMinStock = normalizeQuantity(item.minStock);

  if (currentMinStock > 1) {
    return currentMinStock;
  }

  if ((index + 1) % 17 === 0) {
    return Math.max(2, normalizeQuantity(stock + 1));
  }

  return Math.max(1, Math.min(12, Math.round(stock * 0.2)));
}

function deriveRestockQuantity(item, index) {
  const unit = String(item.unit || "").toLowerCase();

  if (unit.includes("kg")) {
    return 5 + (index % 5) * 2;
  }

  if (unit.includes("sak")) {
    return 8 + (index % 4) * 4;
  }

  if (unit.includes("roll")) {
    return 4 + (index % 4) * 2;
  }

  return 10 + (index % 6) * 3;
}

function deriveSaleQuantity(item, seed) {
  const unit = String(item.unit || "").toLowerCase();
  const price = Number(item.price || 0);
  const available = Math.max(1, Math.floor(normalizeQuantity(item.stock) - normalizeQuantity(item.minStock)));
  let quantity = 1 + (seed % 3);

  if (unit.includes("kg")) {
    quantity = [0.5, 1, 2][seed % 3];
  } else if (price >= 500000) {
    quantity = 1;
  } else if (price < 25000) {
    quantity = 2 + (seed % 5);
  }

  return normalizeQuantity(Math.min(quantity, available));
}

function parsePriceTextNumber(value) {
  const number = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function roundToNearest(value, step) {
  return Math.round(value / step) * step;
}

function roundUpTo(value, step) {
  return Math.ceil(value / step) * step;
}

function getItemPriceTexts(item) {
  const description = String(item.description || "");
  const hasTieredPrices =
    item.basePriceText !== undefined ||
    item.storePriceText !== undefined ||
    item.retailPriceText !== undefined ||
    /Harga dasar:|Harga toko:|Harga eceran:/i.test(description);
  const retailFallback = !hasTieredPrices && Number(item.price) > 0 ? formatCurrency(Number(item.price)) : "-";

  return {
    base: normalizePriceText(item.basePriceText ?? extractPriceText(description, "Harga dasar")),
    store: normalizePriceText(item.storePriceText ?? extractPriceText(description, "Harga toko")),
    retail: normalizePriceText((item.retailPriceText ?? extractPriceText(description, "Harga eceran")) || retailFallback)
  };
}

function renderProfitCell(item) {
  const purchasePrice = Number(item.purchasePrice || 0);
  const sellPrice = Number(item.price || 0);

  if (purchasePrice <= 0 && sellPrice <= 0) {
    return '<span class="muted">-</span>';
  }

  if (purchasePrice <= 0) {
    const margin = sellPrice;
    return `
      <div class="profit-cell">
        <strong class="profit-positive">${formatCurrency(margin)}</strong>
        <small class="profit-margin">100%</small>
      </div>
    `;
  }

  if (sellPrice <= 0) {
    return `<span class="muted">-</span>`;
  }

  const profitPerUnit = sellPrice - purchasePrice;
  const margin = (profitPerUnit / sellPrice) * 100;
  const profitClass = profitPerUnit >= 0 ? "profit-positive" : "profit-negative";

  return `
    <div class="profit-cell">
      <strong class="${profitClass}">${formatCurrency(profitPerUnit)}</strong>
      <small class="profit-margin">${formatNumber(margin)}%</small>
    </div>
  `;
}

function extractPriceText(description, label) {
  const marker = `${label}:`;
  const start = description.toLowerCase().indexOf(marker.toLowerCase());

  if (start === -1) {
    return "";
  }

  const tail = description.slice(start + marker.length);
  const separators = [" | Harga dasar:", " | Harga toko:", " | Harga eceran:", " | Sumber:"]
    .map((separator) => tail.toLowerCase().indexOf(separator.toLowerCase()))
    .filter((position) => position >= 0);
  const end = separators.length ? Math.min(...separators) : tail.length;

  return tail.slice(0, end).trim();
}

function normalizePriceText(value) {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "undefined" ? text : "-";
}

function getSeedCategoryOptions(inventory) {
  return Array.isArray(window.LOSARI_CATEGORY_OPTIONS)
    ? [...window.LOSARI_CATEGORY_OPTIONS]
    : uniqueSorted(inventory.map((item) => item.category));
}

function getSeedUnitOptions(inventory) {
  return Array.isArray(window.LOSARI_UNIT_OPTIONS)
    ? [...window.LOSARI_UNIT_OPTIONS]
    : uniqueSorted(inventory.map((item) => item.unit));
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
  renderFinance();
  renderUsers();
  renderVoid();
  renderReturn();
  renderOpnames();
  renderCustomers();
  updateReportControls();
  updateInventoryMode();
}

function syncAuthView() {
  els.loginView.classList.toggle("hidden", state.auth.isLoggedIn);
  els.appView.classList.toggle("hidden", !state.auth.isLoggedIn);
}

function updateSidebarAndPage() {
  const allowedViews = getAllowedViews();
  if (!allowedViews.includes(state.ui.activeView)) {
    state.ui.activeView = allowedViews[0] || "cashier";
  }

  els.navItems.forEach((item) => {
    const allowed = allowedViews.includes(item.dataset.nav);
    item.classList.toggle("hidden", !allowed);
    item.classList.toggle("active", item.dataset.nav === state.ui.activeView);
  });

  els.pages.forEach((page) => {
    const allowed = allowedViews.includes(page.dataset.view);
    page.classList.toggle("hidden", !allowed);
    page.classList.toggle("active", allowed && page.dataset.view === state.ui.activeView);
  });

  els.resetDemoBtn.classList.toggle("hidden", !isAdmin());
  els.globalSearch.closest(".search-field")?.classList.toggle("hidden", isCashier());
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
    },
    finance: {
      eyebrow: "Keuangan",
      title: "Keuangan Toko",
      subtitle: "Pantau pendapatan, pengeluaran, keuntungan, dan margin toko."
    },
    users: {
      eyebrow: "Akun",
      title: "Manajemen Pengguna",
      subtitle: "Tambah akun admin dan kasir sesuai kebutuhan operasional."
    },
    void: {
      eyebrow: "Void",
      title: "Manajemen Void Transaksi",
      subtitle: "Batalkan transaksi, kembalikan stok, dan lihat riwayat void."
    },
    returns: {
      eyebrow: "Retur",
      title: "Retur Penjualan",
      subtitle: "Riwayat retur barang dari transaksi yang sudah selesai."
    },
    opnames: {
      eyebrow: "Stok Opname",
      title: "Stok Opname",
      subtitle: "Pencocokan stok fisik dengan stok sistem dan riwayat penyesuaian."
    },
    customers: {
      eyebrow: "Pelanggan",
      title: "Manajemen Pelanggan",
      subtitle: "Data pelanggan, hutang outstanding, dan riwayat pembayaran cicilan."
    },
  }[state.ui.activeView] || {
    eyebrow: "Kasir",
    title: "Transaksi Penjualan",
    subtitle: "Pilih barang, proses pembayaran, dan cetak nota."
  };

  els.headerEyebrow.textContent = copy.eyebrow;
  els.headerTitle.textContent = copy.title;
  els.headerSubtitle.textContent = copy.subtitle;
  els.headerDate.textContent = formatLongDate(new Date());
  els.headerRoleLabel.textContent = state.auth.roleLabel || (isCashier() ? "Kasir" : "Admin");
}

function syncSearchInputs() {
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
  const todaySales = getNonReturnedSales().filter((s) => formatDateInput(new Date(s.date)) === formatDateInput(today));
  const yesterdaySales = getNonReturnedSales().filter((s) => formatDateInput(new Date(s.date)) === formatDateInput(yesterday));
  const lowStockItems = getLowStockItems();
  const query = (els.globalSearch?.value || "").trim().toLowerCase();

  const todayRevenue = todaySales.filter(s => !isSaleVoid(s)).reduce((sum, sale) => sum + sale.total, 0);
  const yesterdayRevenue = yesterdaySales.filter(s => !isSaleVoid(s)).reduce((sum, sale) => sum + sale.total, 0);
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
      : `${revenueDelta > 0 ? "+" : "-"} ${formatCurrency(yesterdayRevenue)} pendapatan kemarin`;

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

  const showAllLowStock = query.length > 0;
  const maxVisible = 5;
  const hasMore = filteredLowStock.length > maxVisible;
  const displayedItems = showAllLowStock ? filteredLowStock : filteredLowStock.slice(0, maxVisible);

  els.lowStockList.innerHTML = filteredLowStock.length
    ? displayedItems
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
      .join("") +
      (hasMore && !showAllLowStock
        ? `<button type="button" class="link-button" id="showAllLowStockBtn" style="width:100%;margin-top:0.75rem;padding:0.5rem;font-size:0.875rem;color:var(--color-primary);background:none;border:1px solid var(--color-border);border-radius:0.5rem;cursor:pointer">Lihat selengkapnya (${filteredLowStock.length - maxVisible} lainnya)</button>`
        : "")
    : renderEmptyState("Tidak ada barang stok minimum yang sesuai dengan pencarian.");

  document.getElementById("showAllLowStockBtn")?.addEventListener("click", function showAll() {
    els.lowStockList.innerHTML = filteredLowStock
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
      .join("") +
      `<button type="button" class="link-button" id="minimizeLowStockBtn" style="width:100%;margin-top:0.75rem;padding:0.5rem;font-size:0.875rem;color:var(--color-primary);background:none;border:1px solid var(--color-border);border-radius:0.5rem;cursor:pointer">Minimalkan tampilan</button>`;

    document.getElementById("minimizeLowStockBtn")?.addEventListener("click", function minimize() {
      renderDashboard();
    });
  });

  els.recentSalesList.innerHTML = filteredRecentSales.length
    ? filteredRecentSales
      .map((sale) => {
        return `
          <article class="activity-card">
            <strong>${isSaleVoid(sale) ? '<span class="void-badge">VOID</span> ' : isSaleReturned(sale) ? '<span class="status-badge status-returned" style="margin-right:0.35rem">RETURN</span> ' : ''}${escapeHtml(sale.id)}</strong>
            <small>${escapeHtml(summarizeTransactionItems(sale))}</small>
            <div class="activity-meta">
              <span>${formatShortDateTime(sale.date)}</span>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
            <div class="activity-actions">
              <button class="mini-button" type="button" data-sale-action="detail" data-sale-id="${escapeHtml(sale.id)}">Detail</button>
              <button class="mini-button" type="button" data-sale-action="print" data-sale-id="${escapeHtml(sale.id)}">Cetak Struk</button>
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

  const query = (els.inventorySearch?.value || "").trim().toLowerCase();
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
      .map((item, index) => {
        const stockClass = item.stock <= item.minStock ? "low" : "ok";
        return `
          <tr>
            <td class="align-right row-number">${formatNumber(index + 1)}</td>
            <td>
              <div class="name-cell">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.sku)}</small>
              </div>
            </td>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.supplier)}</td>
            <td><span class="stock-pill ${stockClass}">${formatQuantity(item.stock)} ${escapeHtml(item.unit)}</span></td>
            <td class="price-cell">${formatCurrency(item.purchasePrice || 0)}</td>
            <td class="price-cell">
              ${renderProfitCell(item)}
            </td>
            <td class="price-cell">${escapeHtml(getItemPriceTexts(item).base)}</td>
            <td class="price-cell">${escapeHtml(getItemPriceTexts(item).store)}</td>
            <td class="price-cell">${escapeHtml(getItemPriceTexts(item).retail)}</td>
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
        <td colspan="11">${renderEmptyState("Barang tidak ditemukan. Coba ubah kata kunci atau kategori.")}</td>
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

  requestAnimationFrame(updateInventoryScrollSync);
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

  const query = (els.cashierSearch?.value || "").trim().toLowerCase();
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

  // ── Payment method display ──
  const payMethod = state.ui.paymentMethod || "tunai";
  if (els.paymentMethodInput) els.paymentMethodInput.value = payMethod;
  if (els.paymentBoxTunai) els.paymentBoxTunai.classList.toggle("hidden", payMethod !== "tunai");
  if (els.hutangFields) els.hutangFields.classList.toggle("hidden", payMethod !== "hutang");
  if (payMethod === "hutang" && els.hutangCustomerInput && !els.hutangCustomerInput.value) {
    els.hutangCustomerInput.value = state.ui.hutangCustomerName || "";
  }
  if (payMethod === "hutang") {
    if (els.hutangPhoneInput && !els.hutangPhoneInput.value) {
      els.hutangPhoneInput.value = state.ui.hutangPhone || "";
    }
    if (els.hutangAddressInput && !els.hutangAddressInput.value) {
      els.hutangAddressInput.value = state.ui.hutangAddress || "";
    }
  }
  if (payMethod === "hutang" && els.hutangDpInput) {
    els.hutangDpInput.value = formatPlainNumber(state.ui.hutangDp || 0);
  }

  // ── Cart list ──
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

  const payMethodOk = (state.ui.paymentMethod || "tunai") === "tunai"
    ? state.ui.payment >= totals.total
    : totals.total > 0;
  els.checkoutBtn.disabled = totals.total <= 0 || !payMethodOk;
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

  const hasDrillDown = state.ui.reportPrevPeriod && state.ui.reportPeriod === "daily";
  if (els.reportBackBtn) {
    els.reportBackBtn.classList.toggle("hidden", !hasDrillDown);
  }
  if (els.reportPeriod) {
    els.reportPeriod.closest(".select-field")?.classList.toggle("hidden", hasDrillDown);
  }

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

function renderFinance() {
  const summary = getFinanceSummary();
  const ledger = getFinanceLedger();
  const query = (els.globalSearch?.value || "").trim().toLowerCase();
  const filteredLedger = ledger.filter((entry) =>
    matchesQuery([entry.type, entry.reference, entry.description, entry.direction], query)
  );

  els.financeRevenue.textContent = formatCurrency(summary.revenue);
  els.financeExpense.textContent = formatCurrency(summary.expense);
  els.financeGrossProfit.textContent = formatCurrency(summary.grossProfit);
  els.financeGrossProfitHint.textContent = summary.grossProfitUnknown > 0
    ? `Laba kotor dari transaksi dengan data harga beli | ${formatCurrency(summary.grossProfitUnknown)} tanpa data harga beli`
    : "Selisih harga jual dikurangi harga beli per item";
  els.financeProfit.textContent = formatCurrency(summary.profit);
  els.financeMargin.textContent = `${formatNumber(summary.margin)}%`;
  const hints = [`${formatNumber(summary.salesCount)} transaksi penjualan`];
  if (summary.totalRefunds > 0) hints.push(`${formatCurrency(summary.totalRefunds)} retur`);
  if (summary.totalVoid > 0) hints.push(`${formatCurrency(summary.totalVoid)} void`);
  els.financeIncomeHint.textContent = hints.join(' | ');
  els.financeExpenseHint.textContent = `${formatNumber(summary.receiptCount)} transaksi barang masuk tercatat`;
  els.financeProfitHint.textContent = summary.profit >= 0 ? "Pendapatan masih lebih besar dari pengeluaran" : "Pengeluaran lebih besar dari pendapatan";
  els.financeMarginHint.textContent = summary.revenue > 0 ? "Margin dihitung dari keuntungan terhadap pendapatan" : "Belum ada pendapatan untuk menghitung margin";

  els.financeLedgerBody.innerHTML = filteredLedger.length
    ? filteredLedger
      .map((entry) => `
        <tr>
          <td>
            <div class="name-cell">
              <strong>${escapeHtml(formatShortDateTime(entry.date))}</strong>
              <small>${escapeHtml(entry.reference)}</small>
            </div>
          </td>
          <td><span class="stock-pill ${entry.direction === "income" ? "ok" : "low"}">${escapeHtml(entry.type)}</span></td>
          <td>${escapeHtml(entry.description)}</td>
          <td class="align-right">${entry.income ? formatCurrency(entry.income) : "-"}</td>
          <td class="align-right">${entry.expense ? formatCurrency(entry.expense) : "-"}</td>
          <td class="align-right"><strong>${formatCurrency(entry.balance)}</strong></td>
        </tr>
      `)
      .join("")
    : `
      <tr>
        <td colspan="6">${renderEmptyState("Belum ada data keuangan yang sesuai dengan pencarian.")}</td>
      </tr>
    `;
}

function renderUsers() {
  if (!els.userTableBody || !isAdmin()) {
    return;
  }

  const users = Array.isArray(state.users) ? state.users : [];
  const currentUsername = state.auth.userName || '';
  els.userSummaryCount.textContent = `${formatNumber(users.length)} pengguna aktif`;
  els.userTableBody.innerHTML = users.length
    ? users
      .map((user) => {
        const isSelf = user.name === currentUsername;
        return `
        <tr>
          <td>
            <div class="name-cell">
              <strong>${escapeHtml(user.name)}${isSelf ? ' <small style="color:var(--text-tertiary)">(Anda)</small>' : ''}</strong>
              <small>${escapeHtml(user.email || "-")}</small>
            </div>
          </td>
          <td>${escapeHtml(user.username)}</td>
          <td><span class="role-badge ${user.role === "cashier" ? "cashier" : "admin"}">${escapeHtml(user.roleLabel || formatRoleLabel(user.role))}</span></td>
          <td class="align-right">
            <div class="table-actions">
              <button class="mini-button" type="button" data-user-action="edit" data-user-id="${escapeHtml(user.id)}">Edit</button>
              <button class="mini-button danger" type="button" data-user-action="delete" data-user-id="${escapeHtml(user.id)}" ${isSelf ? "disabled" : ""}>${isSelf ? "Aktif" : "Hapus"}</button>
            </div>
          </td>
        </tr>
      `;})
      .join("")
    : `
      <tr>
        <td colspan="4">${renderEmptyState("Belum ada data pengguna.")}</td>
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

async function handleUserSubmit(event) {
  event.preventDefault();

  const payload = {
    name: els.userName.value.trim(),
    username: els.userUsername.value.trim().toLowerCase(),
    role: els.userRole.value,
    password: els.userPassword.value,
    email: els.userEmail.value.trim()
  };

  if (!payload.name || !payload.username || !payload.role || !payload.password) {
    showToast("danger", "Data user belum lengkap", "Isi nama, username, role, dan password terlebih dahulu.");
    return;
  }

  if (payload.password.length < 6) {
    showToast("danger", "Password terlalu pendek", "Password minimal 6 karakter.");
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.usersStore, {
      method: "POST",
      body: payload
    });
    setBootState(response.state);
    els.userForm.reset();
    els.userRole.value = "cashier";
    renderAll();
    showToast("success", "User ditambahkan", response.message || `${payload.name} berhasil dibuat.`);
  } catch (error) {
    showToast("danger", "Gagal menambah user", error.message);
  }
}

// ── User Edit/Delete ──
async function handleUserTableClick(event) {
  const button = event.target.closest("[data-user-action]");
  if (!button) return;

  const userId = button.dataset.userId;
  const action = button.dataset.userAction;
  const user = state.users.find((u) => String(u.id) === String(userId));
  if (!user) return;

  if (action === "edit") {
    openUserModal(user);
    return;
  }

  if (action === "delete") {
    showConfirmDelete({
      type: "pengguna",
      name: user.name,
      id: userId,
      endpoint: `${POS_ROUTES.usersBase}/${userId}`,
      method: "DELETE",
      onSuccess: (response) => {
        showToast("success", "User dihapus", response.message || `${user.name} berhasil dihapus.`);
      },
      onError: (error) => {
        showToast("danger", "Gagal menghapus user", error.message);
      }
    });
  }
}

function openUserModal(user) {
  els.userEditId.value = user.id;
  els.userEditName.value = user.name;
  els.userEditUsername.value = user.username;
  els.userEditRole.value = user.role;
  els.userEditPassword.value = "";
  els.userEditEmail.value = user.email || "";

  const title = els.userModal.querySelector("h4");
  if (title) title.textContent = `Edit User: ${user.name}`;

  els.userModal.classList.remove("hidden");
  setTimeout(() => els.userEditName.focus(), 100);
}

function closeUserModal() {
  els.userEditForm.reset();
  els.userEditId.value = "";
  els.userModal.classList.add("hidden");
}

async function handleUserEditSubmit(event) {
  event.preventDefault();

  const userId = els.userEditId.value.trim();
  if (!userId) {
    closeUserModal();
    return;
  }

  const payload = {
    name: els.userEditName.value.trim(),
    username: els.userEditUsername.value.trim().toLowerCase(),
    role: els.userEditRole.value,
    email: els.userEditEmail.value.trim()
  };

  const password = els.userEditPassword.value;
  if (password) {
    if (password.length < 6) {
      showToast("danger", "Password terlalu pendek", "Password minimal 6 karakter.");
      return;
    }
    payload.password = password;
  }

  if (!payload.name || !payload.username || !payload.role) {
    showToast("danger", "Data belum lengkap", "Isi nama, username, dan role terlebih dahulu.");
    return;
  }

  try {
    const response = await apiRequest(`${POS_ROUTES.usersBase}/${userId}`, {
      method: "PUT",
      body: payload
    });
    setBootState(response.state);
    closeUserModal();
    renderAll();
    showToast("success", "User diperbarui", response.message || `${payload.name} berhasil diperbarui.`);
  } catch (error) {
    showToast("danger", "Gagal memperbarui user", error.message);
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

    // Update CSRF token — login regenerates the session
    if (response.csrfToken) {
      document.querySelector('meta[name="csrf-token"]')?.setAttribute("content", response.csrfToken);
    }

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
  if (!window.confirm("Reset data stok dari dataset Excel?")) {
    return;
  }

  try {
    const response = await apiRequest(POS_ROUTES.reset, {
      method: "POST"
    });
    setBootState(response.state);
    renderAll();
    showToast("info", "Data stok direset", response.message || "Master barang dikembalikan dari dataset Excel.");
  } catch (error) {
    showToast("danger", "Reset gagal", error.message);
  }
}

// ── Password Change ──
function openPasswordModal() {
  els.passwordCurrent.value = "";
  els.passwordNew.value = "";
  els.passwordConfirm.value = "";
  els.passwordModal.classList.remove("hidden");
  setTimeout(() => els.passwordCurrent.focus(), 100);
}

function closePasswordModal() {
  els.passwordForm.reset();
  els.passwordModal.classList.add("hidden");
}

async function handlePasswordChange(event) {
  event.preventDefault();

  const currentPassword = els.passwordCurrent.value;
  const newPassword = els.passwordNew.value;
  const confirmPassword = els.passwordConfirm.value;

  if (!currentPassword) {
    showToast("danger", "Password wajib diisi", "Masukkan password saat ini.");
    els.passwordCurrent.focus();
    return;
  }

  if (!newPassword) {
    showToast("danger", "Password baru wajib diisi", "Masukkan password baru.");
    els.passwordNew.focus();
    return;
  }

  if (newPassword.length < 6) {
    showToast("danger", "Password terlalu pendek", "Password minimal 6 karakter.");
    els.passwordNew.focus();
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("danger", "Konfirmasi tidak cocok", "Password baru dan konfirmasi harus sama.");
    els.passwordConfirm.focus();
    return;
  }

  const submitBtn = els.passwordForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Menyimpan...';

  try {
    const response = await apiRequest(POS_ROUTES.changePassword, {
      method: "POST",
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      }
    });
    closePasswordModal();
    showToast("success", "Password diubah", "Password Anda berhasil diperbarui.");
  } catch (error) {
    showToast("danger", "Gagal mengubah password", error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="material-symbols-outlined">lock</span> Simpan Password';
  }
}

function showView(view) {
  if (!getAllowedViews().includes(view)) {
    showToast("danger", "Akses dibatasi", "Menu ini hanya tersedia untuk akun admin.");
    return;
  }

  state.ui.activeView = view;
  state.ui.isSidebarOpen = false;
  renderAll();
}

function setInventoryMode(mode) {
  state.ui.inventoryMode = mode;
}

function handleSearchChange() {
  renderAll();
}

// ── Delete Confirmation Modal ──
let pendingDelete = null;

function showConfirmDelete({ type, name, id, endpoint, method, onSuccess, onError }) {
  pendingDelete = { id, endpoint, method, onSuccess, onError };

  const icon = type === "supplier" ? "apartment" : "inventory_2";
  els.confirmModalEyebrow.textContent = `Hapus ${type}`;
  els.confirmModalTitle.textContent = `Hapus ${type === "supplier" ? "Supplier" : "Barang"}`;
  els.confirmModalWarningTitle.textContent = `Yakin ingin menghapus ${type} ini?`;
  els.confirmModalMessage.textContent = `Data ${type} "${name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`;
  els.confirmItemBox.querySelector(".material-symbols-outlined").textContent = icon;
  els.confirmItemName.textContent = name;
  els.confirmDeleteBtn.innerHTML = `<span class="material-symbols-outlined">delete</span> Hapus ${type === "supplier" ? "Supplier" : "Barang"}`;

  els.confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  pendingDelete = null;
  els.confirmModal.classList.add("hidden");
}

async function handleConfirmDelete() {
  if (!pendingDelete) return;

  const { id, endpoint, method, onSuccess, onError } = pendingDelete;
  els.confirmDeleteBtn.disabled = true;
  els.confirmDeleteBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Menghapus...';

  try {
    const response = await apiRequest(endpoint, { method });
    closeConfirmModal();
    setBootState(response.state);
    renderAll();
    if (onSuccess) onSuccess(response);
  } catch (error) {
    closeConfirmModal();
    if (onError) onError(error);
  } finally {
    els.confirmDeleteBtn.disabled = false;
    els.confirmDeleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span> Hapus Barang';
  }
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
    showConfirmDelete({
      type: "barang",
      name: item.name,
      id: itemId,
      endpoint: `${POS_ROUTES.itemsBase}/${itemId}`,
      method: "DELETE",
      onSuccess: (response) => {
        showToast("info", "Barang dihapus", response.message || `${item.name} berhasil dihapus dari data master.`);
      },
      onError: (error) => {
        showToast("danger", "Gagal menghapus", error.message);
      }
    });
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

function handleReportBackClick() {
  if (state.ui.reportPrevPeriod) {
    state.ui.reportPeriod = state.ui.reportPrevPeriod;
    if (state.ui.reportPrevPeriod === "daily") {
      state.ui.reportDate = state.ui.reportPrevDate;
    }
    state.ui.reportPrevPeriod = null;
    state.ui.reportPrevDate = null;
    renderAll();
  }
}

function handleReportTableClick(event) {
  const dayButton = event.target.closest("[data-report-day]");
  if (dayButton) {
    state.ui.reportPrevPeriod = state.ui.reportPeriod;
    state.ui.reportPrevDate = state.ui.reportDate;
    state.ui.reportPeriod = "daily";
    state.ui.reportDate = dayButton.dataset.reportDay;
    renderAll();
    return;
  }

  handleSaleActionClick(event);
}

function handleVoidTableClick(event) {
  const button = event.target.closest("[data-void-action]");
  if (!button) return;
  if (button.dataset.voidAction === "detail") {
    const saleId = button.dataset.voidSaleId;
    showView("cashier");
    renderAll();
    const sale = getSaleById(saleId);
    if (sale) openTransactionModal(saleId);
  }
}

function handleSaleActionClick(event) {
  const button = event.target.closest("[data-sale-action]");
  if (!button) {
    return;
  }

  const saleId = button.dataset.saleId;
  if (button.dataset.saleAction === "print") {
    printSaleReceipt(saleId);
    return;
  }

  openTransactionModal(saleId);
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

// ── Payment method helpers ──

const CHANNEL_MAP = {
  qris: "QRIS",
  bri_va: "BRI VA",
  bca_va: "BCA VA",
  bni_va: "BNI VA",
  mandiri_va: "Mandiri VA",
  permata_va: "Permata VA",
  cimb_va: "CIMB VA",
  danamon_va: "Danamon VA",
  bsi_va: "BSI VA",
  maybank: "Maybank",
  neo_commerce: "Neo Commerce",
  ocbc_nisp: "OCBC NISP",
  muamalat: "Bank Muamalat"
};

function getChannelName(channelId) {
  return CHANNEL_MAP[channelId] || "";
}

function getPaymentMethodLabel(sale) {
  const method = sale.paymentMethod || "tunai";
  const channel = sale.paymentChannel || "";
  const channelName = getChannelName(channel);
  if (method === "qris") return "QRIS";
  if (method === "va" && channelName) return "Transfer - " + channelName;
  if (method === "va") return "Transfer / VA";
  return "Tunai";
}

function getReceiptPaymentLabel(receipt) {
  const method = receipt.paymentMethod || "tunai";
  const channel = receipt.paymentChannel || "";
  const channelName = getChannelName(channel);
  if (method === "qris") return "QRIS";
  if (method === "va" && channelName) return "VA " + channelName;
  if (method === "va") return "Transfer";
  return "Tunai";
}

function handlePaymentMethodChange(event) {
  const method = event.target.value;
  state.ui.paymentMethod = method;
  if (els.paymentBoxTunai) els.paymentBoxTunai.classList.toggle("hidden", method !== "tunai");
  if (els.hutangFields) els.hutangFields.classList.toggle("hidden", method !== "hutang");
  renderAll();
}

// ── Bukti Pembayaran ──

async function compressImage(dataUrl, maxBytes) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      const MAX_DIM = 1600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      let lo = 0.1, hi = 0.92, result = canvas.toDataURL("image/jpeg", 0.85);
      const base64Bytes = (b64) => Math.round((b64.split(",")[1] || "").length * 0.75);

      if (base64Bytes(result) <= maxBytes) { resolve(result); return; }

      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        const candidate = canvas.toDataURL("image/jpeg", mid);
        if (base64Bytes(candidate) <= maxBytes) { lo = mid; result = candidate; }
        else hi = mid;
        if (hi - lo < 0.01) break;
      }
      resolve(result);
    };
    img.src = dataUrl;
  });
}

async function handleProofFileChange(event) {
  const file = event.target.files?.[0];
  if (!event.target) return;
  event.target.value = "";
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    showToast("danger", "Format tidak didukung", "Gunakan JPG, PNG, atau WebP.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    const original = e.target.result;
    const MAX = 200 * 1024;
    const originalBytes = Math.round((original.split(",")[1] || "").length * 0.75);

    let compressed = original;
    if (originalBytes > MAX) {
      compressed = await compressImage(original, MAX);
    }

    const finalBytes = Math.round((compressed.split(",")[1] || "").length * 0.75);
    state.ui.proofBase64 = compressed;
    showProofPreview(file.name, finalBytes, compressed);
  };
  reader.readAsDataURL(file);
}

function showProofPreview(name, bytes, dataUrl) {
  if (!els.proofPreview) return;
  els.proofPreview.classList.remove("hidden");
  if (els.proofUploadBtn) els.proofUploadBtn.classList.add("hidden");
  if (els.proofPreviewImg) els.proofPreviewImg.src = dataUrl;
  if (els.proofFileName) els.proofFileName.textContent = name.length > 28 ? name.slice(0, 25) + "…" : name;
  if (els.proofFileSize) {
    const kb = Math.round(bytes / 1024);
    els.proofFileSize.textContent = `${kb} KB${kb <= 200 ? " ✓" : ""}`;
  }
}

function clearProof() {
  state.ui.proofBase64 = null;
  if (els.proofPreview) els.proofPreview.classList.add("hidden");
  if (els.proofUploadBtn) els.proofUploadBtn.classList.remove("hidden");
  if (els.proofPreviewImg) els.proofPreviewImg.src = "";
  if (els.proofFileInput) els.proofFileInput.value = "";
}

// ── Customer Management ──

function renderCustomers() {
  if (!els.customerTableBody) return;
  const customers = Array.isArray(state.customers) ? state.customers : [];
  const query = (els.customerSearch?.value || "").trim().toLowerCase();

  const filtered = query
    ? customers.filter(c => matchesQuery([c.name, c.phone, c.address], query))
    : customers;

  const totalDebt = customers.reduce((s, c) => s + (c.totalDebt || 0), 0);
  const withDebt = customers.filter(c => (c.totalDebt || 0) > 0).length;

  if (els.customerMetricTotal) els.customerMetricTotal.textContent = formatNumber(customers.length);
  if (els.customerMetricHint) els.customerMetricHint.textContent = `${formatNumber(customers.length)} pelanggan terdaftar`;
  if (els.customerMetricDebt) els.customerMetricDebt.textContent = formatCurrency(totalDebt);
  if (els.customerMetricDebtHint) els.customerMetricDebtHint.textContent = `dari ${formatNumber(withDebt)} pelanggan`;

  els.customerTableBody.innerHTML = filtered.length
    ? filtered.map(c => {
        const debtHtml = c.totalDebt > 0
          ? `<span class="debt-badge">${formatCurrency(c.totalDebt)}</span>`
          : `<span class="debt-badge debt-badge-zero">Lunas</span>`;
        return `<tr>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.phone || "-")}</td>
          <td><small>${escapeHtml(c.address || "-")}</small></td>
          <td class="align-right">${debtHtml}</td>
          <td class="align-right">
            <button class="button-link" data-action="customer-detail" data-id="${c.id}" type="button">Detail</button>
            &nbsp;
            <button class="button-link" data-action="customer-edit" data-id="${c.id}" type="button">Edit</button>
            &nbsp;
            <button class="button-link" data-action="customer-delete" data-id="${c.id}" style="color:var(--danger,#ef4444)" type="button">Hapus</button>
          </td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5">${renderEmptyState(query ? "Tidak ada pelanggan yang sesuai pencarian." : "Belum ada pelanggan. Klik Tambah Pelanggan.")}</td></tr>`;
}

// Delegated clicks on customer table
document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  if (action === "customer-detail") openCustomerDetail(id);
  else if (action === "customer-edit") openCustomerModal(id);
  else if (action === "customer-delete") confirmDeleteCustomer(id);
  else if (action === "debt-pay") openDebtPayForm(id, btn);
  else if (action === "debt-pay-submit") handleDebtPaySubmit(e, btn);
  else if (action === "debt-pay-delete") handleDebtPayDelete(Number(btn.dataset.paymentId));
});

function getCustomerById(id) {
  return (state.customers || []).find(c => c.id === id) || null;
}

function openCustomerModal(customerId) {
  const customer = customerId ? getCustomerById(customerId) : null;
  if (els.customerModalTitle) els.customerModalTitle.textContent = customer ? "Edit Pelanggan" : "Tambah Pelanggan";
  if (els.customerFormId) els.customerFormId.value = customer?.id || "";
  if (els.customerFormName) els.customerFormName.value = customer?.name || "";
  if (els.customerFormPhone) els.customerFormPhone.value = customer?.phone || "";
  if (els.customerFormAddress) els.customerFormAddress.value = customer?.address || "";
  if (els.customerFormNotes) els.customerFormNotes.value = customer?.notes || "";
  if (els.customerModal) els.customerModal.classList.remove("hidden");
}

function closeCustomerModal() {
  if (els.customerModal) els.customerModal.classList.add("hidden");
}

async function handleCustomerSubmit(e) {
  e.preventDefault();
  const id = els.customerFormId?.value;
  const body = {
    name: els.customerFormName?.value?.trim() || "",
    phone: els.customerFormPhone?.value?.trim() || null,
    address: els.customerFormAddress?.value?.trim() || null,
    notes: els.customerFormNotes?.value?.trim() || null,
  };
  if (!body.name) { showToast("danger", "Nama wajib diisi", "Isi nama pelanggan."); return; }
  try {
    const endpoint = id
      ? `${POS_ROUTES.customersBase}/${id}`
      : POS_ROUTES.customersStore;
    const response = await apiRequest(endpoint, { method: id ? "PUT" : "POST", body });
    setBootState(response.state);
    renderAll();
    closeCustomerModal();
    showToast("success", id ? "Pelanggan diperbarui" : "Pelanggan ditambahkan", response.message || "");
  } catch (err) {
    showToast("danger", "Gagal menyimpan", err.message);
  }
}

async function confirmDeleteCustomer(id) {
  const customer = getCustomerById(id);
  if (!customer) return;
  if (!window.confirm(`Hapus pelanggan "${customer.name}"?\nData hutang terkait juga akan dihapus.`)) return;
  try {
    const response = await apiRequest(`${POS_ROUTES.customersBase}/${id}`, { method: "DELETE" });
    setBootState(response.state);
    renderAll();
    showToast("success", "Pelanggan dihapus", response.message || "");
  } catch (err) {
    showToast("danger", "Gagal menghapus", err.message);
  }
}

let activeDetailCustomerId = null;

function openCustomerDetail(customerId) {
  const c = getCustomerById(customerId);
  if (!c) return;
  activeDetailCustomerId = customerId;

  if (els.customerDetailTitle) els.customerDetailTitle.textContent = c.name;
  if (els.customerDetailMeta) els.customerDetailMeta.textContent = c.phone ? `📞 ${c.phone}` : "Tidak ada nomor HP";
  if (els.customerDetailTotalDebt) {
    els.customerDetailTotalDebt.textContent = formatCurrency(c.totalDebt || 0);
    els.customerDetailTotalDebt.className = "debt-badge" + (c.totalDebt > 0 ? "" : " debt-badge-zero");
  }

  if (els.customerDetailInfo) {
    els.customerDetailInfo.innerHTML = `
      <dt>Nama</dt><dd>${escapeHtml(c.name)}</dd>
      <dt>No. HP</dt><dd>${escapeHtml(c.phone || "-")}</dd>
      <dt>Alamat</dt><dd>${escapeHtml(c.address || "-")}</dd>
      <dt>Catatan</dt><dd>${escapeHtml(c.notes || "-")}</dd>
    `;
  }

  renderCustomerDebtList(c);
  if (els.customerDetailModal) els.customerDetailModal.classList.remove("hidden");
}

function renderCustomerDebtList(customer) {
  if (!els.customerDebtList) return;
  const debtSales = customer.debtSales || [];

  if (!debtSales.length) {
    els.customerDebtList.innerHTML = `<p style="color:var(--text-tertiary);padding:12px 0;">Tidak ada hutang outstanding.</p>`;
    return;
  }

  els.customerDebtList.innerHTML = debtSales.map(s => {
    const paymentsHtml = (s.payments || []).length
      ? `<div class="debt-payment-history">
          <strong style="font-size:0.74rem;color:var(--text-tertiary)">Riwayat Pembayaran</strong>
          ${s.payments.map(p => `
            <div class="debt-payment-row">
              <span>${escapeHtml(formatShortDate(new Date(p.paidAt)))} — ${escapeHtml(p.note || "-")}</span>
              <span style="display:flex;align-items:center;gap:6px">
                <strong style="color:var(--success,#10b981)">${formatCurrency(p.amount)}</strong>
                <button class="button-link" data-action="debt-pay-delete" data-payment-id="${p.id}" style="color:var(--danger,#ef4444);font-size:0.7rem" type="button">Hapus</button>
              </span>
            </div>`).join("")}
        </div>`
      : "";

    return `<div class="debt-sale-card" data-sale-id="${s.saleId}">
      <div class="debt-sale-head">
        <div>
          <strong>${escapeHtml(s.invoiceNumber)}</strong>
          <small>${escapeHtml(formatShortDate(new Date(s.date)))}</small>
        </div>
        <button class="button button-soft" style="font-size:0.75rem;padding:4px 10px" data-action="debt-pay" data-id="${s.saleId}" type="button">
          <span class="material-symbols-outlined" style="font-size:1rem">payments</span>
          Catat Bayar
        </button>
      </div>
      <div class="debt-sale-amounts">
        <div><span>Total</span><strong>${formatCurrency(s.total)}</strong></div>
        <div><span>Sudah Dibayar</span><strong>${formatCurrency(s.dp + s.paid)}</strong></div>
        <div class="remaining"><span>Sisa Hutang</span><strong>${formatCurrency(s.remaining)}</strong></div>
      </div>
      ${paymentsHtml}
      <div id="debtPayForm_${s.saleId}" class="debt-pay-form hidden">
        <label class="field" style="flex:1;min-width:120px">
          <span>Jumlah Bayar</span>
          <input type="text" inputmode="numeric" placeholder="0" class="debt-amount-input" data-sale-id="${s.saleId}" data-max="${s.remaining}">
        </label>
        <label class="field" style="flex:1;min-width:100px">
          <span>Tanggal</span>
          <input type="date" class="debt-date-input" data-sale-id="${s.saleId}" value="${formatDateInput(new Date())}">
        </label>
        <label class="field" style="flex:2;min-width:140px">
          <span>Keterangan</span>
          <input type="text" class="debt-note-input" data-sale-id="${s.saleId}" placeholder="Opsional...">
        </label>
        <button class="button button-success" data-action="debt-pay-submit" data-id="${s.saleId}" style="align-self:flex-end" type="button">Simpan</button>
        <button class="button button-muted" data-action="debt-pay-cancel" data-sale-id="${s.saleId}" style="align-self:flex-end" type="button">Batal</button>
      </div>
    </div>`;
  }).join("");

  // Cancel button delegation
  els.customerDebtList.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action='debt-pay-cancel']");
    if (!btn) return;
    const formEl = document.getElementById(`debtPayForm_${btn.dataset.saleId}`);
    if (formEl) formEl.classList.add("hidden");
  });
}

function openDebtPayForm(saleId, triggerBtn) {
  const formEl = document.getElementById(`debtPayForm_${saleId}`);
  if (!formEl) return;
  formEl.classList.toggle("hidden");
}

async function handleDebtPaySubmit(e, btn) {
  const saleId = Number(btn.dataset.id);
  const form = document.getElementById(`debtPayForm_${saleId}`);
  if (!form) return;
  const amountInput = form.querySelector(".debt-amount-input");
  const dateInput = form.querySelector(".debt-date-input");
  const noteInput = form.querySelector(".debt-note-input");
  const amount = parseInteger(amountInput?.value || "0");
  const maxAmount = Number(amountInput?.dataset.max || 0);
  const paidAt = dateInput?.value || "";

  if (!amount || amount <= 0) { showToast("danger", "Jumlah tidak valid", "Masukkan jumlah bayar."); return; }
  if (amount > maxAmount) { showToast("danger", "Melebihi sisa hutang", `Maksimal ${formatCurrency(maxAmount)}.`); return; }
  if (!paidAt) { showToast("danger", "Tanggal wajib diisi", ""); return; }

  try {
    const response = await apiRequest(POS_ROUTES.debtStore, {
      method: "POST",
      body: { saleId, amount, paidAt, note: noteInput?.value?.trim() || null }
    });
    setBootState(response.state);
    renderAll();
    const c = getCustomerById(activeDetailCustomerId);
    if (c) renderCustomerDebtList(c);
    showToast("success", "Pembayaran dicatat", response.message || "");
  } catch (err) {
    showToast("danger", "Gagal mencatat", err.message);
  }
}

async function handleDebtPayDelete(paymentId) {
  try {
    const response = await apiRequest(`${POS_ROUTES.debtBase}/${paymentId}`, { method: "DELETE" });
    setBootState(response.state);
    renderAll();
    const c = getCustomerById(activeDetailCustomerId);
    if (c) renderCustomerDebtList(c);
    showToast("success", "Catatan dihapus", response.message || "");
  } catch (err) {
    showToast("danger", "Gagal menghapus", err.message);
  }
}

function closeCustomerDetail() {
  if (els.customerDetailModal) els.customerDetailModal.classList.add("hidden");
  activeDetailCustomerId = null;
}

// ── Hutang Customer Autocomplete ──

function handleHutangCustomerInput(e) {
  state.ui.hutangCustomerName = e.target.value;
  const query = e.target.value.trim().toLowerCase();
  if (!query || !els.customerAutocomplete) {
    if (els.customerAutocomplete) els.customerAutocomplete.classList.add("hidden");
    return;
  }
  const matches = (state.customers || []).filter(c => c.name.toLowerCase().includes(query)).slice(0, 8);
  if (!matches.length) {
    els.customerAutocomplete.classList.add("hidden");
    return;
  }
  els.customerAutocomplete.innerHTML = matches.map(c => `
    <div class="autocomplete-item" data-customer-id="${c.id}" data-customer-name="${escapeHtml(c.name)}" data-customer-phone="${escapeHtml(c.phone || '')}" data-customer-address="${escapeHtml(c.address || '')}">
      <strong>${escapeHtml(c.name)}</strong>
      <small>${c.phone ? escapeHtml(c.phone) : (c.totalDebt > 0 ? "Hutang: " + formatCurrency(c.totalDebt) : "Tidak ada hutang")}</small>
    </div>
  `).join("");
  els.customerAutocomplete.classList.remove("hidden");
}

document.addEventListener("click", function (e) {
  const item = e.target.closest(".autocomplete-item");
  if (!item || !els.customerAutocomplete?.contains(item)) return;
  const name = item.dataset.customerName;
  state.ui.hutangCustomerName = name;
  if (els.hutangCustomerInput) els.hutangCustomerInput.value = name;
  if (els.hutangPhoneInput) els.hutangPhoneInput.value = item.dataset.customerPhone || "";
  if (els.hutangAddressInput) els.hutangAddressInput.value = item.dataset.customerAddress || "";
  els.customerAutocomplete.classList.add("hidden");
});

function handleCopyClick(event) {
  const targetId = event.target.dataset.copy;
  if (!targetId) return;
  const el = document.getElementById(targetId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).catch(() => {});
  showToast("success", "Tersalin", "URL berhasil disalin ke clipboard.");
}

// ── Checkout helper ──

function setExactPayment() {
  const totals = calculateCartTotals();
  state.ui.payment = totals.total;
  renderAll();
}

function clearCart() {
  state.cart = [];
  state.ui.discount = 0;
  state.ui.payment = 0;
  clearProof();
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

  const paymentMethod = state.ui.paymentMethod || "tunai";
  const paymentAmount = paymentMethod === "tunai" ? state.ui.payment : totals.total;

  if (paymentMethod === "tunai" && state.ui.payment < totals.total) {
    showToast("danger", "Pembayaran kurang", "Nilai uang bayar harus sama atau lebih besar dari total tagihan.");
    return;
  }

  if (paymentMethod === "hutang") {
    const customerName = (els.hutangCustomerInput?.value || "").trim();
    if (!customerName) {
      showToast("danger", "Nama pelanggan kosong", "Masukkan nama pelanggan untuk transaksi hutang.");
      els.hutangCustomerInput?.focus();
      return;
    }
    state.ui.hutangCustomerName = customerName;
  }

  try {
    const body = {
      items: cartLines.map(({ entry, item }) => ({
        itemId: Number(item.id),
        quantity: normalizeQuantity(entry.quantity)
      })),
      discount: totals.discount,
      payment: paymentAmount,
      paymentMethod: paymentMethod,
      paymentProof: state.ui.proofBase64 || null
    };
    if (paymentMethod === "hutang") {
      body.customerName = state.ui.hutangCustomerName;
      body.customerPhone = state.ui.hutangPhone || "";
      body.customerAddress = state.ui.hutangAddress || "";
      body.dp = Math.max(0, Math.min(state.ui.hutangDp || 0, totals.total));
    }
    const response = await apiRequest(POS_ROUTES.checkout, { method: "POST", body });

    clearProof();
    state.ui.hutangCustomerName = "";
    state.ui.hutangPhone = "";
    state.ui.hutangAddress = "";
    state.ui.hutangDp = 0;
    if (els.hutangCustomerInput) els.hutangCustomerInput.value = "";
    if (els.hutangPhoneInput) els.hutangPhoneInput.value = "";
    if (els.hutangAddressInput) els.hutangAddressInput.value = "";
    if (els.hutangDpInput) els.hutangDpInput.value = "0";
    setBootState(response.state);
    state.ui.reportDate = formatDateInput(new Date());
    state.ui.reportMonth = formatMonthInput(new Date());
    state.ui.reportYear = String(new Date().getFullYear());
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
      change: totals.change,
      paymentMethod: state.ui.paymentMethod || "tunai"
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

function printSaleReceipt(saleId) {
  const receipt = getSaleById(saleId);
  if (!receipt) {
    showToast("danger", "Struk tidak ditemukan", "Pilih transaksi yang valid untuk dicetak ulang.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) {
    showToast("danger", "Popup diblokir", "Izinkan popup browser untuk mencetak ulang struk.");
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
  const query = (els.globalSearch?.value || "").trim().toLowerCase();
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
      .map((sale) => {
        const badge = isSaleVoid(sale)
          ? '<span class="void-badge" style="margin-right:0.35rem">VOID</span>'
          : isSaleReturned(sale)
            ? '<span class="status-badge status-returned" style="margin-right:0.35rem">RETURN</span>'
            : '';
        return {
          transaction: `
            <div class="name-cell">
              <strong>${badge}${escapeHtml(sale.id)}</strong>
              <small>${formatShortDateTime(sale.date)}</small>
            </div>
            <div class="table-actions table-actions-start">
              <button class="mini-button" type="button" data-sale-action="detail" data-sale-id="${escapeHtml(sale.id)}">Detail</button>
              <button class="mini-button" type="button" data-sale-action="print" data-sale-id="${escapeHtml(sale.id)}">Cetak Struk</button>
            </div>
          `,
          items: escapeHtml(summarizeTransactionItems(sale)),
          total: formatCurrency(sale.total)
        };
      })
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
        date: `
          <div class="name-cell">
            <strong>${escapeHtml(entry.label)}</strong>
            <small>${formatNumber(entry.count)} transaksi</small>
          </div>
          <div class="table-actions table-actions-start">
            <button class="mini-button" type="button" data-report-day="${escapeHtml(entry.key)}">Lihat Detail</button>
          </div>
        `,
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

  const revenue = sales.filter(s => !isSaleVoid(s)).reduce((sum, sale) => sum + sale.total, 0);
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
  const query = (els.globalSearch?.value || "").trim().toLowerCase();
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
  const activeSales = getNonReturnedSales();

  if (period === "daily") {
    const selected = startOfDay(new Date(state.ui.reportDate));
    return activeSales.filter((s) => formatDateInput(new Date(s.date)) === formatDateInput(selected));
  }

  if (period === "monthly") {
    return activeSales.filter((sale) => sale.date.slice(0, 7) === state.ui.reportMonth);
  }

  return activeSales.filter((sale) => new Date(sale.date).getFullYear() === Number(state.ui.reportYear));
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
    year: state.ui.reportYear,
    fresh: String(Date.now())
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
    els.itemPurchasePrice.value = item.purchasePrice || 0;
    els.itemDescription.value = item.description || "";
  } else {
    els.itemModalTitle.textContent = "Tambah Barang";
    els.itemForm.reset();
    els.itemId.value = "";
    populateItemUnitOptions("pcs");
    els.itemStock.value = 0;
    els.itemMinStock.value = 5;
    els.itemPrice.value = 0;
    els.itemPurchasePrice.value = 0;
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

function renderVoid() {
  if (!els.voidTableBody) return;
  const analytics = getVoidAnalytics();
  const voidLogs = Array.isArray(state.voidLogs) ? state.voidLogs : [];
  const query = (els.voidSearch?.value || "").trim().toLowerCase();
  const filtered = query
    ? voidLogs.filter((log) =>
        matchesQuery([log.saleId, log.reason, log.voidedBy, log.saleTotal], query)
      )
    : voidLogs;

  els.voidTotalCount.textContent = formatNumber(analytics.totalCount);
  els.voidTotalNominal.textContent = formatCurrency(analytics.totalNominal);
  els.voidTotalHint.textContent = `${formatNumber(analytics.totalCount)} transaksi dibatalkan`;
  els.voidRestoredCount.textContent = formatQuantity(analytics.restoredItems);
  els.voidRestoredHint.textContent = `Dari ${formatNumber(analytics.totalCount)} transaksi void`;

  els.voidTableBody.innerHTML = filtered.length
    ? filtered
        .map((log) => {
          const sale = getSaleById(log.saleId);
          return `
            <tr>
              <td>
                <div class="name-cell">
                  <strong>${escapeHtml(log.saleId)}</strong>
                  <small>${sale ? formatShortDateTime(new Date(sale.date)) : "-"}</small>
                </div>
              </td>
              <td>${sale ? formatShortDateTime(new Date(sale.date)) : "-"}</td>
              <td class="align-right"><strong>${formatCurrency(log.saleTotal)}</strong></td>
              <td>${escapeHtml(log.reason)}</td>
              <td>${escapeHtml(log.voidedBy)}</td>
              <td>${formatShortDateTime(new Date(log.createdAt))}</td>
              <td class="align-right">
                <button class="mini-button" type="button" data-void-action="detail" data-void-sale-id="${escapeHtml(log.saleId)}">Detail</button>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="7">${renderEmptyState(query ? "Tidak ada riwayat void yang sesuai dengan pencarian." : "Belum ada transaksi yang dibatalkan.")}</td></tr>`;
}

function openVoidModal() {
  const sale = getSaleById(activeSaleId);
  if (!sale || isSaleVoid(sale) || isSaleReturned(sale) || !isAdmin()) return;

  els.voidSaleId.textContent = sale.id;
  els.voidSaleDate.textContent = formatShortDateTime(new Date(sale.date));
  els.voidSaleTotal.textContent = formatCurrency(sale.total);
  els.voidSaleItems.textContent = `${formatNumber(sale.items.length)} item`;
  els.voidReasonInput.value = "";
  els.voidModal.classList.remove("hidden");
  setTimeout(() => els.voidReasonInput.focus(), 100);
}

function closeVoidModal() {
  els.voidModal.classList.add("hidden");
  els.voidReasonInput.value = "";
}

async function handleVoidConfirm() {
  const reason = els.voidReasonInput.value.trim();
  if (!reason) {
    showToast("danger", "Alasan wajib diisi", "Isi alasan pembatalan terlebih dahulu.");
    els.voidReasonInput.focus();
    return;
  }

  const saleId = els.voidSaleId.textContent;
  els.confirmVoidBtn.disabled = true;
  els.confirmVoidBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Memproses...';

  try {
    const response = await apiRequest(`${POS_ROUTES.voidBase}/${activeSaleId}/void`, {
      method: "POST",
      body: { reason }
    });

    setBootState(response.state);
    closeVoidModal();
    closeTransactionModal();
    renderAll();
    showToast("success", "Transaksi Dibatalkan", `Transaksi ${saleId} berhasil dibatalkan. Stok sudah dikembalikan.`);
  } catch (error) {
    showToast("danger", "Gagal Void", error.message);
  } finally {
    els.confirmVoidBtn.disabled = false;
    els.confirmVoidBtn.innerHTML = '<span class="material-symbols-outlined">block</span> Konfirmasi Void';
  }
}

function handleVoidSearch() {
  renderAll();
}

// ─── Return Functions ─────────────────────────────────────────────────

function renderReturn() {
  if (!els.returnTableBody) return;
  const returns = Array.isArray(state.returns) ? state.returns : [];
  const query = (els.returnSearch?.value || "").trim().toLowerCase();

  const filtered = query
    ? returns.filter((r) =>
        matchesQuery([r.invoiceNumber, r.saleId, r.reason, r.createdBy], query)
      )
    : returns;

  // Metrics
  const totalCount = filtered.length;
  const totalRefund = filtered.reduce((sum, r) => sum + (r.totalRefund || 0), 0);
  const totalItems = filtered.reduce((sum, r) => {
    return sum + (r.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
  }, 0);

  if (els.returnTotalCount) els.returnTotalCount.textContent = formatNumber(totalCount);
  if (els.returnTotalRefund) els.returnTotalRefund.textContent = formatCurrency(totalRefund);
  if (els.returnRefundHint) els.returnRefundHint.textContent = `Total uang dikembalikan dari ${formatNumber(totalCount)} transaksi retur`;
  if (els.returnItemCount) els.returnItemCount.textContent = formatQuantity(totalItems);
  if (els.returnItemHint) els.returnItemHint.textContent = `Dari ${formatNumber(totalCount)} transaksi retur`;

  // Table
  els.returnTableBody.innerHTML = filtered.length
    ? filtered
        .map((r) => {
          const itemsSummary = (r.items || [])
            .map((i) => `${escapeHtml(i.itemName)} x${formatQuantity(i.quantity)}`)
            .join(", ");
          return `
            <tr>
              <td><strong>${escapeHtml(r.invoiceNumber)}</strong></td>
              <td>${escapeHtml(r.saleId)}</td>
              <td><small>${escapeHtml(itemsSummary)}</small></td>
              <td>${escapeHtml(r.reason)}</td>
              <td class="align-right"><strong>${formatCurrency(r.totalRefund)}</strong></td>
              <td>${escapeHtml(r.createdBy)}</td>
              <td class="align-right">${formatShortDateTime(new Date(r.createdAt))}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="7">${renderEmptyState(query ? "Tidak ada riwayat retur yang sesuai dengan pencarian." : "Belum ada retur penjualan.")}</td></tr>`;
}

function getAlreadyReturnedQty(saleId, itemId) {
  const returns = Array.isArray(state.returns) ? state.returns : [];
  let total = 0;
  returns.forEach((ret) => {
    if (String(ret.saleId) === String(saleId) && Array.isArray(ret.items)) {
      ret.items.forEach((ri) => {
        if (String(ri.itemId) === String(itemId)) {
          total += Number(ri.quantity || 0);
        }
      });
    }
  });
  return total;
}

function openReturnModal() {
  const sale = getSaleById(activeSaleId);
  if (!sale || isSaleVoid(sale) || isSaleReturned(sale) || !isAdmin()) return;

  els.returnModalTitle.textContent = "Retur Barang";
  els.returnModalMeta.textContent = `Pilih barang yang akan diretur dari transaksi ${escapeHtml(sale.id)}`;
  els.returnSaleId.textContent = sale.id;
  els.returnSaleDate.textContent = formatShortDateTime(new Date(sale.date));
  els.returnSaleTotal.textContent = formatCurrency(sale.total);
  els.returnReasonInput.value = "";

  // Render items with quantity inputs
  els.returnItemsList.innerHTML = sale.items
    .map((item) => {
      const soldQty = normalizeQuantity(item.quantity);
      const alreadyReturned = getAlreadyReturnedQty(sale.id, item.itemId);
      const remaining = Math.max(0, soldQty - alreadyReturned);
      const unitPrice = Number(item.price || 0);

      if (remaining <= 0) {
        return `
          <label class="return-item-row field return-item-fully-returned" style="opacity:0.5">
            <div class="return-item-info">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.sku)} | ${escapeHtml(item.unit)} @ ${formatCurrency(unitPrice)}</small>
              <span class="stock-pill low" style="margin-top:0.25rem;font-size:0.7rem">Sudah diretur semua</span>
            </div>
          </label>
        `;
      }

      const alreadyLabel = alreadyReturned > 0
        ? `<small style="color:var(--text-tertiary);font-size:0.65rem;display:block;">Sudah diretur: ${formatQuantity(alreadyReturned)} ${escapeHtml(item.unit)} | Sisa: ${formatQuantity(remaining)} ${escapeHtml(item.unit)}</small>`
        : `<small style="color:var(--text-tertiary);font-size:0.65rem;display:block;">Tersedia: ${formatQuantity(remaining)} ${escapeHtml(item.unit)}</small>`;

      return `
        <label class="return-item-row field">
          <div class="return-item-info">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.sku)} | ${escapeHtml(item.unit)} @ ${formatCurrency(unitPrice)}</small>
            ${alreadyLabel}
          </div>
          <div class="return-item-controls">
            <input
              type="number"
              class="return-qty-input"
              min="0.001"
              max="${remaining}"
              step="0.001"
              value="${remaining}"
              data-item-id="${escapeHtml(item.itemId)}"
              data-unit-price="${unitPrice}"
              data-max="${remaining}"
              inputmode="decimal"
            >
            <span class="return-item-refund" data-refund-display data-item-id="${escapeHtml(item.itemId)}">${formatCurrency(Math.round(remaining * unitPrice))}</span>
          </div>
        </label>
      `;
    })
    .join("");

  updateReturnRefundTotal();

  // Attach input events to quantity inputs
  els.returnItemsList.querySelectorAll(".return-qty-input").forEach((input) => {
    input.addEventListener("input", updateReturnRefundTotal);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleReturnSubmit();
      }
    });
  });

  els.returnModal.classList.remove("hidden");
  setTimeout(() => els.returnReasonInput.focus(), 100);
}

function closeReturnModal() {
  els.returnModal.classList.add("hidden");
  els.returnReasonInput.value = "";
}

function updateReturnRefundTotal() {
  let total = 0;
  els.returnItemsList.querySelectorAll(".return-qty-input").forEach((input) => {
    const qty = parseFloat(input.value) || 0;
    const unitPrice = Number(input.dataset.unitPrice || 0);
    const refund = Math.round(qty * unitPrice);
    total += refund;
    const display = input.closest(".return-item-row").querySelector("[data-refund-display]");
    if (display) display.textContent = formatCurrency(refund);
  });
  els.returnRefundTotal.textContent = formatCurrency(total);
}

async function handleReturnSubmit() {
  const reason = els.returnReasonInput.value.trim();
  if (!reason) {
    showToast("danger", "Alasan wajib diisi", "Isi alasan retur terlebih dahulu.");
    els.returnReasonInput.focus();
    return;
  }

  const items = [];
  let hasItems = false;
  els.returnItemsList.querySelectorAll(".return-qty-input").forEach((input) => {
    const qty = parseFloat(input.value) || 0;
    if (qty > 0) {
      hasItems = true;
      items.push({
        itemId: input.dataset.itemId,
        quantity: qty
      });
    }
  });

  if (!hasItems) {
    showToast("danger", "Tidak ada barang", "Pilih minimal satu barang dengan jumlah lebih dari 0.");
    return;
  }

  const saleIdNum = state.sales.find((s) => s.id === activeSaleId)?.dbId;
  if (!saleIdNum) {
    showToast("danger", "Error", "Data transaksi tidak ditemukan.");
    return;
  }

  const invoiceNumber = activeSaleId; // save before closeTransactionModal resets it

  els.confirmReturnBtn.disabled = true;
  els.confirmReturnBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Memproses...';

  try {
    const response = await apiRequest(POS_ROUTES.returnsStore, {
      method: "POST",
      body: { saleId: saleIdNum, reason, items }
    });

    setBootState(response.state);
    closeReturnModal();
    closeTransactionModal();
    renderAll();
    showToast("success", "Retur Berhasil", `Barang dari ${invoiceNumber} berhasil diretur. Stok sudah dikembalikan.`);
  } catch (error) {
    showToast("danger", "Gagal Retur", error.message);
  } finally {
    els.confirmReturnBtn.disabled = false;
    els.confirmReturnBtn.innerHTML = '<span class="material-symbols-outlined">assignment_return</span> Proses Retur';
  }
}

function handleReturnSearch() {
  renderAll();
}

// ─── Opname Functions ────────────────────────────────────────────────

function renderOpnames() {
  if (!els.opnameTableBody) return;
  const opnames = Array.isArray(state.opnames) ? state.opnames : [];
  const query = (els.opnameSearch?.value || "").trim().toLowerCase();

  const filtered = query
    ? opnames.filter((o) =>
        matchesQuery([o.opnameNumber, o.createdBy], query)
      )
    : opnames;

  // Metrics
  const totalCount = filtered.length;
  const totalDiscrepancy = filtered.reduce((sum, o) => sum + (o.discrepancyItems || 0), 0);
  const totalAdjustment = filtered.reduce((sum, o) => sum + Math.abs(o.totalAdjustment || 0), 0);

  if (els.opnameTotalCount) els.opnameTotalCount.textContent = formatNumber(totalCount);
  if (els.opnameTotalHint) els.opnameTotalHint.textContent = `${formatNumber(totalCount)} kali stok opname`;
  if (els.opnameDiscrepancyCount) els.opnameDiscrepancyCount.textContent = formatNumber(totalDiscrepancy);
  if (els.opnameDiscrepancyHint) els.opnameDiscrepancyHint.textContent = `Total item dengan selisih dari ${formatNumber(totalCount)} opname`;
  if (els.opnameAdjustmentTotal) els.opnameAdjustmentTotal.textContent = formatCurrency(totalAdjustment);
  if (els.opnameAdjustmentHint) els.opnameAdjustmentHint.textContent = `Nilai penyesuaian dari ${formatNumber(totalCount)} opname`;

  // Table
  els.opnameTableBody.innerHTML = filtered.length
    ? filtered
        .map((o) => {
          const adjustClass = o.totalAdjustment >= 0 ? "profit-positive" : "profit-negative";
          return `
            <tr>
              <td><strong>${escapeHtml(o.opnameNumber)}</strong></td>
              <td>${formatShortDateTime(new Date(o.completedAt || o.createdAt))}</td>
              <td class="align-right">${formatNumber(o.totalItems)}</td>
              <td class="align-right"><span class="${o.discrepancyItems > 0 ? "opname-status-shortage" : "opname-status-matched"}">${formatNumber(o.discrepancyItems)}</span></td>
              <td class="align-right"><strong class="${adjustClass}">${formatCurrency(Math.abs(o.totalAdjustment))}</strong></td>
              <td><span class="chip chip-primary">Selesai</span></td>
              <td>${escapeHtml(o.createdBy)}</td>
              <td class="align-right">
                <button class="mini-button" type="button" data-opname-action="detail" data-opname-id="${escapeHtml(o.id)}">Detail</button>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="8">${renderEmptyState(query ? "Tidak ada riwayat opname yang sesuai dengan pencarian." : "Belum ada stok opname.")}</td></tr>`;
}

function openOpnameModal() {
  if (!isAdmin()) return;

  // Populate category filter
  const categories = state.categories || [];
  els.opnameCategoryFilter.innerHTML = '<option value="all">Semua Kategori</option>'
    + categories.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");

  els.opnameModalSearch.value = "";
  els.opnameCategoryFilter.value = "all";
  els.opnameNotesInput.value = "";

  renderOpnameModalItems();

  els.opnameModal.classList.remove("hidden");
  setTimeout(() => els.opnameNotesInput.focus(), 100);
}

function closeOpnameModal() {
  els.opnameModal.classList.add("hidden");
  els.opnameModalSearch.value = "";
  els.opnameCategoryFilter.value = "all";
  els.opnameNotesInput.value = "";
}

function getFilteredOpnameItems() {
  const query = (els.opnameModalSearch?.value || "").trim().toLowerCase();
  const category = els.opnameCategoryFilter?.value || "all";

  return state.inventory.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (query && !matchesQuery([item.name, item.sku], query)) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function renderOpnameModalItems() {
  const items = getFilteredOpnameItems();

  if (!items.length) {
    els.opnameModalBody.innerHTML = `<tr><td colspan="7">${renderEmptyState("Tidak ada barang yang sesuai dengan filter.")}</td></tr>`;
    updateOpnameDiscrepancySummary();
    return;
  }

  els.opnameModalBody.innerHTML = items
    .map((item, index) => {
      const systemStock = normalizeQuantity(item.stock);
      return `
        <tr class="opname-item-row">
          <td class="align-right">${index + 1}</td>
          <td>
            <div class="name-cell">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.category)} | ${escapeHtml(item.unit)}</small>
            </div>
          </td>
          <td>${escapeHtml(item.sku)}</td>
          <td class="align-right opname-system-stock">${formatQuantity(systemStock)}</td>
          <td class="align-right">
            <input
              type="number"
              class="opname-actual-input"
              min="0"
              step="${item.unit && ["kg","kilo","gram","gr","liter","ltr","meter"].includes(item.unit.toLowerCase()) ? "0.001" : "1"}"
              value="${formatDecimalInput(systemStock)}"
              data-item-id="${escapeHtml(item.id)}"
              data-system-stock="${systemStock}"
              inputmode="decimal"
            >
          </td>
          <td class="align-right">
            <span class="opname-diff-display" data-diff-for="${escapeHtml(item.id)}">0</span>
          </td>
          <td>
            <span class="opname-status-display opname-status-matched" data-status-for="${escapeHtml(item.id)}">Sesuai</span>
          </td>
        </tr>
      `;
    })
    .join("");

  // Attach input events for live discrepancy calculation
  els.opnameModalBody.querySelectorAll(".opname-actual-input").forEach((input) => {
    input.addEventListener("input", function () {
      updateOpnameItemDiscrepancy(this);
      updateOpnameDiscrepancySummary();
    });
  });

  updateOpnameDiscrepancySummary();
}

function updateOpnameItemDiscrepancy(input) {
  const itemId = input.dataset.itemId;
  const systemStock = parseFloat(input.dataset.systemStock) || 0;
  const actualStock = parseFloat(input.value) || 0;
  const difference = Math.round((actualStock - systemStock) * 1000) / 1000;

  const diffDisplay = document.querySelector(`[data-diff-for="${escapeHtml(itemId)}"]`);
  const statusDisplay = document.querySelector(`[data-status-for="${escapeHtml(itemId)}"]`);

  if (diffDisplay) {
    const diffClass = difference > 0.001 ? "opname-diff-positive" : difference < -0.001 ? "opname-diff-negative" : "";
    diffDisplay.textContent = (difference >= 0 ? "+" : "") + formatQuantity(Math.abs(difference));
    diffDisplay.className = "opname-diff-display " + diffClass;
  }

  if (statusDisplay) {
    if (Math.abs(difference) <= 0.001) {
      statusDisplay.textContent = "Sesuai";
      statusDisplay.className = "opname-status-display opname-status-matched";
    } else if (difference > 0) {
      statusDisplay.textContent = "Surplus";
      statusDisplay.className = "opname-status-display opname-status-surplus";
    } else {
      statusDisplay.textContent = "Shortage";
      statusDisplay.className = "opname-status-display opname-status-shortage";
    }
  }
}

function updateOpnameDiscrepancySummary() {
  const inputs = els.opnameModalBody.querySelectorAll(".opname-actual-input");
  let total = 0;
  let matched = 0;
  let discrepancy = 0;
  let adjustment = 0;

  inputs.forEach((input) => {
    total++;
    const systemStock = parseFloat(input.dataset.systemStock) || 0;
    const actualStock = parseFloat(input.value) || 0;
    const diff = Math.round((actualStock - systemStock) * 1000) / 1000;

    if (Math.abs(diff) <= 0.001) {
      matched++;
    } else {
      discrepancy++;
      adjustment += Math.abs(Math.round(diff * parseFloat(input.closest("tr")?.querySelector(".opname-system-stock")?.textContent?.replace(/[^\d,.-]/g, "")?.replace(",", ".") || 0)));
    }
  });

  // Better adjustment calculation: use actual item price
  adjustment = 0;
  inputs.forEach((input) => {
    const systemStock = parseFloat(input.dataset.systemStock) || 0;
    const actualStock = parseFloat(input.value) || 0;
    const diff = Math.round((actualStock - systemStock) * 1000) / 1000;
    if (Math.abs(diff) > 0.001) {
      const itemId = input.dataset.itemId;
      const item = getItemById(itemId);
      if (item) {
        adjustment += Math.abs(Math.round(diff * item.price));
      }
    }
  });

  if (els.opnameSummaryTotal) els.opnameSummaryTotal.textContent = formatNumber(total);
  if (els.opnameSummaryMatched) els.opnameSummaryMatched.textContent = formatNumber(matched);
  if (els.opnameSummaryDiscrepancy) els.opnameSummaryDiscrepancy.textContent = formatNumber(discrepancy);
  if (els.opnameSummaryAdjustment) els.opnameSummaryAdjustment.textContent = formatCurrency(adjustment);
}

function handleOpnameModalFilter() {
  renderOpnameModalItems();
}

async function handleOpnameSubmit() {
  const inputs = els.opnameModalBody.querySelectorAll(".opname-actual-input");
  const items = [];
  let hasChanges = false;

  inputs.forEach((input) => {
    const systemStock = parseFloat(input.dataset.systemStock) || 0;
    const actualStock = parseFloat(input.value) || 0;
    const diff = Math.round((actualStock - systemStock) * 1000) / 1000;

    if (Math.abs(diff) > 0.001) {
      hasChanges = true;
    }
    items.push({
      itemId: Number(input.dataset.itemId),
      actualStock: actualStock
    });
  });

  if (!items.length) {
    showToast("danger", "Tidak ada barang", "Tidak ada barang yang tersedia untuk diopname.");
    return;
  }

  if (!hasChanges) {
    showToast("danger", "Tidak ada perubahan", "Semua stok sudah sesuai dengan stok sistem. Tidak ada yang perlu disesuaikan.");
    return;
  }

  const notes = els.opnameNotesInput.value.trim();

  els.confirmOpnameBtn.disabled = true;
  els.confirmOpnameBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Memproses...';

  try {
    const response = await apiRequest(POS_ROUTES.opnamesStore, {
      method: "POST",
      body: { items, notes }
    });

    setBootState(response.state);
    closeOpnameModal();
    renderAll();
    showToast("success", "Stok Opname Berhasil", "Stok barang sudah disesuaikan berdasarkan opname.");
  } catch (error) {
    showToast("danger", "Gagal Opname", error.message);
  } finally {
    els.confirmOpnameBtn.disabled = false;
    els.confirmOpnameBtn.innerHTML = '<span class="material-symbols-outlined">fact_check</span> Proses Opname';
  }
}

function handleOpnameTableClick(event) {
  const button = event.target.closest("[data-opname-action]");
  if (!button) return;

  const opnameId = button.dataset.opnameId;
  const action = button.dataset.opnameAction;

  if (action === "detail") {
    const opname = state.opnames.find((o) => String(o.id) === String(opnameId));
    if (!opname) {
      showToast("danger", "Tidak ditemukan", "Data opname tidak ditemukan.");
      return;
    }
    showToast("info", opname.opnameNumber, `${opname.notes || "Tidak ada catatan"} | ${formatNumber(opname.totalItems)} item, ${formatNumber(opname.discrepancyItems)} selisih, ${formatCurrency(Math.abs(opname.totalAdjustment))} penyesuaian.`);
  }
}

function openTransactionModal(saleId) {
  const sale = getSaleById(saleId);
  if (!sale) {
    showToast("danger", "Transaksi tidak ditemukan", "Data transaksi ini tidak tersedia di daftar penjualan.");
    return;
  }

  activeSaleId = sale.id;
  const isVoid = isSaleVoid(sale);
  const isReturned = isSaleReturned(sale);
  let statusBadge;
  if (isVoid) {
    statusBadge = '<span class="void-badge">VOID</span> ';
  } else if (isReturned) {
    const label = sale.status === 'returned' ? 'RETURN' : 'RETURN (Partial)';
    statusBadge = `<span class="status-badge status-returned">${label}</span> `;
  } else {
    statusBadge = '<span class="status-badge status-paid">PAID</span> ';
  }
  els.transactionModalTitle.innerHTML = `${statusBadge}${escapeHtml(sale.id)}`;
  els.transactionModalMeta.textContent = `${formatShortDateTime(sale.date)} | ${formatNumber(sale.items.length)} item`;
  els.transactionDetailItems.innerHTML = sale.items
    .map((item) => {
      const invItem = getItemById(item.itemId);
      const purchasePrice = Number(invItem?.purchasePrice || 0);
      const sellPrice = Number(item.price || 0);
      const qty = normalizeQuantity(item.quantity);
      const profitPerUnit = purchasePrice > 0 ? sellPrice - purchasePrice : 0;
      const totalProfit = Math.round(profitPerUnit * qty);
      return `
        <tr>
          <td>
            <div class="name-cell">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.sku)} | ${escapeHtml(item.category)}</small>
            </div>
          </td>
          <td class="align-right">${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}</td>
          <td class="align-right">${formatCurrency(item.price)}</td>
          <td class="align-right"><strong class="${profitPerUnit >= 0 ? "profit-positive" : "profit-negative"}">${purchasePrice > 0 ? formatCurrency(profitPerUnit) : '-'}</strong>${purchasePrice > 0 ? `<small class="profit-sub">×${formatQuantity(qty)} = ${formatCurrency(totalProfit)}</small>` : ''}</td>
          <td class="align-right"><strong>${formatCurrency(Math.round(qty * item.price))}</strong></td>
        </tr>
      `;
    })
    .join("");

  const totalProfit = sale.items.reduce((sum, item) => {
    const invItem = getItemById(item.itemId);
    const purchasePrice = Number(invItem?.purchasePrice || 0);
    const sellPrice = Number(item.price || 0);
    const qty = normalizeQuantity(item.quantity);
    const profitPerUnit = purchasePrice > 0 ? sellPrice - purchasePrice : 0;
    return sum + Math.round(profitPerUnit * qty);
  }, 0);

  const proofHtml = sale.proofUrl
    ? `<div class="proof-img-wrap">
        <span>Bukti Bayar</span>
        <a href="${escapeHtml(sale.proofUrl)}" target="_blank" rel="noopener">
          <span class="material-symbols-outlined" style="font-size:1rem">open_in_new</span> Lihat bukti
        </a>
        <br><img src="${escapeHtml(sale.proofUrl)}" class="proof-img-thumb" alt="Bukti pembayaran">
       </div>`
    : "";

  if (isVoid && sale.voidReason) {
    els.transactionDetailSummary.innerHTML = `
      <div class="void-info-box">
        <span class="material-symbols-outlined">info</span>
        <div>
          <strong>Alasan Void:</strong> ${escapeHtml(sale.voidReason)}
          ${sale.voidedBy ? `<br><small>Oleh: ${escapeHtml(sale.voidedBy)} ${sale.voidedAt ? "· "+formatShortDateTime(new Date(sale.voidedAt)) : ""}</small>` : ""}
        </div>
      </div>
      <div><span>Metode Bayar</span><strong>${getPaymentMethodLabel(sale)}</strong></div>
      <div><span>Subtotal</span><strong>${formatCurrency(sale.subtotal)}</strong></div>
      <div><span>Diskon</span><strong>${formatCurrency(sale.discount)}</strong></div>
      <div><span>Total</span><strong>${formatCurrency(sale.total)}</strong></div>
      <div><span>Bayar</span><strong>${formatCurrency(sale.payment)}</strong></div>
      <div><span>Kembalian</span><strong>${formatCurrency(sale.change)}</strong></div>
      <div class="summary-line-highlight"><span>Laba Kotor</span><strong class="${totalProfit >= 0 ? "profit-positive" : "profit-negative"}">${formatCurrency(totalProfit)}</strong></div>
      ${proofHtml}
    `;
  } else {
    els.transactionDetailSummary.innerHTML = `
      <div><span>Metode Bayar</span><strong>${getPaymentMethodLabel(sale)}</strong></div>
      <div><span>Subtotal</span><strong>${formatCurrency(sale.subtotal)}</strong></div>
      <div><span>Diskon</span><strong>${formatCurrency(sale.discount)}</strong></div>
      <div><span>Total</span><strong>${formatCurrency(sale.total)}</strong></div>
      <div><span>Bayar</span><strong>${formatCurrency(sale.payment)}</strong></div>
      <div><span>Kembalian</span><strong>${formatCurrency(sale.change)}</strong></div>
      <div class="summary-line-highlight"><span>Laba Kotor</span><strong class="${totalProfit >= 0 ? "profit-positive" : "profit-negative"}">${formatCurrency(totalProfit)}</strong></div>
      ${proofHtml}
    `;
  }

  els.voidTransactionBtn.classList.toggle("hidden", isVoid || isReturned || !isAdmin());
  els.returnTransactionBtn.classList.toggle("hidden", isVoid || isReturned || !isAdmin());
  els.transactionModal.classList.remove("hidden");
}

function closeTransactionModal() {
  activeSaleId = null;
  els.transactionModal.classList.add("hidden");
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
    purchasePrice: parseInteger(els.itemPurchasePrice?.value) || 0,
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
          purchasePrice: payload.purchasePrice,
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
    showConfirmDelete({
      type: "supplier",
      name: supplier.name,
      id: supplierId,
      endpoint: `${POS_ROUTES.suppliersBase}/${supplierId}`,
      method: "DELETE",
      onSuccess: (response) => {
        showToast("info", "Supplier dihapus", response.message || `${supplier.name} berhasil dihapus.`);
      },
      onError: (error) => {
        showToast("danger", "Gagal menghapus supplier", error.message);
      }
    });
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

function filterSalesByDate(day, includeAll = false) {
  const target = formatDateInput(day);
  return state.sales.filter((sale) => {
    if (formatDateInput(new Date(sale.date)) !== target) return false;
    if (includeAll) return true;
    return !isSaleVoid(sale);
  });
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
    current.count += 1;
    if (!isSaleVoid(sale)) {
      current.total += sale.total;
    }
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
    current.count += 1;
    if (!isSaleVoid(sale)) {
      current.total += sale.total;
    }
  });
  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map((entry) => entry[1]);
}

function getFinanceSummary() {
  const activeSales = getNonReturnedSales();
  const totalRefunds = Array.isArray(state.returns)
    ? state.returns.reduce((sum, r) => sum + Number(r.totalRefund || 0), 0)
    : 0;
  const totalVoid = activeSales
    .filter(s => isSaleVoid(s))
    .reduce((sum, s) => sum + Number(s.total || 0), 0);
  const revenue = activeSales
    .filter(s => !isSaleVoid(s))
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0) - totalRefunds;
  const expense = state.goodsIn.reduce((sum, entry) => sum + getGoodsInTotal(entry), 0);
  const profit = revenue - expense;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;

  // Gross profit per item — skip returned & void sales
  const grossProfitData = activeSales.reduce((data, sale) => {
    if (isSaleReturned(sale) || isSaleVoid(sale)) return data;
    sale.items.forEach((item) => {
      const invItem = getItemById(item.itemId);
      const purchasePrice = Number(invItem?.purchasePrice || 0);
      const sellPrice = Number(item.price || 0);
      const qty = normalizeQuantity(item.quantity);
      if (purchasePrice > 0) {
        data.total += Math.round((sellPrice - purchasePrice) * qty);
      } else {
        data.unknown += Math.round(sellPrice * qty);
      }
    });
    return data;
  }, { total: 0, unknown: 0 });

  return {
    revenue,
    expense,
    profit,
    margin,
    grossProfit: grossProfitData.total,
    grossProfitUnknown: grossProfitData.unknown,
    salesCount: activeSales.length,
    receiptCount: state.goodsIn.length,
    totalRefunds,
    totalVoid
  };
}

function getFinanceLedger() {
  let runningBalance = 0;
  const rows = [
    ...getNonReturnedSales().flatMap((sale) => {
      if (isSaleReturned(sale)) {
        return {
          date: sale.date,
          type: "Retur",
          direction: "expense",
          reference: sale.id,
          description: `${sale.status === 'returned' ? 'Retur penuh' : 'Retur sebagian'} — ${summarizeTransactionItems(sale)}`,
          income: 0,
          expense: Number(sale.total || 0)
        };
      }
      if (isSaleVoid(sale)) {
        return {
          date: sale.date,
          type: "Void",
          direction: "expense",
          reference: sale.id,
          description: `Transaksi dibatalkan — ${summarizeTransactionItems(sale)}`,
          income: 0,
          expense: Number(sale.total || 0)
        };
      }
      return {
        date: sale.date,
        type: "Pendapatan",
        direction: "income",
        reference: sale.id,
        description: summarizeTransactionItems(sale),
        income: Number(sale.total || 0),
        expense: 0
      };
    }),
    ...state.goodsIn.map((entry) => ({
      date: entry.date,
      type: "Pengeluaran",
      direction: "expense",
      reference: `IN-${entry.id}`,
      description: `${entry.itemName} dari ${entry.supplier}`,
      income: 0,
      expense: getGoodsInTotal(entry)
    }))
  ].sort((left, right) => new Date(left.date) - new Date(right.date));

  return rows
    .map((entry) => {
      runningBalance += entry.income - entry.expense;
      return {
        ...entry,
        balance: runningBalance
      };
    })
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

function getGoodsInTotal(entry) {
  return Math.round(normalizeQuantity(entry.quantity) * Number(entry.cost || 0));
}

function getItemById(itemId) {
  return state.inventory.find((item) => String(item.id) === String(itemId));
}

function getSaleById(saleId) {
  return state.sales.find((sale) => String(sale.id) === String(saleId));
}

function isSaleVoid(sale) {
  return sale?.status === "void";
}

function isSaleReturned(sale) {
  return sale?.status === "returned" || sale?.status === "partial_return";
}

function isSalePending(sale) {
  return sale?.status === "pending";
}

function isSaleCompleted(sale) {
  return !isSaleVoid(sale) && !isSaleReturned(sale) && !isSalePending(sale);
}

function getVoidAnalytics() {
  const voidLogs = Array.isArray(state.voidLogs) ? state.voidLogs : [];
  const totalCount = voidLogs.length;
  const totalNominal = voidLogs.reduce((sum, log) => sum + Number(log.saleTotal || 0), 0);
  const restoredItems = voidLogs.reduce((sum, log) => {
    if (!log.restoredItems) return sum;
    const items = typeof log.restoredItems === "string" ? JSON.parse(log.restoredItems) : log.restoredItems;
    if (Array.isArray(items)) {
      return sum + items.reduce((s, i) => s + Number(i.quantity || 0), 0);
    }
    return sum;
  }, 0);
  return { totalCount, totalNominal, restoredItems };
}

function getNonReturnedSales() {
  return state.sales.filter((s) => !isSaleReturned(s) && !isSalePending(s));
}

function getVoidSales() {
  return state.sales.filter((s) => isSaleVoid(s));
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

function isAdmin(auth = state?.auth) {
  return auth?.canManage === true || auth?.role === "admin";
}

function isCashier(auth = state?.auth) {
  return auth?.role === "cashier";
}

function getAllowedViews(auth = state?.auth) {
  return isAdmin(auth) ? ADMIN_VIEWS : CASHIER_VIEWS;
}

function formatRoleLabel(role) {
  return role === "cashier" ? "Kasir" : "Admin";
}

function translateApiMessage(message) {
  const text = String(message || "");
  const map = {
    "validation.required": "Data wajib diisi.",
    "validation.email": "Format email tidak valid.",
    "validation.unique": "Data sudah digunakan.",
    "validation.min.string": "Nilai yang diisi terlalu pendek."
  };

  return map[text] || text;
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
  temp.querySelectorAll(".table-actions, .activity-actions").forEach((node) => node.remove());
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
          <div class="row"><span>Metode</span><span>${escapeHtml(getReceiptPaymentLabel(receipt))}</span></div>
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
