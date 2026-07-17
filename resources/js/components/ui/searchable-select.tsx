import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    /** id para el botón disparador (permite asociar un <Label htmlFor>) */
    id?: string;
    /** clases extra para el botón disparador */
    triggerClassName?: string;
}

/**
 * Selector con búsqueda, implementando el patrón combobox de ARIA 1.2.
 *
 * Reparto de roles: el disparador es un botón normal cuyo texto ES el valor actual (así el
 * lector de pantalla lo anuncia al enfocarlo). Al abrirse, el foco se mueve al campo de
 * búsqueda, y es ESE campo el que hace de `combobox`: es lo que tiene el foco, lo que recibe
 * las teclas y lo que apunta con `aria-activedescendant` a la opción resaltada. Las opciones
 * nunca reciben foco — se navegan con las flechas y se confirman con Enter.
 */
export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    disabled = false,
    loading = false,
    className,
    id,
    triggerClassName
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    const reactId = React.useId();
    const listboxId = `${reactId}-listbox`;
    const optionId = (index: number) => `${reactId}-opt-${index}`;

    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        const searchLower = search.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchLower)
        );
    }, [options, search]);

    const selectedOption = options.find(opt => opt.value === value);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Al abrir, el foco va al campo de búsqueda y se resalta la opción ya seleccionada
    // (o la primera), para que las flechas empiecen desde donde el usuario está.
    React.useEffect(() => {
        if (!isOpen) return;
        inputRef.current?.focus();
        const current = filteredOptions.findIndex(opt => opt.value === value);
        setActiveIndex(current >= 0 ? current : 0);
        // Solo al abrir: no debe reejecutarse al teclear.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Al filtrar, la opción resaltada anterior deja de tener sentido.
    React.useEffect(() => {
        setActiveIndex(0);
    }, [search]);

    // La opción resaltada debe verse: se navega con flechas, no con scroll.
    React.useEffect(() => {
        if (!isOpen) return;
        listRef.current
            ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
            ?.scrollIntoView({ block: "nearest" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, isOpen]);

    const close = (returnFocus = true) => {
        setIsOpen(false);
        setSearch("");
        if (returnFocus) triggerRef.current?.focus();
    };

    const handleSelect = (optValue: string) => {
        onValueChange(optValue);
        close();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // Enter y Espacio ya los traduce el navegador a click sobre un <button>.
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const last = filteredOptions.length - 1;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (last < 0) return;
                setActiveIndex(i => (i >= last ? 0 : i + 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                if (last < 0) return;
                setActiveIndex(i => (i <= 0 ? last : i - 1));
                break;
            case "Home":
                e.preventDefault();
                setActiveIndex(0);
                break;
            case "End":
                e.preventDefault();
                setActiveIndex(Math.max(0, last));
                break;
            case "Enter":
                e.preventDefault();
                if (filteredOptions[activeIndex]) {
                    handleSelect(filteredOptions[activeIndex].value);
                }
                break;
            case "Escape":
                e.preventDefault();
                close();
                break;
            case "Tab":
                // Tab sale del control: se cierra sin robar el foco al siguiente campo.
                close(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                id={id}
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleTriggerKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm ring-offset-background",
                    "focus:outline-none focus:ring-1 focus:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-1 ring-ring",
                    triggerClassName
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
                    {loading ? "Cargando..." : selectedOption?.label || placeholder}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    {/* Búsqueda — es el combobox: tiene el foco y dirige la lista */}
                    <div className="flex items-center border-b px-2 py-1.5">
                        <Search className="h-3 w-3 text-muted-foreground mr-2 shrink-0" aria-hidden="true" />
                        <input
                            ref={inputRef}
                            type="text"
                            role="combobox"
                            aria-expanded="true"
                            aria-controls={listboxId}
                            aria-autocomplete="list"
                            aria-activedescendant={filteredOptions.length > 0 ? optionId(activeIndex) : undefined}
                            aria-label={searchPlaceholder}
                            autoComplete="off"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={searchPlaceholder}
                            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Lista de opciones */}
                    <div
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        aria-label={searchPlaceholder}
                        className="max-h-48 overflow-y-auto p-1"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredOptions.map((opt, index) => {
                                const isSelected = value === opt.value;
                                const isActive = index === activeIndex;
                                return (
                                    <div
                                        key={opt.value}
                                        id={optionId(index)}
                                        role="option"
                                        aria-selected={isSelected}
                                        // El puntero resalta lo mismo que resaltan las flechas, para que
                                        // ratón y teclado no peleen por cuál es la opción "actual".
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => handleSelect(opt.value)}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer",
                                            isActive && "bg-accent text-accent-foreground",
                                            isSelected && "font-medium"
                                        )}
                                    >
                                        <Check
                                            aria-hidden="true"
                                            className={cn("h-3 w-3 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                                        />
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Anuncia el nº de coincidencias al filtrar: sin esto, el usuario de lector de
                        pantalla teclea y no sabe si quedó algo que elegir. */}
                    <div role="status" aria-live="polite" className="sr-only">
                        {filteredOptions.length === 0
                            ? "No se encontraron resultados"
                            : `${filteredOptions.length} ${filteredOptions.length === 1 ? "opción disponible" : "opciones disponibles"}`}
                    </div>
                </div>
            )}
        </div>
    );
}
