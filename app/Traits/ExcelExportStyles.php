<?php

namespace App\Traits;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

trait ExcelExportStyles
{
    // Colores de la app HelpDesk HUV
    protected $primaryColor = '2c4370';
    protected $secondaryColor = '3d5583';
    protected $accentColor = '4a6fa5';
    protected $lightBg = 'f0f4f8';
    protected $successColor = '10b981';
    protected $warningColor = 'f59e0b';
    protected $dangerColor = 'ef4444';

    /**
     * Aplicar estilo de título principal
     */
    protected function applyTitleStyle($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 20,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $this->primaryColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }

    /**
     * Aplicar estilo de subtítulo
     */
    protected function applySubtitleStyle($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'italic' => true,
                'size' => 11,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $this->secondaryColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
    }

    /**
     * Aplicar estilo de información (fecha, filtros)
     */
    protected function applyInfoStyle($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '6B7280']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $this->lightBg],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
    }

    /**
     * Aplicar estilo de encabezado de tabla
     */
    protected function applyHeaderStyle($sheet, $range, $bgColor = null)
    {
        $bgColor = $bgColor ?? $this->primaryColor;
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $bgColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => $bgColor],
                ],
            ],
        ]);
    }

    /**
     * Aplicar estilo de datos de tabla
     */
    protected function applyDataStyle($sheet, $range, $alternate = false)
    {
        $style = [
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
        ];
        
        if ($alternate) {
            $style['fill'] = [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F9FAFB'],
            ];
        }
        
        $sheet->getStyle($range)->applyFromArray($style);
    }

    /**
     * Aplicar estilo de sección/categoría
     */
    protected function applySectionStyle($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 12,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $this->accentColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }

    /**
     * Crear encabezado estándar del documento
     */
    protected function createDocumentHeader($sheet, $title, $subtitle, $lastColumn, $filterInfo = '')
    {
        // Título principal
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->setCellValue('A1', $title);
        $this->applyTitleStyle($sheet, "A1:{$lastColumn}1");
        $sheet->getRowDimension(1)->setRowHeight(40);

        // Subtítulo
        $sheet->mergeCells("A2:{$lastColumn}2");
        $sheet->setCellValue('A2', $subtitle);
        $this->applySubtitleStyle($sheet, "A2:{$lastColumn}2");
        $sheet->getRowDimension(2)->setRowHeight(25);

        // Información de exportación
        $sheet->mergeCells("A3:{$lastColumn}3");
        $info = 'Generado: ' . date('d/m/Y H:i:s');
        if ($filterInfo) {
            $info .= ' | ' . $filterInfo;
        }
        $sheet->setCellValue('A3', $info);
        $this->applyInfoStyle($sheet, "A3:{$lastColumn}3");
    }

    /**
     * Configurar propiedades del documento
     */
    protected function setDocumentProperties($spreadsheet, $title, $subject)
    {
        $spreadsheet->getProperties()
            ->setCreator('HelpDesk HUV')
            ->setLastModifiedBy('HelpDesk HUV')
            ->setTitle($title)
            ->setSubject($subject)
            ->setDescription('Reporte generado automáticamente por HelpDesk HUV')
            ->setKeywords('helpdesk huv inventario reporte')
            ->setCategory('Reportes');
    }

    /**
     * Auto-ajustar columnas
     */
    protected function autoSizeColumns($sheet, $columns)
    {
        foreach ($columns as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Aplicar filas alternadas
     */
    protected function applyAlternateRowStyles($sheet, $startRow, $endRow, $startCol, $endCol)
    {
        for ($row = $startRow; $row <= $endRow; $row++) {
            $range = "{$startCol}{$row}:{$endCol}{$row}";
            $this->applyDataStyle($sheet, $range, ($row % 2 === 0));
        }
    }

    /**
     * Aplicar estilo de badge/etiqueta
     */
    protected function applyBadgeStyle($sheet, $cell, $bgColor, $textColor = 'FFFFFF')
    {
        $sheet->getStyle($cell)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 10,
                'color' => ['rgb' => $textColor],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $bgColor],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }
}
