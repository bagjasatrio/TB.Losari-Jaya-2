<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\GoodsReceipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Http\Controllers\PosController;
use App\Services\PosDemoSeederService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryMasterTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_uses_excel_inventory_with_operational_activity(): void
    {
        app(PosDemoSeederService::class)->resetAndSeed();

        $this->assertDatabaseCount('inventory_items', 369);
        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'LJ2-001',
            'name' => 'BESI 6 FULL KSTY',
            'category' => 'BESI',
            'price' => 40000,
        ]);
        $this->assertDatabaseMissing('inventory_items', [
            'sku' => 'SMN-001',
        ]);

        $this->assertGreaterThan(0, (float) InventoryItem::query()->where('sku', 'LJ2-001')->value('stock'));
        $this->assertDatabaseCount('sales', 18);
        $this->assertDatabaseCount('goods_receipts', 24);
        $this->assertGreaterThan(0, SaleItem::query()->count());
        $this->assertGreaterThan(0, Sale::query()->sum('total'));
        $this->assertGreaterThan(0, GoodsReceipt::query()->sum('unit_cost'));
    }

    public function test_user_can_add_inventory_category_and_unit(): void
    {
        $user = User::query()->create([
            'name' => 'Admin Test',
            'username' => 'admin-test',
            'role' => User::ROLE_ADMIN,
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

    public function test_daily_sales_pdf_can_be_generated_after_transaction(): void
    {
        $user = User::query()->create([
            'name' => 'Admin Test',
            'username' => 'admin-pdf',
            'role' => User::ROLE_ADMIN,
            'email' => 'admin-pdf@example.test',
            'password' => Hash::make('password'),
        ]);

        $item = InventoryItem::query()->create([
            'sku' => 'PDF-001',
            'name' => 'Barang PDF',
            'category' => 'Material Dasar',
            'unit' => 'pcs',
            'stock' => 5,
            'min_stock' => 1,
            'price' => 10000,
        ]);

        $sale = Sale::query()->create([
            'invoice_number' => 'TR-PDF-001',
            'user_id' => $user->id,
            'subtotal' => 10000,
            'discount' => 0,
            'total' => 10000,
            'payment_amount' => 10000,
            'change_amount' => 0,
            'sold_at' => now(),
        ]);

        $sale->items()->create([
            'inventory_item_id' => $item->id,
            'sku' => $item->sku,
            'item_name' => $item->name,
            'category' => $item->category,
            'unit' => $item->unit,
            'quantity' => 1,
            'unit_price' => 10000,
            'line_total' => 10000,
        ]);

        $request = Request::create('/reports/pdf', 'GET', [
            'type' => 'sales',
            'period' => 'daily',
            'date' => now()->toDateString(),
        ]);
        $method = new \ReflectionMethod(PosController::class, 'buildReportPayload');
        $method->setAccessible(true);
        $payload = $method->invoke(app(PosController::class), $request);

        $this->assertSame('TR-PDF-001', $payload['rows'][0][0]);

        $this->actingAs($user)
            ->get(route('pos.reports.pdf', [
                'type' => 'sales',
                'period' => 'daily',
                'date' => now()->toDateString(),
            ]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_login_accepts_username_and_returns_role_state(): void
    {
        User::query()->create([
            'name' => 'Kasir Test',
            'username' => 'kasir-test',
            'role' => User::ROLE_CASHIER,
            'email' => 'kasir-test@example.test',
            'password' => Hash::make('password'),
        ]);

        $this->postJson(route('pos.login'), [
            'username' => 'kasir-test',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('state.auth.role', User::ROLE_CASHIER)
            ->assertJsonPath('state.auth.roleLabel', 'Kasir');
    }

    public function test_admin_can_add_cashier_and_cashier_cannot_manage_admin_data(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin User',
            'username' => 'admin-user',
            'role' => User::ROLE_ADMIN,
            'email' => 'admin-user@example.test',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($admin)
            ->postJson(route('pos.users.store'), [
                'name' => 'Kasir Baru',
                'username' => 'kasir-baru',
                'role' => User::ROLE_CASHIER,
                'password' => 'secret123',
            ])
            ->assertOk()
            ->assertJsonFragment(['username' => 'kasir-baru']);

        $cashier = User::query()->where('username', 'kasir-baru')->firstOrFail();

        $this->actingAs($cashier)
            ->postJson(route('pos.categories.store'), ['name' => 'Admin Only'])
            ->assertForbidden();
    }

    public function test_admin_can_void_sale_and_stock_is_restored(): void
    {
        $seederService = app(PosDemoSeederService::class);
        $admin = $seederService->resetAndSeed();

        $sale = Sale::firstOrFail();
        $saleItem = $sale->items->firstOrFail();
        $item = InventoryItem::query()->findOrFail($saleItem->inventory_item_id);
        $stockBefore = (float) $item->stock;

        $this->actingAs($admin)
            ->postJson(route('pos.sales.void', ['sale' => $sale->invoice_number]), [
                'reason' => 'Test void: kesalahan input item.',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Transaksi berhasil dibatalkan. Stok barang sudah dikembalikan.');

        $sale->refresh();
        $this->assertEquals('void', $sale->status);
        $this->assertNotNull($sale->voided_at);
        $this->assertEquals($admin->id, $sale->voided_by);
        $this->assertEquals('Test void: kesalahan input item.', $sale->void_reason);

        $item->refresh();
        $expectedStock = $stockBefore + (float) $saleItem->quantity;
        $this->assertEquals($expectedStock, (float) $item->stock);

        $voidLog = $sale->voidLog()->first();
        $this->assertNotNull($voidLog);
        $this->assertEquals('Test void: kesalahan input item.', $voidLog->reason);
        $this->assertEquals($admin->id, $voidLog->user_id);
        $this->assertNotNull($voidLog->restored_items);

        $this->actingAs($admin)
            ->postJson(route('pos.sales.void', ['sale' => $sale->invoice_number]), [
                'reason' => 'Mencoba void ulang.',
            ])
            ->assertStatus(422);

        $cashier = User::query()->create([
            'name' => 'Cashier Void',
            'username' => 'cashier-void',
            'role' => User::ROLE_CASHIER,
            'email' => 'cashier-void@example.test',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($cashier)
            ->postJson(route('pos.sales.void', ['sale' => $sale->invoice_number]), [
                'reason' => 'Cashier mencoba void.',
            ])
            ->assertForbidden();
    }
}
