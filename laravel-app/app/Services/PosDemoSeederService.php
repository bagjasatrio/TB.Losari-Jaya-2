<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\DebtPayment;
use App\Models\GoodsReceipt;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\ReturnItem;
use App\Models\ReturnRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class PosDemoSeederService
{
    public function resetAndSeed(): User
    {
        Schema::disableForeignKeyConstraints();
        try {
            DebtPayment::query()->delete();
            SaleItem::query()->delete();
            Sale::query()->delete();
            ReturnItem::query()->delete();
            ReturnRequest::query()->delete();
            GoodsReceipt::query()->delete();
            InventoryItem::query()->delete();
            Supplier::query()->delete();
            InventoryCategory::query()->delete();
            InventoryUnit::query()->delete();
            Customer::query()->delete();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $admin = User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin Losari',
                'role' => User::ROLE_ADMIN,
                'email' => 'admin@losari-jaya.local',
                'password' => Hash::make('losari123'),
            ],
        );

        User::query()->updateOrCreate(
            ['username' => 'kasir'],
            [
                'name' => 'Kasir Losari',
                'role' => User::ROLE_CASHIER,
                'email' => 'kasir@losari-jaya.local',
                'password' => Hash::make('kasir123'),
            ],
        );

        $supplier = Supplier::query()->create([
            'name' => 'TB. Losari Jaya 2',
        ]);

        $items = collect(require database_path('seeders/data/losari_inventory.php'));

        $items
            ->pluck('category')
            ->unique()
            ->sort()
            ->values()
            ->each(fn (string $name) => InventoryCategory::query()->create(['name' => $name]));

        $items
            ->pluck('unit')
            ->unique()
            ->sort()
            ->values()
            ->each(fn (string $name) => InventoryUnit::query()->create(['name' => $name]));

        $inventoryItems = $items
            ->values()
            ->map(function (array $item, int $index) use ($supplier) {
                $stock = $this->deriveSeedStock($item, $index);

                return InventoryItem::query()->create([
                    'sku' => $item['sku'],
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'unit' => $item['unit'],
                    'supplier_id' => $supplier->id,
                    'stock' => $stock,
                    'min_stock' => $this->deriveSeedMinStock($item, $index, $stock),
                    'price' => $item['price'],
                    'description' => $item['description'],
                ]);
            });

        $this->seedGoodsReceipts($inventoryItems, $supplier);
        $this->seedSales($inventoryItems, $admin);
        $this->seedCustomersAndDebts($admin);

        return $admin->fresh();
    }

    private function seedGoodsReceipts(Collection $items, Supplier $supplier): void
    {
        $items
            ->values()
            ->filter(fn (InventoryItem $item, int $index) => $item->price > 0 && ($index < 12 || $index % 7 === 0))
            ->take(24)
            ->values()
            ->each(function (InventoryItem $item, int $index) use ($supplier) {
                GoodsReceipt::query()->create([
                    'inventory_item_id' => $item->id,
                    'supplier_id' => $supplier->id,
                    'quantity' => $this->deriveRestockQuantity($item, $index),
                    'unit_cost' => $this->baseCost($item),
                    'received_at' => Carbon::now()->subDays(($index % 12) + 1)->setTime(8 + ($index % 5), 0),
                    'note' => "Restock awal {$item->category} berdasarkan dataset Excel.",
                ]);
            });
    }

    private function seedSales(Collection $items, User $admin): void
    {
        $candidates = $items
            ->values()
            ->filter(fn (InventoryItem $item) => $item->price > 0 && (float) $item->stock > (float) $item->min_stock)
            ->values();

        if ($candidates->isEmpty()) {
            return;
        }

        $daysAgo = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        $dateCounters = [];

        foreach ($daysAgo as $index => $day) {
            $soldAt = Carbon::now()->subDays($day)->setTime(8 + ($index % 9), ($index * 10) % 60);
            $itemCount = 1 + ($index % 3);
            $usedIds = [];
            $lineItems = collect();

            for ($offset = 0; $offset < $itemCount; $offset += 1) {
                /** @var InventoryItem $item */
                $item = $candidates->get(($index * 7 + $offset * 13) % $candidates->count());

                if (! $item || in_array($item->id, $usedIds, true)) {
                    continue;
                }

                $usedIds[] = $item->id;
                $quantity = $this->deriveSaleQuantity($item, $index + $offset);
                $lineTotal = (int) round($item->price * $quantity);

                $lineItems->push([
                    'inventory_item_id' => $item->id,
                    'sku' => $item->sku,
                    'item_name' => $item->name,
                    'category' => $item->category,
                    'unit' => $item->unit,
                    'quantity' => $quantity,
                    'unit_price' => $item->price,
                    'line_total' => $lineTotal,
                ]);
            }

            $subtotal = (int) $lineItems->sum('line_total');

            if ($lineItems->isEmpty() || $subtotal <= 0) {
                continue;
            }

            $discount = $subtotal > 250000 && $index % 3 === 0
                ? $this->roundToNearest(min($subtotal * 0.03, 25000), 1000)
                : 0;
            $total = max(0, $subtotal - $discount);
            $payment = $this->roundUpTo($total, 10000);

            $sale = Sale::query()->create([
                'invoice_number' => $this->seedInvoiceNumber($soldAt, $dateCounters),
                'user_id' => $admin->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_amount' => $payment,
                'change_amount' => $payment - $total,
                'sold_at' => $soldAt,
            ]);

            $sale->items()->createMany($lineItems->all());
        }
    }

    private function deriveSeedStock(array $item, int $index): float
    {
        $price = (int) ($item['price'] ?? 0);
        $unit = strtolower((string) ($item['unit'] ?? ''));
        $stock = 20 + ($index % 14) * 2;

        if (str_contains($unit, 'kg')) {
            $stock = 12 + ($index % 8) * 2;
        } elseif (str_contains($unit, 'sak')) {
            $stock = 10 + ($index % 6) * 3;
        } elseif (str_contains($unit, 'btg')) {
            $stock = 16 + ($index % 10) * 3;
        } elseif (str_contains($unit, 'roll')) {
            $stock = 8 + ($index % 6) * 2;
        } elseif (str_contains($unit, 'lembar')) {
            $stock = 14 + ($index % 7) * 3;
        }

        if ($price >= 1000000) {
            $stock = max(2, (int) round($stock * 0.25));
        } elseif ($price >= 500000) {
            $stock = max(3, (int) round($stock * 0.35));
        } elseif ($price >= 200000) {
            $stock = max(5, (int) round($stock * 0.55));
        }

        if (($index + 1) % 17 === 0) {
            $stock = max(1, min($stock, 3));
        }

        return (float) $stock;
    }

    private function deriveSeedMinStock(array $item, int $index, float $stock): float
    {
        $currentMinStock = (float) ($item['min_stock'] ?? 0);

        if ($currentMinStock > 1) {
            return $currentMinStock;
        }

        if (($index + 1) % 17 === 0) {
            return max(2, $stock + 1);
        }

        return (float) max(1, min(12, (int) round($stock * 0.2)));
    }

    private function deriveRestockQuantity(InventoryItem $item, int $index): float
    {
        $unit = strtolower($item->unit);

        if (str_contains($unit, 'kg')) {
            return 5 + ($index % 5) * 2;
        }

        if (str_contains($unit, 'sak')) {
            return 8 + ($index % 4) * 4;
        }

        if (str_contains($unit, 'roll')) {
            return 4 + ($index % 4) * 2;
        }

        return 10 + ($index % 6) * 3;
    }

    private function deriveSaleQuantity(InventoryItem $item, int $seed): float
    {
        $unit = strtolower($item->unit);
        $available = max(1, (int) floor((float) $item->stock - (float) $item->min_stock));
        $quantity = 1 + ($seed % 3);

        if (str_contains($unit, 'kg')) {
            $quantity = [0.5, 1, 2][$seed % 3];
        } elseif ($item->price >= 500000) {
            $quantity = 1;
        } elseif ($item->price < 25000) {
            $quantity = 2 + ($seed % 5);
        }

        return (float) min($quantity, $available);
    }

    private function baseCost(InventoryItem $item): int
    {
        $basePrice = $this->priceTextFromDescription($item->description ?? '', 'Harga dasar');

        return $basePrice > 0 ? $basePrice : (int) round($item->price * 0.85);
    }

    private function priceTextFromDescription(string $description, string $label): int
    {
        $marker = $label.':';
        $start = stripos($description, $marker);

        if ($start === false) {
            return 0;
        }

        $tail = substr($description, $start + strlen($marker));
        $end = strlen($tail);

        foreach ([' | Harga dasar:', ' | Harga toko:', ' | Harga eceran:', ' | Sumber:'] as $separator) {
            $position = stripos($tail, $separator);

            if ($position !== false) {
                $end = min($end, $position);
            }
        }

        return (int) preg_replace('/\D+/', '', substr($tail, 0, $end));
    }

    private function seedInvoiceNumber(Carbon $soldAt, array &$dateCounters): string
    {
        $dateKey = $soldAt->format('ymd');
        $dateCounters[$dateKey] = ($dateCounters[$dateKey] ?? 0) + 1;

        return sprintf('TR-%s-%03d', $dateKey, $dateCounters[$dateKey]);
    }

    private function roundToNearest(int|float $value, int $step): int
    {
        return (int) (round($value / $step) * $step);
    }

    private function roundUpTo(int|float $value, int $step): int
    {
        return (int) (ceil($value / $step) * $step);
    }

    private function seedCustomersAndDebts(User $admin): void
    {
        $customers = collect([
            ['name' => 'Budi Santoso', 'phone' => '08123456789', 'address' => 'Jl. Merdeka No. 45, Kota'],
            ['name' => 'Siti Rahmawati', 'phone' => '08567890123', 'address' => 'Perumahan Indah Blok A.12'],
            ['name' => 'H. Ahmad Dahlan', 'phone' => '08789012345', 'address' => 'Jl. Diponegoro No. 100'],
        ])->map(fn (array $data) => Customer::query()->create($data));

        $sales = Sale::query()
            ->orderBy('sold_at')
            ->limit(4)
            ->get();

        if ($sales->count() < 4) {
            return;
        }

        // Sale 0 → Budi, no payment yet (full debt)
        $sales[0]->update([
            'payment_method' => 'hutang',
            'customer_id' => $customers[0]->id,
            'customer_name' => $customers[0]->name,
            'payment_amount' => 0,
            'change_amount' => 0,
        ]);

        // Sale 1 → Siti, partial payment (dp)
        $sales[1]->update([
            'payment_method' => 'hutang',
            'customer_id' => $customers[1]->id,
            'customer_name' => $customers[1]->name,
            'payment_amount' => (int) round($sales[1]->total * 0.3),
            'change_amount' => 0,
        ]);

        DebtPayment::query()->create([
            'customer_id' => $customers[1]->id,
            'sale_id' => $sales[1]->id,
            'amount' => $sales[1]->payment_amount,
            'paid_at' => $sales[1]->sold_at,
            'recorded_by' => $admin->id,
            'note' => 'DP awal 30%',
        ]);

        // Sale 2 → Ahmad, paid off later via debt payment (0 cash at register)
        $sales[2]->update([
            'payment_method' => 'hutang',
            'customer_id' => $customers[2]->id,
            'customer_name' => $customers[2]->name,
            'payment_amount' => 0,
            'change_amount' => 0,
        ]);

        DebtPayment::query()->create([
            'customer_id' => $customers[2]->id,
            'sale_id' => $sales[2]->id,
            'amount' => $sales[2]->total,
            'paid_at' => $sales[2]->sold_at->copy()->addDay(),
            'recorded_by' => $admin->id,
            'note' => 'Lunas via transfer',
        ]);

        // Sale 3 → Budi, DP 50% at register, remaining 50% still outstanding
        $sales[3]->update([
            'payment_method' => 'hutang',
            'customer_id' => $customers[0]->id,
            'customer_name' => $customers[0]->name,
            'payment_amount' => (int) round($sales[3]->total * 0.5),
            'change_amount' => 0,
        ]);
        // No debt payment — Budi still owes the other 50%
    }
}
