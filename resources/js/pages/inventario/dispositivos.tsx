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

interface Peripheral {
    id: number;
    name: string;
    entity_name: string;
    manufacturers_id: number;
    locations_id: number;
    peripheraltypes_id: number;
    peripheralmodels_id: number;
    date_mod: string;
    otherserial: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PeripheralsProps {
    peripherals: {
        data: Peripheral[];
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

export default function Dispositivos({ peripherals, filters }: PeripheralsProps) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventario/dispositivos', {
            per_page: filters.per_page,
            sort: field,
            direction: newDirection,
            search: filters.search
        }, { preserveState: false });
    };

    const handleSearch = () => {
        router.get('/inventario/dispositivos', {
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
        window.location.href = `/inventario/dispositivos/export?${params}`;
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
            <Head title="HelpDesk HUV - Dispositivos" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader 
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Inicio</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Inventario</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Dispositivos</span>
                        </div>
                    }
                />

                <main className="flex-1 px-6 py-6">
                    <div className="bg-white rounded-lg shadow">
                        {/* Header */}
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-gray-900">Dispositivos</h1>
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
                                        router.get('/inventario/dispositivos', { 
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
                                Mostrando <span className="font-medium">{peripherals.data.length}</span> de{' '}
                                <span className="font-medium">{peripherals.total}</span> dispositivos
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
                                            onClick={() => handleSort('manufacturers_id')}
                                        >
                                            <div className="flex items-center">
                                                Fabricante
                                                {getSortIcon('manufacturers_id')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('locations_id')}
                                        >
                                            <div className="flex items-center">
                                                Localización
                                                {getSortIcon('locations_id')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('peripheraltypes_id')}
                                        >
                                            <div className="flex items-center">
                                                Tipo
                                                {getSortIcon('peripheraltypes_id')}
                                            </div>
                                        </TableHead>
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('peripheralmodels_id')}
                                        >
                                            <div className="flex items-center">
                                                Modelo
                                                {getSortIcon('peripheralmodels_id')}
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
                                        <TableHead 
                                            className="font-semibold text-gray-900 text-xs cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort('otherserial')}
                                        >
                                            <div className="flex items-center">
                                                Nombre de usuario alternativo
                                                {getSortIcon('otherserial')}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {peripherals.data.map((peripheral) => (
                                        <TableRow key={peripheral.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-xs">
                                                <a href={`/inventario/dispositivos/${peripheral.id}`} className="text-[#2c4370] hover:underline">
                                                    {peripheral.name || '-'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{peripheral.entity_name || '-'}</TableCell>
                                            <TableCell className="text-xs">{peripheral.manufacturers_id || '-'}</TableCell>
                                            <TableCell className="text-xs">{peripheral.locations_id || '-'}</TableCell>
                                            <TableCell className="text-xs">{peripheral.peripheraltypes_id || '-'}</TableCell>
                                            <TableCell className="text-xs">{peripheral.peripheralmodels_id || '-'}</TableCell>
                                            <TableCell className="text-xs">
                                                {peripheral.date_mod ? new Date(peripheral.date_mod).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">{peripheral.otherserial || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Página <span className="font-medium">{peripherals.current_page}</span> de{' '}
                                <span className="font-medium">{peripherals.last_page}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {peripherals.links.map((link: PaginationLinks, index: number) => {
                                    if (link.label === '&laquo; Previous') {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:bg-[#2c4370] hover:text-white"
                                                onClick={() => link.url && router.visit(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (link.label === 'Next &raquo;') {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                className="border-[#2c4370] text-[#2c4370] hover:bg-[#2c4370] hover:text-white"
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
                                                ? "bg-[#2c4370] hover:bg-[#3d5583] text-white border-[#2c4370]" 
                                                : "border-[#2c4370] text-[#2c4370] hover:bg-[#2c4370] hover:text-white"}
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
