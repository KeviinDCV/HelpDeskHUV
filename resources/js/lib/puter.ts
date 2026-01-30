/**
 * Puter.js AI Helper
 * Wrapper para usar Puter.js AI desde React/TypeScript
 */

// Estado de autenticación
let authenticationAttempted = false;
let isAuthenticated = false;

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
 * IMPORTANTE: Esta función DEBE ser llamada desde una acción del usuario (click)
 * para que el popup de autenticación no sea bloqueado por el navegador.
 */
async function ensureAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter.js no está cargado');
    }

    // Si ya verificamos y está autenticado, no hacer nada
    if (isAuthenticated) {
        return true;
    }

    try {
        // Verificar si ya está autenticado
        const signedIn = await window.puter.auth.isSignedIn();

        if (signedIn) {
            isAuthenticated = true;
            console.log('Puter: Usuario ya autenticado');
            return true;
        }

        // Si no está autenticado y no hemos intentado aún
        if (!authenticationAttempted) {
            authenticationAttempted = true;
            console.log('Puter: Iniciando autenticación con usuario temporal...');

            try {
                // Intentar crear usuario temporal (esto abrirá popup pero debería cerrarse rápido)
                await window.puter.auth.signIn({ attempt_temp_user_creation: true });
                isAuthenticated = true;
                console.log('Puter: Autenticación exitosa');
                return true;
            } catch (signInError) {
                console.warn('Puter: Error en signIn:', signInError);
                // Intentar continuar de todos modos
                return false;
            }
        }

        return isAuthenticated;
    } catch (error) {
        console.warn('Puter: Error verificando autenticación:', error);
        return false;
    }
}

/**
 * Enviar mensaje al chatbot usando Puter.js
 * IMPORTANTE: Esta función debe ser llamada desde un evento de click del usuario
 */
export async function sendPuterChat(
    messages: PuterChatMessage[],
    options: PuterChatOptions = {}
): Promise<string> {
    // Verificar que Puter esté disponible
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter.js no está cargado');
    }

    // Intentar asegurar autenticación (esto funciona porque viene de un click del usuario)
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
    } catch (error: any) {
        // Si el error es de autenticación, intentar una vez más
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.log('Puter: Reintentando autenticación...');
            authenticationAttempted = false; // Reset para reintentar
            await ensureAuthenticated();

            // Reintentar el chat
            const response = await window.puter.ai.chat(messages, finalOptions);
            if (response && response.message && response.message.content) {
                return response.message.content;
            }
            if (typeof response === 'string') {
                return response;
            }
        }

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

/**
 * Forzar inicio de sesión manualmente (para usar en un botón si es necesario)
 */
export async function forceSignIn(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.puter) {
        return false;
    }

    try {
        await window.puter.auth.signIn({ attempt_temp_user_creation: true });
        isAuthenticated = true;
        return true;
    } catch (error) {
        console.error('Error en signIn manual:', error);
        return false;
    }
}
