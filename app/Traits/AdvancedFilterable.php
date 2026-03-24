<?php

namespace App\Traits;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

trait AdvancedFilterable
{
    /**
     * Aplica filtros avanzados agrupados por AND/OR.
     */
    private function applyAdvancedFilters($query, array $filters, array $fieldMap): void
    {
        $groups = [[]];
        $currentGroup = 0;

        foreach ($filters as $i => $filter) {
            if ($i > 0 && ($filter['connector'] ?? 'AND') === 'OR') {
                $currentGroup++;
                $groups[$currentGroup] = [];
            }
            $groups[$currentGroup][] = $filter;
        }

        $query->where(function ($outerQuery) use ($groups, $fieldMap) {
            foreach ($groups as $i => $group) {
                $method = $i === 0 ? 'where' : 'orWhere';
                $outerQuery->$method(function ($q) use ($group, $fieldMap) {
                    foreach ($group as $filter) {
                        $this->applyInventoryFilter($q, $filter, $fieldMap);
                    }
                });
            }
        });
    }

    /**
     * Aplica un filtro individual usando el mapa de campos.
     */
    private function applyInventoryFilter($query, array $filter, array $fieldMap): void
    {
        $field = $filter['field'] ?? '';
        $operator = $filter['operator'] ?? 'contiene';
        $value = $filter['value'] ?? '';

        $mapping = $fieldMap[$field] ?? null;
        if (!$mapping) return;

        $column = $mapping['column'];
        $type = $mapping['type'] ?? 'text';

        switch ($type) {
            case 'text':
                $this->applyInventoryTextFilter($query, $column, $operator, $value);
                break;
            case 'number':
                $this->applyInventoryNumberFilter($query, $column, $operator, $value);
                break;
            case 'date':
                $this->applyInventoryDateFilter($query, $column, $operator, $value);
                break;
            case 'select':
                $this->applyInventoryNumberFilter($query, $column, $operator, $value);
                break;
        }
    }

    private function applyInventoryTextFilter($query, string $column, string $operator, string $value): void
    {
        switch ($operator) {
            case 'contiene':
                $query->where($column, 'LIKE', "%{$value}%");
                break;
            case 'no_contiene':
                $query->where(function ($q) use ($column, $value) {
                    $q->where($column, 'NOT LIKE', "%{$value}%")
                        ->orWhereNull($column);
                });
                break;
            case 'es':
                $query->where($column, '=', $value);
                break;
            case 'no_es':
                $query->where($column, '!=', $value);
                break;
            case 'empieza_con':
                $query->where($column, 'LIKE', "{$value}%");
                break;
            case 'termina_con':
                $query->where($column, 'LIKE', "%{$value}");
                break;
            case 'vacio':
                $query->where(function ($q) use ($column) {
                    $q->whereNull($column)->orWhere($column, '=', '');
                });
                break;
            case 'no_vacio':
                $query->whereNotNull($column)->where($column, '!=', '');
                break;
        }
    }

    private function applyInventoryNumberFilter($query, string $column, string $operator, string $value): void
    {
        switch ($operator) {
            case 'es':
                $query->where($column, '=', $value);
                break;
            case 'no_es':
                $query->where($column, '!=', $value);
                break;
            case 'contiene':
                $query->where(DB::raw("CAST({$column} AS CHAR)"), 'LIKE', "%{$value}%");
                break;
            case 'mayor_que':
                $query->where($column, '>', $value);
                break;
            case 'menor_que':
                $query->where($column, '<', $value);
                break;
        }
    }

    private function applyInventoryDateFilter($query, string $column, string $operator, string $value): void
    {
        if ($operator === 'contiene') {
            $query->where(DB::raw("CAST({$column} AS CHAR)"), 'LIKE', "%{$value}%");
            return;
        }

        $resolvedDate = $this->resolveInventoryDateValue($value);
        if (!$resolvedDate) return;

        $isDateOnly = strlen($resolvedDate) === 10;

        switch ($operator) {
            case 'es':
                if ($isDateOnly) {
                    $query->whereDate($column, '=', $resolvedDate);
                } else {
                    $query->where($column, '>=', Carbon::parse($resolvedDate)->subSeconds(30))
                        ->where($column, '<=', Carbon::parse($resolvedDate)->addSeconds(30));
                }
                break;
            case 'no_es':
                if ($isDateOnly) {
                    $query->whereDate($column, '!=', $resolvedDate);
                } else {
                    $query->where(function ($q) use ($column, $resolvedDate) {
                        $q->where($column, '<', Carbon::parse($resolvedDate)->subSeconds(30))
                            ->orWhere($column, '>', Carbon::parse($resolvedDate)->addSeconds(30));
                    });
                }
                break;
            case 'antes':
                if ($isDateOnly) {
                    $query->whereDate($column, '<', $resolvedDate);
                } else {
                    $query->where($column, '<', $resolvedDate);
                }
                break;
            case 'despues':
                if ($isDateOnly) {
                    $query->whereDate($column, '>', $resolvedDate);
                } else {
                    $query->where($column, '>', $resolvedDate);
                }
                break;
        }
    }

    private function resolveInventoryDateValue(string $preset): ?string
    {
        $now = Carbon::now();

        if (str_starts_with($preset, 'specific:')) {
            $dateStr = substr($preset, 9);
            try {
                return Carbon::parse($dateStr)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                return null;
            }
        }

        switch ($preset) {
            case 'now':
                return $now->format('Y-m-d H:i:s');
            case 'today':
                return $now->format('Y-m-d');
        }

        if (preg_match('/^-(\d+)h$/', $preset, $m)) {
            return $now->subHours((int) $m[1])->format('Y-m-d H:i:s');
        }
        if (preg_match('/^-(\d+)d$/', $preset, $m)) {
            return $now->subDays((int) $m[1])->format('Y-m-d');
        }
        if (str_starts_with($preset, 'day_')) {
            $dayName = substr($preset, 4);
            $dayMap = [
                'domingo' => Carbon::SUNDAY,
                'lunes' => Carbon::MONDAY,
                'martes' => Carbon::TUESDAY,
                'miércoles' => Carbon::WEDNESDAY,
                'jueves' => Carbon::THURSDAY,
                'viernes' => Carbon::FRIDAY,
                'sábado' => Carbon::SATURDAY,
            ];
            $dayNum = $dayMap[$dayName] ?? null;
            if ($dayNum !== null) {
                $date = $now->copy();
                while ($date->dayOfWeek !== $dayNum) {
                    $date->subDay();
                }
                return $date->format('Y-m-d');
            }
        }
        if (preg_match('/^-(\d+)w$/', $preset, $m)) {
            return $now->subWeeks((int) $m[1])->format('Y-m-d');
        }
        if ($preset === 'start_of_month') {
            return $now->startOfMonth()->format('Y-m-d');
        }
        if (preg_match('/^-(\d+)m$/', $preset, $m)) {
            return $now->subMonths((int) $m[1])->format('Y-m-d');
        }
        if ($preset === 'start_of_year') {
            return $now->startOfYear()->format('Y-m-d');
        }
        if (preg_match('/^-(\d+)y$/', $preset, $m)) {
            return $now->subYears((int) $m[1])->format('Y-m-d');
        }

        return null;
    }
}
