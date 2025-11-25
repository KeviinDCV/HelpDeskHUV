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
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    disabled = false,
    loading = false,
    className
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

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

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optValue: string) => {
        onValueChange(optValue);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm ring-offset-background",
                    "focus:outline-none focus:ring-1 focus:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-1 ring-ring"
                )}
            >
                <span className={cn(!selectedOption && "text-muted-foreground")}>
                    {loading ? "Cargando..." : selectedOption?.label || placeholder}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    {/* Search input */}
                    <div className="flex items-center border-b px-2 py-1.5">
                        <Search className="h-3 w-3 text-muted-foreground mr-2" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Options list */}
                    <div className="max-h-48 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        value === opt.value && "bg-accent"
                                    )}
                                >
                                    <Check className={cn(
                                        "h-3 w-3",
                                        value === opt.value ? "opacity-100" : "opacity-0"
                                    )} />
                                    <span className="truncate">{opt.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
