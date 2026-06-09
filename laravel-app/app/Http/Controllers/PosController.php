<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\DebtPayment;
use App\Models\GoodsReceipt;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\ReturnRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockOpname;
use App\Models\Supplier;
use App\Models\User;
use App\Models\VoidLog;
use App\Services\PosBootstrapService;
use App\Services\PosDemoSeederService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
                'usersStore' => route('pos.users.store'),
                'usersBase' => url('/users'),
                'changePassword' => route('pos.password.change'),
                'voidBase' => url('/sales'),
                'voidHistory' => route('pos.void.history'),
                'returnsStore' => route('pos.returns.store'),
                'returnsHistory' => route('pos.returns.history'),
                'opnamesStore' => route('pos.opnames.store'),
                'opnamesHistory' => route('pos.opnames.history'),
                'customersStore' => route('pos.customers.store'),
                'customersBase' => url('/customers'),
                'debtStore' => route('pos.debt.store'),
                'debtBase' => url('/debt-payments'),
            ],
        ]);
    }

    public function login(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'username.required' => 'Username wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return response()->json([
                'message' => 'Login berhasil.',
                'state' => $bootstrapService->build($request->user()),
                'csrfToken' => csrf_token(),
            ]);
        }

        return response()->json([
            'message' => 'Username atau password tidak sesuai.',
        ], 422);
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
            'csrfToken' => csrf_token(),
        ]);
    }

    public function storeItem(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

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
            'purchase_price' => $data['purchasePrice'] ?? 0,
            'description' => $data['description'],
        ]);

        return response()->json([
            'message' => 'Barang berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function updateItem(Request $request, InventoryItem $item, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

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
            'purchase_price' => $data['purchasePrice'] ?? $item->purchase_price ?? 0,
            'description' => $data['description'],
        ]);

        return response()->json([
            'message' => 'Barang berhasil diperbarui.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroyItem(Request $request, InventoryItem $item, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $item->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeGoodsIn(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

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

        // Recalculate weighted average purchase price
        $item = InventoryItem::query()->findOrFail($data['itemId']);
        $this->recalculatePurchasePrice($item);

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
            'paymentMethod' => ['required', 'string', 'in:tunai,qris,va,hutang'],
            'paymentProof' => ['nullable', 'string'],
            'customerName' => ['nullable', 'string', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:20'],
            'customerAddress' => ['nullable', 'string', 'max:1000'],
            'dp' => ['nullable', 'integer', 'min:0'],
        ], [
            'paymentMethod.required' => 'Metode pembayaran wajib dipilih.',
            'paymentMethod.in' => 'Metode pembayaran tidak valid.',
        ]);

        $soldAt = now();
        $paymentMethod = $data['paymentMethod'];

        if ($paymentMethod === 'hutang' && empty($data['customerName'])) {
            return response()->json(['message' => 'Nama pelanggan wajib diisi untuk transaksi hutang.'], 422);
        }

        // Resolve or auto-create customer for hutang
        $customerId = null;
        $customerName = null;
        if (! empty($data['customerName'])) {
            $customerData = ['name' => trim($data['customerName'])];
            if (! empty($data['customerPhone'])) {
                $customerData['phone'] = trim($data['customerPhone']);
            }
            if (! empty($data['customerAddress'])) {
                $customerData['address'] = trim($data['customerAddress']);
            }
            $customer = Customer::query()
                ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($data['customerName']))])
                ->first();
            if ($customer) {
                if (! empty($data['customerPhone']) || ! empty($data['customerAddress'])) {
                    $customer->update($customerData);
                }
            } else {
                $customer = Customer::query()->create($customerData);
            }
            $customerId = $customer->id;
            $customerName = $customer->name;
        }

        // Store proof image if provided
        $proofPath = null;
        if (! empty($data['paymentProof'])) {
            $proofPath = $this->storeProofImage($data['paymentProof']);
        }

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
                'item' => $item,
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

        if ($paymentMethod === 'tunai' && $data['payment'] < $total) {
            abort(response()->json([
                'message' => 'Nominal pembayaran kurang dari total tagihan.',
            ], 422));
        }

        if ($paymentMethod === 'hutang') {
            $dp = min((int) ($data['dp'] ?? 0), $total);
            $paymentAmount = $dp;
            $changeAmount = 0;
        } else {
            $paymentAmount = $paymentMethod === 'tunai' ? $data['payment'] : $total;
            $changeAmount = $paymentMethod === 'tunai' ? $data['payment'] - $total : 0;
        }

        $saleItems = $lineItems->map(fn ($li) => collect($li)->except('item')->all())->all();

        DB::transaction(function () use ($saleItems, $request, $soldAt, $subtotal, $discount, $total, $paymentMethod, $paymentAmount, $changeAmount, $proofPath, $customerId, $customerName) {
            $sale = Sale::query()->create([
                'invoice_number' => $this->nextInvoiceNumber($soldAt),
                'user_id' => $request->user()?->id,
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_amount' => $paymentAmount,
                'change_amount' => $changeAmount,
                'payment_method' => $paymentMethod,
                'payment_proof' => $proofPath,
                'sold_at' => $soldAt,
            ]);

            $sale->items()->createMany($saleItems);
        });

        return response()->json([
            'message' => 'Transaksi berhasil disimpan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function resetDemo(Request $request, PosDemoSeederService $seederService, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $admin = $seederService->resetAndSeed();
        Auth::login($admin);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Data stok, pemasukan, dan pengeluaran berhasil direset dari dataset Excel.',
            'state' => $bootstrapService->build($admin),
            'csrfToken' => csrf_token(),
        ]);
    }

    public function storeSupplier(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

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
        $this->ensureAdmin($request);

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
        $this->ensureAdmin($request);

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
        $this->ensureAdmin($request);

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
        $this->ensureAdmin($request);

        $data = $this->validateMasterNamePayload($request, 'inventory_units');

        InventoryUnit::query()->create([
            'name' => $data['name'],
        ]);

        return response()->json([
            'message' => 'Satuan berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function storeUser(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_CASHIER])],
            'password' => ['required', 'string', 'min:6'],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, strip, dan garis bawah.',
            'username.unique' => 'Username sudah digunakan.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'role.required' => 'Role pengguna wajib dipilih.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $username = strtolower(trim($data['username']));

        User::query()->create([
            'name' => trim($data['name']),
            'username' => $username,
            'role' => $data['role'],
            'email' => ($data['email'] ?? null) ?: $username.'@tb-losari-jaya.local',
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function updateUser(Request $request, User $user, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_CASHIER])],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, strip, dan garis bawah.',
            'username.unique' => 'Username sudah digunakan.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'role.required' => 'Role pengguna wajib dipilih.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $updates = [
            'name' => trim($data['name']),
            'username' => strtolower(trim($data['username'])),
            'role' => $data['role'],
            'email' => ($data['email'] ?? null) ?: strtolower(trim($data['username'])).'@tb-losari-jaya.local',
        ];

        if (! empty($data['password'])) {
            $updates['password'] = Hash::make($data['password']);
        }

        $user->update($updates);

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroyUser(Request $request, User $user, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        if ($user->id === $request->user()?->id) {
            return response()->json([
                'message' => 'Tidak bisa menghapus akun sendiri.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function changePassword(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6'],
            'confirm_password' => ['required', 'string', 'same:new_password'],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'new_password.required' => 'Password baru wajib diisi.',
            'new_password.min' => 'Password baru minimal 6 karakter.',
            'confirm_password.required' => 'Konfirmasi password wajib diisi.',
            'confirm_password.same' => 'Konfirmasi password tidak cocok.',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Sesi tidak ditemukan.'], 401);
        }

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($data['new_password']),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function reportPdf(Request $request)
    {
        $this->ensureAdmin($request);

        $payload = $this->buildReportPayload($request);
        $payload['logoDataUri'] = $this->reportLogoDataUri();

        $pdf = Pdf::loadView('pos.report-pdf', [
            'report' => $payload,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($payload['filename']);
    }

    public function voidSale(Request $request, Sale $sale, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ], [
            'reason.required' => 'Alasan pembatalan wajib diisi.',
            'reason.max' => 'Alasan pembatalan maksimal 1000 karakter.',
        ]);

        if ($sale->status === 'void') {
            return response()->json([
                'message' => 'Transaksi ini sudah dibatalkan sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use ($sale, $data, $request) {
            $sale->load('items');

            $restoredItems = $sale->items->map(function (SaleItem $line) {
                $item = InventoryItem::query()->lockForUpdate()->findOrFail($line->inventory_item_id);
                $stockBefore = (float) $item->stock;

                $item->update([
                    'stock' => $stockBefore + (float) $line->quantity,
                ]);

                return [
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'quantity' => (float) $line->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => (float) $item->fresh()->stock,
                ];
            });

            $sale->update([
                'status' => 'void',
                'void_reason' => trim($data['reason']),
                'voided_by' => $request->user()?->id,
                'voided_at' => now(),
            ]);

            $sale->voidLog()->create([
                'user_id' => $request->user()?->id,
                'reason' => trim($data['reason']),
                'restored_items' => $restoredItems->all(),
            ]);
        });

        return response()->json([
            'message' => 'Transaksi berhasil dibatalkan. Stok barang sudah dikembalikan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function voidHistory(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $voidLogs = VoidLog::query()
            ->with(['sale', 'user'])
            ->latest()
            ->get()
            ->map(function (VoidLog $log) {
                return [
                    'id' => $log->id,
                    'saleId' => $log->sale?->invoice_number,
                    'saleTotal' => (int) ($log->sale?->total ?? 0),
                    'soldAt' => $log->sale?->sold_at?->toIso8601String(),
                    'voidedBy' => $log->user?->name ?? '-',
                    'reason' => $log->reason,
                    'restoredItems' => $log->restored_items,
                    'createdAt' => $log->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'voidLogs' => $voidLogs,
        ]);
    }

    public function storeReturn(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'saleId' => ['required', 'integer', 'exists:sales,id'],
            'reason' => ['required', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.itemId' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
        ], [
            'reason.required' => 'Alasan retur wajib diisi.',
            'items.required' => 'Pilih minimal satu barang yang diretur.',
            'items.min' => 'Pilih minimal satu barang yang diretur.',
        ]);

        DB::transaction(function () use ($data, $request) {
            $sale = Sale::query()->with('items')->findOrFail($data['saleId']);

            if ($sale->status === 'void') {
                abort(response()->json([
                    'message' => 'Transaksi ini sudah dibatalkan (void) dan tidak bisa diretur.',
                ], 422));
            }

            // Load previous returns to calculate remaining available quantity per item
            $previousReturns = $sale->returnRequests()
                ->with('items')
                ->get();

            $returnItems = [];
            $totalRefund = 0;

            foreach ($data['items'] as $line) {
                $invItem = InventoryItem::query()->lockForUpdate()->findOrFail($line['itemId']);

                $saleItem = $sale->items->firstWhere('inventory_item_id', $line['itemId']);
                if (! $saleItem) {
                    abort(response()->json([
                        'message' => "Barang {$invItem->name} tidak ditemukan dalam transaksi ini.",
                    ], 422));
                }

                $qtyReturned = (float) $line['quantity'];
                $qtySold = (float) $saleItem->quantity;

                // Calculate already returned quantity for this item across all previous returns
                $alreadyReturned = $previousReturns->sum(fn ($ret) => $ret->items->where('inventory_item_id', $line['itemId'])->sum('quantity_returned')
                );
                $remaining = $qtySold - $alreadyReturned;

                if ($qtyReturned > $remaining) {
                    $availableText = $this->quantity(max($remaining, 0));
                    abort(response()->json([
                        'message' => "Jumlah retur {$invItem->name} melebihi sisa yang bisa diretur ({$availableText}).",
                    ], 422));
                }

                // Check if this item was already fully returned
                if ($remaining <= 0) {
                    abort(response()->json([
                        'message' => "{$invItem->name} sudah diretur semua dan tidak bisa diretur lagi.",
                    ], 422));
                }

                // Restore stock
                $invItem->update([
                    'stock' => (float) $invItem->stock + $qtyReturned,
                ]);

                $refund = (int) round($saleItem->unit_price * $qtyReturned);
                $totalRefund += $refund;

                $returnItems[] = [
                    'inventory_item_id' => $invItem->id,
                    'item_name' => $invItem->name,
                    'sku' => $invItem->sku,
                    'unit' => $invItem->unit,
                    'quantity_returned' => $qtyReturned,
                    'unit_price' => (int) $saleItem->unit_price,
                    'refund_amount' => $refund,
                ];
            }

            // Check if ALL items across ALL returns now equal the original sale
            $totalAlreadyReturned = $previousReturns->sum(fn ($ret) => $ret->items->sum('quantity_returned'));
            $totalSold = $sale->items->sum('quantity');
            $totalNowReturned = collect($returnItems)->sum('quantity_returned');
            $isFullReturn = ($totalAlreadyReturned + $totalNowReturned) >= $totalSold;

            $returnRequest = $sale->returnRequests()->create([
                'invoice_number' => $this->nextReturnInvoiceNumber(),
                'reason' => trim($data['reason']),
                'total_refund' => $totalRefund,
                'status' => $isFullReturn ? 'full' : 'partial',
                'created_by' => $request->user()?->id,
            ]);

            $returnRequest->items()->createMany($returnItems);

            // Update sale status to reflect return
            $sale->update([
                'status' => $isFullReturn ? 'returned' : 'partial_return',
            ]);
        });

        return response()->json([
            'message' => 'Retur berhasil diproses. Stok barang sudah dikembalikan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function returnHistory(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $returns = ReturnRequest::query()
            ->with(['sale', 'creator', 'items'])
            ->latest()
            ->get()
            ->map(function (ReturnRequest $return) {
                return [
                    'id' => $return->id,
                    'invoiceNumber' => $return->invoice_number,
                    'saleId' => $return->sale?->invoice_number,
                    'saleDate' => $return->sale?->sold_at?->toIso8601String(),
                    'reason' => $return->reason,
                    'totalRefund' => (int) $return->total_refund,
                    'status' => $return->status,
                    'isVoided' => (bool) $return->is_voided,
                    'createdBy' => $return->creator?->name ?? '-',
                    'items' => $return->items->map(fn ($item) => [
                        'itemId' => $item->inventory_item_id,
                        'itemName' => $item->item_name,
                        'sku' => $item->sku,
                        'unit' => $item->unit,
                        'quantity' => (float) $item->quantity_returned,
                        'unitPrice' => (int) $item->unit_price,
                        'refundAmount' => (int) $item->refund_amount,
                    ])->values()->all(),
                    'createdAt' => $return->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'returns' => $returns,
        ]);
    }

    public function storeOpname(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.itemId' => ['required', 'integer', 'exists:inventory_items,id'],
            'items.*.actualStock' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'items.required' => 'Data barang opname wajib diisi.',
            'items.min' => 'Pilih minimal satu barang untuk diopname.',
        ]);

        $opnameNumber = $this->nextOpnameNumber();

        DB::transaction(function () use ($data, $request, $opnameNumber) {
            $items = collect($data['items'])->mapWithKeys(fn ($line) => [
                $line['itemId'] => $line,
            ]);

            $inventoryItems = InventoryItem::query()
                ->whereIn('id', $items->keys())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $opnameItems = [];
            $discrepancyCount = 0;
            $totalAdjustment = 0;

            foreach ($items as $itemId => $line) {
                $invItem = $inventoryItems->get($itemId);
                if (! $invItem) {
                    abort(response()->json([
                        'message' => "Barang dengan ID {$itemId} tidak ditemukan.",
                    ], 422));
                }

                $systemStock = (float) $invItem->stock;
                $actualStock = (float) $line['actualStock'];
                $difference = round($actualStock - $systemStock, 3);

                if (abs($difference) > 0.001) {
                    $discrepancyCount++;
                    $totalAdjustment += (int) round($difference * (int) $invItem->price);

                    $invItem->update([
                        'stock' => $actualStock,
                    ]);
                }

                $opnameItems[] = [
                    'inventory_item_id' => $invItem->id,
                    'system_stock' => $systemStock,
                    'actual_stock' => $actualStock,
                    'difference' => $difference,
                    'unit_price' => (int) $invItem->price,
                ];
            }

            $opname = StockOpname::query()->create([
                'opname_number' => $opnameNumber,
                'notes' => trim($data['notes'] ?? ''),
                'status' => 'completed',
                'total_items' => count($opnameItems),
                'total_discrepancy_items' => $discrepancyCount,
                'total_adjustment' => $totalAdjustment,
                'created_by' => $request->user()?->id,
                'completed_at' => now(),
            ]);

            $opname->items()->createMany($opnameItems);
        });

        return response()->json([
            'message' => 'Stok opname berhasil diproses. Stok barang sudah disesuaikan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function opnameHistory(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $opnames = StockOpname::query()
            ->with('creator')
            ->latest()
            ->get()
            ->map(function (StockOpname $opname) {
                return [
                    'id' => $opname->id,
                    'opnameNumber' => $opname->opname_number,
                    'notes' => $opname->notes,
                    'status' => $opname->status,
                    'totalItems' => (int) $opname->total_items,
                    'discrepancyItems' => (int) $opname->total_discrepancy_items,
                    'totalAdjustment' => (int) $opname->total_adjustment,
                    'createdBy' => $opname->creator?->name ?? '-',
                    'completedAt' => $opname->completed_at?->toIso8601String(),
                    'createdAt' => $opname->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'opnames' => $opnames,
        ]);
    }

    private function nextReturnInvoiceNumber(): string
    {
        $prefix = 'RR-'.now()->format('ymd').'-';
        $last = ReturnRequest::query()
            ->where('invoice_number', 'like', $prefix.'%')
            ->orderBy('invoice_number', 'desc')
            ->value('invoice_number');

        $next = $last ? (int) substr($last, -3) + 1 : 1;

        return $prefix.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    private function nextOpnameNumber(): string
    {
        $prefix = 'SO-'.now()->format('ymd').'-';
        $last = StockOpname::query()
            ->where('opname_number', 'like', $prefix.'%')
            ->orderBy('opname_number', 'desc')
            ->value('opname_number');

        $next = $last ? (int) substr($last, -3) + 1 : 1;

        return $prefix.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
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
            'purchasePrice' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            abort(response()->json([
                'message' => 'Akses hanya tersedia untuk akun admin.',
            ], 403));
        }
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

    private function recalculatePurchasePrice(InventoryItem $item): void
    {
        $avg = GoodsReceipt::query()
            ->where('inventory_item_id', $item->id)
            ->selectRaw('SUM(quantity * unit_cost) / SUM(quantity) as avg_cost')
            ->value('avg_cost');

        $item->update([
            'purchase_price' => $avg ? (int) round((float) $avg) : 0,
        ]);
    }

    // ── Customer Management ──

    public function storeCustomer(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'Nama pelanggan wajib diisi.',
        ]);

        Customer::query()->create($data);

        return response()->json([
            'message' => 'Pelanggan berhasil ditambahkan.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function updateCustomer(Request $request, Customer $customer, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'Nama pelanggan wajib diisi.',
        ]);

        $customer->update($data);

        return response()->json([
            'message' => 'Data pelanggan berhasil diperbarui.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroyCustomer(Request $request, Customer $customer, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $customer->delete();

        return response()->json([
            'message' => 'Pelanggan berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    // ── Debt Payments ──

    public function storeDebtPayment(Request $request, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'saleId' => ['required', 'integer', 'exists:sales,id'],
            'amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
            'paidAt' => ['required', 'date'],
        ], [
            'saleId.required' => 'Transaksi wajib dipilih.',
            'amount.required' => 'Jumlah bayar wajib diisi.',
            'amount.min' => 'Jumlah bayar minimal Rp 1.',
            'paidAt.required' => 'Tanggal bayar wajib diisi.',
        ]);

        $sale = Sale::query()->with('debtPayments')->findOrFail($data['saleId']);

        if ($sale->payment_method !== 'hutang') {
            return response()->json(['message' => 'Transaksi ini bukan transaksi hutang.'], 422);
        }

        $alreadyPaid = (int) $sale->debtPayments->sum('amount');
        $remaining = (int) $sale->total - (int) $sale->payment_amount - $alreadyPaid;

        if ($data['amount'] > $remaining) {
            return response()->json([
                'message' => "Jumlah melebihi sisa hutang (".number_format($remaining, 0, ',', '.').").",
            ], 422);
        }

        DebtPayment::query()->create([
            'customer_id' => $sale->customer_id,
            'sale_id' => $sale->id,
            'amount' => $data['amount'],
            'note' => $data['note'] ?? null,
            'paid_at' => $data['paidAt'],
            'recorded_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Pembayaran hutang berhasil dicatat.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    public function destroyDebtPayment(Request $request, DebtPayment $debtPayment, PosBootstrapService $bootstrapService): JsonResponse
    {
        $this->ensureAdmin($request);

        $debtPayment->delete();

        return response()->json([
            'message' => 'Catatan pembayaran berhasil dihapus.',
            'state' => $bootstrapService->build($request->user()),
        ]);
    }

    private function storeProofImage(string $dataUrl): ?string
    {
        // Strip data URL header: "data:image/jpeg;base64,..."
        if (str_contains($dataUrl, ',')) {
            [, $base64] = explode(',', $dataUrl, 2);
        } else {
            $base64 = $dataUrl;
        }

        $bytes = base64_decode($base64, true);
        if ($bytes === false || strlen($bytes) > 300 * 1024) {
            return null;
        }

        // Detect extension from data URL mime type
        $ext = 'jpg';
        if (str_contains($dataUrl, 'image/png')) {
            $ext = 'png';
        } elseif (str_contains($dataUrl, 'image/webp')) {
            $ext = 'webp';
        }

        $filename = 'proof_' . uniqid('', true) . '.' . $ext;
        Storage::disk('public')->put('payment-proofs/' . $filename, $bytes);

        return 'payment-proofs/' . $filename;
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
        if ($period === 'daily') {
            $selectedDate = Carbon::parse($request->string('date', now()->toDateString())->toString(), config('app.timezone'));
            $rows = Sale::query()
                ->with('items')
                ->whereBetween('sold_at', [
                    $selectedDate->copy()->startOfDay(),
                    $selectedDate->copy()->endOfDay(),
                ])
                ->latest('sold_at')
                ->get();

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

        $sales = Sale::query()
            ->with('items')
            ->latest('sold_at')
            ->get();

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

    private function reportLogoDataUri(): ?string
    {
        $path = public_path('pos/logolj2-pdf.jpg');

        if (! file_exists($path)) {
            return null;
        }

        return 'data:image/jpeg;base64,'.base64_encode((string) file_get_contents($path));
    }
}
