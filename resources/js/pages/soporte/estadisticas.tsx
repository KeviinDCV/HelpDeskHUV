import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Download, 
    Filter, 
    Users, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Calendar,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import React, { useState } from 'react';

interface StatisticsProps {
    stats: {
        total: number;
        abiertos: number;
        en_proceso: number;
        cerrados: number;
        pendientes: number;
    };
    byStatus: { status: string; count: number; percentage: number }[];
    byPriority: { priority: string; count: number; percentage: number }[];
    byTechnician: { technician: string; total: number; abiertos: number; cerrados: number }[];
    byCategory: { category: string; count: number }[];
    byMonth: { month: string; count: number }[];
    recentCases: { id: number; name: string; status: string; priority: string; created_at: string; technician: string }[];
    filters: {
        date_from: string;
        date_to: string;
        status: string;
        priority: string;
        technician_id: string;
        category_id: string;
    };
    technicians: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

const statusColors: Record<string, string> = {
    'Nuevo': 'bg-blue-500',
    'En proceso': 'bg-yellow-500',
    'Pendiente': 'bg-orange-500',
    'Resuelto': 'bg-green-500',
    'Cerrado': 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
    'Muy alta': 'bg-red-600',
    'Alta': 'bg-orange-500',
    'Media': 'bg-yellow-500',
    'Baja': 'bg-green-500',
    'Muy baja': 'bg-gray-400',
};

export default function Estadisticas({ 
    stats = { total: 0, abiertos: 0, en_proceso: 0, cerrados: 0, pendientes: 0 }, 
    byStatus = [], 
    byPriority = [], 
    byTechnician = [], 
    byCategory = [], 
    byMonth = [],
    recentCases = [],
    filters = { date_from: '', date_to: '', status: '', priority: '', technician_id: '', category_id: '' }, 
    technicians = [], 
    categories = [] 
}: StatisticsProps) {
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters?.priority || 'all');
    const [technicianFilter, setTechnicianFilter] = useState(filters?.technician_id || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category_id || 'all');
    const [showAllTechnicians, setShowAllTechnicians] = useState(false);
    
    const displayedTechnicians = showAllTechnicians ? byTechnician : byTechnician.slice(0, 10);

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
        if (technicianFilter && technicianFilter !== 'all') params.technician_id = technicianFilter;
        if (categoryFilter && categoryFilter !== 'all') params.category_id = categoryFilter;
        
        console.log('Aplicando filtros:', params);
        router.visit('/soporte/estadisticas', { 
            method: 'get',
            data: params,
            preserveState: false,
            preserveScroll: false
        });
    };

    const clearFilters = () => {
        setDateFrom(''); setDateTo(''); setStatusFilter('all'); 
        setPriorityFilter('all'); setTechnicianFilter('all'); setCategoryFilter('all');
        router.visit('/soporte/estadisticas', { 
            method: 'get',
            preserveState: false,
            preserveScroll: false
        });
    };

    const exportToExcel = (type: string) => {
        const params = new URLSearchParams();
        params.append('export', type);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (technicianFilter && technicianFilter !== 'all') params.append('technician_id', technicianFilter);
        if (categoryFilter && categoryFilter !== 'all') params.append('category_id', categoryFilter);
        window.location.href = `/soporte/estadisticas/export?${params}`;
    };

    const maxByMonth = Math.max(...byMonth.map(m => m.count), 1);

    return (
        <>
            <Head title="Estadísticas - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Soporte</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Estadísticas</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6 space-y-6">
                    {/* Filtros */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5 text-[#2c4370]" />
                            <h2 className="font-semibold text-gray-900">Filtros</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Desde</label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Estado</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="1">Nuevo</SelectItem>
                                        <SelectItem value="2">En proceso</SelectItem>
                                        <SelectItem value="3">Pendiente</SelectItem>
                                        <SelectItem value="4">Resuelto</SelectItem>
                                        <SelectItem value="5">Cerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Prioridad</label>
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="1">Muy alta</SelectItem>
                                        <SelectItem value="2">Alta</SelectItem>
                                        <SelectItem value="3">Media</SelectItem>
                                        <SelectItem value="4">Baja</SelectItem>
                                        <SelectItem value="5">Muy baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Técnico</label>
                                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {technicians.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Categoría</label>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-600">
                                <RefreshCw className="h-4 w-4 mr-1" /> Limpiar
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => exportToExcel('general')}>
                                    <Download className="h-4 w-4 mr-1" /> Exportar General
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => exportToExcel('detailed')}>
                                    <Download className="h-4 w-4 mr-1" /> Exportar Detallado
                                </Button>
                                <Button size="sm" onClick={applyFilters} className="bg-[#2c4370] hover:bg-[#3d5583] text-white">
                                    Aplicar Filtros
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Cards de resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Casos</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <BarChart3 className="h-10 w-10 text-[#2c4370] opacity-50" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Abiertos</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.abiertos}</p>
                                </div>
                                <AlertCircle className="h-10 w-10 text-blue-500 opacity-50" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">En Proceso</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.en_proceso}</p>
                                </div>
                                <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Pendientes</p>
                                    <p className="text-3xl font-bold text-orange-600">{stats.pendientes}</p>
                                </div>
                                <Calendar className="h-10 w-10 text-orange-500 opacity-50" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Cerrados</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.cerrados}</p>
                                </div>
                                <CheckCircle2 className="h-10 w-10 text-green-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    {/* Gráficos principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Por Estado */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart className="h-5 w-5 text-[#2c4370]" />
                                <h3 className="font-semibold text-gray-900">Casos por Estado</h3>
                            </div>
                            <div className="space-y-3">
                                {byStatus.map((item) => (
                                    <div key={item.status} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-400'}`}></div>
                                        <span className="text-sm flex-1">{item.status}</span>
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${statusColors[item.status] || 'bg-gray-400'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                                        <span className="text-xs text-gray-500 w-10 text-right">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Por Prioridad */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-[#2c4370]" />
                                <h3 className="font-semibold text-gray-900">Casos por Prioridad</h3>
                            </div>
                            <div className="space-y-3">
                                {byPriority.map((item) => (
                                    <div key={item.priority} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${priorityColors[item.priority] || 'bg-gray-400'}`}></div>
                                        <span className="text-sm flex-1">{item.priority}</span>
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${priorityColors[item.priority] || 'bg-gray-400'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                                        <span className="text-xs text-gray-500 w-10 text-right">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de tendencia por mes */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-[#2c4370]" />
                            <h3 className="font-semibold text-gray-900">Tendencia Mensual</h3>
                        </div>
                        <div className="flex items-end gap-2 h-48">
                            {byMonth.map((item) => (
                                <div key={item.month} className="flex-1 flex flex-col items-center">
                                    <span className="text-xs font-medium text-gray-600 mb-1">{item.count}</span>
                                    <div 
                                        className="w-full bg-[#2c4370] rounded-t-sm transition-all hover:bg-[#3d5583]"
                                        style={{ height: `${(item.count / maxByMonth) * 150}px`, minHeight: '4px' }}
                                    ></div>
                                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">{item.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabla de Técnicos */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <Users className="h-5 w-5 text-[#2c4370]" />
                            <h3 className="font-semibold text-gray-900">Rendimiento por Técnico</h3>
                            <span className="text-xs text-gray-500">({byTechnician.length} técnicos)</span>
                            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => exportToExcel('technicians')}>
                                <Download className="h-4 w-4 mr-1" /> Exportar Todos
                            </Button>
                        </div>
                        <div 
                            className="transition-all duration-500 ease-in-out"
                            style={{ 
                                maxHeight: showAllTechnicians ? `${byTechnician.length * 53 + 50}px` : '580px',
                                overflow: 'hidden'
                            }}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold">Técnico</TableHead>
                                        <TableHead className="font-semibold text-center">Total Asignados</TableHead>
                                        <TableHead className="font-semibold text-center">Abiertos</TableHead>
                                        <TableHead className="font-semibold text-center">Cerrados</TableHead>
                                        <TableHead className="font-semibold text-center">% Resolución</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedTechnicians.map((tech, index) => (
                                        <TableRow 
                                            key={tech.technician} 
                                            className="transition-opacity duration-300"
                                            style={{ 
                                                opacity: index >= 10 && !showAllTechnicians ? 0 : 1,
                                                transitionDelay: `${(index - 10) * 30}ms`
                                            }}
                                        >
                                            <TableCell className="font-medium">{tech.technician}</TableCell>
                                            <TableCell className="text-center">{tech.total}</TableCell>
                                            <TableCell className="text-center text-blue-600">{tech.abiertos}</TableCell>
                                            <TableCell className="text-center text-green-600">{tech.cerrados}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    tech.total > 0 
                                                        ? (tech.cerrados / tech.total) >= 0.7 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : (tech.cerrados / tech.total) >= 0.4 
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {tech.total > 0 ? ((tech.cerrados / tech.total) * 100).toFixed(1) : 0}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {byTechnician.length > 10 && (
                            <div className="px-5 py-3 border-t bg-gray-50">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowAllTechnicians(!showAllTechnicians)}
                                    className="w-full text-[#2c4370] hover:text-[#3d5583] hover:bg-gray-100"
                                >
                                    {showAllTechnicians ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Mostrar menos
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Ver todos ({byTechnician.length - 10} más)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Casos por Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-5 w-5 text-[#2c4370]" />
                                <h3 className="font-semibold text-gray-900">Casos por Categoría</h3>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {byCategory.map((cat, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className="text-sm flex-1 truncate">{cat.category || 'Sin categoría'}</span>
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full bg-[#2c4370]"
                                                style={{ width: `${(cat.count / (byCategory[0]?.count || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium w-10 text-right">{cat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Últimos casos */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-5 w-5 text-[#2c4370]" />
                                <h3 className="font-semibold text-gray-900">Últimos Casos</h3>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {recentCases.map((c) => (
                                    <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                        <span className="text-xs font-mono text-gray-500">#{c.id}</span>
                                        <span className="text-sm flex-1 truncate">{c.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || 'bg-gray-400'} text-white`}>
                                            {c.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
