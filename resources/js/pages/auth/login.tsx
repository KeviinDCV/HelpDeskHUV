import { User, Lock } from 'lucide-react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    return (
        <>
            <Head title="HelpDesk HUV - Iniciar Sesión" />
            
            <div className="min-h-screen bg-gradient-to-b from-[#4a6fa5] to-[#2c4875] flex flex-col items-center justify-between p-8">
                {/* Logo */}
                <div className="flex-1 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="mb-16">
                            <h1 className="text-white text-5xl font-bold tracking-wide">
                                <span className="inline-flex items-center gap-1">
                                    <span className="bg-white text-[#2c4875] px-3 py-1 rounded-lg">H</span>
                                    <span>elpDesk HUV</span>
                                </span>
                            </h1>
                        </div>

                        {/* Login Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="w-[320px] space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Usuario Field */}
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <Input
                                                type="text"
                                                name="email"
                                                placeholder="Usuario"
                                                required
                                                autoFocus
                                                autoComplete="username"
                                                className="h-10 pl-10 pr-4 bg-white text-gray-900 placeholder:text-gray-500 border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                                            />
                                        </div>
                                        {errors.email && (
                                            <InputError message={errors.email} className="text-white text-xs" />
                                        )}
                                    </div>

                                    {/* Contraseña Field */}
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <Input
                                                type="password"
                                                name="password"
                                                placeholder="Contraseña"
                                                required
                                                autoComplete="current-password"
                                                className="h-10 pl-10 pr-4 bg-white text-gray-900 placeholder:text-gray-500 border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                                            />
                                        </div>
                                        {errors.password && (
                                            <InputError message={errors.password} className="text-white text-xs" />
                                        )}
                                    </div>

                                    {/* Remember Me Checkbox */}
                                    <div className="flex items-center gap-2 text-white text-sm">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            defaultChecked
                                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2c4875]"
                                        />
                                        <Label htmlFor="remember" className="cursor-pointer font-normal">
                                            Recuerdame
                                        </Label>
                                    </div>

                                    {status && (
                                        <div className="text-center text-sm font-medium text-green-300 bg-green-900/20 py-2 rounded-md">
                                            {status}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-10 bg-[#f5a73b] hover:bg-[#e69522] text-gray-900 font-medium transition-colors disabled:opacity-50"
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
