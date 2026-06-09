<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoidLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'user_id',
        'reason',
        'restored_items',
    ];

    protected function casts(): array
    {
        return [
            'restored_items' => 'array',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
