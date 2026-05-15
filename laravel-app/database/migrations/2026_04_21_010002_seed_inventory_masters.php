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
        $categories = DB::table('inventory_items')
            ->select('category')
            ->distinct()
            ->pluck('category');

        $units = DB::table('inventory_items')
            ->select('unit')
            ->distinct()
            ->pluck('unit');

        $this->insertMasterNames('inventory_categories', $categories);
        $this->insertMasterNames('inventory_units', $units);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }

    private function insertMasterNames(string $table, $names): void
    {
        $now = now();
        $rows = collect($names)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique()
            ->values()
            ->map(fn (string $name) => [
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if ($rows !== []) {
            DB::table($table)->insertOrIgnore($rows);
        }
    }
};
