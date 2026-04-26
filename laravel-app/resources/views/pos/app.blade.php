<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ $csrfToken }}">
  <title>{{ config('app.name') }} | Sistem Informasi Persediaan</title>
  <meta
    name="description"
    content="Sistem informasi persediaan barang penjualan TB. Losari Jaya 2 berbasis website."
  >
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  >
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1"
    rel="stylesheet"
  >
  <link rel="stylesheet" href="{{ asset('pos/styles.css') }}">
</head>
<body>
  <div class="ambient ambient-one"></div>
  <div class="ambient ambient-two"></div>
  <div class="ambient ambient-three"></div>

  <div id="toastContainer" class="toast-stack" aria-live="polite"></div>

  <section id="loginView" class="login-shell">
    <div class="login-hero">
      <div class="brand-badge">
        <img src="{{ asset('pos/logolj2.png') }}" alt="Logo TB. Losari Jaya 2" class="brand-mark">
      </div>

      <div class="login-copy">
        <p class="eyebrow">TB. Losari Jaya 2</p>
        <h1>Sistem Informasi Penataan Persediaan Barang Penjualan</h1>
        <p class="login-description">
          Website ini mengimplementasikan alur inti proposal TB. Losari Jaya 2:
          dashboard real time, manajemen barang, transaksi kasir, barang masuk,
          dan laporan penjualan maupun stok.
        </p>
      </div>

      <div class="feature-grid">
        <article class="feature-card">
          <span class="material-symbols-outlined">dashboard</span>
          <div>
            <h2>Dashboard Operasional</h2>
            <p>Ringkasan stok minimum, penjualan harian, dan aktivitas terbaru.</p>
          </div>
        </article>
        <article class="feature-card">
          <span class="material-symbols-outlined">inventory_2</span>
          <div>
            <h2>Barang & Restock</h2>
            <p>Kelola data master barang sekaligus catat transaksi barang masuk.</p>
          </div>
        </article>
        <article class="feature-card">
          <span class="material-symbols-outlined">point_of_sale</span>
          <div>
            <h2>Kasir Interaktif</h2>
            <p>Pencarian barang cepat, keranjang belanja, pembayaran, dan cetak nota.</p>
          </div>
        </article>
        <article class="feature-card">
          <span class="material-symbols-outlined">assessment</span>
          <div>
            <h2>Laporan Siap Ekspor</h2>
            <p>Filter periode, rekap transaksi, dan ekspor CSV atau cetak PDF.</p>
          </div>
        </article>
      </div>
    </div>

    <div class="login-panel surface-panel">
      <div class="login-panel-head">
        <img src="{{ asset('pos/logolj2.png') }}" alt="Logo TB. Losari Jaya 2" class="login-panel-brand">
        <p class="eyebrow">Masuk Demo</p>
        <p>Gunakan akun demo untuk membuka website implementasi proposal.</p>
      </div>

      <div class="demo-chip-row">
        <span class="chip chip-soft">Username: <strong>admin</strong></span>
        <span class="chip chip-soft">Password: <strong>losari123</strong></span>
      </div>

      <form id="loginForm" class="form-stack">
        <label class="field">
          <span>Username</span>
          <input id="loginUsername" name="username" type="text" value="admin" autocomplete="username" required>
        </label>

        <label class="field">
          <span>Password</span>
          <input
            id="loginPassword"
            name="password"
            type="password"
            value="losari123"
            autocomplete="current-password"
            required
          >
        </label>

        <button type="submit" class="button button-primary button-block">
          <span class="material-symbols-outlined">login</span>
          Masuk ke Sistem
        </button>
      </form>

      <div class="login-footnote">
        <p>Masuk untuk mengelola persediaan stok barang dan keuangan toko.</p>
      </div>
    </div>
  </section>

  <div id="appView" class="app-shell hidden">
    <div id="sidebarOverlay" class="sidebar-overlay"></div>

    <aside id="sidebar" class="sidebar">
      <div class="sidebar-head">
        <img src="{{ asset('pos/logolj2.png') }}" alt="Logo TB. Losari Jaya 2" class="sidebar-brand-image">
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item active" data-nav="dashboard">
          <span class="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </button>
        <button class="nav-item" data-nav="inventory">
          <span class="material-symbols-outlined">inventory_2</span>
          <span>Barang</span>
        </button>
        <button class="nav-item" data-nav="cashier">
          <span class="material-symbols-outlined">point_of_sale</span>
          <span>Transaksi/Kasir</span>
        </button>
        <button class="nav-item" data-nav="finance">
          <span class="material-symbols-outlined">account_balance_wallet</span>
          <span>Keuangan</span>
        </button>
        <button class="nav-item" data-nav="reports">
          <span class="material-symbols-outlined">assessment</span>
          <span>Laporan</span>
        </button>
      </nav>

      <div class="sidebar-foot">
        <button id="resetDemoBtn" class="button button-muted button-block" type="button">
          <span class="material-symbols-outlined">refresh</span>
          Reset Demo
        </button>
        <button id="logoutBtn" class="nav-item nav-item-foot" type="button">
          <span class="material-symbols-outlined">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar glass-panel">
        <div class="topbar-leading">
          <button id="menuToggle" class="icon-button mobile-only" type="button" aria-label="Buka menu">
            <span class="material-symbols-outlined">menu</span>
          </button>

          <div class="header-copy">
            <p id="headerEyebrow" class="eyebrow">Overview</p>
            <h2 id="headerTitle">Dashboard</h2>
            <p id="headerSubtitle">Ringkasan utama persediaan dan transaksi toko.</p>
          </div>
        </div>

        <div class="topbar-actions">
          <label class="search-field topbar-search">
            <span class="material-symbols-outlined">search</span>
            <input id="globalSearch" type="text" placeholder="Cari barang, SKU, atau transaksi...">
          </label>

          <div class="topbar-meta">
            <div class="meta-pill">
              <span class="material-symbols-outlined">calendar_month</span>
              <span id="headerDate"></span>
            </div>
            <div class="meta-pill meta-pill-accent">
              <span class="material-symbols-outlined">verified_user</span>
              <span>Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main class="page-shell">
        <section class="page active" data-view="dashboard">
          <div class="page-head">
            <div>
              <p class="eyebrow">Overview Hari Ini</p>
              <h3>Kontrol operasional toko dalam satu layar.</h3>
              <p>Lihat performa penjualan, stok minimum, dan aktivitas barang masuk secara real time.</p>
            </div>

            <button id="dashboardExportBtn" class="button button-soft" type="button">
              <span class="material-symbols-outlined">download</span>
              Unduh Laporan
            </button>
          </div>

          <div class="metric-grid">
            <article class="metric-card">
              <div class="metric-icon metric-primary">
                <span class="material-symbols-outlined">receipt_long</span>
              </div>
              <div class="metric-copy">
                <span>Total Transaksi Hari Ini</span>
                <strong id="metricTransactions">0</strong>
                <small id="metricTransactionsDelta">0 transaksi dibanding kemarin</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-icon metric-secondary">
                <span class="material-symbols-outlined">payments</span>
              </div>
              <div class="metric-copy">
                <span>Penjualan Hari Ini</span>
                <strong id="metricRevenue">Rp 0</strong>
                <small id="metricRevenueDelta">Performa penjualan harian</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-icon metric-neutral">
                <span class="material-symbols-outlined">inventory</span>
              </div>
              <div class="metric-copy">
                <span>Total SKU Aktif</span>
                <strong id="metricSku">0</strong>
                <small id="metricSkuDetail">Barang aktif di data master</small>
              </div>
            </article>

            <article class="metric-card metric-card-warn">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">warning</span>
              </div>
              <div class="metric-copy">
                <span>Stok Menipis</span>
                <strong id="metricLowStock">0</strong>
                <small id="metricLowStockDetail">Perlu restock segera</small>
              </div>
            </article>
          </div>

          <div class="dashboard-grid">
            <article class="surface-panel panel-large">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Tren Penjualan</p>
                  <h4>Performa 7 hari terakhir</h4>
                </div>
                <div class="inline-status">
                  <span class="chip chip-primary">Pekan Ini</span>
                </div>
              </div>
              <div id="salesTrendChart" class="trend-chart"></div>
            </article>

            <article class="surface-panel panel-side">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Perhatian Stok</p>
                  <h4>Barang prioritas restock</h4>
                </div>
                <button id="restockShortcutBtn" class="icon-button" type="button" aria-label="Lihat restock">
                  <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div id="lowStockList" class="stack-list"></div>
            </article>
          </div>

          <div class="dashboard-grid dashboard-grid-secondary">
            <article class="surface-panel">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Transaksi Terbaru</p>
                  <h4>Aktivitas kasir</h4>
                </div>
              </div>
              <div id="recentSalesList" class="activity-list"></div>
            </article>

            <article class="surface-panel">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Barang Masuk</p>
                  <h4>Restock terbaru</h4>
                </div>
              </div>
              <div id="goodsInSnapshot" class="activity-list"></div>
            </article>
          </div>
        </section>

        <section class="page" data-view="inventory">
          <div class="page-head">
            <div>
              <p class="eyebrow">Manajemen Barang</p>
              <h3>Kelola inventaris, stok, dan restock barang.</h3>
              <p>Modul ini menggabungkan data master barang dan transaksi barang masuk.</p>
            </div>

            <div class="button-row">
              <button id="openAddItemBtn" class="button button-primary" type="button">
                <span class="material-symbols-outlined">add</span>
                Tambah Barang
              </button>
              <button id="openAddSupplierBtn" class="button button-soft hidden" type="button">
                <span class="material-symbols-outlined">person_add</span>
                Tambah Supplier
              </button>
            </div>
          </div>

          <div class="segmented segmented-wide">
            <button class="segment active" data-inventory-mode="catalog" type="button">Daftar Barang</button>
            <button class="segment" data-inventory-mode="incoming" type="button">Barang Masuk</button>
            <button class="segment" data-inventory-mode="suppliers" type="button">Supplier</button>
            <button class="segment" data-inventory-mode="masters" type="button">Master Data</button>
          </div>

          <div id="inventoryCatalogPanel" class="inventory-mode">
            <div class="toolbar surface-strip">
              <label class="search-field">
                <span class="material-symbols-outlined">search</span>
                <input id="inventorySearch" type="text" placeholder="Cari nama barang atau SKU...">
              </label>

              <label class="select-field">
                <span>Kategori</span>
                <select id="inventoryCategoryFilter"></select>
              </label>
            </div>

            <article class="surface-panel">
              <div class="table-shell">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Supplier</th>
                      <th>Stok</th>
                      <th>Harga Jual</th>
                      <th class="align-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="inventoryTableBody"></tbody>
                </table>
              </div>
            </article>
          </div>

          <div id="inventoryIncomingPanel" class="inventory-mode hidden">
            <div class="split-grid">
              <article class="surface-panel">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">Form Barang Masuk</p>
                    <h4>Catat penerimaan barang dari supplier</h4>
                  </div>
                </div>

                <form id="incomingForm" class="form-grid">
                  <label class="field">
                    <span>Tanggal</span>
                    <input id="incomingDate" name="date" type="date" required>
                  </label>

                  <label class="field">
                    <span>Supplier</span>
                    <select id="incomingSupplier" name="supplier" required></select>
                  </label>

                  <label class="field field-full">
                    <span>Barang</span>
                    <select id="incomingItem" name="itemId" required></select>
                  </label>

                  <label class="field">
                    <span>Jumlah Masuk</span>
                    <input id="incomingQuantity" name="quantity" type="number" min="0.001" step="0.001" inputmode="decimal" placeholder="0" required>
                  </label>

                  <label class="field">
                    <span>Harga Beli per Unit</span>
                    <input id="incomingCost" name="cost" type="number" min="0" step="1000" placeholder="0" required>
                  </label>

                  <label class="field field-full">
                    <span>Catatan</span>
                    <textarea id="incomingNote" name="note" rows="4" placeholder="Contoh: restock mingguan untuk kebutuhan proyek."></textarea>
                  </label>

                  <button class="button button-primary field-full" type="submit">
                    <span class="material-symbols-outlined">inventory</span>
                    Simpan Barang Masuk
                  </button>
                </form>
              </article>

              <article class="surface-panel">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">Riwayat Restock</p>
                    <h4>Penerimaan barang terbaru</h4>
                  </div>
                </div>
                <div id="incomingHistoryList" class="activity-list"></div>
              </article>
            </div>
          </div>

          <div id="inventorySuppliersPanel" class="inventory-mode hidden">
            <div class="toolbar surface-strip">
              <div class="supplier-summary-card">
                <span class="material-symbols-outlined">apartment</span>
                <div>
                  <strong id="supplierSummaryCount">0 Supplier</strong>
                  <small>Master supplier aktif untuk stok dan restock.</small>
                </div>
              </div>
            </div>

            <article class="surface-panel">
              <div class="table-shell">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nama Supplier</th>
                      <th>Total Barang</th>
                      <th>Total Restock</th>
                      <th class="align-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="supplierTableBody"></tbody>
                </table>
              </div>
            </article>
          </div>

          <div id="inventoryMastersPanel" class="inventory-mode hidden">
            <div class="master-grid">
              <article class="surface-panel">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">Master Kategori</p>
                    <h4>Kategori Barang</h4>
                    <small id="categoryMasterCount">0 kategori aktif</small>
                  </div>
                </div>
                <form id="categoryMasterForm" class="master-entry-form">
                  <label class="field">
                    <span>Nama Kategori</span>
                    <input id="categoryMasterName" name="name" type="text" placeholder="Contoh: Elektrikal" required>
                  </label>
                  <button class="button button-primary" type="submit">
                    <span class="material-symbols-outlined">add</span>
                    Tambah
                  </button>
                </form>
                <div id="categoryMasterList" class="master-chip-grid"></div>
              </article>

              <article class="surface-panel">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">Master Satuan</p>
                    <h4>Satuan Barang</h4>
                    <small id="unitMasterCount">0 satuan aktif</small>
                  </div>
                </div>
                <form id="unitMasterForm" class="master-entry-form">
                  <label class="field">
                    <span>Nama Satuan</span>
                    <input id="unitMasterName" name="name" type="text" placeholder="Contoh: dus" required>
                  </label>
                  <button class="button button-primary" type="submit">
                    <span class="material-symbols-outlined">add</span>
                    Tambah
                  </button>
                </form>
                <div id="unitMasterList" class="master-chip-grid"></div>
              </article>
            </div>

            <article class="surface-panel">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Catatan Operasional</p>
                  <h4>Barang bersatuan kg, liter, meter, atau gram bisa dijual pecahan.</h4>
                </div>
              </div>
              <p class="panel-note">
                Contoh: paku payung dengan satuan kg dapat dimasukkan ke keranjang sebanyak 0.25 kg atau 0.5 kg.
                Nilai stok, restock, laporan, dan checkout akan mengikuti jumlah desimal tersebut.
              </p>
            </article>
          </div>
        </section>

        <section class="page" data-view="cashier">
          <div class="page-head">
            <div>
              <p class="eyebrow">Transaksi / Kasir</p>
              <h3>Proses penjualan cepat dengan pembaruan stok otomatis.</h3>
              <p>Cari barang, masukkan ke keranjang, hitung pembayaran, lalu cetak nota.</p>
            </div>
          </div>

          <div class="cashier-layout">
            <section class="catalog-shell">
              <div class="toolbar surface-strip">
                <label class="search-field">
                  <span class="material-symbols-outlined">search</span>
                  <input id="cashierSearch" type="text" placeholder="Cari SKU atau nama barang...">
                </label>

                <div id="cashierCategoryChips" class="chip-row"></div>
              </div>

              <div id="productGrid" class="product-grid"></div>
            </section>

            <aside class="surface-panel cart-shell">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Pesanan Saat Ini</p>
                  <h4 id="cartOrderNumber">No. TRX-DEMO</h4>
                </div>
                <button id="clearCartBtn" class="icon-button" type="button" aria-label="Kosongkan keranjang">
                  <span class="material-symbols-outlined">delete_sweep</span>
                </button>
              </div>

              <div id="cartList" class="cart-list"></div>

              <div class="cart-summary">
                <div class="summary-line">
                  <span>Subtotal</span>
                  <strong id="cartSubtotal">Rp 0</strong>
                </div>

                <label class="field">
                  <span>Diskon</span>
                  <input id="discountInput" type="text" value="0" inputmode="numeric">
                </label>

                <div class="summary-total">
                  <span>Total Tagihan</span>
                  <strong id="cartTotal">Rp 0</strong>
                </div>

                <div class="payment-box">
                  <div class="payment-box-head">
                    <span>Tunai (Cash)</span>
                    <button id="exactCashBtn" class="button-link" type="button">Pas</button>
                  </div>
                  <label class="field">
                    <span>Uang Bayar</span>
                    <input id="paymentInput" type="text" value="0" inputmode="numeric">
                  </label>
                  <div class="summary-line">
                    <span>Kembalian</span>
                    <strong id="cartChange">Rp 0</strong>
                  </div>
                </div>

                <div class="cart-actions">
                  <button id="printReceiptBtn" class="button button-soft" type="button">
                    <span class="material-symbols-outlined">receipt_long</span>
                    Cetak
                  </button>
                  <button id="checkoutBtn" class="button button-success" type="button">
                    <span class="material-symbols-outlined">payments</span>
                    Bayar
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section class="page" data-view="finance">
          <div class="page-head">
            <div>
              <p class="eyebrow">Keuangan Toko</p>
              <h3>Keuntungan, margin, pendapatan, dan pengeluaran.</h3>
              <p>Ringkasan ini menggabungkan transaksi kasir sebagai pendapatan dan barang masuk sebagai pengeluaran toko.</p>
            </div>
          </div>

          <div class="metric-grid report-metrics">
            <article class="metric-card metric-card-large">
              <div class="metric-icon metric-primary">
                <span class="material-symbols-outlined">payments</span>
              </div>
              <div class="metric-copy">
                <span>Total Pendapatan</span>
                <strong id="financeRevenue">Rp 0</strong>
                <small id="financeIncomeHint">0 transaksi penjualan tercatat</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">shopping_cart</span>
              </div>
              <div class="metric-copy">
                <span>Total Pengeluaran</span>
                <strong id="financeExpense">Rp 0</strong>
                <small id="financeExpenseHint">0 transaksi barang masuk tercatat</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-icon metric-secondary">
                <span class="material-symbols-outlined">trending_up</span>
              </div>
              <div class="metric-copy">
                <span>Keuntungan</span>
                <strong id="financeProfit">Rp 0</strong>
                <small id="financeProfitHint">Pendapatan dikurangi pengeluaran</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-icon metric-neutral">
                <span class="material-symbols-outlined">percent</span>
              </div>
              <div class="metric-copy">
                <span>Margin</span>
                <strong id="financeMargin">0%</strong>
                <small id="financeMarginHint">Keuntungan terhadap pendapatan</small>
              </div>
            </article>
          </div>

          <article class="surface-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Data Lengkap</p>
                <h4>Arus keuangan toko</h4>
              </div>
            </div>

            <div class="table-shell">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tipe</th>
                    <th>Keterangan</th>
                    <th class="align-right">Pendapatan</th>
                    <th class="align-right">Pengeluaran</th>
                    <th class="align-right">Saldo</th>
                  </tr>
                </thead>
                <tbody id="financeLedgerBody"></tbody>
              </table>
            </div>
          </article>
        </section>

        <section class="page" data-view="reports">
          <div class="page-head">
            <div>
              <p class="eyebrow">Laporan</p>
              <h3>Analisis penjualan dan stok barang.</h3>
              <p>Filter data sesuai periode lalu ekspor untuk kebutuhan evaluasi operasional.</p>
            </div>

            <div class="button-row">
              <button id="exportCsvBtn" class="button button-soft" type="button">
                <span class="material-symbols-outlined">description</span>
                Export CSV
              </button>
              <button id="printReportBtn" class="button button-primary" type="button">
                <span class="material-symbols-outlined">picture_as_pdf</span>
                Cetak PDF
              </button>
            </div>
          </div>

          <div class="report-controls">
            <div class="segmented">
              <button class="segment active" data-report-type="sales" type="button">Penjualan</button>
              <button class="segment" data-report-type="inventory" type="button">Stok Barang</button>
            </div>

            <div class="report-filter-row surface-strip">
              <label class="select-field">
                <span>Periode</span>
                <select id="reportPeriod">
                  <option value="daily">Harian</option>
                  <option value="monthly" selected>Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </label>

              <label id="reportDateField" class="field">
                <span>Tanggal</span>
                <input id="reportDateInput" type="date">
              </label>

              <label id="reportMonthField" class="field">
                <span>Bulan</span>
                <input id="reportMonthInput" type="month">
              </label>

              <label id="reportYearField" class="select-field hidden">
                <span>Tahun</span>
                <select id="reportYearInput"></select>
              </label>
            </div>
          </div>

          <div class="metric-grid report-metrics">
            <article class="metric-card metric-card-large">
              <div class="metric-copy">
                <span id="reportPrimaryLabel">Total Pendapatan</span>
                <strong id="reportPrimaryValue">Rp 0</strong>
                <small id="reportPrimaryHint">Ringkasan sesuai periode yang dipilih</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-copy">
                <span id="reportSecondaryLabel">Total Transaksi</span>
                <strong id="reportSecondaryValue">0</strong>
                <small id="reportSecondaryHint">Aktivitas utama periode ini</small>
              </div>
            </article>

            <article class="metric-card">
              <div class="metric-copy">
                <span id="reportTertiaryLabel">Rata-rata</span>
                <strong id="reportTertiaryValue">Rp 0</strong>
                <small id="reportTertiaryHint">Nilai rata-rata per transaksi</small>
              </div>
            </article>
          </div>

          <article class="surface-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Rincian Data</p>
                <h4 id="reportTableTitle">Ringkasan Penjualan</h4>
              </div>
            </div>

            <div class="table-shell">
              <table class="data-table">
                <thead id="reportTableHead"></thead>
                <tbody id="reportTableBody"></tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  </div>

  <div id="itemModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="itemModalTitle">
    <div id="itemModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Data Master Barang</p>
          <h4 id="itemModalTitle">Tambah Barang</h4>
        </div>
        <button id="closeItemModalBtn" class="icon-button" type="button" aria-label="Tutup modal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="itemForm" class="form-grid">
        <input id="itemId" name="id" type="hidden">

        <label class="field">
          <span>SKU</span>
          <input id="itemSku" name="sku" type="text" placeholder="SMN-001" required>
        </label>

        <label class="field">
          <span>Nama Barang</span>
          <input id="itemName" name="name" type="text" placeholder="Nama barang" required>
        </label>

        <label class="field">
          <span>Kategori</span>
          <select id="itemCategory" name="category" required></select>
        </label>

        <label class="field">
          <span>Satuan</span>
          <select id="itemUnit" name="unit" required></select>
        </label>

        <label class="field">
          <span>Supplier</span>
          <select id="itemSupplier" name="supplier" required></select>
        </label>

        <label class="field">
          <span>Stok Saat Ini</span>
          <input id="itemStock" name="stock" type="number" min="0" step="0.001" inputmode="decimal" placeholder="0" required>
        </label>

        <label class="field">
          <span>Stok Minimum</span>
          <input id="itemMinStock" name="minStock" type="number" min="0" step="0.001" inputmode="decimal" placeholder="5" required>
        </label>

        <label class="field">
          <span>Harga Jual</span>
          <input id="itemPrice" name="price" type="number" min="0" step="1000" placeholder="0" required>
        </label>

        <label class="field field-full">
          <span>Keterangan</span>
          <textarea id="itemDescription" name="description" rows="4" placeholder="Catatan tambahan barang"></textarea>
        </label>

        <div class="field-full modal-actions">
          <button id="cancelItemModalBtn" class="button button-muted" type="button">Batal</button>
          <button class="button button-primary" type="submit">
            <span class="material-symbols-outlined">save</span>
            Simpan Barang
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="supplierModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="supplierModalTitle">
    <div id="supplierModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel supplier-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Master Supplier</p>
          <h4 id="supplierModalTitle">Tambah Supplier</h4>
        </div>
        <button id="closeSupplierModalBtn" class="icon-button" type="button" aria-label="Tutup modal supplier">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="supplierForm" class="form-grid">
        <input id="supplierId" name="supplier_id" type="hidden">

        <label class="field field-full">
          <span>Nama Supplier</span>
          <input id="supplierName" name="name" type="text" placeholder="Contoh: PT Tiga Roda" required>
        </label>

        <div class="field-full modal-actions">
          <button id="cancelSupplierModalBtn" class="button button-muted" type="button">Batal</button>
          <button class="button button-primary" type="submit">
            <span class="material-symbols-outlined">save</span>
            Simpan Supplier
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="transactionModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="transactionModalTitle">
    <div id="transactionModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel transaction-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Detail Transaksi</p>
          <h4 id="transactionModalTitle">No Transaksi</h4>
          <small id="transactionModalMeta">Tanggal transaksi</small>
        </div>
        <button id="closeTransactionModalBtn" class="icon-button" type="button" aria-label="Tutup detail transaksi">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div id="transactionDetailSummary" class="transaction-summary-grid"></div>

      <div class="table-shell">
        <table class="data-table detail-table">
          <thead>
            <tr>
              <th>Barang</th>
              <th class="align-right">Jumlah</th>
              <th class="align-right">Harga</th>
              <th class="align-right">Subtotal</th>
            </tr>
          </thead>
          <tbody id="transactionDetailItems"></tbody>
        </table>
      </div>

      <div class="modal-actions">
        <button id="printTransactionModalBtn" class="button button-primary" type="button">
          <span class="material-symbols-outlined">receipt_long</span>
          Cetak Ulang Struk
        </button>
      </div>
    </div>
  </div>

  <script>
    window.POS_BOOTSTRAP = @json($initialState);
    window.POS_ROUTES = @json($routes);
    window.POS_BRAND = {
      logo: @json(asset('pos/logolj2.png')),
      name: "TB. Losari Jaya 2",
      tagline: "Industrial Atelier POS"
    };
  </script>
  <script src="{{ asset('pos/app.js') }}"></script>
</body>
</html>
