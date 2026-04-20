<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryCategory;
use App\Models\InventoryUnit;
use App\Models\Sale;
use App\Models\Supplier;
use App\Services\PosBootstrapService;
use App\Services\PosDemoSeederService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PosController extends Controller
{
    public function index(Request $request, PosBootstrapService $bootstrapService)
    {
        return view('pos.app', [
            'initialState' => $request->user() ? $bootstrapService->build($request->user()) : null,
            'csrfToken' => csrf_token(),
            'routes' => [
                'login' => route('pos.login'),
                'logout' => route('pos.logout'),
                'bootstrap' => route('pos.bootstrap'),
                'itemsStore' => route('pos.items.store'),
                'itemsBase' => url('/items'),
                'categoriesStore' => route('pos.categories.store'),
                'unitsStore' => route('pos.units.store'),
                'suppliersStore' => route('pos.suppliers.store'),
                'suppliersBase' => url('/suppliers'),
                'goodsIn' => route('pos.goods-in.store'),
                'checkout' => route('pos.checkout'),
                'reset' => route('pos.reset'),
                'reportPdf' => route('pos.reports.pdf'),
            ],
        ]);
    }

    public function login(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, true)) {
            return response()->json([
                'message' => 'Username atau password salah.',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login berhasil.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function bootstrap(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        return response()->json([
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeItem(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $this->validateItemPayload($request);
        $supplier = $this->resolveSupplier($data['supplier']);
        $this->syncInventoryMasters($data['category'], $data['unit']);

        InventoryItem::query()->create([
            'sku' => $data['sku'],
            'name' => $data['name'],
            'category' => $data['category'],
            'unit' => $data['unit'],
            'supplier_id' => $supplier?->id,
            'stock' => $data['stock'],
            'min_stock' => $data['minStock'],
            'price' => $data['price'],
            'description' => $data['description'],
        ]);

        return response()->json([
            'message' => 'Barang berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function updateItem(Request $request, InventoryItem $item, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $this->validateItemPayload($request, $item);
        $supplier = $this->resolveSupplier($data['supplier']);
        $this->syncInventoryMasters($data['category'], $data['unit']);

        $item->update([
            'sku' => $data['sku'],
            'name' => $data['name'],
            'category' => $data['category'],
            'unit' => $data['unit'],
            'supplier_id' => $supplier?->id,
            'stock' => $data['stock'],
            'min_stock' => $data['minStock'],
            'price' => $data['price'],
            'description' => $data['description'],
        ]);

        return response()->json([
            'message' => 'Barang berhasil diperbarui.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroyItem(Request $request, InventoryItem $item, PosBootstrapService $bootstrapService): JsonResponse
    {
        $item->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeGoodsIn(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'supplier' => ['required', 'string', 'max:255'],
            'itemId' => ['required', 'integer', 'exists:inventory_items,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'cost' => ['required', 'integer', 'min:0'],
            'note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data) {
            $item = InventoryItem::query()->lockForUpdate()->findOrFail($data['itemId']);
            $supplier = $this->resolveSupplier($data['supplier']);

            $item->update([
                'supplier_id' => $supplier?->id,
                'stock' => (float) $item->stock + (float) $data['quantity'],
            ]);

            $item->goodsReceipts()->create([
                'supplier_id' => $supplier?->id,
                'quantity' => $data['quantity'],
                'unit_cost' => $data['cost'],
                'received_at' => Carbon::parse($data['date'])->setTime(9, 0),
                'note' => $data['note'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Barang masuk berhasil dicatat.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function checkout(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.itemId' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'discount' => ['required', 'integer', 'min:0'],
            'payment' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $soldAt = now();
            $lineItems = collect($data['items'])->map(function (array $line) {
                $item = InventoryItem::query()->lockForUpdate()->findOrFail($line['itemId']);

                $quantity = (float) $line['quantity'];

                if ($quantity > (float) $item->stock) {
                    abort(response()->json([
                        'message' => "Stok {$item->name} tidak mencukupi.",
                    ], 422));
                }

                $item->update([
                    'stock' => (float) $item->stock - $quantity,
                ]);

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
            $discount = min($data['discount'], $subtotal);
            $total = $subtotal - $discount;

            if ($data['payment'] < $total) {
                abort(response()->json([
                    'message' => 'Nominal pembayaran kurang dari total tagihan.',
                ], 422));
            }

            $sale = Sale::query()->create([
                'invoice_number' => $this->nextInvoiceNumber($soldAt),
                'user_id' => $request->user()?->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_amount' => $data['payment'],
                'change_amount' => $data['payment'] - $total,
                'sold_at' => $soldAt,
            ]);

            $sale->items()->createMany($lineItems->all());
        });

        return response()->json([
            'message' => 'Transaksi berhasil disimpan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function resetDemo(Request $request, PosDemoSeederService $seederService, PosBootstrapService $bootstrapService): JsonResponse
    {
        $admin = $seederService->resetAndSeed();
        Auth::login($admin);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Data demo berhasil direset.',
            'state' => $bootstrapService->build($admin),
        ]);
    }

    public function storeSupplier(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:suppliers,name'],
        ]);

        Supplier::query()->create([
            'name' => trim($data['name']),
        ]);

        return response()->json([
            'message' => 'Supplier berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function updateSupplier(Request $request, Supplier $supplier, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('suppliers', 'name')->ignore($supplier->id)],
        ]);

        $supplier->update([
            'name' => trim($data['name']),
        ]);

        return response()->json([
            'message' => 'Supplier berhasil diperbarui.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroySupplier(Request $request, Supplier $supplier, PosBootstrapService $bootstrapService): JsonResponse
    {
        if ($supplier->inventoryItems()->exists() || $supplier->goodsReceipts()->exists()) {
            return response()->json([
                'message' => 'Supplier masih dipakai oleh barang atau transaksi restock.',
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeCategory(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $this->validateMasterNamePayload($request, 'inventory_categories');

        InventoryCategory::query()->create([
            'name' => $data['name'],
        ]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeUnit(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $this->validateMasterNamePayload($request, 'inventory_units');

        InventoryUnit::query()->create([
            'name' => $data['name'],
        ]);

        return response()->json([
            'message' => 'Satuan berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function reportPdf(Request $request)
    {
        $payload = $this->buildReportPayload($request);

        $pdf = Pdf::loadView('pos.report-pdf', [
            'report' => $payload,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($payload['filename']);
    }

    private function validateItemPayload(Request $request, ?InventoryItem $item = null): array
    {
        return $request->validate([
            'sku' => ['required', 'string', 'max:255', Rule::unique('inventory_items', 'sku')->ignore($item?->id)],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:255'],
            'supplier' => ['required', 'string', 'max:255'],
            'stock' => ['required', 'numeric', 'min:0'],
            'minStock' => ['required', 'numeric', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function validateMasterNamePayload(Request $request, string $table): array
    {
        $request->merge([
            'name' => trim((string) $request->input('name', '')),
        ]);

        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique($table, 'name')],
        ]);
    }

    private function resolveSupplier(string $name): Supplier
    {
        return Supplier::query()->firstOrCreate([
            'name' => trim($name),
        ]);
    }

    private function syncInventoryMasters(string $category, string $unit): void
    {
        InventoryCategory::query()->firstOrCreate([
            'name' => trim($category),
        ]);

        InventoryUnit::query()->firstOrCreate([
            'name' => trim($unit),
        ]);
    }

    private function nextInvoiceNumber(Carbon $soldAt): string
    {
        $count = Sale::query()
            ->whereDate('sold_at', $soldAt->toDateString())
            ->count() + 1;

        return sprintf('TR-%s-%03d', $soldAt->format('ymd'), $count);
    }

    private function buildReportPayload(Request $request): array
    {
        $type = $request->string('type', 'sales')->toString();
        $period = $request->string('period', 'monthly')->toString();

        return $type === 'inventory'
            ? $this->buildInventoryReportPayload($period)
            : $this->buildSalesReportPayload($request, $period);
    }

    private function buildSalesReportPayload(Request $request, string $period): array
    {
        $sales = Sale::query()
            ->with('items')
            ->latest('sold_at')
            ->get();

        if ($period === 'daily') {
            $selectedDate = Carbon::parse($request->string('date', now()->toDateString())->toString());
            $rows = $sales
                ->filter(fn (Sale $sale) => $sale->sold_at?->toDateString() === $selectedDate->toDateString())
                ->values();

            $summaryRevenue = $rows->sum('total');
            $summaryTransactions = $rows->count();

            return [
                'title' => 'Laporan Penjualan Harian',
                'subtitle' => $selectedDate->translatedFormat('l, d F Y'),
                'filename' => 'laporan-penjualan-harian.pdf',
                'headers' => ['No Transaksi', 'Ringkasan Item', 'Total'],
                'rows' => $rows->map(function (Sale $sale) {
                    return [
                        $sale->invoice_number,
                        $sale->items->map(fn ($item) => $item->item_name.' x'.$this->quantity($item->quantity))->join(', '),
                        $this->currency($sale->total),
                    ];
                })->all(),
                'metrics' => [
                    ['label' => 'Total Pendapatan', 'value' => $this->currency($summaryRevenue)],
                    ['label' => 'Total Transaksi', 'value' => number_format($summaryTransactions, 0, ',', '.')],
                    ['label' => 'Rata-rata', 'value' => $this->currency($summaryTransactions ? (int) round($summaryRevenue / $summaryTransactions) : 0)],
                ],
            ];
        }

        if ($period === 'yearly') {
            $selectedYear = (int) $request->string('year', (string) now()->year)->toString();
            $rows = $sales
                ->filter(fn (Sale $sale) => (int) $sale->sold_at?->year === $selectedYear)
                ->groupBy(fn (Sale $sale) => $sale->sold_at?->format('Y-m'))
                ->sortKeysDesc();

            $normalized = $rows->map(function (Collection $group, string $monthKey) {
                $date = Carbon::createFromFormat('Y-m', $monthKey);

                return [
                    $date->translatedFormat('F Y'),
                    number_format($group->count(), 0, ',', '.'),
                    $this->currency($group->sum('total')),
                ];
            })->values();

            $allSales = $rows->flatten(1);
            $summaryRevenue = $allSales->sum('total');
            $summaryTransactions = $allSales->count();

            return [
                'title' => 'Laporan Penjualan Tahunan',
                'subtitle' => (string) $selectedYear,
                'filename' => 'laporan-penjualan-tahunan.pdf',
                'headers' => ['Bulan', 'Total Transaksi', 'Pendapatan'],
                'rows' => $normalized->all(),
                'metrics' => [
                    ['label' => 'Total Pendapatan', 'value' => $this->currency($summaryRevenue)],
                    ['label' => 'Total Transaksi', 'value' => number_format($summaryTransactions, 0, ',', '.')],
                    ['label' => 'Rata-rata', 'value' => $this->currency($summaryTransactions ? (int) round($summaryRevenue / $summaryTransactions) : 0)],
                ],
            ];
        }

        $selectedMonth = $request->string('month', now()->format('Y-m'))->toString();
        [$year, $month] = array_map('intval', explode('-', $selectedMonth));
        $rows = $sales
            ->filter(function (Sale $sale) use ($year, $month) {
                return (int) $sale->sold_at?->year === $year && (int) $sale->sold_at?->month === $month;
            })
            ->groupBy(fn (Sale $sale) => $sale->sold_at?->toDateString())
            ->sortKeysDesc();

        $normalized = $rows->map(function (Collection $group, string $day) {
            $date = Carbon::parse($day);

            return [
                $date->translatedFormat('d M Y'),
                number_format($group->count(), 0, ',', '.'),
                $this->currency($group->sum('total')),
            ];
        })->values();

        $allSales = $rows->flatten(1);
        $summaryRevenue = $allSales->sum('total');
        $summaryTransactions = $allSales->count();

        return [
            'title' => 'Laporan Penjualan Bulanan',
            'subtitle' => Carbon::create($year, $month, 1)->translatedFormat('F Y'),
            'filename' => 'laporan-penjualan-bulanan.pdf',
            'headers' => ['Tanggal', 'Total Transaksi', 'Pendapatan'],
            'rows' => $normalized->all(),
            'metrics' => [
                ['label' => 'Total Pendapatan', 'value' => $this->currency($summaryRevenue)],
                ['label' => 'Total Transaksi', 'value' => number_format($summaryTransactions, 0, ',', '.')],
                ['label' => 'Rata-rata', 'value' => $this->currency($summaryTransactions ? (int) round($summaryRevenue / $summaryTransactions) : 0)],
            ],
        ];
    }

    private function buildInventoryReportPayload(string $period): array
    {
        $items = InventoryItem::query()
            ->with('supplier')
            ->orderBy('name')
            ->get();

        $value = $items->sum(fn (InventoryItem $item) => (float) $item->stock * $item->price);
        $lowStockCount = $items->filter(fn (InventoryItem $item) => $item->stock <= $item->min_stock)->count();

        return [
            'title' => 'Laporan Stok Barang',
            'subtitle' => 'Snapshot '.$this->periodLabel($period),
            'filename' => 'laporan-stok-barang.pdf',
            'headers' => ['Nama Barang', 'Kategori', 'Supplier', 'Stok', 'Min.', 'Harga', 'Status'],
            'rows' => $items->map(function (InventoryItem $item) {
                return [
                    $item->name.' ('.$item->sku.')',
                    $item->category,
                    $item->supplier?->name ?? '-',
                    $this->quantity($item->stock).' '.$item->unit,
                    $this->quantity($item->min_stock),
                    $this->currency($item->price),
                    $item->stock <= $item->min_stock ? 'Perlu Restock' : 'Aman',
                ];
            })->all(),
            'metrics' => [
                ['label' => 'Nilai Persediaan', 'value' => $this->currency($value)],
                ['label' => 'SKU Aktif', 'value' => number_format($items->count(), 0, ',', '.')],
                ['label' => 'Stok Minimum', 'value' => number_format($lowStockCount, 0, ',', '.')],
            ],
        ];
    }

    private function periodLabel(string $period): string
    {
        return match ($period) {
            'daily' => now()->translatedFormat('d F Y'),
            'yearly' => now()->translatedFormat('Y'),
            default => now()->translatedFormat('F Y'),
        };
    }

    private function currency(int|float $value): string
    {
        return 'Rp '.number_format((int) round($value), 0, ',', '.');
    }

    private function quantity(int|float|string|null $value): string
    {
        $number = (float) $value;

        return rtrim(rtrim(number_format($number, 3, ',', '.'), '0'), ',');
    }
}
