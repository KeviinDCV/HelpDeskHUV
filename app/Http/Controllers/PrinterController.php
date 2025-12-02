<?php

namespace App\Http\Controllers;

use App\Models\Printer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrinterController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $manufacturerFilter = $request->input('manufacturer', '');
        $typeFilter = $request->input('type', '');
        $locationFilter = $request->input('location', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

        // Mapeo de campos para ordenamiento
        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_printers as p')
            ->select(
                'p.id',
                'p.name',
                'p.date_mod',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'e.name as entity_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_printertypes as t', 'p.printertypes_id', '=', 't.id')
            ->leftJoin('glpi_printermodels as md', 'p.printermodels_id', '=', 'md.id')
            ->where('p.is_deleted', 0);

        // Aplicar búsqueda si existe
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') { $query->where('p.states_id', $stateFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('p.manufacturers_id', $manufacturerFilter); }
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.printertypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }
        
        $printers = $query->orderBy($orderByField, $sortDirection)
            ->paginate($perPage)
            ->appends([
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
            ]);

        // Obtener IPs para cada impresora
        $printerIds = $printers->pluck('id')->toArray();
        $ipsByPrinter = [];
        if (!empty($printerIds)) {
            $ips = DB::table('glpi_ipaddresses')
                ->where('mainitemtype', 'Printer')
                ->whereIn('mainitems_id', $printerIds)
                ->where('is_deleted', 0)
                ->select('mainitems_id', 'name as ip_address')
                ->get();
            
            foreach ($ips as $ip) {
                if (!isset($ipsByPrinter[$ip->mainitems_id])) {
                    $ipsByPrinter[$ip->mainitems_id] = [];
                }
                $ipsByPrinter[$ip->mainitems_id][] = $ip->ip_address;
            }
        }

        // Agregar IPs a cada impresora
        $printers->getCollection()->transform(function ($printer) use ($ipsByPrinter) {
            $printer->ip_addresses = $ipsByPrinter[$printer->id] ?? [];
            return $printer;
        });

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_printertypes')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();

        return Inertia::render('inventario/impresoras', [
            'printers' => $printers, 'states' => $states, 'manufacturers' => $manufacturers, 'types' => $types, 'locations' => $locations,
            'filters' => [
                'per_page' => $perPage, 'sort' => $sortField, 'direction' => $sortDirection, 'search' => $search,
                'state' => $stateFilter, 'manufacturer' => $manufacturerFilter, 'type' => $typeFilter,
                'location' => $locationFilter, 'date_from' => $dateFrom, 'date_to' => $dateTo
            ]
        ]);
    }

    public function export(Request $request)
    {
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $search = $request->input('search', '');
        $stateFilter = $request->input('state', '');
        $manufacturerFilter = $request->input('manufacturer', '');
        $typeFilter = $request->input('type', '');
        $locationFilter = $request->input('location', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');

        $sortableFields = [
            'name' => 'p.name',
            'entity_name' => 'e.name',
            'state_name' => 's.name',
            'manufacturer_name' => 'mf.name',
            'location_name' => 'l.completename',
            'type_name' => 't.name',
            'model_name' => 'md.name',
            'date_mod' => 'p.date_mod',
        ];

        $orderByField = $sortableFields[$sortField] ?? 'p.name';
        
        $query = DB::table('glpi_printers as p')
            ->select(
                'p.name',
                'e.name as entity_name',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'p.date_mod'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_printertypes as t', 'p.printertypes_id', '=', 't.id')
            ->leftJoin('glpi_printermodels as md', 'p.printermodels_id', '=', 'md.id')
            ->where('p.is_deleted', 0);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('p.name', 'LIKE', "%{$search}%")
                  ->orWhere('e.name', 'LIKE', "%{$search}%")
                  ->orWhere('s.name', 'LIKE', "%{$search}%")
                  ->orWhere('mf.name', 'LIKE', "%{$search}%")
                  ->orWhere('l.completename', 'LIKE', "%{$search}%")
                  ->orWhere('t.name', 'LIKE', "%{$search}%")
                  ->orWhere('md.name', 'LIKE', "%{$search}%");
            });
        }

        if ($stateFilter && $stateFilter !== 'all') { $query->where('p.states_id', $stateFilter); }
        if ($manufacturerFilter && $manufacturerFilter !== 'all') { $query->where('p.manufacturers_id', $manufacturerFilter); }
        if ($typeFilter && $typeFilter !== 'all') { $query->where('p.printertypes_id', $typeFilter); }
        if ($locationFilter && $locationFilter !== 'all') { $query->where('p.locations_id', $locationFilter); }
        if ($dateFrom) { $query->whereDate('p.date_mod', '>=', $dateFrom); }
        if ($dateTo) { $query->whereDate('p.date_mod', '<=', $dateTo); }

        $printers = $query->orderBy($orderByField, $sortDirection)->get();

        // Crear CSV
        $filename = 'impresoras_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'r+');
        
        // Agregar BOM para UTF-8
        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Headers
        fputcsv($handle, [
            'Nombre',
            'Entidad',
            'Estado',
            'Fabricante',
            'Localización',
            'Tipo',
            'Modelo',
            'Última actualización'
        ]);

        // Datos
        foreach ($printers as $printer) {
            fputcsv($handle, [
                $printer->name ?? '-',
                $printer->entity_name ?? '-',
                $printer->state_name ?? '-',
                $printer->manufacturer_name ?? '-',
                $printer->location_name ?? '-',
                $printer->type_name ?? '-',
                $printer->model_name ?? '-',
                $printer->date_mod ? date('Y-m-d H:i', strtotime($printer->date_mod)) : '-'
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function show($id)
    {
        $printer = DB::table('glpi_printers as p')
            ->select(
                'p.*',
                's.name as state_name',
                'mf.name as manufacturer_name',
                'l.completename as location_name',
                't.name as type_name',
                'md.name as model_name',
                'e.name as entity_name',
                DB::raw("CONCAT(ut.firstname, ' ', ut.realname) as tech_name"),
                'gt.name as tech_group_name',
                'd.name as domain_name'
            )
            ->leftJoin('glpi_entities as e', 'p.entities_id', '=', 'e.id')
            ->leftJoin('glpi_states as s', 'p.states_id', '=', 's.id')
            ->leftJoin('glpi_manufacturers as mf', 'p.manufacturers_id', '=', 'mf.id')
            ->leftJoin('glpi_locations as l', 'p.locations_id', '=', 'l.id')
            ->leftJoin('glpi_printertypes as t', 'p.printertypes_id', '=', 't.id')
            ->leftJoin('glpi_printermodels as md', 'p.printermodels_id', '=', 'md.id')
            ->leftJoin('glpi_users as ut', 'p.users_id_tech', '=', 'ut.id')
            ->leftJoin('glpi_groups as gt', 'p.groups_id_tech', '=', 'gt.id')
            ->leftJoin('glpi_domains as d', 'p.domains_id', '=', 'd.id')
            ->where('p.id', $id)
            ->first();

        if (!$printer) {
            abort(404);
        }

        // Obtener direcciones IP asociadas a esta impresora
        $ipAddresses = DB::table('glpi_ipaddresses')
            ->where('mainitemtype', 'Printer')
            ->where('mainitems_id', $id)
            ->where('is_deleted', 0)
            ->select('name as ip_address')
            ->get()
            ->pluck('ip_address')
            ->toArray();

        // Obtener redes IP asociadas
        $ipNetworks = [];
        if (!empty($ipAddresses)) {
            $ipNetworks = DB::table('glpi_ipaddresses as ip')
                ->join('glpi_ipaddresses_ipnetworks as ipn', 'ip.id', '=', 'ipn.ipaddresses_id')
                ->join('glpi_ipnetworks as net', 'ipn.ipnetworks_id', '=', 'net.id')
                ->where('ip.mainitemtype', 'Printer')
                ->where('ip.mainitems_id', $id)
                ->select('net.completename as network_name')
                ->distinct()
                ->get()
                ->pluck('network_name')
                ->toArray();
        }

        $printer->ip_addresses = $ipAddresses;
        $printer->ip_networks = $ipNetworks;

        return response()->json($printer);
    }

    public function create()
    {
        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_printertypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_printermodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();
        $users = DB::table('glpi_users')->select('id', DB::raw("CONCAT(firstname, ' ', realname) as name"))->whereRaw("firstname != '' OR realname != ''")->orderBy('realname')->get();
        $groups = DB::table('glpi_groups')->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('inventario/crear-impresora', [
            'states' => $states,
            'manufacturers' => $manufacturers,
            'types' => $types,
            'models' => $models,
            'locations' => $locations,
            'entities' => $entities,
            'users' => $users,
            'groups' => $groups,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'serial' => 'nullable|string|max:255',
            'otherserial' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'contact_num' => 'nullable|string|max:255',
            'memory_size' => 'nullable|string|max:255',
            'states_id' => 'nullable',
            'manufacturers_id' => 'nullable',
            'printertypes_id' => 'nullable',
            'printermodels_id' => 'nullable',
            'locations_id' => 'nullable',
            'entities_id' => 'nullable',
            'users_id_tech' => 'nullable',
            'groups_id_tech' => 'nullable',
            'have_serial' => 'nullable|boolean',
            'have_parallel' => 'nullable|boolean',
            'have_usb' => 'nullable|boolean',
            'have_ethernet' => 'nullable|boolean',
            'have_wifi' => 'nullable|boolean',
            'comment' => 'nullable|string',
        ]);

        $printerId = DB::table('glpi_printers')->insertGetId([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?: '',
            'otherserial' => $validated['otherserial'] ?: '',
            'contact' => $validated['contact'] ?: '',
            'contact_num' => $validated['contact_num'] ?: '',
            'users_id_tech' => !empty($validated['users_id_tech']) ? (int)$validated['users_id_tech'] : 0,
            'groups_id_tech' => !empty($validated['groups_id_tech']) ? (int)$validated['groups_id_tech'] : 0,
            'states_id' => !empty($validated['states_id']) ? (int)$validated['states_id'] : 0,
            'manufacturers_id' => !empty($validated['manufacturers_id']) ? (int)$validated['manufacturers_id'] : 0,
            'printertypes_id' => !empty($validated['printertypes_id']) ? (int)$validated['printertypes_id'] : 0,
            'printermodels_id' => !empty($validated['printermodels_id']) ? (int)$validated['printermodels_id'] : 0,
            'locations_id' => !empty($validated['locations_id']) ? (int)$validated['locations_id'] : 0,
            'entities_id' => !empty($validated['entities_id']) ? (int)$validated['entities_id'] : 0,
            'comment' => $validated['comment'] ?: '',
            'is_deleted' => 0,
            'is_template' => 0,
            'is_dynamic' => 0,
            'is_recursive' => 0,
            'is_global' => 0,
            'users_id' => 0,
            'groups_id' => 0,
            'domains_id' => 0,
            'networks_id' => 0,
            'memory_size' => $validated['memory_size'] ?: '',
            'have_serial' => !empty($validated['have_serial']) ? 1 : 0,
            'have_parallel' => !empty($validated['have_parallel']) ? 1 : 0,
            'have_usb' => !empty($validated['have_usb']) ? 1 : 0,
            'have_wifi' => !empty($validated['have_wifi']) ? 1 : 0,
            'have_ethernet' => !empty($validated['have_ethernet']) ? 1 : 0,
            'template_name' => '',
            'init_pages_counter' => 0,
            'last_pages_counter' => 0,
            'ticket_tco' => 0,
            'date_creation' => now(),
            'date_mod' => now(),
        ]);

        // Guardar direcciones IP si se proporcionaron
        if ($request->has('ip_addresses') && is_array($request->ip_addresses)) {
            foreach ($request->ip_addresses as $ip) {
                if (!empty(trim($ip))) {
                    DB::table('glpi_ipaddresses')->insert([
                        'entities_id' => 0,
                        'items_id' => 0,
                        'itemtype' => 'NetworkName',
                        'version' => 4,
                        'name' => trim($ip),
                        'binary_0' => 0,
                        'binary_1' => 0,
                        'binary_2' => 65535,
                        'binary_3' => ip2long(trim($ip)) ?: 0,
                        'is_deleted' => 0,
                        'is_dynamic' => 0,
                        'mainitems_id' => $printerId,
                        'mainitemtype' => 'Printer',
                    ]);
                }
            }
        }

        return redirect()->route('inventario.impresoras')->with('success', 'Impresora creada exitosamente');
    }

    public function edit($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $printer = DB::table('glpi_printers')->where('id', $id)->first();
        if (!$printer) {
            abort(404);
        }

        $states = DB::table('glpi_states')->select('id', 'name')->orderBy('name')->get();
        $manufacturers = DB::table('glpi_manufacturers')->select('id', 'name')->orderBy('name')->get();
        $types = DB::table('glpi_printertypes')->select('id', 'name')->orderBy('name')->get();
        $models = DB::table('glpi_printermodels')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('glpi_locations')->select('id', 'name', 'completename')->orderBy('completename')->get();
        $entities = DB::table('glpi_entities')->select('id', 'name')->orderBy('name')->get();
        $users = DB::table('glpi_users')->select('id', DB::raw("CONCAT(firstname, ' ', realname) as name"))->whereRaw("firstname != '' OR realname != ''")->orderBy('realname')->get();
        $groups = DB::table('glpi_groups')->select('id', 'name')->orderBy('name')->get();

        // Obtener IPs existentes
        $ipAddresses = DB::table('glpi_ipaddresses')
            ->where('mainitemtype', 'Printer')
            ->where('mainitems_id', $id)
            ->where('is_deleted', 0)
            ->pluck('name')
            ->toArray();

        return Inertia::render('inventario/editar-impresora', [
            'printer' => $printer,
            'states' => $states,
            'manufacturers' => $manufacturers,
            'types' => $types,
            'models' => $models,
            'locations' => $locations,
            'entities' => $entities,
            'users' => $users,
            'groups' => $groups,
            'existingIps' => $ipAddresses,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'serial' => 'nullable|string|max:255',
            'otherserial' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'contact_num' => 'nullable|string|max:255',
            'memory_size' => 'nullable|string|max:255',
            'states_id' => 'nullable|integer',
            'manufacturers_id' => 'nullable|integer',
            'printertypes_id' => 'nullable|integer',
            'printermodels_id' => 'nullable|integer',
            'locations_id' => 'nullable|integer',
            'entities_id' => 'nullable|integer',
            'users_id_tech' => 'nullable|integer',
            'groups_id_tech' => 'nullable|integer',
            'have_serial' => 'nullable|boolean',
            'have_parallel' => 'nullable|boolean',
            'have_usb' => 'nullable|boolean',
            'have_ethernet' => 'nullable|boolean',
            'have_wifi' => 'nullable|boolean',
            'comment' => 'nullable|string',
        ]);

        DB::table('glpi_printers')->where('id', $id)->update([
            'name' => $validated['name'],
            'serial' => $validated['serial'] ?? '',
            'otherserial' => $validated['otherserial'] ?? '',
            'contact' => $validated['contact'] ?? '',
            'contact_num' => $validated['contact_num'] ?? '',
            'memory_size' => $validated['memory_size'] ?? '',
            'states_id' => $validated['states_id'] ?? 0,
            'manufacturers_id' => $validated['manufacturers_id'] ?? 0,
            'printertypes_id' => $validated['printertypes_id'] ?? 0,
            'printermodels_id' => $validated['printermodels_id'] ?? 0,
            'locations_id' => $validated['locations_id'] ?? 0,
            'entities_id' => $validated['entities_id'] ?? 0,
            'users_id_tech' => $validated['users_id_tech'] ?? 0,
            'groups_id_tech' => $validated['groups_id_tech'] ?? 0,
            'have_serial' => !empty($validated['have_serial']) ? 1 : 0,
            'have_parallel' => !empty($validated['have_parallel']) ? 1 : 0,
            'have_usb' => !empty($validated['have_usb']) ? 1 : 0,
            'have_ethernet' => !empty($validated['have_ethernet']) ? 1 : 0,
            'have_wifi' => !empty($validated['have_wifi']) ? 1 : 0,
            'comment' => $validated['comment'] ?? '',
            'date_mod' => now(),
        ]);

        // Actualizar direcciones IP
        // Primero eliminar las existentes
        DB::table('glpi_ipaddresses')
            ->where('mainitemtype', 'Printer')
            ->where('mainitems_id', $id)
            ->delete();

        // Agregar las nuevas
        if ($request->has('ip_addresses') && is_array($request->ip_addresses)) {
            foreach ($request->ip_addresses as $ip) {
                if (!empty(trim($ip))) {
                    DB::table('glpi_ipaddresses')->insert([
                        'entities_id' => 0,
                        'items_id' => 0,
                        'itemtype' => 'NetworkName',
                        'version' => 4,
                        'name' => trim($ip),
                        'binary_0' => 0,
                        'binary_1' => 0,
                        'binary_2' => 65535,
                        'binary_3' => ip2long(trim($ip)) ?: 0,
                        'is_deleted' => 0,
                        'is_dynamic' => 0,
                        'mainitems_id' => $id,
                        'mainitemtype' => 'Printer',
                    ]);
                }
            }
        }

        return redirect()->route('inventario.impresoras')->with('success', 'Impresora actualizada exitosamente');
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'Administrador') {
            abort(403, 'No autorizado');
        }

        DB::table('glpi_printers')->where('id', $id)->update(['is_deleted' => 1]);

        return redirect()->route('inventario.impresoras')->with('success', 'Impresora eliminada exitosamente');
    }
}
