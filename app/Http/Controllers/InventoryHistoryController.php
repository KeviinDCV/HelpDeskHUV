<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Vista global del historial de cambios de inventario de toda la flota.
 * El historial por equipo se muestra en la pestaña "Historial" de ver-computador.
 */
class InventoryHistoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 50000);
        $search = $request->input('search', '');
        $categoryFilter = $request->input('category', '');
        $actionFilter = $request->input('action', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

        $query = DB::table('inventory_history as h')
            ->leftJoin('glpi_computers as c', function ($join) {
                $join->on('h.items_id', '=', 'c.id')
                     ->where('h.itemtype', '=', 'Computer');
            })
            ->select(
                'h.id',
                'h.itemtype',
                'h.items_id',
                'h.category',
                'h.action',
                'h.field',
                'h.old_value',
                'h.new_value',
                'h.summary',
                'h.changed_at',
                'c.name as computer_name'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('h.summary', 'LIKE', "%{$search}%")
                  ->orWhere('h.field', 'LIKE', "%{$search}%")
                  ->orWhere('c.name', 'LIKE', "%{$search}%");
            });
        }
        if ($categoryFilter && $categoryFilter !== 'all') {
            $query->where('h.category', $categoryFilter);
        }
        if ($actionFilter && $actionFilter !== 'all') {
            $query->where('h.action', $actionFilter);
        }
        if ($dateFrom) {
            $query->whereDate('h.changed_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('h.changed_at', '<=', $dateTo);
        }

        $history = $query->orderBy('h.changed_at', 'desc')
            ->orderBy('h.id', 'desc')
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage,
                'search' => $search,
                'category' => $categoryFilter,
                'action' => $actionFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ]);

        // Categorías presentes en el historial (para el filtro).
        $categories = DB::table('inventory_history')
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('inventario/historial', [
            'history' => $history,
            'categories' => $categories,
            'filters' => [
                'per_page' => $perPage,
                'search' => $search,
                'category' => $categoryFilter,
                'action' => $actionFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
