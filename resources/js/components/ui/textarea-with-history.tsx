import * as React from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { useFieldHistory } from '@/hooks/use-field-history';
import { cn } from '@/lib/utils';
import { History, X } from 'lucide-react';

interface TextareaWithHistoryProps extends TextareaProps {
    historyKey: string;
    onValueAccepted?: (value: string) => void;
}

export const TextareaWithHistory = React.forwardRef<
    HTMLTextAreaElement,
    TextareaWithHistoryProps
>(({ historyKey, className, value, onChange, onValueAccepted, ...props }, ref) => {
    const { getFiltered } = useFieldHistory(historyKey);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [filtered, setFiltered] = React.useState<string[]>([]);
    const [highlightIndex, setHighlightIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const currentValue = typeof value === 'string' ? value : '';

    const updateFiltered = React.useCallback(
        (query: string) => {
            const results = getFiltered(query);
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
        if (containerRef.current?.contains(e.relatedTarget as Node)) return;
        setShowSuggestions(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
        updateFiltered(e.target.value);
        setShowSuggestions(true);
        setHighlightIndex(-1);
    };

    const selectSuggestion = (suggestion: string) => {
        const nativeEvent = new Event('input', { bubbles: true });
        const syntheticEvent = {
            target: { value: suggestion },
            currentTarget: { value: suggestion },
            nativeEvent,
            preventDefault: () => {},
            stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;

        onChange?.(syntheticEvent);
        onValueAccepted?.(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    // Merge refs
    const mergedRef = React.useCallback(
        (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        },
        [ref],
    );

    return (
        <div ref={containerRef} className="relative" onBlur={handleBlur}>
            <div className="relative">
                <Textarea
                    ref={mergedRef}
                    className={className}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    {...props}
                />
                {getFiltered('').length > 0 && (
                    <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            updateFiltered('');
                            setShowSuggestions((prev) => !prev);
                        }}
                        title="Ver historial de descripciones"
                    >
                        <History className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {showSuggestions && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50 sticky top-0">
                        <span className="text-[10px] text-gray-500 font-medium">Descripciones anteriores</span>
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
                                'w-full text-left px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0',
                                idx === highlightIndex && 'bg-blue-50 text-blue-700',
                            )}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(suggestion);
                            }}
                        >
                            <span className="line-clamp-2">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

TextareaWithHistory.displayName = 'TextareaWithHistory';
