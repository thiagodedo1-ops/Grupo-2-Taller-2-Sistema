import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Calculator,
  Tag,
  Table,
  Info
} from 'lucide-react';
import { ManualCapitulo } from '../../data/multiUnitManualData';

interface Props {
  capitulo: ManualCapitulo;
  unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  onOpenGemini?: () => void;
}

export const MultiUnitChapterRenderer: React.FC<Props> = ({
  capitulo,
  unit,
  onOpenGemini
}) => {
  const theme = {
    PORCINOS: {
      badgeBg: 'bg-[#edf6f0] text-[#1b5e37] border-[#bbf7d0]',
      primaryText: 'text-[#1b5e37]',
      borderAccent: 'border-[#bbf7d0]',
      tableHead: 'bg-[#edf6f0] text-[#1b5e37]',
      formulaBox: 'bg-[#f8faf8] border-[#dce6dc]',
      formulaText: 'text-[#1c4b31]',
      alertBox: 'bg-[#f8faf8] border-[#dce6dc] text-[#1c4b31]'
    },
    BOVINOS: {
      badgeBg: 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]',
      primaryText: 'text-[#78350f]',
      borderAccent: 'border-[#fde68a]',
      tableHead: 'bg-[#fef3c7] text-[#78350f]',
      formulaBox: 'bg-[#fffbeb] border-[#fde68a]',
      formulaText: 'text-[#92400e]',
      alertBox: 'bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]'
    },
    OVINOS: {
      badgeBg: 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
      primaryText: 'text-[#1e40af]',
      borderAccent: 'border-[#bfdbfe]',
      tableHead: 'bg-[#dbeafe] text-[#1e40af]',
      formulaBox: 'bg-[#eff6ff] border-[#bfdbfe]',
      formulaText: 'text-[#1e40af]',
      alertBox: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e3a8a]'
    },
    CONSOLIDADO: {
      badgeBg: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]',
      primaryText: 'text-[#581c87]',
      borderAccent: 'border-[#e9d5ff]',
      tableHead: 'bg-[#f3e8ff] text-[#581c87]',
      formulaBox: 'bg-[#faf5ff] border-[#e9d5ff]',
      formulaText: 'text-[#6b21a8]',
      alertBox: 'bg-[#faf5ff] border-[#e9d5ff] text-[#581c87]'
    }
  }[unit] || {
    badgeBg: 'bg-gray-100',
    primaryText: 'text-gray-900',
    borderAccent: 'border-gray-200',
    tableHead: 'bg-gray-100',
    formulaBox: 'bg-gray-50',
    formulaText: 'text-gray-900',
    alertBox: 'bg-gray-50'
  };

  const unitLabel = {
    PORCINOS: 'Producción Porcina',
    BOVINOS: 'Ganadería Bovina Angus',
    OVINOS: 'Ganadería Ovina Dorper',
    CONSOLIDADO: 'Sistema Ganadero Consolidado'
  }[unit] || '';

  return (
    <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
      {/* Encabezado del Capítulo */}
      <div className="border-b border-[#e2ece2] pb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
            Capítulo {capitulo.num} · {unitLabel}
          </span>
          <span className="text-[10px] bg-[#f0f4f1] text-[#526b5c] px-2 py-0.5 rounded-full font-semibold border border-[#dce6dc]">
            Pozo del Carril · UNRC
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[#143422] tracking-tight">
          {capitulo.titulo}
        </h3>
        <p className="text-xs text-[#557361] mt-1.5 leading-relaxed">
          {capitulo.resumen}
        </p>

        {/* Tags temáticos */}
        {capitulo.tags && capitulo.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            {capitulo.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="text-[10px] font-medium bg-[#f5f8f5] text-[#506c5b] px-2 py-0.5 rounded-md border border-[#e2ece2] flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-[#8aa392]" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Secciones de Contenido */}
      <div className="space-y-8">
        {capitulo.secciones.map((sec, sIdx) => (
          <section key={sIdx} className="space-y-3.5 border-b border-[#f0f5f0] last:border-b-0 pb-6 last:pb-0">
            <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${unit === 'BOVINOS' ? 'bg-[#92400e]' : unit === 'OVINOS' ? 'bg-[#2563eb]' : 'bg-[#7e22ce]'}`} />
              <span>{sec.subtitulo}</span>
            </h4>

            {/* Párrafos descriptivos */}
            <div className="space-y-2 text-xs text-[#284634] leading-relaxed">
              {sec.parrafos.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>

            {/* Puntos Clave */}
            {sec.puntosClave && sec.puntosClave.length > 0 && (
              <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1c4b31] block">
                  Puntos Críticos de la Sección
                </span>
                <ul className="space-y-1.5">
                  {sec.puntosClave.map((punto, ptIdx) => (
                    <li key={ptIdx} className="text-xs text-[#355240] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
                      <span>{punto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tablas Comparativas o de Referencia */}
            {sec.tabla && (
              <div className="overflow-x-auto rounded-xl border border-[#dce6dc] my-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b border-[#dce6dc] text-[11px] font-bold ${theme.tableHead}`}>
                      {sec.tabla.columnas.map((col, cIdx) => (
                        <th key={cIdx} className="p-2.5 font-bold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2ed] bg-white">
                    {sec.tabla.filas.map((fila, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#f9fbf9] transition-colors">
                        {fila.map((celda, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-[#2d4737] font-medium">
                            {celda}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Fórmulas Matemáticas y Zootécnicas */}
            {sec.formulas && sec.formulas.length > 0 && (
              <div className="space-y-2 my-3">
                {sec.formulas.map((form, fIdx) => (
                  <div key={fIdx} className={`p-3.5 rounded-xl border ${theme.formulaBox} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[#143422] flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-[#16a34a]" />
                        <span>{form.nombre}</span>
                      </strong>
                    </div>
                    <code className={`block font-mono text-xs font-bold py-1 px-2.5 bg-white/80 rounded-lg border border-[#e2e8e2] ${theme.formulaText}`}>
                      {form.formula}
                    </code>
                    <p className="text-[11px] text-[#557361]">{form.explicacion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas o Notas Especiales */}
            {sec.alerta && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${theme.alertBox}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Regla de Validación:</strong>
                  <span>{sec.alerta}</span>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
};
