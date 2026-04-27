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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Search, Copy, CheckCircle2, AlertCircle, Power, KeyRound } from 'lucide-react';
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

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    tokens: {
        data: AgentTokenRow[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLinks[];
    };
    users: UserOption[];
    filters: { per_page: number; search: string };
    flash: {
        plain_token: string | null;
        token_meta: { id: number; name: string; user: string; expires_at: string | null } | null;
    };
    auth: { user: { id: number; username: string; role: string } };
}

function formatDate(value: string | null) {
    if (!value) return '—';
    try {
        const d = new Date(value);
        return d.toLocaleString('es-CO', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return value;
    }
}

function StatusPill({ status }: { status: AgentTokenRow['device_status'] }) {
    if (!status) {
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Sin equipo</span>;
    }
    const map: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        disabled: 'bg-red-100 text-red-700',
        pending: 'bg-yellow-100 text-yellow-700',
    };
    const label: Record<string, string> = {
        active: 'Activo', disabled: 'Deshabilitado', pending: 'Pendiente',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[status]}`}>{label[status]}</span>;
}

export default function AgenteTokens({ tokens, users, filters, flash, auth }: Props) {
    const [searchValue, setSearchValue] = React.useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [revokeTarget, setRevokeTarget] = React.useState<AgentTokenRow | null>(null);
    const [formData, setFormData] = React.useState({
        user_id: '',
        name: '',
        days: '0',
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    // Modal automático cuando llega un plain_token recién emitido
    const [showNewTokenModal, setShowNewTokenModal] = React.useState(!!flash.plain_token);

    const isAdmin = auth?.user?.role === 'Administrador';

    const handleSearch = () => {
        const params: Record<string, string | number> = { per_page: filters.per_page, page: 1 };
        if (searchValue) params.search = searchValue;
        router.get('/administracion/agente-tokens', params, { preserveState: false, replace: true });
    };

    const handleClear = () => {
        setSearchValue('');
        router.get('/administracion/agente-tokens', { per_page: filters.per_page, page: 1 }, { preserveState: false, replace: true });
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
        router.post('/administracion/agente-tokens', {
            user_id: Number(formData.user_id),
            name: formData.name.trim(),
            days: Number(formData.days || 0),
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ user_id: '', name: '', days: '0' });
            },
            onError: (errs) => setFormErrors(errs as Record<string, string>),
            onFinish: () => setSubmitting(false),
        });
    };

    const handleRevoke = () => {
        if (!revokeTarget) return;
        router.delete(`/administracion/agente-tokens/${revokeTarget.id}`, {
            onSuccess: () => setRevokeTarget(null),
        });
    };

    const handleToggleDevice = (deviceId: number) => {
        router.post(`/administracion/agente-dispositivos/${deviceId}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handleCopy = async () => {
        if (!flash.plain_token) return;
        try {
            await navigator.clipboard.writeText(flash.plain_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Head title="Tokens del Agente de Inventario" />
            <GLPIHeader />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
                {/* Breadcrumb */}
                <nav className="text-sm mb-4">
                    <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <Link href="/administracion/usuarios" className="text-gray-600 hover:text-[#2c4370] hover:underline">Administración</Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-[#2c4370] font-medium">Tokens del Agente</span>
                </nav>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2c4370] flex items-center gap-2">
                            <KeyRound className="w-6 h-6" />
                            Tokens del Agente de Inventario
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Gestiona los tokens que utilizan los PCs para reportar su inventario al HelpDesk.
                        </p>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#2c4370] hover:bg-[#1e2f50]">
                            <Plus className="w-4 h-4 mr-1" /> Emitir nuevo token
                        </Button>
                    )}
                </div>

                {/* Banner cuando hay un token recién emitido */}
                {flash.plain_token && !showNewTokenModal && (
                    <div className="mb-4 p-3 rounded border border-green-300 bg-green-50 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">
                            Token emitido. Puedes verlo de nuevo arriba antes de salir de esta página.
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setShowNewTokenModal(true)}>
                            Ver token
                        </Button>
                    </div>
                )}

                {/* Buscador */}
                <div className="bg-white rounded-lg border p-3 mb-4 flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Buscar por nombre, usuario, hostname, UUID o serial..."
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch} className="bg-[#2c4370] hover:bg-[#1e2f50]">Buscar</Button>
                    {searchValue && (
                        <Button variant="outline" onClick={handleClear}>Limpiar</Button>
                    )}
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Nombre del token</TableHead>
                                    <TableHead>Emitido para</TableHead>
                                    <TableHead>Equipo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Última actividad</TableHead>
                                    <TableHead>Sincronizaciones</TableHead>
                                    <TableHead>Expira</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tokens.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                            No hay tokens emitidos. Crea el primero con el botón "Emitir nuevo token".
                                        </TableCell>
                                    </TableRow>
                                )}
                                {tokens.data.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>
                                            <div className="font-medium">{t.name}</div>
                                            <div className="text-xs text-gray-500">
                                                Creado: {formatDate(t.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{t.user_name || '—'}</div>
                                            <div className="text-xs text-gray-500">{t.user_username || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            {t.hostname ? (
                                                <div>
                                                    <div className="text-sm font-medium">{t.hostname}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[180px]" title={t.hardware_uuid || ''}>
                                                        UUID: {t.hardware_uuid?.substring(0, 18)}...
                                                    </div>
                                                    {t.computer_id && (
                                                        <Link href={`/inventario/computadores/${t.computer_id}`} className="text-xs text-[#2c4370] hover:underline">
                                                            Ver en inventario →
                                                        </Link>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sin equipo asociado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusPill status={t.device_status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                {formatDate(t.last_seen_at || t.last_used_at)}
                                            </div>
                                            {t.last_ip && (
                                                <div className="text-xs text-gray-500">{t.last_ip}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{t.sync_count ?? 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs">
                                                {t.expires_at ? formatDate(t.expires_at) : 'Nunca'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {t.device_id && isAdmin && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleDevice(t.device_id!)}
                                                        title={t.device_status === 'active' ? 'Deshabilitar equipo' : 'Activar equipo'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                        onClick={() => setRevokeTarget(t)}
                                                        title="Revocar token"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {tokens.last_page > 1 && (
                        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
                            <span className="text-sm text-gray-600">
                                Mostrando {tokens.data.length} de {tokens.total} tokens
                            </span>
                            <div className="flex gap-1">
                                {tokens.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: false })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <GLPIFooter />

            {/* Modal: emitir nuevo token */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle>Emitir nuevo token de agente</DialogTitle>
                            <DialogDescription>
                                Este token autorizará a un PC a sincronizar su inventario. Solo se mostrará una vez.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="user_id">Usuario asociado *</Label>
                                <Select
                                    value={formData.user_id}
                                    onValueChange={(v) => setFormData({ ...formData, user_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un usuario administrativo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.username} — {u.name} ({u.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.user_id && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.user_id}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="name">Nombre identificador *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: PC-CONTABILIDAD-03"
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="days">Días de validez</Label>
                                <Input
                                    id="days"
                                    type="number"
                                    min={0}
                                    max={3650}
                                    value={formData.days}
                                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Usa 0 para que no expire.</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-[#2c4370] hover:bg-[#1e2f50]">
                                {submitting ? 'Generando...' : 'Generar token'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: token recién creado */}
            <Dialog open={showNewTokenModal} onOpenChange={setShowNewTokenModal}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Token generado
                        </DialogTitle>
                        <DialogDescription>
                            <strong>Cópialo ahora.</strong> Por seguridad, no podrás volver a verlo.
                        </DialogDescription>
                    </DialogHeader>

                    {flash.token_meta && (
                        <div className="text-sm space-y-1 py-2">
                            <div><span className="text-gray-500">Nombre:</span> <strong>{flash.token_meta.name}</strong></div>
                            <div><span className="text-gray-500">Usuario:</span> {flash.token_meta.user}</div>
                            <div>
                                <span className="text-gray-500">Expira:</span>{' '}
                                {flash.token_meta.expires_at ? formatDate(flash.token_meta.expires_at) : 'Nunca'}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-100 rounded p-3 font-mono text-xs break-all border">
                        {flash.plain_token}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800 flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                            Configura el agente del PC con este token en <code className="bg-yellow-100 px-1 rounded">%ProgramData%\HelpDeskHUV\agent.config.json</code>.
                            Si lo pierdes, deberás revocarlo y generar uno nuevo.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCopy} className="gap-1">
                            <Copy className="w-4 h-4" />
                            {copied ? '¡Copiado!' : 'Copiar token'}
                        </Button>
                        <Button onClick={() => setShowNewTokenModal(false)} className="bg-[#2c4370] hover:bg-[#1e2f50]">
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: confirmar revocación */}
            <Dialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revocar token</DialogTitle>
                        <DialogDescription>
                            Esta acción es irreversible. El PC asociado dejará de poder sincronizar inventario hasta que se le emita un nuevo token.
                        </DialogDescription>
                    </DialogHeader>
                    {revokeTarget && (
                        <div className="text-sm py-2">
                            ¿Estás seguro de revocar el token <strong>{revokeTarget.name}</strong>
                            {revokeTarget.hostname && <> del equipo <strong>{revokeTarget.hostname}</strong></>}?
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancelar</Button>
                        <Button onClick={handleRevoke} className="bg-red-600 hover:bg-red-700 text-white">
                            Revocar token
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
