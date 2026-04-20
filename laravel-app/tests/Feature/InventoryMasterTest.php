<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryMasterTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_inventory_category_and_unit(): void
    {
        $user = User::query()->create([
            'name' => 'Admin Test',
            'username' => 'admin-test',
            'email' => 'admin-test@example.test',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user)
            ->postJson(route('pos.categories.store'), ['name' => 'Elektrikal'])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Elektrikal']);

        $this->assertDatabaseHas('inventory_categories', [
            'name' => 'Elektrikal',
        ]);

        $this->actingAs($user)
            ->postJson(route('pos.units.store'), ['name' => 'dus'])
            ->assertOk()
            ->assertJsonFragment(['name' => 'dus']);

        $this->assertDatabaseHas('inventory_units', [
            'name' => 'dus',
        ]);
    }
}
