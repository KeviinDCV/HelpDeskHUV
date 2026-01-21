import { Head, router, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, Bot, FileText, Monitor, Cpu, HelpCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AccessibilityMenu } from '@/components/accessibility-menu';
import { sendPuterChat, isPuterAvailable } from '@/lib/puter';

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
                },
                {
                    element: '#accessibility-button',
                    popover: {
                        title: 'Opciones de Accesibilidad',
                        description: 'Aquí puedes ajustar la visualización según tus necesidades:\n• Aumentar o reducir el tamaño del texto\n• Activar alto contraste\n• Espaciado de texto para mejor lectura\n• Cursor grande\n• Guía de lectura',
                        side: 'right',
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
            // Verificar que Puter.js esté disponible
            if (!isPuterAvailable()) {
                throw new Error('Puter.js no está disponible');
            }

            // Obtener lista de ECOMs y categorías para el prompt
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Obtener datos del sistema (ECOMs y categorías) desde el backend
            const systemDataResponse = await fetch('/chatbot-system-data', {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken || '' },
                credentials: 'include',
            });
            
            const systemData = await systemDataResponse.json();
            
            // Construir el system prompt
            const systemPrompt = buildSystemPrompt(formData, filledFields, systemData.ecomList || [], systemData.categories || []);
            
            // Preparar mensajes para Puter.js
            const puterMessages = [
                { role: 'system' as const, content: systemPrompt },
                ...messages.slice(-4).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'user' as const, content: userMessage }
            ];

            // Llamar a Puter.js
            const assistantResponse = await sendPuterChat(puterMessages, {
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 500,
            });

            // Debug: ver qué devuelve la IA
            console.log('Puter.js response:', assistantResponse);

            // Parsear la respuesta para extraer campos y mensaje
            const parsed = parseResponse(assistantResponse);
            
            console.log('Parsed response:', parsed);

            if (parsed.fields && typeof parsed.fields === 'object' && Object.keys(parsed.fields).length > 0) {
                console.log('Fields received:', parsed.fields);
                
                const newFilledFields: string[] = [...filledFields];
                const invalidValues = ['valor', 'valor1', 'valor2', 'dato_del_usuario', 'valor que dijo el usuario', 'titulo del problema', 'descripcion detallada', 'pendiente', ''];

                // Procesar campos - crear objeto con los nuevos valores
                const fieldsToProcess = { ...parsed.fields };

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
                    } else if (parsed.message && parsed.message.trim()) {
                        setMessages(prev => [...prev, { role: 'assistant', content: parsed.message }]);
                    }
                } else if (parsed.message && parsed.message.trim()) {
                    setMessages(prev => [...prev, { role: 'assistant', content: parsed.message }]);
                }
        } catch (error) {
            console.error('Error en Puter.js:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Verifica tu internet.' }]);
        } finally {
            setIsLoading(false);
            // Restaurar foco después de que termine la carga
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    };

    // Función para parsear la respuesta del modelo
    const parseResponse = (response: string): { message: string; fields: Record<string, string> } => {
        let fields: Record<string, string> = {};
        let message = response;
        const validFields = ['reporter_name', 'reporter_position', 'reporter_service', 
                           'reporter_extension', 'name', 'content', 'device_type', 
                           'equipment_ecom', 'priority', 'itilcategories_id'];

        // 1. Buscar patrón {FIELDS}...{/FIELDS}
        const fieldsMatch = response.match(/\{FIELDS\}(.*?)\{\/FIELDS\}/si);
        if (fieldsMatch) {
            try {
                const jsonStr = fieldsMatch[1].trim();
                const decoded = JSON.parse(jsonStr);
                if (typeof decoded === 'object') {
                    fields = Object.fromEntries(
                        Object.entries(decoded).filter(([key]) => validFields.includes(key))
                    );
                }
                message = response.replace(/\{FIELDS\}.*?\{\/FIELDS\}/si, '').trim();
            } catch (e) {
                console.error('Error parsing FIELDS:', e);
            }
        } 
        // 2. Buscar JSON suelto con múltiples campos
        else {
            const jsonMatch = response.match(/\{[^{}]*"[a-z_]+"\s*:\s*"[^"]*"[^{}]*\}/si);
            if (jsonMatch) {
                try {
                    const decoded = JSON.parse(jsonMatch[0]);
                    if (typeof decoded === 'object') {
                        const filtered = Object.fromEntries(
                            Object.entries(decoded).filter(([key]) => validFields.includes(key))
                        );
                        if (Object.keys(filtered).length > 0) {
                            fields = filtered;
                            message = response.replace(jsonMatch[0], '').trim();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                }
            }
        }

        // Limpiar mensaje de artefactos
        message = message.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();

        // Si el mensaje quedó vacío, usar uno por defecto
        if (!message) {
            message = 'Entendido. ¿Algo más que necesites?';
        }

        return { message, fields };
    };

    // Función para construir el system prompt
    const buildSystemPrompt = (formData: FormData, filledFields: string[], ecomList: string[], categories: Array<{id: number, name: string}>): string => {
        const currentData = Object.entries(formData)
            .filter(([_, value]) => value && value !== '')
            .map(([key, value]) => `${key}: "${value}"`)
            .join(", ");
        
        const currentDataStr = currentData || "Ninguno";
        const ecomSample = ecomList.slice(0, 15).join(', ');
        const categoryListStr = categories.map(c => `  - ${c.id} = ${c.name}`).join("\n");

        return `Eres Evarisbot, asistente del Hospital Universitario del Valle para reportar problemas técnicos.

DATOS YA CAPTURADOS: ${currentDataStr}

=== INSTRUCCIÓN CRÍTICA ===
1. EXTRAE TODOS los datos del mensaje del usuario EN UNA SOLA RESPUESTA
2. NUNCA pidas un dato que ya está en "DATOS YA CAPTURADOS"
3. NUNCA pidas un dato que el usuario acaba de dar en su mensaje
4. Si el usuario da múltiples datos, captúralos TODOS en el JSON
5. GUARDA TODA la información que el usuario mencione sobre el problema - será analizada después

=== FORMATO OBLIGATORIO ===
SIEMPRE que el usuario proporcione cualquier dato, debes responder con este formato EXACTO:
{FIELDS}{"campo1": "valor1", "campo2": "valor2"}{/FIELDS}
Mensaje breve aquí.

IMPORTANTE: Si el usuario da un dato (nombre, cargo, ext, etc), SIEMPRE incluye {FIELDS} con ese dato.

=== CAMPOS A CAPTURAR (EN ORDEN) ===
1. reporter_name: Nombre completo
2. reporter_position: Cargo (Administrativo/Médico/Enfermero/Técnico/Auxiliar/Otro)
3. reporter_service: Área/Servicio (Urgencias/Fisiatría/UCI/Laboratorio/Farmacia/etc)
4. reporter_extension: Extensión telefónica (4 dígitos)
5. name: Título corto del problema
6. content: Descripción COMPLETA del problema
7. device_type: computer|printer|monitor|phone|network
8. equipment_ecom: Código ECOM (solo si device_type es computer/monitor/network)
9. itilcategories_id: ID de categoría (ver lista abajo)
10. priority: 3 (siempre)

=== FLUJO OBLIGATORIO ===
1. Si NO hay reporter_name → Pedir nombre
2. Si hay nombre pero NO reporter_position → Pedir cargo
3. Si hay cargo pero NO reporter_service → Pedir área/servicio
4. Si hay servicio pero NO reporter_extension → Pedir extensión (4 dígitos)
5. Si hay extensión pero NO name/content → Pedir "¿Cuál es el problema que tienes?"
6. Si hay problema y device_type es computer/monitor/network → Pedir ECOM
7. Si tiene todos los datos → Decir "¡Listo! Revisa los datos y envía el reporte."

=== CATEGORÍAS DISPONIBLES (itilcategories_id) ===
${categoryListStr}

=== GUÍA DE CLASIFICACIÓN ===
- "internet", "red", "wifi" → RED (11)
- "programa", "SAP", "Excel", "sistema" → SOFTWARE (6)
- "no enciende", "lento", "pantalla azul" → HARDWARE (2)
- "impresora", "no imprime", "toner" → IMPRESIÓN (12)
- "teléfono", "sin tono", "llamadas" → TELÉFONO (17)

=== EJEMPLOS DE RESPUESTAS CORRECTAS ===

Usuario: "Mi nombre es Juan Pérez"
{FIELDS}{"reporter_name": "Juan Pérez"}{/FIELDS}
Gracias Juan. ¿Cuál es tu cargo?

Usuario: "Soy enfermero de UCI"
{FIELDS}{"reporter_position": "Enfermero", "reporter_service": "UCI"}{/FIELDS}
Perfecto. ¿Cuál es tu extensión telefónica?

Usuario: "1234"
{FIELDS}{"reporter_extension": "1234"}{/FIELDS}
Gracias. ¿Cuál es el problema que tienes?

Usuario: "No me abre SAP"
{FIELDS}{"name": "SAP no abre", "content": "El sistema SAP no abre", "device_type": "computer", "itilcategories_id": "6"}{/FIELDS}
Entendido. ¿Cuál es el código ECOM del computador? (Etiqueta en el CPU)

Usuario: "ecom12345"
{FIELDS}{"equipment_ecom": "ecom12345"}{/FIELDS}
¡Listo! Revisa los datos y envía el reporte.

=== REGLAS ESTRICTAS ===
- SIEMPRE responde en español
- SIEMPRE usa el formato {FIELDS}...{/FIELDS}
- NUNCA digas "Mensaje registrado" - sé específico
- NUNCA repitas preguntas sobre datos ya capturados
- Mensajes CORTOS (máximo 2 oraciones)
- NO uses emojis
- SIGUE EL FLUJO OBLIGATORIO en orden`;
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
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-xl font-bold text-[#2d3e5e] mb-2">¡Reporte Enviado!</h1>
                        <p className="text-slate-500 text-sm mb-6">Tu reporte ha sido recibido y será atendido por nuestro equipo técnico.</p>

                        <div className="bg-[#2d3e5e] text-white rounded-lg p-5 mb-6">
                            <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Número de caso</p>
                            <p className="text-3xl font-bold">#{flash.success.ticket_id}</p>
                        </div>

                        <p className="text-xs text-slate-400 mb-6">
                            Guarda este número para hacer seguimiento de tu caso.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#2d3e5e] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#3d5583] transition-colors text-sm"
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
            <div className="h-screen bg-gray-50 flex flex-col items-center p-3 sm:p-4 lg:p-6 overflow-hidden">
                {/* Header */}
                <header className="w-full max-w-6xl mb-2 sm:mb-3 lg:mb-4 flex flex-col items-center shrink-0">
                    <img 
                        src="/images/huv-h.png" 
                        alt="Hospital Universitario del Valle" 
                        className="h-12 sm:h-16 lg:h-20 object-contain mb-1 sm:mb-2"
                    />
                    <div className="text-center">
                        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[#2d3e5e] tracking-tight leading-none">Reporte Sistemas HUV</h1>
                        <p className="text-slate-400 text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1 hidden sm:block">Chatbot de Soporte Técnico</p>
                    </div>
                </header>

                {/* Main Content */}
                <main className="w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
                    {/* Chat Section */}
                    <section className="flex-1 lg:flex-none lg:col-span-8 bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden border border-slate-100 min-h-0">
                        {/* Chat Header */}
                        <div id="chat-header" className="bg-[#2d3e5e] p-4 flex items-center justify-between z-10">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden">
                                        <img src="/images/Evaris.png" alt="Evarisbot" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#2d3e5e] rounded-full"></div>
                                </div>
                                <div>
                                    <h2 className="text-white font-semibold text-sm">Evarisbot</h2>
                                    <p className="text-white/70 text-[10px] uppercase tracking-wider font-medium">En línea</p>
                                </div>
                            </div>
                            <button
                                id="help-button"
                                onClick={startTour}
                                className="text-white/50 hover:text-white transition-colors rounded-full p-2"
                                title="Ver tutorial"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div id="chat-messages" ref={messagesContainerRef} className="flex-1 bg-white p-3 sm:p-4 lg:p-6 overflow-y-auto flex flex-col space-y-4 sm:space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                            {/* Timestamp */}
                            <div className="flex justify-center">
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {messages.map((msg, index) => (
                                <AnimatedMessage
                                    key={index}
                                    message={msg}
                                    isNew={index === messages.length - 1}
                                />
                            ))}
                            {isLoading && (
                                <div className="flex items-start space-x-3 max-w-[90%]">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex-shrink-0 overflow-hidden">
                                        <img src="/images/Evaris.png" alt="Evarisbot" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-[#2d3e5e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-[#2d3e5e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-[#2d3e5e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div id="chat-input" className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                            <form className="relative flex items-center" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribe tu mensaje..."
                                    className="w-full bg-slate-50 text-slate-700 text-sm rounded-full py-3.5 pl-5 pr-14 focus:outline-none focus:ring-1 focus:ring-[#2d3e5e]/20 focus:bg-white transition-all border border-slate-200 placeholder-slate-400"
                                    autoFocus
                                />
                                <div className="absolute right-2 flex items-center">
                                    <button
                                        ref={sendButtonRef}
                                        type="submit"
                                        onClick={() => { sendMessage(); inputRef.current?.focus(); }}
                                        disabled={!input.trim() || isLoading}
                                        className="text-[#2d3e5e] hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-40"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                            <p className="text-[10px] text-slate-300 text-center mt-1.5 sm:mt-2 hidden sm:block">Presiona Enter para enviar</p>
                        </div>
                    </section>

                    {/* Summary Panel */}
                    <aside id="summary-panel" className="lg:order-none shrink-0 lg:flex-1 lg:col-span-4 flex flex-col lg:h-full">
                        <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col h-full border border-slate-100 overflow-hidden">
                            {/* Summary Header */}
                            <div className="p-3 sm:p-4 lg:p-5 bg-[#2d3e5e] shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                                        <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">Resumen</h3>
                                    </div>
                                    {/* Mobile: Show compact status */}
                                    <div className="flex items-center gap-2 lg:hidden">
                                        <span className={`w-2 h-2 rounded-full ${formData.reporter_name ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                                        <span className="text-[10px] text-white/70">
                                            {isFormComplete() ? 'Completo' : 'En progreso'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Content */}
                            <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                                {/* Mobile: Compact horizontal layout */}
                                <div className="lg:hidden flex flex-wrap gap-2 text-xs">
                                    <div className={`px-2 py-1 rounded-full border ${formData.reporter_name ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {formData.reporter_name || 'Nombre'}
                                    </div>
                                    <div className={`px-2 py-1 rounded-full border ${formData.reporter_position ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {formData.reporter_position || 'Cargo'}
                                    </div>
                                    <div className={`px-2 py-1 rounded-full border ${formData.reporter_service ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {formData.reporter_service || 'Servicio'}
                                    </div>
                                    {formData.name && (
                                        <div className="px-2 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-700 truncate max-w-[150px]">
                                            {formData.name}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop: Full timeline layout */}
                                <div className="hidden lg:block space-y-8">
                                {/* Quien Reporta */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quien Reporta</h4>
                                    <ul className="space-y-5 border-l border-slate-100 ml-1.5 pl-5 relative">
                                        <TimelineItem 
                                            label="Nombre" 
                                            value={formData.reporter_name} 
                                            placeholder="Pendiente..." 
                                            isActive={!formData.reporter_name}
                                        />
                                        <TimelineItem 
                                            label="Cargo" 
                                            value={formData.reporter_position} 
                                            placeholder="..." 
                                            isActive={!!formData.reporter_name && !formData.reporter_position}
                                        />
                                        <TimelineItem 
                                            label="Servicio" 
                                            value={formData.reporter_service} 
                                            placeholder="..." 
                                            isActive={!!formData.reporter_position && !formData.reporter_service}
                                        />
                                        {formData.reporter_extension && (
                                            <TimelineItem label="Extensión" value={formData.reporter_extension} />
                                        )}
                                    </ul>
                                </div>

                                {/* El Problema */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">El Problema</h4>
                                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <FileText className="w-4 h-4 text-slate-300 mt-0.5" />
                                        <div className="flex-1">
                                            <span className="block text-xs text-slate-400 mb-1">Descripción</span>
                                            {formData.name ? (
                                                <span className="block text-sm text-slate-800 font-medium">{formData.name}</span>
                                            ) : (
                                                <span className="block text-sm text-slate-300 italic">Título pendiente...</span>
                                            )}
                                            {formData.content && (
                                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{formData.content}</p>
                                            )}
                                        </div>
                                    </div>
                                    {formData.device_type && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                            <Monitor className="w-3.5 h-3.5" />
                                            <span>{deviceLabels[formData.device_type] || formData.device_type}</span>
                                        </div>
                                    )}
                                    {formData.equipment_ecom && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                            <Cpu className="w-3.5 h-3.5" />
                                            <span>ECOM: {formData.equipment_ecom}</span>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div id="submit-button" className="p-3 sm:p-4 lg:p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormComplete() || processing}
                                    className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                                        isFormComplete() && !processing
                                            ? 'bg-[#2d3e5e] hover:bg-[#3d5583] text-white shadow-sm hover:shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed opacity-80'
                                    }`}
                                >
                                    {processing ? 'Enviando...' : isFormComplete() ? '✓ Enviar Reporte' : 'Completa la conversación'}
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 mt-2 lg:mt-3 px-2 lg:px-4 leading-relaxed hidden sm:block">
                                    {isFormComplete() 
                                        ? 'Revisa los datos y envía tu reporte.'
                                        : 'Interactúa con el asistente para habilitar el envío del reporte.'
                                    }
                                </p>
                            </div>
                        </div>
                    </aside>
                </main>

                {/* Menú de Accesibilidad */}
                <AccessibilityMenu />
            </div>
        </>
    );
}

// Componente de mensaje con animación - Nuevo estilo chatbot
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
                    y: 20,
                    scale: 0.97,
                    transformOrigin: isUser ? 'bottom right' : 'bottom left'
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.35,
                    ease: 'power2.out',
                    clearProps: 'transform'
                }
            );
        }
    }, [isNew, message.role]);

    if (message.role === 'user') {
        return (
            <div ref={messageRef} className="flex justify-end">
                <div className="max-w-[80%] bg-[#2d3e5e] text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div ref={messageRef} className="flex items-start space-x-3 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex-shrink-0 overflow-hidden mt-1">
                <img src="/images/Evaris.png" alt="Evarisbot" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col space-y-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl rounded-tl-none text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                </div>
            </div>
        </div>
    );
}

// Componente Timeline para el resumen
function TimelineItem({ label, value, placeholder, isActive }: { label: string; value?: string; placeholder?: string; isActive?: boolean }) {
    const filled = !!value;
    return (
        <li className="relative">
            <span className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                filled ? 'bg-green-500' : isActive ? 'bg-orange-400' : 'bg-slate-200'
            }`}></span>
            <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium mb-1">{label}</span>
                <span className={`text-sm font-medium ${
                    filled ? 'text-slate-800' : 'text-slate-300 italic'
                }`}>
                    {value || placeholder}
                </span>
            </div>
        </li>
    );
}
