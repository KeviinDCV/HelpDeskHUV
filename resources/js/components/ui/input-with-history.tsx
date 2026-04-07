import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useFieldHistory } from '@/hooks/use-field-history';
import { cn } from '@/lib/utils';
import { History, X } from 'lucide-react';

interface InputWithHistoryProps extends React.ComponentProps<'input'> {
    historyKey: string;
    onValueAccepted?: (value: string) => void;
}

export function InputWithHistory({
    historyKey,
    className,
    value,
    onChange,
    onValueAccepted,
    ...props
}: InputWithHistoryProps) {
    const { getFiltered } = useFieldHistory(historyKey);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [filtered, setFiltered] = React.useState<string[]>([]);
    const [highlightIndex, setHighlightIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const currentValue = typeof value === 'string' ? value : '';

    const updateFiltered = React.useCallback(
        (query: string) => {
            const results = getFiltered(query);
            // Don't show exact match as only suggestion
            const meaningful = results.filter(
                (s) => s.toLowerCase() !== query.toLowerCase(),
            );
            setFiltered(meaningful);
        },
        [getFiltered],
    );

    const handleFocus = () => {
        updateFiltered(currentValue);
        setShowSuggestions(true);
        setHighlightIndex(-1);
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Don't close if clicking inside the container (suggestions)
        if (containerRef.current?.contains(e.relatedTarget as Node)) return;
        setShowSuggestions(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        updateFiltered(e.target.value);
        setShowSuggestions(true);
        setHighlightIndex(-1);
    };

    const selectSuggestion = (suggestion: string) => {
        // Create a synthetic event to work with the parent's onChange
        const nativeEvent = new Event('input', { bubbles: true });
        const syntheticEvent = {
            target: { value: suggestion },
            currentTarget: { value: suggestion },
            nativeEvent,
            preventDefault: () => {},
            stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
        onValueAccepted?.(suggestion);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filtered.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((prev) =>
                prev < filtered.length - 1 ? prev + 1 : 0,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((prev) =>
                prev > 0 ? prev - 1 : filtered.length - 1,
            );
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            selectSuggestion(filtered[highlightIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={containerRef} className="relative" onBlur={handleBlur}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    className={cn('pr-7', className)}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    {...props}
                />
                {getFiltered('').length > 0 && (
                    <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            updateFiltered('');
                            setShowSuggestions((prev) => !prev);
                        }}
                        title="Ver historial"
                    >
                        <History className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {showSuggestions && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50">
                        <span className="text-[10px] text-gray-500 font-medium">Usados anteriormente</span>
                        <button
                            type="button"
                            tabIndex={-1}
                            className="text-gray-400 hover:text-gray-600"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setShowSuggestions(false);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                    {filtered.map((suggestion, idx) => (
                        <button
                            key={idx}
                            type="button"
                            tabIndex={-1}
                            className={cn(
                                'w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer transition-colors truncate',
                                idx === highlightIndex && 'bg-blue-50 text-blue-700',
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(suggestion);
                            }}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
