import { Head, router, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, Bot, User, Briefcase, MapPin, Phone, FileText, AlertTriangle, Monitor, Cpu } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface FormData {
    reporter_name: string;
    reporter_position: string;
    reporter_service: string;
    reporter_extension: string;
    reporter_email: string;
    name: string;
    content: string;
    priority: string;
    device_type: string;
    equipment_ecom: string;
    itilcategories_id: string;
}

const priorityLabels: Record<string, string> = {
    '1': 'Muy baja', '2': 'Baja', '3': 'Media', '4': 'Alta', '5': 'Muy alta', '6': 'Urgente',
};

const deviceLabels: Record<string, string> = {
    'computer': 'Computador', 'monitor': 'Monitor', 'printer': 'Impresora',
    'phone': 'Teléfono', 'network': 'Red / Internet', 'software': 'Programa / Sistema', 'other': 'Otro',
};

export default function ReportarCaso() {
    const { props } = usePage<{ flash?: { success?: { message: string; ticket_id: number } } }>();
    const flash = props.flash;

    const [processing, setProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! 👋 Soy Evarisbot, tu asistente para reportar problemas técnicos en el Hospital. Vamos a crear tu reporte juntos.\n\nPara comenzar, ¿me podrías decir tu nombre completo?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filledFields, setFilledFields] = useState<string[]>([]);
    
    const [formData, setFormData] = useState<FormData>({
        reporter_name: '', reporter_position: '', reporter_service: '', reporter_extension: '',
        reporter_email: '', name: '', content: '', priority: '3', device_type: '', equipment_ecom: '', itilcategories_id: '',
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormComplete = () => {
        return formData.reporter_name && formData.reporter_position && 
               formData.reporter_service && formData.name && formData.content;
    };

    const handleSubmit = () => {
        if (!isFormComplete()) return;
        setProcessing(true);

        router.post('/reportar', { ...formData }, {
            onSuccess: () => {
                setFormData({
                    reporter_name: '', reporter_position: '', reporter_service: '', reporter_extension: '',
                    reporter_email: '', name: '', content: '', priority: '3', device_type: '', equipment_ecom: '', itilcategories_id: '',
                });
                setFilledFields([]);
                setMessages([{ role: 'assistant', content: '¡Hola! 👋 Soy Evarisbot. ¿Me podrías decir tu nombre completo?' }]);
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
                setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un problema al enviar. Por favor, intenta de nuevo.' }]);
            }
        });
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        
        // Agregar mensaje inmediatamente
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        
        // Animar el botón
        animateSendButton();

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken || '' },
                credentials: 'include',
                body: JSON.stringify({
                    message: userMessage,
                    context: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
                    currentFormData: formData,
                    filledFields: filledFields,
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                if (data.fields && typeof data.fields === 'object') {
                    const newFilledFields: string[] = [...filledFields];
                    Object.entries(data.fields).forEach(([field, value]) => {
                        if (value && typeof value === 'string' && value.trim()) {
                            handleChange(field, value);
                            if (!newFilledFields.includes(field)) newFilledFields.push(field);
                        }
                    });
                    setFilledFields(newFilledFields);
                }
                // Solo agregar mensaje si no está vacío
                if (data.message && data.message.trim()) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema. ¿Puedes intentar de nuevo?' }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Verifica tu internet.' }]);
        } finally {
            setIsLoading(false);
            // Restaurar foco después de que termine la carga
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    };

    // Animación del botón enviar
    const animateSendButton = () => {
        const button = sendButtonRef.current;
        if (!button) return;

        // Pulso del botón
        gsap.to(button, {
            scale: 0.85,
            duration: 0.1,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(button, { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: 'elastic.out(1, 0.5)' 
                });
            }
        });
    };


    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
            // Mantener foco inmediatamente
            inputRef.current?.focus();
        }
    };

    return (
        <>
            <Head title="Reportar Problema - HelpDesk HUV" />
            <div className="min-h-screen bg-gradient-to-br from-[#2c4370] to-[#1a2a4a] flex items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4 shadow-lg">
                            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-green-800 text-lg">{flash.success.message}</h3>
                                <p className="text-green-700 mt-1">Su número de caso es: <strong className="text-xl">#{flash.success.ticket_id}</strong></p>
                                <p className="text-green-600 text-sm mt-2">Guarde este número para hacer seguimiento.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Chat Principal */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '580px' }}>
                            <div className="bg-gradient-to-r from-[#2c4370] to-[#3d5583] px-6 py-4 flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-white font-bold text-lg">Evarisbot</h1>
                                        <p className="text-white/80 text-sm">Asistente de Soporte - HUV</p>
                                    </div>
                                </div>
                            </div>

                            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg, index) => (
                                    <AnimatedMessage 
                                        key={index} 
                                        message={msg} 
                                        isNew={index === messages.length - 1}
                                    />
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-md border">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe tu mensaje aquí..."
                                        className="flex-1 px-4 py-3 text-sm border-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2c4370]/50 focus:border-[#2c4370]"
                                        autoFocus
                                    />
                                    <button
                                        ref={sendButtonRef}
                                        onClick={() => { sendMessage(); inputRef.current?.focus(); }}
                                        disabled={!input.trim() || isLoading}
                                        className="w-12 h-12 bg-[#2c4370] text-white rounded-full flex items-center justify-center hover:bg-[#3d5583] disabled:opacity-50 transition-all"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Panel Resumen */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '580px' }}>
                            <div className="bg-gradient-to-r from-[#3d5583] to-[#2c4370] px-4 py-3">
                                <h2 className="text-white font-semibold text-sm">📋 Resumen del Reporte</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Quien Reporta</h3>
                                    <FieldItem icon={User} value={formData.reporter_name} placeholder="Nombre pendiente..." />
                                    <FieldItem icon={Briefcase} value={formData.reporter_position} placeholder="Cargo pendiente..." />
                                    <FieldItem icon={MapPin} value={formData.reporter_service} placeholder="Servicio pendiente..." />
                                    {formData.reporter_extension && <FieldItem icon={Phone} value={`Ext. ${formData.reporter_extension}`} isOptional />}
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase">El Problema</h3>
                                    <FieldItem icon={FileText} value={formData.name} placeholder="Título pendiente..." />
                                    {formData.device_type && <FieldItem icon={Monitor} value={deviceLabels[formData.device_type] || formData.device_type} isOptional />}
                                    {formData.equipment_ecom && <FieldItem icon={Cpu} value={`ECOM: ${formData.equipment_ecom}`} isOptional />}
                                    {formData.priority && formData.priority !== '3' && <FieldItem icon={AlertTriangle} value={`Prioridad: ${priorityLabels[formData.priority]}`} isOptional />}
                                    {formData.content && (
                                        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                                            <p className="text-xs text-green-800 line-clamp-3">{formData.content}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormComplete() || processing}
                                    className="w-full bg-[#2c4370] hover:bg-[#3d5583] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                                >
                                    {processing ? 'Enviando...' : isFormComplete() ? '✓ Enviar Reporte' : 'Completa la conversación'}
                                </Button>
                                {!isFormComplete() && (
                                    <p className="text-xs text-gray-500 text-center mt-2">Conversa con Evarisbot para completar tu reporte</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-white/60 text-xs">
                        <p>Hospital Universitario del Valle - Gestión de la Información</p>
                    </div>
                </div>
            </div>
        </>
    );
}

// Componente de mensaje con animación
function AnimatedMessage({ message, isNew }: { message: Message; isNew: boolean }) {
    const messageRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (messageRef.current && isNew && !hasAnimated.current) {
            hasAnimated.current = true;
            const el = messageRef.current;
            const isUser = message.role === 'user';

            gsap.fromTo(el,
                { 
                    opacity: 0, 
                    scale: 0.8, 
                    x: isUser ? 60 : -60,
                    y: 15
                },
                { 
                    opacity: 1, 
                    scale: 1, 
                    x: 0,
                    y: 0,
                    duration: 0.5, 
                    ease: 'back.out(1.2)'
                }
            );
        }
    }, [isNew, message.role]);

    return (
        <div 
            ref={messageRef}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                message.role === 'user' 
                    ? 'bg-[#2c4370] text-white rounded-br-sm shadow-lg' 
                    : 'bg-white text-gray-700 shadow-md rounded-bl-sm border'
            }`}>
                {message.content}
            </div>
        </div>
    );
}

function FieldItem({ icon: Icon, value, placeholder, isOptional }: { icon: React.ElementType; value?: string; placeholder?: string; isOptional?: boolean }) {
    const filled = !!value;
    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg ${filled ? (isOptional ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200') : 'bg-gray-50 border border-gray-200'}`}>
            <Icon className={`w-4 h-4 ${filled ? (isOptional ? 'text-blue-600' : 'text-green-600') : 'text-gray-400'}`} />
            <span className={`text-sm truncate ${filled ? (isOptional ? 'text-blue-800' : 'text-green-800') : 'text-gray-400'}`}>
                {value || placeholder}
            </span>
        </div>
    );
}
