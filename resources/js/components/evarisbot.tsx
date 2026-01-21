import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { MessageCircle, X, Send, Bot, CheckCircle } from 'lucide-react';
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
    name: string;
    content: string;
    priority: string;
    device_type: string;
    equipment_ecom: string;
}

interface EvarisbotProps {
    onFillField: (field: string, value: string) => void;
    formData: FormData;
}

export function Evarisbot({ onFillField, formData }: EvarisbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! 👋 Soy Evarisbot y estoy aquí para ayudarte a reportar tu problema. Para comenzar, ¿me podrías decir tu nombre completo?',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);
    const [filledFields, setFilledFields] = useState<string[]>([]);
    
    const bubbleRef = useRef<HTMLButtonElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const chatContentRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Ocultar tooltip después de 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => setShowTooltip(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Animación de apertura con GSAP
    const openChat = () => {
        if (isAnimating || isOpen) return;
        setIsAnimating(true);
        setShowTooltip(false);

        const bubble = bubbleRef.current;
        const chat = chatRef.current;
        const content = chatContentRef.current;

        if (!bubble || !chat || !content) return;

        // Timeline para la animación
        const tl = gsap.timeline({
            onComplete: () => {
                setIsOpen(true);
                setIsAnimating(false);
            }
        });

        // Ocultar contenido del chat inicialmente
        gsap.set(content, { opacity: 0 });
        gsap.set(chat, { 
            display: 'flex',
            flexDirection: 'column',
            width: 56, 
            height: 56, 
            borderRadius: 28,
            opacity: 1,
            bottom: 24,
            right: 24
        });

        // Animar la burbuja desapareciendo
        tl.to(bubble, {
            scale: 0,
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in'
        });

        // Expandir el chat desde la posición de la burbuja
        tl.to(chat, {
            width: window.innerWidth < 640 ? 320 : 384,
            height: 460,
            borderRadius: 16,
            bottom: 24,
            right: 24,
            duration: 0.4,
            ease: 'power3.out'
        }, '-=0.1');

        // Mostrar el contenido del chat
        tl.to(content, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, '-=0.15');
    };

    // Animación de cierre con GSAP
    const closeChat = () => {
        if (isAnimating || !isOpen) return;
        setIsAnimating(true);

        const bubble = bubbleRef.current;
        const chat = chatRef.current;
        const content = chatContentRef.current;

        if (!bubble || !chat || !content) return;

        const tl = gsap.timeline({
            onComplete: () => {
                setIsOpen(false);
                setIsAnimating(false);
                gsap.set(chat, { display: 'none' });
            }
        });

        // Ocultar contenido del chat
        tl.to(content, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in'
        });

        // Contraer el chat a la burbuja
        tl.to(chat, {
            width: 56,
            height: 56,
            borderRadius: 28,
            duration: 0.35,
            ease: 'power3.inOut'
        }, '-=0.1');

        // Mostrar la burbuja
        tl.to(bubble, {
            scale: 1,
            opacity: 1,
            duration: 0.25,
            ease: 'back.out(1.7)'
        }, '-=0.15');
    };

    // Inicializar estados GSAP
    useLayoutEffect(() => {
        if (chatRef.current) {
            gsap.set(chatRef.current, { display: 'none', opacity: 0 });
        }
        if (bubbleRef.current) {
            gsap.set(bubbleRef.current, { scale: 1, opacity: 1 });
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/chatbot-puter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: userMessage,
                    context: messages.slice(-8).map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    currentFormData: formData,
                    filledFields: filledFields,
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // Si hay campos para llenar, los llenamos
                if (data.fields && typeof data.fields === 'object') {
                    const newFilledFields: string[] = [...filledFields];
                    Object.entries(data.fields).forEach(([field, value]) => {
                        if (value && typeof value === 'string' && value.trim()) {
                            onFillField(field, value);
                            if (!newFilledFields.includes(field)) {
                                newFilledFields.push(field);
                            }
                        }
                    });
                    setFilledFields(newFilledFields);
                }
                setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Lo siento, tuve un problema. ¿Puedes intentar de nuevo?' 
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Error de conexión. Verifica tu internet e intenta de nuevo.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Tooltip de ayuda */}
            {showTooltip && !isOpen && !isAnimating && (
                <div className="fixed bottom-24 right-6 z-40 animate-bounce">
                    <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-gray-700 max-w-[200px]">
                        <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                        ¿Necesitas ayuda? ¡Pregúntame! 🤖
                    </div>
                </div>
            )}

            {/* Botón flotante (burbuja) */}
            <button
                ref={bubbleRef}
                onClick={openChat}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-[#2c4370] hover:bg-[#3d5583] hover:scale-110 transition-colors cursor-pointer"
                style={{ pointerEvents: isOpen || isAnimating ? 'none' : 'auto' }}
            >
                <MessageCircle className="w-6 h-6 text-white" />
            </button>

            {/* Panel del chat */}
            <div
                ref={chatRef}
                className="fixed z-50 bg-[#2c4370] shadow-2xl overflow-hidden"
                style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
            >
                <div ref={chatContentRef} className="flex flex-col h-full w-full">
                    {/* Header del chat */}
                    <div className="bg-gradient-to-r from-[#2c4370] to-[#3d5583] px-4 py-3 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm">Evarisbot</h3>
                                <p className="text-white/70 text-xs">Te ayudo a crear tu reporte</p>
                            </div>
                            {/* Botón X para cerrar */}
                            <button
                                onClick={closeChat}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        {filledFields.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-white/80">
                                <CheckCircle className="w-3 h-3" />
                                <span>{filledFields.length} campo(s) completado(s)</span>
                            </div>
                        )}
                    </div>

                    {/* Área de mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-[#2c4370] text-white rounded-br-md'
                                            : 'bg-white text-gray-700 shadow-sm rounded-bl-md'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm text-sm">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t flex-shrink-0 rounded-b-2xl">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 px-3 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-[#2c4370]/50"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 bg-[#2c4370] text-white rounded-full flex items-center justify-center hover:bg-[#3d5583] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
