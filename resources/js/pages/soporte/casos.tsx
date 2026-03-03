import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Edit, Trash2, Filter, X, CheckSquare, Loader2, Plus, Minus, Star, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ============= GLPI-style Filter System Types =============
interface FilterCriterion {
    id: string;
    connector: 'AND' | 'OR' | 'AND NOT' | 'OR NOT';
    field: string;
    operator: string;
    value: string;
}

const FILTER_FIELDS = [
    { value: 'status', label: 'Estado', type: 'select' },
    { value: 'title', label: 'Título', type: 'text' },
    { value: 'id', label: 'ID', type: 'text' },
    { value: 'priority', label: 'Prioridad', type: 'select' },
    { value: 'urgency', label: 'Urgencia', type: 'select' },
    { value: 'impact', label: 'Impacto', type: 'select' },
    { value: 'date', label: 'Fecha de Apertura', type: 'date' },
    { value: 'closedate', label: 'Fecha de cierre', type: 'date' },
    { value: 'date_mod', label: 'Última actualización', type: 'date' },
    { value: 'category', label: 'Categoría', type: 'select' },
    { value: 'entity', label: 'Entidad', type: 'text' },
    { value: 'type', label: 'Tipo', type: 'select' },
    { value: 'requester', label: 'Solicitante', type: 'text' },
    { value: 'assigned', label: 'Técnico', type: 'select_technician' },
    { value: 'item_type', label: 'Tipos de elementos asociados', type: 'select_item_type' },
    { value: 'description', label: 'Descripción', type: 'text' },
    { value: 'solvedate', label: 'Fecha de solución', type: 'date' },
    { value: 'location', label: 'Localización', type: 'text' },
];

const STATUS_OPTIONS = [
    { value: '1', label: 'Nuevo' },
    { value: '2', label: 'En curso (asignada)' },
    { value: '3', label: 'En curso (planificada)' },
    { value: '4', label: 'En espera' },
    { value: '5', label: 'Resueltas' },
    { value: '6', label: 'Cerrado' },
    { value: 'notold', label: 'No resueltos' },
    { value: 'notclosed', label: 'Sin cerrar' },
    { value: 'process', label: 'En curso' },
    { value: 'solved_closed', label: 'Resuelto + Cerrado' },
    { value: 'all', label: 'Todo' },
];

const PRIORITY_OPTIONS = [
    { value: '1', label: 'Muy baja' },
    { value: '2', label: 'Baja' },
    { value: '3', label: 'Media' },
    { value: '4', label: 'Alta' },
    { value: '5', label: 'Muy alta' },
    { value: '6', label: 'Urgente' },
];

const URGENCY_OPTIONS = [
    { value: '1', label: 'Muy baja' },
    { value: '2', label: 'Baja' },
    { value: '3', label: 'Media' },
    { value: '4', label: 'Alta' },
    { value: '5', label: 'Muy alta' },
];

const IMPACT_OPTIONS = [
    { value: '1', label: 'Muy bajo' },
    { value: '2', label: 'Bajo' },
    { value: '3', label: 'Medio' },
    { value: '4', label: 'Alto' },
    { value: '5', label: 'Muy alto' },
];

const TYPE_OPTIONS = [
    { value: '1', label: 'Incidencia' },
    { value: '2', label: 'Solicitud' },
];

const ITEM_TYPE_OPTIONS = [
    { value: 'Computer', label: 'Computador' },
    { value: 'Peripheral', label: 'Dispositivo' },
    { value: 'NetworkEquipment', label: 'Dispositivo para red' },
    { value: 'Enclosure', label: 'Gabinete' },
    { value: 'Printer', label: 'Impresora' },
    { value: 'Monitor', label: 'Monitor' },
    { value: 'Software', label: 'Programa' },
    { value: 'Phone', label: 'Teléfono' },
];

const CONNECTOR_OPTIONS = [
    { value: 'AND', label: 'Y' },
    { value: 'OR', label: 'O' },
    { value: 'AND NOT', label: 'Y NO' },
    { value: 'OR NOT', label: 'O NO' },
];

function getOperatorsForField(fieldType: string): { value: string; label: string }[] {
    switch (fieldType) {
        case 'select':
        case 'select_technician':
        case 'select_item_type':
            return [{ value: 'is', label: 'es' }];
        case 'text':
            return [
                { value: 'contains', label: 'contiene' },
                { value: 'is', label: 'es' },
                { value: 'not_contains', label: 'no contiene' },
                { value: 'starts_with', label: 'empieza por' },
                { value: 'ends_with', label: 'termina por' },
            ];
        case 'date':
            return [
                { value: 'is', label: 'es' },
                { value: 'before', label: 'antes' },
                { value: 'after', label: 'después' },
            ];
        default:
            return [{ value: 'contains', label: 'contiene' }];
    }
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

interface User {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface Category {
    id: number;
    name: string;
    completename: string;
}

interface Technician {
    id: number;
    name: string;
    firstname: string;
    realname: string;
    fullname: string;
}

interface Ticket {
    id: number;
    name: string;
    entity_name: string;
    date: string;
    date_mod: string;
    status: number;
    status_name: string;
    priority: number;
    priority_name: string;
    requester_name: string | null;
    requester_user_id: number | null;
    assigned_name: string | null;
    assigned_user_id: number | null;
    assigned_glpi_id: number | null;
    category_name: string | null;
    item_name: string | null;
    users_id_recipient: number;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface TicketsProps {
    tickets: {
        data: Ticket[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    categories: Category[];
    technicians: Technician[];
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        status: string;
        priority: string;
        category: string;
        assigned: string;
        date_from: string;
        date_to: string;
        filter: string;
        exclude_maintenance: string;
        criteria: string;
    };
    auth: {
        user: User;
    };
}

function parseSavedCriteria(criteriaStr: string): FilterCriterion[] {
    if (!criteriaStr) return [];
    try {
        const parsed = JSON.parse(criteriaStr);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
    return [];
}

export default function Casos({ tickets, categories, technicians, filters, auth }: TicketsProps) {
    // Inicializar criterios desde la URL o con un criterio por defecto
    const initialCriteria = parseSavedCriteria(filters.criteria);
    const [filterCriteria, setFilterCriteria] = React.useState<FilterCriterion[]>(
        initialCriteria.length > 0 ? initialCriteria : [
            { id: generateId(), connector: 'AND', field: 'status', operator: 'is', value: 'notold' }
        ]
    );

    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [ticketToDelete, setTicketToDelete] = React.useState<Ticket | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
    const [ticketToView, setTicketToView] = React.useState<Ticket | null>(null);
    const [ticketSolution, setTicketSolution] = React.useState<{ content: string; solved_by: string | null; date_creation: string } | null>(null);
    const [loadingSolution, setLoadingSolution] = React.useState(false);

    // Estados para resolver caso
    const [solveDialogOpen, setSolveDialogOpen] = React.useState(false);
    const [ticketToSolve, setTicketToSolve] = React.useState<Ticket | null>(null);
    const [solution, setSolution] = React.useState('');
    const [solveDate, setSolveDate] = React.useState('');
    const [solving, setSolving] = React.useState(false);
    const [solveError, setSolveError] = React.useState<string | null>(null);
    const [excludeMaintenance, setExcludeMaintenance] = React.useState(filters.exclude_maintenance === '1');

    const hasActiveFilters = filterCriteria.length > 0 || filters.filter || excludeMaintenance;

    const getSpecialFilterLabel = () => {
        switch (filters.filter) {
            case 'unassigned': return 'Sin asignar';
            case 'my_cases': return 'Mis casos';
            case 'my_pending': return 'Sin resolver';
            case 'my_resolved': return 'Resueltos';
            default: return null;
        }
    };

    const clearSpecialFilter = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
        };
        if (excludeMaintenance) params.exclude_maintenance = '1';
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        router.get('/soporte/casos', params, { preserveState: false });
    };

    // ============= Filter Criteria Management =============
    const addCriterion = () => {
        setFilterCriteria(prev => [...prev, {
            id: generateId(),
            connector: 'AND',
            field: 'status',
            operator: 'is',
            value: 'notold'
        }]);
    };

    const addGlobalCriterion = () => {
        setFilterCriteria(prev => [...prev, {
            id: generateId(),
            connector: 'AND',
            field: 'title',
            operator: 'contains',
            value: ''
        }]);
    };

    const removeCriterion = (id: string) => {
        setFilterCriteria(prev => prev.filter(c => c.id !== id));
    };

    const updateCriterion = (id: string, updates: Partial<FilterCriterion>) => {
        setFilterCriteria(prev => prev.map(c => {
            if (c.id !== id) return c;
            const updated = { ...c, ...updates };
            // Reset operator and value when field changes
            if (updates.field && updates.field !== c.field) {
                const fieldDef = FILTER_FIELDS.find(f => f.value === updates.field);
                const operators = getOperatorsForField(fieldDef?.type || 'text');
                updated.operator = operators[0]?.value || 'contains';
                updated.value = '';
            }
            return updated;
        }));
    };

    const getFieldDef = (fieldValue: string) => FILTER_FIELDS.find(f => f.value === fieldValue);

    const renderValueInput = (criterion: FilterCriterion) => {
        const fieldDef = getFieldDef(criterion.field);
        if (!fieldDef) return <Input type="text" value={criterion.value} onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })} className="h-7 text-xs w-40" />;

        switch (fieldDef.type) {
            case 'select':
                let options: { value: string; label: string }[] = [];
                if (criterion.field === 'status') options = STATUS_OPTIONS;
                else if (criterion.field === 'priority') options = PRIORITY_OPTIONS;
                else if (criterion.field === 'urgency') options = URGENCY_OPTIONS;
                else if (criterion.field === 'impact') options = IMPACT_OPTIONS;
                else if (criterion.field === 'type') options = TYPE_OPTIONS;
                else if (criterion.field === 'category') {
                    options = categories.map(cat => ({ value: cat.id.toString(), label: cat.completename }));
                }
                return (
                    <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[160px]"
                    >
                        <option value="">--</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'select_technician':
                return (
                    <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[160px]"
                    >
                        <option value="">--</option>
                        {technicians.map(tech => (
                            <option key={tech.id} value={tech.id.toString()}>{tech.fullname}</option>
                        ))}
                    </select>
                );
            case 'select_item_type':
                return (
                    <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[160px]"
                    >
                        <option value="">--</option>
                        {ITEM_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs w-40"
                    />
                );
            case 'text':
            default:
                return (
                    <Input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs w-40"
                        placeholder=""
                    />
                );
        }
    };

    // Verificar si el usuario puede eliminar un ticket
    const canDelete = (ticket: Ticket) => {
        if (auth.user.role === 'Administrador') return true;
        if (auth.user.role === 'Técnico') {
            // Técnico puede eliminar tickets donde es el asignado (resolvió) o el solicitante
            return ticket.assigned_user_id === auth.user.id || ticket.requester_user_id === auth.user.id;
        }
        return false;
    };

    // Verificar si el usuario puede editar (Admin y Técnico pueden editar)
    const canEdit = () => {
        return auth.user.role === 'Administrador' || auth.user.role === 'Técnico';
    };

    // Verificar si el usuario puede resolver el ticket (asignado a él o es admin)
    const canResolve = (ticket: Ticket) => {
        if (auth.user.role === 'Administrador') return true;
        // El ticket debe estar asignado a este usuario y no estar cerrado/resuelto
        return ticket.assigned_user_id === auth.user.id && ticket.status !== 5 && ticket.status !== 6;
    };

    // Abrir modal de resolver
    const openSolveDialog = (ticket: Ticket) => {
        setTicketToSolve(ticket);
        setSolution('');
        setSolveError(null);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        setSolveDate(localDateTime);
        setSolveDialogOpen(true);
    };

    // Confirmar resolución
    const confirmSolve = () => {
        if (!ticketToSolve || !solution.trim()) {
            alert('Debe ingresar una solución');
            return;
        }
        if (solveDate && ticketToSolve.date) {
            const solveDateObj = new Date(solveDate);
            const ticketDateObj = new Date(ticketToSolve.date);
            if (solveDateObj < ticketDateObj) {
                setSolveError('La fecha de solución no puede ser anterior a la fecha de creación del caso.');
                return;
            }
        }
        setSolving(true);
        setSolveError(null);
        const formattedDate = solveDate ? solveDate.replace('T', ' ') + ':00' : null;
        router.post(`/dashboard/solve-ticket/${ticketToSolve.id}`, {
            solution: solution.trim(),
            solve_date: formattedDate
        }, {
            preserveState: true,
            onSuccess: (page: any) => {
                setSolving(false);
                if (page.props?.flash?.error) {
                    setSolveError(page.props.flash.error);
                    return;
                }
                setSolveDialogOpen(false);
                setTicketToSolve(null);
                setSolution('');
                setSolveDate('');
            },
            onError: (errors: any) => {
                setSolving(false);
                const errorMsg = typeof errors === 'object' ? Object.values(errors).join(', ') : 'Error al resolver';
                setSolveError(errorMsg);
            },
            onFinish: () => {
                setSolving(false);
            }
        });
    };

    const handleDeleteClick = (ticket: Ticket) => {
        setTicketToDelete(ticket);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (ticketToDelete) {
            router.delete(`/soporte/casos/${ticketToDelete.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setTicketToDelete(null);
                }
            });
        }
    };

    // Build params helper — centralizes all filter state for requests
    const buildFilterParams = (overrides: Record<string, any> = {}): Record<string, any> => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            ...overrides,
        };
        if (filters.search) params.search = filters.search;
        if (filters.filter) params.filter = filters.filter;
        if (filters.exclude_maintenance === '1') params.exclude_maintenance = '1';
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        return params;
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params = buildFilterParams({ sort: field, direction: newDirection });
        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: true
        });
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.visit(url, { preserveScroll: true });
        }
    };

    const handleSearch = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (excludeMaintenance) params.exclude_maintenance = '1';
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        if (filters.filter) params.filter = filters.filter;

        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const handlePerPageChange = (value: string) => {
        const params = buildFilterParams({ per_page: value, page: 1 });
        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: true
        });
    };

    const applyFilters = () => {
        const params: Record<string, any> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1
        };
        if (searchValue) params.search = searchValue;
        if (excludeMaintenance) params.exclude_maintenance = '1';
        if (filterCriteria.length > 0) params.criteria = JSON.stringify(filterCriteria);
        if (filters.filter) params.filter = filters.filter;

        router.get('/soporte/casos', params, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilterCriteria([{ id: generateId(), connector: 'AND', field: 'status', operator: 'is', value: 'notold' }]);
        setSearchValue('');
        setExcludeMaintenance(false);

        router.get('/soporte/casos', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            criteria: JSON.stringify([{ id: generateId(), connector: 'AND', field: 'status', operator: 'is', value: 'notold' }])
        }, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort);
        params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.filter) params.append('filter', filters.filter);
        if (filters.exclude_maintenance === '1') params.append('exclude_maintenance', '1');
        if (filterCriteria.length > 0) params.append('criteria', JSON.stringify(filterCriteria));
        window.location.href = `/soporte/casos/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        return filters.direction === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    // Función para obtener el color del estado
    const getStatusColor = (status: number) => {
        switch (status) {
            case 1: return 'bg-blue-100 text-blue-800'; // Nuevo
            case 2: return 'bg-yellow-100 text-yellow-800'; // En curso (asignado)
            case 3: return 'bg-yellow-100 text-yellow-800'; // En curso (planificado)
            case 4: return 'bg-orange-100 text-orange-800'; // En espera
            case 5: return 'bg-green-100 text-green-800'; // Resuelto
            case 6: return 'bg-gray-100 text-gray-800'; // Cerrado
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title="HelpDesk HUV - Casos" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                            <span className="text-gray-400">/</span>
                            <Link href="/soporte/casos" className="text-gray-600 hover:text-[#2c4370] hover:underline">Soporte</Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Casos</span>
                        </div>
                    }
                />

                <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
                    {/* Banner de filtro especial */}
                    {filters.filter && (
                        <div className="mb-4 bg-[#2c4370] text-white px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm sm:text-base">
                                <Filter className="w-4 h-4 shrink-0" />
                                <span className="font-medium">{getSpecialFilterLabel()}</span>
                                <span className="text-white/70">({tickets.total})</span>
                            </div>
                            <button onClick={clearSpecialFilter} className="flex items-center gap-1 hover:bg-white/20 px-2 py-1 transition-colors text-sm">
                                <X className="w-4 h-4" />
                                <span>Quitar</span>
                            </button>
                        </div>
                    )}

                    <div className="bg-white shadow border border-gray-200">
                        {/* Header */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    {filters.filter ? getSpecialFilterLabel() : 'Casos'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9 flex-1 sm:flex-initial"
                                        onClick={handleExport}
                                    >
                                        <span className="hidden sm:inline">Exportar</span>
                                        <span className="sm:hidden">Excel</span>
                                    </Button>
                                    <Link href="/soporte/crear-caso">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-9 flex-1 sm:flex-initial"
                                        >
                                            <Plus className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Crear Caso</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ============= GLPI-style Filter Bar ============= */}
                        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <div className="space-y-1">
                                {filterCriteria.map((criterion, index) => {
                                    const fieldDef = getFieldDef(criterion.field);
                                    const operators = getOperatorsForField(fieldDef?.type || 'text');
                                    return (
                                        <div key={criterion.id} className="flex items-center gap-1 flex-wrap">
                                            {/* Add/Remove buttons and Connector */}
                                            {index === 0 ? (
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        onClick={addCriterion}
                                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                                                        title="Agregar criterio de búsqueda"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={addGlobalCriterion}
                                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-100 text-[#2c4370] font-bold text-xs"
                                                        title="Agregar criterio de búsqueda global"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => removeCriterion(criterion.id)}
                                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-red-50 text-red-500"
                                                        title="Quitar criterio"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <select
                                                        value={criterion.connector}
                                                        onChange={(e) => updateCriterion(criterion.id, { connector: e.target.value as FilterCriterion['connector'] })}
                                                        className="h-7 text-xs border border-gray-200 rounded px-1 bg-white text-gray-700 min-w-[60px]"
                                                    >
                                                        {CONNECTOR_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Field selector */}
                                            <select
                                                value={criterion.field}
                                                onChange={(e) => updateCriterion(criterion.id, { field: e.target.value })}
                                                className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[140px]"
                                            >
                                                {FILTER_FIELDS.map(f => (
                                                    <option key={f.value} value={f.value}>{f.label}</option>
                                                ))}
                                            </select>

                                            {/* Operator selector */}
                                            <select
                                                value={criterion.operator}
                                                onChange={(e) => updateCriterion(criterion.id, { operator: e.target.value })}
                                                className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[90px]"
                                            >
                                                {operators.map(op => (
                                                    <option key={op.value} value={op.value}>{op.label}</option>
                                                ))}
                                            </select>

                                            {/* Value input/select */}
                                            {renderValueInput(criterion)}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom action bar */}
                            <div className="flex items-center justify-between mt-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={excludeMaintenance}
                                            onChange={(e) => setExcludeMaintenance(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-[#2c4370] focus:ring-[#2c4370] cursor-pointer"
                                        />
                                        <span className="text-[11px] text-gray-600">Excluir Mantenimientos</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        onClick={applyFilters}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-7 text-xs px-4"
                                    >
                                        <Search className="w-3 h-3 mr-1" />
                                        Buscar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                                        title="Restablecer filtros"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">Mostrar</span>
                                <Select
                                    value={filters.per_page.toString()}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
                                        <SelectValue placeholder="15" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">elementos</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                                <span className="font-medium">{tickets.data.length}</span> de{' '}
                                <span className="font-medium">{tickets.total}</span>
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100 w-16"
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center">
                                                ID
                                                {getSortIcon('id')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Título
                                                {getSortIcon('name')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Estado
                                                {getSortIcon('status')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('priority')}
                                        >
                                            <div className="flex items-center">
                                                Prioridad
                                                {getSortIcon('priority')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('entity_name')}
                                        >
                                            <div className="flex items-center">
                                                Entidad
                                                {getSortIcon('entity_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center">
                                                Fecha de apertura
                                                {getSortIcon('date')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('date_mod')}
                                        >
                                            <div className="flex items-center">
                                                Última actualización
                                                {getSortIcon('date_mod')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Solicitante
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Asignado a
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Categoría
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Elemento
                                        </TableHead>
                                        {canEdit() && (
                                            <TableHead className="font-semibold text-gray-900 text-xs text-center w-24">
                                                Acciones
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-gray-50">
                                            <TableCell className="text-xs font-medium">{ticket.id}</TableCell>
                                            <TableCell className="font-medium text-xs">
                                                <button
                                                    onClick={async () => {
                                                        setTicketToView(ticket);
                                                        setTicketSolution(null);
                                                        setViewDialogOpen(true);
                                                        // Fetch solution if case is resolved or closed
                                                        if (ticket.status === 5 || ticket.status === 6) {
                                                            setLoadingSolution(true);
                                                            try {
                                                                const response = await fetch(`/dashboard/ticket/${ticket.id}`);
                                                                if (response.ok) {
                                                                    const data = await response.json();
                                                                    if (data.solution) {
                                                                        setTicketSolution(data.solution);
                                                                    }
                                                                }
                                                            } catch (e) {
                                                                console.error('Error fetching solution:', e);
                                                            } finally {
                                                                setLoadingSolution(false);
                                                            }
                                                        }
                                                    }}
                                                    className="text-[#2c4370] hover:underline block truncate max-w-md text-left"
                                                    title={ticket.name}
                                                >
                                                    {ticket.name || '(Sin título)'}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <span className={`px-2 py-1 text-[10px] font-semibold ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">{ticket.priority_name}</TableCell>
                                            <TableCell className="text-xs">{ticket.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {ticket.date ? new Date(ticket.date).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {ticket.date_mod ? new Date(ticket.date_mod).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.requester_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.assigned_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{ticket.category_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">{ticket.item_name || '-'}</TableCell>
                                            {canEdit() && (
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* Botón Resolver - solo si está asignado al usuario o es admin y no está cerrado */}
                                                        {canResolve(ticket) && ticket.status !== 5 && ticket.status !== 6 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                                                onClick={() => openSolveDialog(ticket)}
                                                                title="Resolver"
                                                            >
                                                                <CheckSquare className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            onClick={() => router.visit(`/soporte/casos/${ticket.id}/editar`)}
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        {canDelete(ticket) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                onClick={() => handleDeleteClick(ticket)}
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {tickets.data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={canEdit() ? 12 : 11} className="text-center py-8 text-gray-500">
                                                No se encontraron casos
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                                Página {tickets.current_page} de {tickets.last_page}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
                                {tickets.links.map((link, index) => {
                                    const isMobileVisible = index === 0 || index === tickets.links.length - 1 || link.active;
                                    if (index === 0) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && handlePageChange(link.url)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === tickets.links.length - 1) {
                                        return (
                                            <Button key={index} variant="outline" size="sm" disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50 h-8 w-8 p-0"
                                                onClick={() => link.url && handlePageChange(link.url)}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button key={index} variant={link.active ? "default" : "outline"} size="sm" disabled={!link.url}
                                            className={`${!isMobileVisible ? 'hidden sm:inline-flex' : ''} h-8 min-w-[32px] px-2 text-xs sm:text-sm ${link.active
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]"
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}`}
                                            onClick={() => link.url && handlePageChange(link.url)}>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>
                <GLPIFooter />
            </div>

            {/* Dialog de confirmación para eliminar */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar Caso</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro que desea eliminar el caso <strong>#{ticketToDelete?.id}</strong>?
                            <br />
                            <span className="text-gray-600">{ticketToDelete?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de visualización del caso */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-[#2c4370]">Caso #{ticketToView?.id}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold ${ticketToView ? getStatusColor(ticketToView.status) : ''}`}>
                                {ticketToView?.status_name}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {ticketToView && (
                        <div className="space-y-4">
                            {/* Título */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">{ticketToView.name}</h3>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Prioridad</span>
                                    <span className="font-medium">{ticketToView.priority_name}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Entidad</span>
                                    <span className="font-medium">{ticketToView.entity_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Fecha de Apertura</span>
                                    <span className="font-medium">
                                        {ticketToView.date ? new Date(ticketToView.date).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Última Actualización</span>
                                    <span className="font-medium">
                                        {ticketToView.date_mod ? new Date(ticketToView.date_mod).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Solicitante</span>
                                    <span className="font-medium">{ticketToView.requester_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2">
                                    <span className="text-gray-500 block">Asignado a</span>
                                    <span className="font-medium">{ticketToView.assigned_name || '-'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 col-span-2">
                                    <span className="text-gray-500 block">Categoría</span>
                                    <span className="font-medium">{ticketToView.category_name || '-'}</span>
                                </div>
                            </div>

                            {/* Solución del caso */}
                            {(ticketToView.status === 5 || ticketToView.status === 6) && (
                                <div className="pt-3 border-t">
                                    <span className="text-xs font-semibold text-green-700 block mb-2">Solución</span>
                                    {loadingSolution ? (
                                        <div className="bg-green-50 p-3 border border-green-200 flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                            <span className="ml-2 text-xs text-green-600">Cargando solución...</span>
                                        </div>
                                    ) : ticketSolution ? (
                                        <div className="bg-green-50 p-3 border border-green-200">
                                            <div className="text-xs text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ticketSolution.content }} />
                                            <div className="mt-2 pt-2 border-t border-green-200 flex items-center justify-between text-[10px] text-green-700">
                                                <span>Resuelto por: <strong>{ticketSolution.solved_by || 'Usuario del sistema'}</strong></span>
                                                <span>{ticketSolution.date_creation ? new Date(ticketSolution.date_creation).toLocaleString('es-CO') : '-'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-3 border border-gray-200 text-xs text-gray-500">
                                            No se encontró solución registrada
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewDialogOpen(false)}
                                    className="h-8 text-xs"
                                >
                                    Cerrar
                                </Button>
                                {/* Botón Resolver en el modal */}
                                {canResolve(ticketToView) && ticketToView.status !== 5 && ticketToView.status !== 6 && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setViewDialogOpen(false);
                                            openSolveDialog(ticketToView);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                                    >
                                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                        Resolver
                                    </Button>
                                )}
                                {canEdit() && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setViewDialogOpen(false);
                                            router.visit(`/soporte/casos/${ticketToView.id}/editar`);
                                        }}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs"
                                    >
                                        Editar Caso
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Resolver Caso */}
            <Dialog open={solveDialogOpen} onOpenChange={setSolveDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-green-600" />
                            Resolver Caso
                        </DialogTitle>
                        <DialogDescription>
                            Resolver el caso <strong>#{ticketToSolve?.id}</strong>: {ticketToSolve?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Mensaje de error */}
                    {solveError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded">
                            {solveError}
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción de la solución <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={solution}
                                onChange={(e) => setSolution(e.target.value)}
                                placeholder="Describe cómo se resolvió el problema..."
                                className="w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px] text-sm"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha y hora de solución
                            </label>
                            <Input
                                type="datetime-local"
                                value={solveDate}
                                onChange={(e) => setSolveDate(e.target.value)}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Por defecto se usa la fecha y hora actual. Puede modificarla si la solución fue en otro momento.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSolveDialogOpen(false);
                                setTicketToSolve(null);
                                setSolution('');
                                setSolveDate('');
                            }}
                            disabled={solving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                console.log('Resolve button clicked');
                                confirmSolve();
                            }}
                            disabled={!solution.trim() || solving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {solving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Resolviendo...
                                </>
                            ) : (
                                <>
                                    <CheckSquare className="h-4 w-4 mr-1" />
                                    Resolver
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
