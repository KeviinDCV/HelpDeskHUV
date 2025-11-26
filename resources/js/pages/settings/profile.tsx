import { GLPIHeader } from '@/components/glpi-header';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Camera } from 'lucide-react';
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

    return (
        <>
            <Head title="Mi Perfil - HelpDesk HUV" />
            <div className="min-h-screen flex flex-col bg-gray-50">
                <GLPIHeader breadcrumb={
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Inicio</span>
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
                    </div>
                </main>

                <GLPIFooter />
            </div>
        </>
    );
}
