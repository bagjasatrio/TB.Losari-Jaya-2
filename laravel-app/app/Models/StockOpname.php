<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    protected $fillable = [
        'opname_number',
        'notes',
        'status',
        'total_items',
        'total_discrepancy_items',
        'total_adjustment',
        'created_by',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'total_items' => 'integer',
            'total_discrepancy_items' => 'integer',
            'total_adjustment' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
