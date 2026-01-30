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
            auth: {
                signIn: (options?: { attempt_temp_user_creation?: boolean }) => Promise<any>;
                isSignedIn: () => Promise<boolean>;
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
 * Asegurar que el usuario esté autenticado en Puter
 * Si no está autenticado, intenta crear un usuario temporal automáticamente
 */
async function ensureAuthenticated(): Promise<void> {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter.js no está cargado');
    }

    try {
        // Verificar si ya está autenticado
        const isSignedIn = await window.puter.auth.isSignedIn();

        if (!isSignedIn) {
            console.log('Puter: Usuario no autenticado, creando sesión temporal...');
            // Intentar crear usuario temporal automáticamente
            await window.puter.auth.signIn({ attempt_temp_user_creation: true });
            console.log('Puter: Sesión temporal creada exitosamente');
        }
    } catch (error) {
        console.warn('Puter: Error en autenticación automática:', error);
        // Continuar de todos modos, el chat puede manejar esto
    }
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

    // Asegurar autenticación antes de hacer el chat
    await ensureAuthenticated();

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
