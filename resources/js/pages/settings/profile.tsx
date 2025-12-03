import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import React, { useState, useRef } from 'react';

interface AuthUser {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string;
}

interface ProfileProps {
    mustVerifyEmail: boolean;
    status?: string;
    flash?: { success?: string };
}

export default function Profile({ status, flash }: ProfileProps) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const user = auth.user;
    
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.avatar ? `/storage/${user.avatar}` : null
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
            onSuccess: () => {
                setProcessing(false);
                setAvatarFile(null);
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
        setPasswordSuccess(false);

        router.put('/settings/profile/password', passwordData, {
            onSuccess: () => {
                setPasswordProcessing(false);
                setPasswordData({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
                setPasswordSuccess(true);
                setTimeout(() => setPasswordSuccess(false), 5000);
            },
            onError: (errs) => {
                setPasswordErrors(errs as Record<string, string>);
                setPasswordProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Mi Perfil - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/dashboard" className="text-gray-600 hover:text-[#2c4370] hover:underline">Inicio</Link>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900">Mi Perfil</span>
                    </div>
                } />

                <main className="flex-1 px-6 py-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h1 className="text-xl font-semibold text-gray-900">Mi Perfil</h1>
                                <p className="text-sm text-gray-500 mt-1">Actualiza tu información personal</p>
                            </div>

                            {flash?.success && (
                                <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">{flash.success}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-gray-400" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-8 h-8 bg-[#2c4370] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#3d5583] transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.role}</p>
                                        <p className="text-xs text-gray-400 mt-1">@{user.username}</p>
                                    </div>
                                </div>
                                {errors.avatar && <p className="text-sm text-red-600">{errors.avatar}</p>}

                                {/* Nombre */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        Nombre Completo
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Tu nombre completo"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        Correo Electrónico
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="tu@email.com"
                                        required
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                {/* Teléfono */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Ej: 3001234567"
                                    />
                                    {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                {/* Info de solo lectura */}
                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Información de la cuenta</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Usuario:</span>
                                            <span className="ml-2 font-medium">{user.username}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Rol:</span>
                                            <span className="ml-2 font-medium">{user.role}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón guardar */}
                                <div className="pt-4 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white px-8"
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Sección de cambio de contraseña */}
                        <div className="bg-white rounded-lg shadow mt-6">
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">Cambiar Contraseña</h2>
                                <p className="text-sm text-gray-500 mt-1">Asegúrate de usar una contraseña segura</p>
                            </div>

                            {passwordSuccess && (
                                <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">Contraseña actualizada correctamente</p>
                                </div>
                            )}

                            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                                {/* Contraseña actual */}
                                <div className="space-y-2">
                                    <Label htmlFor="current_password" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        Contraseña Actual
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            placeholder="Ingresa tu contraseña actual"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.current_password && <p className="text-sm text-red-600">{passwordErrors.current_password}</p>}
                                </div>

                                {/* Nueva contraseña */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        Nueva Contraseña
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                            placeholder="Mínimo 8 caracteres"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.password && <p className="text-sm text-red-600">{passwordErrors.password}</p>}
                                </div>

                                {/* Confirmar contraseña */}
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        Confirmar Nueva Contraseña
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                            placeholder="Repite la nueva contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordErrors.password_confirmation && <p className="text-sm text-red-600">{passwordErrors.password_confirmation}</p>}
                                </div>

                                {/* Botón guardar */}
                                <div className="pt-4 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={passwordProcessing}
                                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white px-8"
                                    >
                                        {passwordProcessing ? 'Actualizando...' : 'Cambiar Contraseña'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
