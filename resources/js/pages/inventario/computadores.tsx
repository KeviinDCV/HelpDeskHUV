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

interface Computer {
    id: number;
    name: string;
    entity_name: string | null;
    state_name: string | null;
    manufacturer_name: string | null;
    serial: string | null;
    type_name: string | null;
    model_name: string | null;
    location_name: string | null;
    date_mod: string | null;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface ComputersProps {
    computers: {
        data: Computer[];
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

export default function Computadores({ computers, filters }: ComputersProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventario/computadores', {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection,
            search: filters.search
        }, { preserveState: false });
    };

    const handleSearch = () => {
        router.get('/inventario/computadores', {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            search: searchValue
        }, { preserveState: false });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            sort: filters.sort,
            direction: filters.direction,
            search: filters.search
        });
        window.location.href = `/inventario/computadores/export?${params}`;
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
        }
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-[#2c4370]" />
            : <ArrowDown className="h-3 w-3 ml-1 text-[#2c4370]" />;
    };

    return (
        <>
            <Head title="HelpDesk HUV - Computadores" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Inventario</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Computadores</span>
                        </div>
                    }
                />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Computadores</h1>
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
                                        router.get('/inventario/computadores', { 
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
                                Mostrando <span className="font-medium">{computers.data.length}</span> de{' '}
                                <span className="font-medium">{computers.total}</span> computadores
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Nombre
                                                {getSortIcon('name')}
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
                                            onClick={() => handleSort('state_name')}
                                        >
                                            <div className="flex items-center">
                                                Estado
                                                {getSortIcon('state_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('manufacturer_name')}
                                        >
                                            <div className="flex items-center">
                                                Fabricante
                                                {getSortIcon('manufacturer_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('serial')}
                                        >
                                            <div className="flex items-center">
                                                Número de serie
                                                {getSortIcon('serial')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('type_name')}
                                        >
                                            <div className="flex items-center">
                                                Tipo
                                                {getSortIcon('type_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('model_name')}
                                        >
                                            <div className="flex items-center">
                                                Modelo
                                                {getSortIcon('model_name')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('location_name')}
                                        >
                                            <div className="flex items-center">
                                                Localización
                                                {getSortIcon('location_name')}
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {computers.data.map((computer) => (
                                        <TableRow key={computer.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/computadores/${computer.id}`} className="text-[#2c4370] hover:underline">
                                                    {computer.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{computer.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.state_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.manufacturer_name || '-'}</TableCell>
                                            <TableCell className="font-mono text-xs">{computer.serial || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.type_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.model_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{computer.location_name || '-'}</TableCell>
                                            <TableCell className="text-xs text-gray-600">
                                                {computer.date_mod 
                                                    ? new Date(computer.date_mod).toLocaleDateString('es-CO', { 
                                                        year: 'numeric', 
                                                        month: '2-digit', 
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : '-'
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página {computers.current_page} de {computers.last_page}
                            </div>
                            <div className="flex items-center gap-2">
                                {computers.links.map((link, index) => {
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
                                    if (index === computers.links.length - 1) {
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
