import {
    DataTableEmpty,
    DataTableFilters,
    DataTablePagination,
    DataTableToolbar,
    FilterLabel,
    SortableHead,
    type Paginator,
} from '@/components/data-table';
import { FlashBanner } from '@/components/flash-banner';
import { FormField } from '@/components/form-field';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { btn, fieldClass, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, EyeOff, Loader2, Pencil, Plus } from 'lucide-react';
import React from 'react';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    avatar: string | null;
}

interface UsersProps {
    users: Paginator & { data: User[] };
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

const ROLES = ['Administrador', 'Técnico', 'Usuario'];

// Mismos colores que ya distinguían los roles (morado, azul, gris), en el formato de chip del rediseño.
const ROL_PILL: Record<string, string> = {
    Administrador: 'bg-purple-50 text-purple-700 ring-purple-600/15',
    Técnico: 'bg-blue-50 text-blue-700 ring-blue-600/15',
};

const FORM_VACIO = {
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'Técnico',
    is_active: true,
    password: '',
    password_confirmation: '',
};

function iniciales(nombre: string): string {
    return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function Avatar({ user }: { user: User }) {
    return user.avatar ? (
        <img src={`/storage/${user.avatar}`} alt="" className="size-8 shrink-0 rounded-full object-cover" />
    ) : (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-huv-soft text-xs font-semibold text-huv-ink">
            {iniciales(user.name || user.username)}
        </span>
    );
}

export default function Usuarios({ users, filters, auth }: UsersProps) {
    const esAdmin = auth.user.role === 'Administrador';

    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [showFilters, setShowFilters] = React.useState(false);
    const [roleFilter, setRoleFilter] = React.useState(filters.role || 'all');
    const [statusFilter, setStatusFilter] = React.useState(filters.is_active || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');

    const filtrosActivos = [roleFilter !== 'all', statusFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [formData, setFormData] = React.useState(FORM_VACIO);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [visibles, setVisibles] = React.useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const isCreateMode = editingUser === null;
    const editandoseASiMismo = editingUser?.id === auth.user.id;

    /**
     * Parámetros de la URL desde el estado actual de la página (búsqueda y panel de filtros).
     * Ordenar, cambiar filas por página y exportar parten de aquí, así que ninguno descarta
     * los filtros que los demás tienen puestos.
     */
    const buildParams = (overrides: Record<string, string | number | undefined> = {}) => {
        const params: Record<string, string | number | undefined> = {
            per_page: filters.per_page,
            sort: filters.sort,
            direction: filters.direction,
            page: 1,
            search: searchValue || undefined,
            role: roleFilter !== 'all' ? roleFilter : undefined,
            is_active: statusFilter !== 'all' ? statusFilter : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            ...overrides,
        };
        return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string | number>;
    };

    const go = (params: Record<string, string | number>) => router.get('/administracion/usuarios', params, { preserveState: false });

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        go(buildParams({ sort: field, direction }));
    };

    const clearFilters = () => {
        setRoleFilter('all');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        go(buildParams({ role: undefined, is_active: undefined, date_from: undefined, date_to: undefined }));
    };

    const handleExport = () => {
        // Exporta lo filtrado, sin paginar.
        const params = buildParams();
        delete params.page;
        delete params.per_page;
        window.location.href = `/administracion/usuarios/export?${new URLSearchParams(params as Record<string, string>)}`;
    };

    const handleToggleActive = (user: User) => {
        router.post(`/administracion/usuarios/${user.id}/toggle-active`, {}, { preserveScroll: true, preserveState: true });
    };

    const abrirModal = (user: User | null) => {
        setEditingUser(user);
        setFormData(
            user
                ? { ...FORM_VACIO, username: user.username, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, is_active: user.is_active }
                : FORM_VACIO,
        );
        setFormErrors({});
        setVisibles({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                setIsSubmitting(false);
            },
            onError: (errors: Record<string, string>) => {
                setFormErrors(errors);
                setIsSubmitting(false);
            },
        };

        if (editingUser) {
            router.put(`/administracion/usuarios/${editingUser.id}`, formData, opciones);
        } else {
            router.post('/administracion/usuarios', formData, opciones);
        }
    };

    const campoPassword = (id: 'password' | 'password_confirmation', etiqueta: string, hint?: string) => (
        <FormField id={id} label={etiqueta} error={formErrors[id]} hint={hint}>
            {(control) => (
                <div className="relative">
                    <input
                        {...control}
                        type={visibles[id] ? 'text' : 'password'}
                        value={formData[id]}
                        onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                        autoComplete="new-password"
                        required={isCreateMode}
                        className={cn(fieldClass, 'password-own-toggle pr-10')}
                    />
                    <button
                        type="button"
                        onClick={() => setVisibles((v) => ({ ...v, [id]: !v[id] }))}
                        aria-label="Mostrar contraseña"
                        aria-pressed={!!visibles[id]}
                        aria-controls={id}
                        className="focus-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-400 hover:text-gray-700"
                    >
                        {visibles[id] ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </button>
                </div>
            )}
        </FormField>
    );

    const columnas = esAdmin ? 8 : 7;

    return (
        <>
            <Head title="Usuarios - HelpDesk HUV" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">Administración</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Usuarios</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Usuarios"
                            description="Cuentas con acceso a la mesa de ayuda y su rol."
                            actions={
                                <>
                                    <button type="button" onClick={handleExport} className={btn.secondary}>
                                        <Download aria-hidden="true" />
                                        Exportar
                                    </button>
                                    {esAdmin && (
                                        <button type="button" onClick={() => abrirModal(null)} className={btn.primary}>
                                            <Plus aria-hidden="true" />
                                            Crear usuario
                                        </button>
                                    )}
                                </>
                            }
                        />

                        <FlashBanner />

                        <section aria-label="Lista de usuarios" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar por nombre, usuario o correo…"
                                filtersOpen={showFilters}
                                onToggleFilters={() => setShowFilters((v) => !v)}
                                activeFilters={filtrosActivos}
                                summary={`${users.total.toLocaleString('es-CO')} usuarios`}
                            />

                            {showFilters && (
                                <DataTableFilters onApply={() => go(buildParams())} onClear={clearFilters} canClear={filtrosActivos > 0}>
                                    <div>
                                        <FilterLabel htmlFor="filtro-rol">Rol</FilterLabel>
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger id="filtro-rol" className={cn(selectTriggerClass, 'h-9')}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {ROLES.map((r) => (
                                                    <SelectItem key={r} value={r}>
                                                        {r}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-estado">Estado</FilterLabel>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="filtro-estado" className={cn(selectTriggerClass, 'h-9')}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="1">Activos</SelectItem>
                                                <SelectItem value="0">Inactivos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-desde">Creado desde</FilterLabel>
                                        <input id="filtro-desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                    <div>
                                        <FilterLabel htmlFor="filtro-hasta">Creado hasta</FilterLabel>
                                        <input id="filtro-hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={cn(fieldClass, 'h-9')} />
                                    </div>
                                </DataTableFilters>
                            )}

                            {/* Pocas columnas: aquí cabe más aire horizontal que en las tablas de inventario. */}
                            <Table className="[&_td]:px-3 [&_th]:px-3">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <SortableHead field="id" label="ID" sort={filters.sort} direction={filters.direction} onSort={handleSort} className="w-16" />
                                        <SortableHead field="name" label="Nombre" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        <SortableHead field="username" label="Usuario" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        <SortableHead field="email" label="Correo" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        <SortableHead field="role" label="Rol" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        <SortableHead field="is_active" label="Estado" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        <SortableHead field="created_at" label="Creado" sort={filters.sort} direction={filters.direction} onSort={handleSort} />
                                        {esAdmin && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.length === 0 ? (
                                        <DataTableEmpty
                                            colSpan={columnas}
                                            title="No hay usuarios que coincidan"
                                            description="Prueba con otra búsqueda o quita alguno de los filtros."
                                            action={
                                                filtrosActivos > 0 || filters.search ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchValue('');
                                                            clearFilters();
                                                        }}
                                                        className={btn.secondary}
                                                    >
                                                        Limpiar búsqueda y filtros
                                                    </button>
                                                ) : undefined
                                            }
                                        />
                                    ) : (
                                        users.data.map((user) => {
                                            const esYo = user.id === auth.user.id;
                                            return (
                                                <TableRow
                                                    key={user.id}
                                                    // El doble clic se mantiene como atajo; "Editar" es la vía visible y accesible por teclado.
                                                    onDoubleClick={esAdmin ? () => abrirModal(user) : undefined}
                                                >
                                                    <TableCell className="text-xs tabular-nums text-gray-500">{user.id}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar user={user} />
                                                            <span className="font-medium text-gray-900">
                                                                {user.name || '—'}
                                                                {esYo && <span className="ml-2 text-xs font-normal text-gray-500">(tú)</span>}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{user.username || '—'}</TableCell>
                                                    <TableCell className="text-gray-600">{user.email || '—'}</TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                                                ROL_PILL[user.role] ?? 'bg-gray-100 text-gray-700 ring-gray-500/15',
                                                            )}
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {esAdmin ? (
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={user.is_active}
                                                                    onCheckedChange={() => handleToggleActive(user)}
                                                                    disabled={esYo}
                                                                    aria-label={`Cuenta activa: ${user.name || user.username}`}
                                                                    title={esYo ? 'No puedes desactivar tu propia cuenta' : undefined}
                                                                />
                                                                <span className={cn('text-xs', user.is_active ? 'text-gray-700' : 'text-gray-500')}>
                                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                                                                <span aria-hidden="true" className={cn('size-1.5 rounded-full', user.is_active ? 'bg-green-600' : 'bg-gray-400')} />
                                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">
                                                        {user.created_at ? (
                                                            <time
                                                                dateTime={user.created_at}
                                                                title={new Date(user.created_at).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}
                                                            >
                                                                {new Date(user.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </time>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </TableCell>
                                                    {esAdmin && (
                                                        <TableCell className="text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirModal(user)}
                                                                aria-label={`Editar a ${user.name || user.username}`}
                                                                className={cn(btn.ghost, 'h-8 px-2.5')}
                                                            >
                                                                <Pencil aria-hidden="true" />
                                                                Editar
                                                            </button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={users}
                                count={users.data.length}
                                noun="usuarios"
                                onPerPageChange={(value) => go(buildParams({ per_page: value }))}
                            />
                        </section>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            {/* Modal de creación / edición */}
            <Dialog open={isModalOpen} onOpenChange={(abierto) => !abierto && handleCloseModal()}>
                <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[560px]">
                    <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
                        <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                            <DialogTitle className="text-lg font-semibold text-gray-900">{isCreateMode ? 'Crear usuario' : 'Editar usuario'}</DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">
                                {isCreateMode ? 'La persona entra con el usuario y la contraseña que definas aquí.' : `Cambios a la cuenta de ${editingUser?.name}.`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 overflow-y-auto px-6 py-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <FormField id="username" label="Usuario" error={formErrors.username}>
                                    {(control) => (
                                        <input
                                            {...control}
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Ej.: jperez"
                                            autoComplete="off"
                                            required
                                            className={fieldClass}
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    id="role"
                                    label="Rol"
                                    error={formErrors.role}
                                    hint={editandoseASiMismo ? 'No puedes quitarte el rol de administrador.' : undefined}
                                >
                                    {(control) => (
                                        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={editandoseASiMismo}>
                                            <SelectTrigger {...control} className={selectTriggerClass}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map((r) => (
                                                    <SelectItem key={r} value={r}>
                                                        {r}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </FormField>
                            </div>

                            <FormField id="name" label="Nombre completo" error={formErrors.name}>
                                {(control) => (
                                    <input
                                        {...control}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej.: Juan Pérez García"
                                        autoComplete="off"
                                        required
                                        className={fieldClass}
                                    />
                                )}
                            </FormField>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <FormField id="email" label="Correo electrónico" error={formErrors.email}>
                                    {(control) => (
                                        <input
                                            {...control}
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Ej.: jperez@huv.gov.co"
                                            autoComplete="off"
                                            required
                                            className={fieldClass}
                                        />
                                    )}
                                </FormField>
                                <FormField id="phone" label="Teléfono" error={formErrors.phone} optional>
                                    {(control) => (
                                        <input
                                            {...control}
                                            type="tel"
                                            inputMode="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Ej.: 3001234567"
                                            maxLength={20}
                                            className={fieldClass}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <div>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                                        disabled={editandoseASiMismo}
                                        aria-describedby={formErrors.is_active ? 'is_active-error' : undefined}
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                        Cuenta activa
                                    </label>
                                    <span className="text-sm text-gray-500">{formData.is_active ? '— puede iniciar sesión' : '— no puede iniciar sesión'}</span>
                                </div>
                                {formErrors.is_active && (
                                    <p id="is_active-error" className="mt-1.5 text-sm text-red-600">
                                        {formErrors.is_active}
                                    </p>
                                )}
                            </div>

                            <fieldset className="space-y-4 border-t pt-5">
                                <legend className="sr-only">Contraseña</legend>
                                <p className="text-sm font-medium text-gray-900">
                                    {isCreateMode ? 'Contraseña' : 'Cambiar contraseña'}
                                    {!isCreateMode && <span className="ml-2 text-xs font-normal text-gray-500">Déjala en blanco para mantener la actual</span>}
                                </p>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {campoPassword('password', isCreateMode ? 'Contraseña' : 'Nueva contraseña', 'Mínimo 8 caracteres.')}
                                    {campoPassword('password_confirmation', 'Confirmar contraseña')}
                                </div>
                            </fieldset>
                        </div>

                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                            <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className={btn.secondary}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className={btn.primary}>
                                {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                                {isSubmitting ? 'Guardando…' : isCreateMode ? 'Crear usuario' : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
