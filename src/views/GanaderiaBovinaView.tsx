/**
 * @file GanaderiaBovinaView.tsx
 * @description Módulo Integral de Gestión Ganadera Bovina - Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Abarca: Ciclo Completo Angus, Cabaña Angus, Manga y Pesadas (ADPV), Potreros y Carga (EV/ha),
 * Sanidad Oficial SENASA, y Simulador de Margen Incremental para Decisión de Venta con referencias MAG Cañuelas.
 */

import React, { useState, useMemo } from 'react';
import { 
  BaseDatosPorcina, 
  CategoriaBovina, 
  PesadaBovina, 
  EventoSanitarioBovino, 
  AnimalBovino,
  ServicioTactoBovino,
  PartoDesteteBovino,
  LoteEngordeBovino,
  VentaHaciendaBovina,
  PotreroBovino,
  DietaRacionBovina,
  Usuario 
} from '../types/schema';
import { 
  Beef, 
  TrendingUp, 
  ShieldCheck, 
  Scale, 
  Plus, 
  Layers, 
  Activity, 
  AlertCircle, 
  Calculator, 
  DollarSign, 
  Award, 
  Sliders, 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Wheat, 
  Truck,
  HelpCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  activeModule?: string;
  onNavigate?: (moduleKey: any) => void;
}

type TabKey = 'panel' | 'rodeo' | 'manga' | 'alimentacion' | 'ventas' | 'sanidad';

export const GanaderiaBovinaView: React.FC<Props> = ({ 
  db, 
  currentUser, 
  onSaveRecord,
  activeModule,
  onNavigate
}) => {
  // Sincronización inteligente de pestañas con el menú lateral si aplica
  const initialTab = useMemo<TabKey>(() => {
    if (activeModule === 'alimentacion' || activeModule === 'stock' || activeModule === 'existencias') return 'alimentacion';
    if (activeModule === 'ventas' || activeModule === 'compras' || activeModule === 'presupuesto' || activeModule === 'historico') return 'ventas';
    if (activeModule === 'produccion') return 'rodeo';
    if (activeModule === 'indicadores') return 'panel';
    return 'panel';
  }, [activeModule]);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filtros en Rodeo
  const [lineaFiltro, setLineaFiltro] = useState<string>('TODAS');
  const [etapaFiltro, setEtapaFiltro] = useState<string>('TODAS');
  const [busquedaCaravana, setBusquedaCaravana] = useState<string>('');

  // Modales
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showPesadaModal, setShowPesadaModal] = useState(false);
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [showSanidadModal, setShowSanidadModal] = useState(false);
  const [showTactoModal, setShowTactoModal] = useState(false);

  // Tablas del Almacén de Datos
  const categorias = db.Categorias_Bovinas || [];
  const pesadas = db.Pesadas_Bovinas || [];
  const sanidad = db.Eventos_Sanitarios_Bovinos || [];
  const animales = db.Animales_Bovinos || [];
  const tactos = db.Servicios_Tactos_Bovinos || [];
  const partosDestetes = db.Partos_Destetes_Bovinos || [];
  const lotesEngorde = db.Lotes_Engorde_Bovinos || [];
  const ventas = db.Ventas_Hacienda_Bovinas || [];
  const potreros = db.Potreros_Bovinos || [];
  const dietas = db.Dieta_Racion_Bovina || [];

  // Cálculos Consolidados
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  
  // Factores Equivalente Vaca (EV):
  // Toro: 1.4 EV, Vaca cría: 1.0 EV, Vaquillona: 0.8 EV, Novillo: 0.9 EV, Ternero: 0.5 EV
  const totalEV = categorias.reduce((acc, c) => {
    let factor = 1.0;
    if (c.categoria.includes('Toro')) factor = 1.4;
    else if (c.categoria.includes('Vaca') || c.categoria.includes('Vientre')) factor = 1.0;
    else if (c.categoria.includes('Vaquillona')) factor = 0.8;
    else if (c.categoria.includes('Novillo')) factor = 0.9;
    else if (c.categoria.includes('Ternero')) factor = 0.5;
    return acc + (c.cabezas * factor);
  }, 0);

  const superficieGanaderaHa = 180; // Superficie ganadera asignada en Pozo del Carril
  const cargaEVHa = totalEV / superficieGanaderaHa;

  const novillosObj = categorias.find(c => c.categoria.includes('Novillo'));
  const adpvNovillos = novillosObj?.adpv_real_kg_dia || 0.84;

  // Indicadores de Reproducción
  const ultimoTacto = tactos.find(t => t.tipo.includes('Tacto')) || tactos[0];
  const porcentajePrenez = ultimoTacto?.porcentaje_prenez || 88.1;
  const ultimoDestete = partosDestetes.find(p => p.tipo === 'Destete') || partosDestetes[0];
  const pesoDesteteProm = ultimoDestete?.peso_promedio_kg || 178;

  // Totales de Ventas
  const totalFacturacionHacienda = ventas.reduce((acc, v) => acc + (v.importe_neto_liquidado || 0), 0);
  const totalKgVendidos = ventas.reduce((acc, v) => acc + (v.kg_vivos_totales || 0), 0);
  const totalCabezasVendidas = ventas.reduce((acc, v) => acc + (v.cabezas || 0), 0);

  // Estados de Formulario: Nuevo Animal / Caravana
  const [animalForm, setAnimalForm] = useState({
    caravana: 'UNRC-A-108',
    caravana_rfid: '032000084920118',
    categoria: 'Novillito' as AnimalBovino['categoria'],
    sexo: 'Macho' as AnimalBovino['sexo'],
    raza: 'Angus Negro',
    linea_destino: 'Carne' as NonNullable<AnimalBovino['linea_destino']>,
    etapa_actual: 'Recría' as NonNullable<AnimalBovino['etapa_actual']>,
    fecha_nacimiento_ingreso: new Date().toISOString().split('T')[0],
    peso_actual_kg: 295,
    adpv_acumulado_kg: 0.82,
    condicion_corporal: 6,
    estado_productivo: 'Engorde' as AnimalBovino['estado_productivo'],
    lote_o_potrero: 'Potrero 3 - Las Acacias',
    origen: 'Destete Propio Pozo del Carril',
    observaciones: 'Incorporación a tropa de recría pastoril con suplementación'
  });

  // Estados de Formulario: Nueva Pesada en Manga
  const [pesadaForm, setPesadaForm] = useState({
    categoria_id: 'BOV_NOV',
    lote_o_caravana: 'Tropa Novillitos 2024',
    fecha: new Date().toISOString().split('T')[0],
    peso_kg: 405,
    peso_anterior_kg: 368,
    dias_periodo: 42,
    condicion_corporal: 6.5,
    observaciones: 'Pesada de control en manga antes de rotación a corral'
  });

  // Cálculo en tiempo real de ADPV en formulario de pesada
  const adpvPesadaCalculado = useMemo(() => {
    if (pesadaForm.dias_periodo > 0 && pesadaForm.peso_kg > pesadaForm.peso_anterior_kg) {
      return Number(((pesadaForm.peso_kg - pesadaForm.peso_anterior_kg) / pesadaForm.dias_periodo).toFixed(3));
    }
    return 0.85;
  }, [pesadaForm.peso_kg, pesadaForm.peso_anterior_kg, pesadaForm.dias_periodo]);

  // Estados de Formulario: Nueva Venta
  const [ventaForm, setVentaForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_venta: 'Invernada / Faena' as VentaHaciendaBovina['tipo_venta'],
    categoria: 'Novillos Pesados (410-430 kg)',
    comprador_o_consignatario: 'Consignataria Ganadera Río Cuarto S.R.L. / MAG Cañuelas',
    cabezas: 20,
    peso_promedio_kg: 420,
    precio_unitario: 2280.00,
    precio_referencia_mag: 2250.00,
    gastos_comerciales_pct: 4.5,
    flete_total: 280000,
    dte_numero: 'DTE-SENASA-2025-099412',
    guia_policial_nro: 'GUIA-CBA-05120',
    observaciones: 'Venta con destino a faena de consumo y exportación'
  });

  // Estados de Formulario: Sanidad SENASA
  const [sanidadForm, setSanidadForm] = useState({
    tipo_evento: 'Vacunación Aftosa' as EventoSanitarioBovino['tipo_evento'],
    fecha: new Date().toISOString().split('T')[0],
    cabezas_tratadas: totalCabezas,
    producto_aplicado: 'Aftosa Bivalente Biogénesis Bagó',
    responsable: 'SENASA / Plan Local UNRC',
    certificado_senasa_nro: 'ACTA-2025-1420',
    observaciones: 'Campaña oficial obligatoria SENASA'
  });

  // Estados del Simulador de Margen Incremental de Decisión de Venta
  const [simPesoActual, setSimPesoActual] = useState<number>(340);
  const [simPrecioActual, setSimPrecioActual] = useState<number>(2220); // $/kg vivo hoy
  const [simAdpvEsperado, setSimAdpvEsperado] = useState<number>(0.95); // kg/día
  const [simDiasRetencion, setSimDiasRetencion] = useState<number>(45); // días
  const [simCostoDiarioCab, setSimCostoDiarioCab] = useState<number>(1650); // $/cab/día ración + estructura
  const [simPrecioTermino, setSimPrecioTermino] = useState<number>(2280); // $/kg proyectado
  const [simCabezasTropa, setSimCabezasTropa] = useState<number>(30); // cabezas

  // Cálculos del Simulador
  const simResultado = useMemo(() => {
    const aumentoKg = simAdpvEsperado * simDiasRetencion;
    const pesoFinal = simPesoActual + aumentoKg;
    const ingresoHoyPorCab = simPesoActual * simPrecioActual;
    const ingresoTerminoPorCab = pesoFinal * simPrecioTermino;
    const costoAlimentacionPorCab = simCostoDiarioCab * simDiasRetencion;
    const margenIncrementalPorCab = ingresoTerminoPorCab - ingresoHoyPorCab - costoAlimentacionPorCab;
    const margenIncrementalTropa = margenIncrementalPorCab * simCabezasTropa;
    const costoPorKgProducido = aumentoKg > 0 ? costoAlimentacionPorCab / aumentoKg : 0;
    const esConveniente = margenIncrementalPorCab > 0;

    return {
      aumentoKg: Math.round(aumentoKg),
      pesoFinal: Math.round(pesoFinal),
      ingresoHoyPorCab,
      ingresoTerminoPorCab,
      costoAlimentacionPorCab,
      margenIncrementalPorCab,
      margenIncrementalTropa,
      costoPorKgProducido: Math.round(costoPorKgProducido),
      esConveniente
    };
  }, [simPesoActual, simPrecioActual, simAdpvEsperado, simDiasRetencion, simCostoDiarioCab, simPrecioTermino, simCabezasTropa]);

  // Manejadores de Guardado
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
    setFeedbackMsg(`Animal ${nuevoAnimal.caravana} (${nuevoAnimal.linea_destino}) registrado con éxito.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGuardarPesada = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaPesada: PesadaBovina = {
      id: `PES_BOV_${Date.now()}`,
      ...pesadaForm,
      peso_kg: Number(pesadaForm.peso_kg),
      peso_anterior_kg: Number(pesadaForm.peso_anterior_kg),
      dias_periodo: Number(pesadaForm.dias_periodo),
      adpv_calculado: adpvPesadaCalculado,
      condicion_corporal: Number(pesadaForm.condicion_corporal)
    };
    await onSaveRecord('Pesadas_Bovinas', nuevaPesada);
    setShowPesadaModal(false);
    setFeedbackMsg(`Pesada registrada para ${nuevaPesada.lote_o_caravana}. ADPV calculado: ${nuevaPesada.adpv_calculado} kg/día.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGuardarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    const kgTotales = ventaForm.cabezas * ventaForm.peso_promedio_kg;
    const importeBruto = kgTotales * ventaForm.precio_unitario;
    const gastosComerciales = (importeBruto * ventaForm.gastos_comerciales_pct) / 100;
    const importeNeto = importeBruto - gastosComerciales - ventaForm.flete_total;

    const nuevaVenta: VentaHaciendaBovina = {
      id: `VTA_BOV_${Date.now()}`,
      ...ventaForm,
      cabezas: Number(ventaForm.cabezas),
      peso_promedio_kg: Number(ventaForm.peso_promedio_kg),
      kg_vivos_totales: kgTotales,
      precio_unitario: Number(ventaForm.precio_unitario),
      precio_referencia_mag: Number(ventaForm.precio_referencia_mag),
      desvio_precio_mag: Number(ventaForm.precio_unitario) - Number(ventaForm.precio_referencia_mag),
      importe_bruto: importeBruto,
      gastos_comerciales_total: gastosComerciales,
      importe_neto_liquidado: importeNeto,
      estado: 'Confirmado'
    };
    await onSaveRecord('Ventas_Hacienda_Bovinas', nuevaVenta);
    setShowVentaModal(false);
    setFeedbackMsg(`Liquidación de venta ${nuevaVenta.dte_numero} registrada por $${importeNeto.toLocaleString('es-AR')}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGuardarSanidad = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoEvento: EventoSanitarioBovino = {
      id: `SAN_BOV_${Date.now()}`,
      ...sanidadForm,
      cabezas_tratadas: Number(sanidadForm.cabezas_tratadas)
    };
    await onSaveRecord('Eventos_Sanitarios_Bovinos', nuevoEvento);
    setShowSanidadModal(false);
    setFeedbackMsg(`Evento sanitario registrado en libreta oficial SENASA (${nuevoEvento.certificado_senasa_nro || 'Acta Oficial'}).`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Reclasificación rápida de línea o etapa sin clonar
  const handleCambiarLineaDestino = async (animal: AnimalBovino, nuevaLinea: NonNullable<AnimalBovino['linea_destino']>) => {
    const updated = { ...animal, linea_destino: nuevaLinea };
    await onSaveRecord('Animales_Bovinos', updated);
    setFeedbackMsg(`Caravana ${animal.caravana}: reasignada a línea ${nuevaLinea}.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCambiarEtapa = async (animal: AnimalBovino, nuevaEtapa: NonNullable<AnimalBovino['etapa_actual']>) => {
    const updated = { ...animal, etapa_actual: nuevaEtapa };
    await onSaveRecord('Animales_Bovinos', updated);
    setFeedbackMsg(`Caravana ${animal.caravana}: avanzada a etapa ${nuevaEtapa}.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Filtrado de Animales
  const animalesFiltrados = useMemo(() => {
    return animales.filter(a => {
      const matchLinea = lineaFiltro === 'TODAS' || a.linea_destino === lineaFiltro;
      const matchEtapa = etapaFiltro === 'TODAS' || a.etapa_actual === etapaFiltro;
      const matchBusqueda = !busquedaCaravana.trim() || 
        a.caravana.toLowerCase().includes(busquedaCaravana.toLowerCase()) ||
        (a.caravana_rfid && a.caravana_rfid.includes(busquedaCaravana));
      return matchLinea && matchEtapa && matchBusqueda;
    });
  }, [animales, lineaFiltro, etapaFiltro, busquedaCaravana]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#14281d] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#2b583f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#78c293]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado Institucional UNRC & Contexto Bovina */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#f2e6de]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-[#fbf4ee] text-[#78350f] border border-[#e7d4c4] rounded-lg">
                <Beef className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c674e]">
                Establecimiento Pozo del Carril – La Aguada | UNRC
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#2c1d11] tracking-tight">
              Unidad Ganadería Bovina · Ciclo Completo Angus & Cabaña
            </h1>
            <p className="text-xs text-[#5c3a21] mt-0.5">
              Cría, Recría Pastoril, Adaptación a Corral y Terminación · Reproductores P.C. & Hacienda para Faena
            </p>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPesadaModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#78350f] bg-[#fbf4ee] hover:bg-[#f2e6de] border border-[#e7d4c4] rounded-lg transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Registrar Pesada</span>
            </button>
            <button
              onClick={() => setShowAnimalModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Bovino / Caravana</span>
            </button>
          </div>
        </div>

        {/* Tira de Métricas Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Rodeo Total</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {totalCabezas} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{categorias.length} categorías</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Carga en EV/ha</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {cargaEVHa.toFixed(2)} <span className="text-xs font-normal text-[#5c3a21]">EV/ha</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{totalEV.toFixed(1)} EV</span>
              <span aria-hidden="true" className="mx-1">·</span>
              <span>180 ha</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">ADPV Novillos</div>
            <div className="text-xl font-bold text-[#78350f] font-mono tabular-nums mt-0.5">
              +{adpvNovillos.toFixed(2)} <span className="text-xs font-normal text-[#5c3a21]">kg/día</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>A pasto + maíz</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">% Preñez Tacto</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {porcentajePrenez}%
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{ultimoTacto?.lote_vientres?.slice(0, 15) || 'Rodeo Cría'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Destete Ajustado</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {pesoDesteteProm} <span className="text-xs font-normal text-[#5c3a21]">kg</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>Base 205 días</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Ref. MAG Cañuelas</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              $2.280 <span className="text-xs font-normal text-[#5c3a21]">/kg</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>Novillito consumo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación exclusivamente a través del menú lateral (barra horizontal eliminada) */}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: PANEL & CUADRO DE MANDO INTEGRAL (CMI) BOVINO                  */}
      {/* ========================================================================= */}
      {activeTab === 'panel' && (
        <div className="space-y-6">
          {/* Existencias de Hacienda por Categorías */}
          <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#2c1d11]">Existencias y Distribución del Rodeo Angus</h2>
                <p className="text-xs text-[#5c3a21]">Categorías SENASA, peso promedio, potrero actual y estado sanitario oficial</p>
              </div>
              <div className="text-xs text-[#5c3a21] font-mono tabular-nums">
                Total: <span className="font-bold text-[#2c1d11]">{totalCabezas} cabezas</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                    <th className="py-2.5 px-3">Categoría SENASA</th>
                    <th className="py-2.5 px-3 text-right">Cabezas</th>
                    <th className="py-2.5 px-3 text-right">Peso Prom. (kg)</th>
                    <th className="py-2.5 px-3 text-right">Kg Totales</th>
                    <th className="py-2.5 px-3">Potrero Asignado</th>
                    <th className="py-2.5 px-3 text-right">ADPV Objetivo</th>
                    <th className="py-2.5 px-3 text-right">ADPV Real</th>
                    <th className="py-2.5 px-3 text-center">Sanidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5ece5]">
                  {categorias.map((cat) => {
                    const kgTotales = (cat.cabezas || 0) * (cat.peso_promedio_kg || 0);
                    return (
                      <tr key={cat.id} className="hover:bg-[#fbf4ee]/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#2c1d11]">
                          {cat.categoria}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                          {cat.cabezas}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                          {cat.peso_promedio_kg} kg
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#2c1d11]">
                          {kgTotales.toLocaleString('es-AR')} kg
                        </td>
                        <td className="py-2.5 px-3 text-[#5c3a21]">
                          {cat.potrero_actual}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8c674e]">
                          {cat.adpv_objetivo_kg_dia ? `+${cat.adpv_objetivo_kg_dia.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#78350f]">
                          {cat.adpv_real_kg_dia ? `+${cat.adpv_real_kg_dia.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] font-semibold text-[#78350f]">
                            {cat.estado_sanitario}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cuadro de Mando Integral (CMI) Bovino: 4 Perspectivas */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <div className="pb-3 border-b border-[#f2e6de] mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-[#fbf4ee] text-[#78350f] rounded border border-[#e7d4c4]">
                  <Activity className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-[#2c1d11]">Cuadro de Mando Integral (CMI) · Ganadería Bovina</h2>
              </div>
              <p className="text-xs text-[#5c3a21] mt-0.5">
                Seguimiento holístico en 4 perspectivas estratégicas adaptadas a cría, invernada y cabaña
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Perspectiva Financiera */}
              <div className="p-4 bg-[#fbf4ee]/60 border border-[#e7d4c4] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">1. Financiera</span>
                  <DollarSign className="w-4 h-4 text-[#8c674e]" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Facturación Hacienda:</span>
                    <span className="font-mono tabular-nums font-bold text-[#2c1d11]">
                      ${totalFacturacionHacienda.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Margen Bruto $/kg:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#78350f]">
                      +$630 /kg producido
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Costo Ración Feedlot:</span>
                    <span className="font-mono tabular-nums text-[#2c1d11]">
                      $2.850 /cab/día
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Valuación RT 54:</span>
                    <span className="font-mono tabular-nums text-[#8c674e]">
                      VNR Hacienda Invernada
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Perspectiva Procesos Internos */}
              <div className="p-4 bg-[#fbf4ee]/60 border border-[#e7d4c4] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">2. Procesos Internos</span>
                  <Sliders className="w-4 h-4 text-[#8c674e]" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Tasa de Preñez Tacto:</span>
                    <span className="font-mono tabular-nums font-bold text-[#2c1d11]">
                      {porcentajePrenez}% <span className="text-[10px] text-[#78350f]">(Meta: &gt;85%)</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">ADPV Invernada:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#78350f]">
                      +{adpvNovillos.toFixed(2)} kg/día
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Peso al Destete (205d):</span>
                    <span className="font-mono tabular-nums text-[#2c1d11]">
                      {pesoDesteteProm} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Mortalidad Rodeo:</span>
                    <span className="font-mono tabular-nums text-[#78350f]">
                      1.2% <span className="text-[10px] text-[#8c674e]">(Estándar)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Perspectiva Clientes y Mercado */}
              <div className="p-4 bg-[#fbf4ee]/60 border border-[#e7d4c4] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">3. Mercado & Consignación</span>
                  <TrendingUp className="w-4 h-4 text-[#8c674e]" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Precio vs. MAG Cañuelas:</span>
                    <span className="font-mono tabular-nums font-bold text-[#78350f]">
                      +$30/kg sobre índice
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Rendimiento al Gancho:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#2c1d11]">
                      57.8% tipificación
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Venta Cabaña Angus:</span>
                    <span className="font-mono tabular-nums text-[#2c1d11]">
                      2 Toros P.C. colocados
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Plazo Liquidación:</span>
                    <span className="font-mono tabular-nums text-[#8c674e]">
                      14 días fecha faena
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Perspectiva Aprendizaje & Sustentabilidad */}
              <div className="p-4 bg-[#fbf4ee]/60 border border-[#e7d4c4] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">4. Sustentabilidad</span>
                  <Award className="w-4 h-4 text-[#8c674e]" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Carga Equilibrada:</span>
                    <span className="font-mono tabular-nums font-bold text-[#78350f]">
                      {cargaEVHa.toFixed(2)} EV/ha
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Cobertura Sanitaria:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#2c1d11]">
                      100% Actas Oficiales
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Uso Grano Propio UNRC:</span>
                    <span className="font-mono tabular-nums text-[#2c1d11]">
                      15.000 kg maíz transferido
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#8c674e]">Bienestar en Manga:</span>
                    <span className="font-mono tabular-nums text-[#78350f]">
                      Manejo sin picana
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: RODEO, CRÍA & CABAÑA ANGUS (TRAZABILIDAD RFID)                 */}
      {/* ========================================================================= */}
      {activeTab === 'rodeo' && (
        <div className="space-y-6">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-[#e7d4c4] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#8c674e] mr-1">Línea Productiva:</span>
              {(['TODAS', 'Carne', 'Cabaña Angus', 'Reposición'] as const).map((linea) => (
                <button
                  key={linea}
                  onClick={() => setLineaFiltro(linea)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    lineaFiltro === linea
                      ? 'bg-[#78350f] text-white'
                      : 'bg-[#fbf4ee] text-[#8c674e] hover:text-[#2c1d11]'
                  }`}
                >
                  {linea}
                </button>
              ))}

              <span className="text-xs font-semibold text-[#526b5c] ml-3 mr-1">Etapa:</span>
              {(['TODAS', 'Cría', 'Recría', 'Adaptación', 'Engorde'] as const).map((etapa) => (
                <button
                  key={etapa}
                  onClick={() => setEtapaFiltro(etapa)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    etapaFiltro === etapa
                      ? 'bg-[#1c4b31] text-white'
                      : 'bg-[#edf3ee] text-[#526b5c] hover:text-[#14281d]'
                  }`}
                >
                  {etapa}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#78a587] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por caravana o RFID..."
                value={busquedaCaravana}
                onChange={(e) => setBusquedaCaravana(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-[#14281d] placeholder-[#8ba895] focus:outline-none focus:border-[#1c4b31]"
              />
            </div>
          </div>

          {/* Tabla de Animales con Trazabilidad RFID */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#14281d]">Roster Individual de Hacienda Bovina</h2>
                <p className="text-xs text-[#526b5c]">
                  Identificación oficial por caravana y transpondedor RFID · Dimensión independiente de destino
                </p>
              </div>
              <button
                onClick={() => setShowAnimalModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Bovino</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                    <th className="py-2.5 px-3">Caravana Visual</th>
                    <th className="py-2.5 px-3 font-mono">RFID SENASA (15 dígitos)</th>
                    <th className="py-2.5 px-3">Categoría / Raza</th>
                    <th className="py-2.5 px-3">Línea de Destino</th>
                    <th className="py-2.5 px-3">Etapa Actual</th>
                    <th className="py-2.5 px-3">Potrero Asignado</th>
                    <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                    <th className="py-2.5 px-3 text-center">CC (1-9)</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ee]">
                  {animalesFiltrados.map((animal) => (
                    <tr key={animal.id} className="hover:bg-[#f8faf7] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#14281d]">
                        {animal.caravana}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#526b5c] tabular-nums">
                        {animal.caravana_rfid || 'Sin RFID'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#14281d]">{animal.categoria}</div>
                        <div className="text-[11px] text-[#526b5c]">{animal.raza} · {animal.sexo}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-semibold ${
                          animal.linea_destino === 'Cabaña Angus'
                            ? 'text-[#854d0e]'
                            : animal.linea_destino === 'Reposición'
                            ? 'text-[#1c4b31]'
                            : 'text-[#1e3a8a]'
                        }`}>
                          {animal.linea_destino || 'Sin definir'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#3d5746]">
                        {animal.etapa_actual || 'Cría'}
                      </td>
                      <td className="py-2.5 px-3 text-[#526b5c]">
                        {animal.lote_o_potrero}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                        {animal.peso_actual_kg} kg
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#526b5c]">
                        {animal.condicion_corporal || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reclasificar Línea */}
                          <select
                            value={animal.linea_destino || 'Carne'}
                            onChange={(e) => handleCambiarLineaDestino(animal, e.target.value as any)}
                            className="text-[11px] bg-white border border-[#c8d9cc] rounded px-1.5 py-0.5 text-[#14281d]"
                            title="Cambiar Línea de Destino sin alterar identidad"
                          >
                            <option value="Carne">Carne</option>
                            <option value="Cabaña Angus">Cabaña Angus</option>
                            <option value="Reposición">Reposición</option>
                          </select>
                          {/* Cambiar Etapa */}
                          <select
                            value={animal.etapa_actual || 'Cría'}
                            onChange={(e) => handleCambiarEtapa(animal, e.target.value as any)}
                            className="text-[11px] bg-white border border-[#c8d9cc] rounded px-1.5 py-0.5 text-[#14281d]"
                            title="Cambiar Etapa de Desarrollo"
                          >
                            <option value="Cría">Cría</option>
                            <option value="Recría">Recría</option>
                            <option value="Adaptación">Adaptación</option>
                            <option value="Engorde">Engorde</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {animalesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#617e6c]">
                        No se encontraron animales que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subsección: Servicios, IATF, Tacto Rectal y Destetes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tactos y Preñez */}
            <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14281d]">Subunidad Cría · Servicios & Tactos</h3>
                  <p className="text-xs text-[#526b5c]">Diagnóstico de preñez, IATF y toradas de repaso</p>
                </div>
              </div>

              <div className="space-y-3">
                {tactos.map((t) => (
                  <div key={t.id} className="p-3 bg-[#f8faf7] border border-[#e2ece4] rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#14281d]">{t.tipo}</span>
                      <span className="font-mono text-[#526b5c]">{t.fecha}</span>
                    </div>
                    <div className="text-[#526b5c]">
                      <span>{t.lote_vientres}</span>
                      <span aria-hidden="true" className="mx-1">·</span>
                      <span>{t.toro_o_semen}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#edf3ee] text-[11px]">
                      <span>Evaluadas: <strong className="font-mono">{t.cabezas_evaluadas}</strong></span>
                      <span>Preñadas: <strong className="font-mono text-[#1c4b31]">{t.cabezas_prenadas}</strong></span>
                      <span className="font-bold text-[#1c4b31] font-mono">{t.porcentaje_prenez}% preñez</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Partos y Destetes */}
            <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14281d]">Partos y Destetes Convencionales</h3>
                  <p className="text-xs text-[#526b5c]">Pesos al destete y ajuste estándar a 205 días</p>
                </div>
              </div>

              <div className="space-y-3">
                {partosDestetes.map((pd) => (
                  <div key={pd.id} className="p-3 bg-[#f8faf7] border border-[#e2ece4] rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#14281d]">{pd.tipo} · {pd.categoria}</span>
                      <span className="font-mono text-[#526b5c]">{pd.fecha}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#edf3ee] text-[11px]">
                      <span>Cabezas: <strong className="font-mono">{pd.cabezas}</strong></span>
                      <span>Peso Prom.: <strong className="font-mono text-[#14281d]">{pd.peso_promedio_kg} kg</strong></span>
                      <span>Bajas: <strong className="font-mono text-[#dc2626]">{pd.mortalidad_cabezas}</strong></span>
                    </div>
                    <p className="text-[11px] text-[#526b5c] italic">{pd.observaciones}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: MANGA DE TRABAJO & PESADAS (ADPV EN VIVO)                      */}
      {/* ========================================================================= */}
      {activeTab === 'manga' && (
        <div className="space-y-6">
          {/* Panel de Sesión de Pesada Rápida */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#e5efe7] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#14281d]">Manga de Trabajo y Balanza de Hacienda</h2>
                <p className="text-xs text-[#526b5c]">
                  Control de ganancia diaria de peso vivo (ADPV), condición corporal y decisión de cambio de lote
                </p>
              </div>
              <button
                onClick={() => setShowPesadaModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asentar Pesada en Manga</span>
              </button>
            </div>

            {/* Tarjeta de Lotes de Invernada en Seguimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {lotesEngorde.map((lote) => {
                const aumentoAcumuladoKg = lote.peso_actual_kg - lote.peso_inicial_kg;
                return (
                  <div key={lote.id} className="p-4 bg-[#fbfdfa] border border-[#e0eae2] rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-semibold text-[#617e6c] uppercase">{lote.categoria} · {lote.linea_destino || 'Carne'}</span>
                        <h4 className="text-sm font-bold text-[#14281d] mt-0.5">{lote.nombre_lote}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1c4b31]">
                        +{lote.ganancia_media_diaria_kg} kg/d
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#edf3ee]">
                      <div>
                        <span className="text-[#526b5c] block text-[11px]">Cabezas:</span>
                        <strong className="font-mono text-[#14281d]">{lote.cabezas} cab</strong>
                      </div>
                      <div>
                        <span className="text-[#526b5c] block text-[11px]">Peso Actual:</span>
                        <strong className="font-mono text-[#14281d]">{lote.peso_actual_kg} kg</strong>
                      </div>
                      <div>
                        <span className="text-[#526b5c] block text-[11px]">Días en Dieta:</span>
                        <span className="font-mono text-[#526b5c]">{lote.dias_engorde} días</span>
                      </div>
                      <div>
                        <span className="text-[#526b5c] block text-[11px]">Ganancia Total:</span>
                        <strong className="font-mono text-[#1c4b31]">+{aumentoAcumuladoKg} kg</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#526b5c] truncate pt-1">
                      Dieta: {lote.dieta_actual}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historial de Pesadas Registradas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Tropa / Caravana</th>
                    <th className="py-2.5 px-3 text-right">Peso Anterior</th>
                    <th className="py-2.5 px-3 text-right">Peso Actual</th>
                    <th className="py-2.5 px-3 text-right">Días Período</th>
                    <th className="py-2.5 px-3 text-right">ADPV Calculado</th>
                    <th className="py-2.5 px-3 text-center">Cond. Corporal</th>
                    <th className="py-2.5 px-3">Observaciones de Manga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ee]">
                  {pesadas.map((pes) => (
                    <tr key={pes.id} className="hover:bg-[#f8faf7] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#526b5c]">
                        {pes.fecha}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#14281d]">
                        {pes.lote_o_caravana}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#617e6c]">
                        {pes.peso_anterior_kg ? `${pes.peso_anterior_kg} kg` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                        {pes.peso_kg} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                        {pes.dias_periodo || '—'} d
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#1c4b31]">
                        {pes.adpv_calculado ? `+${pes.adpv_calculado.toFixed(2)} kg/d` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#526b5c]">
                        {pes.condicion_corporal || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[#526b5c] max-w-xs truncate">
                        {pes.observaciones || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: ALIMENTACIÓN, POTREROS & CARGA ANIMAL (EV/HA)                  */}
      {/* ========================================================================= */}
      {activeTab === 'alimentacion' && (
        <div className="space-y-6">
          {/* Panel de Potreros y Receptividad */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#14281d]">Potreros, Recursos Forrajeros y Carga Animal</h2>
                <p className="text-xs text-[#526b5c]">
                  Control de receptividad forrajera, balance en Equivalente Vaca (EV) y rotación de tropas
                </p>
              </div>
              <div className="text-xs text-[#526b5c] font-mono tabular-nums">
                Superficie Total: <strong className="text-[#14281d]">180 ha</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {potreros.map((pot) => {
                const sobrecarga = pot.receptividad_ev_ha > 0 && pot.carga_actual_ev_ha > pot.receptividad_ev_ha;
                return (
                  <div key={pot.id} className="p-4 bg-[#fbfdfa] border border-[#e0eae2] rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-[#14281d]">{pot.nombre}</h4>
                        <span className="text-[11px] text-[#526b5c]">{pot.tipo_recurso}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#14281d]">
                        {pot.superficie_ha} ha
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs pt-2 border-t border-[#edf3ee]">
                      <div className="flex justify-between">
                        <span className="text-[#526b5c]">Cabezas Asignadas:</span>
                        <strong className="font-mono text-[#14281d]">{pot.cabezas_asignadas} cab</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#526b5c]">EV Total Asignado:</span>
                        <span className="font-mono text-[#14281d]">{pot.ev_actual_total} EV</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#526b5c]">Carga Actual vs. Óptima:</span>
                        <span className={`font-mono font-bold ${sobrecarga ? 'text-[#b45309]' : 'text-[#1c4b31]'}`}>
                          {pot.carga_actual_ev_ha.toFixed(2)} / {pot.receptividad_ev_ha.toFixed(2)} EV/ha
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#526b5c]">Estado Empastada:</span>
                        <span className="text-[11px] font-semibold text-[#14281d]">{pot.estado_pastura}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#526b5c] italic border-t border-[#edf3ee] pt-2">
                      {pot.observaciones}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raciones y Dietas Nutricionales */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <div className="pb-3 border-b border-[#e5efe7] mb-4">
              <h3 className="text-base font-bold text-[#14281d]">Formulaciones Nutricionales y Costos Diarios</h3>
              <p className="text-xs text-[#526b5c]">
                Dietas adaptadas para recría pastoril con suplementación, feedlot rápido y preparación de reproductores
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dietas.map((dta) => (
                <div key={dta.id} className="p-4 bg-[#f8faf7] border border-[#e2ece4] rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-semibold text-[#617e6c] uppercase">{dta.etapa_destino}</span>
                      <h4 className="text-sm font-bold text-[#14281d] mt-0.5">{dta.nombre}</h4>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-[#edf3ee]">
                    <div className="flex justify-between">
                      <span className="text-[#526b5c]">Consumo MS:</span>
                      <strong className="font-mono text-[#14281d]">{dta.kg_ms_dia_cab} kg MS/cab/d</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#526b5c]">ADPV Esperado:</span>
                      <span className="font-mono font-bold text-[#1c4b31]">+{dta.adpv_esperado_kg_dia} kg/día</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[#526b5c]">Costo Diario:</span>
                      <span className="font-mono font-bold text-[#14281d]">
                        ${dta.costo_estimado_cab_dia.toLocaleString('es-AR')} /cab/d
                      </span>
                    </div>
                  </div>

                  {/* Ingredientes de la Ración */}
                  <div className="pt-2 border-t border-[#edf3ee] space-y-1">
                    <span className="text-[11px] font-semibold text-[#526b5c] block">Composición de la Dieta:</span>
                    {dta.ingredientes.map((ing, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-[#526b5c]">
                        <span>• {ing.insumo}</span>
                        <span className="font-mono">{ing.porcentaje_ms}% ({ing.kg_dia_cab} kg)</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#526b5c] italic pt-1">
                    {dta.observaciones}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 5: DECISIÓN DE VENTA, SIMULADOR INCREMENTAL & MAG CAÑUELAS         */}
      {/* ========================================================================= */}
      {activeTab === 'ventas' && (
        <div className="space-y-6">
          {/* SIMULADOR DE MARGEN INCREMENTAL (RETENCIÓN VS VENTA INMEDIATA) */}
          <div className="bg-white border border-[#bcdbc2] rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e5efe7] mb-4">
              <span className="p-1.5 bg-[#eaf4ec] text-[#1c4b31] rounded-lg">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#14281d]">
                  Simulador de Margen Incremental de Retención vs. Venta Inmediata
                </h2>
                <p className="text-xs text-[#526b5c]">
                  Herramienta de decisión técnica: evalúa la rentabilidad de retener la tropa X días adicionales versus vender hoy en el MAG
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs del Modelo de Decisión */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#526b5c] mb-1">Peso Actual Tropa (kg)</label>
                    <input
                      type="number"
                      value={simPesoActual}
                      onChange={(e) => setSimPesoActual(Number(e.target.value))}
                      className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-mono font-bold"
                    />
                    <span className="text-[10px] text-[#617e6c]">Balanza de campo</span>
                  </div>

                  <div>
                    <label className="block font-medium text-[#526b5c] mb-1">Precio Actual MAG ($/kg)</label>
                    <input
                      type="number"
                      value={simPrecioActual}
                      onChange={(e) => setSimPrecioActual(Number(e.target.value))}
                      className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-mono font-bold"
                    />
                    <span className="text-[10px] text-[#617e6c]">Cotización vigente Cañuelas</span>
                  </div>

                  <div>
                    <label className="block font-medium text-[#526b5c] mb-1">ADPV Esperado (kg/d)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={simAdpvEsperado}
                      onChange={(e) => setSimAdpvEsperado(Number(e.target.value))}
                      className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-mono font-bold text-[#1c4b31]"
                    />
                    <span className="text-[10px] text-[#8c674e]">Ganancia diaria con dieta</span>
                  </div>

                  <div>
                    <label className="block font-medium text-[#5c3a21] mb-1">Días de Retención</label>
                    <input
                      type="number"
                      value={simDiasRetencion}
                      onChange={(e) => setSimDiasRetencion(Number(e.target.value))}
                      className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    />
                    <span className="text-[10px] text-[#8c674e]">Período de engorde extra</span>
                  </div>

                  <div>
                    <label className="block font-medium text-[#5c3a21] mb-1">Costo Diario ($/cab/d)</label>
                    <input
                      type="number"
                      value={simCostoDiarioCab}
                      onChange={(e) => setSimCostoDiarioCab(Number(e.target.value))}
                      className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    />
                    <span className="text-[10px] text-[#8c674e]">Alimento + estructura</span>
                  </div>

                  <div>
                    <label className="block font-medium text-[#5c3a21] mb-1">Precio Proyectado ($/kg)</label>
                    <input
                      type="number"
                      value={simPrecioTermino}
                      onChange={(e) => setSimPrecioTermino(Number(e.target.value))}
                      className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    />
                    <span className="text-[10px] text-[#8c674e]">Expectativa a término</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-semibold text-[#5c3a21]">Cabezas en la Tropa a evaluar:</label>
                  <input
                    type="number"
                    value={simCabezasTropa}
                    onChange={(e) => setSimCabezasTropa(Number(e.target.value))}
                    className="w-24 border border-[#e7d4c4] rounded-lg px-2 py-1 bg-[#fbf4ee] text-xs font-mono font-bold text-[#2c1d11]"
                  />
                </div>
              </div>

              {/* Dictamen Económico de Salida */}
              <div className="lg:col-span-5 p-4 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8c674e]">Dictamen de Rentabilidad</span>
                    <span className={`text-xs font-bold ${simResultado.esConveniente ? 'text-[#78350f]' : 'text-[#dc2626]'}`}>
                      {simResultado.esConveniente ? '✓ RECOMENDACIÓN: RETENER' : '⚠️ VENTA INMEDIATA'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[#5c3a21]">Peso proyectado a término:</span>
                      <strong className="font-mono text-sm text-[#2c1d11]">
                        {simResultado.pesoFinal} kg (+{simResultado.aumentoKg} kg)
                      </strong>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[#5c3a21]">Ingreso Venta Hoy:</span>
                      <span className="font-mono text-[#5c3a21]">
                        ${Math.round(simResultado.ingresoHoyPorCab).toLocaleString('es-AR')} /cab
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[#5c3a21]">Ingreso Venta Proyectada:</span>
                      <span className="font-mono text-[#2c1d11] font-semibold">
                        ${Math.round(simResultado.ingresoTerminoPorCab).toLocaleString('es-AR')} /cab
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-[#5c3a21]">Costo alimentación período:</span>
                      <span className="font-mono text-[#dc2626]">
                        -${Math.round(simResultado.costoAlimentacionPorCab).toLocaleString('es-AR')} /cab
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-[#e7d4c4]">
                      <span className="font-bold text-[#2c1d11]">Margen Incremental por Cab:</span>
                      <span className={`font-mono text-base font-bold ${simResultado.margenIncrementalPorCab >= 0 ? 'text-[#78350f]' : 'text-[#dc2626]'}`}>
                        {simResultado.margenIncrementalPorCab >= 0 ? '+' : ''}${Math.round(simResultado.margenIncrementalPorCab).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline bg-[#fbf4ee] p-2 rounded-lg border border-[#e7d4c4]">
                      <span className="font-bold text-[#78350f] text-xs">Margen Total Tropa ({simCabezasTropa} cab):</span>
                      <span className="font-mono text-base font-bold text-[#78350f]">
                        {simResultado.margenIncrementalTropa >= 0 ? '+' : ''}${Math.round(simResultado.margenIncrementalTropa).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#5c3a21]">
                  Costo de producir el kg adicional: <strong className="font-mono text-[#2c1d11]">${simResultado.costoPorKgProducido}/kg</strong> (vs. venta a ${simPrecioTermino}/kg).
                </div>
              </div>
            </div>
          </div>

          {/* Liquidaciones de Venta Oficiales */}
          <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2e6de] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#2c1d11]">Liquidaciones de Ventas de Hacienda & Reproductores</h3>
                <p className="text-xs text-[#5c3a21]">Registro con DTE SENASA, Guía Policial, comisiones de consignatario y flete</p>
              </div>
              <button
                onClick={() => setShowVentaModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Liquidación de Venta</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#f2e6de] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                    <th className="py-2.5 px-3">Fecha / DTE</th>
                    <th className="py-2.5 px-3">Destino Comercial</th>
                    <th className="py-2.5 px-3">Comprador / Consignatario</th>
                    <th className="py-2.5 px-3 text-right">Cabezas</th>
                    <th className="py-2.5 px-3 text-right">Kg Totales</th>
                    <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                    <th className="py-2.5 px-3 text-right">Gastos & Flete</th>
                    <th className="py-2.5 px-3 text-right">Neto Liquidado</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5ece5]">
                  {ventas.map((vta) => (
                    <tr key={vta.id} className="hover:bg-[#fbf4ee] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[#2c1d11] font-bold">{vta.fecha}</div>
                        <div className="text-[10px] text-[#5c3a21] font-mono">{vta.dte_numero}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#2c1d11]">{vta.tipo_venta}</div>
                        <div className="text-[11px] text-[#5c3a21]">{vta.categoria}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">
                        {vta.comprador_o_consignatario}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                        {vta.cabezas}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                        {vta.kg_vivos_totales ? `${vta.kg_vivos_totales.toLocaleString('es-AR')} kg` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#78350f]">
                        ${vta.precio_unitario.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#dc2626]">
                        -${((vta.gastos_comerciales_total || 0) + (vta.flete_total || 0)).toLocaleString('es-AR')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                        ${vta.importe_neto_liquidado.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] font-semibold text-[#78350f]">
                          {vta.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 6: SANIDAD OFICIAL SENASA                                         */}
      {/* ========================================================================= */}
      {activeTab === 'sanidad' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2e6de] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#2c1d11]">Libreta Sanitaria Bovina · Planes Oficiales SENASA</h2>
                <p className="text-xs text-[#5c3a21]">
                  Campañas obligatorias de Fiebre Aftosa, Carbunclo bacteridiano, Brucelosis (Cepa 19) y raspaje de reproductores
                </p>
              </div>
              <button
                onClick={() => setShowSanidadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asentar Evento Sanitario</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#f2e6de] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Plan / Evento Oficial</th>
                    <th className="py-2.5 px-3 text-right">Cabezas Tratadas</th>
                    <th className="py-2.5 px-3">Biológico / Producto</th>
                    <th className="py-2.5 px-3">Acta Oficial SENASA</th>
                    <th className="py-2.5 px-3">Veterinario Actuante</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5ece5]">
                  {sanidad.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#fbf4ee] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#5c3a21]">
                        {ev.fecha}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#2c1d11]">
                        {ev.tipo_evento}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#78350f]">
                        {ev.cabezas_tratadas} cab
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">
                        {ev.producto_aplicado}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#5c3a21]">
                        {ev.certificado_senasa_nro || 'Oficial'}
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">
                        {ev.responsable}
                      </td>
                      <td className="py-2.5 px-3 text-[#5c3a21] max-w-xs truncate">
                        {ev.observaciones || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES INTERACTIVOS (CON MANEJADORES DE GUARDADO COMPLETOS)              */}
      {/* ========================================================================= */}

      {/* 1. Modal Nuevo Bovino / Caravana RFID */}
      {showAnimalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-[#e7d4c4]">
            <div className="flex justify-between items-center pb-3 border-b border-[#f2e6de] mb-4">
              <h3 className="text-sm font-bold text-[#2c1d11]">Alta Individual de Hacienda Angus</h3>
              <button
                onClick={() => setShowAnimalModal(false)}
                className="text-[#8c674e] hover:text-[#2c1d11] text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGuardarAnimal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Caravana Visual</label>
                  <input
                    type="text"
                    value={animalForm.caravana}
                    onChange={(e) => setAnimalForm({ ...animalForm, caravana: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">RFID SENASA (15 dígitos)</label>
                  <input
                    type="text"
                    value={animalForm.caravana_rfid}
                    onChange={(e) => setAnimalForm({ ...animalForm, caravana_rfid: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Categoría</label>
                  <select
                    value={animalForm.categoria}
                    onChange={(e) => setAnimalForm({ ...animalForm, categoria: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  >
                    <option value="Novillito">Novillito</option>
                    <option value="Novillo">Novillo</option>
                    <option value="Vaquillona">Vaquillona</option>
                    <option value="Vaca de Cría">Vaca de Cría</option>
                    <option value="Toro">Toro</option>
                    <option value="Ternero">Ternero</option>
                    <option value="Ternera">Ternera</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Sexo</label>
                  <select
                    value={animalForm.sexo}
                    onChange={(e) => setAnimalForm({ ...animalForm, sexo: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Raza</label>
                  <input
                    type="text"
                    value={animalForm.raza}
                    onChange={(e) => setAnimalForm({ ...animalForm, raza: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Línea de Destino</label>
                  <select
                    value={animalForm.linea_destino}
                    onChange={(e) => setAnimalForm({ ...animalForm, linea_destino: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-semibold"
                  >
                    <option value="Carne">Producción de Carne</option>
                    <option value="Cabaña Angus">Cabaña Angus (Pedigree/PC)</option>
                    <option value="Reposición">Reposición Propia</option>
                    <option value="Sin definir">Sin definir</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Etapa de Desarrollo</label>
                  <select
                    value={animalForm.etapa_actual}
                    onChange={(e) => setAnimalForm({ ...animalForm, etapa_actual: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  >
                    <option value="Cría">Cría</option>
                    <option value="Recría">Recría Pastoril</option>
                    <option value="Adaptación">Adaptación</option>
                    <option value="Engorde">Engorde / Feedlot</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    value={animalForm.peso_actual_kg}
                    onChange={(e) => setAnimalForm({ ...animalForm, peso_actual_kg: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Cond. Corporal (1-9)</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    step="0.5"
                    value={animalForm.condicion_corporal}
                    onChange={(e) => setAnimalForm({ ...animalForm, condicion_corporal: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Potrero / Lote</label>
                  <input
                    type="text"
                    value={animalForm.lote_o_potrero}
                    onChange={(e) => setAnimalForm({ ...animalForm, lote_o_potrero: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowAnimalModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5c3a21] hover:bg-[#fbf4ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Bovino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Asentar Pesada en Manga */}
      {showPesadaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-[#e7d4c4]">
            <div className="flex justify-between items-center pb-3 border-b border-[#f2e6de] mb-4">
              <h3 className="text-sm font-bold text-[#2c1d11]">Asentar Pesada en Manga de Balanza</h3>
              <button
                onClick={() => setShowPesadaModal(false)}
                className="text-[#8c674e] hover:text-[#2c1d11] text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGuardarPesada} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Tropa o Caravana</label>
                <input
                  type="text"
                  value={pesadaForm.lote_o_caravana}
                  onChange={(e) => setPesadaForm({ ...pesadaForm, lote_o_caravana: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={pesadaForm.fecha}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, fecha: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Días de Intervalo</label>
                  <input
                    type="number"
                    value={pesadaForm.dias_periodo}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, dias_periodo: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Peso Anterior (kg)</label>
                  <input
                    type="number"
                    value={pesadaForm.peso_anterior_kg}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, peso_anterior_kg: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Peso Actual (kg)</label>
                  <input
                    type="number"
                    value={pesadaForm.peso_kg}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, peso_kg: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold text-[#78350f]"
                    required
                  />
                </div>
              </div>

              {/* Cálculo en vivo de ADPV */}
              <div className="p-2.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-[#78350f]">ADPV Resultante:</span>
                <span className="font-mono font-bold text-base text-[#78350f]">
                  +{adpvPesadaCalculado} kg/cab/día
                </span>
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Condición Corporal (1 a 9)</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  step="0.5"
                  value={pesadaForm.condicion_corporal}
                  onChange={(e) => setPesadaForm({ ...pesadaForm, condicion_corporal: Number(e.target.value) })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Observaciones</label>
                <input
                  type="text"
                  value={pesadaForm.observaciones}
                  onChange={(e) => setPesadaForm({ ...pesadaForm, observaciones: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowPesadaModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5c3a21] hover:bg-[#fbf4ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Pesada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Nueva Liquidación de Venta */}
      {showVentaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-[#e7d4c4]">
            <div className="flex justify-between items-center pb-3 border-b border-[#f2e6de] mb-4">
              <h3 className="text-sm font-bold text-[#2c1d11]">Nueva Liquidación de Venta de Hacienda</h3>
              <button
                onClick={() => setShowVentaModal(false)}
                className="text-[#8c674e] hover:text-[#2c1d11] text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGuardarVenta} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Fecha de Operación</label>
                  <input
                    type="date"
                    value={ventaForm.fecha}
                    onChange={(e) => setVentaForm({ ...ventaForm, fecha: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Tipo de Venta</label>
                  <select
                    value={ventaForm.tipo_venta}
                    onChange={(e) => setVentaForm({ ...ventaForm, tipo_venta: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-semibold"
                  >
                    <option value="Invernada / Faena">Invernada / Faena (Consumo/Exportación)</option>
                    <option value="Cabaña (Reproductores)">Cabaña Angus (Reproductores P.C.)</option>
                    <option value="Vaca Conserva / Descarte">Vaca Conserva / Descarte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Comprador o Consignatario</label>
                <input
                  type="text"
                  value={ventaForm.comprador_o_consignatario}
                  onChange={(e) => setVentaForm({ ...ventaForm, comprador_o_consignatario: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Cabezas</label>
                  <input
                    type="number"
                    value={ventaForm.cabezas}
                    onChange={(e) => setVentaForm({ ...ventaForm, cabezas: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Peso Promedio (kg)</label>
                  <input
                    type="number"
                    value={ventaForm.peso_promedio_kg}
                    onChange={(e) => setVentaForm({ ...ventaForm, peso_promedio_kg: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Precio ($/kg o $/cab)</label>
                  <input
                    type="number"
                    value={ventaForm.precio_unitario}
                    onChange={(e) => setVentaForm({ ...ventaForm, precio_unitario: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold text-[#78350f]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">DTE SENASA N°</label>
                  <input
                    type="text"
                    value={ventaForm.dte_numero}
                    onChange={(e) => setVentaForm({ ...ventaForm, dte_numero: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Flete Total ($)</label>
                  <input
                    type="number"
                    value={ventaForm.flete_total}
                    onChange={(e) => setVentaForm({ ...ventaForm, flete_total: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowVentaModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5c3a21] hover:bg-[#fbf4ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Evento Sanitario SENASA */}
      {showSanidadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-[#e7d4c4]">
            <div className="flex justify-between items-center pb-3 border-b border-[#f2e6de] mb-4">
              <h3 className="text-sm font-bold text-[#2c1d11]">Asentar Evento Sanitario Oficial SENASA</h3>
              <button
                onClick={() => setShowSanidadModal(false)}
                className="text-[#8c674e] hover:text-[#2c1d11] text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGuardarSanidad} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Plan Oficial</label>
                  <select
                    value={sanidadForm.tipo_evento}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, tipo_evento: e.target.value as any })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  >
                    <option value="Vacunación Aftosa">Vacunación Fiebre Aftosa</option>
                    <option value="Vacunación Carbunclo">Vacunación Carbunclo</option>
                    <option value="Brucelosis">Brucelosis (Cepa 19)</option>
                    <option value="Desparasitación">Desparasitación Estratégica</option>
                    <option value="Tactores / Raspajes">Raspaje Venéreo Toros</option>
                    <option value="Otro">Otro Tratamiento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={sanidadForm.fecha}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, fecha: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Cabezas Tratadas</label>
                  <input
                    type="number"
                    value={sanidadForm.cabezas_tratadas}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, cabezas_tratadas: Number(e.target.value) })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#5c3a21] mb-1">Acta SENASA N°</label>
                  <input
                    type="text"
                    value={sanidadForm.certificado_senasa_nro}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, certificado_senasa_nro: e.target.value })}
                    className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Producto / Biológico</label>
                <input
                  type="text"
                  value={sanidadForm.producto_aplicado}
                  onChange={(e) => setSanidadForm({ ...sanidadForm, producto_aplicado: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Veterinario Responsable</label>
                <input
                  type="text"
                  value={sanidadForm.responsable}
                  onChange={(e) => setSanidadForm({ ...sanidadForm, responsable: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#5c3a21] mb-1">Observaciones</label>
                <input
                  type="text"
                  value={sanidadForm.observaciones}
                  onChange={(e) => setSanidadForm({ ...sanidadForm, observaciones: e.target.value })}
                  className="w-full border border-[#e7d4c4] rounded-lg p-2 bg-[#fbf4ee] text-[#2c1d11]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowSanidadModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#5c3a21] hover:bg-[#fbf4ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Sanidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
