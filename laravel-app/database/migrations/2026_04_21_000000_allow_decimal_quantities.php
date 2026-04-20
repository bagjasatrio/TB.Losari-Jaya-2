<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE inventory_items MODIFY stock DECIMAL(12,3) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE inventory_items MODIFY min_stock DECIMAL(12,3) NOT NULL DEFAULT 5');
        DB::statement('ALTER TABLE goods_receipts MODIFY quantity DECIMAL(12,3) NOT NULL');
        DB::statement('ALTER TABLE sale_items MODIFY quantity DECIMAL(12,3) NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE inventory_items MODIFY stock INT UNSIGNED NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE inventory_items MODIFY min_stock INT UNSIGNED NOT NULL DEFAULT 5');
        DB::statement('ALTER TABLE goods_receipts MODIFY quantity INT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE sale_items MODIFY quantity INT UNSIGNED NOT NULL');
    }
};
