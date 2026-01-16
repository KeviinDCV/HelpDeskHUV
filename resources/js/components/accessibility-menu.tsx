import { useState, useEffect } from 'react';
import { 
    Accessibility, 
    ZoomIn, 
    ZoomOut, 
    Contrast, 
    Type,
    MousePointer2,
    AlignJustify,
    RotateCcw,
    X,
    Eye
} from 'lucide-react';

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

export function AccessibilityMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
    const [guidePosition, setGuidePosition] = useState(0);

    // Cargar configuración guardada
    useEffect(() => {
        const saved = localStorage.getItem('accessibility_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            setSettings(parsed);
            applySettings(parsed);
        }
    }, []);

    // Guardar y aplicar cambios
    useEffect(() => {
        localStorage.setItem('accessibility_settings', JSON.stringify(settings));
        applySettings(settings);
    }, [settings]);

    // Guía de lectura - seguir el mouse
    useEffect(() => {
        if (!settings.readingGuide) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            setGuidePosition(e.clientY);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [settings.readingGuide]);

    const applySettings = (s: AccessibilitySettings) => {
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
    };

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

            {/* Guía de lectura */}
            {settings.readingGuide && (
                <div 
                    className="reading-guide-line"
                    style={{ top: guidePosition - 20 }}
                />
            )}

            {/* Botón flotante de accesibilidad */}
            <button
                id="accessibility-button"
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-4 bottom-4 z-[9999] w-14 h-14 bg-[#2d3e5e] hover:bg-[#3d5583] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Menú de accesibilidad"
                title="Opciones de accesibilidad"
            >
                <Accessibility className="w-7 h-7" />
            </button>

            {/* Panel de accesibilidad */}
            {isOpen && (
                <div className="fixed left-4 bottom-20 z-[9999] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-[#2d3e5e] text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Accessibility className="w-5 h-5" />
                            <span className="font-semibold">Accesibilidad</span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenido */}
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Tamaño de texto */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Type className="w-4 h-4" />
                                Tamaño de texto
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={decreaseFontSize}
                                    disabled={settings.fontSize <= 80}
                                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 transition-colors"
                                    aria-label="Reducir tamaño de texto"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                    <span className="text-sm">A-</span>
                                </button>
                                <span className="w-16 text-center font-medium text-gray-700">
                                    {settings.fontSize}%
                                </span>
                                <button
                                    onClick={increaseFontSize}
                                    disabled={settings.fontSize >= 150}
                                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 transition-colors"
                                    aria-label="Aumentar tamaño de texto"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    <span className="text-sm">A+</span>
                                </button>
                            </div>
                        </div>

                        {/* Opciones toggle */}
                        <div className="space-y-2">
                            {/* Alto contraste */}
                            <button
                                onClick={() => toggleSetting('highContrast')}
                                className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-all ${
                                    settings.highContrast 
                                        ? 'bg-[#2d3e5e] text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-pressed={settings.highContrast}
                            >
                                <Contrast className="w-5 h-5" />
                                <span className="flex-1 text-left text-sm font-medium">Alto contraste</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    settings.highContrast ? 'bg-white/20' : 'bg-gray-200'
                                }`}>
                                    {settings.highContrast ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            {/* Escala de grises */}
                            <button
                                onClick={() => toggleSetting('grayscale')}
                                className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-all ${
                                    settings.grayscale 
                                        ? 'bg-[#2d3e5e] text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-pressed={settings.grayscale}
                            >
                                <Eye className="w-5 h-5" />
                                <span className="flex-1 text-left text-sm font-medium">Escala de grises</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    settings.grayscale ? 'bg-white/20' : 'bg-gray-200'
                                }`}>
                                    {settings.grayscale ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            {/* Espaciado de texto */}
                            <button
                                onClick={() => toggleSetting('textSpacing')}
                                className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-all ${
                                    settings.textSpacing 
                                        ? 'bg-[#2d3e5e] text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-pressed={settings.textSpacing}
                            >
                                <AlignJustify className="w-5 h-5" />
                                <span className="flex-1 text-left text-sm font-medium">Espaciado de texto</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    settings.textSpacing ? 'bg-white/20' : 'bg-gray-200'
                                }`}>
                                    {settings.textSpacing ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            {/* Cursor grande */}
                            <button
                                onClick={() => toggleSetting('largeCursor')}
                                className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-all ${
                                    settings.largeCursor 
                                        ? 'bg-[#2d3e5e] text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-pressed={settings.largeCursor}
                            >
                                <MousePointer2 className="w-5 h-5" />
                                <span className="flex-1 text-left text-sm font-medium">Cursor grande</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    settings.largeCursor ? 'bg-white/20' : 'bg-gray-200'
                                }`}>
                                    {settings.largeCursor ? 'ON' : 'OFF'}
                                </span>
                            </button>

                            {/* Guía de lectura */}
                            <button
                                onClick={() => toggleSetting('readingGuide')}
                                className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 transition-all ${
                                    settings.readingGuide 
                                        ? 'bg-[#2d3e5e] text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                                aria-pressed={settings.readingGuide}
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <div className="w-5 h-1 bg-current rounded" />
                                </div>
                                <span className="flex-1 text-left text-sm font-medium">Guía de lectura</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    settings.readingGuide ? 'bg-white/20' : 'bg-gray-200'
                                }`}>
                                    {settings.readingGuide ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>

                        {/* Botón restablecer */}
                        <button
                            onClick={resetAll}
                            className="w-full py-2.5 px-4 border-2 border-gray-300 hover:border-gray-400 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-sm font-medium">Restablecer todo</span>
                        </button>

                        {/* Info */}
                        <p className="text-xs text-gray-400 text-center">
                            Las preferencias se guardan automáticamente
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
