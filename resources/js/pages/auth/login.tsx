import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';
import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { errors: pageErrors } = usePage().props as { errors: Record<string, string> };

    return (
        <>
            <Head title="HelpDesk HUV - Iniciar Sesión" />
            
            <div className="min-h-screen bg-gradient-to-b from-[#4a6fa5] to-[#2c4875] flex flex-col items-center justify-between p-8">
                {/* Logo */}
                <div className="flex-1 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="mb-10">
                            <div className="w-32 h-32 mx-auto bg-white rounded-full p-3 shadow-lg mb-4">
                                <img 
                                    src="/images/Logo.png" 
                                    alt="HelpDesk HUV" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h1 className="text-white font-bold tracking-wide">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="inline-flex items-center gap-1 text-4xl">
                                        <span className="bg-white text-[#2c4875] px-2 py-0.5 rounded-lg">H</span>
                                        <span>elpDesk</span>
                                    </div>
                                    <div className="text-3xl">HUV</div>
                                </div>
                            </h1>
                            <p className="text-white/80 text-sm font-medium mt-2">Sistemas HUV</p>
                        </div>

                        {/* Login Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="w-[320px] space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Error de autenticación */}
                                    {(errors.email || pageErrors.email) && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-white text-sm">
                                            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                                            <span>{errors.email || pageErrors.email}</span>
                                        </div>
                                    )}

                                    {/* Usuario Field */}
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <Input
                                                type="text"
                                                name="email"
                                                placeholder="Usuario"
                                                required
                                                autoFocus
                                                autoComplete="username"
                                                className="h-12 pl-11 pr-4 bg-[#2c4370]/30 text-white font-medium placeholder:text-gray-300 placeholder:font-normal border-2 border-white/30 focus-visible:ring-0 focus-visible:border-white/50 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Contraseña Field */}
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Contraseña"
                                                required
                                                autoComplete="current-password"
                                                className="h-12 pl-11 pr-12 bg-[#2c4370]/30 text-white font-medium placeholder:text-gray-300 placeholder:font-normal border-2 border-white/30 focus-visible:ring-0 focus-visible:border-white/50 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors z-10"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <InputError message={errors.password} className="text-red-200 text-xs font-medium bg-red-900/30 px-2 py-1 rounded" />
                                        )}
                                    </div>

                                    {/* Remember Me Checkbox */}
                                    <div className="flex items-center gap-2 text-white text-sm mt-2">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            defaultChecked
                                            className="border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2c4875] h-5 w-5"
                                        />
                                        <Label htmlFor="remember" className="cursor-pointer font-medium">
                                            Recuérdame
                                        </Label>
                                    </div>

                                    {status && (
                                        <div className="text-center text-sm font-medium text-green-100 bg-green-700/40 py-2.5 px-3 rounded-md border border-green-500/30">
                                            {status}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-12 bg-[#f5a73b] hover:bg-[#e69522] text-gray-900 font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    >
                                        {processing ? 'Procesando...' : 'Aceptar'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-white text-xs text-right w-full">
                    HelpDesk HUV © 2025 - Hospital Universitario del Valle
                </footer>
            </div>
        </>
    );
}
