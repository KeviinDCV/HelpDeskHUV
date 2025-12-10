<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class EnDesarrolloController extends Controller
{
    /**
     * Mapeo de rutas a nombres de módulos amigables
     */
    private $moduleNames = [
        // Inventario
        'inventario/cartuchos' => 'Cartuchos',
        'inventario/gabinetes' => 'Gabinetes',
        'inventario/multitomas' => 'Multitomas',
        
        // Gestión
        'gestion/licencias' => 'Licencias',
        'gestion/documentos' => 'Documentos',
        'gestion/lineas' => 'Líneas',
        'gestion/certificados' => 'Certificados',
        'gestion/centros-datos' => 'Centros de Datos',
        
        // Útiles
        'utiles/proyectos' => 'Proyectos',
        'utiles/recordatorios' => 'Recordatorios',
        'utiles/canales-rss' => 'Canales RSS',
        'utiles/base-conocimiento' => 'Base de Conocimiento',
        'utiles/reservas' => 'Reservas',
        'utiles/reportes' => 'Reportes',
        
        // Administración
        'administracion/grupos' => 'Grupos',
        'administracion/entidades' => 'Entidades',
        'administracion/reglas' => 'Reglas',
        
        // Configuración
        'configuracion/desplegables' => 'Desplegables',
        'configuracion/niveles-servicio' => 'Niveles de Servicio',
    ];

    /**
     * Mostrar página de "En Desarrollo"
     */
    public function show(Request $request)
    {
        // Obtener el path de la ruta actual
        $path = $request->path();
        
        // Buscar el nombre del módulo
        $moduleName = $this->moduleNames[$path] ?? 'Esta página';

        return Inertia::render('en-desarrollo', [
            'moduleName' => $moduleName,
        ]);
    }
}
