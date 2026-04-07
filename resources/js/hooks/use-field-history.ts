import { useCallback, useState } from 'react';

const MAX_ENTRIES = 30;
const STORAGE_PREFIX = 'field_history_';

export interface FieldHistoryEntry {
    value: string;
    timestamp: number;
}

function getStorageKey(fieldKey: string): string {
    return `${STORAGE_PREFIX}${fieldKey}`;
}

function readEntries(fieldKey: string): FieldHistoryEntry[] {
    try {
        const raw = localStorage.getItem(getStorageKey(fieldKey));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

function writeEntries(fieldKey: string, entries: FieldHistoryEntry[]) {
    try {
        localStorage.setItem(getStorageKey(fieldKey), JSON.stringify(entries));
    } catch {
        // localStorage full or unavailable — ignore
    }
}

export function useFieldHistory(fieldKey: string) {
    const [suggestions, setSuggestions] = useState<string[]>(
        () => readEntries(fieldKey).map((e) => e.value),
    );

    const getFiltered = useCallback(
        (query: string): string[] => {
            // Always re-read from localStorage to get the latest entries
            const current = readEntries(fieldKey).map((e) => e.value);
            if (!query.trim()) return current;
            const lower = query.toLowerCase();
            return current.filter((s) => s.toLowerCase().includes(lower));
        },
        [fieldKey],
    );

    const save = useCallback(
        (value: string) => {
            const trimmed = value.trim();
            if (!trimmed) return;

            const current = readEntries(fieldKey);
            // Remove duplicates (case-insensitive)
            const filtered = current.filter(
                (e) => e.value.toLowerCase() !== trimmed.toLowerCase(),
            );
            // Add at the beginning (most recent first)
            const updated: FieldHistoryEntry[] = [
                { value: trimmed, timestamp: Date.now() },
                ...filtered,
            ].slice(0, MAX_ENTRIES);

            writeEntries(fieldKey, updated);
            // Update the in-memory state so the component reflects the change immediately
            setSuggestions(updated.map((e) => e.value));
        },
        [fieldKey],
    );

    return { suggestions, getFiltered, save };
}
