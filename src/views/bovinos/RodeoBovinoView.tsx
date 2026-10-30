/**
 * @file RodeoBovinoView.tsx
 * @description Módulo de Producción Bovina · Organización de Etapas Productivas
 * Establecimiento Pozo del Carril – La Aguada (UNRC)
 * 
 * Etapas productivas organizadas según el modelo visual de Porcinos:
 * 1. Cría (Vientres, Toros, Terneros/as al pie, Servicios, Tactos, Diagnóstico de Preñez)
 * 2. Recría (Desmamantes, Novillitos, Vaquillonas en desarrollo, control pastoril)
 * 3. Adaptación (Transición de pastura a corral de alta energía, acostumbramiento ruminal)
 * 4. Engorde (Terminación feedlot, novillos terminados, peso objetivo de faena)
 * + Movimientos entre Etapas & Trazabilidad
 * + Historial y Roster General
 * 
 * Identidad cromática oficial: Marrón, tierra y beige.
 */

import React, { useState, useMemo } from 'react';
import { 
  Beef, 
  Layers, 
  Activity, 
  Scale, 
  ArrowRight, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles,
  GitFork,
  History,
  Tag,
  AlertCircle,
  MoveRight
} from 'lucide-react';
import { BaseDatosPorcina, AnimalBovino, ServicioTactoBovino, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export type EtapaBovinaKey = 'Cria' | 'Recria' | 'Adaptacion' | 'Engorde' | 'Movimientos' | 'Historial';

export const RodeoBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const permissions = getRolePermissions(currentUser);
  const animales = db.Animales_Bovinos || [];
  const tactos = db.Servicios_Tactos_Bovinos || [];
  const partosDestetes = db.Partos_Destetes_Bovinos || [];
  const categorias = db.Categorias_Bovinas || [];
  const movimientosFisicos = db.Movimientos_Fisicos || [];

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Etapa Activa (Navegación visual coherente con el sistema Porcino)
  const [etapaActiva, setEtapaActiva] = useState<EtapaBovinaKey>('Cria');

  // Filtros
  const [lineaFiltro, setLineaFiltro] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [potreroFiltro, setPotreroFiltro] = useState<string>('TODOS');

  // Modales
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showTactoModal, setShowTactoModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [animalParaMovimiento, setAnimalParaMovimiento] = useState<AnimalBovino | null>(null);

  // Formulario Animal
  const [animalForm, setAnimalForm] = useState({
    caravana: 'UNRC-A-110',
    caravana_rfid: '032000084920120',
    categoria: 'Novillito' as AnimalBovino['categoria'],
    sexo: 'Macho' as AnimalBovino['sexo'],
    raza: 'Angus Negro',
    linea_destino: 'Carne' as NonNullable<AnimalBovino['linea_destino']>,
    etapa_actual: 'Cría' as NonNullable<AnimalBovino['etapa_actual']>,
    fecha_nacimiento_ingreso: new Date().toISOString().split('T')[0],
    peso_actual_kg: 310,
    adpv_acumulado_kg: 0.85,
    condicion_corporal: 6,
    estado_productivo: 'Engorde' as AnimalBovino['estado_productivo'],
    lote_o_potrero: 'Potrero 3 - Las Acacias',
    origen: 'Destete Propio Pozo del Carril',
    observaciones: 'Incorporación a tropa con pesada de ingreso'
  });

  // Formulario Tacto
  const [tactoForm, setTactoForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Diagnóstico de Preñez (Tacto)' as ServicioTactoBovino['tipo'],
    toro_o_semen: 'Repaso Toros UNRC-A-101 y UNRC-A-102',
    lote_vientres: 'Rodeo General de Cría (Potrero 1)',
    cabezas_evaluadas: 118,
    cabezas_prenadas: 104,
    responsable: 'Cátedra de Producción Bovina UNRC',
    observaciones: 'Control de preñez con ecografía de confirmación'
  });

  // Formulario Movimiento entre Etapas
  const [movimientoForm, setMovimientoForm] = useState({
    caravana: '',
    etapa_origen: 'Cría' as NonNullable<AnimalBovino['etapa_actual']>,
    etapa_destino: 'Recría' as NonNullable<AnimalBovino['etapa_actual']>,
    nuevo_potrero: 'Potrero 3 - Las Acacias',
    nuevo_peso_kg: 310,
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'Pase natural de ciclo productivo'
  });

  // Handlers
  const handleGuardarAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoAnimal: AnimalBovino = {
      id: `ANM_BOV_${Date.now()}`,
      ...animalForm,
      peso_actual_kg: Number(animalForm.peso_actual_kg),
      adpv_acumulado_kg: Number(animalForm.adpv_acumulado_kg),
      condicion_corporal: Number(animalForm.condicion_corporal),
      unidad_neg_id: 'UN_BOVINOS'
    };
    await onSaveRecord('Animales_Bovinos', nuevoAnimal);
    setShowAnimalModal(false);
    setFeedbackMsg(`Animal ${nuevoAnimal.caravana} (${nuevoAnimal.linea_destino}) guardado con éxito.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGuardarTacto = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = tactoForm.cabezas_evaluadas > 0 
      ? Number(((tactoForm.cabezas_prenadas / tactoForm.cabezas_evaluadas) * 100).toFixed(1))
      : 0;

    const nuevoTacto: ServicioTactoBovino = {
      id: `TAC_BOV_${Date.now()}`,
      ...tactoForm,
      cabezas_evaluadas: Number(tactoForm.cabezas_evaluadas),
      cabezas_prenadas: Number(tactoForm.cabezas_prenadas),
      porcentaje_prenez: pct,
      estado: 'Confirmado'
    };
    await onSaveRecord('Servicios_Tactos_Bovinos', nuevoTacto);
    setShowTactoModal(false);
    setFeedbackMsg(`Registro de tacto guardado: ${pct}% de preñez en ${nuevoTacto.lote_vientres}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCambiarLineaDestino = async (animal: AnimalBovino, nuevaLinea: NonNullable<AnimalBovino['linea_destino']>) => {
    const updated = { ...animal, linea_destino: nuevaLinea };
    await onSaveRecord('Animales_Bovinos', updated);
    setFeedbackMsg(`Caravana ${animal.caravana}: reasignada a línea ${nuevaLinea}.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCambiarEtapaDirecta = async (animal: AnimalBovino, nuevaEtapa: NonNullable<AnimalBovino['etapa_actual']>) => {
    const updated = { ...animal, etapa_actual: nuevaEtapa };
    await onSaveRecord('Animales_Bovinos', updated);
    
    // Registrar también el movimiento físico en el historial
    const nuevoMov = {
      id: `MOV_BOV_${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      tipo_evento: 'PASE_FASE' as const,
      lote_id: animal.caravana,
      cantidad_cabezas: 1,
      kg_totales: animal.peso_actual_kg,
      fase_origen_id: animal.etapa_actual || 'Cría',
      fase_destino_id: nuevaEtapa,
      sector_origen_id: animal.lote_o_potrero,
      sector_destino_id: animal.lote_o_potrero,
      motivo: `Pase de etapa de ${animal.etapa_actual || 'Cría'} a ${nuevaEtapa}`,
      estado: 'Confirmado' as const,
      origen_dato: 'REAL' as const,
      estado_validacion: 'Auditado' as const,
      creado_por: currentUser?.nombre || 'Operador',
      fecha_creacion: new Date().toISOString()
    };
    await onSaveRecord('Movimientos_Fisicos', nuevoMov);

    setFeedbackMsg(`Caravana ${animal.caravana}: avanzada exitosamente a etapa ${nuevaEtapa}.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAbrirModalMovimiento = (animal?: AnimalBovino) => {
    if (animal) {
      setAnimalParaMovimiento(animal);
      const siguienteEtapa: NonNullable<AnimalBovino['etapa_actual']> = 
        animal.etapa_actual === 'Cría' ? 'Recría' :
        animal.etapa_actual === 'Recría' ? 'Adaptación' :
        animal.etapa_actual === 'Adaptación' ? 'Engorde' : 'Engorde';
      setMovimientoForm({
        caravana: animal.caravana,
        etapa_origen: animal.etapa_actual || 'Cría',
        etapa_destino: siguienteEtapa,
        nuevo_potrero: animal.lote_o_potrero,
        nuevo_peso_kg: animal.peso_actual_kg,
        fecha: new Date().toISOString().split('T')[0],
        motivo: `Pase de etapa de ${animal.etapa_actual || 'Cría'} a ${siguienteEtapa}`
      });
    } else {
      const primerAnimal = animales[0];
      setAnimalParaMovimiento(primerAnimal || null);
      setMovimientoForm({
        caravana: primerAnimal?.caravana || '',
        etapa_origen: primerAnimal?.etapa_actual || 'Cría',
        etapa_destino: 'Recría',
        nuevo_potrero: primerAnimal?.lote_o_potrero || 'Potrero 3 - Las Acacias',
        nuevo_peso_kg: primerAnimal?.peso_actual_kg || 300,
        fecha: new Date().toISOString().split('T')[0],
        motivo: 'Pase planificado de tropa'
      });
    }
    setShowMovimientoModal(true);
  };

  const handleGuardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const anim = animales.find(a => a.caravana === movimientoForm.caravana);
    if (anim) {
      const updatedAnim = {
        ...anim,
        etapa_actual: movimientoForm.etapa_destino,
        lote_o_potrero: movimientoForm.nuevo_potrero,
        peso_actual_kg: Number(movimientoForm.nuevo_peso_kg)
      };
      await onSaveRecord('Animales_Bovinos', updatedAnim);
    }

    const nuevoMov = {
      id: `MOV_BOV_${Date.now()}`,
      fecha: movimientoForm.fecha,
      tipo_evento: 'PASE_FASE' as const,
      lote_id: movimientoForm.caravana,
      cantidad_cabezas: 1,
      kg_totales: Number(movimientoForm.nuevo_peso_kg),
      fase_origen_id: movimientoForm.etapa_origen,
      fase_destino_id: movimientoForm.etapa_destino,
      sector_origen_id: anim?.lote_o_potrero || 'Potrero Origen',
      sector_destino_id: movimientoForm.nuevo_potrero,
      motivo: movimientoForm.motivo,
      estado: 'Confirmado' as const,
      origen_dato: 'REAL' as const,
      estado_validacion: 'Auditado' as const,
      creado_por: currentUser?.nombre || 'Operador',
      fecha_creacion: new Date().toISOString()
    };
    await onSaveRecord('Movimientos_Fisicos', nuevoMov);

    setShowMovimientoModal(false);
    setFeedbackMsg(`Movimiento registrado: ${movimientoForm.caravana} pasó a ${movimientoForm.etapa_destino}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Filtrado de Animales según la etapa activa y filtros
  const animalesPorEtapa = useMemo(() => {
    if (etapaActiva === 'Movimientos' || etapaActiva === 'Historial') {
      return animales;
    }
    return animales.filter(a => {
      const etapaActual = a.etapa_actual || 'Cría';
      return etapaActual.toLowerCase() === etapaActiva.toLowerCase();
    });
  }, [animales, etapaActiva]);

  const animalesFiltrados = useMemo(() => {
    return animalesPorEtapa.filter(a => {
      const matchLinea = lineaFiltro === 'TODAS' || a.linea_destino === lineaFiltro;
      const matchPotrero = potreroFiltro === 'TODOS' || a.lote_o_potrero === potreroFiltro;
      const matchBusqueda = !busqueda.trim() || 
        a.caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.caravana_rfid && a.caravana_rfid.includes(busqueda)) ||
        a.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.raza.toLowerCase().includes(busqueda.toLowerCase());
      return matchLinea && matchPotrero && matchBusqueda;
    });
  }, [animalesPorEtapa, lineaFiltro, potreroFiltro, busqueda]);

  // Lista de potreros únicos para el filtro
  const listaPotreros = useMemo(() => {
    const sets = new Set(animales.map(a => a.lote_o_potrero).filter(Boolean));
    return Array.from(sets);
  }, [animales]);

  // Métricas de la etapa activa
  const metricsEtapa = useMemo(() => {
    const list = animalesPorEtapa;
    const totalCab = list.length;
    const totalKg = list.reduce((acc, a) => acc + (Number(a.peso_actual_kg) || 0), 0);
    const pesoProm = totalCab > 0 ? (totalKg / totalCab).toFixed(1) : '0';
    const ccSum = list.reduce((acc, a) => acc + (Number(a.condicion_corporal) || 0), 0);
    const ccProm = totalCab > 0 ? (ccSum / totalCab).toFixed(1) : '0';
    
    // Desglose por línea
    const carne = list.filter(a => a.linea_destino === 'Carne').length;
    const cabana = list.filter(a => a.linea_destino === 'Cabaña Angus').length;
    const reposicion = list.filter(a => a.linea_destino === 'Reposición').length;

    return { totalCab, totalKg, pesoProm, ccProm, carne, cabana, reposicion };
  }, [animalesPorEtapa]);

  // Movimientos históricos registrados para bovinos
  const movimientosBovinos = useMemo(() => {
    return movimientosFisicos.filter(m => 
      m.lote_id?.startsWith('UNRC') || 
      m.fase_origen_id === 'Cría' || 
      m.fase_origen_id === 'Recría' ||
      m.fase_origen_id === 'Adaptación' ||
      m.fase_origen_id === 'Engorde' ||
      m.fase_destino_id === 'Cría' || 
      m.fase_destino_id === 'Recría' ||
      m.fase_destino_id === 'Adaptación' ||
      m.fase_destino_id === 'Engorde'
    );
  }, [movimientosFisicos]);

  // Descripciones técnicas por etapa
  const infoEtapas = {
    Cria: {
      titulo: 'Cría Bovina & Rodeo de Vientres',
      descripcion: 'Mantenimiento del rodeo de cría, vacas de pedigree y rodeo general, toros padres Angus, control de servicios por IATF y diagnóstico de preñez por tacto.',
      objetivo: 'Maximizar tasa de destete y porcentaje de preñez manteniendo condición corporal $\\ge 5.0$.'
    },
    Recria: {
      titulo: 'Recría Pastoril & Desarrollo Estructural',
      descripcion: 'Desmamantes, novillitos y vaquillonas de reposición sobre pasturas de alfalfa y verdeos de invierno con suplementación estratégica de maíz propio UNRC.',
      objetivo: 'Desarrollo óseo y muscular sostenido con ganancia objetivo de 0.65 a 0.85 kg/cab/día sin sobreengrase.'
    },
    Adaptacion: {
      titulo: 'Adaptación a Corral (Transición Ruminal)',
      descripcion: 'Período crítico de 14 a 21 días de acostumbramiento de la microflora ruminal a raciones de alta energía (grano entero/quebrado + fibra efectiva de heno).',
      objetivo: 'Prevenir acidosis subclínica y homogeneizar la tropa antes de la terminación intensiva.'
    },
    Engorde: {
      titulo: 'Engorde & Terminación de Hacienda',
      descripcion: 'Alimentación intensiva de novillos para faena pesada (400-430 kg) y preparación especial de toros y vaquillonas para Cabaña Angus y remates.',
      objetivo: 'Aumento diario de 1.15 a 1.25 kg/día logrando engrase uniforme grado 1-2 oficial SENASA.'
    },
    Movimientos: {
      titulo: 'Movimientos Físicos entre Etapas Productivas',
      descripcion: 'Registro de pases de hacienda y trazabilidad biológica individual entre Cría, Recría, Adaptación y Engorde.',
      objetivo: 'Garantizar el seguimiento zootécnico por caravana y potrero en cada transición de etapa.'
    },
    Historial: {
      titulo: 'Historial Consolidado del Rodeo Bovino',
      descripcion: 'Roster completo de caravanas oficiales, chips RFID de 15 dígitos y líneas de destino del establecimiento.',
      objetivo: 'Visión integral del inventario físico activo de hacienda bovina.'
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2c1d11] text-[#fbf4ee] px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#78350f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#f59e0b]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ===================================================================
          ENCABEZADO PRINCIPAL (Modelo Porcinos con Paleta Marrón/Tierra/Beige)
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7d4c4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78350f] bg-[#fbf4ee] px-2.5 py-1 rounded-md border border-[#e7d4c4]">
              UNIDAD PRODUCTIVA: BOVINOS
            </span>
            <span className="text-[11px] font-semibold text-[#5c3a21] bg-white px-2 py-0.5 rounded border border-[#e7d4c4]">
              Proceso: {infoEtapas[etapaActiva].titulo}
            </span>
            <span className="text-[11px] font-mono text-[#8c674e]">
              Campaña: CAMP_2024_2025
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2c1d11] tracking-tight">
            BOVINOS · PRODUCCIÓN, ETAPAS Y GESTIÓN DE RODEO
          </h1>
          <p className="text-xs text-[#5c3a21] mt-0.5 max-w-3xl">
            {infoEtapas[etapaActiva].descripcion}
          </p>
        </div>

        {/* PESTAÑAS DE ETAPAS PRODUCTIVAS (Coherente con Porcinos, sin duplicar menú) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f2e6de] rounded-xl border border-[#e7d4c4] overflow-x-auto shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setEtapaActiva('Cria')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Cria'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <Beef className="w-3.5 h-3.5" />
            <span>1. Cría</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Recria')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Recria'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Recría</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Adaptacion')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Adaptacion'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Adaptación</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Engorde')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Engorde'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>4. Engorde</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Movimientos')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Movimientos'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Movimientos ({movimientosBovinos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setEtapaActiva('Historial')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              etapaActiva === 'Historial'
                ? 'bg-white text-[#78350f] font-bold shadow-xs border border-[#d4b8a3]'
                : 'text-[#8c674e] hover:text-[#58250b] font-medium'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Roster Total ({animales.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          RESUMEN DE SITUACIÓN & EXISTENCIAS DE LA ETAPA ACTIVA
      =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Hacienda en Etapa</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
            {metricsEtapa.totalCab} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Roster individual activo
          </div>
        </div>

        <div className="p-3.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Peso Promedio</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
            {metricsEtapa.pesoProm} <span className="text-xs font-normal text-[#5c3a21]">kg</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Biomasa: {metricsEtapa.totalKg.toLocaleString()} kg
          </div>
        </div>

        <div className="p-3.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Condición Corporal</div>
          <div className="text-2xl font-bold text-[#78350f] font-mono tabular-nums mt-0.5">
            {metricsEtapa.ccProm} <span className="text-xs font-normal text-[#5c3a21]">/ 9</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Escala oficial zootécnica
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Línea Carne</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
            {metricsEtapa.carne} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Destino faena / MAG
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Cabaña Angus</div>
          <div className="text-2xl font-bold text-[#78350f] font-mono tabular-nums mt-0.5">
            {metricsEtapa.cabana} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Pedigrí y Puro Controlado
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e7d4c4] rounded-xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Reposición Vientres</div>
          <div className="text-2xl font-bold text-[#5c3a21] font-mono tabular-nums mt-0.5">
            {metricsEtapa.reposicion} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">
            Retención para rodeo
          </div>
        </div>
      </div>

      {/* ===================================================================
          BARRAS SEPARADAS: SECTOR 1 (FILTROS) Y SECTOR 2 (ACCIONES)
          (Idéntico a la disciplina aplicada en Cría Porcina)
      =================================================================== */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* SECTOR 1: FILTROS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5c3a21]">
            <Filter className="w-3.5 h-3.5 text-[#78350f]" />
            <span>Sector Filtros:</span>
          </div>

          {/* Filtro Línea de Destino */}
          <div className="flex items-center gap-1 bg-[#fbf4ee] p-1 rounded-lg border border-[#e7d4c4]">
            <span className="text-[11px] font-medium text-[#8c674e] px-1">Línea:</span>
            {(['TODAS', 'Carne', 'Cabaña Angus', 'Reposición'] as const).map((linea) => (
              <button
                key={linea}
                type="button"
                onClick={() => setLineaFiltro(linea)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  lineaFiltro === linea
                    ? 'bg-[#78350f] text-white shadow-2xs font-semibold'
                    : 'text-[#5c3a21] hover:bg-[#f2e6de]'
                }`}
              >
                {linea}
              </button>
            ))}
          </div>

          {/* Filtro Potrero */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-[#8c674e]">Potrero:</span>
            <select
              value={potreroFiltro}
              onChange={(e) => setPotreroFiltro(e.target.value)}
              className="text-xs bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg px-2 py-1 text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
            >
              <option value="TODOS">Todos los potreros</option>
              {listaPotreros.map(pot => (
                <option key={pot} value={pot}>{pot}</option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#8c674e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar caravana, RFID o raza..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11] placeholder-[#8c674e] focus:outline-none focus:border-[#78350f]"
            />
          </div>
        </div>

        {/* SECTOR 2: ACCIONES PRINCIPALES */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#e7d4c4]">
          {etapaActiva === 'Cria' && (
            <button
              type="button"
              onClick={() => setShowTactoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#fbf4ee] hover:bg-[#f2e6de] text-[#78350f] border border-[#e7d4c4] rounded-lg transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Registrar Tacto / IATF</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAbrirModalMovimiento()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#fbf4ee] hover:bg-[#f2e6de] text-[#78350f] border border-[#e7d4c4] rounded-lg transition-colors cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Pase de Etapa</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAnimalModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#78350f] hover:bg-[#58250b] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Bovino / Caravana</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          CONTENIDO DINÁMICO SEGÚN LA ETAPA SELECCIONADA
      =================================================================== */}

      {/* 1. SECCIÓN DE CONTROL REPRODUCTIVO (Exclusivo en Etapa Cría) */}
      {etapaActiva === 'Cria' && (
        <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#fbf4ee] text-[#78350f] rounded-lg border border-[#e7d4c4]">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#2c1d11]">Control Reproductivo · Servicios, IATF & Diagnóstico de Preñez</h2>
                <p className="text-xs text-[#5c3a21]">Protocolos de sincronización con toros UNRC y confirmación ecográfica</p>
              </div>
            </div>
            <button
              onClick={() => setShowTactoModal(true)}
              className="text-xs font-semibold text-[#78350f] hover:underline"
            >
              + Registrar Diagnóstico
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tactos.map((t) => (
              <div key={t.id} className="p-3.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2c1d11]">{t.lote_vientres}</span>
                  <span className="text-[11px] font-mono text-[#8c674e]">{t.fecha}</span>
                </div>
                <div className="text-xs text-[#5c3a21]">{t.tipo} · {t.toro_o_semen}</div>
                <div className="flex items-center justify-between pt-2 border-t border-[#e7d4c4] text-xs">
                  <span>Evaluadas: <strong>{t.cabezas_evaluadas}</strong> (Preñadas: {t.cabezas_prenadas})</span>
                  <span className="text-sm font-bold font-mono text-[#78350f]">{t.porcentaje_prenez}% preñez</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TABLA PRINCIPAL DE OPERACIONES & HACIENDA DE LA ETAPA */}
      {etapaActiva !== 'Movimientos' && (
        <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#2c1d11]">
                Roster de Hacienda · {infoEtapas[etapaActiva].titulo}
              </h2>
              <p className="text-xs text-[#5c3a21]">
                Identificación oficial por caravana visual y RFID oficial SENASA · Control de línea de destino y cambio de etapa
              </p>
            </div>
            <div className="text-xs text-[#5c3a21] font-mono tabular-nums">
              Mostrando <strong>{animalesFiltrados.length}</strong> de {animalesPorEtapa.length} animales en etapa
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                  <th className="py-2.5 px-3">Caravana Visual</th>
                  <th className="py-2.5 px-3 font-mono">RFID SENASA (15 Dígitos)</th>
                  <th className="py-2.5 px-3">Categoría / Raza</th>
                  <th className="py-2.5 px-3">Línea de Destino</th>
                  <th className="py-2.5 px-3">Etapa Actual</th>
                  <th className="py-2.5 px-3">Potrero / Lote</th>
                  <th className="py-2.5 px-3 text-right">Peso Actual</th>
                  <th className="py-2.5 px-3 text-center">CC (1-9)</th>
                  <th className="py-2.5 px-3 text-center">Acciones / Pase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e6de]">
                {animalesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-[#8c674e]">
                      No se encontraron bovinos en la etapa <strong>{etapaActiva}</strong> con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  animalesFiltrados.map((animal) => (
                    <tr key={animal.id} className="hover:bg-[#fbf4ee]/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#2c1d11]">
                        {animal.caravana}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#5c3a21] tabular-nums">
                        {animal.caravana_rfid || 'Sin RFID'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#2c1d11]">{animal.categoria}</div>
                        <div className="text-[11px] text-[#8c674e]">{animal.raza} · {animal.sexo}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          animal.linea_destino === 'Cabaña Angus'
                            ? 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]'
                            : animal.linea_destino === 'Reposición'
                            ? 'bg-[#f7efe9] text-[#5c3a21] border-[#d4b8a3]'
                            : 'bg-[#fbf4ee] text-[#2c1d11] border-[#e7d4c4]'
                        }`}>
                          {animal.linea_destino || 'Sin definir'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#78350f]">
                        {animal.etapa_actual || 'Cría'}
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">
                        {animal.lote_o_potrero}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                        {animal.peso_actual_kg} kg
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#5c3a21]">
                        {animal.condicion_corporal || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={animal.linea_destino || 'Carne'}
                            onChange={(e) => handleCambiarLineaDestino(animal, e.target.value as any)}
                            className="text-[11px] bg-white border border-[#e7d4c4] rounded px-1.5 py-0.5 text-[#2c1d11]"
                            title="Cambiar Línea de Destino sin clonar el animal"
                          >
                            <option value="Carne">Carne</option>
                            <option value="Cabaña Angus">Cabaña Angus</option>
                            <option value="Reposición">Reposición</option>
                          </select>
                          <select
                            value={animal.etapa_actual || 'Cría'}
                            onChange={(e) => handleCambiarEtapaDirecta(animal, e.target.value as any)}
                            className="text-[11px] bg-white border border-[#e7d4c4] rounded px-1.5 py-0.5 text-[#2c1d11]"
                            title="Avanzar de Etapa Productiva"
                          >
                            <option value="Cría">Cría</option>
                            <option value="Recría">Recría</option>
                            <option value="Adaptación">Adaptación</option>
                            <option value="Engorde">Engorde</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAbrirModalMovimiento(animal)}
                            className="p-1 text-[#78350f] hover:bg-[#fbf4ee] rounded"
                            title="Registrar Pase Detallado de Etapa"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN DE MOVIMIENTOS FÍSICOS ENTRE ETAPAS (Pestaña Movimientos) */}
      {etapaActiva === 'Movimientos' && (
        <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
            <div>
              <h2 className="text-base font-bold text-[#2c1d11]">
                Registro de Movimientos Físicos & Trazabilidad de Etapas
              </h2>
              <p className="text-xs text-[#5c3a21]">
                Historial cronológico de transferencias de animales entre Cría, Recría, Adaptación y Engorde
              </p>
            </div>
            <button
              onClick={() => handleAbrirModalMovimiento()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#78350f] hover:bg-[#58250b] text-white rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Nuevo Pase</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Caravana / Lote</th>
                  <th className="py-2.5 px-3">Etapa Origen</th>
                  <th className="py-2.5 px-3">Etapa Destino</th>
                  <th className="py-2.5 px-3">Sector / Potrero</th>
                  <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                  <th className="py-2.5 px-3">Motivo / Observación</th>
                  <th className="py-2.5 px-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e6de]">
                {movimientosBovinos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#8c674e]">
                      Aún no se han registrado pases de etapa. Utilice el botón "+ Registrar Nuevo Pase" para transferir animales.
                    </td>
                  </tr>
                ) : (
                  movimientosBovinos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#fbf4ee]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#2c1d11]">{mov.fecha}</td>
                      <td className="py-2.5 px-3 font-bold text-[#78350f]">{mov.lote_id}</td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">{mov.fase_origen_id || 'Cría'}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#2c1d11]">
                        <span className="inline-flex items-center gap-1">
                          <MoveRight className="w-3 h-3 text-[#78350f]" />
                          {mov.fase_destino_id || 'Recría'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">{mov.sector_destino_id || 'Potrero'}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                        {mov.kg_totales || '—'} kg
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21] max-w-xs truncate">{mov.motivo}</td>
                      <td className="py-2.5 px-3 text-[#8c674e]">{mov.creado_por || 'Sistema'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: NUEVO BOVINO / CARAVANA
      =================================================================== */}
      {showAnimalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in border border-[#e7d4c4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Rodeo & Cabaña Angus
                </span>
                <h3 className="text-base font-bold text-[#2c1d11]">
                  BOVINOS · REGISTRO DE ANIMAL / CARAVANA
                </h3>
              </div>
              <button onClick={() => setShowAnimalModal(false)} className="text-[#8c674e] hover:text-[#2c1d11]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarAnimal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Caravana Visual</label>
                  <input
                    type="text"
                    required
                    value={animalForm.caravana}
                    onChange={(e) => setAnimalForm({ ...animalForm, caravana: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">RFID SENASA (15 dígitos)</label>
                  <input
                    type="text"
                    value={animalForm.caravana_rfid}
                    onChange={(e) => setAnimalForm({ ...animalForm, caravana_rfid: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Categoría</label>
                  <select
                    value={animalForm.categoria}
                    onChange={(e) => setAnimalForm({ ...animalForm, categoria: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  >
                    <option value="Novillito">Novillito</option>
                    <option value="Novillo">Novillo</option>
                    <option value="Vaca de Cría">Vaca de Cría</option>
                    <option value="Vaquillona">Vaquillona</option>
                    <option value="Toro">Toro</option>
                    <option value="Ternero">Ternero</option>
                    <option value="Ternera">Ternera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Etapa de Inicio</label>
                  <select
                    value={animalForm.etapa_actual}
                    onChange={(e) => setAnimalForm({ ...animalForm, etapa_actual: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  >
                    <option value="Cría">Cría</option>
                    <option value="Recría">Recría</option>
                    <option value="Adaptación">Adaptación</option>
                    <option value="Engorde">Engorde</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Línea de Destino</label>
                  <select
                    value={animalForm.linea_destino}
                    onChange={(e) => setAnimalForm({ ...animalForm, linea_destino: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  >
                    <option value="Carne">Carne (Invernada)</option>
                    <option value="Cabaña Angus">Cabaña Angus (Pedigrí)</option>
                    <option value="Reposición">Reposición de Vientres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Potrero / Lote</label>
                  <input
                    type="text"
                    value={animalForm.lote_o_potrero}
                    onChange={(e) => setAnimalForm({ ...animalForm, lote_o_potrero: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    value={animalForm.peso_actual_kg}
                    onChange={(e) => setAnimalForm({ ...animalForm, peso_actual_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">CC (1-9)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="9"
                    value={animalForm.condicion_corporal}
                    onChange={(e) => setAnimalForm({ ...animalForm, condicion_corporal: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">ADPV (kg/d)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={animalForm.adpv_acumulado_kg}
                    onChange={(e) => setAnimalForm({ ...animalForm, adpv_acumulado_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={animalForm.observaciones}
                  onChange={(e) => setAnimalForm({ ...animalForm, observaciones: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowAnimalModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e7d4c4] text-[#5c3a21] hover:bg-[#fbf4ee]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#78350f] hover:bg-[#58250b] text-white font-semibold shadow-xs"
                >
                  Guardar Bovino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: REGISTRO DE TACTO / IATF
      =================================================================== */}
      {showTactoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in border border-[#e7d4c4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Reproducción & Preñez
                </span>
                <h3 className="text-base font-bold text-[#2c1d11]">
                  BOVINOS · REGISTRO DE TACTO Y PREÑEZ
                </h3>
              </div>
              <button onClick={() => setShowTactoModal(false)} className="text-[#8c674e] hover:text-[#2c1d11]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarTacto} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={tactoForm.fecha}
                    onChange={(e) => setTactoForm({ ...tactoForm, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Tipo de Evento</label>
                  <select
                    value={tactoForm.tipo}
                    onChange={(e) => setTactoForm({ ...tactoForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  >
                    <option value="Diagnóstico de Preñez (Tacto)">Diagnóstico de Preñez (Tacto)</option>
                    <option value="Inseminación Artificial (IATF)">Inseminación Artificial (IATF)</option>
                    <option value="Servicio Natural / Repaso">Servicio Natural / Repaso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Lote de Vientres Evaluado</label>
                <input
                  type="text"
                  required
                  value={tactoForm.lote_vientres}
                  onChange={(e) => setTactoForm({ ...tactoForm, lote_vientres: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                />
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Toro o Semen Utilizado</label>
                <input
                  type="text"
                  value={tactoForm.toro_o_semen}
                  onChange={(e) => setTactoForm({ ...tactoForm, toro_o_semen: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Cabezas Evaluadas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tactoForm.cabezas_evaluadas}
                    onChange={(e) => setTactoForm({ ...tactoForm, cabezas_evaluadas: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Cabezas Preñadas</label>
                  <input
                    type="number"
                    min="0"
                    max={tactoForm.cabezas_evaluadas}
                    required
                    value={tactoForm.cabezas_prenadas}
                    onChange={(e) => setTactoForm({ ...tactoForm, cabezas_prenadas: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-xs flex justify-between items-center font-mono">
                <span className="text-[#5c3a21] font-sans font-semibold">Tasa de Preñez Calculada:</span>
                <span className="text-sm font-bold text-[#78350f]">
                  {tactoForm.cabezas_evaluadas > 0 
                    ? ((tactoForm.cabezas_prenadas / tactoForm.cabezas_evaluadas) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowTactoModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e7d4c4] text-[#5c3a21] hover:bg-[#fbf4ee]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#78350f] hover:bg-[#58250b] text-white font-semibold shadow-xs"
                >
                  Guardar Diagnóstico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: MOVIMIENTO FÍSICO / PASE DE ETAPA
      =================================================================== */}
      {showMovimientoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in border border-[#e7d4c4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Transición de Ciclo
                </span>
                <h3 className="text-base font-bold text-[#2c1d11]">
                  BOVINOS · REGISTRO DE MOVIMIENTO FÍSICO / PASE DE ETAPA
                </h3>
              </div>
              <button onClick={() => setShowMovimientoModal(false)} className="text-[#8c674e] hover:text-[#2c1d11]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarMovimiento} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Caravana del Animal</label>
                <select
                  value={movimientoForm.caravana}
                  onChange={(e) => {
                    const sel = animales.find(a => a.caravana === e.target.value);
                    if (sel) {
                      setMovimientoForm({
                        ...movimientoForm,
                        caravana: sel.caravana,
                        etapa_origen: sel.etapa_actual || 'Cría',
                        nuevo_potrero: sel.lote_o_potrero,
                        nuevo_peso_kg: sel.peso_actual_kg
                      });
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-bold focus:outline-none focus:border-[#78350f]"
                >
                  {animales.map(a => (
                    <option key={a.id} value={a.caravana}>
                      {a.caravana} · {a.categoria} ({a.linea_destino || 'Carne'}) - Etapa actual: {a.etapa_actual || 'Cría'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Etapa de Origen</label>
                  <input
                    type="text"
                    disabled
                    value={movimientoForm.etapa_origen}
                    className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#5c3a21] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Etapa de Destino</label>
                  <select
                    value={movimientoForm.etapa_destino}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, etapa_destino: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-bold focus:outline-none focus:border-[#78350f]"
                  >
                    <option value="Cría">Cría</option>
                    <option value="Recría">Recría</option>
                    <option value="Adaptación">Adaptación</option>
                    <option value="Engorde">Engorde</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Nuevo Potrero Asignado</label>
                  <input
                    type="text"
                    required
                    value={movimientoForm.nuevo_potrero}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, nuevo_potrero: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Peso Actual al Pase (kg)</label>
                  <input
                    type="number"
                    required
                    value={movimientoForm.nuevo_peso_kg}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, nuevo_peso_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono focus:outline-none focus:border-[#78350f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Motivo del Pase / Justificación Zootécnica</label>
                <input
                  type="text"
                  required
                  value={movimientoForm.motivo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] focus:outline-none focus:border-[#78350f]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowMovimientoModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e7d4c4] text-[#5c3a21] hover:bg-[#fbf4ee]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#78350f] hover:bg-[#58250b] text-white font-semibold shadow-xs"
                >
                  Confirmar Pase de Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
