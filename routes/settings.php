<?php

use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Mismo límite que tenía /settings/password (retirada junto con las demás páginas del kit
    // inicial): esta ruta valida la contraseña actual, y sin límite admite probarla en bucle.
    Route::put('settings/profile/password', [ProfileController::class, 'updatePassword'])
        ->middleware('throttle:6,1')
        ->name('profile.password');

    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
