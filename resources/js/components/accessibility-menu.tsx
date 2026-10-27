import { btn } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import {
    Accessibility,
    AlignJustify,
    Contrast,
    Eye,
    MousePointer2,
    RotateCcw,
    Type,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

interface AccessibilitySettings {
    fontSize: number;
    highContrast: boolean;
    grayscale: boolean;
    textSpacing: boolean;
    largeCursor: boolean;
    readingGuide: boolean;
}

const defaultSettings: AccessibilitySettings = {
    fontSize: 100,
    highContrast: false,
    grayscale: false,
    textSpacing: false,
    largeCursor: false,
    readingGuide: false,
};

/** Aplica los ajustes a la raíz del documento (fuera del componente: no depende de su estado). */
function applySettings(s: AccessibilitySettings) {
    const root = document.documentElement;

    // Tamaño de fuente
    root.style.fontSize = `${s.fontSize}%`;

    // Alto contraste
    if (s.highContrast) {
        root.classList.add('high-contrast');
    } else {
        root.classList.remove('high-contrast');
    }

    // Escala de grises
    if (s.grayscale) {
        root.classList.add('grayscale-mode');
    } else {
        root.classList.remove('grayscale-mode');
    }

    // Espaciado de texto
    if (s.textSpacing) {
        root.classList.add('text-spacing');
    } else {
        root.classList.remove('text-spacing');
    }

    // Cursor grande
    if (s.largeCursor) {
        root.classList.add('large-cursor');
    } else {
        root.classList.remove('large-cursor');
    }
}

export function AccessibilityMenu() {
    const [isOpen, setIsOpen] = useState(false);
    // Lo guardado se lee al crear el estado; el efecto de abajo lo aplica y lo vuelve a guardar
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        try {
            const saved = localStorage.getItem('accessibility_settings');
            return saved
                ? { ...defaultSettings, ...JSON.parse(saved) }
                : defaultSettings;
        } catch {
            return defaultSettings; // sin almacenamiento o dato dañado
        }
    });

    // Referencia al botón disparador para devolverle el foco al cerrar el panel
    const triggerRef = useRef<HTMLButtonElement>(null);

    // La guía de lectura se posiciona escribiendo directo al DOM (cero re-renders por mousemove)
    const guideRef = useRef<HTMLDivElement>(null);
    const guidePositionRef = useRef(0);

    // Cierra el panel y devuelve el foco al botón que lo abrió
    const closePanel = useCallback(() => {
        setIsOpen(false);
        triggerRef.current?.focus();
    }, []);

    const contenedorRef = useRef<HTMLDivElement>(null);

    // Guardar y aplicar cambios
    useEffect(() => {
        try {
            localStorage.setItem(
                'accessibility_settings',
                JSON.stringify(settings),
            );
        } catch {
            /* sin almacenamiento: se aplica igual, solo que no se recuerda */
        }
        applySettings(settings);
    }, [settings]);

    // Los ajustes son de esta página: al salir a otra sin recargar (el enlace «Volver al
    // tablero»), el tamaño de letra y el alto contraste no deben quedarse aplicados allá.
    useEffect(() => {
        return () => {
            const root = document.documentElement;
            root.style.fontSize = '';
            root.classList.remove(
                'high-contrast',
                'grayscale-mode',
                'text-spacing',
                'large-cursor',
            );
        };
    }, []);

    // Un clic fuera del panel lo cierra (sin mover el foco: ya está donde se hizo clic)
    useEffect(() => {
        if (!isOpen) return;
        const fuera = (e: PointerEvent) => {
            if (!contenedorRef.current?.contains(e.target as Node))
                setIsOpen(false);
        };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [isOpen]);

    // Guía de lectura - seguir el mouse.
    // Se escribe directamente al DOM y se agrupan los eventos con requestAnimationFrame:
    // ningún mousemove provoca un re-render de React.
    useEffect(() => {
        if (!settings.readingGuide) return;

        let rafId: number | null = null;

        const applyPosition = () => {
            rafId = null;
            if (guideRef.current) {
                guideRef.current.style.transform = `translateY(${guidePositionRef.current}px)`;
            }
        };

        // Restaurar la última posición conocida al reactivar la guía
        applyPosition();

        const handleMouseMove = (e: MouseEvent) => {
            guidePositionRef.current = e.clientY;
            if (rafId === null) {
                rafId = requestAnimationFrame(applyPosition);
            }
        };

        window.addEventListener('mousemove', handleMouseMove, {
            passive: true,
        });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [settings.readingGuide]);

    // Cerrar el panel con la tecla Escape (devolviendo el foco al botón disparador)
    useEffect(() => {
        if (!isOpen) return;
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePanel();
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [isOpen, closePanel]);

    const increaseFontSize = () => {
        if (settings.fontSize < 150) {
            setSettings({ ...settings, fontSize: settings.fontSize + 10 });
        }
    };

    const decreaseFontSize = () => {
        if (settings.fontSize > 80) {
            setSettings({ ...settings, fontSize: settings.fontSize - 10 });
        }
    };

    const toggleSetting = (key: keyof AccessibilitySettings) => {
        if (key === 'fontSize') return;
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const resetAll = () => {
        setSettings(defaultSettings);
    };

    return (
        <>
            {/* Estilos CSS para accesibilidad */}
            <style>{`
                /* Alto contraste - Modo oscuro con colores institucionales */
                .high-contrast {
                    --hc-bg: #000000;
                    --hc-bg-secondary: #0a1628;
                    --hc-text: #ffffff;
                    --hc-text-secondary: #93c5fd;
                    --hc-border: #60a5fa;
                    --hc-link: #67e8f9;
                    --hc-button-bg: #1e3a5f;
                    --hc-button-text: #ffffff;
                    --hc-input-bg: #0a1628;
                    --hc-accent: #60a5fa;
                }
                
                .high-contrast,
                .high-contrast body {
                    background-color: var(--hc-bg) !important;
                    color: var(--hc-text) !important;
                }
                
                /* Contenedores y cards */
                .high-contrast div,
                .high-contrast section,
                .high-contrast article,
                .high-contrast aside,
                .high-contrast main,
                .high-contrast header,
                .high-contrast footer,
                .high-contrast nav {
                    background-color: var(--hc-bg) !important;
                    color: var(--hc-text) !important;
                    border-color: var(--hc-border) !important;
                }
                
                /* Cards y paneles con fondo */
                .high-contrast [class*="bg-white"],
                .high-contrast [class*="bg-gray"],
                .high-contrast [class*="bg-slate"],
                .high-contrast [class*="bg-blue"],
                .high-contrast [class*="bg-green"],
                .high-contrast [class*="bg-red"],
                .high-contrast [class*="bg-yellow"],
                .high-contrast [class*="bg-orange"] {
                    background-color: var(--hc-bg-secondary) !important;
                    color: var(--hc-text) !important;
                }
                
                /* Textos - asegurar visibilidad */
                .high-contrast p,
                .high-contrast span,
                .high-contrast label,
                .high-contrast h1,
                .high-contrast h2,
                .high-contrast h3,
                .high-contrast h4,
                .high-contrast h5,
                .high-contrast h6,
                .high-contrast li,
                .high-contrast td,
                .high-contrast th {
                    color: var(--hc-text) !important;
                }
                
                /* Textos secundarios/grises - azul claro para contraste */
                .high-contrast [class*="text-gray"],
                .high-contrast [class*="text-slate"],
                .high-contrast [class*="text-zinc"],
                .high-contrast [class*="text-neutral"] {
                    color: var(--hc-text-secondary) !important;
                }
                
                /* Enlaces */
                .high-contrast a {
                    color: var(--hc-link) !important;
                    text-decoration: underline !important;
                }
                
                .high-contrast a:hover,
                .high-contrast a:focus {
                    color: #ffffff !important;
                    background-color: var(--hc-accent) !important;
                    outline: 2px solid var(--hc-accent) !important;
                }
                
                /* Botones */
                .high-contrast button,
                .high-contrast [role="button"],
                .high-contrast input[type="submit"],
                .high-contrast input[type="button"] {
                    background-color: var(--hc-button-bg) !important;
                    color: var(--hc-button-text) !important;
                    border: 2px solid var(--hc-border) !important;
                }
                
                .high-contrast button:hover,
                .high-contrast button:focus,
                .high-contrast [role="button"]:hover,
                .high-contrast [role="button"]:focus {
                    background-color: var(--hc-accent) !important;
                    color: #000000 !important;
                    outline: 3px solid var(--hc-accent) !important;
                }
                
                /* Inputs */
                .high-contrast input,
                .high-contrast textarea,
                .high-contrast select {
                    background-color: var(--hc-input-bg) !important;
                    color: var(--hc-text) !important;
                    border: 2px solid var(--hc-border) !important;
                }
                
                .high-contrast input::placeholder,
                .high-contrast textarea::placeholder {
                    color: #6b7280 !important;
                }
                
                .high-contrast input:focus,
                .high-contrast textarea:focus,
                .high-contrast select:focus {
                    outline: 3px solid var(--hc-accent) !important;
                    border-color: var(--hc-accent) !important;
                }
                
                /* Imágenes - agregar borde para visibilidad */
                .high-contrast img {
                    border: 2px solid var(--hc-border) !important;
                }
                
                /* Iconos SVG */
                .high-contrast svg {
                    color: var(--hc-text) !important;
                    fill: currentColor !important;
                }
                
                /* Bordes generales */
                .high-contrast [class*="border"] {
                    border-color: var(--hc-border) !important;
                }
                
                /* Sombras - eliminar para claridad */
                .high-contrast [class*="shadow"] {
                    box-shadow: none !important;
                    border: 2px solid var(--hc-border) !important;
                }
                
                /* Badges y etiquetas */
                .high-contrast [class*="badge"],
                .high-contrast [class*="tag"],
                .high-contrast [class*="chip"] {
                    background-color: var(--hc-accent) !important;
                    color: #000000 !important;
                    border: 1px solid var(--hc-border) !important;
                }

                /* Escala de grises */
                .grayscale-mode {
                    filter: grayscale(100%) !important;
                }
                
                /* Espaciado de texto - mejora legibilidad */
                .text-spacing {
                    letter-spacing: 0.12em !important;
                    word-spacing: 0.16em !important;
                }
                
                .text-spacing p,
                .text-spacing span,
                .text-spacing div,
                .text-spacing label,
                .text-spacing input,
                .text-spacing textarea,
                .text-spacing button {
                    line-height: 1.8 !important;
                    letter-spacing: 0.12em !important;
                    word-spacing: 0.16em !important;
                }
                
                /* Cursor grande */
                .large-cursor, .large-cursor * {
                    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='1'%3E%3Cpath d='M4 4l7 19 2.5-7.5L21 13z'/%3E%3C/svg%3E") 0 0, auto !important;
                }
                
                /* Guía de lectura */
                .reading-guide-line {
                    position: fixed;
                    left: 0;
                    right: 0;
                    height: 40px;
                    background: rgba(96, 165, 250, 0.25);
                    pointer-events: none;
                    z-index: 9998;
                    border-top: 2px solid #60a5fa;
                    border-bottom: 2px solid #60a5fa;
                }
            `}</style>

            {/* Guía de lectura: la posición la actualiza el handler de mousemove vía guideRef */}
            {settings.readingGuide && (
                <div
                    ref={guideRef}
                    className="reading-guide-line"
                    style={{
                        top: -20,
                        transform: 'translateY(0px)',
                        willChange: 'transform',
                    }}
                />
            )}

            {/* Botón de accesibilidad: va en la cabecera de la página. Antes era una burbuja fija
                en la esquina inferior izquierda que, en el celular, tapaba el campo del chat. */}
            <div ref={contenedorRef} className="relative">
                <button
                    id="accessibility-button"
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(btn.ghost, 'px-2.5 sm:px-3')}
                    aria-expanded={isOpen}
                    aria-controls="accessibility-panel"
                >
                    <Accessibility aria-hidden="true" />
                    <span className="hidden sm:inline">Accesibilidad</span>
                    <span className="sr-only sm:hidden">
                        Opciones de accesibilidad
                    </span>
                </button>

                {isOpen && (
                    <div
                        id="accessibility-panel"
                        role="dialog"
                        aria-label="Opciones de accesibilidad"
                        className="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden surface-card motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
                    >
                        <div className="flex items-center justify-between px-4 py-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <Accessibility
                                    className="size-4 text-huv-ink"
                                    aria-hidden="true"
                                />
                                Accesibilidad
                            </p>
                            <button
                                type="button"
                                onClick={closePanel}
                                className="flex size-7 items-center justify-center rounded-md text-gray-500 focus-ring hover:bg-gray-900/5 hover:text-gray-900 dark:hover:bg-white/10"
                                aria-label="Cerrar"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                        <div
                            aria-hidden="true"
                            className="h-px bg-gray-900/[0.07] dark:bg-white/10"
                        />

                        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
                            <div>
                                <p
                                    id="tamano-texto"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                                >
                                    <Type
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Tamaño de texto
                                </p>
                                <div
                                    role="group"
                                    aria-labelledby="tamano-texto"
                                    className="mt-2 flex items-center gap-2"
                                >
                                    <button
                                        type="button"
                                        onClick={decreaseFontSize}
                                        disabled={settings.fontSize <= 80}
                                        className={opcionClase}
                                        aria-label="Reducir tamaño de texto"
                                    >
                                        <ZoomOut
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        A-
                                    </button>
                                    <span
                                        className="w-14 text-center text-sm font-medium text-gray-700 tabular-nums"
                                        aria-live="polite"
                                    >
                                        {settings.fontSize}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={increaseFontSize}
                                        disabled={settings.fontSize >= 150}
                                        className={opcionClase}
                                        aria-label="Aumentar tamaño de texto"
                                    >
                                        <ZoomIn
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        A+
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                {OPCIONES.map(({ clave, etiqueta, Icono }) => (
                                    <button
                                        key={clave}
                                        type="button"
                                        onClick={() => toggleSetting(clave)}
                                        aria-pressed={settings[clave]}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm focus-ring transition-colors',
                                            settings[clave]
                                                ? 'bg-huv text-white'
                                                : 'bg-[#f3f4f6] text-gray-700 hover:bg-[#e5e7eb] dark:bg-white/[0.06] dark:hover:bg-white/10',
                                        )}
                                    >
                                        <Icono
                                            className="size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span className="flex-1 font-medium">
                                            {etiqueta}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'text-xs',
                                                settings[clave]
                                                    ? 'text-white/80'
                                                    : 'text-gray-500',
                                            )}
                                        >
                                            {settings[clave]
                                                ? 'Activado'
                                                : 'Desactivado'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={resetAll}
                                className={cn(btn.secondary, 'w-full')}
                            >
                                <RotateCcw aria-hidden="true" />
                                Restablecer todo
                            </button>
                            <p className="text-center text-xs text-gray-500">
                                Las preferencias se guardan en este navegador.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

const opcionClase =
    'focus-ring flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-[#f3f4f6] text-sm text-gray-700 transition-colors hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.06] dark:hover:bg-white/10';

/** La guía de lectura no tiene ícono en lucide: una barra horizontal. */
function IconoGuia({ className }: { className?: string }) {
    return (
        <span className={cn('flex items-center justify-center', className)}>
            <span className="h-1 w-full rounded bg-current" />
        </span>
    );
}

const OPCIONES: {
    clave: Exclude<keyof AccessibilitySettings, 'fontSize'>;
    etiqueta: string;
    Icono: (p: { className?: string }) => ReactNode;
}[] = [
    { clave: 'highContrast', etiqueta: 'Alto contraste', Icono: Contrast },
    { clave: 'grayscale', etiqueta: 'Escala de grises', Icono: Eye },
    {
        clave: 'textSpacing',
        etiqueta: 'Espaciado de texto',
        Icono: AlignJustify,
    },
    { clave: 'largeCursor', etiqueta: 'Cursor grande', Icono: MousePointer2 },
    { clave: 'readingGuide', etiqueta: 'Guía de lectura', Icono: IconoGuia },
];
