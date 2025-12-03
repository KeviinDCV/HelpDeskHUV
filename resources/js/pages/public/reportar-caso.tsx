import { Head, router, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, Bot, User, Briefcase, MapPin, Phone, FileText, AlertTriangle, Monitor, Cpu, HelpCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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
        { role: 'assistant', content: '¡Hola! 👋 Soy Evarisbot, tu asistente para reportar problemas técnicos en el Hospital. Vamos a crear tu reporte juntos.\n\n¿Me podrías decir tu nombre completo?' },
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

    // Tour para usuarios nuevos
    const startTour = () => {
        const driverObj = driver({
            showProgress: false,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            stagePadding: 8,
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Entendido',
            steps: [
                {
                    element: '#chat-header',
                    popover: {
                        title: 'Bienvenido a Evarisbot',
                        description: 'Soy tu asistente virtual para reportar problemas técnicos en el Hospital. Te guiaré paso a paso para crear tu reporte de manera fácil y rápida.',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '#chat-messages',
                    popover: {
                        title: 'Área de Conversación',
                        description: 'Aquí verás nuestra conversación. Te haré preguntas sobre tu problema y tú solo responde de forma natural, como si hablaras con un compañero.',
                        side: 'right',
                        align: 'center'
                    }
                },
                {
                    element: '#chat-input',
                    popover: {
                        title: 'Escribe tu mensaje',
                        description: 'Escribe aquí tus respuestas. Puedes contarme:\n• Tu nombre y cargo\n• Qué problema tienes\n• En qué equipo o sistema\n\nPresiona Enter o el botón azul para enviar.',
                        side: 'top',
                        align: 'center'
                    }
                },
                {
                    element: '#summary-panel',
                    popover: {
                        title: 'Resumen en Tiempo Real',
                        description: 'Mientras conversamos, iré completando este resumen automáticamente. Así podrás ver qué información ya tenemos y qué falta.',
                        side: 'left',
                        align: 'center'
                    }
                },
                {
                    element: '#submit-button',
                    popover: {
                        title: 'Enviar tu Reporte',
                        description: 'Cuando el formulario esté completo, este botón se activará. Haz clic para enviar tu reporte y recibirás un número de caso para dar seguimiento.',
                        side: 'top',
                        align: 'center'
                    }
                },
                {
                    element: '#help-button',
                    popover: {
                        title: '¿Necesitas ayuda?',
                        description: 'Si en cualquier momento necesitas ver este tutorial de nuevo, solo haz clic en este botón. ¡Estoy aquí para ayudarte!',
                        side: 'left',
                        align: 'center'
                    }
                }
            ],
            onDestroyed: () => {
                // Marcar que el usuario ya vio el tour
                localStorage.setItem('helpdesk_tour_completed', 'true');
            }
        });
        driverObj.drive();
    };

    // Verificar si es primera visita
    useEffect(() => {
        const tourCompleted = localStorage.getItem('helpdesk_tour_completed');
        if (!tourCompleted) {
            // Pequeño delay para que los elementos estén renderizados
            const timer = setTimeout(() => {
                startTour();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

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

        // Mostrar mensaje de feedback inmediato
        setMessages(prev => [...prev, { role: 'assistant', content: '📤 Enviando tu reporte... Por favor espera un momento.' }]);

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
                setMessages(prev => [...prev, { role: 'assistant', content: '❌ Hubo un problema al enviar. Por favor, intenta de nuevo.' }]);
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

            // Debug: ver qué devuelve la IA
            console.log('Chatbot response:', data);

            if (data.success) {
                if (data.fields && typeof data.fields === 'object' && Object.keys(data.fields).length > 0) {
                    console.log('Fields received:', data.fields);
                    
                    const newFilledFields: string[] = [...filledFields];
                    const invalidValues = ['valor', 'valor1', 'valor2', 'dato_del_usuario', 'valor que dijo el usuario', 'titulo del problema', 'descripcion detallada', 'pendiente', ''];

                    // Procesar campos - crear objeto con los nuevos valores
                    const fieldsToProcess = { ...data.fields };

                    // Detectar si hay ECOM en extensión y corregirlo
                    if (fieldsToProcess.reporter_extension &&
                        typeof fieldsToProcess.reporter_extension === 'string' &&
                        fieldsToProcess.reporter_extension.toLowerCase().includes('ecom')) {
                        if (!fieldsToProcess.equipment_ecom) {
                            fieldsToProcess.equipment_ecom = fieldsToProcess.reporter_extension.toLowerCase();
                        }
                        fieldsToProcess.reporter_extension = '';
                    }

                    // Si device_type es 'software', convertir a 'computer' (software corre en PC)
                    if (fieldsToProcess.device_type === 'software') {
                        fieldsToProcess.device_type = 'computer';
                    }

                    // Construir el nuevo formData directamente
                    const newFormData = { ...formData };

                    Object.entries(fieldsToProcess).forEach(([field, value]) => {
                        if (value && typeof value === 'string') {
                            const trimmedValue = value.trim().toLowerCase();
                            if (trimmedValue && !invalidValues.includes(trimmedValue)) {
                                const currentValue = formData[field as keyof FormData] || '';
                                if (!currentValue || value.trim().length > currentValue.length) {
                                    newFormData[field as keyof FormData] = value.trim();
                                    if (!newFilledFields.includes(field)) newFilledFields.push(field);
                                }
                            }
                        }
                    });

                    // Actualizar estado de una sola vez
                    setFormData(newFormData);
                    setFilledFields(newFilledFields);

                    // Verificar si el formulario está completo usando newFormData
                    const basicFieldsComplete = newFormData.reporter_name &&
                        newFormData.reporter_position &&
                        newFormData.reporter_service &&
                        newFormData.name &&
                        newFormData.content;

                    // computer, monitor, software y network requieren ECOM
                    // Solo printer y phone NO requieren ECOM
                    const needsEcomDevice = ['computer', 'monitor', 'software', 'network'].includes(newFormData.device_type || '');
                    const needsEcom = needsEcomDevice && !newFormData.equipment_ecom;
                    const formIsComplete = basicFieldsComplete && !needsEcom;

                    if (formIsComplete) {
                        setMessages(prev => [...prev, { role: 'assistant', content: '✅ ¡Listo! Tu reporte está completo. Revisa los datos y haz clic en "Enviar Reporte".' }]);
                    } else if (data.message && data.message.trim()) {
                        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
                    }
                } else if (data.message && data.message.trim()) {
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

    // Si hay éxito, mostrar pantalla de confirmación
    if (flash?.success) {
        return (
            <>
                <Head title="Reporte Enviado - HelpDesk HUV" />
                <div className="min-h-screen bg-gradient-to-br from-[#2c4370] to-[#1a2a4a] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Reporte Enviado!</h1>
                        <p className="text-gray-600 mb-6">Tu reporte ha sido recibido y será atendido por nuestro equipo técnico.</p>

                        <div className="bg-[#2c4370] text-white rounded-xl p-6 mb-6">
                            <p className="text-sm text-white/80 mb-1">Número de caso</p>
                            <p className="text-4xl font-bold">#{flash.success.ticket_id}</p>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Guarda este número para hacer seguimiento de tu caso.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#2c4370] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#3d5583] transition-colors"
                        >
                            Crear Nuevo Reporte
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Reportar Problema - HelpDesk HUV" />
            <div className="min-h-screen bg-gradient-to-br from-[#2c4370] to-[#1a2a4a] flex items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full p-2 shadow-lg">
                            <img 
                                src="/images/Logo.png" 
                                alt="HelpDesk HUV" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Reporte Sistemas HUV</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chat Principal */}
                        <div className="lg:col-span-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform-gpu" style={{ height: '700px' }}>
                            <div id="chat-header" className="bg-gradient-to-r from-[#2c4370] to-[#3d5583] px-8 py-6 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                                            <Bot className="w-9 h-9 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-white font-bold text-2xl tracking-wide">Evarisbot</h1>
                                            <p className="text-white/90 text-base font-medium">Asistente de Soporte - HUV</p>
                                        </div>
                                    </div>
                                    <button
                                        id="help-button"
                                        onClick={startTour}
                                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                        title="Ver tutorial"
                                    >
                                        <HelpCircle className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            <div id="chat-messages" className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                                {messages.map((msg, index) => (
                                    <AnimatedMessage
                                        key={index}
                                        message={msg}
                                        isNew={index === messages.length - 1}
                                    />
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-md border">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-3 h-3 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-3 h-3 bg-[#2c4370] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div id="chat-input" className="p-6 bg-white border-t flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe tu mensaje aquí..."
                                        className="flex-1 px-6 py-4 text-lg border-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2c4370]/50 focus:border-[#2c4370]"
                                        autoFocus
                                    />
                                    <button
                                        ref={sendButtonRef}
                                        onClick={() => { sendMessage(); inputRef.current?.focus(); }}
                                        disabled={!input.trim() || isLoading}
                                        className="w-16 h-16 bg-[#2c4370] text-white rounded-full flex items-center justify-center hover:bg-[#3d5583] disabled:opacity-50 transition-all shadow-lg"
                                    >
                                        <Send className="w-7 h-7" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Panel Resumen */}
                        <div id="summary-panel" className="rounded-2xl shadow-2xl overflow-hidden flex flex-col transform-gpu" style={{ height: '700px' }}>
                            <div className="bg-gradient-to-r from-[#3d5583] to-[#2c4370] px-6 py-5">
                                <h2 className="text-white font-semibold text-lg">📋 Resumen del Reporte</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Quien Reporta</h3>
                                    <FieldItem icon={User} value={formData.reporter_name} placeholder="Nombre pendiente..." />
                                    <FieldItem icon={Briefcase} value={formData.reporter_position} placeholder="Cargo pendiente..." />
                                    <FieldItem icon={MapPin} value={formData.reporter_service} placeholder="Servicio pendiente..." />
                                    {formData.reporter_extension && <FieldItem icon={Phone} value={`Ext. ${formData.reporter_extension}`} isOptional />}
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">El Problema</h3>
                                    <FieldItem icon={FileText} value={formData.name} placeholder="Título pendiente..." />
                                    {formData.device_type && <FieldItem icon={Monitor} value={deviceLabels[formData.device_type] || formData.device_type} isOptional />}
                                    {formData.equipment_ecom && <FieldItem icon={Cpu} value={`ECOM: ${formData.equipment_ecom}`} isOptional />}
                                    {formData.priority && formData.priority !== '3' && <FieldItem icon={AlertTriangle} value={`Prioridad: ${priorityLabels[formData.priority]}`} isOptional />}
                                    {formData.content && (
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm">
                                            <p className="text-sm text-green-900 leading-relaxed">{formData.content}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div id="submit-button" className="p-6 border-t bg-gray-50">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormComplete() || processing}
                                    className="w-full bg-[#2c4370] hover:bg-[#3d5583] text-white py-4 text-lg rounded-xl font-bold disabled:opacity-50 shadow-md transition-transform transform hover:scale-[1.02]"
                                >
                                    {processing ? 'Enviando...' : isFormComplete() ? '✓ Enviar Reporte' : 'Completa la conversación'}
                                </Button>
                                {!isFormComplete() && (
                                    <p className="text-sm text-gray-500 text-center mt-3 font-medium">Conversa con Evarisbot para completar tu reporte</p>
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
            <div className={`max-w-[85%] px-6 py-4 rounded-2xl text-lg leading-relaxed whitespace-pre-line shadow-md ${message.role === 'user'
                    ? 'bg-[#2c4370] text-white rounded-br-sm shadow-lg'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-sm border border-gray-100'
                }`}>
                {message.content}
            </div>
        </div>
    );
}

function FieldItem({ icon: Icon, value, placeholder, isOptional }: { icon: React.ElementType; value?: string; placeholder?: string; isOptional?: boolean }) {
    const filled = !!value;
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${filled ? (isOptional ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200') : 'bg-gray-50 border border-gray-200'}`}>
            <Icon className={`w-6 h-6 ${filled ? (isOptional ? 'text-blue-600' : 'text-green-600') : 'text-gray-400'}`} />
            <span className={`text-base font-medium truncate ${filled ? (isOptional ? 'text-blue-900' : 'text-green-900') : 'text-gray-500'}`}>
                {value || placeholder}
            </span>
        </div>
    );
}
