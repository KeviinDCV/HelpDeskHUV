import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Search, RotateCcw } from 'lucide-react';

// ============= GLPI-style Filter System Types =============
export interface FilterCriterion {
    id: string;
    connector: 'AND' | 'OR' | 'AND NOT' | 'OR NOT';
    field: string;
    operator: string;
    value: string;
}

export interface FilterFieldDefinition {
    value: string;
    label: string;
    type: 'text' | 'select' | 'date';
    options?: { value: string; label: string }[];
}

const CONNECTOR_OPTIONS = [
    { value: 'AND', label: 'Y' },
    { value: 'OR', label: 'O' },
    { value: 'AND NOT', label: 'Y NO' },
    { value: 'OR NOT', label: 'O NO' },
];

function getOperatorsForField(fieldType: string): { value: string; label: string }[] {
    switch (fieldType) {
        case 'select':
            return [{ value: 'is', label: 'es' }];
        case 'text':
            return [
                { value: 'contains', label: 'contiene' },
                { value: 'is', label: 'es' },
                { value: 'not_contains', label: 'no contiene' },
                { value: 'starts_with', label: 'empieza por' },
                { value: 'ends_with', label: 'termina por' },
            ];
        case 'date':
            return [
                { value: 'is', label: 'es' },
                { value: 'before', label: 'antes' },
                { value: 'after', label: 'después' },
            ];
        default:
            return [{ value: 'contains', label: 'contiene' }];
    }
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function parseSavedCriteria(criteriaStr: string): FilterCriterion[] {
    if (!criteriaStr) return [];
    try {
        const parsed = JSON.parse(criteriaStr);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
    return [];
}

export function createDefaultCriterion(fields: FilterFieldDefinition[]): FilterCriterion {
    const firstField = fields[0];
    const operators = getOperatorsForField(firstField?.type || 'text');
    return {
        id: generateId(),
        connector: 'AND',
        field: firstField?.value || '',
        operator: operators[0]?.value || 'contains',
        value: ''
    };
}

interface InventoryFilterBarProps {
    fields: FilterFieldDefinition[];
    criteria: FilterCriterion[];
    onCriteriaChange: (criteria: FilterCriterion[]) => void;
    onApply: () => void;
    onReset: () => void;
    /** Extra content to render in the bottom-left of the filter bar (e.g. checkboxes) */
    extraActions?: React.ReactNode;
}

export function InventoryFilterBar({
    fields,
    criteria,
    onCriteriaChange,
    onApply,
    onReset,
    extraActions,
}: InventoryFilterBarProps) {

    const addCriterion = () => {
        const newCriterion = createDefaultCriterion(fields);
        onCriteriaChange([...criteria, newCriterion]);
    };

    const removeCriterion = (id: string) => {
        onCriteriaChange(criteria.filter(c => c.id !== id));
    };

    const updateCriterion = (id: string, updates: Partial<FilterCriterion>) => {
        onCriteriaChange(criteria.map(c => {
            if (c.id !== id) return c;
            const updated = { ...c, ...updates };
            // Reset operator and value when field changes
            if (updates.field && updates.field !== c.field) {
                const fieldDef = fields.find(f => f.value === updates.field);
                const operators = getOperatorsForField(fieldDef?.type || 'text');
                updated.operator = operators[0]?.value || 'contains';
                updated.value = '';
            }
            return updated;
        }));
    };

    const getFieldDef = (fieldValue: string) => fields.find(f => f.value === fieldValue);

    const renderValueInput = (criterion: FilterCriterion) => {
        const fieldDef = getFieldDef(criterion.field);
        if (!fieldDef) {
            return (
                <Input
                    type="text"
                    value={criterion.value}
                    onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                    className="h-7 text-xs w-40"
                />
            );
        }

        switch (fieldDef.type) {
            case 'select':
                return (
                    <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[160px]"
                    >
                        <option value="">--</option>
                        {(fieldDef.options || []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs w-40"
                    />
                );
            case 'text':
            default:
                return (
                    <Input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-7 text-xs w-40"
                        placeholder=""
                    />
                );
        }
    };

    return (
        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="space-y-1">
                {criteria.map((criterion, index) => {
                    const fieldDef = getFieldDef(criterion.field);
                    const operators = getOperatorsForField(fieldDef?.type || 'text');
                    return (
                        <div key={criterion.id} className="flex items-center gap-1 flex-wrap">
                            {/* Add/Remove buttons and Connector */}
                            {index === 0 ? (
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={addCriterion}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-gray-100 text-gray-600"
                                        title="Agregar criterio de búsqueda"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={() => removeCriterion(criterion.id)}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:bg-red-50 text-red-500"
                                        title="Quitar criterio"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <select
                                        value={criterion.connector}
                                        onChange={(e) => updateCriterion(criterion.id, { connector: e.target.value as FilterCriterion['connector'] })}
                                        className="h-7 text-xs border border-gray-200 rounded px-1 bg-white text-gray-700 min-w-[60px]"
                                    >
                                        {CONNECTOR_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Field selector */}
                            <select
                                value={criterion.field}
                                onChange={(e) => updateCriterion(criterion.id, { field: e.target.value })}
                                className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[140px]"
                            >
                                {fields.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>

                            {/* Operator selector */}
                            <select
                                value={criterion.operator}
                                onChange={(e) => updateCriterion(criterion.id, { operator: e.target.value })}
                                className="h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-700 min-w-[90px]"
                            >
                                {operators.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>

                            {/* Value input/select */}
                            {renderValueInput(criterion)}
                        </div>
                    );
                })}
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-between mt-2 pt-1">
                <div className="flex items-center gap-2">
                    {extraActions}
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        onClick={onApply}
                        className="bg-[#2c4370] hover:bg-[#3d5583] text-white h-7 text-xs px-4"
                    >
                        <Search className="w-3 h-3 mr-1" />
                        Buscar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                        title="Restablecer filtros"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============= Per-Page Select Options (shared) =============
export const PER_PAGE_OPTIONS = [
    { value: '10', label: '10' },
    { value: '15', label: '15' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
    { value: '500', label: '500' },
    { value: '1000', label: '1000' },
    { value: '5000', label: '5000' },
    { value: 'all', label: 'Todos' },
];

interface PerPageSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export function PerPageSelect({ value, onChange }: PerPageSelectProps) {
    // Normalize the display value — when "all" is selected, the backend might send a large number
    const displayValue = PER_PAGE_OPTIONS.some(o => o.value === value) ? value : value;

    return (
        <Select value={displayValue} onValueChange={onChange}>
            <SelectTrigger className="w-20 sm:w-24 h-7 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {PER_PAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
