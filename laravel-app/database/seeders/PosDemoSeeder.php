<?php

namespace Database\Seeders;

use App\Services\PosDemoSeederService;
use Illuminate\Database\Seeder;

class PosDemoSeeder extends Seeder
{
    public function run(): void
    {
        app(PosDemoSeederService::class)->resetAndSeed();
    }
}
