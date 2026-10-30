/**
 * @file DataTable.tsx
 * @description Tabla de datos estándar con ordenamiento, filtrado, paginación y diseño ganadero / agroindustrial
 * Pozo del Carril · La Aguada
 */

import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  subtitle?: string;
  onExportCsv?: () => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  emptyMessage?: string;
  filterComponent?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  subtitle,
  onExportCsv,
  searchPlaceholder = 'Buscar en los registros...',
  actions,
  emptyMessage = 'No se encontraron registros en el libro ganadero para esta consulta',
  filterComponent
}: Props<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtrado de texto
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border border-[#dce3da] overflow-hidden shadow-xs flex flex-col">
      {/* Barra superior con título, búsqueda y acciones */}
      <div className="p-4 border-b border-[#e5ebe3] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#fafbfa]">
        <div>
          {title && (
            <h3 className="text-sm font-bold text-[#1a3325] tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#23583b] rounded-xs inline-block" />
              <span>{title}</span>
            </h3>
          )}
          {subtitle && <p className="text-xs text-[#5f6f65] mt-0.5 pl-3.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterComponent}

          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#738379] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#cfd8cc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23583b] focus:border-[#23583b] w-48 sm:w-60 text-[#1a3325] placeholder-[#8a9990] transition-colors"
            />
          </div>

          {/* Exportación CSV */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#284936] bg-[#f1f6ef] hover:bg-[#e4ede1] border border-[#cbd8c7] rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Descargar libro de registros en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#376147]" />
              <span>Exportar CSV</span>
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Contenedor de la tabla con scroll horizontal */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#d8e0d6] bg-[#f2f6f1] text-[#2f4b3a] font-bold uppercase tracking-wider text-[11px]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`py-2.5 px-4 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2ec] font-normal text-[#21382b]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-[#7a8a80]">
                  <p className="text-xs">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-[#f6f9f5] transition-colors group"
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`py-2.5 px-4 whitespace-nowrap ${
                        col.align === 'right'
                          ? 'text-right font-mono tabular-nums'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con conteo y paginación */}
      <div className="px-4 py-2.5 border-t border-[#e2e8e0] flex items-center justify-between text-xs text-[#55675c] bg-[#fafbfa]">
        <div>
          Mostrando <span className="font-semibold text-[#1c3827] font-mono tabular-nums">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a{' '}
          <span className="font-semibold text-[#1c3827] font-mono tabular-nums">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </span>{' '}
          de <span className="font-semibold text-[#1c3827] font-mono tabular-nums">{filteredData.length}</span> registros en lote
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#cfd8cc] bg-white text-[#2a4535] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f1f5ef] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-2 text-[#243d2f]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#cfd8cc] bg-white text-[#2a4535] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f1f5ef] cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
