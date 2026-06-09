<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id');
            $table->string('invoice_number')->unique();
            $table->text('reason');
            $table->unsignedInteger('total_refund')->default(0);
            $table->string('status')->default('partial');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->boolean('is_voided')->default(false);
            $table->timestamps();

            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
