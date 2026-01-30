/**
 * Puter.js AI Helper
 * Wrapper para usar Puter.js AI desde React/TypeScript
 */

// Declarar el objeto global puter
declare global {
    interface Window {
        puter: {
            ai: {
                chat: (
                    messages: Array<{ role: string; content: string }> | string,
                    options?: {
                        model?: string;
                        stream?: boolean;
                        max_tokens?: number;
                        temperature?: number;
                    }
                ) => Promise<any>;
            };
        };
    }
}

interface PuterChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface PuterChatOptions {
    model?: string;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
}

/**
 * Enviar mensaje al chatbot usando Puter.js
 */
export async function sendPuterChat(
    messages: PuterChatMessage[],
    options: PuterChatOptions = {}
): Promise<string> {
    // Verificar que Puter esté disponible
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter.js no está cargado');
    }

    const defaultOptions: PuterChatOptions = {
        model: 'gpt-5-nano', // Modelo por defecto de Puter
        stream: false,
        max_tokens: 500,
        temperature: 0.1,
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        const response = await window.puter.ai.chat(messages, finalOptions);

        // Puter devuelve un objeto con message.content
        if (response && response.message && response.message.content) {
            return response.message.content;
        }

        // Si es un string directo
        if (typeof response === 'string') {
            return response;
        }

        throw new Error('Respuesta inválida de Puter.js');
    } catch (error) {
        console.error('Error en Puter.js:', error);
        throw error;
    }
}

/**
 * Verificar si Puter.js está disponible
 */
export function isPuterAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.puter;
}
