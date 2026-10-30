/**
 * @file IndicadoresView.tsx
 * @description Solapa "INDICADORES DE GESTIÓN" - Cuadro de Mando Integral – Unidad Productiva Porcina
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * 
 * Requerimiento 3 y 8:
 * - Título "INDICADORES DE GESTIÓN" y subtítulo "Cuadro de Mando Integral – Unidad Productiva Porcina"
 * - Eliminación de referencia a "Kaplan y Norton" y "24 indicadores"
 * - Selección dinámica y persistente de indicadores prioritarios con sección "Mis indicadores prioritarios"
 * - Reemplazo de C2 por "Mortalidad en Transporte (muertos a la llegada)"
 * - Conmutación visual ARS/USD en indicadores monetarios
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
  HelpCircle, 
  Filter, 
  Star, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Info, 
  RotateCcw,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  BookOpen
} from 'lucide-react';
import { BaseDatosPorcina, Usuario, VisitaEstudiantil } from '../types/schema';
import { 
  MetaIndicadorCMI, 
  ResultadoIndicadorCMI, 
  PerspectivaCMI, 
  EstadoSemaforo, 
  FiltrosCMI,
  SubfaseP7
} from '../types/cmi';
import { METAS_INICIALES_CMI } from '../lib/cmiConstants';
import { 
  calcularTodosLosIndicadoresCMI, 
  calcularResumenEjecutivoCMI 
} from '../lib/cmiCalculations';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
  onSaveRecord?: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

const STORAGE_METAS_KEY = 'pozo_del_carril_cmi_metas_v3';
const STORAGE_PRIORITARIOS_PREFIX = 'pozo_del_carril_cmi_prioritarios_';

export const IndicadoresView: React.FC<Props> = ({ 
  db, 
  currentUser = null,
  onSaveRecord 
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol, currency } = useCurrency();

  // Storage key personalizada por usuario (Requerimiento 3)
  const userStorageKey = `${STORAGE_PRIORITARIOS_PREFIX}${currentUser?.usuario_id || 'default'}`;

  // Lista configurable de IDs de indicadores prioritarios
  const [prioritariosIds, setPrioritariosIds] = useState<string[]>(() => {
    try {
      const guardados = localStorage.getItem(userStorageKey);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo prioritarios guardados', e);
    }
    // Inicial por defecto
    return METAS_INICIALES_CMI.filter(m => m.esPrioritario).map(m => m.id);
  });

  // Subfase activa para P7: P7_1 (Cría), P7_2 (Destete/recría), P7_3 (Engorde/terminación) (Requerimiento 9)
  const [subfaseP7Activa, setSubfaseP7Activa] = useState<SubfaseP7>('P7_3');

  // Metas configurables con persistencia
  const [metas, setMetas] = useState<MetaIndicadorCMI[]>(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_METAS_KEY) || localStorage.getItem('pozo_del_carril_cmi_metas_v2');
      if (guardadas) {
        let parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) {
          // Migración forzosa para A5: Reemplazar el indicador previo por "Visitas estudiantiles a Porcinos"
          parsed = parsed.map((m: MetaIndicadorCMI) => {
            if (m.id === 'A5' || m.codigo === 'A5') {
              const metaA5Oficial = METAS_INICIALES_CMI.find(x => x.id === 'A5');
              const esMetaAntigua = m.unidad === '%' || m.meta === 100 || !m.nombre?.includes('Visitas') || m.nombre?.includes('Reuniones') || m.nombre !== 'Visitas estudiantiles a Porcinos';
              return {
                ...(metaA5Oficial || m),
                id: 'A5',
                codigo: 'A5',
                nombre: 'Visitas estudiantiles a Porcinos',
                perspectiva: 'APRENDIZAJE',
                unidad: 'visitas',
                direccion: 'MAYOR_MEJOR',
                meta: esMetaAntigua ? 4 : (typeof m.meta === 'number' ? m.meta : 4),
                metaTexto: esMetaAntigua ? '4 visitas' : (m.metaTexto || '4 visitas'),
                responsable: 'Encargado de Producción / Extensión',
                periodoAplicable: 'Anual con revisión trimestral',
                descripcion: 'Número de visitas estudiantiles efectivamente realizadas a la unidad porcina dentro del período seleccionado.',
                esPrioritario: m.esPrioritario || false
              };
            }
            return m;
          });

          // Asegurar que todas las metas oficiales (incluidas P7.1, P7.2, P7.3) existan
          METAS_INICIALES_CMI.forEach(mInit => {
            if (!parsed.some((p: MetaIndicadorCMI) => p.id === mInit.id)) {
              parsed.push(mInit);
            }
          });
          localStorage.setItem(STORAGE_METAS_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo metas guardadas, usando por defecto', e);
    }
    return METAS_INICIALES_CMI;
  });

  // Modal y administración de Visitas Estudiantiles (Requerimiento 8)
  const [showVisitasModal, setShowVisitasModal] = useState(false);
  const [filtroEstadoVisita, setFiltroEstadoVisita] = useState<'TODOS' | 'Realizada' | 'Programada' | 'Cancelada'>('TODOS');
  const [formVisita, setFormVisita] = useState<{
    fecha: string;
    institucion: string;
    carrera_catedra: string;
    cantidad_estudiantes: number;
    responsable: string;
    observaciones: string;
    estado: 'Realizada' | 'Programada' | 'Cancelada';
  }>({
    fecha: new Date().toISOString().split('T')[0],
    institucion: '',
    carrera_catedra: '',
    cantidad_estudiantes: 20,
    responsable: 'Encargado de Producción / Extensión',
    observaciones: '',
    estado: 'Realizada'
  });
  const [editandoVisitaId, setEditandoVisitaId] = useState<string | null>(null);
  const [modoNuevoRegistro, setModoNuevoRegistro] = useState(false);

  // Filtros activos
  const [filtros, setFiltros] = useState<FiltrosCMI>({
    perspectiva: 'TODAS',
    estado: 'TODOS',
    periodo: 'CAMPANA',
    campanaId: 'CAMP_2024_2025',
    soloPrioritarios: false
  });

  // Modal de administración de metas
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMetaId, setSelectedMetaId] = useState<string>('F1');
  const [editMetaValor, setEditMetaValor] = useState<string>('30');
  const [editMetaTexto, setEditMetaTexto] = useState<string>('>= 30%');
  const [editDireccion, setEditDireccion] = useState<any>('MAYOR_MEJOR');
  const [editMotivo, setEditMotivo] = useState<string>('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Alternar prioridad de un indicador (Requerimiento 3)
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
      console.warn('Error guardando prioritarios en localStorage', err);
    }
  };

  // Calcular todos los indicadores en tiempo real
  const todosLosIndicadores = useMemo(() => {
    const raw = calcularTodosLosIndicadoresCMI(db, metas);
    // Aplicar la selección dinámica de prioridad del usuario
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
      return true;
    });
  }, [todosLosIndicadores, filtros]);

  // Lista de Mis Indicadores Prioritarios
  const misIndicadoresPrioritarios = useMemo(() => {
    return todosLosIndicadores.filter(ind => ind.esPrioritario);
  }, [todosLosIndicadores]);

  // Resumen ejecutivo
  const resumen = useMemo(() => {
    return calcularResumenEjecutivoCMI(todosLosIndicadores);
  }, [todosLosIndicadores]);

  // Cargar datos del indicador seleccionado en el modal
  useEffect(() => {
    const metaActual = metas.find(m => m.id === selectedMetaId);
    if (metaActual) {
      if (Array.isArray(metaActual.meta)) {
        setEditMetaValor(metaActual.meta.join(', '));
      } else if (metaActual.meta !== null && metaActual.meta !== undefined) {
        setEditMetaValor(String(metaActual.meta));
      } else {
        setEditMetaValor('');
      }
      setEditMetaTexto(metaActual.metaTexto);
      setEditDireccion(metaActual.direccion);
      setEditMotivo('');
    }
  }, [selectedMetaId, metas]);

  // Guardar nueva meta
  const handleGuardarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = metas.map(m => {
      if (m.id === selectedMetaId) {
        let parsedMeta: number | null | [number, number] = null;
        if (editDireccion === 'INTERVALO' && editMetaValor.includes(',')) {
          const parts = editMetaValor.split(',').map(s => Number(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            parsedMeta = [parts[0], parts[1]];
          }
        } else if (editMetaValor.trim() !== '') {
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
      localStorage.setItem(STORAGE_METAS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando metas en localStorage', e);
    }

    setGuardadoExitoso(true);
    setTimeout(() => {
      setGuardadoExitoso(false);
      setShowConfigModal(false);
    }, 1200);
  };

  // Restaurar metas por defecto
  const handleRestaurarMetas = () => {
    if (confirm('¿Desea restaurar las metas y umbrales a los valores iniciales oficiales?')) {
      setMetas(METAS_INICIALES_CMI);
      localStorage.setItem(STORAGE_METAS_KEY, JSON.stringify(METAS_INICIALES_CMI));
    }
  };

  // Operaciones sobre el Registro de Visitas Estudiantiles (Requerimiento 8)
  const handleGuardarVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVisita.institucion.trim()) {
      alert('Debe indicar la institución visitante.');
      return;
    }

    const listaActual = db.Visitas_Estudiantiles && Array.isArray(db.Visitas_Estudiantiles) 
      ? [...db.Visitas_Estudiantiles] 
      : [];

    if (editandoVisitaId) {
      const idx = listaActual.findIndex(v => v.id === editandoVisitaId);
      if (idx >= 0) {
        listaActual[idx] = {
          ...listaActual[idx],
          fecha: formVisita.fecha,
          institucion: formVisita.institucion.trim(),
          carrera_catedra: formVisita.carrera_catedra.trim(),
          cantidad_estudiantes: Number(formVisita.cantidad_estudiantes) || 0,
          responsable: formVisita.responsable.trim(),
          observaciones: formVisita.observaciones.trim(),
          estado: formVisita.estado
        };
      }
    } else {
      const nuevaVisita: VisitaEstudiantil = {
        id: `VIS_${Date.now()}`,
        fecha: formVisita.fecha,
        institucion: formVisita.institucion.trim(),
        carrera_catedra: formVisita.carrera_catedra.trim(),
        cantidad_estudiantes: Number(formVisita.cantidad_estudiantes) || 0,
        responsable: formVisita.responsable.trim(),
        observaciones: formVisita.observaciones.trim(),
        estado: formVisita.estado,
        origen_dato: 'REAL'
      };
      listaActual.push(nuevaVisita);
    }

    if (onSaveRecord) {
      await onSaveRecord('Visitas_Estudiantiles', listaActual);
    } else {
      db.Visitas_Estudiantiles = listaActual;
    }

    setModoNuevoRegistro(false);
    setEditandoVisitaId(null);
    setFormVisita({
      fecha: new Date().toISOString().split('T')[0],
      institucion: '',
      carrera_catedra: '',
      cantidad_estudiantes: 20,
      responsable: 'Encargado de Producción / Extensión',
      observaciones: '',
      estado: 'Realizada'
    });
  };

  const handleCambiarEstadoVisita = async (id: string, nuevoEstado: 'Realizada' | 'Programada' | 'Cancelada') => {
    const listaActual = db.Visitas_Estudiantiles && Array.isArray(db.Visitas_Estudiantiles) 
      ? [...db.Visitas_Estudiantiles] 
      : [];
    const idx = listaActual.findIndex(v => v.id === id);
    if (idx >= 0) {
      listaActual[idx] = { ...listaActual[idx], estado: nuevoEstado };
      if (onSaveRecord) {
        await onSaveRecord('Visitas_Estudiantiles', listaActual);
      } else {
        db.Visitas_Estudiantiles = listaActual;
      }
    }
  };

  const handleEliminarVisita = async (id: string) => {
    if (!confirm('¿Desea eliminar este registro de visita?')) return;
    const listaActual = db.Visitas_Estudiantiles && Array.isArray(db.Visitas_Estudiantiles) 
      ? db.Visitas_Estudiantiles.filter(v => v.id !== id) 
      : [];
    if (onSaveRecord) {
      await onSaveRecord('Visitas_Estudiantiles', listaActual);
    } else {
      db.Visitas_Estudiantiles = listaActual;
    }
  };

  // Ayudante de estilo para cada estado de semáforo
  const getBadgeSemaforo = (estado: EstadoSemaforo, texto: string) => {
    switch (estado) {
      case 'VERDE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#144a29] bg-[#edf7f0] border border-[#b8dfc4] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1b7a3d]" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4c6657] bg-[#f3f7f4] border border-[#cbd8cb] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#628072]" />
            <span>META PENDIENTE: {texto}</span>
          </span>
        );
      case 'GRIS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55695d] bg-[#edf1ee] border border-[#cfdacf] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#83978a]" />
            <span>GRIS: {texto}</span>
          </span>
        );
    }
  };

  // Formatear valor si es monetario con soporte ARS/USD
  const getValorFormateado = (ind: ResultadoIndicadorCMI): string => {
    if (!ind.datosDisponibles || ind.valorCalculado === null) {
      return ind.valorFormateado;
    }

    if (currency === 'USD') {
      if (ind.unidad === '$') {
        return formatMoney(ind.valorCalculado);
      }
      if (ind.unidad === '$/kg') {
        return `${formatMoney(ind.valorCalculado)}/kg`;
      }
      if (ind.unidad === '$/cab') {
        return `${formatMoney(ind.valorCalculado)}/cab`;
      }
    }

    return ind.valorFormateado;
  };

  // Renderizar una tarjeta individual de indicador
  const renderTarjetaIndicador = (ind: ResultadoIndicadorCMI) => {
    const isStarred = ind.esPrioritario;

    // Tarjeta Especial P7: Ganancia media diaria con selector de 3 fases (Requerimiento 9)
    if (ind.id === 'P7' && ind.subindicadoresP7) {
      const sub = ind.subindicadoresP7[subfaseP7Activa] || ind.subindicadoresP7.P7_3;

      return (
        <div 
          key={ind.id}
          className={`bg-white rounded-xl p-4.5 border transition-all duration-150 flex flex-col justify-between shadow-2xs ${
            isStarred 
              ? 'border-[#225736] ring-1 ring-[#225736]/20 bg-gradient-to-b from-white to-[#fbfdfb]' 
              : 'border-[#d8e2d7] hover:border-[#b8c9b8]'
          }`}
        >
          <div>
            {/* Fila superior: Código P7, Botón de Prioridad y Selector de Fase */}
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#ebf2ec] text-[#1c472c] border border-[#cedece]">
                  {ind.codigo}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleTogglePrioridad(ind.id, e)}
                  className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                    isStarred
                      ? 'bg-[#fef9ee] text-[#b47118] border border-[#f5dcba] hover:bg-[#fdeecb]'
                      : 'bg-[#f7faf7] text-[#8fa797] border border-[#d8e2d7] hover:text-[#1c472c] hover:border-[#1c472c]'
                  }`}
                  title={isStarred ? 'Quitar de mis indicadores prioritarios' : 'Agregar a mis indicadores prioritarios'}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#b47118]' : ''}`} />
                  <span className="text-[10px] hidden sm:inline">
                    {isStarred ? 'Prioritario' : 'Priorizar'}
                  </span>
                </button>
              </div>

              {/* Selector Desplegable de Fases P7 (Requerimiento 9) */}
              <div className="flex items-center gap-1.5 bg-[#edf7f0] border border-[#b8dfc4] rounded-lg px-2 py-1 shadow-2xs">
                <span className="text-[10px] font-bold text-[#144a29]">Fase:</span>
                <select
                  value={subfaseP7Activa}
                  onChange={(e) => setSubfaseP7Activa(e.target.value as SubfaseP7)}
                  className="text-xs font-bold text-[#144a29] bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                  title="Seleccionar subfase para evaluar Ganancia Media Diaria"
                >
                  <option value="P7_1">P7.1 Cría/lactancia</option>
                  <option value="P7_2">P7.2 Destete/recría</option>
                  <option value="P7_3">P7.3 Engorde/terminación</option>
                </select>
              </div>
            </div>

            {/* 1. Nombre principal y Subindicador activo */}
            <div className="mb-2.5">
              <h4 className="text-sm font-bold text-[#143422] leading-snug">
                P7 – Ganancia media diaria
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-bold text-[#18532f] bg-[#eef7f1] px-2 py-0.5 rounded border border-[#cbe4d3]">
                  {sub.nombre}
                </span>
                <span className="text-[10px] text-[#5d7768]">
                  (Registros reales por lote)
                </span>
              </div>
            </div>

            {/* 2. Resultado Calculado y Unidad */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-[#668070] mb-0.5">
                <span>Resultado Obtenido</span>
                <span className="text-[10px] font-mono text-[#385844] font-bold">kg/día</span>
              </div>
              <div className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
                sub.datosDisponibles ? 'text-[#143422]' : 'text-[#728578] italic text-base sm:text-lg'
              }`}>
                {sub.valorFormateado}
              </div>

              {/* Parámetros reales de cálculo: Peso inicial, Peso final y Días */}
              {sub.datosDisponibles && sub.pesoInicialKg !== null && sub.pesoFinalKg !== null && (
                <div className="grid grid-cols-3 gap-1.5 mt-2 p-2 rounded-lg bg-[#f6faf7] border border-[#dce9dd] text-center text-[10px]">
                  <div>
                    <span className="text-[#698474] block text-[9px] uppercase font-semibold">P. Inicial</span>
                    <span className="font-mono font-bold text-[#183a26]">{sub.pesoInicialKg} kg</span>
                  </div>
                  <div className="border-x border-[#dbe6db]">
                    <span className="text-[#698474] block text-[9px] uppercase font-semibold">P. Final</span>
                    <span className="font-mono font-bold text-[#183a26]">{sub.pesoFinalKg} kg</span>
                  </div>
                  <div>
                    <span className="text-[#698474] block text-[9px] uppercase font-semibold">Permanencia</span>
                    <span className="font-mono font-bold text-[#183a26]">{sub.diasPermanencia} días</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Meta Específica Editable */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#f6f9f6] border border-[#e2ece2] mb-3 text-xs">
              <span className="text-[#597363] font-medium">Meta específica ({sub.codigo}):</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#183a26]">
                  {sub.metaTexto}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMetaId(sub.id);
                    setShowConfigModal(true);
                  }}
                  className="text-[10px] font-bold text-[#1f663c] hover:underline cursor-pointer"
                  title={`Editar meta para ${sub.nombre}`}
                >
                  (Editar)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Estado del Semáforo */}
          <div className="pt-3 border-t border-[#edf2ec] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6c8375]">Estado CMI:</span>
              {getBadgeSemaforo(sub.estadoSemaforo, sub.textoEstado)}
            </div>

            {/* 5. Lote y Período */}
            <div className="flex items-center justify-between text-[11px] text-[#627a6c] pt-1">
              <span className="truncate pr-1 font-medium" title={`Lote asociado: ${sub.loteCodigo}`}>
                Lote: {sub.loteCodigo}
              </span>
              <span className="font-mono text-[10px] shrink-0 text-[#7c9284]" title={`Período: ${sub.periodo}`}>
                {sub.periodo}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Tarjeta Especial A5: Visitas estudiantiles a Porcinos (Requerimiento 8)
    if (ind.id === 'A5') {
      const cantRealizadas = ind.datosVisitas?.realizadas ?? ind.valorCalculado ?? 0;
      const metaVisitas = ind.datosVisitas?.meta ?? 4;
      const pctAvance = ind.avancePct ?? (metaVisitas > 0 ? (cantRealizadas / metaVisitas) * 100 : 0);

      return (
        <div 
          key={ind.id}
          className={`bg-white rounded-xl p-4.5 border transition-all duration-150 flex flex-col justify-between shadow-2xs ${
            isStarred 
              ? 'border-[#225736] ring-1 ring-[#225736]/20 bg-gradient-to-b from-white to-[#fbfdfb]' 
              : 'border-[#d8e2d7] hover:border-[#b8c9b8]'
          }`}
        >
          <div>
            {/* Fila superior: Código A5, Botón de Prioridad y Responsable */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#ebf2ec] text-[#1c472c] border border-[#cedece]">
                  {ind.codigo}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleTogglePrioridad(ind.id, e)}
                  className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                    isStarred
                      ? 'bg-[#fef9ee] text-[#b47118] border border-[#f5dcba] hover:bg-[#fdeecb]'
                      : 'bg-[#f7faf7] text-[#8fa797] border border-[#d8e2d7] hover:text-[#1c472c] hover:border-[#1c472c]'
                  }`}
                  title={isStarred ? 'Quitar de mis indicadores prioritarios' : 'Agregar a mis indicadores prioritarios'}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#b47118]' : ''}`} />
                  <span className="text-[10px] hidden sm:inline">
                    {isStarred ? 'Prioritario' : 'Priorizar'}
                  </span>
                </button>
              </div>

              <span className="text-[10px] text-[#6b8273] font-medium truncate max-w-[140px]" title={`Responsable: ${ind.responsable}`}>
                {ind.responsable}
              </span>
            </div>

            {/* 1. Nombre oficial del Indicador */}
            <h4 className="text-sm font-bold text-[#143422] leading-snug mb-2">
              A5 – Visitas estudiantiles a Porcinos
            </h4>

            {/* 2. Número de Visitas Efectivamente Realizadas (Sin fórmulas) */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-[#668070] mb-0.5">
                <span>Número de Visitas</span>
                <span className="text-[10px] font-mono font-bold text-[#1b5e37]">
                  {cantRealizadas} de {metaVisitas} realizadas
                </span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#143422]">
                {cantRealizadas} {cantRealizadas === 1 ? 'visita realizada' : 'visitas realizadas'}
              </div>
            </div>

            {/* 3. Meta y Botón para Editar Meta */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#f6f9f6] border border-[#e2ece2] mb-2.5 text-xs">
              <span className="text-[#597363] font-medium">Meta del período:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#183a26]">
                  {metaVisitas} visitas
                </span>
                {permissions.canModifyMetas && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMetaId('A5');
                      setShowConfigModal(true);
                    }}
                    className="text-[10px] font-bold text-[#1f663c] hover:underline cursor-pointer"
                    title="Editar meta de visitas"
                  >
                    (Editar)
                  </button>
                )}
              </div>
            </div>

            {/* 4. Avance de Cumplimiento (Sin fórmulas) */}
            <div className="space-y-1 mb-2.5 bg-[#fafcfa] p-2 rounded-lg border border-[#e8efe8]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#5b7565] font-medium">Avance de cumplimiento:</span>
                <span className="font-mono font-bold text-[#1b5e37]">{pctAvance.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#e2ede4] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    pctAvance >= 100 ? 'bg-[#16a34a]' : pctAvance >= 90 ? 'bg-[#ca8a04]' : 'bg-[#1c4b31]'
                  }`}
                  style={{ width: `${Math.min(100, pctAvance)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 5. Estado del Semáforo y Período */}
          <div className="pt-2.5 border-t border-[#edf2ec] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6c8375]">Estado CMI:</span>
              {getBadgeSemaforo(ind.estadoSemaforo, ind.textoEstado)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#627a6c] pt-0.5">
              <span className="truncate pr-1 font-medium" title={ind.periodoConsiderado}>
                Período: {ind.periodoConsiderado}
              </span>
              <button
                type="button"
                onClick={() => setShowVisitasModal(true)}
                className="text-[11px] font-bold text-[#1b5e37] hover:underline cursor-pointer flex items-center gap-1 shrink-0 bg-[#eaf4ed] px-2 py-0.5 rounded border border-[#b8dfc4]"
                title="Ver y registrar visitas estudiantiles"
              >
                Registros ({ind.datosVisitas?.total ?? (db.Visitas_Estudiantiles?.length || 0)}) →
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={ind.id}
        className={`bg-white rounded-xl p-4.5 border transition-all duration-150 flex flex-col justify-between shadow-2xs ${
          isStarred 
            ? 'border-[#225736] ring-1 ring-[#225736]/20 bg-gradient-to-b from-white to-[#fbfdfb]' 
            : 'border-[#d8e2d7] hover:border-[#b8c9b8]'
        }`}
      >
        <div>
          {/* Fila superior: Código, Botón de Prioridad y Responsable */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#ebf2ec] text-[#1c472c] border border-[#cedece]">
                {ind.codigo}
              </span>

              {/* Botón de Estrella / Marcador de Prioridad (Requerimiento 3) */}
              <button
                type="button"
                onClick={(e) => handleTogglePrioridad(ind.id, e)}
                className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                  isStarred
                    ? 'bg-[#fef9ee] text-[#b47118] border border-[#f5dcba] hover:bg-[#fdeecb]'
                    : 'bg-[#f7faf7] text-[#8fa797] border border-[#d8e2d7] hover:text-[#1c472c] hover:border-[#1c472c]'
                }`}
                title={isStarred ? 'Quitar de mis indicadores prioritarios' : 'Agregar a mis indicadores prioritarios'}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#b47118]' : ''}`} />
                <span className="text-[10px] hidden sm:inline">
                  {isStarred ? 'Prioritario' : 'Priorizar'}
                </span>
              </button>
            </div>

            <span className="text-[10px] text-[#6b8273] font-medium truncate max-w-[130px]" title={`Responsable: ${ind.responsable}`}>
              {ind.responsable}
            </span>
          </div>

          {/* 1. Nombre del Indicador */}
          <h4 className="text-sm font-bold text-[#143422] leading-snug mb-3">
            {ind.nombre}
          </h4>

          {/* 2. Resultado Calculado y Unidad */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#668070] mb-0.5">
              Resultado Obtenido
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
              ind.datosDisponibles ? 'text-[#143422]' : 'text-[#728578] italic text-base sm:text-lg'
            }`}>
              {getValorFormateado(ind)}
            </div>
          </div>

          {/* 3. Meta Correspondiente */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#f6f9f6] border border-[#e2ece2] mb-3 text-xs">
            <span className="text-[#597363] font-medium">Meta oficial:</span>
            <span className="font-mono font-bold text-[#183a26]">
              {ind.metaTexto}
            </span>
          </div>
        </div>

        {/* 4. Estado del Semáforo con texto además de color */}
        <div className="pt-3 border-t border-[#edf2ec] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#6c8375]">Estado CMI:</span>
            {getBadgeSemaforo(ind.estadoSemaforo, ind.textoEstado)}
          </div>

          {/* 5. Período considerado y fecha de actualización */}
          <div className="flex items-center justify-between text-[11px] text-[#627a6c] pt-1">
            <span className="truncate pr-1" title={ind.periodoConsiderado}>
              {ind.periodoConsiderado}
            </span>
            <span className="font-mono text-[10px] shrink-0 text-[#7c9284]">
              {ind.fechaActualizacion}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Indicadores agrupados por perspectiva
  const indFinanciera = indicadoresFiltrados.filter(i => i.perspectiva === 'FINANCIERA');
  const indClientes = indicadoresFiltrados.filter(i => i.perspectiva === 'CLIENTES');
  const indProcesos = indicadoresFiltrados.filter(i => i.perspectiva === 'PROCESOS');
  const indAprendizaje = indicadoresFiltrados.filter(i => i.perspectiva === 'APRENDIZAJE');

  return (
    <div className="space-y-6 font-sans">
      {/* =====================================================================
          ENCABEZADO DE LA SOLAPA (Requerimiento 3)
          Título: INDICADORES DE GESTIÓN
          Subtítulo: Cuadro de Mando Integral – Unidad Productiva Porcina
          Eliminada mención a "Kaplan y Norton" y "24 indicadores"
      ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-[#143422] tracking-tight">
              INDICADORES DE GESTIÓN
            </h2>
            <span className="text-xs font-semibold text-[#1b5c34] bg-[#edf7f0] px-2.5 py-0.5 rounded-full border border-[#cbe5d3]">
              Cuadro de Mando Integral – Unidad Productiva Porcina
            </span>
            <span className="text-[10px] font-bold text-[#5c7767] uppercase tracking-wider bg-[#f2f6f2] px-2 py-0.5 rounded border border-[#d5ded5]">
              Pozo del Carril · UNRC
            </span>
          </div>
          <p className="text-xs text-[#526e5e] mt-1 max-w-3xl">
            Monitoreo y evaluación de desempeño económico, productivo y comercial con cálculo estricto sobre información real del establecimiento (sin datos de simulación).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#1a4b30] hover:bg-[#123823] rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-[#163c26]"
            title="Configurar metas, umbrales y tolerancias"
          >
            <Sliders className="w-4 h-4" />
            <span>Administrar Metas</span>
          </button>

          <button
            onClick={handleRestaurarMetas}
            className="p-2 text-[#567061] hover:text-[#183a26] hover:bg-[#ebf0ea] rounded-xl transition-colors cursor-pointer border border-[#d5ded5]"
            title="Restaurar metas predeterminadas oficiales"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECCIÓN: MIS INDICADORES PRIORITARIOS (Requerimiento 3)
      ===================================================================== */}
      <section className="bg-gradient-to-b from-[#f9fbf9] to-white p-5 rounded-2xl border-2 border-[#1c4b31]/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e0ebe0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1c4b31] text-white flex items-center justify-center shadow-xs">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#143422] tracking-tight">
                Mis Indicadores Prioritarios
              </h3>
              <p className="text-xs text-[#557361]">
                Selección personalizada activa para {currentUser?.nombre || 'este usuario'} ({misIndicadoresPrioritarios.length} elegidos). Haga clic en la estrella de cualquier tarjeta para agregar o quitar.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#1c4b31] bg-[#eaf4ec] px-3 py-1 rounded-lg border border-[#c5e4cd]">
            {misIndicadoresPrioritarios.length} prioritarios guardados
          </span>
        </div>

        {misIndicadoresPrioritarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {misIndicadoresPrioritarios.map(renderTarjetaIndicador)}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#c5d8c8] text-xs text-[#5a7566]">
            <Star className="w-8 h-8 text-[#a3bfae] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#183a26]">No tiene indicadores prioritarios marcados</p>
            <p className="mt-1">Haga clic en el botón de estrella de cualquier tarjeta para destacarlo en esta sección.</p>
          </div>
        )}
      </section>

      {/* =====================================================================
          RESUMEN EJECUTIVO DEL CUADRO DE MANDO
      ===================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5ece4] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#143422] tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1b7a3d]" />
              <span>Resumen Ejecutivo del Cuadro de Mando</span>
            </h3>
            <p className="text-xs text-[#5c7767]">
              Distribución de los indicadores de la Unidad Productiva Porcina por estado de cumplimiento
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#1c472c] bg-[#edf6f0] px-3 py-1 rounded-lg border border-[#cbe3d2] self-start sm:self-auto">
            Total en Sistema: {todosLosIndicadores.length} Indicadores
          </span>
        </div>

        {/* Tarjetas de Conteo de Estados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* VERDE */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'VERDE' ? 'TODOS' : 'VERDE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'VERDE' 
                ? 'bg-[#e7f4eb] border-[#93cfa3] ring-2 ring-[#225736]' 
                : 'bg-[#edf7f0] border-[#cbe5d3] hover:border-[#a8d3b4]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#164e2c]">
              <span>Verde</span>
              <CheckCircle2 className="w-4 h-4 text-[#1b7a3d]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#164e2c] mt-1">
              {resumen.cantVerde}
            </div>
            <div className="text-[10px] text-[#2c6341] mt-0.5">Meta alcanzada</div>
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
            <div className="text-[10px] text-[#9c6314] mt-0.5">En atención</div>
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
            <div className="text-[10px] text-[#a82525] mt-0.5">Desvío importante</div>
          </button>

          {/* GRIS */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'GRIS' ? 'TODOS' : 'GRIS' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'GRIS' 
                ? 'bg-[#e2e8e3] border-[#9fb3a4] ring-2 ring-[#455c4c]' 
                : 'bg-[#edf1ee] border-[#d2ddd3] hover:border-[#b4c5b6]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#3a4e41]">
              <span>Gris</span>
              <HelpCircle className="w-4 h-4 text-[#607767]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#3d5245] mt-1">
              {resumen.cantGris}
            </div>
            <div className="text-[10px] text-[#5e7767] mt-0.5">Datos insuficientes</div>
          </button>

          {/* META PENDIENTE */}
          <button
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'META_PENDIENTE' ? 'TODOS' : 'META_PENDIENTE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'META_PENDIENTE' 
                ? 'bg-[#e4ece6] border-[#a1b8a8] ring-2 ring-[#45614f]' 
                : 'bg-[#f3f7f4] border-[#d6dfd8] hover:border-[#b9c8bc]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#415949]">
              <span>Pendiente</span>
              <Clock className="w-4 h-4 text-[#53735e]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#354c3c] mt-1">
              {resumen.cantMetaPendiente}
            </div>
            <div className="text-[10px] text-[#55705e] mt-0.5">Sin meta definida</div>
          </button>
        </div>

        {/* Aspectos Críticos a Investigar */}
        {resumen.criticos.length > 0 && (
          <div className="p-4 bg-[#fbf6ef] border border-[#f4dfbe] rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#855110] font-bold">
              <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />
              <span>Indicadores con Desvío o en Atención ({resumen.criticos.length}) · Aspectos a Investigar</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {resumen.criticos.map(c => (
                <div key={c.id} className="p-2 bg-white rounded-lg border border-[#f4dfbe] flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#855110]">{c.codigo}:</span>{' '}
                    <span className="font-semibold text-[#183123]">{c.nombre}</span>
                    <p className="text-[#657d6e] mt-0.5 italic">{c.aspectoAInvestigar || 'Requiere análisis operativo.'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    c.estadoSemaforo === 'ROJO' ? 'bg-[#fdf2f2] text-[#8a1c1c]' : 'bg-[#fef8ee] text-[#855110]'
                  }`}>
                    {c.valorFormateado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros por Perspectiva y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#d8e2d7] shadow-2xs text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[#5c7767] font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Perspectiva:</span>
          </span>
          {(['TODAS', 'FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFiltros(f => ({ ...f, perspectiva: p }))}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                filtros.perspectiva === p
                  ? 'bg-[#1c4b31] text-white shadow-xs'
                  : 'text-[#486352] hover:bg-[#edf5ef]'
              }`}
            >
              {p === 'TODAS' ? 'Todas' : p === 'CLIENTES' ? 'Clientes' : p === 'PROCESOS' ? 'Procesos' : p === 'FINANCIERA' ? 'Financiera' : 'Aprendizaje'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFiltros(f => ({ ...f, soloPrioritarios: !f.soloPrioritarios }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
              filtros.soloPrioritarios
                ? 'bg-[#e2efe5] border-[#93cfa3] text-[#144a29]'
                : 'bg-white border-[#d2ded2] text-[#4d6657] hover:bg-[#f6f9f6]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filtros.soloPrioritarios ? 'fill-[#144a29]' : ''}`} />
            <span>Solo Prioritarios ({prioritariosIds.length})</span>
          </button>

          {filtros.estado !== 'TODOS' && (
            <button
              onClick={() => setFiltros(f => ({ ...f, estado: 'TODOS' }))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#edf3ef] text-[#2b4c39] border border-[#cbd8cb] text-xs font-medium cursor-pointer"
            >
              <span>Filtro: {filtros.estado}</span>
              <XCircle className="w-3.5 h-3.5 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          SECCIÓN 1: PERSPECTIVA FINANCIERA
      ===================================================================== */}
      {(filtros.perspectiva === 'TODAS' || filtros.perspectiva === 'FINANCIERA') && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#d8e2d7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#144a29] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                F
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143422] uppercase tracking-wide">
                  Perspectiva Financiera
                </h3>
                <span className="text-xs text-[#5c7767]">
                  Rentabilidad real, costos incrementales de engorde, cobertura de costos y precios de venta
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-[#1c472c] bg-[#edf6f0] px-2 py-0.5 rounded border border-[#cbe3d2]">
              {indFinanciera.length} indicadores visibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indFinanciera.map(renderTarjetaIndicador)}
          </div>
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 2: PERSPECTIVA CLIENTES Y DESTINATARIOS
      ===================================================================== */}
      {(filtros.perspectiva === 'TODAS' || filtros.perspectiva === 'CLIENTES') && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#d8e2d7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1e486b] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                C
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143422] uppercase tracking-wide">
                  Perspectiva Clientes y Destinatarios
                </h3>
                <span className="text-xs text-[#5c7767]">
                  Cumplimiento de especificación comercial frigorífica, mortalidad en transporte (C2) y cobranzas
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-[#1e486b] bg-[#edf4fa] px-2 py-0.5 rounded border border-[#cbdef0]">
              {indClientes.length} indicadores visibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indClientes.map(renderTarjetaIndicador)}
          </div>
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 3: PERSPECTIVA PROCESOS INTERNOS
      ===================================================================== */}
      {(filtros.perspectiva === 'TODAS' || filtros.perspectiva === 'PROCESOS') && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#d8e2d7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#8c5717] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                P
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143422] uppercase tracking-wide">
                  Perspectiva Procesos Internos
                </h3>
                <span className="text-xs text-[#5c7767]">
                  Eficiencia zootécnica, conversión alimenticia (ICA), partos por cerda/año y supervivencia predestete
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-[#8c5717] bg-[#fdf5eb] px-2 py-0.5 rounded border border-[#f4dfb6]">
              {indProcesos.length} indicadores visibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indProcesos.map(renderTarjetaIndicador)}
          </div>
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 4: PERSPECTIVA APRENDIZAJE Y DESARROLLO
      ===================================================================== */}
      {(filtros.perspectiva === 'TODAS' || filtros.perspectiva === 'APRENDIZAJE') && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#d8e2d7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#53396b] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                A
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143422] uppercase tracking-wide">
                  Perspectiva Aprendizaje y Desarrollo
                </h3>
                <span className="text-xs text-[#5c7767]">
                  Capacitación del personal de granja, reuniones de análisis de desvíos, auditoría interna y bioseguridad
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-[#53396b] bg-[#f9f4fd] px-2 py-0.5 rounded border border-[#e8d7fa]">
              {indAprendizaje.length} indicadores visibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indAprendizaje.map(renderTarjetaIndicador)}
          </div>
        </section>
      )}

      {/* Modal para Administrar Metas */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#1c4b31]" />
                <h3 className="text-base font-bold text-[#153422]">
                  Administrar Metas del Cuadro de Mando
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {guardadoExitoso && (
              <div className="p-3 bg-[#eaf5ed] border border-[#b8dfc4] text-[#1b7a3d] text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Meta actualizada y registrada en auditoría con éxito.</span>
              </div>
            )}

            <form onSubmit={handleGuardarMeta} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Seleccionar Indicador:
                </label>
                <select
                  value={selectedMetaId}
                  onChange={(e) => setSelectedMetaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                >
                  {metas.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.codigo}] {m.nombre} ({m.perspectiva})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Valor Numérico de Meta:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 30 o 0"
                    value={editMetaValor}
                    onChange={(e) => setEditMetaValor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Texto Visible de Meta:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. >= 30%"
                    value={editMetaTexto}
                    onChange={(e) => setEditMetaTexto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Sentido / Regla de Mejora:
                </label>
                <select
                  value={editDireccion}
                  onChange={(e: any) => setEditDireccion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none"
                >
                  <option value="MAYOR_MEJOR">Mayor o Igual es Mejor (ej. Margen, Entregas en fecha)</option>
                  <option value="MENOR_MEJOR">Menor o Igual es Mejor (ej. Costos, Mortalidad en transporte)</option>
                  <option value="INTERVALO">Intervalo de Tolerancia (ej. [-5%, +5%])</option>
                  <option value="REGLA_CERO">Regla de No Negatividad (&gt;= $0)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Motivo de Modificación (Trazabilidad):
                </label>
                <input
                  type="text"
                  placeholder="ej. Actualización de meta según plan de campaña 2025"
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5ede5]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c8d8ca] text-[#4b6a57] hover:bg-[#edf5ef] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1c4b31] hover:bg-[#123823] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Registro y Gestión de Visitas Estudiantiles (Requerimiento 8) */}
      {showVisitasModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-[#d8e2d7] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Cabecera */}
            <div className="p-4 sm:p-5 border-b border-[#edf2ec] bg-[#fafcfb] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1c4b31] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  A5
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#143422]">
                    Registro Oficial de Visitas Estudiantiles a la Unidad Porcina
                  </h3>
                  <p className="text-xs text-[#526f5e]">
                    Solo las visitas con estado <strong>Realizada</strong> computan para el resultado del indicador A5 – Visitas estudiantiles a Porcinos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVisitasModal(false);
                  setModoNuevoRegistro(false);
                  setEditandoVisitaId(null);
                }}
                className="text-[#648070] hover:text-[#183123] font-bold text-xl px-2 py-1 rounded-lg hover:bg-[#edf2ed] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Barra de Filtros y Acción Nueva Visita */}
            <div className="p-3 bg-[#f5f8f5] border-b border-[#e5ece5] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[#486654]">Filtrar estado:</span>
                {(['TODOS', 'Realizada', 'Programada', 'Cancelada'] as const).map((est) => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstadoVisita(est)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      filtroEstadoVisita === est
                        ? 'bg-[#1c4b31] text-white shadow-2xs'
                        : 'bg-white text-[#3f5c49] border border-[#d2dfd4] hover:bg-[#eaf2eb]'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>

              {!modoNuevoRegistro && permissions.canCreateRecords && (
                <button
                  onClick={() => {
                    setModoNuevoRegistro(true);
                    setEditandoVisitaId(null);
                    setFormVisita({
                      fecha: new Date().toISOString().split('T')[0],
                      institucion: '',
                      carrera_catedra: '',
                      cantidad_estudiantes: 20,
                      responsable: 'Encargado de Producción / Extensión',
                      observaciones: '',
                      estado: 'Realizada'
                    });
                  }}
                  className="px-3 py-1.5 bg-[#1c4b31] hover:bg-[#123823] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Nueva Visita</span>
                </button>
              )}
            </div>

            {/* Formulario de Alta / Edición de Visita */}
            {modoNuevoRegistro && (
              <form onSubmit={handleGuardarVisita} className="p-4 bg-[#f8faf8] border-b border-[#dce6dc] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1c4b31]">
                    {editandoVisitaId ? 'Editar Visita Estudiantil' : 'Nueva Visita Estudiantil'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setModoNuevoRegistro(false);
                      setEditandoVisitaId(null);
                    }}
                    className="text-xs text-[#5d7a69] hover:underline cursor-pointer"
                  >
                    Cancelar formulario
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Fecha de Visita:</label>
                    <input
                      type="date"
                      required
                      value={formVisita.fecha}
                      onChange={(e) => setFormVisita({ ...formVisita, fecha: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Institución Educativa:</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. UNRC, IPEA N° 291"
                      value={formVisita.institucion}
                      onChange={(e) => setFormVisita({ ...formVisita, institucion: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Carrera / Cátedra:</label>
                    <input
                      type="text"
                      placeholder="ej. Producción Porcina / Veterinaria"
                      value={formVisita.carrera_catedra}
                      onChange={(e) => setFormVisita({ ...formVisita, carrera_catedra: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Cantidad de Asistentes:</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formVisita.cantidad_estudiantes}
                      onChange={(e) => setFormVisita({ ...formVisita, cantidad_estudiantes: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Responsable Institucional:</label>
                    <input
                      type="text"
                      value={formVisita.responsable}
                      onChange={(e) => setFormVisita({ ...formVisita, responsable: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#234230] mb-1">Estado de la Visita:</label>
                    <select
                      value={formVisita.estado}
                      onChange={(e: any) => setFormVisita({ ...formVisita, estado: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white font-semibold"
                    >
                      <option value="Realizada">Realizada (Computa en indicador A5)</option>
                      <option value="Programada">Programada (Pendiente de ejecución)</option>
                      <option value="Cancelada">Cancelada (Suspendida)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1 text-xs">Observaciones / Temas abordados:</label>
                  <input
                    type="text"
                    placeholder="ej. Recorrida por pistas de engorde, sanidad y manejo de comederos"
                    value={formVisita.observaciones}
                    onChange={(e) => setFormVisita({ ...formVisita, observaciones: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoNuevoRegistro(false);
                      setEditandoVisitaId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#c8d8ca] text-xs font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#1c4b31] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#123823] cursor-pointer"
                  >
                    {editandoVisitaId ? 'Guardar Cambios' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            )}

            {/* Tabla de Registros de Visitas */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const todas = db.Visitas_Estudiantiles && Array.isArray(db.Visitas_Estudiantiles) 
                  ? db.Visitas_Estudiantiles 
                  : [];
                const filtradas = todas.filter(v => {
                  if (filtroEstadoVisita === 'TODOS') return true;
                  return String(v.estado || '').toLowerCase() === filtroEstadoVisita.toLowerCase();
                });

                if (filtradas.length === 0) {
                  return (
                    <div className="text-center py-10 text-xs text-[#63806f]">
                      No hay visitas registradas para el filtro seleccionado.
                    </div>
                  );
                }

                return (
                  <div className="border border-[#dce6dc] rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f0f5f1] text-[#1c4b31] font-bold border-b border-[#dce6dc]">
                        <tr>
                          <th className="p-2.5">Fecha</th>
                          <th className="p-2.5">Institución / Cátedra</th>
                          <th className="p-2.5 text-center">Asistentes</th>
                          <th className="p-2.5">Responsable</th>
                          <th className="p-2.5">Estado</th>
                          <th className="p-2.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2ed]">
                        {filtradas.map((vis) => {
                          const estLower = String(vis.estado || '').toLowerCase();
                          const esReal = estLower === 'realizada';
                          const esProg = estLower === 'programada';

                          return (
                            <tr key={vis.id} className="hover:bg-[#f9fbf9] transition-colors">
                              <td className="p-2.5 font-mono font-medium text-[#224430] whitespace-nowrap">
                                {vis.fecha}
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-[#143422]">{vis.institucion}</div>
                                {vis.carrera_catedra && (
                                  <div className="text-[11px] text-[#557361]">{vis.carrera_catedra}</div>
                                )}
                                {vis.observaciones && (
                                  <div className="text-[10px] text-[#789684] italic mt-0.5">{vis.observaciones}</div>
                                )}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-[#1b5e37]">
                                {vis.cantidad_estudiantes} est.
                              </td>
                              <td className="p-2.5 text-[#3b5747]">
                                {vis.responsable}
                              </td>
                              <td className="p-2.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  esReal
                                    ? 'bg-[#edf7f0] text-[#15803d] border border-[#bbf7d0]'
                                    : esProg
                                    ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]'
                                    : 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    esReal ? 'bg-[#15803d]' : esProg ? 'bg-[#1d4ed8]' : 'bg-[#b91c1c]'
                                  }`} />
                                  <span>{vis.estado}</span>
                                </span>
                              </td>
                              <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                                {esProg && permissions.canModifyRecords && (
                                  <button
                                    onClick={() => handleCambiarEstadoVisita(vis.id, 'Realizada')}
                                    className="px-2 py-0.5 bg-[#edf7f0] text-[#15803d] hover:bg-[#dcfce7] border border-[#bbf7d0] rounded font-bold text-[10px] cursor-pointer"
                                    title="Marcar visita como realizada"
                                  >
                                    ✓ Realizada
                                  </button>
                                )}
                                {permissions.canModifyRecords && (
                                  <button
                                    onClick={() => {
                                      setEditandoVisitaId(vis.id);
                                      setFormVisita({
                                        fecha: vis.fecha,
                                        institucion: vis.institucion,
                                        carrera_catedra: vis.carrera_catedra || '',
                                        cantidad_estudiantes: vis.cantidad_estudiantes,
                                        responsable: vis.responsable,
                                        observaciones: vis.observaciones || '',
                                        estado: vis.estado as any
                                      });
                                      setModoNuevoRegistro(true);
                                    }}
                                    className="p-1 text-[#486654] hover:text-[#1c4b31] cursor-pointer"
                                    title="Editar datos"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {permissions.canDeleteRecords && (
                                  <button
                                    onClick={() => handleEliminarVisita(vis.id)}
                                    className="p-1 text-[#a33b3b] hover:text-[#7f1d1d] cursor-pointer"
                                    title="Eliminar registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Pie del modal con resumen del indicador A5 */}
            <div className="p-3 bg-[#fafcfb] border-t border-[#edf2ec] flex items-center justify-between text-xs text-[#526f5e]">
              <span>
                Total computado para A5: <strong className="text-[#1c4b31] font-mono">{(db.Visitas_Estudiantiles || []).filter(v => String(v.estado || '').toLowerCase() === 'realizada').length} visitas realizadas</strong>.
              </span>
              <button
                onClick={() => {
                  setShowVisitasModal(false);
                  setModoNuevoRegistro(false);
                  setEditandoVisitaId(null);
                }}
                className="px-4 py-1.5 bg-[#1c4b31] text-white font-bold rounded-xl hover:bg-[#123823] cursor-pointer shadow-2xs"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
