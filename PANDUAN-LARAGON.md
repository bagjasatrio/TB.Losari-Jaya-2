# Panduan Menjalankan Project di Laragon

Panduan ini dibuat khusus untuk project `TB Losari Jaya 2 POS` yang ada di folder:

```powershell
C:\Users\ASUS\Documents\Codex\2026-04-20-files-mentioned-by-the-user-ta1\laravel-app
```

## 1. Persiapan

Pastikan di Laragon sudah tersedia:

- Apache
- MySQL
- PHP
- Composer

Lalu jalankan Laragon dan klik `Start All`.

## 2. Masuk ke folder project

Buka terminal PowerShell, lalu masuk ke folder Laravel:

```powershell
cd C:\Users\ASUS\Documents\Codex\2026-04-20-files-mentioned-by-the-user-ta1\laravel-app
```

## 3. Install dependency Laravel

Kalau project baru dipindahkan ke komputer lain atau folder `vendor` belum ada, jalankan:

```powershell
composer install
```

## 4. Siapkan file environment

Kalau file `.env` belum ada, salin dari `.env.example`:

```powershell
Copy-Item .env.example .env
```

Lalu generate application key:

```powershell
php artisan key:generate
```

## 5. Konfigurasi database Laragon

Project ini sudah disiapkan menggunakan MySQL Laragon dengan konfigurasi berikut:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tb_losari_jaya_2
DB_USERNAME=root
DB_PASSWORD=
```

Kalau belum ada databasenya, buat dulu salah satu dari dua cara berikut.

### Opsi A: lewat phpMyAdmin

1. Jalankan Laragon.
2. Klik `Menu > MySQL > phpMyAdmin`.
3. Buat database baru dengan nama:

```text
tb_losari_jaya_2
```

### Opsi B: lewat command line MySQL

Kalau MySQL Laragon ada di lokasi standar, jalankan:

```powershell
& "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS tb_losari_jaya_2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Kalau versi folder MySQL di Laragon Anda berbeda, sesuaikan nama foldernya.

## 6. Jalankan migrasi database

Untuk membuat semua tabel:

```powershell
php artisan migrate
```

Kalau project sudah pernah dijalankan sebelumnya, tetap jalankan perintah di atas setelah update ini agar kolom stok dan jumlah transaksi berubah menjadi desimal.

Kalau ingin sekaligus isi data demo:

```powershell
php artisan migrate --seed
```

Untuk menghapus semua tabel lalu membuat ulang dari nol beserta data demo:

```powershell
php artisan migrate:fresh --seed
```

Perintah yang paling cocok untuk project ini biasanya:

```powershell
php artisan migrate:fresh --seed
```

## 7. Cara menjalankan aplikasinya

Ada 2 cara menjalankan project ini.

### Opsi A: lewat Apache Laragon

Ini cara yang direkomendasikan karena project ini sudah disiapkan untuk domain lokal:

```text
http://tb-losari-jaya-2.localhost/
```

Langkahnya:

1. Pastikan Laragon `Start All`.
2. Pastikan Apache dan MySQL aktif.
3. Buka browser ke:

```text
http://tb-losari-jaya-2.localhost/
```

### Opsi B: lewat server bawaan Laravel

Kalau ingin menjalankan manual tanpa Apache Laragon:

```powershell
php artisan serve
```

Lalu buka:

```text
http://127.0.0.1:8000
```

## 8. Akun login demo

Gunakan akun berikut:

```text
Username: admin
Password: losari123
```

## 9. Kalau database ingin di-reset

Kalau data testing sudah berubah-ubah dan ingin kembali ke kondisi awal:

```powershell
php artisan migrate:fresh --seed
```

Atau dari aplikasi, login lalu gunakan tombol `Reset Data`.

## 10. Catatan penting

- URL yang paling aman dipakai saat ini adalah `http://tb-losari-jaya-2.localhost/`.
- Alias `tb-losari-jaya-2.test` butuh edit file `hosts` Windows dengan hak Administrator.
- Kalau port MySQL Laragon Anda bukan `3306`, ubah `DB_PORT` di file `.env`.
- Kalau `composer install` gagal karena ekstensi PHP tertentu belum aktif, cek menu `Laragon > PHP > Extensions`.

## 11. Urutan cepat yang paling praktis

Kalau Anda hanya ingin langsung jalan, urutannya cukup ini:

```powershell
cd C:\Users\ASUS\Documents\Codex\2026-04-20-files-mentioned-by-the-user-ta1\laravel-app
php artisan key:generate
php artisan migrate:fresh --seed
```

Lalu buka:

```text
http://tb-losari-jaya-2.localhost/
```
