import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, CheckCircle } from 'lucide-react';

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
}

interface EvarisbotProps {
    onFillField: (field: string, value: string) => void;
    formData: FormData;
}

export function Evarisbot({ onFillField, formData }: EvarisbotProps) {
    const [isOpen, setIsOpen] = useState(false);
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

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/chatbot', {
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
            {showTooltip && !isOpen && (
                <div className="fixed bottom-24 right-6 z-40 animate-bounce">
                    <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-gray-700 max-w-[200px]">
                        <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                        ¿Necesitas ayuda? ¡Pregúntame! 🤖
                    </div>
                </div>
            )}

            {/* Botón flotante */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowTooltip(false);
                }}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    isOpen 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-[#2c4370] hover:bg-[#3d5583]'
                }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Panel del chat */}
            <div
                className={`fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
                    isOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
                }`}
            >
                {/* Header del chat */}
                <div className="bg-gradient-to-r from-[#2c4370] to-[#3d5583] px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold text-sm">Evarisbot</h3>
                            <p className="text-white/70 text-xs">Te ayudo a crear tu reporte</p>
                        </div>
                    </div>
                    {filledFields.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-white/80">
                            <CheckCircle className="w-3 h-3" />
                            <span>{filledFields.length} campo(s) completado(s)</span>
                        </div>
                    )}
                </div>

                {/* Área de mensajes */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
                <div className="p-3 bg-white border-t">
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
        </>
    );
}
