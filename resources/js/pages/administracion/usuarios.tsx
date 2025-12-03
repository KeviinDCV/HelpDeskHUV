import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X, Plus, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    avatar: string | null;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    filters: {
        per_page: number;
        sort: string;
        direction: string;
        search: string;
        role: string;
        is_active: string;
        date_from: string;
        date_to: string;
    };
    auth: {
        user: User;
    };
}

export default function Usuarios({ users, filters, auth }: UsersProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    
    const [roleFilter, setRoleFilter] = React.useState(filters.role || 'all');
    const [statusFilter, setStatusFilter] = React.useState(filters.is_active || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    
    const hasActiveFilters = (roleFilter && roleFilter !== 'all') || 
                            (statusFilter && statusFilter !== 'all') ||
                            dateFrom || dateTo;
    
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isCreateMode, setIsCreateMode] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [formData, setFormData] = React.useState({
        username: '',
        name: '',
        email: '',
        phone: '',
        role: 'Técnico',
        is_active: true,
        password: '',
        password_confirmation: ''
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = React.useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const params: Record<string, any> = { per_page: filters.per_page, sort: field, direction: newDirection };
        if (filters.search) params.search = filters.search;
        if (filters.role && filters.role !== 'all') params.role = filters.role;
        if (filters.is_active && filters.is_active !== 'all') params.is_active = filters.is_active;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        router.get('/administracion/usuarios', params, { preserveState: false });
    };

    const handleSearch = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
        if (statusFilter && statusFilter !== 'all') params.is_active = statusFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/administracion/usuarios', params, { preserveState: false });
    };

    const applyFilters = () => {
        const params: Record<string, any> = { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 };
        if (searchValue) params.search = searchValue;
        if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
        if (statusFilter && statusFilter !== 'all') params.is_active = statusFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/administracion/usuarios', params, { preserveState: false, replace: true });
    };

    const clearFilters = () => {
        setRoleFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setSearchValue('');
        router.get('/administracion/usuarios', { per_page: filters.per_page, sort: filters.sort, direction: filters.direction, page: 1 }, { preserveState: false, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('sort', filters.sort); params.append('direction', filters.direction);
        if (filters.search) params.append('search', filters.search);
        if (filters.role && filters.role !== 'all') params.append('role', filters.role);
        if (filters.is_active && filters.is_active !== 'all') params.append('is_active', filters.is_active);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        window.location.href = `/administracion/usuarios/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        }
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    const handleToggleActive = (e: React.MouseEvent, userId: number) => {
        e.stopPropagation(); // Evitar que se dispare el doble clic de la fila
        router.post(`/administracion/usuarios/${userId}/toggle-active`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleOpenCreateModal = () => {
        setIsCreateMode(true);
        setEditingUser(null);
        setFormData({
            username: '',
            name: '',
            email: '',
            phone: '',
            role: 'Técnico',
            is_active: true,
            password: '',
            password_confirmation: ''
        });
        setFormErrors({});
        setShowPassword(false);
        setShowPasswordConfirm(false);
        setIsModalOpen(true);
    };

    const handleRowDoubleClick = (user: User) => {
        // Solo administradores pueden editar
        if (auth.user.role !== 'Administrador') {
            return;
        }

        setIsCreateMode(false);
        setEditingUser(user);
        setFormData({
            username: user.username,
            name: user.name,
            email: user.email,
            phone: '',
            role: user.role,
            is_active: user.is_active,
            password: '',
            password_confirmation: ''
        });
        setFormErrors({});
        setShowPassword(false);
        setShowPasswordConfirm(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsCreateMode(false);
        setEditingUser(null);
        setFormData({
            username: '',
            name: '',
            email: '',
            phone: '',
            role: 'Técnico',
            is_active: true,
            password: '',
            password_confirmation: ''
        });
        setFormErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        if (isCreateMode) {
            // Crear nuevo usuario
            router.post('/administracion/usuarios', formData, {
                preserveScroll: true,
                onSuccess: () => {
                    handleCloseModal();
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                    setIsSubmitting(false);
                },
            });
        } else if (editingUser) {
            // Editar usuario existente
            router.put(`/administracion/usuarios/${editingUser.id}`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    handleCloseModal();
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setFormErrors(errors as Record<string, string>);
                    setIsSubmitting(false);
                },
            });
        }
    };

    return (
        <>
            <Head title="Usuarios - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/administracion/usuarios" className="text-gray-600 hover:text-[#2c4370] hover:underline">Administración</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Usuarios</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Input type="text" placeholder="Buscar..." className="w-64 pr-10 h-9" value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                                        <Button size="sm" variant="ghost" className="absolute right-0 top-0 h-full px-3" onClick={handleSearch}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                        className={`h-9 ${hasActiveFilters ? 'border-[#2c4370] text-[#2c4370]' : ''}`}>
                                        <Filter className="h-4 w-4 mr-1" /> Filtros
                                        {hasActiveFilters && <span className="ml-1 bg-[#2c4370] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
                                    </Button>
                                    {auth.user.role === 'Administrador' && (
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={handleOpenCreateModal}>
                                            <Plus className="h-4 w-4 mr-1" />Crear
                                        </Button>
                                    )}
                                    <Button size="sm" className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-9" onClick={handleExport}>Exportar</Button>
                                </div>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="px-6 py-4 bg-gray-50 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Rol</label>
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="Administrador">Administrador</SelectItem>
                                                <SelectItem value="Técnico">Técnico</SelectItem>
                                                <SelectItem value="Usuario">Usuario</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Estado</label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="1">Activo</SelectItem>
                                                <SelectItem value="0">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Desde</label>
                                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Hasta</label>
                                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-600">
                                            <X className="h-3 w-3 mr-1" /> Limpiar filtros
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={applyFilters} className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-8 text-xs">Aplicar filtros</Button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Mostrar</span>
                                <Select 
                                    value={filters.per_page.toString()}
                                    onValueChange={(value) => {
                                        router.get('/administracion/usuarios', { 
                                            per_page: value,
                                            sort: filters.sort,
                                            direction: filters.direction,
                                            search: filters.search
                                        }, { preserveState: false })
                                    }}
                                >
                                    <SelectTrigger className="w-20 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-gray-600">elementos</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Mostrando <span className="font-medium">{users.data.length}</span> de{' '}
                                <span className="font-medium">{users.total}</span> usuarios
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
                                            onClick={() => handleSort('username')}
                                        >
                                            <div className="flex items-center">
                                                Usuario
                                                {getSortIcon('username')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Nombre Completo
                                                {getSortIcon('name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('email')}
                                        >
                                            <div className="flex items-center">
                                                Email
                                                {getSortIcon('email')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('role')}
                                        >
                                            <div className="flex items-center">
                                                Rol
                                                {getSortIcon('role')}
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-900 text-xs">
                                            Activo
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <div className="flex items-center">
                                                Fecha de Creación
                                                {getSortIcon('created_at')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user, index) => (
                                        <TableRow 
                                            key={`${user.id}-${index}`} 
                                            className={`hover:bg-gray-50 ${auth.user.role === 'Administrador' ? 'cursor-pointer' : ''}`}
                                            onDoubleClick={() => handleRowDoubleClick(user)}
                                        >
                                            <TableCell className="text-xs font-medium">{user.id}</TableCell>
                                            <TableCell className="font-medium text-xs text-[#2c4370]">
                                                {user.username || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex items-center gap-2">
                                                    {user.avatar ? (
                                                        <img 
                                                            src={`/storage/${user.avatar}`} 
                                                            alt={user.name} 
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    {user.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">{user.email || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                                    user.role === 'Administrador' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : user.role === 'Técnico'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-6 px-3 text-[10px] font-semibold rounded-full transition-colors duration-200 ${
                                                        user.is_active 
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800' 
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
                                                    }`}
                                                    onClick={(e) => handleToggleActive(e, user.id)}
                                                >
                                                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                                        user.is_active ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página {users.current_page} de {users.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                {users.links.map((link, index) => {
                                    // Primer botón = Previous
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    // Último botón = Next
                                    if (index === users.links.length - 1) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white disabled:opacity-50"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    // Botones de números
                                    return (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            className={link.active 
                                                ? "bg-[#2c4370] hover:!bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:!bg-[#2c4370] hover:!text-white"}
                                            onClick={() => link.url && router.visit(link.url)}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            {/* Modal de Creación/Edición */}
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{isCreateMode ? 'Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
                            <DialogDescription>
                                {isCreateMode 
                                    ? 'Completa la información para crear un nuevo usuario. Los campos con * son obligatorios.'
                                    : 'Modifica los datos del usuario. Los campos con * son obligatorios.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Usuario *</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        placeholder="ej: jperez"
                                        required
                                    />
                                    {formErrors.username && <p className="text-xs text-red-600">{formErrors.username}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="role">Rol *</Label>
                                    <Select 
                                        value={formData.role} 
                                        onValueChange={(value) => setFormData({...formData, role: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Administrador">Administrador</SelectItem>
                                            <SelectItem value="Técnico">Técnico</SelectItem>
                                            <SelectItem value="Usuario">Usuario</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formErrors.role && <p className="text-xs text-red-600">{formErrors.role}</p>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre Completo *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="ej: Juan Pérez García"
                                    required
                                />
                                {formErrors.name && <p className="text-xs text-red-600">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="ej: jperez@huv.gov.co"
                                        required
                                    />
                                    {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        placeholder="ej: 3001234567"
                                    />
                                    {formErrors.phone && <p className="text-xs text-red-600">{formErrors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="is_active">Estado</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className={`text-sm font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {formData.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-600 mb-3 font-medium">
                                    {isCreateMode ? 'Contraseña *' : 'Cambiar Contraseña (opcional)'}
                                </p>
                                
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{isCreateMode ? 'Contraseña' : 'Nueva Contraseña'}</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                placeholder={isCreateMode ? 'Mínimo 8 caracteres' : 'Dejar en blanco para mantener la actual'}
                                                required={isCreateMode}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {formErrors.password && <p className="text-xs text-red-600">{formErrors.password}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showPasswordConfirm ? 'text' : 'password'}
                                                value={formData.password_confirmation}
                                                onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                                placeholder="Repite la contraseña"
                                                required={isCreateMode}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {formErrors.password_confirmation && <p className="text-xs text-red-600">{formErrors.password_confirmation}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#2c4370] hover:bg-[#3d5583] text-white" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : (isCreateMode ? 'Crear Usuario' : 'Guardar Cambios')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
