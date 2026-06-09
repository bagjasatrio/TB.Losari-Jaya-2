<?php

use App\Models\InventoryItem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('return_request_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->string('item_name');
            $table->string('sku');
            $table->string('unit');
            $table->decimal('quantity_returned', 12, 3);
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('refund_amount')->default(0);
            $table->timestamps();

            $table->foreign('return_request_id')->references('id')->on('return_requests')->cascadeOnDelete();
            $table->foreign('inventory_item_id')->references('id')->on('inventory_items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_items');
    }
};
