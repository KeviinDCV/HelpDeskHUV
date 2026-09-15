import { DataTableEmpty, DataTablePagination, DataTableToolbar, type Paginator } from '@/components/data-table';
import { FlashBanner } from '@/components/flash-banner';
import { FormField } from '@/components/form-field';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { btn, fieldClass, selectTriggerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, Copy, Loader2, Plus, Power, Trash2 } from 'lucide-react';
import React from 'react';

interface AgentTokenRow {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
    user_id: number | null;
    user_username: string | null;
    user_name: string | null;
    device_id: number | null;
    hardware_uuid: string | null;
    computer_id: number | null;
    hostname: string | null;
    serial: string | null;
    windows_username: string | null;
    device_status: 'active' | 'disabled' | 'pending' | null;
    last_seen_at: string | null;
    last_ip: string | null;
    agent_version: string | null;
    sync_count: number | null;
}

interface UserOption {
    id: number;
    username: string;
    name: string;
    role: string;
}

interface Props {
    tokens: Paginator & { data: AgentTokenRow[] };
    users: UserOption[];
    filters: { per_page: number; search: string };
    flash: {
        plain_token: string | null;
        token_meta: { id: number; name: string; user: string; expires_at: string | null } | null;
        success?: string | null;
        error?: string | null;
    };
    auth: { user: { id: number; username: string; role: string } };
}

function formatDate(value: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ESTADO_EQUIPO: Record<string, { texto: string; punto: string }> = {
    active: { texto: 'Activo', punto: 'bg-green-600' },
    disabled: { texto: 'Deshabilitado', punto: 'bg-red-500' },
    pending: { texto: 'Pendiente', punto: 'bg-yellow-500' },
};

function EstadoEquipo({ status }: { status: AgentTokenRow['device_status'] }) {
    if (!status) return <span className="text-xs text-gray-500">Sin equipo</span>;
    const e = ESTADO_EQUIPO[status];
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', e.punto)} />
            {e.texto}
        </span>
    );
}

export default function AgenteTokens({ tokens, users, filters, flash, auth }: Props) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [revokeTarget, setRevokeTarget] = React.useState<AgentTokenRow | null>(null);
    const [formData, setFormData] = React.useState({ user_id: '', name: '', days: '0' });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [revoking, setRevoking] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    // Modal automático cuando llega un plain_token recién emitido
    const [showNewTokenModal, setShowNewTokenModal] = React.useState(!!flash.plain_token);

    const isAdmin = auth?.user?.role === 'Administrador';

    const go = (params: Record<string, string | number>) => router.get('/administracion/agente-tokens', params, { preserveState: false, replace: true });
    const buildParams = (overrides: Record<string, string | number> = {}) => {
        const params: Record<string, string | number> = { per_page: filters.per_page, page: 1, ...overrides };
        if (searchValue) params.search = searchValue;
        return params;
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        if (!formData.user_id) {
            setFormErrors({ user_id: 'Selecciona un usuario.' });
            return;
        }
        if (!formData.name.trim()) {
            setFormErrors({ name: 'El nombre es obligatorio.' });
            return;
        }
        setSubmitting(true);
        router.post(
            '/administracion/agente-tokens',
            { user_id: Number(formData.user_id), name: formData.name.trim(), days: Number(formData.days || 0) },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setFormData({ user_id: '', name: '', days: '0' });
                },
                onError: (errs) => setFormErrors(errs as Record<string, string>),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleRevoke = () => {
        if (!revokeTarget) return;
        setRevoking(true);
        router.delete(`/administracion/agente-tokens/${revokeTarget.id}`, {
            onSuccess: () => setRevokeTarget(null),
            onFinish: () => setRevoking(false),
        });
    };

    const handleToggleDevice = (deviceId: number) => {
        router.post(`/administracion/agente-dispositivos/${deviceId}/toggle`, {}, { preserveScroll: true });
    };

    const handleCopy = async () => {
        if (!flash.plain_token) return;
        try {
            await navigator.clipboard.writeText(flash.plain_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* sin permiso de portapapeles: el token sigue visible para copiarlo a mano */
        }
    };

    const columnas = isAdmin ? 8 : 7;

    return (
        <>
            <Head title="Tokens del agente - HelpDesk HUV" />
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
                            <span className="font-medium text-gray-900">Tokens del agente</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
                        <PageHeader
                            title="Tokens del agente"
                            description="Credenciales con las que cada PC reporta su inventario al HelpDesk."
                            actions={
                                isAdmin && (
                                    <button type="button" onClick={() => setIsCreateOpen(true)} className={btn.primary}>
                                        <Plus aria-hidden="true" />
                                        Emitir token
                                    </button>
                                )
                            }
                        />

                        <FlashBanner />

                        {flash.plain_token && !showNewTokenModal && (
                            <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-inset ring-green-600/20">
                                <CheckCircle2 className="size-5 shrink-0 text-green-700" aria-hidden="true" />
                                <p className="flex-1 text-sm text-green-800">Token emitido. Puedes volver a verlo hasta que salgas de esta página.</p>
                                <button type="button" onClick={() => setShowNewTokenModal(true)} className={cn(btn.secondary, 'h-8 px-3')}>
                                    Ver token
                                </button>
                            </div>
                        )}

                        <section aria-label="Lista de tokens" className="surface-card overflow-hidden">
                            <DataTableToolbar
                                search={searchValue}
                                onSearchChange={setSearchValue}
                                onSearch={() => go(buildParams())}
                                placeholder="Buscar por nombre, usuario, equipo, UUID o serial…"
                                summary={`${tokens.total.toLocaleString('es-CO')} tokens`}
                            >
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchValue('');
                                            go({ per_page: filters.per_page, page: 1 });
                                        }}
                                        className={cn(btn.ghost, 'h-9')}
                                    >
                                        Limpiar búsqueda
                                    </button>
                                )}
                            </DataTableToolbar>

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Token</TableHead>
                                        <TableHead>Emitido para</TableHead>
                                        <TableHead>Equipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Última actividad</TableHead>
                                        <TableHead className="text-right">Sincronizaciones</TableHead>
                                        <TableHead>Expira</TableHead>
                                        {isAdmin && (
                                            <TableHead className="text-right">
                                                <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tokens.data.length === 0 ? (
                                        <DataTableEmpty
                                            colSpan={columnas}
                                            title={filters.search ? 'Ningún token coincide con la búsqueda' : 'Todavía no hay tokens emitidos'}
                                            description={filters.search ? 'Prueba con otro nombre, equipo o serial.' : isAdmin ? 'Emite el primero con «Emitir token».' : undefined}
                                        />
                                    ) : (
                                        tokens.data.map((t) => {
                                            const activo = t.device_status === 'active';
                                            return (
                                                <TableRow key={t.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900">{t.name}</div>
                                                        <div className="text-xs text-gray-500">Creado {formatDate(t.created_at)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-gray-900">{t.user_name || '—'}</div>
                                                        <div className="text-xs text-gray-500">{t.user_username || ''}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.hostname ? (
                                                            <div>
                                                                <div className="font-medium text-gray-900">{t.hostname}</div>
                                                                <div className="max-w-[12rem] truncate font-mono text-[11px] text-gray-500" title={t.hardware_uuid || ''}>
                                                                    {t.hardware_uuid}
                                                                </div>
                                                                {t.computer_id && (
                                                                    <Link
                                                                        href={`/inventario/computadores/${t.computer_id}`}
                                                                        className="focus-ring inline-flex items-center gap-0.5 rounded text-xs font-medium text-huv-ink hover:underline"
                                                                    >
                                                                        Ver en inventario
                                                                        <ArrowUpRight className="size-3" aria-hidden="true" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">Sin equipo asociado</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <EstadoEquipo status={t.device_status} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-gray-700">{formatDate(t.last_seen_at || t.last_used_at)}</div>
                                                        {t.last_ip && <div className="font-mono text-[11px] text-gray-500">{t.last_ip}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums text-gray-700">{(t.sync_count ?? 0).toLocaleString('es-CO')}</TableCell>
                                                    <TableCell className="text-gray-700">{t.expires_at ? formatDate(t.expires_at) : 'Nunca'}</TableCell>
                                                    {isAdmin && (
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                {t.device_id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleDevice(t.device_id!)}
                                                                        aria-label={`${activo ? 'Deshabilitar' : 'Activar'} el equipo ${t.hostname ?? ''}`.trim()}
                                                                        title={activo ? 'Deshabilitar equipo' : 'Activar equipo'}
                                                                        className={cn(btn.ghost, 'size-8 px-0')}
                                                                    >
                                                                        <Power aria-hidden="true" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRevokeTarget(t)}
                                                                    aria-label={`Revocar el token ${t.name}`}
                                                                    title="Revocar token"
                                                                    className={cn(btn.ghost, 'size-8 px-0 text-red-600 hover:bg-red-50 hover:text-red-700')}
                                                                >
                                                                    <Trash2 aria-hidden="true" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            <DataTablePagination
                                paginator={tokens}
                                count={tokens.data.length}
                                noun="tokens"
                                onPerPageChange={(value) => go(buildParams({ per_page: value }))}
                            />
                        </section>
                    </div>
                </main>

                <GLPIFooter />
            </div>

            {/* Modal: emitir nuevo token */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[520px]">
                    <form onSubmit={handleCreate}>
                        <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                            <DialogTitle className="text-lg font-semibold text-gray-900">Emitir token del agente</DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">
                                Autoriza a un PC a sincronizar su inventario. El token se muestra una sola vez.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5 px-6 py-5">
                            <FormField id="user_id" label="Usuario asociado" error={formErrors.user_id}>
                                {(control) => (
                                    <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v })}>
                                        <SelectTrigger {...control} className={selectTriggerClass}>
                                            <SelectValue placeholder="Selecciona un administrador o técnico" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name} · {u.username} ({u.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormField>

                            <FormField id="name" label="Nombre identificador" error={formErrors.name} hint="Conviene usar el nombre del equipo.">
                                {(control) => (
                                    <input
                                        {...control}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej.: PC-CONTABILIDAD-03"
                                        maxLength={120}
                                        autoComplete="off"
                                        className={fieldClass}
                                    />
                                )}
                            </FormField>

                            <FormField id="days" label="Días de validez" error={formErrors.days} hint="0 = no expira. Máximo 3.650 días.">
                                {(control) => (
                                    <input
                                        {...control}
                                        type="number"
                                        min={0}
                                        max={3650}
                                        value={formData.days}
                                        onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                                        className={cn(fieldClass, 'w-40')}
                                    />
                                )}
                            </FormField>
                        </div>

                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className={btn.secondary}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={submitting} className={btn.primary}>
                                {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                                {submitting ? 'Generando…' : 'Generar token'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: token recién creado */}
            <Dialog open={showNewTokenModal} onOpenChange={setShowNewTokenModal}>
                <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
                    <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <CheckCircle2 className="size-5 text-green-700" aria-hidden="true" />
                            Token generado
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            <strong className="font-semibold text-gray-900">Cópialo ahora.</strong> Por seguridad, no podrás volver a verlo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        {flash.token_meta && (
                            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                <dt className="text-gray-500">Nombre</dt>
                                <dd className="font-medium text-gray-900">{flash.token_meta.name}</dd>
                                <dt className="text-gray-500">Usuario</dt>
                                <dd className="text-gray-900">{flash.token_meta.user}</dd>
                                <dt className="text-gray-500">Expira</dt>
                                <dd className="text-gray-900">{flash.token_meta.expires_at ? formatDate(flash.token_meta.expires_at) : 'Nunca'}</dd>
                            </dl>
                        )}

                        <div className="rounded-xl bg-gray-50 p-3 font-mono text-xs break-all text-gray-900 ring-1 ring-inset ring-gray-200">{flash.plain_token}</div>

                        <div className="flex gap-2 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <p>
                                Configura el agente del PC con este token en{' '}
                                <code className="rounded bg-yellow-100 px-1">%ProgramData%\HelpDeskHUV\agent.config.json</code>. Si lo pierdes, revócalo y
                                emite uno nuevo.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                        <button type="button" onClick={handleCopy} className={btn.secondary}>
                            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                            <span aria-live="polite">{copied ? 'Copiado' : 'Copiar token'}</span>
                        </button>
                        <button type="button" onClick={() => setShowNewTokenModal(false)} className={btn.primary}>
                            Entendido
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: confirmar revocación */}
            <Dialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
                <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[480px]">
                    <DialogHeader className="border-b px-6 py-4 pr-12 text-left">
                        <DialogTitle className="text-lg font-semibold text-gray-900">Revocar token</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            No se puede deshacer. El PC dejará de sincronizar su inventario hasta que se le emita un token nuevo.
                        </DialogDescription>
                    </DialogHeader>
                    {revokeTarget && (
                        <p className="px-6 py-5 text-sm text-gray-700">
                            ¿Revocar el token <strong className="font-semibold text-gray-900">{revokeTarget.name}</strong>
                            {revokeTarget.hostname && (
                                <>
                                    {' '}
                                    del equipo <strong className="font-semibold text-gray-900">{revokeTarget.hostname}</strong>
                                </>
                            )}
                            ?
                        </p>
                    )}
                    <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                        <button type="button" onClick={() => setRevokeTarget(null)} className={btn.secondary}>
                            Cancelar
                        </button>
                        <button type="button" onClick={handleRevoke} disabled={revoking} className={cn(btn.primary, 'bg-red-600 hover:bg-red-700')}>
                            {revoking && <Loader2 className="animate-spin" aria-hidden="true" />}
                            Revocar token
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
