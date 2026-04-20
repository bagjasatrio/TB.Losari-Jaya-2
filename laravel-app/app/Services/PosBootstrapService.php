<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
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
            ->with('items')
            ->latest('sold_at')
            ->get();

        return [
            'auth' => [
                'isLoggedIn' => $user !== null,
                'userName' => $user?->name ?? '',
            ],
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

    private function serializeInventoryItem(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'sku' => $item->sku,
            'name' => $item->name,
            'category' => $item->category,
            'unit' => $item->unit,
            'supplier' => $item->supplier?->name ?? '-',
            'stock' => $this->decimal($item->stock),
            'minStock' => $this->decimal($item->min_stock),
            'price' => (int) $item->price,
            'description' => $item->description ?? '',
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
        ];
    }

    private function decimal(mixed $value): float
    {
        return (float) $value;
    }
}
