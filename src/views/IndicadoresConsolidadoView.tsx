/**
 * @file IndicadoresConsolidadoView.tsx
 * @description Solapa "CUADRO DE MANDO INTEGRAL CONSOLIDADO"
 * Sistema Integral de Gestión Ganadera – Pozo del Carril · La Aguada (UNRC)
 * Abarca las 4 perspectivas estratégicas con 12 indicadores consolidados del establecimiento.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Cpu, 
  GraduationCap, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Star, 
  RotateCcw,
  Edit3,
  Search,
  Check,
  Info,
  Building2,
  PieChart
} from 'lucide-react';
import { Usuario, BaseDatosPorcina } from '../types/schema';
import { 
  ResultadoIndicadorCMI, 
  PerspectivaCMI, 
  EstadoSemaforo, 
  FiltrosCMI 
} from '../types/cmi';
import { MetaIndicadorConsolidadoCMI, METAS_INICIALES_CONSOLIDADO } from '../lib/cmiConsolidadoConstants';
import { 
  calcularTodosLosIndicadoresCMIConsolidado, 
  obtenerResumenEjecutivoCMIConsolidado 
} from '../lib/cmiConsolidadoCalculations';
import { getRolePermissions } from '../lib/permissions';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
}

const STORAGE_CONSOLIDADO_METAS_KEY = 'pozo_del_carril_cmi_consolidado_metas_v1';
const STORAGE_CONSOLIDADO_PRIORITARIOS_PREFIX = 'pozo_del_carril_cmi_consolidado_prioritarios_';

export const IndicadoresConsolidadoView: React.FC<Props> = ({ 
  db, 
  currentUser = null 
}) => {
  const permissions = getRolePermissions(currentUser);

  // Storage key personalizada por usuario
  const userStorageKey = `${STORAGE_CONSOLIDADO_PRIORITARIOS_PREFIX}${currentUser?.usuario_id || 'default'}`;

  // Lista configurable de IDs de indicadores prioritarios consolidados
  const [prioritariosIds, setPrioritariosIds] = useState<string[]>(() => {
    try {
      const guardados = localStorage.getItem(userStorageKey);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo prioritarios consolidados guardados', e);
    }
    return METAS_INICIALES_CONSOLIDADO.filter(m => m.esPrioritario).map(m => m.id);
  });

  // Metas configurables con persistencia
  const [metas, setMetas] = useState<MetaIndicadorConsolidadoCMI[]>(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_CONSOLIDADO_METAS_KEY);
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) {
          // Asegurar que todas las metas oficiales existan
          METAS_INICIALES_CONSOLIDADO.forEach(mInit => {
            if (!parsed.some((p: MetaIndicadorConsolidadoCMI) => p.id === mInit.id)) {
              parsed.push(mInit);
            }
          });
          localStorage.setItem(STORAGE_CONSOLIDADO_METAS_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo metas consolidadas guardadas, usando por defecto', e);
    }
    return METAS_INICIALES_CONSOLIDADO;
  });

  // Filtros activos
  const [filtros, setFiltros] = useState<FiltrosCMI>({
    perspectiva: 'TODAS',
    estado: 'TODOS',
    periodo: 'CAMPANA',
    soloPrioritarios: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modal de administración de metas
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMetaId, setSelectedMetaId] = useState<string>('GF1');
  const [editMetaValor, setEditMetaValor] = useState<string>('85000000');
  const [editMetaTexto, setEditMetaTexto] = useState<string>('>= $85.000.000 /año');
  const [editDireccion, setEditDireccion] = useState<any>('MAYOR_MEJOR');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Alternar prioridad de un indicador
  const handleTogglePrioridad = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (prioritariosIds.includes(id)) {
      updated = prioritariosIds.filter(x => x !== id);
    } else {
      updated = [...prioritariosIds, id];
    }
    setPrioritariosIds(updated);
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error guardando prioritarios consolidados en localStorage', err);
    }
  };

  // Calcular todos los indicadores consolidados en tiempo real
  const todosLosIndicadores = useMemo(() => {
    const raw = calcularTodosLosIndicadoresCMIConsolidado(db, metas);
    return raw.map(ind => ({
      ...ind,
      esPrioritario: prioritariosIds.includes(ind.id)
    }));
  }, [db, metas, prioritariosIds]);

  // Indicadores filtrados
  const indicadoresFiltrados = useMemo(() => {
    return todosLosIndicadores.filter(ind => {
      if (filtros.perspectiva !== 'TODAS' && ind.perspectiva !== filtros.perspectiva) {
        return false;
      }
      if (filtros.estado !== 'TODOS' && ind.estadoSemaforo !== filtros.estado) {
        return false;
      }
      if (filtros.soloPrioritarios && !ind.esPrioritario) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchNombre = ind.nombre.toLowerCase().includes(term);
        const matchCodigo = ind.codigo.toLowerCase().includes(term);
        const matchResp = ind.responsable.toLowerCase().includes(term);
        if (!matchNombre && !matchCodigo && !matchResp) return false;
      }
      return true;
    });
  }, [todosLosIndicadores, filtros, searchTerm]);

  // Lista de Mis Indicadores Prioritarios
  const misIndicadoresPrioritarios = useMemo(() => {
    return todosLosIndicadores.filter(ind => ind.esPrioritario);
  }, [todosLosIndicadores]);

  // Resumen ejecutivo
  const resumen = useMemo(() => {
    return obtenerResumenEjecutivoCMIConsolidado(todosLosIndicadores);
  }, [todosLosIndicadores]);

  // Cargar datos del indicador seleccionado en el modal
  useEffect(() => {
    const metaActual = metas.find(m => m.id === selectedMetaId);
    if (metaActual) {
      if (metaActual.meta !== null && metaActual.meta !== undefined) {
        setEditMetaValor(String(metaActual.meta));
      } else {
        setEditMetaValor('');
      }
      setEditMetaTexto(metaActual.metaTexto);
      setEditDireccion(metaActual.direccion);
    }
  }, [selectedMetaId, metas]);

  // Guardar nueva meta
  const handleGuardarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = metas.map(m => {
      if (m.id === selectedMetaId) {
        let parsedMeta: number | null = null;
        if (editMetaValor.trim() !== '') {
          const num = Number(editMetaValor.trim());
          if (!isNaN(num)) {
            parsedMeta = num;
          }
        }

        return {
          ...m,
          meta: parsedMeta,
          metaTexto: editMetaTexto.trim() || (parsedMeta !== null ? `${parsedMeta}` : 'Meta pendiente'),
          direccion: editDireccion,
          fechaVigencia: new Date().toISOString().split('T')[0]
        };
      }
      return m;
    });

    setMetas(updated);
    try {
      localStorage.setItem(STORAGE_CONSOLIDADO_METAS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando metas consolidadas en localStorage', e);
    }

    setGuardadoExitoso(true);
    setTimeout(() => {
      setGuardadoExitoso(false);
      setShowConfigModal(false);
    }, 1200);
  };

  // Restaurar metas por defecto
  const handleRestaurarMetas = () => {
    if (confirm('¿Desea restaurar las metas y umbrales del CMI Consolidado a los valores iniciales oficiales?')) {
      setMetas(METAS_INICIALES_CONSOLIDADO);
      localStorage.setItem(STORAGE_CONSOLIDADO_METAS_KEY, JSON.stringify(METAS_INICIALES_CONSOLIDADO));
    }
  };

  // Ayudante de estilo para cada estado de semáforo
  const getBadgeSemaforo = (estado: EstadoSemaforo, texto: string) => {
    switch (estado) {
      case 'VERDE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065f46] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>VERDE: {texto}</span>
          </span>
        );
      case 'AMARILLO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#855110] bg-[#fef8ee] border border-[#f5dcba] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#d97706]" />
            <span>AMARILLO: {texto}</span>
          </span>
        );
      case 'ROJO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8a1c1c] bg-[#fdf2f2] border border-[#f8c8c8] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
            <span>ROJO: {texto}</span>
          </span>
        );
      case 'META_PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e293b] bg-[#f1f5f9] border border-[#cbd5e1] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#64748b]" />
            <span>META PENDIENTE: {texto}</span>
          </span>
        );
      case 'GRIS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#334155] bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
            <span>GRIS: {texto}</span>
          </span>
        );
    }
  };

  // Renderizar una tarjeta individual de indicador
  const renderTarjetaIndicador = (ind: ResultadoIndicadorCMI) => {
    const isStarred = ind.esPrioritario;

    return (
      <div 
        key={ind.id}
        className={`bg-white rounded-xl p-4.5 border transition-all duration-150 flex flex-col justify-between shadow-2xs ${
          isStarred 
            ? 'border-[#0f172a] ring-1 ring-[#0f172a]/20 bg-gradient-to-b from-white to-[#f8fafc]' 
            : 'border-[#cbd5e1] hover:border-[#94a3b8]'
        }`}
      >
        <div>
          {/* Fila superior: Código, Botón de Prioridad, Ícono de Edición de Meta y Responsable */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1]">
                {ind.codigo}
              </span>

              {/* Botón de Estrella / Marcador de Prioridad */}
              <button
                type="button"
                onClick={(e) => handleTogglePrioridad(ind.id, e)}
                className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                  isStarred
                    ? 'bg-[#fef9ee] text-[#b47118] border border-[#f5dcba] hover:bg-[#fdeecb]'
                    : 'bg-[#f8fafc] text-[#64748b] border border-[#cbd5e1] hover:text-[#0f172a] hover:border-[#0f172a]'
                }`}
                title={isStarred ? 'Quitar de mis indicadores prioritarios' : 'Agregar a mis indicadores prioritarios'}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#b47118]' : ''}`} />
                <span className="text-[10px] hidden sm:inline">
                  {isStarred ? 'Prioritario' : 'Priorizar'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748b] font-medium truncate max-w-[120px]" title={`Responsable: ${ind.responsable}`}>
                {ind.responsable}
              </span>

              {/* HERRAMIENTA DE EDICIÓN DE METAS (Top right on EVERY card) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMetaId(ind.id);
                  setShowConfigModal(true);
                }}
                className="p-1 rounded-md text-[#0f172a] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] transition-colors cursor-pointer"
                title={`Editar meta y umbral de ${ind.nombre}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Nombre del Indicador */}
          <h4 className="text-sm font-bold text-[#0f172a] leading-snug mb-3">
            {ind.nombre}
          </h4>

          {/* 2. Resultado Calculado y Unidad */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#64748b] mb-0.5">
              Resultado Obtenido
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
              ind.datosDisponibles ? 'text-[#0f172a]' : 'text-[#94a3b8] italic text-base sm:text-lg'
            }`}>
              {ind.valorFormateado}
            </div>
          </div>

          {/* 3. Meta Correspondiente */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] mb-3 text-xs">
            <span className="text-[#64748b] font-medium">Meta (Provisional):</span>
            <span className="font-mono font-bold text-[#0f172a]">
              {ind.metaTexto}
            </span>
          </div>
        </div>

        {/* 4. Estado del Semáforo con texto además de color */}
        <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#64748b]">Estado CMI:</span>
            {getBadgeSemaforo(ind.estadoSemaforo, ind.textoEstado)}
          </div>

          {/* 5. Período considerado y fecha de actualización */}
          <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1">
            <span className="truncate pr-1" title={ind.periodoConsiderado}>
              {ind.periodoConsiderado}
            </span>
            <span className="font-mono text-[10px] shrink-0 text-[#94a3b8]">
              {ind.fechaActualizacion}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ENCABEZADO INSTITUCIONAL DE LA SOLAPA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              CUADRO DE MANDO INTEGRAL CONSOLIDADO
            </h2>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
              4 Perspectivas · 12 Indicadores Estratégicos
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Establecimiento Pozo del Carril · UNRC
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
            Evaluación integral y balanceada del desempeño del establecimiento. Consolida las unidades de Porcinos, Bovinos y Ovinos integrando aspectos Financieros, Comerciales, de Procesos Internos y de Aprendizaje / Extensión Académica UNRC.
          </p>
          <div className="mt-2 text-[11px] font-medium text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/80 inline-flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span><strong>Aviso:</strong> Datos simulados del establecimiento. Todas las metas iniciales se encuentran clasificadas como <em>META PROVISIONAL – PENDIENTE DE APROBACIÓN</em> y son editables mediante el ícono superior derecho.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-slate-200"
            title="Configurar metas y umbrales del CMI Consolidado"
          >
            <Sliders className="w-4 h-4 text-slate-900" />
            <span>Administrar Metas</span>
          </button>

          <button
            onClick={handleRestaurarMetas}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-700"
            title="Restaurar metas predeterminadas oficiales"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECCIÓN: MIS INDICADORES PRIORITARIOS CONSOLIDADOS */}
      <section className="bg-gradient-to-b from-[#f8fafc] to-white p-5 rounded-2xl border-2 border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Star className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a] tracking-tight">
                Mis Indicadores Prioritarios Consolidados
              </h3>
              <p className="text-xs text-[#64748b]">
                Destacados estratégicos globales para {currentUser?.nombre || 'este usuario'} ({misIndicadoresPrioritarios.length} elegidos). Presione la estrella en cualquier tarjeta para modificar.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#0f172a] bg-[#f1f5f9] px-3 py-1 rounded-lg border border-[#cbd5e1]">
            {misIndicadoresPrioritarios.length} prioritarios guardados
          </span>
        </div>

        {misIndicadoresPrioritarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {misIndicadoresPrioritarios.map(renderTarjetaIndicador)}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#cbd5e1] text-xs text-[#64748b]">
            <Star className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#0f172a]">No tiene indicadores prioritarios consolidados marcados</p>
            <p className="mt-1">Haga clic en el botón de estrella de cualquier tarjeta para destacarlo en esta sección.</p>
          </div>
        )}
      </section>

      {/* RESUMEN EJECUTIVO DEL CUADRO DE MANDO CONSOLIDADO */}
      <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a] tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>Resumen Ejecutivo de Indicadores Consolidados</span>
            </h3>
            <p className="text-xs text-[#64748b]">
              Estado de los 12 indicadores estratégicos globales del Establecimiento Pozo del Carril
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0f172a] bg-[#f1f5f9] px-3 py-1 rounded-lg border border-[#cbd5e1] self-start sm:self-auto">
            Total CMI General: 12 Indicadores
          </span>
        </div>

        {/* Tarjetas de Conteo de Estados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* VERDE */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'VERDE' ? 'TODOS' : 'VERDE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'VERDE' 
                ? 'bg-[#ecfdf5] border-[#a7f3d0] ring-2 ring-[#10b981]' 
                : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#a7f3d0]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#065f46]">
              <span>Verde</span>
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#065f46] mt-1">
              {resumen.cantVerde}
            </div>
            <div className="text-[10px] text-[#047857] mt-0.5">Meta alcanzada</div>
          </button>

          {/* AMARILLO */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'AMARILLO' ? 'TODOS' : 'AMARILLO' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'AMARILLO' 
                ? 'bg-[#fef3dd] border-[#f1b869] ring-2 ring-[#d97706]' 
                : 'bg-[#fef8ee] border-[#f6dfba] hover:border-[#eac38d]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#855110]">
              <span>Amarillo</span>
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#855110] mt-1">
              {resumen.cantAmarillo}
            </div>
            <div className="text-[10px] text-[#9c6314] mt-0.5">En observación</div>
          </button>

          {/* ROJO */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'ROJO' ? 'TODOS' : 'ROJO' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'ROJO' 
                ? 'bg-[#fde2e2] border-[#f19b9b] ring-2 ring-[#dc2626]' 
                : 'bg-[#fdf2f2] border-[#f8c8c8] hover:border-[#ee9e9e]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#8a1c1c]">
              <span>Rojo</span>
              <XCircle className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#8a1c1c] mt-1">
              {resumen.cantRojo}
            </div>
            <div className="text-[10px] text-[#a82525] mt-0.5">Desvío crítico</div>
          </button>

          {/* GRIS */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'GRIS' ? 'TODOS' : 'GRIS' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'GRIS' 
                ? 'bg-[#f1f5f9] border-[#cbd5e1] ring-2 ring-[#475569]' 
                : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
              <span>Gris</span>
              <span className="w-2 h-2 rounded-full bg-[#94a3b8]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#334155] mt-1">
              {resumen.cantGris}
            </div>
            <div className="text-[10px] text-[#64748b] mt-0.5">Sin datos suficientes</div>
          </button>

          {/* META PENDIENTE */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'META_PENDIENTE' ? 'TODOS' : 'META_PENDIENTE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'META_PENDIENTE' 
                ? 'bg-[#f1f5f9] border-[#cbd5e1] ring-2 ring-[#64748b]' 
                : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Meta Pend.</span>
              <span className="w-2 h-2 rounded-full bg-[#64748b]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#475569] mt-1">
              {resumen.cantMetaPendiente}
            </div>
            <div className="text-[10px] text-[#64748b] mt-0.5">Pendiente de definición</div>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-[#cbd5e1] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Pestañas de Perspectivas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['TODAS', 'FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'] as const).map(persp => {
            const labelMap: Record<string, string> = {
              TODAS: 'Todas (12)',
              FINANCIERA: '1. Financiera (5)',
              CLIENTES: '2. Clientes & Comercial (2)',
              PROCESOS: '3. Procesos Internos (3)',
              APRENDIZAJE: '4. Aprendizaje & Crecimiento (2)'
            };
            const count = persp === 'TODAS' ? todosLosIndicadores.length : todosLosIndicadores.filter(i => i.perspectiva === persp).length;
            const active = filtros.perspectiva === persp;

            return (
              <button
                key={persp}
                onClick={() => setFiltros(f => ({ ...f, perspectiva: persp }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] border border-[#e2e8f0]'
                }`}
              >
                <span>{labelMap[persp]}</span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda y Filtro Solo Prioritarios */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, indicador..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#cbd5e1] focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <button
            onClick={() => setFiltros(f => ({ ...f, soloPrioritarios: !f.soloPrioritarios }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filtros.soloPrioritarios
                ? 'bg-[#fef9ee] text-[#b47118] border-[#f5dcba]'
                : 'bg-[#f8fafc] text-[#64748b] border-[#cbd5e1] hover:bg-[#f1f5f9]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filtros.soloPrioritarios ? 'fill-[#b47118]' : ''}`} />
            <span>Ver Solo Prioritarios</span>
          </button>
        </div>
      </div>

      {/* GRILLAS POR PERSPECTIVA */}
      {indicadoresFiltrados.length > 0 ? (
        <div className="space-y-6">
          {(['FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'] as PerspectivaCMI[]).map(persp => {
            const indsPersp = indicadoresFiltrados.filter(i => i.perspectiva === persp);
            if (indsPersp.length === 0) return null;

            const iconMap = {
              FINANCIERA: <DollarSign className="w-5 h-5 text-slate-900" />,
              CLIENTES: <Users className="w-5 h-5 text-slate-900" />,
              PROCESOS: <Cpu className="w-5 h-5 text-slate-900" />,
              APRENDIZAJE: <GraduationCap className="w-5 h-5 text-slate-900" />
            };

            const titleMap = {
              FINANCIERA: '1. Perspectiva Financiera (GF1 a GF5)',
              CLIENTES: '2. Perspectiva de Clientes y Comercial (GC1 a GC2)',
              PROCESOS: '3. Perspectiva de Procesos Internos (GP1 a GP3)',
              APRENDIZAJE: '4. Perspectiva de Aprendizaje y Crecimiento (GA1 a GA2)'
            };

            return (
              <section key={persp} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#cbd5e1] pb-2">
                  <div className="p-1.5 bg-[#f1f5f9] rounded-lg border border-[#cbd5e1]">
                    {iconMap[persp]}
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    {titleMap[persp]}
                  </h3>
                  <span className="text-xs text-[#64748b] font-mono ml-auto">
                    {indsPersp.length} indicadores
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {indsPersp.map(renderTarjetaIndicador)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#cbd5e1] text-xs text-[#64748b]">
          <Info className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
          <p className="font-semibold text-sm text-[#0f172a]">No se encontraron indicadores consolidados con los filtros seleccionados</p>
          <button
            onClick={() => {
              setFiltros({ perspectiva: 'TODAS', estado: 'TODOS', periodo: 'CAMPANA', soloPrioritarios: false });
              setSearchTerm('');
            }}
            className="mt-3 px-3.5 py-1.5 bg-[#f1f5f9] text-[#0f172a] font-bold rounded-lg border border-[#cbd5e1] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* =====================================================================
          MODAL DE CONFIGURACIÓN Y EDICIÓN DE METAS CONSOLIDADAS
      ===================================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#cbd5e1] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-[#0f172a]">
                  Administrar Metas del CMI Consolidado
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMeta} className="space-y-4">
              {/* Seleccionar Indicador */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Indicador CMI Consolidado a Modificar:
                </label>
                <select
                  value={selectedMetaId}
                  onChange={(e) => setSelectedMetaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbd5e1] font-semibold text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {metas.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.codigo}] {m.nombre} ({m.perspectiva})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalle del Indicador Seleccionado */}
              {(() => {
                const sel = metas.find(m => m.id === selectedMetaId);
                if (!sel) return null;
                return (
                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs space-y-1">
                    <p className="font-bold text-[#0f172a]">{sel.nombre}</p>
                    <p className="text-[#64748b] text-[11px]">{sel.descripcion}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-800 font-semibold">
                      <span>Unidad: {sel.unidad}</span>
                      <span>·</span>
                      <span>Responsable: {sel.responsable}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Valor Numérico de la Meta */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Valor Numérico Objetivo (Meta):
                </label>
                <input
                  type="text"
                  value={editMetaValor}
                  onChange={(e) => setEditMetaValor(e.target.value)}
                  placeholder="Ej: 85000000 o 95"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbd5e1] font-mono font-bold text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Expresión Textual Oficial */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Expresión Textual de la Meta:
                </label>
                <input
                  type="text"
                  value={editMetaTexto}
                  onChange={(e) => setEditMetaTexto(e.target.value)}
                  placeholder="Ej: >= $85.000.000 /año o >= 95.0%"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbd5e1] font-mono font-bold text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Dirección de Mejora */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Criterio de Evaluación de Semáforo:
                </label>
                <select
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbd5e1] font-semibold text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="MAYOR_MEJOR">Mayor o Igual es Mejor (&gt;= Meta)</option>
                  <option value="MENOR_MEJOR">Menor o Igual es Mejor (&lt;= Meta)</option>
                  <option value="REGLA_CERO">Regla de Cero (&gt;= 0)</option>
                  <option value="INTERVALO">Rango o Intervalo de Tolerancia</option>
                </select>
              </div>

              {guardadoExitoso && (
                <div className="p-2.5 bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10b981]" />
                  <span>Meta consolidada actualizada correctamente en la base local.</span>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer border border-slate-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
