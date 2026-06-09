<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    protected $fillable = [
        'return_request_id',
        'inventory_item_id',
        'item_name',
        'sku',
        'unit',
        'quantity_returned',
        'unit_price',
        'refund_amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity_returned' => 'decimal:3',
            'unit_price' => 'integer',
            'refund_amount' => 'integer',
        ];
    }

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
