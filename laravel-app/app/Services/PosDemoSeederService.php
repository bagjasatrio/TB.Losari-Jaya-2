<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class PosDemoSeederService
{
    public function resetAndSeed(): User
    {
        Schema::disableForeignKeyConstraints();
        Sale::query()->delete();
        GoodsReceipt::query()->delete();
        InventoryItem::query()->delete();
        Supplier::query()->delete();
        InventoryCategory::query()->delete();
        InventoryUnit::query()->delete();
        Schema::enableForeignKeyConstraints();

        $admin = User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin Losari',
                'email' => 'admin@losari-jaya.local',
                'password' => Hash::make('losari123'),
            ],
        );

        $supplierNames = [
            'PT Tiga Roda',
            'UD Baja Prima',
            'PT Avian Brands',
            'PT Maspion',
            'CV Baja Sejahtera',
            'CV Kayu Indah',
            'PT Dulux',
            'PT Wavin',
            'PT Semen Gresik',
        ];

        $suppliers = collect($supplierNames)
            ->mapWithKeys(fn (string $name) => [$name => Supplier::query()->create(['name' => $name])]);

        collect([
            'Material Dasar',
            'Finishing & Cat',
            'Perkakas',
            'Plumbing & Pipa',
            'Struktur',
            'Aksesoris',
            'Listrik',
        ])->each(fn (string $name) => InventoryCategory::query()->create(['name' => $name]));

        collect([
            'pcs',
            'kg',
            'gram',
            'sak',
            'box',
            'btg',
            'lembar',
            'kaleng',
            'meter',
            'liter',
            'roll',
        ])->each(fn (string $name) => InventoryUnit::query()->create(['name' => $name]));

        $items = collect([
            [
                'sku' => 'SMN-001',
                'name' => 'Semen Tiga Roda 50kg',
                'category' => 'Material Dasar',
                'unit' => 'sak',
                'supplier' => 'PT Tiga Roda',
                'stock' => 18,
                'min_stock' => 10,
                'price' => 65000,
                'description' => 'Semen utama untuk kebutuhan struktur dan pasangan bata.',
            ],
            [
                'sku' => 'PKU-050',
                'name' => 'Paku Beton 5cm (Box)',
                'category' => 'Perkakas',
                'unit' => 'box',
                'supplier' => 'UD Baja Prima',
                'stock' => 120,
                'min_stock' => 20,
                'price' => 25000,
                'description' => 'Paku beton standar untuk kebutuhan pemasangan.',
            ],
            [
                'sku' => 'PKP-025',
                'name' => 'Paku Payung Curah',
                'category' => 'Perkakas',
                'unit' => 'kg',
                'supplier' => 'UD Baja Prima',
                'stock' => 12.5,
                'min_stock' => 2,
                'price' => 22000,
                'description' => 'Paku payung curah yang dapat dijual per 1/4 kg atau 1/2 kg.',
            ],
            [
                'sku' => 'CAT-102',
                'name' => 'Cat Avian Putih 5kg',
                'category' => 'Finishing & Cat',
                'unit' => 'kaleng',
                'supplier' => 'PT Avian Brands',
                'stock' => 2,
                'min_stock' => 5,
                'price' => 145000,
                'description' => 'Cat dasar interior warna putih.',
            ],
            [
                'sku' => 'PVC-004',
                'name' => 'Pipa PVC Maspion 1"',
                'category' => 'Plumbing & Pipa',
                'unit' => 'btg',
                'supplier' => 'PT Maspion',
                'stock' => 30,
                'min_stock' => 8,
                'price' => 32000,
                'description' => 'Pipa PVC ukuran 1 inci untuk instalasi air.',
            ],
            [
                'sku' => 'BES-010',
                'name' => 'Besi Beton Polos 10mm',
                'category' => 'Struktur',
                'unit' => 'btg',
                'supplier' => 'CV Baja Sejahtera',
                'stock' => 4,
                'min_stock' => 8,
                'price' => 78000,
                'description' => 'Besi beton polos untuk kebutuhan konstruksi ringan.',
            ],
            [
                'sku' => 'TRP-005',
                'name' => 'Triplek Meranti 12mm',
                'category' => 'Material Dasar',
                'unit' => 'lembar',
                'supplier' => 'CV Kayu Indah',
                'stock' => 50,
                'min_stock' => 10,
                'price' => 145000,
                'description' => 'Triplek meranti untuk finishing dan meubel.',
            ],
            [
                'sku' => 'DLX-045',
                'name' => 'Cat Dulux Weathershield 2.5L',
                'category' => 'Finishing & Cat',
                'unit' => 'kaleng',
                'supplier' => 'PT Dulux',
                'stock' => 5,
                'min_stock' => 6,
                'price' => 285000,
                'description' => 'Cat eksterior premium tahan cuaca.',
            ],
            [
                'sku' => 'PVC-088',
                'name' => 'Pipa PVC Wavin 4" AW',
                'category' => 'Plumbing & Pipa',
                'unit' => 'btg',
                'supplier' => 'PT Wavin',
                'stock' => 2,
                'min_stock' => 5,
                'price' => 95000,
                'description' => 'Pipa AW tekanan tinggi untuk saluran air.',
            ],
            [
                'sku' => 'SMG-001',
                'name' => 'Semen Gresik 50kg',
                'category' => 'Material Dasar',
                'unit' => 'sak',
                'supplier' => 'PT Semen Gresik',
                'stock' => 120,
                'min_stock' => 15,
                'price' => 65000,
                'description' => 'Alternatif semen proyek dengan pasokan stabil.',
            ],
        ])->mapWithKeys(function (array $item) use ($suppliers) {
            $model = InventoryItem::query()->create([
                'sku' => $item['sku'],
                'name' => $item['name'],
                'category' => $item['category'],
                'unit' => $item['unit'],
                'supplier_id' => $suppliers[$item['supplier']]->id,
                'stock' => $item['stock'],
                'min_stock' => $item['min_stock'],
                'price' => $item['price'],
                'description' => $item['description'],
            ]);

            return [$item['sku'] => $model];
        });

        collect([
            ['days_ago' => 1, 'hour' => 8, 'sku' => 'SMN-001', 'quantity' => 30, 'cost' => 61000, 'supplier' => 'PT Tiga Roda', 'note' => 'Restock untuk proyek perumahan baru.'],
            ['days_ago' => 2, 'hour' => 10, 'sku' => 'PVC-088', 'quantity' => 12, 'cost' => 90000, 'supplier' => 'PT Wavin', 'note' => 'Persiapan stok pipa AW menjelang akhir pekan.'],
            ['days_ago' => 3, 'hour' => 9, 'sku' => 'DLX-045', 'quantity' => 24, 'cost' => 260000, 'supplier' => 'PT Dulux', 'note' => 'Restock cat eksterior berdasarkan permintaan pelanggan.'],
            ['days_ago' => 5, 'hour' => 11, 'sku' => 'BES-010', 'quantity' => 20, 'cost' => 72000, 'supplier' => 'CV Baja Sejahtera', 'note' => 'Pengadaan besi polos untuk proyek cor.'],
        ])->each(function (array $receipt) use ($items, $suppliers) {
            GoodsReceipt::query()->create([
                'inventory_item_id' => $items[$receipt['sku']]->id,
                'supplier_id' => $suppliers[$receipt['supplier']]->id,
                'quantity' => $receipt['quantity'],
                'unit_cost' => $receipt['cost'],
                'received_at' => $this->makeDate($receipt['days_ago'], $receipt['hour']),
                'note' => $receipt['note'],
            ]);
        });

        collect([
            ['days_ago' => 0, 'hour' => 8, 'minute' => 30, 'items' => [['SMN-001', 2], ['PKU-050', 1], ['PKP-025', 0.5]], 'discount' => 0, 'payment' => 170000],
            ['days_ago' => 0, 'hour' => 10, 'minute' => 15, 'items' => [['CAT-102', 1]], 'discount' => 5000, 'payment' => 150000],
            ['days_ago' => 0, 'hour' => 11, 'minute' => 20, 'items' => [['PVC-004', 4]], 'discount' => 0, 'payment' => 150000],
            ['days_ago' => 0, 'hour' => 13, 'minute' => 45, 'items' => [['SMG-001', 3], ['TRP-005', 1]], 'discount' => 10000, 'payment' => 350000],
            ['days_ago' => 0, 'hour' => 15, 'minute' => 5, 'items' => [['BES-010', 2]], 'discount' => 0, 'payment' => 200000],
            ['days_ago' => 1, 'hour' => 9, 'minute' => 5, 'items' => [['SMN-001', 1], ['DLX-045', 1]], 'discount' => 15000, 'payment' => 360000],
            ['days_ago' => 1, 'hour' => 14, 'minute' => 40, 'items' => [['PVC-088', 2]], 'discount' => 0, 'payment' => 200000],
            ['days_ago' => 2, 'hour' => 10, 'minute' => 0, 'items' => [['TRP-005', 2], ['PKU-050', 3]], 'discount' => 5000, 'payment' => 400000],
            ['days_ago' => 2, 'hour' => 16, 'minute' => 20, 'items' => [['SMG-001', 5]], 'discount' => 0, 'payment' => 330000],
            ['days_ago' => 3, 'hour' => 8, 'minute' => 55, 'items' => [['DLX-045', 1], ['CAT-102', 1]], 'discount' => 20000, 'payment' => 450000],
            ['days_ago' => 4, 'hour' => 13, 'minute' => 15, 'items' => [['PVC-004', 10]], 'discount' => 5000, 'payment' => 350000],
            ['days_ago' => 5, 'hour' => 12, 'minute' => 5, 'items' => [['BES-010', 4], ['PKU-050', 2]], 'discount' => 0, 'payment' => 380000],
            ['days_ago' => 6, 'hour' => 10, 'minute' => 45, 'items' => [['TRP-005', 3]], 'discount' => 0, 'payment' => 450000],
            ['days_ago' => 7, 'hour' => 15, 'minute' => 35, 'items' => [['SMN-001', 4], ['PVC-088', 1]], 'discount' => 10000, 'payment' => 360000],
            ['days_ago' => 8, 'hour' => 9, 'minute' => 50, 'items' => [['SMG-001', 6], ['PKU-050', 4]], 'discount' => 20000, 'payment' => 500000],
            ['days_ago' => 9, 'hour' => 14, 'minute' => 0, 'items' => [['CAT-102', 2], ['PVC-004', 3]], 'discount' => 10000, 'payment' => 420000],
        ])->values()->each(function (array $saleData, int $index) use ($items, $admin) {
            $soldAt = $this->makeDate($saleData['days_ago'], $saleData['hour'], $saleData['minute']);

            $lineItems = collect($saleData['items'])->map(function (array $entry) use ($items) {
                [$sku, $quantity] = $entry;
                $item = $items[$sku];

                return [
                    'inventory_item_id' => $item->id,
                    'sku' => $item->sku,
                    'item_name' => $item->name,
                    'category' => $item->category,
                    'unit' => $item->unit,
                    'quantity' => $quantity,
                    'unit_price' => $item->price,
                    'line_total' => (int) round($item->price * $quantity),
                ];
            });

            $subtotal = $lineItems->sum('line_total');
            $total = $subtotal - $saleData['discount'];

            $sale = Sale::query()->create([
                'invoice_number' => sprintf('TR-%s-%03d', $soldAt->format('ymd'), $index + 1),
                'user_id' => $admin->id,
                'subtotal' => $subtotal,
                'discount' => $saleData['discount'],
                'total' => $total,
                'payment_amount' => max($saleData['payment'], $total),
                'change_amount' => max($saleData['payment'], $total) - $total,
                'sold_at' => $soldAt,
            ]);

            $sale->items()->createMany($lineItems->all());
        });

        return $admin->fresh();
    }

    private function makeDate(int $daysAgo, int $hour, int $minute = 0): Carbon
    {
        return now()
            ->subDays($daysAgo)
            ->setTime($hour, $minute);
    }
}
