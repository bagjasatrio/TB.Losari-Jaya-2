# Dokumentasi Diagram dan Implementasi Database

Dokumen ini dibuat berdasarkan struktur program POS TB. Losari Jaya 2 pada folder `laravel-app`. Diagram ditulis menggunakan format Mermaid agar dapat dirender di Markdown viewer yang mendukung Mermaid, seperti VS Code dengan extension Mermaid atau GitHub.

## 1. Use Case Diagram

Aktor utama pada sistem adalah Admin dan Kasir. Pada implementasi program saat ini keduanya memakai akun login yang sama, tetapi pembagian aktor berikut dibuat berdasarkan fungsi kerja agar sesuai kebutuhan analisis sistem.

```mermaid
flowchart LR
    Admin[Admin]
    Kasir[Kasir]

    subgraph Sistem["Sistem Informasi Persediaan dan POS"]
        UCLogin(("Login"))
        UCDashboard(("Melihat Dashboard"))
        UCBarang(("Kelola Data Barang"))
        UCKategori(("Kelola Master Kategori"))
        UCSatuan(("Kelola Master Satuan"))
        UCSupplier(("Kelola Supplier"))
        UCBarangMasuk(("Catat Barang Masuk"))
        UCKasir(("Proses Transaksi Kasir"))
        UCDetail(("Lihat Detail Transaksi"))
        UCStruk(("Cetak Ulang Struk"))
        UCLaporan(("Lihat dan Export Laporan"))
        UCPDF(("Cetak PDF Laporan"))
        UCKeuangan(("Lihat Keuangan Toko"))
        UCReset(("Reset Data Demo"))
        UCLogout(("Logout"))
    end

    Admin --> UCLogin
    Admin --> UCDashboard
    Admin --> UCBarang
    Admin --> UCKategori
    Admin --> UCSatuan
    Admin --> UCSupplier
    Admin --> UCBarangMasuk
    Admin --> UCLaporan
    Admin --> UCPDF
    Admin --> UCKeuangan
    Admin --> UCDetail
    Admin --> UCStruk
    Admin --> UCReset
    Admin --> UCLogout

    Kasir --> UCLogin
    Kasir --> UCDashboard
    Kasir --> UCKasir
    Kasir --> UCDetail
    Kasir --> UCStruk
    Kasir --> UCLogout

    UCBarang --> UCKategori
    UCBarang --> UCSatuan
    UCBarang --> UCSupplier
    UCKasir --> UCDetail
    UCDetail --> UCStruk
    UCLaporan --> UCPDF
```

## 2. Activity Diagram Admin

Activity diagram admin menggambarkan aktivitas pengelolaan data master, stok, laporan, dan keuangan toko.

```mermaid
flowchart TD
    Start([Mulai])
    Login[Masukkan username dan password]
    Valid{Login valid?}
    Dashboard[Tampilkan dashboard]
    Pilih{Pilih menu}

    Barang[Kelola data barang]
    Master[Kelola kategori, satuan, dan supplier]
    Restock[Catat barang masuk]
    Laporan[Filter laporan penjualan atau stok]
    Export[Export CSV atau cetak PDF]
    Keuangan[Lihat pendapatan, pengeluaran, keuntungan, margin]
    Detail[Lihat detail transaksi]
    Reset[Reset data demo]
    Logout[Logout]
    End([Selesai])

    Start --> Login --> Valid
    Valid -- Tidak --> Login
    Valid -- Ya --> Dashboard --> Pilih

    Pilih -- Barang --> Barang --> Dashboard
    Pilih -- Master Data --> Master --> Dashboard
    Pilih -- Barang Masuk --> Restock --> Dashboard
    Pilih -- Laporan --> Laporan --> Export --> Dashboard
    Pilih -- Keuangan --> Keuangan --> Dashboard
    Pilih -- Detail Transaksi --> Detail --> Dashboard
    Pilih -- Reset Data --> Reset --> Dashboard
    Pilih -- Logout --> Logout --> End
```

## 3. Activity Diagram Kasir

Activity diagram kasir menggambarkan aktivitas penjualan, pembayaran, dan cetak struk.

```mermaid
flowchart TD
    Start([Mulai])
    Login[Login kasir]
    Valid{Login valid?}
    KasirPage[Buka menu Transaksi Kasir]
    CariBarang[Cari atau pilih barang]
    CekStok{Stok tersedia?}
    Keranjang[Tambahkan barang ke keranjang]
    AturQty[Atur jumlah dan diskon]
    Bayar[Masukkan nominal pembayaran]
    Cukup{Pembayaran cukup?}
    Simpan[Simpan transaksi]
    UpdateStok[Kurangi stok barang]
    Struk[Cetak struk]
    Detail[Lihat detail atau cetak ulang struk]
    Selesai{Transaksi lain?}
    Logout[Logout]
    End([Selesai])

    Start --> Login --> Valid
    Valid -- Tidak --> Login
    Valid -- Ya --> KasirPage --> CariBarang --> CekStok
    CekStok -- Tidak --> CariBarang
    CekStok -- Ya --> Keranjang --> AturQty --> Bayar --> Cukup
    Cukup -- Tidak --> Bayar
    Cukup -- Ya --> Simpan --> UpdateStok --> Struk --> Detail --> Selesai
    Selesai -- Ya --> KasirPage
    Selesai -- Tidak --> Logout --> End
```

## 4. Sequence Diagram

Sequence diagram berikut menggambarkan proses transaksi penjualan dari kasir sampai data tersimpan dan stok diperbarui.

```mermaid
sequenceDiagram
    actor Kasir
    participant UI as Frontend POS
    participant Controller as PosController
    participant DB as MySQL Database
    participant Item as InventoryItem
    participant Sale as Sale
    participant SaleItem as SaleItem
    participant Bootstrap as PosBootstrapService

    Kasir->>UI: Pilih barang dan jumlah
    UI->>UI: Hitung subtotal, diskon, total, kembalian
    Kasir->>UI: Klik Bayar
    UI->>Controller: POST /checkout
    Controller->>Controller: Validasi item, jumlah, diskon, pembayaran
    Controller->>DB: Mulai transaksi database
    Controller->>Item: Lock dan ambil barang
    Item->>DB: SELECT inventory_items FOR UPDATE
    Controller->>Controller: Cek stok mencukupi
    Controller->>Item: Kurangi stok
    Item->>DB: UPDATE inventory_items
    Controller->>Sale: Buat transaksi penjualan
    Sale->>DB: INSERT sales
    Controller->>SaleItem: Simpan rincian item penjualan
    SaleItem->>DB: INSERT sale_items
    Controller->>DB: Commit transaksi database
    Controller->>Bootstrap: Build state terbaru
    Bootstrap->>DB: Ambil inventory, suppliers, goods_receipts, sales
    Bootstrap-->>Controller: State terbaru
    Controller-->>UI: Response sukses dan state terbaru
    UI->>Kasir: Tampilkan notifikasi transaksi berhasil
    Kasir->>UI: Cetak struk
```

## 5. Class Diagram

Class diagram berikut menggambarkan class utama Laravel yang digunakan pada program.

```mermaid
classDiagram
    class PosController {
        +index(Request, PosBootstrapService)
        +login(Request, PosBootstrapService) JsonResponse
        +logout(Request) JsonResponse
        +bootstrap(Request, PosBootstrapService) JsonResponse
        +storeItem(Request, PosBootstrapService) JsonResponse
        +updateItem(Request, InventoryItem, PosBootstrapService) JsonResponse
        +destroyItem(Request, InventoryItem, PosBootstrapService) JsonResponse
        +storeGoodsIn(Request, PosBootstrapService) JsonResponse
        +checkout(Request, PosBootstrapService) JsonResponse
        +storeSupplier(Request, PosBootstrapService) JsonResponse
        +updateSupplier(Request, Supplier, PosBootstrapService) JsonResponse
        +destroySupplier(Request, Supplier, PosBootstrapService) JsonResponse
        +storeCategory(Request, PosBootstrapService) JsonResponse
        +storeUnit(Request, PosBootstrapService) JsonResponse
        +reportPdf(Request)
    }

    class PosBootstrapService {
        +build(User) array
        -serializeInventoryItem(InventoryItem) array
        -serializeGoodsReceipt(GoodsReceipt) array
        -serializeSupplier(Supplier) array
        -serializeSale(Sale) array
    }

    class PosDemoSeederService {
        +resetAndSeed() User
        -makeDate(int, int, int) Carbon
    }

    class User {
        +id
        +name
        +username
        +email
        +password
    }

    class Supplier {
        +id
        +name
        +inventoryItems()
        +goodsReceipts()
    }

    class InventoryItem {
        +id
        +sku
        +name
        +category
        +unit
        +supplier_id
        +stock
        +min_stock
        +price
        +description
        +supplier()
        +goodsReceipts()
        +saleItems()
    }

    class InventoryCategory {
        +id
        +name
    }

    class InventoryUnit {
        +id
        +name
    }

    class GoodsReceipt {
        +id
        +inventory_item_id
        +supplier_id
        +quantity
        +unit_cost
        +received_at
        +note
        +inventoryItem()
        +supplier()
    }

    class Sale {
        +id
        +invoice_number
        +user_id
        +subtotal
        +discount
        +total
        +payment_amount
        +change_amount
        +sold_at
        +items()
        +user()
    }

    class SaleItem {
        +id
        +sale_id
        +inventory_item_id
        +sku
        +item_name
        +category
        +unit
        +quantity
        +unit_price
        +line_total
        +sale()
        +inventoryItem()
    }

    PosController --> PosBootstrapService
    PosController --> PosDemoSeederService
    PosController --> InventoryItem
    PosController --> Supplier
    PosController --> InventoryCategory
    PosController --> InventoryUnit
    PosController --> Sale

    PosBootstrapService --> User
    PosBootstrapService --> InventoryItem
    PosBootstrapService --> Supplier
    PosBootstrapService --> GoodsReceipt
    PosBootstrapService --> Sale

    Supplier "1" --> "0..*" InventoryItem
    Supplier "1" --> "0..*" GoodsReceipt
    InventoryItem "1" --> "0..*" GoodsReceipt
    InventoryItem "1" --> "0..*" SaleItem
    Sale "1" --> "1..*" SaleItem
    User "1" --> "0..*" Sale
```

## 6. ERD Database

ERD berikut menampilkan tabel inti program. Tabel `inventory_categories` dan `inventory_units` menjadi master pilihan, sedangkan nilai kategori dan satuan juga disimpan sebagai teks pada `inventory_items` dan `sale_items` agar riwayat transaksi tetap aman walaupun master berubah.

```mermaid
erDiagram
    USERS ||--o{ SALES : membuat
    SUPPLIERS ||--o{ INVENTORY_ITEMS : memasok
    SUPPLIERS ||--o{ GOODS_RECEIPTS : mencatat
    INVENTORY_ITEMS ||--o{ GOODS_RECEIPTS : diterima
    INVENTORY_ITEMS ||--o{ SALE_ITEMS : dijual
    SALES ||--|{ SALE_ITEMS : memiliki

    USERS {
        bigint id PK
        varchar name
        varchar username UK
        varchar email UK
        timestamp email_verified_at
        varchar password
        varchar remember_token
        timestamp created_at
        timestamp updated_at
    }

    SUPPLIERS {
        bigint id PK
        varchar name UK
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_CATEGORIES {
        bigint id PK
        varchar name UK
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_UNITS {
        bigint id PK
        varchar name UK
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_ITEMS {
        bigint id PK
        varchar sku UK
        varchar name
        varchar category
        varchar unit
        bigint supplier_id FK
        decimal stock
        decimal min_stock
        bigint price
        text description
        timestamp created_at
        timestamp updated_at
    }

    GOODS_RECEIPTS {
        bigint id PK
        bigint inventory_item_id FK
        bigint supplier_id FK
        decimal quantity
        bigint unit_cost
        timestamp received_at
        text note
        timestamp created_at
        timestamp updated_at
    }

    SALES {
        bigint id PK
        varchar invoice_number UK
        bigint user_id FK
        bigint subtotal
        bigint discount
        bigint total
        bigint payment_amount
        bigint change_amount
        timestamp sold_at
        timestamp created_at
        timestamp updated_at
    }

    SALE_ITEMS {
        bigint id PK
        bigint sale_id FK
        bigint inventory_item_id FK
        varchar sku
        varchar item_name
        varchar category
        varchar unit
        decimal quantity
        bigint unit_price
        bigint line_total
        timestamp created_at
        timestamp updated_at
    }
```

## 7. Implementasi Database MySQL

### 7.1 Konfigurasi `.env`

Contoh konfigurasi MySQL yang digunakan Laravel:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tb_losari_jaya_2
DB_USERNAME=root
DB_PASSWORD=
```

Perintah pembuatan database:

```sql
CREATE DATABASE tb_losari_jaya_2
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Perintah menjalankan migration dan data demo:

```bash
php artisan migrate
php artisan db:seed
```

### 7.2 DDL Tabel Inti

Struktur berikut disarikan dari migration Laravel pada program.

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE inventory_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE inventory_units (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE inventory_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    supplier_id BIGINT UNSIGNED NULL,
    stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 5,
    price BIGINT UNSIGNED NOT NULL DEFAULT 0,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT inventory_items_supplier_id_foreign
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        ON DELETE SET NULL
);

CREATE TABLE goods_receipts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id BIGINT UNSIGNED NULL,
    supplier_id BIGINT UNSIGNED NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_cost BIGINT UNSIGNED NOT NULL,
    received_at TIMESTAMP NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT goods_receipts_inventory_item_id_foreign
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
        ON DELETE SET NULL,
    CONSTRAINT goods_receipts_supplier_id_foreign
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        ON DELETE SET NULL
);

CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NULL,
    subtotal BIGINT UNSIGNED NOT NULL,
    discount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total BIGINT UNSIGNED NOT NULL,
    payment_amount BIGINT UNSIGNED NOT NULL,
    change_amount BIGINT UNSIGNED NOT NULL,
    sold_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT sales_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE sale_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT UNSIGNED NOT NULL,
    inventory_item_id BIGINT UNSIGNED NULL,
    sku VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_price BIGINT UNSIGNED NOT NULL,
    line_total BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT sale_items_sale_id_foreign
        FOREIGN KEY (sale_id) REFERENCES sales(id)
        ON DELETE CASCADE,
    CONSTRAINT sale_items_inventory_item_id_foreign
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
        ON DELETE SET NULL
);
```

### 7.3 Ringkasan Relasi

| Tabel Asal | Relasi | Tabel Tujuan | Keterangan |
|---|---:|---|---|
| `users` | 1 : N | `sales` | Satu user/admin dapat membuat banyak transaksi penjualan. |
| `suppliers` | 1 : N | `inventory_items` | Satu supplier dapat memasok banyak barang. |
| `suppliers` | 1 : N | `goods_receipts` | Satu supplier dapat memiliki banyak riwayat barang masuk. |
| `inventory_items` | 1 : N | `goods_receipts` | Satu barang dapat memiliki banyak riwayat restock. |
| `inventory_items` | 1 : N | `sale_items` | Satu barang dapat muncul di banyak detail transaksi. |
| `sales` | 1 : N | `sale_items` | Satu transaksi penjualan memiliki satu atau banyak item. |

### 7.4 Keterangan Tabel

| Tabel | Fungsi |
|---|---|
| `users` | Menyimpan akun admin/kasir untuk login sistem. |
| `suppliers` | Menyimpan master supplier. |
| `inventory_categories` | Menyimpan master kategori barang. |
| `inventory_units` | Menyimpan master satuan barang. |
| `inventory_items` | Menyimpan data barang, stok, batas stok minimum, harga jual, dan supplier. |
| `goods_receipts` | Menyimpan transaksi barang masuk atau restock. |
| `sales` | Menyimpan header transaksi penjualan, total, pembayaran, dan kembalian. |
| `sale_items` | Menyimpan rincian item pada setiap transaksi penjualan. |
