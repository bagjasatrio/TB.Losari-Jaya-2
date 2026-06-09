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
        <p class="eyebrow">Masuk Sistem</p>
        <p>Masukkan username dan password sesuai akun yang sudah dibuat admin.</p>
      </div>

      <form id="loginForm" class="form-stack">
        <label class="field">
          <span>Username</span>
          <input id="loginUsername" name="username" type="text" autocomplete="username" required>
        </label>

        <label class="field">
          <span>Password</span>
          <input
            id="loginPassword"
            name="password"
            type="password"
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
        <button class="nav-item" data-nav="users">
          <span class="material-symbols-outlined">group_add</span>
          <span>Pengguna</span>
        </button>
        <button class="nav-item" data-nav="customers">
          <span class="material-symbols-outlined">group</span>
          <span>Pelanggan</span>
        </button>
        <button class="nav-item" data-nav="void">
          <span class="material-symbols-outlined">block</span>
          <span>Void Transaksi</span>
        </button>
        <button class="nav-item" data-nav="returns">
          <span class="material-symbols-outlined">assignment_return</span>
          <span>Retur Penjualan</span>
        </button>
        <button class="nav-item" data-nav="opnames">
          <span class="material-symbols-outlined">fact_check</span>
          <span>Stok Opname</span>
        </button>
      </nav>

      <div class="sidebar-foot">
        <button id="changePasswordBtn" class="button button-muted button-block" type="button">
          <span class="material-symbols-outlined">lock</span>
          Ganti Password
        </button>
        <button id="resetDemoBtn" class="button button-muted button-block" type="button">
          <span class="material-symbols-outlined">refresh</span>
          Reset Data
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
              <span id="headerRoleLabel">Admin</span>
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
              <div class="table-scroll-sync inventory-scroll-sync" data-scroll-sync="inventory" aria-label="Geser tabel daftar barang" tabindex="0">
                <div></div>
              </div>
              <div class="table-shell inventory-table-shell" data-scroll-target="inventory">
                <table class="data-table inventory-table">
                  <thead>
                    <tr>
                      <th class="align-right">No</th>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Supplier</th>
                      <th>Stok</th>
                      <th>Harga Beli</th>
                      <th>Laba</th>
                      <th>Harga Dasar</th>
                      <th>Harga Toko</th>
                      <th>Harga Eceran</th>
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

                <div class="payment-method-select" id="paymentMethodSelect">
                  <label class="field">
                    <span>Metode Pembayaran</span>
                    <select id="paymentMethodInput">
                      <option value="tunai">Tunai</option>
                      <option value="qris">QRIS</option>
                      <option value="va">Transfer / Virtual Account</option>
                      <option value="hutang">Hutang / Kredit</option>
                    </select>
                  </label>
                </div>

                <!-- Hutang: customer + DP fields -->
                <div id="hutangFields" class="hutang-fields hidden">
                  <div class="hutang-customer-field">
                    <label class="field field-full" style="position:relative">
                      <span>Nama Pelanggan <em style="color:var(--danger,#ef4444)">*</em></span>
                      <input id="hutangCustomerInput" type="text" placeholder="Cari atau ketik nama pelanggan..." autocomplete="off">
                      <div id="customerAutocomplete" class="customer-autocomplete hidden"></div>
                    </label>
                  </div>
                  <label class="field field-full">
                    <span>No. HP</span>
                    <input id="hutangPhoneInput" type="text" placeholder="Nomor telepon" autocomplete="tel">
                  </label>
                  <label class="field field-full">
                    <span>Alamat</span>
                    <textarea id="hutangAddressInput" rows="2" placeholder="Alamat lengkap"></textarea>
                  </label>
                  <label class="field field-full">
                    <span>DP / Bayar Muka <em style="color:var(--text-tertiary)">(opsional, Rp 0 = full kredit)</em></span>
                    <input id="hutangDpInput" type="text" value="0" inputmode="numeric" placeholder="0">
                  </label>
                </div>

                <div class="payment-box" id="paymentBoxTunai">
                  <div class="payment-box-head">
                    <span>Uang Tunai</span>
                    <button id="exactCashBtn" class="button-link" type="button">Pas</button>
                  </div>
                  <label class="field">
                    <span>Jumlah Bayar</span>
                    <input id="paymentInput" type="text" value="0" inputmode="numeric">
                  </label>
                  <div class="summary-line">
                    <span>Kembalian</span>
                    <strong id="cartChange">Rp 0</strong>
                  </div>
                </div>

                <!-- Bukti Pembayaran Upload -->
                <div class="proof-upload-wrap" id="proofUploadWrap">
                  <input id="proofFileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden">
                  <div id="proofPreview" class="proof-preview hidden">
                    <img id="proofPreviewImg" class="proof-thumb" alt="Bukti bayar">
                    <div class="proof-meta">
                      <span id="proofFileName" class="proof-name"></span>
                      <small id="proofFileSize" class="proof-size"></small>
                    </div>
                    <button id="proofClearBtn" class="icon-button" type="button" aria-label="Hapus foto">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <button id="proofUploadBtn" class="button button-soft button-block" type="button">
                    <span class="material-symbols-outlined">upload_file</span>
                    Lampirkan Bukti Bayar
                  </button>
                  <small class="proof-hint">Opsional &middot; JPG, PNG, WebP &middot; Otomatis dikompres maks 200 KB</small>
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
              <div class="metric-icon metric-success">
                <span class="material-symbols-outlined">monetization_on</span>
              </div>
              <div class="metric-copy">
                <span>Laba Kotor Per Item</span>
                <strong id="financeGrossProfit">Rp 0</strong>
                <small id="financeGrossProfitHint">Selisih harga jual dikurangi harga beli</small>
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

        <section class="page" data-view="users">
          <div class="page-head">
            <div>
              <p class="eyebrow">Manajemen Pengguna</p>
              <h3>Tambah akun admin dan kasir.</h3>
              <p>Admin dapat membuat akun baru. Akun kasir diarahkan ke halaman transaksi kasir.</p>
            </div>
          </div>

          <div class="split-grid">
            <article class="surface-panel">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Form User</p>
                  <h4>Tambah pengguna sistem</h4>
                </div>
              </div>

              <form id="userForm" class="form-grid">
                <label class="field">
                  <span>Nama</span>
                  <input id="userName" name="name" type="text" placeholder="Contoh: Kasir Pagi" required>
                </label>

                <label class="field">
                  <span>Username</span>
                  <input id="userUsername" name="username" type="text" placeholder="kasir_pagi" autocomplete="off" required>
                </label>

                <label class="field">
                  <span>Role</span>
                  <select id="userRole" name="role" required>
                    <option value="cashier">Kasir</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label class="field">
                  <span>Password</span>
                  <input id="userPassword" name="password" type="password" placeholder="Minimal 6 karakter" autocomplete="new-password" required>
                </label>

                <label class="field field-full">
                  <span>Email Opsional</span>
                  <input id="userEmail" name="email" type="email" placeholder="contoh@domain.com">
                </label>

                <button class="button button-primary field-full" type="submit">
                  <span class="material-symbols-outlined">person_add</span>
                  Simpan User
                </button>
              </form>
            </article>

            <article class="surface-panel">
              <div class="panel-head">
                <div>
                  <p class="eyebrow">Daftar User</p>
                  <h4 id="userSummaryCount">0 pengguna aktif</h4>
                </div>
              </div>

              <div class="table-shell">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th class="align-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="userTableBody"></tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <div id="userModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="userModalTitle">
          <div id="userModalBackdrop" class="modal-backdrop"></div>
          <div class="modal-card surface-panel user-modal-card">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Manajemen Pengguna</p>
                <h4 id="userModalTitle">Edit User</h4>
              </div>
              <button id="closeUserModalBtn" class="icon-button" type="button" aria-label="Tutup modal user">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="userEditForm" class="form-grid">
              <input id="userEditId" name="id" type="hidden">

              <label class="field">
                <span>Nama</span>
                <input id="userEditName" name="name" type="text" placeholder="Contoh: Kasir Pagi" required>
              </label>

              <label class="field">
                <span>Username</span>
                <input id="userEditUsername" name="username" type="text" placeholder="kasir_pagi" autocomplete="off" required>
              </label>

              <label class="field">
                <span>Role</span>
                <select id="userEditRole" name="role" required>
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label class="field">
                <span>Password <em>(opsional)</em></span>
                <input id="userEditPassword" name="password" type="password" placeholder="Kosongkan jika tidak diganti" autocomplete="new-password">
                <small style="color:var(--text-tertiary);font-size:0.65rem;">Minimal 6 karakter. Isi hanya jika ingin ganti password.</small>
              </label>

              <label class="field field-full">
                <span>Email Opsional</span>
                <input id="userEditEmail" name="email" type="email" placeholder="contoh@domain.com">
              </label>

              <div class="field-full modal-actions">
                <button id="cancelUserModalBtn" class="button button-muted" type="button">Batal</button>
                <button class="button button-primary" type="submit">
                  <span class="material-symbols-outlined">save</span>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>

        <div id="passwordModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="passwordModalTitle">
          <div id="passwordModalBackdrop" class="modal-backdrop"></div>
          <div class="modal-card surface-panel password-modal-card">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Keamanan Akun</p>
                <h4 id="passwordModalTitle">Ganti Password</h4>
                <small>Masukkan password saat ini dan password baru Anda.</small>
              </div>
              <button id="closePasswordModalBtn" class="icon-button" type="button" aria-label="Tutup">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="passwordForm" class="form-grid">
              <label class="field field-full">
                <span>Password Saat Ini</span>
                <input id="passwordCurrent" name="current_password" type="password" placeholder="Masukkan password saat ini" autocomplete="current-password" required>
              </label>

              <label class="field">
                <span>Password Baru</span>
                <input id="passwordNew" name="new_password" type="password" placeholder="Minimal 6 karakter" autocomplete="new-password" required>
              </label>

              <label class="field">
                <span>Konfirmasi Password Baru</span>
                <input id="passwordConfirm" name="confirm_password" type="password" placeholder="Ulangi password baru" autocomplete="new-password" required>
              </label>

              <div class="field-full modal-actions">
                <button id="cancelPasswordBtn" class="button button-muted" type="button">Batal</button>
                <button class="button button-primary" type="submit">
                  <span class="material-symbols-outlined">lock</span>
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>

        <section class="page" data-view="void">
          <div class="page-head">
            <div>
              <p class="eyebrow">Manajemen Void</p>
              <h3>Pembatalan transaksi dan riwayat void.</h3>
              <p>Batalkan transaksi, pulihkan stok, dan pantau riwayat pembatalan secara lengkap.</p>
            </div>
          </div>

          <div class="metric-grid" id="voidAnalyticsGrid">
            <article class="metric-card metric-card-large">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">block</span>
              </div>
              <div class="metric-copy">
                <span>Total Transaksi Void</span>
                <strong id="voidTotalCount">0</strong>
                <small id="voidTotalHint">Riwayat pembatalan transaksi</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">money_off</span>
              </div>
              <div class="metric-copy">
                <span>Total Nominal Void</span>
                <strong id="voidTotalNominal">Rp 0</strong>
                <small id="voidNominalHint">Nilai transaksi yang dibatalkan</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-neutral">
                <span class="material-symbols-outlined">restore</span>
              </div>
              <div class="metric-copy">
                <span>Item Stok Dikembalikan</span>
                <strong id="voidRestoredCount">0</strong>
                <small id="voidRestoredHint">Total item stok yang diretur</small>
              </div>
            </article>
          </div>

          <div class="toolbar surface-strip">
            <label class="search-field">
              <span class="material-symbols-outlined">search</span>
              <input id="voidSearch" type="text" placeholder="Cari invoice, alasan, atau petugas void...">
            </label>
          </div>

          <article class="surface-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Riwayat Void</p>
                <h4>Daftar transaksi yang dibatalkan</h4>
              </div>
            </div>
            <div class="table-shell">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Tanggal Transaksi</th>
                    <th>Total</th>
                    <th>Alasan Void</th>
                    <th>Dibuat Oleh</th>
                    <th>Tanggal Void</th>
                    <th class="align-right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="voidTableBody"></tbody>
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
              <button id="reportBackBtn" class="button button-soft hidden" type="button">
                <span class="material-symbols-outlined">arrow_back</span>
                Kembali
              </button>

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

        <section class="page" data-view="returns">
          <div class="page-head">
            <div>
              <p class="eyebrow">Retur Penjualan</p>
              <h3>Retur barang dari transaksi yang sudah selesai.</h3>
              <p>Pilih transaksi, tentukan barang yang diretur, stok akan dikembalikan otomatis.</p>
            </div>
          </div>

          <div class="metric-grid" id="returnAnalyticsGrid">
            <article class="metric-card metric-card-large">
              <div class="metric-icon metric-accent">
                <span class="material-symbols-outlined">assignment_return</span>
              </div>
              <div class="metric-copy">
                <span>Total Retur</span>
                <strong id="returnTotalCount">0</strong>
                <small id="returnTotalHint">Riwayat retur penjualan</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">money_off</span>
              </div>
              <div class="metric-copy">
                <span>Total Refund</span>
                <strong id="returnTotalRefund">Rp 0</strong>
                <small id="returnRefundHint">Total uang dikembalikan ke pelanggan</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-neutral">
                <span class="material-symbols-outlined">restore</span>
              </div>
              <div class="metric-copy">
                <span>Item Dikembalikan</span>
                <strong id="returnItemCount">0</strong>
                <small id="returnItemHint">Total item stok yang diretur</small>
              </div>
            </article>
          </div>

          <div class="toolbar surface-strip">
            <label class="search-field">
              <span class="material-symbols-outlined">search</span>
              <input id="returnSearch" type="text" placeholder="Cari invoice retur, transaksi asal, atau alasan...">
            </label>
          </div>

          <article class="surface-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Riwayat Retur</p>
                <h4>Daftar retur barang</h4>
              </div>
            </div>
            <div class="table-shell">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Invoice Retur</th>
                    <th>Transaksi Asal</th>
                    <th>Barang</th>
                    <th>Alasan</th>
                    <th>Total Refund</th>
                    <th>Diproses Oleh</th>
                    <th class="align-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody id="returnTableBody"></tbody>
              </table>
            </div>
          </article>
        </section>

        <section class="page" data-view="opnames">
          <div class="page-head">
            <div>
              <p class="eyebrow">Stok Opname</p>
              <h3>Pencocokan stok fisik dengan stok sistem.</h3>
              <p>Catat stok fisik barang, sistem akan menghitung selisih dan menyesuaikan stok secara otomatis.</p>
            </div>

            <button id="openOpnameBtn" class="button button-primary" type="button">
              <span class="material-symbols-outlined">fact_check</span>
              Buat Opname Baru
            </button>
          </div>

          <div class="metric-grid" id="opnameAnalyticsGrid">
            <article class="metric-card metric-card-large">
              <div class="metric-icon metric-primary">
                <span class="material-symbols-outlined">checklist</span>
              </div>
              <div class="metric-copy">
                <span>Total Opname</span>
                <strong id="opnameTotalCount">0</strong>
                <small id="opnameTotalHint">Riwayat stok opname</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-warning">
                <span class="material-symbols-outlined">compare_arrows</span>
              </div>
              <div class="metric-copy">
                <span>Item dengan Selisih</span>
                <strong id="opnameDiscrepancyCount">0</strong>
                <small id="opnameDiscrepancyHint">Item stok tidak sesuai</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-accent">
                <span class="material-symbols-outlined">swap_vert</span>
              </div>
              <div class="metric-copy">
                <span>Total Penyesuaian</span>
                <strong id="opnameAdjustmentTotal">Rp 0</strong>
                <small id="opnameAdjustmentHint">Nilai penyesuaian stok</small>
              </div>
            </article>
          </div>

          <div class="toolbar surface-strip">
            <label class="search-field">
              <span class="material-symbols-outlined">search</span>
              <input id="opnameSearch" type="text" placeholder="Cari nomor opname atau petugas...">
            </label>
          </div>

          <article class="surface-panel">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Riwayat Opname</p>
                <h4>Daftar stok opname</h4>
              </div>
            </div>
            <div class="table-shell">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>No. Opname</th>
                    <th>Tanggal</th>
                    <th class="align-right">Total Item</th>
                    <th class="align-right">Item Selisih</th>
                    <th class="align-right">Penyesuaian</th>
                    <th>Status</th>
                    <th>Dibuat Oleh</th>
                    <th class="align-right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="opnameTableBody"></tbody>
              </table>
            </div>
          </article>
        </section>

        <!-- Pelanggan Page -->
        <section class="page" data-view="customers">
          <div class="page-head">
            <div>
              <p class="eyebrow">Manajemen Pelanggan</p>
              <h3>Daftar pelanggan dan hutang piutang.</h3>
              <p>Kelola data pelanggan, pantau sisa hutang, dan catat pembayaran cicilan.</p>
            </div>
            <button id="addCustomerBtn" class="button button-primary" type="button">
              <span class="material-symbols-outlined">person_add</span>
              Tambah Pelanggan
            </button>
          </div>

          <div class="metric-grid">
            <article class="metric-card">
              <div class="metric-icon metric-primary">
                <span class="material-symbols-outlined">group</span>
              </div>
              <div class="metric-copy">
                <span>Total Pelanggan</span>
                <strong id="customerMetricTotal">0</strong>
                <small id="customerMetricHint">pelanggan terdaftar</small>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-icon metric-danger">
                <span class="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div class="metric-copy">
                <span>Total Hutang Outstanding</span>
                <strong id="customerMetricDebt">Rp 0</strong>
                <small id="customerMetricDebtHint">dari 0 pelanggan</small>
              </div>
            </article>
          </div>

          <article class="surface-panel" style="margin-top:16px">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Daftar Pelanggan</p>
                <h4>Semua pelanggan terdaftar</h4>
              </div>
              <label class="search-field">
                <span class="material-symbols-outlined">search</span>
                <input id="customerSearch" type="text" placeholder="Cari nama, HP, alamat...">
              </label>
            </div>
            <div class="table-shell">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>No. HP</th>
                    <th>Alamat</th>
                    <th class="align-right">Sisa Hutang</th>
                    <th class="align-right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="customerTableBody"></tbody>
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
          <input id="itemSku" name="sku" type="text" placeholder="LJ2-001" required>
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

        <label class="field">
          <span>Harga Beli</span>
          <input id="itemPurchasePrice" name="purchasePrice" type="number" min="0" step="1000" placeholder="0">
          <small style="color:var(--text-tertiary);font-size:0.65rem;">Otomatis dihitung dari rata-rata barang masuk. Bisa diisi manual.</small>
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
              <th class="align-right">Laba</th>
              <th class="align-right">Subtotal</th>
            </tr>
          </thead>
          <tbody id="transactionDetailItems"></tbody>
        </table>
      </div>

      <div class="modal-actions">
        <button id="closeTransactionBtn" class="button button-muted" type="button">
          <span class="material-symbols-outlined">close</span>
          Tutup
        </button>
        <button id="printTransactionModalBtn" class="button button-primary" type="button">
          <span class="material-symbols-outlined">receipt_long</span>
          Cetak Ulang Struk
        </button>
        <button id="returnTransactionBtn" class="button button-warning hidden" type="button">
          <span class="material-symbols-outlined">assignment_return</span>
          Retur Barang
        </button>
        <button id="voidTransactionBtn" class="button button-danger hidden" type="button">
          <span class="material-symbols-outlined">block</span>
          Void Transaksi
        </button>
      </div>
    </div>
  </div>

  <div id="returnModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="returnModalTitle">
    <div id="returnModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel return-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Retur Penjualan</p>
          <h4 id="returnModalTitle">Retur Barang</h4>
          <small id="returnModalMeta">Pilih barang yang akan diretur</small>
        </div>
        <button id="closeReturnModalBtn" class="icon-button" type="button" aria-label="Tutup modal retur">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="return-warning">
        <span class="material-symbols-outlined">info</span>
        <div>
          <strong>Informasi</strong>
          <p>Stok barang yang diretur akan dikembalikan ke inventaris. Tindakan ini tercatat dalam riwayat retur.</p>
        </div>
      </div>

      <div class="return-sale-summary">
        <div><span>Invoice Asal</span><strong id="returnSaleId">-</strong></div>
        <div><span>Tanggal</span><strong id="returnSaleDate">-</strong></div>
        <div><span>Total Transaksi</span><strong id="returnSaleTotal" class="return-total-amount">Rp 0</strong></div>
      </div>

      <form id="returnForm" class="form-stack">
        <div id="returnItemsList" class="return-items-list"></div>

        <div class="return-total-box">
          <span>Total Refund</span>
          <strong id="returnRefundTotal">Rp 0</strong>
        </div>

        <label class="field field-full">
          <span>Alasan Retur <em>(wajib)</em></span>
          <textarea id="returnReasonInput" name="reason" rows="3" placeholder="Contoh: Barang salah ukuran, pelanggan membatalkan sebagian pesanan..." required></textarea>
        </label>

        <div class="field-full modal-actions">
          <button id="cancelReturnBtn" class="button button-muted" type="button">Batal</button>
          <button id="confirmReturnBtn" class="button button-warning" type="button">
            <span class="material-symbols-outlined">assignment_return</span>
            Proses Retur
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="voidModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="voidModalTitle">
    <div id="voidModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel void-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Void Transaksi</p>
          <h4 id="voidModalTitle">Konfirmasi Pembatalan</h4>
          <small id="voidModalMeta">Melakukan void pada transaksi yang sudah selesai</small>
        </div>
        <button id="closeVoidModalBtn" class="icon-button" type="button" aria-label="Tutup modal void">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="void-warning">
        <span class="material-symbols-outlined">warning</span>
        <div>
          <strong>Perhatian!</strong>
          <p>Stok barang akan dikembalikan secara otomatis. Tindakan ini tercatat dalam audit log dan <strong>tidak dapat dibatalkan</strong>.</p>
        </div>
      </div>

      <div class="void-sale-summary">
        <div><span>Invoice</span><strong id="voidSaleId">-</strong></div>
        <div><span>Tanggal</span><strong id="voidSaleDate">-</strong></div>
        <div><span>Total</span><strong id="voidSaleTotal" class="void-total-amount">Rp 0</strong></div>
        <div><span>Item</span><strong id="voidSaleItems">-</strong></div>
      </div>

      <form id="voidForm" class="form-stack">
        <label class="field field-full">
          <span>Alasan Pembatalan <em>(wajib)</em></span>
          <textarea id="voidReasonInput" name="reason" rows="3" placeholder="Contoh: Kesalahan input item, pelanggan membatalkan pesanan..." required></textarea>
        </label>

        <div class="field-full modal-actions">
          <button id="cancelVoidBtn" class="button button-muted" type="button">Batal</button>
          <button id="confirmVoidBtn" class="button button-danger" type="button">
            <span class="material-symbols-outlined">block</span>
            Konfirmasi Void
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="confirmModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle">
    <div id="confirmModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel confirm-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow" id="confirmModalEyebrow">Konfirmasi</p>
          <h4 id="confirmModalTitle">Hapus Data</h4>
        </div>
        <button id="closeConfirmModalBtn" class="icon-button" type="button" aria-label="Tutup">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="confirm-warning">
        <span class="material-symbols-outlined">warning</span>
        <div>
          <strong id="confirmModalWarningTitle">Perhatian!</strong>
          <p id="confirmModalMessage">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </div>

      <div class="confirm-item-box" id="confirmItemBox">
        <span class="material-symbols-outlined">inventory_2</span>
        <strong id="confirmItemName">-</strong>
      </div>

      <div class="field-full modal-actions">
        <button id="cancelConfirmBtn" class="button button-muted" type="button">Batal</button>
        <button id="confirmDeleteBtn" class="button button-danger" type="button">
          <span class="material-symbols-outlined">delete</span>
          Hapus
        </button>
      </div>
    </div>
  </div>

  <!-- Customer Modal (Tambah / Edit) -->
  <div id="customerModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="customerModalTitle">
    <div id="customerModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Data Pelanggan</p>
          <h4 id="customerModalTitle">Tambah Pelanggan</h4>
        </div>
        <button id="closeCustomerModalBtn" class="icon-button" type="button" aria-label="Tutup">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form id="customerForm" class="form-grid">
        <input id="customerFormId" type="hidden">
        <label class="field field-full">
          <span>Nama Pelanggan <em style="color:var(--danger,#ef4444)">*</em></span>
          <input id="customerFormName" type="text" placeholder="Contoh: Budi Santoso" required>
        </label>
        <label class="field field-full">
          <span>Nomor HP</span>
          <input id="customerFormPhone" type="tel" placeholder="08xxxxxxxxxx">
        </label>
        <label class="field field-full">
          <span>Alamat</span>
          <textarea id="customerFormAddress" rows="2" placeholder="Alamat lengkap..."></textarea>
        </label>
        <label class="field field-full">
          <span>Catatan</span>
          <textarea id="customerFormNotes" rows="2" placeholder="Catatan internal..."></textarea>
        </label>
        <div class="field-full modal-actions">
          <button id="cancelCustomerModalBtn" class="button button-muted" type="button">Batal</button>
          <button class="button button-primary" type="submit">
            <span class="material-symbols-outlined">save</span>
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Customer Detail Modal (Hutang) -->
  <div id="customerDetailModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="customerDetailTitle">
    <div id="customerDetailBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel customer-detail-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Detail Pelanggan</p>
          <h4 id="customerDetailTitle">-</h4>
          <small id="customerDetailMeta">-</small>
        </div>
        <button id="closeCustomerDetailBtn" class="icon-button" type="button" aria-label="Tutup">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div id="customerDetailInfo" class="customer-detail-info"></div>

      <div class="panel-head" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <div>
          <p class="eyebrow">Daftar Hutang</p>
          <h4>Transaksi belum lunas</h4>
        </div>
        <strong id="customerDetailTotalDebt" class="debt-badge">Rp 0</strong>
      </div>
      <div id="customerDebtList" class="customer-debt-list"></div>
    </div>
  </div>

  <div id="opnameModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="opnameModalTitle">
    <div id="opnameModalBackdrop" class="modal-backdrop"></div>
    <div class="modal-card surface-panel opname-modal-card">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Stok Opname</p>
          <h4 id="opnameModalTitle">Buat Opname Baru</h4>
          <small id="opnameModalMeta">Masukkan stok fisik sesuai hasil counting</small>
        </div>
        <button id="closeOpnameModalBtn" class="icon-button" type="button" aria-label="Tutup modal opname">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="opname-warning">
        <span class="material-symbols-outlined">info</span>
        <div>
          <strong>Informasi</strong>
          <p>Stok barang akan disesuaikan dengan stok fisik yang dimasukkan. Item dengan selisih akan tercatat dalam riwayat opname.</p>
        </div>
      </div>

      <div class="opname-toolbar">
        <label class="search-field">
          <span class="material-symbols-outlined">search</span>
          <input id="opnameModalSearch" type="text" placeholder="Cari nama barang atau SKU...">
        </label>
        <label class="select-field">
          <span>Kategori</span>
          <select id="opnameCategoryFilter"></select>
        </label>
      </div>

      <div class="opname-catalog-shell">
        <table class="data-table opname-table">
          <thead>
            <tr>
              <th class="align-right">No</th>
              <th>Nama Barang</th>
              <th>SKU</th>
              <th class="align-right">Stok Sistem</th>
              <th class="align-right">Stok Fisik</th>
              <th class="align-right">Selisih</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="opnameModalBody"></tbody>
        </table>
      </div>

      <div class="opname-summary-bar" id="opnameSummaryBar">
        <span>Total Item: <strong id="opnameSummaryTotal">0</strong></span>
        <span class="opname-summary-sep">|</span>
        <span>Sesuai: <strong id="opnameSummaryMatched" class="opname-status-matched">0</strong></span>
        <span class="opname-summary-sep">|</span>
        <span>Selisih: <strong id="opnameSummaryDiscrepancy" class="opname-status-shortage">0</strong></span>
        <span class="opname-summary-sep">|</span>
        <span>Penyesuaian: <strong id="opnameSummaryAdjustment">Rp 0</strong></span>
      </div>

      <label class="field opname-notes-field">
        <span>Catatan <em>(opsional)</em></span>
        <textarea id="opnameNotesInput" name="notes" rows="2" placeholder="Contoh: Opname akhir bulan Juni 2026"></textarea>
      </label>

      <div class="field-full modal-actions">
        <button id="cancelOpnameBtn" class="button button-muted" type="button">Batal</button>
        <button id="confirmOpnameBtn" class="button button-primary" type="button">
          <span class="material-symbols-outlined">fact_check</span>
          Proses Opname
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
  <script src="{{ asset('pos/inventory-data.js') }}"></script>
  <script src="{{ asset('pos/app.js') }}"></script>
</body>
</html>
