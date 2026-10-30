/**
 * @file MajadaOvinaView.tsx
 * @description Módulo de Producción Ovina · Organización de Etapas Productivas
 * Establecimiento Pozo del Carril – La Aguada (UNRC)
 * 
 * Etapas productivas organizadas según el modelo visual de Porcinos:
 * 1. Cría (Ovejas de Cría, Carneros padres Dorper, Encarne/Servicios, Parición y Señalada)
 * 2. Recría (Borregos y Borregas de reposición, avance genético hacia Dorper, desarrollo pastoril)
 * 3. Engorde (Corderos pesados y corderas terminadas para faena/consumo)
 * + Movimientos entre Etapas & Trazabilidad
 * + Historial de Eventos Productivos & Majada Completa
 * 
 * Identidad cromática oficial: Azul.
 */

import React, { useState, useMemo } from 'react';
import { BaseDatosPorcina, CategoriaOvina, Usuario } from '../../types/schema';
import { ProduccionOvina } from '../../types/ovino_schema';
import { getRolePermissions } from '../../lib/permissions';
import { RowActions } from '../../components/RowActions';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { 
  CircleDot, 
  Layers, 
  CheckCircle2, 
  Plus, 
  X, 
  Heart, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  GitFork, 
  History, 
  Utensils, 
  MoveRight,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export type EtapaOvinaKey = 'Cria' | 'Recria' | 'Engorde' | 'Movimientos' | 'Historial';

export const MajadaOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const permissions = getRolePermissions(currentUser);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<{ record: any; tableName: string; unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS'; title: string } | null>(null);

  // Etapa Activa
  const [etapaActiva, setEtapaActiva] = useState<EtapaOvinaKey>('Cria');

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [potreroFiltro, setPotreroFiltro] = useState<string>('TODOS');
  const [estadoSanitarioFiltro, setEstadoSanitarioFiltro] = useState<string>('TODOS');

  // Modales
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showPaseModal, setShowPaseModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaOvina | null>(null);

  // Tablas del Almacén de Datos
  const categorias = db.Categorias_Ovinas || [];
  const produccionOvinas = db.Produccion_Ovina || [];
  const sanidadOvinas = db.Eventos_Sanitarios_Ovinos || [];
  const movimientosFisicos = db.Movimientos_Fisicos || [];

  // Formulario Evento Productivo (Nacimiento, Señalada, Destete, Muerte)
  const [eventoForm, setEventoForm] = useState({
    id_campana: 'CAMP_2024_2025',
    id_subunidad: 'OVI_CRIA',
    tipo_evento: 'NACIMIENTO' as ProduccionOvina['tipo_evento'],
    cabezas: 15,
    fecha: new Date().toISOString().split('T')[0],
    origen_dato: 'REAL' as const,
    observaciones: 'Registro zootécnico en majada'
  });

  // Formulario Pase de Etapa Ovina
  const [paseForm, setPaseForm] = useState({
    categoria_origen: 'Cordero/a',
    etapa_origen: 'Cría',
    etapa_destino: 'Recría',
    cabezas: 10,
    nuevo_potrero: 'Potrero Ovino 2 - Cañada',
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'Pase por destete y selección de reposición Dorper'
  });

  // Clasificación de categorías según etapa productiva ovina
  const categoriasPorEtapa = useMemo(() => {
    if (etapaActiva === 'Cria') {
      return categorias.filter(c => c.categoria.includes('Oveja') || c.categoria.includes('Carnero'));
    }
    if (etapaActiva === 'Recria') {
      return categorias.filter(c => c.categoria.includes('Borrego'));
    }
    if (etapaActiva === 'Engorde') {
      return categorias.filter(c => c.categoria.includes('Cordero'));
    }
    return categorias;
  }, [categorias, etapaActiva]);

  // Filtrado de la tabla según buscador y filtros
  const categoriasFiltradas = useMemo(() => {
    return categoriasPorEtapa.filter(c => {
      const matchBusqueda = !busqueda.trim() || 
        c.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.potrero_actual.toLowerCase().includes(busqueda.toLowerCase());
      const matchPotrero = potreroFiltro === 'TODOS' || c.potrero_actual === potreroFiltro;
      const matchSanitario = estadoSanitarioFiltro === 'TODOS' || c.estado_sanitario === estadoSanitarioFiltro;
      return matchBusqueda && matchPotrero && matchSanitario;
    });
  }, [categoriasPorEtapa, busqueda, potreroFiltro, estadoSanitarioFiltro]);

  // Cálculos de métricas globales y de etapa
  const totalCabezasGlobal = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  const ovejasObj = categorias.find(c => c.categoria.includes('Oveja'));
  const corderosObj = categorias.find(c => c.categoria.includes('Cordero'));
  const cabezasOvejas = ovejasObj?.cabezas || 135;
  const cabezasCorderos = corderosObj?.cabezas || 122;
  const porcentajeSenalada = ((cabezasCorderos / cabezasOvejas) * 100).toFixed(1);

  const metricsEtapa = useMemo(() => {
    const list = categoriasPorEtapa;
    const totalCab = list.reduce((acc, c) => acc + (c.cabezas || 0), 0);
    const ccSum = list.reduce((acc, c) => acc + (c.estado_corporal * c.cabezas), 0);
    const ccProm = totalCab > 0 ? (ccSum / totalCab).toFixed(2) : '3.0';
    const potreros = Array.from(new Set(list.map(c => c.potrero_actual))).join(', ');
    return { totalCab, ccProm, potreros };
  }, [categoriasPorEtapa]);

  // Movimientos históricos vinculados a ovinos
  const movimientosOvinos = useMemo(() => {
    return movimientosFisicos.filter(m => 
      m.lote_id?.includes('OVI') || 
      m.fase_origen_id?.includes('Ovi') || 
      m.fase_destino_id?.includes('Ovi') ||
      m.fase_origen_id === 'Cría Ovina' ||
      m.fase_destino_id === 'Recría Ovina' ||
      m.fase_destino_id === 'Engorde Ovino'
    );
  }, [movimientosFisicos]);

  const handleEditarEvento = (prod: any) => {
    setEditingEventoId(prod.id);
    setEventoForm({
      id_campana: prod.id_campana || 'CAMP_2024_2025',
      id_subunidad: prod.id_subunidad || 'OVI_CRIA',
      tipo_evento: prod.tipo_evento || 'NACIMIENTO',
      cabezas: Number(prod.cabezas) || 15,
      fecha: prod.fecha || new Date().toISOString().split('T')[0],
      origen_dato: prod.origen_dato || 'REAL',
      observaciones: prod.observaciones || ''
    });
    setShowEventoModal(true);
  };

  // Handlers
  const handleGuardarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoRegistro: ProduccionOvina = {
      id: editingEventoId || `PROD_OVI_${Date.now()}`,
      ...eventoForm,
      cabezas: Number(eventoForm.cabezas),
      estado: 'Confirmado'
    };

    const res = await onSaveRecord('Produccion_Ovina', nuevoRegistro);
    if (res.success !== false) {
      setEditingEventoId(null);
      setShowEventoModal(false);
      setFeedbackMsg(`Evento productivo (${eventoForm.tipo_evento}) de ${eventoForm.cabezas} cabezas ${editingEventoId ? 'actualizado' : 'registrado'} correctamente.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleAbrirModalPase = (cat?: CategoriaOvina) => {
    if (cat) {
      setCategoriaSeleccionada(cat);
      const destinoSugerido = cat.categoria.includes('Cordero') ? 'Recría' : 'Engorde';
      setPaseForm({
        categoria_origen: cat.categoria,
        etapa_origen: etapaActiva === 'Cria' ? 'Cría' : etapaActiva === 'Recria' ? 'Recría' : 'Engorde',
        etapa_destino: destinoSugerido,
        cabezas: Math.min(10, cat.cabezas || 10),
        nuevo_potrero: cat.potrero_actual,
        fecha: new Date().toISOString().split('T')[0],
        motivo: 'Pase zootécnico de etapa ovina'
      });
    } else {
      setPaseForm({
        categoria_origen: 'Cordero/a',
        etapa_origen: 'Cría',
        etapa_destino: 'Recría',
        cabezas: 10,
        nuevo_potrero: 'Potrero Ovino 2 - Cañada',
        fecha: new Date().toISOString().split('T')[0],
        motivo: 'Pase por destete y selección de reposición Dorper'
      });
    }
    setShowPaseModal(true);
  };

  const handleGuardarPase = async (e: React.FormEvent) => {
    e.preventDefault();
    const cant = Number(paseForm.cabezas);

    // Registrar en Movimientos_Fisicos
    const nuevoMov = {
      id: `MOV_OVI_${Date.now()}`,
      fecha: paseForm.fecha,
      tipo_evento: 'PASE_FASE' as const,
      lote_id: `OVI_${paseForm.categoria_origen.replace(/\s+/g, '_')}`,
      cantidad_cabezas: cant,
      kg_totales: cant * 35, // Kilos estimados zootécnicos
      fase_origen_id: paseForm.etapa_origen,
      fase_destino_id: paseForm.etapa_destino,
      sector_origen_id: paseForm.nuevo_potrero,
      sector_destino_id: paseForm.nuevo_potrero,
      motivo: paseForm.motivo,
      estado: 'Confirmado' as const,
      origen_dato: 'REAL' as const,
      estado_validacion: 'Auditado' as const,
      creado_por: currentUser?.nombre || 'Encargado Ovino',
      fecha_creacion: new Date().toISOString()
    };
    await onSaveRecord('Movimientos_Fisicos', nuevoMov);

    setShowPaseModal(false);
    setFeedbackMsg(`Pase de etapa ovina registrado: ${cant} cabezas pasaron a ${paseForm.etapa_destino}.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Descripciones técnicas de las 3 etapas ovinas (Transición genética Dorper y carne)
  const infoEtapas = {
    Cria: {
      titulo: 'Cría Ovina & Majada de Madres',
      descripcion: 'Plantel de madres y carneros padres Dorper puros. Control de servicios/encarne de otoño, parición, señalada al pie de madre y condición corporal.',
      objetivo: 'Maximizar tasa de señalada (>90%) con adaptación rústica pastoril y producción de corderos de alta conformación carnicera.'
    },
    Recria: {
      titulo: 'Recría Pastoril & Reposición Dorper',
      descripcion: 'Borregas y borregos seleccionados para reemplazo generacional y absorción genética hacia Dorper puro sobre pasturas consociadas.',
      objetivo: 'Alcanzar desarrollo corporal óptimo (35-40 kg) para primer servicio a los 12-14 meses sin engrase excesivo.'
    },
    Engorde: {
      titulo: 'Engorde de Corderos Pesados',
      descripcion: 'Corderos y corderas en terminación para comercialización como Cordero Pesado (32 a 38 kg vivo), aprovechando pasturas y suplementación con maíz propio UNRC.',
      objetivo: 'Lograr rendimiento en gancho superior al 50% con carne magra y de excelente terneza.'
    },
    Movimientos: {
      titulo: 'Movimientos Físicos entre Etapas Ovinas',
      descripcion: 'Control y trazabilidad de transferencias de lotes de hacienda entre Cría, Recría y Engorde.',
      objetivo: 'Registro auditable de destetes, incorporaciones a recría y destino a faena.'
    },
    Historial: {
      titulo: 'Historial de Producción & Eventos Ovinos',
      descripcion: 'Registro cronológico consolidado de pariciones, señaladas, pesadas y eventos sanitarios de la majada.',
      objetivo: 'Monitoreo histórico de los ciclos productivos de Pozo del Carril.'
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f172a] text-[#eff6ff] px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#1e40af] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ===================================================================
          ENCABEZADO PRINCIPAL (Modelo Porcinos con Paleta Oficial Azul Ovina)
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#bfdbfe]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e40af] bg-[#eff6ff] px-2.5 py-1 rounded-md border border-[#bfdbfe]">
              UNIDAD PRODUCTIVA: OVINOS
            </span>
            <span className="text-[11px] font-semibold text-[#1e3a8a] bg-white px-2 py-0.5 rounded border border-[#bfdbfe]">
              Proceso: {infoEtapas[etapaActiva].titulo}
            </span>
            <span className="text-[11px] font-mono text-[#64748b]">
              Raza: Dorper (Cárnica Pastoril)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            OVINOS · PRODUCCIÓN, MAJADA Y ETAPAS DORPER
          </h1>
          <p className="text-xs text-[#334155] mt-0.5 max-w-3xl">
            {infoEtapas[etapaActiva].descripcion}
          </p>
        </div>

        {/* PESTAÑAS DE ETAPAS PRODUCTIVAS OVINAS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#eff6ff] rounded-xl border border-[#bfdbfe] overflow-x-auto shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setEtapaActiva('Cria')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Cria'
                ? 'bg-white text-[#1e40af] font-bold shadow-xs border border-[#93c5fd]'
                : 'text-[#64748b] hover:text-[#1e40af] font-medium'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>1. Cría ({cabezasOvejas + 5} cab)</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Recria')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Recria'
                ? 'bg-white text-[#1e40af] font-bold shadow-xs border border-[#93c5fd]'
                : 'text-[#64748b] hover:text-[#1e40af] font-medium'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Recría (30 cab)</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Engorde')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Engorde'
                ? 'bg-white text-[#1e40af] font-bold shadow-xs border border-[#93c5fd]'
                : 'text-[#64748b] hover:text-[#1e40af] font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Engorde ({cabezasCorderos} cab)</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Movimientos')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Movimientos'
                ? 'bg-white text-[#1e40af] font-bold shadow-xs border border-[#93c5fd]'
                : 'text-[#64748b] hover:text-[#1e40af] font-medium'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Movimientos ({movimientosOvinos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Historial')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Historial'
                ? 'bg-white text-[#1e40af] font-bold shadow-xs border border-[#93c5fd]'
                : 'text-[#64748b] hover:text-[#1e40af] font-medium'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Eventos ({produccionOvinas.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          RESUMEN DE SITUACIÓN & EXISTENCIAS DE LA ETAPA OVINA ACTIVA
      =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Existencias en Etapa</div>
          <div className="text-2xl font-bold text-[#0f172a] font-mono tabular-nums mt-0.5">
            {metricsEtapa.totalCab} <span className="text-xs font-normal text-[#334155]">cabezas</span>
          </div>
          <div className="text-[11px] text-[#334155] mt-0.5">
            Total Majada: {totalCabezasGlobal} cab
          </div>
        </div>

        <div className="p-3.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Condición Corporal</div>
          <div className="text-2xl font-bold text-[#1e40af] font-mono tabular-nums mt-0.5">
            {metricsEtapa.ccProm} <span className="text-xs font-normal text-[#334155]">/ 5</span>
          </div>
          <div className="text-[11px] text-[#334155] mt-0.5">
            Escala zootécnica ovina
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#bfdbfe] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Índice de Señalada</div>
          <div className="text-2xl font-bold text-[#1e40af] font-mono tabular-nums mt-0.5">
            {porcentajeSenalada}%
          </div>
          <div className="text-[11px] text-[#334155] mt-0.5">
            122 corderos / 135 madres
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#bfdbfe] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Potrero Asignado</div>
          <div className="text-base font-bold text-[#0f172a] truncate mt-1">
            {metricsEtapa.potreros || 'Potreros Ovinos'}
          </div>
          <div className="text-[11px] text-[#334155] mt-0.5">
            Pastoreo rotativo
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#bfdbfe] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Orientación Genética</div>
          <div className="text-base font-bold text-[#1e40af] mt-1">
            Dorper Cárnico
          </div>
          <div className="text-[11px] text-[#334155] mt-0.5">
            Absorción y conformación
          </div>
        </div>
      </div>

      {/* ===================================================================
          BARRAS SEPARADAS: SECTOR 1 (FILTROS) Y SECTOR 2 (ACCIONES)
      =================================================================== */}
      <div className="bg-white border border-[#bfdbfe] rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* SECTOR 1: FILTROS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1e3a8a]">
            <Filter className="w-3.5 h-3.5 text-[#1e40af]" />
            <span>Sector Filtros:</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-[#64748b]">Potrero:</span>
            <select
              value={potreroFiltro}
              onChange={(e) => setPotreroFiltro(e.target.value)}
              className="text-xs bg-[#eff6ff] border border-[#bfdbfe] rounded-lg px-2 py-1 text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
            >
              <option value="TODOS">Todos los potreros</option>
              <option value="Potrero Ovino 1 - Casco">Potrero Ovino 1 - Casco</option>
              <option value="Potrero Ovino 2 - Cañada">Potrero Ovino 2 - Cañada</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-[#64748b]">Sanidad:</span>
            <select
              value={estadoSanitarioFiltro}
              onChange={(e) => setEstadoSanitarioFiltro(e.target.value)}
              className="text-xs bg-[#eff6ff] border border-[#bfdbfe] rounded-lg px-2 py-1 text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Al día">Al día</option>
              <option value="Tratamiento Ectoparásitos">Tratamiento Ectoparásitos</option>
              <option value="Vacunado">Vacunado</option>
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar categoría o potrero..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#eff6ff] border border-[#bfdbfe] rounded-lg text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#1e40af]"
            />
          </div>
        </div>

        {/* SECTOR 2: ACCIONES PRINCIPALES */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#bfdbfe]">
          <button
            type="button"
            onClick={() => handleAbrirModalPase()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] rounded-lg transition-colors cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Pase de Etapa Ovina</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEventoModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Parición / Evento</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          CONTENIDO DINÁMICO DE LA ETAPA OVINA
      =================================================================== */}

      {/* TABLA PRINCIPAL DE HACIENDA DE LA ETAPA */}
      {etapaActiva !== 'Movimientos' && etapaActiva !== 'Historial' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#bfdbfe] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#eff6ff] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Categorías & Majada de {infoEtapas[etapaActiva].titulo}
                </h2>
                <p className="text-xs text-[#334155]">
                  Estructura poblacional, condición corporal (escala 1 a 5) y potrero actual asignado
                </p>
              </div>
              <div className="text-xs text-[#334155] font-mono tabular-nums">
                Mostrando <strong>{categoriasFiltradas.length}</strong> categorías de la etapa
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#bfdbfe] text-[#64748b] font-semibold bg-[#eff6ff]">
                    <th className="py-2.5 px-4">Categoría Ovina</th>
                    <th className="py-2.5 px-4 text-right">Cabezas</th>
                    <th className="py-2.5 px-4">Potrero Actual</th>
                    <th className="py-2.5 px-4 text-center">Condición Corporal (1-5)</th>
                    <th className="py-2.5 px-4">Estado Sanitario</th>
                    <th className="py-2.5 px-4">Línea Zootécnica</th>
                    <th className="py-2.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff6ff]">
                  {categoriasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#64748b]">
                        No se encontraron categorías ovinas en la etapa con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    categoriasFiltradas.map((cat) => (
                      <tr key={cat.id} className="hover:bg-[#eff6ff]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0f172a] text-sm">
                          {cat.categoria}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-[#1e40af] tabular-nums">
                          {cat.cabezas}
                        </td>
                        <td className="py-3 px-4 text-[#334155]">
                          {cat.potrero_actual}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] rounded font-mono font-bold">
                            {cat.estado_corporal.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {cat.estado_sanitario}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#334155]">
                          Transición Genética Dorper
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleAbrirModalPase(cat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] rounded border border-[#bfdbfe]"
                          >
                            <span>Pase de Etapa</span>
                            <MoveRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subsecciones: Alimentación & Sanidad Asignada a la Etapa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alimentación de la Etapa */}
            <div className="bg-white border border-[#bfdbfe] rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#eff6ff]">
                <Utensils className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                  Alimentación de la Etapa ({infoEtapas[etapaActiva].titulo})
                </h3>
              </div>
              <p className="text-xs text-[#334155]">
                {etapaActiva === 'Cria' && 'Pastoreo directo sobre alfalfa y trébol blanco con suplementación previa a servicio (flushing con 200g maíz propio UNRC/cab/día).'}
                {etapaActiva === 'Recria' && 'Base forrajera en Potrero 2 con pastura consociada. Aporte de minerales y balance de fibra para desarrollo óseo.'}
                {etapaActiva === 'Engorde' && 'Pastoreo rotativo intensivo reforzado con ración de maíz entero seco Pozo del Carril (350g/cab/día) para cordero pesado.'}
              </p>
              <div className="text-[11px] text-[#64748b] font-mono">
                Recurso: Silo de Maíz Propio UNRC · Carga: 1.2 EV/ha
              </div>
            </div>

            {/* Sanidad de la Etapa */}
            <div className="bg-white border border-[#bfdbfe] rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#eff6ff]">
                <ShieldCheck className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                  Sanidad Oficial & Cronograma
                </h3>
              </div>
              <p className="text-xs text-[#334155]">
                Plan preventivo integral: Vacunación clostridial (enterotoxemia/mancha), desparasitación estratégica de otoño y control de sarna/ectoparásitos.
              </p>
              <div className="text-[11px] text-[#64748b] font-mono">
                Última intervención: Vacunación Polivalente 8 Vías (100% Majada al día)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: MOVIMIENTOS ENTRE ETAPAS OVINAS */}
      {etapaActiva === 'Movimientos' && (
        <div className="bg-white border border-[#bfdbfe] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eff6ff]">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Movimientos Físicos & Trazabilidad de Etapas Ovinas
              </h2>
              <p className="text-xs text-[#334155]">
                Historial de transferencias de lotes de hacienda entre Cría, Recría y Engorde
              </p>
            </div>
            <button
              onClick={() => handleAbrirModalPase()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Nuevo Pase</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#bfdbfe] text-[#64748b] font-semibold bg-[#eff6ff]">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Categoría / Lote</th>
                  <th className="py-2.5 px-4">Etapa Origen</th>
                  <th className="py-2.5 px-4">Etapa Destino</th>
                  <th className="py-2.5 px-4 text-right">Cabezas</th>
                  <th className="py-2.5 px-4">Potrero Destino</th>
                  <th className="py-2.5 px-4">Motivo del Pase</th>
                  <th className="py-2.5 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff6ff]">
                {movimientosOvinos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#64748b]">
                      Aún no se han registrado pases entre etapas ovinas. Use el botón "+ Registrar Nuevo Pase" para transferir lotes.
                    </td>
                  </tr>
                ) : (
                  movimientosOvinos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#eff6ff]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#0f172a]">{mov.fecha}</td>
                      <td className="py-2.5 px-4 font-bold text-[#1e40af]">{mov.lote_id}</td>
                      <td className="py-2.5 px-4 text-[#334155]">{mov.fase_origen_id}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#0f172a]">
                        <span className="inline-flex items-center gap-1">
                          <MoveRight className="w-3 h-3 text-[#1e40af]" />
                          {mov.fase_destino_id}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#0f172a]">{mov.cantidad_cabezas}</td>
                      <td className="py-2.5 px-4 text-[#334155]">{mov.sector_destino_id}</td>
                      <td className="py-2.5 px-4 text-[#334155] max-w-xs truncate">{mov.motivo}</td>
                      <td className="py-2.5 px-4 text-[#64748b]">{mov.creado_por || 'Sistema'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: HISTORIAL DE PRODUCCIÓN & EVENTOS PRODUCTIVOS */}
      {etapaActiva === 'Historial' && (
        <div className="bg-white border border-[#bfdbfe] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eff6ff]">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Historial de Pariciones & Eventos Productivos Ovinos
              </h2>
              <p className="text-xs text-[#334155]">
                Eventos biológicos registrados en la majada (Nacimiento, Señalada, Destete, Bajas)
              </p>
            </div>
            <button
              onClick={() => setShowEventoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Evento Productivo</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#bfdbfe] text-[#64748b] font-semibold bg-[#eff6ff]">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Tipo de Evento</th>
                  <th className="py-2.5 px-4">Subunidad / Etapa</th>
                  <th className="py-2.5 px-4 text-right">Cabezas</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Origen del Dato</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff6ff]">
                {produccionOvinas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#64748b]">
                      No hay eventos productivos registrados aún.
                    </td>
                  </tr>
                ) : (
                  produccionOvinas.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-[#eff6ff]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#0f172a]">{prod.fecha}</td>
                      <td className="py-2.5 px-4 font-bold text-[#1e40af]">{prod.tipo_evento}</td>
                      <td className="py-2.5 px-4 text-[#334155]">{prod.id_subunidad}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#0f172a]">{prod.cabezas}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {prod.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#64748b]">{prod.origen_dato}</td>
                      <td className="py-2.5 px-4 text-center">
                        <RowActions
                          unit="OVINOS"
                          canEdit={permissions.canEdit('produccion')}
                          onViewDetail={() => setDetailRecord({ record: prod, tableName: 'Produccion_Ovina', unit: 'OVINOS', title: `EVENTO PRODUCTIVO OVINO (${prod.id})` })}
                          onEdit={() => handleEditarEvento(prod)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: REGISTRAR PARICIÓN / EVENTO PRODUCTIVO OVINO
      =================================================================== */}
      {showEventoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-[#bfdbfe]">
            <div className="p-4 bg-[#1e40af] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Unidad Productiva: Ovinos · Majada Dorper
                </span>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  OVINOS · REGISTRO DE PARICIÓN / EVENTO PRODUCTIVO
                </h3>
              </div>
              <button onClick={() => setShowEventoModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarEvento} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Tipo de Evento</label>
                  <select
                    value={eventoForm.tipo_evento}
                    onChange={(e) => setEventoForm({ ...eventoForm, tipo_evento: e.target.value as any })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 bg-white text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="NACIMIENTO">Nacimiento / Parición</option>
                    <option value="SEÑALADA">Señalada</option>
                    <option value="DESTETE">Destete</option>
                    <option value="MUERTE">Baja / Mortandad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Etapa / Subunidad</label>
                  <select
                    value={eventoForm.id_subunidad}
                    onChange={(e) => setEventoForm({ ...eventoForm, id_subunidad: e.target.value })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 bg-white text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="OVI_CRIA">1. Cría Ovina</option>
                    <option value="OVI_RECRIA">2. Recría Borregos/as</option>
                    <option value="OVI_ENGORDE">3. Engorde Cordero Pesado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Cantidad de Cabezas</label>
                  <input
                    type="number"
                    min="1"
                    value={eventoForm.cabezas}
                    onChange={(e) => setEventoForm({ ...eventoForm, cabezas: Number(e.target.value) })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] font-mono focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Fecha del Evento</label>
                  <input
                    type="date"
                    value={eventoForm.fecha}
                    onChange={(e) => setEventoForm({ ...eventoForm, fecha: e.target.value })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] font-mono focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">Observaciones</label>
                <input
                  type="text"
                  value={eventoForm.observaciones}
                  onChange={(e) => setEventoForm({ ...eventoForm, observaciones: e.target.value })}
                  className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#bfdbfe]">
                <button
                  type="button"
                  onClick={() => setShowEventoModal(false)}
                  className="px-4 py-2 border border-[#bfdbfe] rounded-lg text-[#334155] font-semibold hover:bg-[#eff6ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-semibold rounded-lg shadow-xs"
                >
                  Guardar Evento Ovino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: REGISTRAR PASE DE ETAPA OVINA
      =================================================================== */}
      {showPaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-[#bfdbfe]">
            <div className="p-4 bg-[#1e40af] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Unidad Productiva: Ovinos · Transición de Ciclo
                </span>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <GitFork className="w-4 h-4" />
                  OVINOS · REGISTRO DE MOVIMIENTO FÍSICO / PASE DE ETAPA
                </h3>
              </div>
              <button onClick={() => setShowPaseModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarPase} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Categoría Ovina</label>
                  <select
                    value={paseForm.categoria_origen}
                    onChange={(e) => setPaseForm({ ...paseForm, categoria_origen: e.target.value })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 bg-white text-[#0f172a] font-bold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="Cordero/a">Cordero/a (Destete)</option>
                    <option value="Borrego/a">Borrego/a (Reposición)</option>
                    <option value="Oveja de Cría">Oveja de Cría</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Etapa de Destino</label>
                  <select
                    value={paseForm.etapa_destino}
                    onChange={(e) => setPaseForm({ ...paseForm, etapa_destino: e.target.value })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 bg-white text-[#0f172a] font-bold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="Recría">2. Recría Borregos/as</option>
                    <option value="Engorde">3. Engorde Cordero Pesado</option>
                    <option value="Cría">1. Cría (Incorporación a Servicio)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Cabezas a Transferir</label>
                  <input
                    type="number"
                    min="1"
                    value={paseForm.cabezas}
                    onChange={(e) => setPaseForm({ ...paseForm, cabezas: Number(e.target.value) })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] font-mono font-bold focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Nuevo Potrero Asignado</label>
                  <input
                    type="text"
                    value={paseForm.nuevo_potrero}
                    onChange={(e) => setPaseForm({ ...paseForm, nuevo_potrero: e.target.value })}
                    className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">Motivo / Criterio Zootécnico</label>
                <input
                  type="text"
                  value={paseForm.motivo}
                  onChange={(e) => setPaseForm({ ...paseForm, motivo: e.target.value })}
                  className="w-full border border-[#bfdbfe] rounded-lg p-2 text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#bfdbfe]">
                <button
                  type="button"
                  onClick={() => setShowPaseModal(false)}
                  className="px-4 py-2 border border-[#bfdbfe] rounded-lg text-[#334155] font-semibold hover:bg-[#eff6ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-semibold rounded-lg shadow-xs"
                >
                  Confirmar Pase de Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecordDetailModal
        isOpen={!!detailRecord}
        record={detailRecord?.record}
        tableName={detailRecord?.tableName || ''}
        unit={detailRecord?.unit || 'OVINOS'}
        title={detailRecord?.title || ''}
        db={db}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
};
