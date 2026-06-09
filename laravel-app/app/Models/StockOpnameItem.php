<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    protected $fillable = [
        'stock_opname_id',
        'inventory_item_id',
        'system_stock',
        'actual_stock',
        'difference',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'system_stock' => 'decimal:3',
            'actual_stock' => 'decimal:3',
            'difference' => 'decimal:3',
            'unit_price' => 'integer',
        ];
    }

    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
