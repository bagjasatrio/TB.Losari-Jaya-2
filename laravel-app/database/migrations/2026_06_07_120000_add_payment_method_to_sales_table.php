<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('payment_method', 20)->nullable()->after('change_amount');
            $table->string('payment_channel', 50)->nullable()->after('payment_method');
            $table->string('payment_reference', 100)->nullable()->after('payment_channel');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_channel', 'payment_reference']);
        });
    }
};
