<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        
        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];
        $searchTerm = '%' . $query . '%';

        // Buscar en Tickets/Casos
        $tickets = DB::table('glpi_tickets as t')
            ->select(
                't.id',
                't.name',
                't.date',
                DB::raw("CASE 
                    WHEN t.status = 1 THEN 'Nuevo'
                    WHEN t.status = 2 THEN 'En curso'
                    WHEN t.status = 3 THEN 'Planificado'
                    WHEN t.status = 4 THEN 'En espera'
                    WHEN t.status = 5 THEN 'Resuelto'
                    WHEN t.status = 6 THEN 'Cerrado'
                    ELSE 'Desconocido'
                END as status_name")
            )
            ->where('t.is_deleted', 0)
            ->where(function($q) use ($searchTerm, $query) {
                $q->where('t.name', 'like', $searchTerm)
                  ->orWhere('t.id', '=', $query);
            })
            ->orderBy('t.date', 'desc')
            ->limit(5)
            ->get();

        foreach ($tickets as $ticket) {
            $results[] = [
                'id' => $ticket->id,
                'type' => 'ticket',
                'title' => "#{$ticket->id} - " . (strlen($ticket->name) > 60 ? substr($ticket->name, 0, 60) . '...' : $ticket->name),
                'subtitle' => $ticket->status_name . ' • ' . date('d/m/Y', strtotime($ticket->date)),
                'url' => "/soporte/casos/{$ticket->id}/editar",
            ];
        }

        // Buscar en Computadores
        $computers = DB::table('glpi_computers')
            ->select('id', 'name', 'serial', 'otherserial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm)
                  ->orWhere('otherserial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(5)
            ->get();

        foreach ($computers as $computer) {
            $results[] = [
                'id' => $computer->id,
                'type' => 'computer',
                'title' => $computer->name,
                'subtitle' => ($computer->serial ?: 'Sin serial') . ($computer->otherserial ? " • {$computer->otherserial}" : ''),
                'url' => "/inventario/computadores/{$computer->id}",
            ];
        }

        // Buscar en Monitores
        $monitors = DB::table('glpi_monitors')
            ->select('id', 'name', 'serial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($monitors as $monitor) {
            $results[] = [
                'id' => $monitor->id,
                'type' => 'monitor',
                'title' => $monitor->name,
                'subtitle' => $monitor->serial ?: 'Sin serial',
                'url' => "/inventario/monitores/{$monitor->id}",
            ];
        }

        // Buscar en Impresoras
        $printers = DB::table('glpi_printers')
            ->select('id', 'name', 'serial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($printers as $printer) {
            $results[] = [
                'id' => $printer->id,
                'type' => 'printer',
                'title' => $printer->name,
                'subtitle' => $printer->serial ?: 'Sin serial',
                'url' => "/inventario/impresoras/{$printer->id}",
            ];
        }

        // Buscar en Usuarios de Laravel
        $users = User::where('is_active', 1)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('username', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($users as $user) {
            $results[] = [
                'id' => $user->id,
                'type' => 'user',
                'title' => $user->name,
                'subtitle' => $user->role . ' • ' . $user->email,
                'url' => "/administracion/usuarios",
            ];
        }

        // Buscar en Teléfonos
        $phones = DB::table('glpi_phones')
            ->select('id', 'name', 'serial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($phones as $phone) {
            $results[] = [
                'id' => $phone->id,
                'type' => 'phone',
                'title' => $phone->name,
                'subtitle' => $phone->serial ?: 'Sin serial',
                'url' => "/inventario/telefonos/{$phone->id}",
            ];
        }

        // Buscar en Dispositivos de Red
        $networks = DB::table('glpi_networkequipments')
            ->select('id', 'name', 'serial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($networks as $network) {
            $results[] = [
                'id' => $network->id,
                'type' => 'network',
                'title' => $network->name,
                'subtitle' => $network->serial ?: 'Sin serial',
                'url' => "/inventario/dispositivos-red/{$network->id}",
            ];
        }

        // Buscar en Dispositivos/Periféricos
        $peripherals = DB::table('glpi_peripherals')
            ->select('id', 'name', 'serial')
            ->where('is_deleted', 0)
            ->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('serial', 'like', $searchTerm);
            })
            ->orderBy('name')
            ->limit(3)
            ->get();

        foreach ($peripherals as $peripheral) {
            $results[] = [
                'id' => $peripheral->id,
                'type' => 'peripheral',
                'title' => $peripheral->name,
                'subtitle' => $peripheral->serial ?: 'Sin serial',
                'url' => "/inventario/dispositivos/{$peripheral->id}",
            ];
        }

        // Ordenar resultados: tickets primero, luego por relevancia
        usort($results, function($a, $b) {
            $typeOrder = ['ticket' => 0, 'computer' => 1, 'user' => 2, 'monitor' => 3, 'printer' => 4, 'phone' => 5, 'network' => 6, 'peripheral' => 7];
            return ($typeOrder[$a['type']] ?? 99) - ($typeOrder[$b['type']] ?? 99);
        });

        return response()->json([
            'results' => array_slice($results, 0, 15) // Máximo 15 resultados
        ]);
    }
}
