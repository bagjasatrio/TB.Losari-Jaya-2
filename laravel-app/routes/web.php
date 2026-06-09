<?php

use App\Http\Controllers\PosController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PosController::class, 'index'])->name('pos.index');
Route::post('/login', [PosController::class, 'login'])->name('pos.login');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [PosController::class, 'logout'])->name('pos.logout');
    Route::get('/bootstrap', [PosController::class, 'bootstrap'])->name('pos.bootstrap');
    Route::post('/items', [PosController::class, 'storeItem'])->name('pos.items.store');
    Route::put('/items/{item}', [PosController::class, 'updateItem'])->name('pos.items.update');
    Route::delete('/items/{item}', [PosController::class, 'destroyItem'])->name('pos.items.destroy');
    Route::post('/categories', [PosController::class, 'storeCategory'])->name('pos.categories.store');
    Route::post('/units', [PosController::class, 'storeUnit'])->name('pos.units.store');
    Route::post('/suppliers', [PosController::class, 'storeSupplier'])->name('pos.suppliers.store');
    Route::put('/suppliers/{supplier}', [PosController::class, 'updateSupplier'])->name('pos.suppliers.update');
    Route::delete('/suppliers/{supplier}', [PosController::class, 'destroySupplier'])->name('pos.suppliers.destroy');
    Route::post('/goods-in', [PosController::class, 'storeGoodsIn'])->name('pos.goods-in.store');
    Route::post('/checkout', [PosController::class, 'checkout'])->name('pos.checkout');
    Route::post('/reset-demo', [PosController::class, 'resetDemo'])->name('pos.reset');
    Route::post('/users', [PosController::class, 'storeUser'])->name('pos.users.store');
    Route::put('/users/{user}', [PosController::class, 'updateUser'])->name('pos.users.update');
    Route::delete('/users/{user}', [PosController::class, 'destroyUser'])->name('pos.users.destroy');
    Route::post('/change-password', [PosController::class, 'changePassword'])->name('pos.password.change');
    Route::get('/reports/pdf', [PosController::class, 'reportPdf'])->name('pos.reports.pdf');
    Route::post('/sales/{sale}/void', [PosController::class, 'voidSale'])->name('pos.sales.void');
    Route::get('/void-history', [PosController::class, 'voidHistory'])->name('pos.void.history');
    Route::post('/returns', [PosController::class, 'storeReturn'])->name('pos.returns.store');
    Route::get('/returns', [PosController::class, 'returnHistory'])->name('pos.returns.history');
    Route::post('/opnames', [PosController::class, 'storeOpname'])->name('pos.opnames.store');
    Route::get('/opnames', [PosController::class, 'opnameHistory'])->name('pos.opnames.history');
    Route::post('/customers', [PosController::class, 'storeCustomer'])->name('pos.customers.store');
    Route::put('/customers/{customer}', [PosController::class, 'updateCustomer'])->name('pos.customers.update');
    Route::delete('/customers/{customer}', [PosController::class, 'destroyCustomer'])->name('pos.customers.destroy');
    Route::post('/debt-payments', [PosController::class, 'storeDebtPayment'])->name('pos.debt.store');
    Route::delete('/debt-payments/{debtPayment}', [PosController::class, 'destroyDebtPayment'])->name('pos.debt.destroy');
});
