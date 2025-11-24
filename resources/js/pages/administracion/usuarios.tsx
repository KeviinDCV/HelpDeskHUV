import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    };
}

export default function Usuarios({ users, filters }: UsersProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/administracion/usuarios', {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection,
            search: filters.search
        }, { preserveState: false });
    };

    const handleSearch = () => {
        router.get('/administracion/usuarios', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            search: searchValue
        }, { preserveState: false });
    };

    const handleExport = () => {
        window.location.href = `/administracion/usuarios/export?search=${filters.search}&sort=${filters.sort}&direction=${filters.direction}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        }
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    const handleToggleActive = (userId: number) => {
        router.post(`/administracion/usuarios/${userId}/toggle-active`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <>
            <Head title="Usuarios - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Administración</span>
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
                                        <Input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-64 pr-10"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={handleSearch}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button 
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white"
                                        onClick={handleExport}
                                    >
                                        Exportar
                                    </Button>
                                </div>
                            </div>
                        </div>

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
                                        <TableRow key={`${user.id}-${index}`} className="hover:bg-gray-50">
                                            <TableCell className="text-xs font-medium">{user.id}</TableCell>
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/administracion/usuarios/${user.id}`} className="text-[#2c4370] hover:underline">
                                                    {user.username || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{user.name || '-'}</TableCell>
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
                                                    variant={user.is_active ? "default" : "outline"}
                                                    className={`h-7 text-[10px] ${
                                                        user.is_active 
                                                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                            : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                                                    }`}
                                                    onClick={() => handleToggleActive(user.id)}
                                                >
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
        </>
    );
}
