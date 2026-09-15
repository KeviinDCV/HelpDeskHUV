import { FormField } from '@/components/form-field';
import { GLPIFooter } from '@/components/glpi-footer';
import { GLPIHeader } from '@/components/glpi-header';
import { btn, fieldClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Camera, Check, CheckCircle2, Circle, Eye, EyeOff, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState, type ReactNode } from 'react';

interface AuthUser {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string;
}

type Formulario = 'perfil' | 'password';

// Los mismos límites que valida ProfileUpdateRequest (mimes:jpg,jpeg,png,gif · max:2048 KB).
// Revisarlos aquí evita subir la foto para enterarse después, en el error del servidor.
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FOTO = 2 * 1024 * 1024;

function iniciales(nombre: string): string {
    return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function Seccion({ id, titulo, descripcion, children }: { id: string; titulo: string; descripcion: ReactNode; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
            <div className="lg:pt-1">
                <h2 id={id} className="text-base font-semibold text-gray-900">
                    {titulo}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
            </div>
            {children}
        </section>
    );
}

/** Pie de tarjeta con el botón de guardar y la confirmación, que se anuncia al lector de pantalla. */
function PieFormulario({ aviso, children }: { aviso: string | null; children: ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t bg-gray-50 px-5 py-3 sm:px-6">
            <p role="status" className="flex items-center gap-1.5 text-sm text-green-700">
                {aviso && (
                    <>
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        {aviso}
                    </>
                )}
            </p>
            {children}
        </div>
    );
}

function Requisito({ cumplido, children }: { cumplido: boolean; children: ReactNode }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5', cumplido ? 'text-green-700' : 'text-gray-500')}>
            {cumplido ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3" aria-hidden="true" />}
            {children}
            <span className="sr-only">{cumplido ? '(cumplido)' : '(pendiente)'}</span>
        </span>
    );
}

export default function Profile() {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const user = auth.user;
    const fotoGuardada = user.avatar ? `/storage/${user.avatar}` : null;

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(fotoGuardada);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados para cambio de contraseña
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordProcessing, setPasswordProcessing] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [visibles, setVisibles] = useState<Record<string, boolean>>({});

    // Confirmación junto al formulario que se guardó (antes el aviso de contraseña salía
    // también en la tarjeta del perfil, porque ambos leían el mismo flash).
    const [aviso, setAviso] = useState<{ form: Formulario; texto: string } | null>(null);
    useEffect(() => {
        if (!aviso) return;
        const t = setTimeout(() => setAviso(null), 6000);
        return () => clearTimeout(t);
    }, [aviso]);

    const hayCambios =
        formData.name !== (user.name || '') ||
        formData.email !== (user.email || '') ||
        formData.phone !== (user.phone || '') ||
        avatarFile !== null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // permite volver a elegir el mismo archivo tras descartarlo
        if (!file) return;
        if (!TIPOS_FOTO.includes(file.type)) {
            setAvatarError('La foto debe ser JPG, PNG o GIF.');
            return;
        }
        if (file.size > MAX_FOTO) {
            setAvatarError(`La foto pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es 2 MB.`);
            return;
        }
        setAvatarError(null);
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const descartarFoto = () => {
        setAvatarFile(null);
        setAvatarPreview(fotoGuardada);
        setAvatarError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('_method', 'PATCH');
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        router.post('/settings/profile', data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                setAvatarFile(null);
                const flash = (page.props as { flash?: { success?: string } }).flash;
                setAviso({ form: 'perfil', texto: flash?.success ?? 'Cambios guardados.' });
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordProcessing(true);
        setPasswordErrors({});

        router.put('/settings/profile/password', passwordData, {
            preserveScroll: true,
            onSuccess: (page) => {
                setPasswordProcessing(false);
                setPasswordData({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
                setVisibles({});
                const flash = (page.props as { flash?: { success?: string } }).flash;
                setAviso({ form: 'password', texto: flash?.success ?? 'Contraseña actualizada.' });
            },
            onError: (errs) => {
                setPasswordErrors(errs as Record<string, string>);
                setPasswordProcessing(false);
            },
        });
    };

    const largoOk = passwordData.password.length >= 8;
    const coinciden = passwordData.password_confirmation.length > 0 && passwordData.password === passwordData.password_confirmation;

    const campoPassword = (id: keyof typeof passwordData, etiqueta: string, autoComplete: string, hint?: ReactNode) => (
        <FormField id={id} label={etiqueta} error={passwordErrors[id]} hint={hint}>
            {(control) => (
                <div className="relative">
                    <input
                        {...control}
                        type={visibles[id] ? 'text' : 'password'}
                        value={passwordData[id]}
                        onChange={(e) => setPasswordData({ ...passwordData, [id]: e.target.value })}
                        autoComplete={autoComplete}
                        required
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

    return (
        <>
            <Head title="Mi perfil - HelpDesk HUV" />
            <div className="flex min-h-screen flex-col bg-gray-50">
                <GLPIHeader
                    breadcrumb={
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">
                                Inicio
                            </Link>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-900">Mi perfil</span>
                        </div>
                    }
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Mi perfil</h1>
                            <p className="mt-1 text-sm text-gray-500">Tus datos de contacto y el acceso a tu cuenta.</p>
                        </div>

                        <Seccion id="seccion-personal" titulo="Información personal" descripcion="Nombre, correo y teléfono con los que te identificas en la mesa de ayuda.">
                            <form onSubmit={handleSubmit} className="surface-card overflow-hidden">
                                <div className="space-y-6 p-5 sm:p-6">
                                    <div className="flex items-center gap-5">
                                        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-huv-soft ring-1 ring-black/5">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="" className="size-full object-cover" />
                                            ) : (
                                                <span aria-hidden="true" className="flex size-full items-center justify-center text-2xl font-semibold text-huv-ink">
                                                    {iniciales(user.name)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className={btn.secondary}>
                                                    <Camera aria-hidden="true" />
                                                    {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                                                </button>
                                                {avatarFile && (
                                                    <button type="button" onClick={descartarFoto} className={btn.ghost}>
                                                        Descartar
                                                    </button>
                                                )}
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                {avatarFile ? 'Foto nueva: se guarda al pulsar «Guardar cambios».' : 'JPG, PNG o GIF. Máximo 2 MB.'}
                                            </p>
                                            {(avatarError || errors.avatar) && (
                                                <p role="alert" className="mt-1 text-sm text-red-600">
                                                    {avatarError || errors.avatar}
                                                </p>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept={TIPOS_FOTO.join(',')}
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                            aria-label="Elegir foto de perfil"
                                        />
                                    </div>

                                    <FormField id="name" label="Nombre completo" error={errors.name}>
                                        {(control) => (
                                            <input
                                                {...control}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                autoComplete="name"
                                                required
                                                className={fieldClass}
                                            />
                                        )}
                                    </FormField>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <FormField id="email" label="Correo electrónico" error={errors.email}>
                                            {(control) => (
                                                <input
                                                    {...control}
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    autoComplete="email"
                                                    required
                                                    className={fieldClass}
                                                />
                                            )}
                                        </FormField>

                                        <FormField id="phone" label="Teléfono" error={errors.phone} optional>
                                            {(control) => (
                                                <input
                                                    {...control}
                                                    type="tel"
                                                    inputMode="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    autoComplete="tel"
                                                    placeholder="Ej.: 3001234567"
                                                    maxLength={20}
                                                    className={fieldClass}
                                                />
                                            )}
                                        </FormField>
                                    </div>
                                </div>

                                <PieFormulario aviso={aviso?.form === 'perfil' ? aviso.texto : null}>
                                    <button type="submit" disabled={processing || !hayCambios} className={btn.primary}>
                                        {processing && <Loader2 className="animate-spin" aria-hidden="true" />}
                                        {processing ? 'Guardando…' : 'Guardar cambios'}
                                    </button>
                                </PieFormulario>
                            </form>
                        </Seccion>

                        <Seccion id="seccion-password" titulo="Contraseña" descripcion="Para cambiarla necesitas la actual. La nueva debe tener al menos 8 caracteres.">
                            <form onSubmit={handlePasswordSubmit} className="surface-card overflow-hidden">
                                <div className="space-y-6 p-5 sm:p-6">
                                    {campoPassword('current_password', 'Contraseña actual', 'current-password')}
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {campoPassword('password', 'Nueva contraseña', 'new-password', <Requisito cumplido={largoOk}>Al menos 8 caracteres</Requisito>)}
                                        {campoPassword(
                                            'password_confirmation',
                                            'Confirmar nueva contraseña',
                                            'new-password',
                                            passwordData.password_confirmation ? (
                                                <Requisito cumplido={coinciden}>{coinciden ? 'Coinciden' : 'Todavía no coinciden'}</Requisito>
                                            ) : undefined,
                                        )}
                                    </div>
                                </div>

                                <PieFormulario aviso={aviso?.form === 'password' ? aviso.texto : null}>
                                    <button type="submit" disabled={passwordProcessing} className={btn.primary}>
                                        {passwordProcessing && <Loader2 className="animate-spin" aria-hidden="true" />}
                                        {passwordProcessing ? 'Actualizando…' : 'Cambiar contraseña'}
                                    </button>
                                </PieFormulario>
                            </form>
                        </Seccion>

                        <Seccion id="seccion-cuenta" titulo="Cuenta" descripcion="Los define un administrador en Administración › Usuarios.">
                            <dl className="surface-card divide-y">
                                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                    <dt className="text-sm text-gray-500">Usuario</dt>
                                    <dd className="text-sm font-medium text-gray-900">{user.username}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                    <dt className="text-sm text-gray-500">Rol</dt>
                                    <dd>
                                        <span className="inline-flex items-center rounded-md bg-huv-soft px-2 py-0.5 text-xs font-semibold text-huv-ink">{user.role}</span>
                                    </dd>
                                </div>
                            </dl>
                        </Seccion>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
