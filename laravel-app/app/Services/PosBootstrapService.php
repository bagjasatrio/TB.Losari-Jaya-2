<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\GoodsReceipt;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\ReturnRequest;
use App\Models\Sale;
use App\Models\StockOpname;
use App\Models\Supplier;
use App\Models\User;
use App\Models\VoidLog;
use Illuminate\Support\Collection;

class PosBootstrapService
{
    public function build(?User $user = null): array
    {
        $inventoryItems = InventoryItem::query()
            ->with('supplier')
            ->orderBy('name')
            ->get();
        $categoryUsage = $inventoryItems->countBy('category');
        $unitUsage = $inventoryItems->countBy('unit');
        $sales = Sale::query()
            ->with('items', 'debtPayments')
            ->latest('sold_at')
            ->get();

        return [
            'auth' => [
                'isLoggedIn' => $user !== null,
                'userName' => $user?->name ?? '',
                'role' => $user?->role ?: User::ROLE_ADMIN,
                'roleLabel' => $user?->role === User::ROLE_CASHIER ? 'Kasir' : 'Admin',
                'canManage' => $user?->isAdmin() ?? false,
            ],
            'users' => $user?->isAdmin()
                ? User::query()
                    ->orderBy('name')
                    ->get()
                    ->map(fn (User $account) => $this->serializeUser($account))
                    ->values()
                    ->all()
                : [],
            'inventory' => $inventoryItems
                ->map(fn (InventoryItem $item) => $this->serializeInventoryItem($item))
                ->values()
                ->all(),
            'categories' => InventoryCategory::query()
                ->orderBy('name')
                ->get()
                ->map(fn (InventoryCategory $category) => $this->serializeMasterName($category, $categoryUsage))
                ->values()
                ->all(),
            'units' => InventoryUnit::query()
                ->orderBy('name')
                ->get()
                ->map(fn (InventoryUnit $unit) => $this->serializeMasterName($unit, $unitUsage))
                ->values()
                ->all(),
            'suppliers' => Supplier::query()
                ->withCount(['inventoryItems', 'goodsReceipts'])
                ->orderBy('name')
                ->get()
                ->map(fn (Supplier $supplier) => $this->serializeSupplier($supplier))
                ->values()
                ->all(),
            'goodsIn' => GoodsReceipt::query()
                ->with(['inventoryItem', 'supplier'])
                ->latest('received_at')
                ->get()
                ->map(fn (GoodsReceipt $receipt) => $this->serializeGoodsReceipt($receipt))
                ->values()
                ->all(),
            'sales' => $sales
                ->map(fn (Sale $sale) => $this->serializeSale($sale))
                ->values()
                ->all(),
            'lastReceipt' => optional($sales->first(), fn (Sale $sale) => $this->serializeSale($sale)),
            'voidLogs' => $user?->isAdmin()
                ? VoidLog::query()
                    ->with(['sale', 'user'])
                    ->latest()
                    ->get()
                    ->map(fn (VoidLog $log) => [
                        'id' => $log->id,
                        'saleId' => $log->sale?->invoice_number,
                        'saleTotal' => (int) ($log->sale?->total ?? 0),
                        'soldAt' => $log->sale?->sold_at?->toIso8601String(),
                        'voidedBy' => $log->user?->name ?? '-',
                        'reason' => $log->reason,
                        'restoredItems' => $log->restored_items,
                        'createdAt' => $log->created_at?->toIso8601String(),
                    ])
                    ->values()
                    ->all()
                : [],
            'returns' => $user?->isAdmin()
                ? ReturnRequest::query()
                    ->with(['sale', 'creator', 'items'])
                    ->latest()
                    ->get()
                    ->map(fn (ReturnRequest $return) => $this->serializeReturn($return))
                    ->values()
                    ->all()
                : [],
            'lastReturn' => optional(ReturnRequest::query()->latest()->first(), fn (ReturnRequest $return) => $this->serializeReturn($return)),
            'opnames' => $user?->isAdmin()
                ? StockOpname::query()
                    ->with('creator')
                    ->latest()
                    ->get()
                    ->map(fn (StockOpname $opname) => $this->serializeOpname($opname))
                    ->values()
                    ->all()
                : [],
            'customers' => $user?->isAdmin()
                ? Customer::query()
                    ->with(['sales' => fn ($q) => $q->where('payment_method', 'hutang')->with(['debtPayments.recorder'])])
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Customer $customer) => $this->serializeCustomer($customer))
                    ->values()
                    ->all()
                : [],
        ];
    }

    private function serializeCustomer(Customer $customer): array
    {
        $debtSales = $customer->sales->map(function (Sale $sale) {
            $paid = (int) $sale->debtPayments->sum('amount');
            $remaining = (int) $sale->total - (int) $sale->payment_amount - $paid;

            return [
                'saleId' => $sale->id,
                'invoiceNumber' => $sale->invoice_number,
                'date' => $sale->sold_at?->toIso8601String(),
                'total' => (int) $sale->total,
                'dp' => (int) $sale->payment_amount,
                'paid' => $paid,
                'remaining' => $remaining,
                'payments' => $sale->debtPayments
                    ->map(fn ($p) => [
                        'id' => $p->id,
                        'amount' => (int) $p->amount,
                        'note' => $p->note ?? '',
                        'paidAt' => $p->paid_at?->toIso8601String(),
                        'recordedBy' => $p->recorder?->name ?? '',
                    ])
                    ->values()
                    ->all(),
            ];
        })->filter(fn ($s) => $s['remaining'] > 0)->values()->all();

        $totalDebt = array_sum(array_column($debtSales, 'remaining'));

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone ?? '',
            'address' => $customer->address ?? '',
            'notes' => $customer->notes ?? '',
            'totalDebt' => $totalDebt,
            'debtSales' => $debtSales,
            'createdAt' => $customer->created_at?->toIso8601String(),
        ];
    }

    private function serializeMasterName(InventoryCategory|InventoryUnit $master, Collection $usage): array
    {
        return [
            'id' => $master->id,
            'name' => $master->name,
            'itemsCount' => (int) ($usage[$master->name] ?? 0),
        ];
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'roleLabel' => $user->role === User::ROLE_CASHIER ? 'Kasir' : 'Admin',
        ];
    }

    private function serializeInventoryItem(InventoryItem $item): array
    {
        $description = $item->description ?? '';
        $purchasePrice = (int) ($item->purchase_price ?? 0);
        $sellPrice = (int) $item->price;
        $profitPerUnit = $sellPrice - $purchasePrice;
        $profitMargin = $sellPrice > 0 ? round(($profitPerUnit / $sellPrice) * 100, 1) : 0;

        return [
            'id' => $item->id,
            'sku' => $item->sku,
            'name' => $item->name,
            'category' => $item->category,
            'unit' => $item->unit,
            'supplier' => $item->supplier?->name ?? '-',
            'stock' => $this->decimal($item->stock),
            'minStock' => $this->decimal($item->min_stock),
            'price' => $sellPrice,
            'purchasePrice' => $purchasePrice,
            'profitPerUnit' => $profitPerUnit,
            'profitMargin' => $profitMargin,
            'basePriceText' => $this->priceTextFromDescription($description, 'Harga dasar'),
            'storePriceText' => $this->priceTextFromDescription($description, 'Harga toko'),
            'retailPriceText' => $this->priceTextFromDescription($description, 'Harga eceran'),
            'description' => $description,
        ];
    }

    private function serializeGoodsReceipt(GoodsReceipt $receipt): array
    {
        return [
            'id' => $receipt->id,
            'date' => $receipt->received_at?->toIso8601String(),
            'itemId' => $receipt->inventory_item_id,
            'itemName' => $receipt->inventoryItem?->name ?? '-',
            'quantity' => $this->decimal($receipt->quantity),
            'cost' => (int) $receipt->unit_cost,
            'supplier' => $receipt->supplier?->name ?? ($receipt->inventoryItem?->supplier?->name ?? '-'),
            'note' => $receipt->note ?? '',
        ];
    }

    private function serializeSupplier(Supplier $supplier): array
    {
        return [
            'id' => $supplier->id,
            'name' => $supplier->name,
            'itemsCount' => (int) $supplier->inventory_items_count,
            'receiptsCount' => (int) $supplier->goods_receipts_count,
        ];
    }

    private function serializeSale(Sale $sale): array
    {
        $items = $sale->items instanceof Collection ? $sale->items : collect();

        return [
            'id' => $sale->invoice_number,
            'dbId' => $sale->getKey(),
            'date' => $sale->sold_at?->toIso8601String(),
            'items' => $items
                ->map(fn ($item) => [
                    'itemId' => $item->inventory_item_id,
                    'sku' => $item->sku,
                    'name' => $item->item_name,
                    'category' => $item->category,
                    'unit' => $item->unit,
                    'quantity' => $this->decimal($item->quantity),
                    'price' => (int) $item->unit_price,
                ])
                ->values()
                ->all(),
            'subtotal' => (int) $sale->subtotal,
            'discount' => (int) $sale->discount,
            'total' => (int) $sale->total,
            'payment' => (int) $sale->payment_amount,
            'change' => (int) $sale->change_amount,
            'status' => $sale->status ?? 'paid',
            'paymentMethod' => $sale->payment_method ?? 'tunai',
            'paymentChannel' => $sale->payment_channel ?? '',
            'paymentReference' => $sale->payment_reference ?? '',
            'customerId' => $sale->customer_id,
            'customerName' => $sale->customer_name ?? '',
            'debtRemaining' => $sale->payment_method === 'hutang'
                ? max(0, (int) $sale->total - (int) $sale->payment_amount - (int) $sale->debtPayments->sum('amount'))
                : 0,
            'voidReason' => $sale->void_reason ?? '',
            'voidedBy' => $sale->voidedByUser?->name ?? '',
            'voidedAt' => $sale->voided_at?->toIso8601String() ?? '',
            'proofUrl' => $sale->payment_proof ? asset('storage/' . $sale->payment_proof) : null,
        ];
    }

    private function serializeOpname(StockOpname $opname): array
    {
        return [
            'id' => $opname->id,
            'opnameNumber' => $opname->opname_number,
            'notes' => $opname->notes ?? '',
            'status' => $opname->status,
            'totalItems' => (int) $opname->total_items,
            'discrepancyItems' => (int) $opname->total_discrepancy_items,
            'totalAdjustment' => (int) $opname->total_adjustment,
            'createdBy' => $opname->creator?->name ?? '-',
            'completedAt' => $opname->completed_at?->toIso8601String(),
            'createdAt' => $opname->created_at?->toIso8601String(),
        ];
    }

    private function serializeReturn(ReturnRequest $return): array
    {
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
    }

    private function decimal(mixed $value): float
    {
        return (float) $value;
    }

    private function priceTextFromDescription(string $description, string $label): string
    {
        $marker = $label.':';
        $start = stripos($description, $marker);

        if ($start === false) {
            return '-';
        }

        $tail = substr($description, $start + strlen($marker));
        $end = strlen($tail);

        foreach ([' | Harga dasar:', ' | Harga toko:', ' | Harga eceran:', ' | Sumber:'] as $separator) {
            $position = stripos($tail, $separator);

            if ($position !== false) {
                $end = min($end, $position);
            }
        }

        $value = trim(substr($tail, 0, $end));

        return $value !== '' ? $value : '-';
    }
}
