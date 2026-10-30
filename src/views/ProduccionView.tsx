/**
 * @file ProduccionView.tsx
 * @description Módulo de Producción Porcina Reorganizado: Cría y Destete Independientes
 * Establecimiento Agropecuario Pozo del Carril · La Aguada
 * UNRC - FCE - Taller de Práctica Profesional II
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  ArrowRight, 
  GitFork, 
  Check, 
  X, 
  AlertTriangle, 
  Scale, 
  CheckCircle2, 
  Sparkles, 
  Baby, 
  MoveRight, 
  Activity, 
  HeartHandshake, 
  FileText, 
  XCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import { 
  BaseDatosPorcina, 
  Parto, 
  MovimientoFisico, 
  LoteAnimales, 
  Usuario 
} from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { BadgeOrigin } from '../components/BadgeOrigin';
import { getRolePermissions } from '../lib/permissions';
import { RowActions } from '../components/RowActions';
import { RecordDetailModal } from '../components/RecordDetailModal';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onConfirmRecord: (table: keyof BaseDatosPorcina, id: string) => Promise<any>;
  onCancelRecord: (table: keyof BaseDatosPorcina, id: string, motivo: string) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
}

type TabProduccion = 'cria' | 'destete' | 'pases' | 'lotes';

export const ProduccionView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onConfirmRecord,
  onCancelRecord,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const [activeTab, setActiveTab] = useState<TabProduccion>('cria');

  // Campaña por defecto activa
  const campanaActiva = useMemo(() => {
    const act = (db.D_Campana || []).find(c => c.activo || c.estado === 'Abierto');
    return act?.id || 'CAMP_2024_2025';
  }, [db.D_Campana]);

  // ---------------------------------------------------------------------------
  // FILTROS PARA CRÍA
  // ---------------------------------------------------------------------------
  const [filtroCriaBusqueda, setFiltroCriaBusqueda] = useState('');
  const [filtroCriaMadre, setFiltroCriaMadre] = useState('TODAS');
  const [filtroCriaCampana, setFiltroCriaCampana] = useState('TODAS');
  const [filtroCriaFechaDesde, setFiltroCriaFechaDesde] = useState('');
  const [filtroCriaFechaHasta, setFiltroCriaFechaHasta] = useState('');

  // ---------------------------------------------------------------------------
  // FILTROS PARA DESTETE
  // ---------------------------------------------------------------------------
  const [filtroDesteteBusqueda, setFiltroDesteteBusqueda] = useState('');
  const [filtroDesteteCampana, setFiltroDesteteCampana] = useState('TODAS');
  const [filtroDesteteFechaDesde, setFiltroDesteteFechaDesde] = useState('');
  const [filtroDesteteFechaHasta, setFiltroDesteteFechaHasta] = useState('');

  // ---------------------------------------------------------------------------
  // MODALES Y EDICIÓN (FASE A BLOQUE 3)
  // ---------------------------------------------------------------------------
  const [showPartoModal, setShowPartoModal] = useState(false);
  const [editingPartoId, setEditingPartoId] = useState<string | null>(null);
  const [showDesteteModal, setShowDesteteModal] = useState(false);
  const [showNovedadModal, setShowNovedadModal] = useState(false);
  const [showPaseModal, setShowPaseModal] = useState(false);
  const [selectedPartoParaNovedad, setSelectedPartoParaNovedad] = useState<Parto | null>(null);
  const [detailRecord, setDetailRecord] = useState<{ record: any; tableName: string; unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS'; title: string } | null>(null);

  // ---------------------------------------------------------------------------
  // ESTADO FORMULARIO DE PARTO (CRÍA)
  // ---------------------------------------------------------------------------
  const [formParto, setFormParto] = useState<{
    madre_id: string;
    lote_generado_id: string;
    padrillo_id: string;
    fecha_parto: string;
    nacidos_vivos: number;
    nacidos_muertos: number;
    bajas_lactancia: number;
    campana_id: string;
    observaciones: string;
  }>({
    madre_id: '',
    lote_generado_id: '',
    padrillo_id: '',
    fecha_parto: new Date().toISOString().split('T')[0],
    nacidos_vivos: 11,
    nacidos_muertos: 0,
    bajas_lactancia: 0,
    campana_id: campanaActiva,
    observaciones: ''
  });

  // ---------------------------------------------------------------------------
  // ESTADO FORMULARIO DE DESTETE
  // ---------------------------------------------------------------------------
  const [formDestete, setFormDestete] = useState<{
    lote_cria_id: string;
    fecha_destete: string;
    destetados: number;
    peso_promedio_destete: number;
    lote_destino_id: string;
    observaciones: string;
  }>({
    lote_cria_id: '',
    fecha_destete: new Date().toISOString().split('T')[0],
    destetados: 10,
    peso_promedio_destete: 8.5,
    lote_destino_id: '',
    observaciones: ''
  });

  // ---------------------------------------------------------------------------
  // ESTADO FORMULARIO DE NOVEDAD LACTANCIA (BAJAS O ADOPCIONES/TRANSFERENCIAS)
  // ---------------------------------------------------------------------------
  const [formNovedad, setFormNovedad] = useState<{
    parto_id: string;
    tipo: 'BAJA' | 'TRANSFERENCIA';
    cantidad: number;
    fecha: string;
    motivo: string;
    lote_destino_transferencia: string;
  }>({
    parto_id: '',
    tipo: 'BAJA',
    cantidad: 1,
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'Aplastamiento en paridera',
    lote_destino_transferencia: ''
  });

  // ---------------------------------------------------------------------------
  // ESTADO FORMULARIO DE PASE DE FASE GENERAL
  // ---------------------------------------------------------------------------
  const [formPase, setFormPase] = useState<{
    lote_id: string;
    tipo_evento: 'PASE_FASE' | 'MUERTE' | 'DESCARTE' | 'AJUSTE';
    fase_origen_id: string;
    fase_destino_id: string;
    cantidad_cabezas: number;
    kg_totales: number;
    motivo: string;
    autorizar_excepcion: boolean;
  }>({
    lote_id: '',
    tipo_evento: 'PASE_FASE',
    fase_origen_id: 'FASE_DESTETE_REC',
    fase_destino_id: 'FASE_ENGORDE_TERM',
    cantidad_cabezas: 10,
    kg_totales: 320,
    motivo: '',
    autorizar_excepcion: false
  });

  // ---------------------------------------------------------------------------
  // SUGERIR CÓDIGO DE LOTE ÚNICO AL CAMBIAR MADRE O FECHA EN PARTO
  // ---------------------------------------------------------------------------
  const handleMadreOrFechaChange = (madre: string, fecha: string) => {
    const cleanMadre = madre.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'MADRE';
    const cleanFecha = (fecha || '').replace(/-/g, '');
    const autoId = `LOTE_CRIA_${cleanMadre}_${cleanFecha}`;
    setFormParto(prev => ({
      ...prev,
      madre_id: madre,
      fecha_parto: fecha,
      lote_generado_id: prev.lote_generado_id && prev.lote_generado_id !== autoId && !prev.lote_generado_id.startsWith('LOTE_CRIA_') 
        ? prev.lote_generado_id 
        : autoId
    }));
  };

  // ---------------------------------------------------------------------------
  // MANEJO DE SELECCIÓN DE LOTE EN DESTETE
  // Recupera automáticamente madre, fecha nacimiento/parto y cantidad disponible
  // ---------------------------------------------------------------------------
  const infoLoteSeleccionadoDestete = useMemo(() => {
    if (!formDestete.lote_cria_id) return null;
    const parto = db.Partos?.find(p => 
      p.lote_generado_id === formDestete.lote_cria_id || 
      p.id === formDestete.lote_cria_id
    );
    const lote = db.Lotes_Animales?.find(l => 
      l.id === formDestete.lote_cria_id || 
      l.codigo_lote === formDestete.lote_cria_id
    );

    if (!parto && !lote) return null;

    const madreId = parto?.madre_id || lote?.origen || 'No identificada';
    const fechaParto = parto?.fecha_parto || lote?.fecha_formacion || '2024-01-01';
    const nacidosVivos = Number(parto?.nacidos_vivos) || Number(lote?.cabezas_actuales) || 0;
    const bajasLactancia = Number(parto?.bajas_lactancia) || 0;
    const adopciones = Number(parto?.adopciones_transferencias) || 0;
    const destetadosPrevios = Number(parto?.destetados) || 0;

    // Cantidad efectivamente disponible para destetar
    const cantidadDisponible = Math.max(0, nacidosVivos - bajasLactancia + adopciones - destetadosPrevios);

    // Días de lactancia transcurridos
    const dParto = new Date(fechaParto).getTime();
    const dDestete = new Date(formDestete.fecha_destete || new Date().toISOString().split('T')[0]).getTime();
    const diasLactancia = Math.max(1, Math.round((dDestete - dParto) / (1000 * 60 * 60 * 24)));

    // Ganancia diaria calculada en lactancia: (peso final destete - 1.40 kg nacer) / dias
    const pDestete = Number(formDestete.peso_promedio_destete) || 8.5;
    const gdpLactancia = diasLactancia > 0 ? ((pDestete - 1.40) / diasLactancia).toFixed(2) : '0.00';

    return {
      parto,
      lote,
      madreId,
      fechaParto,
      nacidosVivos,
      bajasLactancia,
      adopciones,
      destetadosPrevios,
      cantidadDisponible,
      diasLactancia,
      gdpLactancia
    };
  }, [formDestete.lote_cria_id, formDestete.fecha_destete, formDestete.peso_promedio_destete, db.Partos, db.Lotes_Animales]);

  // Al seleccionar lote en destete, auto-rellenar cantidad disponible y sugerir lote recría
  const handleSelectLoteCriaParaDestete = (loteCriaId: string) => {
    const parto = db.Partos?.find(p => p.lote_generado_id === loteCriaId || p.id === loteCriaId);
    const lote = db.Lotes_Animales?.find(l => l.id === loteCriaId || l.codigo_lote === loteCriaId);
    
    let disp = 10;
    if (parto) {
      const nac = Number(parto.nacidos_vivos) || 0;
      const baj = Number(parto.bajas_lactancia) || 0;
      const adop = Number(parto.adopciones_transferencias) || 0;
      const dest = Number(parto.destetados) || 0;
      disp = Math.max(1, nac - baj + adop - dest);
    } else if (lote) {
      disp = Number(lote.cabezas_actuales) || 10;
    }

    const clean = loteCriaId.replace('LOTE_CRIA_', '');
    const suggestedRecria = `LOTE_REC_${clean}`;

    setFormDestete(prev => ({
      ...prev,
      lote_cria_id: loteCriaId,
      destetados: disp,
      lote_destino_id: suggestedRecria
    }));
  };

  // ---------------------------------------------------------------------------
  // GUARDAR PARTO (CRÍA)
  // ---------------------------------------------------------------------------
  const handleGuardarParto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParto.madre_id.trim()) {
      alert('Debe identificar la cerda madre (número de caravana o código).');
      return;
    }
    if (!formParto.lote_generado_id.trim()) {
      alert('Debe asignar un identificador de lote único.');
      return;
    }
    if (Number(formParto.nacidos_vivos) <= 0) {
      alert('La cantidad de nacidos vivos debe ser mayor a 0.');
      return;
    }

    // Validación: impedir duplicación de identificadores de lote
    const loteExistente = db.Lotes_Animales?.find(l => 
      l.codigo_lote.toLowerCase() === formParto.lote_generado_id.trim().toLowerCase()
    );
    if (loteExistente) {
      alert(`El identificador de lote "${formParto.lote_generado_id}" ya existe en el sistema. Ingrese un código único.`);
      return;
    }

    const isOperario = permissions.rolId === 'ROL_OPERARIO';
    const cabezasVivas = Number(formParto.nacidos_vivos);
    const bajasIniciales = Number(formParto.bajas_lactancia) || 0;
    const cabezasActuales = Math.max(0, cabezasVivas - bajasIniciales);

    // MODO EDICIÓN ADMINISTRATIVA (FASE A BLOQUE 3)
    if (editingPartoId) {
      const existingParto = (db.Partos || []).find(p => p.id === editingPartoId);
      if (existingParto) {
        const updatedParto: Parto = {
          ...existingParto,
          madre_id: formParto.madre_id.trim(),
          padrillo_id: formParto.padrillo_id.trim() || undefined,
          fecha_parto: formParto.fecha_parto,
          nacidos_vivos: cabezasVivas,
          nacidos_muertos: Number(formParto.nacidos_muertos) || 0,
          bajas_lactancia: bajasIniciales,
          observaciones: formParto.observaciones.trim() || undefined
        };
        await onSaveRecord('Partos', updatedParto);
        setEditingPartoId(null);
        setShowPartoModal(false);
        setFormParto({
          madre_id: '',
          lote_generado_id: '',
          padrillo_id: '',
          fecha_parto: new Date().toISOString().split('T')[0],
          nacidos_vivos: 11,
          nacidos_muertos: 0,
          bajas_lactancia: 0,
          campana_id: campanaActiva,
          observaciones: ''
        });
        return;
      }
    }

    // 1. Guardar Parto nuevo en tabla Partos
    const nuevoParto: Partial<Parto> = {
      id: `PAR_${Date.now()}`,
      madre_id: formParto.madre_id.trim(),
      padrillo_id: formParto.padrillo_id.trim() || undefined,
      fecha_parto: formParto.fecha_parto,
      nacidos_vivos: cabezasVivas,
      nacidos_muertos: Number(formParto.nacidos_muertos) || 0,
      bajas_lactancia: bajasIniciales,
      destetados: 0,
      lote_generado_id: formParto.lote_generado_id.trim(),
      campana_id: formParto.campana_id || campanaActiva,
      observaciones: formParto.observaciones.trim() || undefined,
      estado: isOperario ? 'Borrador' : 'Confirmado',
      origen_dato: 'REAL'
    };
    await onSaveRecord('Partos', nuevoParto);

    // 2. Crear Lote en Lotes_Animales
    const nuevoLote: Partial<LoteAnimales> = {
      id: formParto.lote_generado_id.trim(),
      codigo_lote: formParto.lote_generado_id.trim(),
      fecha_formacion: formParto.fecha_parto,
      origen: `Parto Madre ${formParto.madre_id.trim()} (${cabezasVivas} nacidos vivos)`,
      fase_actual_id: 'FASE_CRIA',
      subunidad_id: 'SUB_CRIA',
      sector_fisico_id: 'SEC_PARIDERAS_CAMPO',
      cabezas_actuales: cabezasActuales,
      kg_actuales: Number((cabezasActuales * 1.4).toFixed(2)),
      estado: 'Activo'
    };
    await onSaveRecord('Lotes_Animales', nuevoLote);

    // 3. Registrar Movimiento Físico de Nacimiento
    await onSaveRecord('Movimientos_Fisicos', {
      id: `MF_NAC_${Date.now()}`,
      fecha: formParto.fecha_parto,
      tipo_evento: 'NACIMIENTO',
      lote_id: formParto.lote_generado_id.trim(),
      madre_id: formParto.madre_id.trim(),
      cantidad_cabezas: cabezasVivas,
      kg_totales: Number((cabezasVivas * 1.4).toFixed(2)),
      fase_destino_id: 'FASE_CRIA',
      sector_destino_id: 'SEC_PARIDERAS_CAMPO',
      categoria_senasa_id: 'CAT_LECHON',
      motivo: `Nacimiento camada madre ${formParto.madre_id.trim()}`,
      estado: isOperario ? 'Borrador' : 'Confirmado',
      origen_dato: 'REAL',
      creado_por: currentUser?.usuario || 'usuario',
      fecha_creacion: new Date().toISOString().split('T')[0]
    });

    setShowPartoModal(false);
    // Limpiar formulario
    setFormParto({
      madre_id: '',
      lote_generado_id: '',
      padrillo_id: '',
      fecha_parto: new Date().toISOString().split('T')[0],
      nacidos_vivos: 11,
      nacidos_muertos: 0,
      bajas_lactancia: 0,
      campana_id: campanaActiva,
      observaciones: ''
    });
  };

  // ---------------------------------------------------------------------------
  // GUARDAR DESTETE
  // Transición de cría a destete/recría
  // ---------------------------------------------------------------------------
  const handleGuardarDestete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDestete.lote_cria_id) {
      alert('Debe seleccionar un lote registrado previamente en Cría.');
      return;
    }

    if (!infoLoteSeleccionadoDestete) {
      alert('No se pudo recuperar la información del lote seleccionado.');
      return;
    }

    const { 
      parto, 
      lote, 
      madreId, 
      fechaParto, 
      cantidadDisponible 
    } = infoLoteSeleccionadoDestete;

    const cantDestetar = Number(formDestete.destetados);
    const pesoPromedio = Number(formDestete.peso_promedio_destete);
    const fechaDestete = formDestete.fecha_destete;

    // Validación 1: no destetar desde lotes inexistentes
    if (!parto && !lote) {
      alert('El lote de cría seleccionado no existe en los registros.');
      return;
    }

    // Validación 2: coherencia cronológica (fecha destete >= fecha parto)
    if (new Date(fechaDestete).getTime() < new Date(fechaParto).getTime()) {
      alert(`Error cronológico: La fecha de destete (${fechaDestete}) no puede ser anterior a la fecha de parto/nacimiento (${fechaParto}).`);
      return;
    }

    // Validación 3: no destetar más animales que los disponibles
    if (cantDestetar <= 0) {
      alert('La cantidad a destetar debe ser mayor a 0.');
      return;
    }
    if (cantDestetar > cantidadDisponible) {
      alert(`Control zootécnico: No se pueden destetar ${cantDestetar} animales porque solo hay ${cantidadDisponible} lechones disponibles en esta camada.`);
      return;
    }

    // Validación 4: peso promedio razonable
    if (pesoPromedio <= 0) {
      alert('Debe indicar un peso promedio al destete válido (kg/cabeza).');
      return;
    }

    const isOperario = permissions.rolId === 'ROL_OPERARIO';
    const kgTotalesDestete = Number((cantDestetar * pesoPromedio).toFixed(2));
    const loteRecriaId = formDestete.lote_destino_id.trim() || `LOTE_REC_${formDestete.lote_cria_id.replace('LOTE_CRIA_', '')}`;

    // 1. Actualizar Parto en base de datos
    if (parto) {
      const nuevoTotalDestetados = (Number(parto.destetados) || 0) + cantDestetar;
      const updatedParto: Parto = {
        ...parto,
        fecha_destete: fechaDestete,
        destetados: nuevoTotalDestetados,
        peso_promedio_destete: pesoPromedio,
        lote_destete_id: loteRecriaId,
        observaciones: formDestete.observaciones 
          ? `${parto.observaciones ? parto.observaciones + ' | ' : ''}Destete: ${formDestete.observaciones}`
          : parto.observaciones
      };
      await onSaveRecord('Partos', updatedParto);
    }

    // 2. Registrar Movimiento Físico de Pase de Fase (Cría -> Destete/Recría)
    await onSaveRecord('Movimientos_Fisicos', {
      id: `MF_DESTETE_${Date.now()}`,
      fecha: fechaDestete,
      tipo_evento: 'PASE_FASE',
      lote_id: formDestete.lote_cria_id,
      madre_id: madreId,
      cantidad_cabezas: cantDestetar,
      kg_totales: kgTotalesDestete,
      fase_origen_id: 'FASE_CRIA',
      fase_destino_id: 'FASE_DESTETE_REC',
      sector_origen_id: 'SEC_PARIDERAS_CAMPO',
      sector_destino_id: 'SEC_CORRALES_DESTETE',
      categoria_senasa_id: 'CAT_CACHORRO',
      motivo: `Destete camada madre ${madreId} (${cantDestetar} cabezas a ${pesoPromedio.toFixed(2)} kg/promedio)`,
      estado: isOperario ? 'Borrador' : 'Confirmado',
      origen_dato: 'REAL',
      creado_por: currentUser?.usuario || 'usuario',
      fecha_creacion: new Date().toISOString().split('T')[0]
    });

    // 3. Actualizar lote en Cría y Crear/Actualizar lote en Recría
    if (lote) {
      const cabezasRestantes = Math.max(0, Number(lote.cabezas_actuales) - cantDestetar);
      await onSaveRecord('Lotes_Animales', {
        ...lote,
        cabezas_actuales: cabezasRestantes,
        kg_actuales: Number((cabezasRestantes * 1.4).toFixed(2)),
        estado: cabezasRestantes === 0 ? 'Cerrado' : 'Activo'
      });
    }

    // 4. Crear o incorporar en Lote de Recría
    const loteRecriaExistente = db.Lotes_Animales?.find(l => 
      l.id === loteRecriaId || l.codigo_lote === loteRecriaId
    );

    if (loteRecriaExistente) {
      await onSaveRecord('Lotes_Animales', {
        ...loteRecriaExistente,
        cabezas_actuales: Number(loteRecriaExistente.cabezas_actuales) + cantDestetar,
        kg_actuales: Number(loteRecriaExistente.kg_actuales) + kgTotalesDestete,
        estado: 'Activo'
      });
    } else {
      const nuevoLoteRecria: Partial<LoteAnimales> = {
        id: loteRecriaId,
        codigo_lote: loteRecriaId,
        fecha_formacion: fechaDestete,
        origen: `Destete desde ${formDestete.lote_cria_id} (Madre ${madreId})`,
        fase_actual_id: 'FASE_DESTETE_REC',
        subunidad_id: 'SUB_DESTETE_REC',
        sector_fisico_id: 'SEC_CORRALES_DESTETE',
        cabezas_actuales: cantDestetar,
        kg_actuales: kgTotalesDestete,
        estado: 'Activo'
      };
      await onSaveRecord('Lotes_Animales', nuevoLoteRecria);
    }

    setShowDesteteModal(false);
    // Limpiar
    setFormDestete({
      lote_cria_id: '',
      fecha_destete: new Date().toISOString().split('T')[0],
      destetados: 10,
      peso_promedio_destete: 8.5,
      lote_destino_id: '',
      observaciones: ''
    });
  };

  // ---------------------------------------------------------------------------
  // GUARDAR NOVEDAD EN LACTANCIA (BAJAS O ADOPCIONES/TRANSFERENCIAS)
  // ---------------------------------------------------------------------------
  const handleGuardarNovedad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNovedad.parto_id) {
      alert('Seleccione una camada / parto.');
      return;
    }

    const parto = db.Partos?.find(p => p.id === formNovedad.parto_id);
    if (!parto) {
      alert('Parto no encontrado.');
      return;
    }

    const cantidad = Number(formNovedad.cantidad);
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    const isOperario = permissions.rolId === 'ROL_OPERARIO';

    if (formNovedad.tipo === 'BAJA') {
      const bajasPrevias = Number(parto.bajas_lactancia) || 0;
      const nuevoParto: Parto = {
        ...parto,
        bajas_lactancia: bajasPrevias + cantidad,
        observaciones: `${parto.observaciones ? parto.observaciones + ' | ' : ''}Baja lactancia: ${formNovedad.motivo}`
      };
      await onSaveRecord('Partos', nuevoParto);

      // Registrar muerte en Movimientos Físicos
      await onSaveRecord('Movimientos_Fisicos', {
        id: `MF_BAJA_${Date.now()}`,
        fecha: formNovedad.fecha,
        tipo_evento: 'MUERTE',
        lote_id: parto.lote_generado_id || parto.id,
        madre_id: parto.madre_id,
        cantidad_cabezas: cantidad,
        kg_totales: Number((cantidad * 1.5).toFixed(2)),
        fase_origen_id: 'FASE_CRIA',
        sector_origen_id: 'SEC_PARIDERAS_CAMPO',
        motivo: `Mortalidad en lactancia: ${formNovedad.motivo}`,
        estado: isOperario ? 'Borrador' : 'Confirmado',
        origen_dato: 'REAL',
        creado_por: currentUser?.usuario || 'usuario',
        fecha_creacion: formNovedad.fecha
      });

      // Actualizar cabezas en lote
      const lote = db.Lotes_Animales?.find(l => l.codigo_lote === parto.lote_generado_id || l.id === parto.lote_generado_id);
      if (lote) {
        const rest = Math.max(0, Number(lote.cabezas_actuales) - cantidad);
        await onSaveRecord('Lotes_Animales', {
          ...lote,
          cabezas_actuales: rest,
          kg_actuales: Number((rest * 1.5).toFixed(2))
        });
      }
    } else {
      // Transferencia / Adopción entre camadas
      if (!formNovedad.lote_destino_transferencia) {
        alert('Seleccione la camada o lote receptor de la adopción.');
        return;
      }

      const partoDestino = db.Partos?.find(p => p.lote_generado_id === formNovedad.lote_destino_transferencia || p.id === formNovedad.lote_destino_transferencia);
      
      // Restar de la camada de origen
      const nuevoOrigen: Parto = {
        ...parto,
        adopciones_transferencias: (Number(parto.adopciones_transferencias) || 0) - cantidad,
        observaciones: `${parto.observaciones ? parto.observaciones + ' | ' : ''}Transferencia de ${cantidad} lechones a camada ${formNovedad.lote_destino_transferencia}`
      };
      await onSaveRecord('Partos', nuevoOrigen);

      // Sumar a la camada de destino si existe
      if (partoDestino) {
        const nuevoDest: Parto = {
          ...partoDestino,
          adopciones_transferencias: (Number(partoDestino.adopciones_transferencias) || 0) + cantidad,
          observaciones: `${partoDestino.observaciones ? partoDestino.observaciones + ' | ' : ''}Adopción de ${cantidad} lechones recibidos de ${parto.lote_generado_id || parto.madre_id}`
        };
        await onSaveRecord('Partos', nuevoDest);
      }

      // Registrar movimiento
      await onSaveRecord('Movimientos_Fisicos', {
        id: `MF_TRANS_${Date.now()}`,
        fecha: formNovedad.fecha,
        tipo_evento: 'AJUSTE',
        lote_id: parto.lote_generado_id || parto.id,
        madre_id: parto.madre_id,
        cantidad_cabezas: cantidad,
        kg_totales: Number((cantidad * 1.5).toFixed(2)),
        fase_origen_id: 'FASE_CRIA',
        fase_destino_id: 'FASE_CRIA',
        motivo: `Transferencia / adopción trazable de ${cantidad} lechones a ${formNovedad.lote_destino_transferencia}. Motivo: ${formNovedad.motivo}`,
        estado: isOperario ? 'Borrador' : 'Confirmado',
        origen_dato: 'REAL',
        creado_por: currentUser?.usuario || 'usuario',
        fecha_creacion: formNovedad.fecha
      });
    }

    setShowNovedadModal(false);
  };

  // ---------------------------------------------------------------------------
  // GUARDAR PASE DE FASE GENERAL
  // ---------------------------------------------------------------------------
  const handleGuardarPase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPase.lote_id) {
      alert('Seleccione un lote.');
      return;
    }

    const cabezas = Number(formPase.cantidad_cabezas);
    const kg = Number(formPase.kg_totales);
    const pesoPromedio = cabezas > 0 ? kg / cabezas : 0;

    // Validación de rango de peso de la fase destino (Regla SENASA)
    const faseDestino = db.Fases_Proceso.find(f => f.id === formPase.fase_destino_id);
    let fueraDeRango = false;
    let mensajeRango = '';

    if (faseDestino && formPase.tipo_evento === 'PASE_FASE') {
      if (pesoPromedio < faseDestino.peso_min || pesoPromedio > faseDestino.peso_max) {
        fueraDeRango = true;
        mensajeRango = `El peso promedio (${pesoPromedio.toFixed(1)} kg) está fuera del rango de la fase ${faseDestino.nombre} (${faseDestino.peso_min} a ${faseDestino.peso_max} kg).`;
        if (!formPase.autorizar_excepcion) {
          alert(`Control de integridad: ${mensajeRango} Debe marcar 'Autorizar Excepción' para proceder.`);
          return;
        }
      }
    }

    await onSaveRecord('Movimientos_Fisicos', {
      id: `MF_MOV_${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      tipo_evento: formPase.tipo_evento,
      lote_id: formPase.lote_id,
      cantidad_cabezas: cabezas,
      kg_totales: kg,
      fase_origen_id: formPase.fase_origen_id,
      fase_destino_id: formPase.fase_destino_id,
      motivo: fueraDeRango ? `EXCEPCIÓN AUTORIZADA: ${mensajeRango}. ${formPase.motivo}` : formPase.motivo,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      creado_por: currentUser?.usuario || 'usuario',
      fecha_creacion: new Date().toISOString().split('T')[0]
    });

    // Actualizar lote si es pase
    const lote = db.Lotes_Animales.find(l => l.id === formPase.lote_id || l.codigo_lote === formPase.lote_id);
    if (lote && formPase.tipo_evento === 'PASE_FASE') {
      await onSaveRecord('Lotes_Animales', {
        ...lote,
        fase_actual_id: formPase.fase_destino_id,
        subunidad_id: faseDestino?.subunidad_id || lote.subunidad_id,
        cabezas_actuales: cabezas,
        kg_actuales: kg
      });
    }

    setShowPaseModal(false);
  };

  // ---------------------------------------------------------------------------
  // DATOS FILTRADOS: CRÍA (PARTOS)
  // ---------------------------------------------------------------------------
  const partosFiltrados = useMemo(() => {
    return (db.Partos || []).filter(p => {
      // Búsqueda por texto
      if (filtroCriaBusqueda.trim()) {
        const query = filtroCriaBusqueda.toLowerCase();
        const loteTxt = (p.lote_generado_id || '').toLowerCase();
        const madreTxt = (p.madre_id || '').toLowerCase();
        const obsTxt = (p.observaciones || '').toLowerCase();
        if (!loteTxt.includes(query) && !madreTxt.includes(query) && !obsTxt.includes(query)) {
          return false;
        }
      }

      // Filtro madre
      if (filtroCriaMadre !== 'TODAS' && p.madre_id !== filtroCriaMadre) {
        return false;
      }

      // Filtro campaña
      if (filtroCriaCampana !== 'TODAS' && p.campana_id && p.campana_id !== filtroCriaCampana) {
        return false;
      }

      // Filtro fecha
      if (filtroCriaFechaDesde && p.fecha_parto < filtroCriaFechaDesde) {
        return false;
      }
      if (filtroCriaFechaHasta && p.fecha_parto > filtroCriaFechaHasta) {
        return false;
      }

      return true;
    });
  }, [db.Partos, filtroCriaBusqueda, filtroCriaMadre, filtroCriaCampana, filtroCriaFechaDesde, filtroCriaFechaHasta]);

  // ---------------------------------------------------------------------------
  // DATOS FILTRADOS: DESTETES
  // Generados a partir de los partos con destete registrado o movimientos físicos
  // ---------------------------------------------------------------------------
  const destetesRegistrados = useMemo(() => {
    // 1. Partos con destete
    const items: Array<{
      id: string;
      parto_id: string;
      lote_cria_id: string;
      lote_destino_id: string;
      madre_id: string;
      fecha_parto: string;
      fecha_destete: string;
      dias_lactancia: number;
      cantidad_destetada: number;
      peso_promedio: number;
      kg_totales: number;
      gdp_lactancia: number;
      campana_id?: string;
      estado: string;
      observaciones?: string;
    }> = [];

    (db.Partos || []).filter(p => p.fecha_destete && (Number(p.destetados) || 0) > 0).forEach(p => {
      const dParto = new Date(p.fecha_parto).getTime();
      const dDestete = new Date(p.fecha_destete || '').getTime();
      const dias = Math.max(1, Math.round((dDestete - dParto) / (1000 * 60 * 60 * 24)));
      const pesoProm = Number(p.peso_promedio_destete) || 8.5;
      const cant = Number(p.destetados) || 0;
      const gdp = Number(((pesoProm - 1.40) / dias).toFixed(2));

      items.push({
        id: `DEST_${p.id}`,
        parto_id: p.id,
        lote_cria_id: p.lote_generado_id || `PARTO_${p.madre_id}`,
        lote_destino_id: p.lote_destete_id || `LOTE_REC_${p.madre_id}`,
        madre_id: p.madre_id,
        fecha_parto: p.fecha_parto,
        fecha_destete: p.fecha_destete || '',
        dias_lactancia: dias,
        cantidad_destetada: cant,
        peso_promedio: pesoProm,
        kg_totales: Number((cant * pesoProm).toFixed(2)),
        gdp_lactancia: gdp,
        campana_id: p.campana_id,
        estado: p.estado,
        observaciones: p.observaciones
      });
    });

    return items.filter(d => {
      if (filtroDesteteBusqueda.trim()) {
        const query = filtroDesteteBusqueda.toLowerCase();
        const loteCria = d.lote_cria_id.toLowerCase();
        const loteDest = d.lote_destino_id.toLowerCase();
        const madre = d.madre_id.toLowerCase();
        if (!loteCria.includes(query) && !loteDest.includes(query) && !madre.includes(query)) {
          return false;
        }
      }
      if (filtroDesteteCampana !== 'TODAS' && d.campana_id && d.campana_id !== filtroDesteteCampana) {
        return false;
      }
      if (filtroDesteteFechaDesde && d.fecha_destete < filtroDesteteFechaDesde) {
        return false;
      }
      if (filtroDesteteFechaHasta && d.fecha_destete > filtroDesteteFechaHasta) {
        return false;
      }
      return true;
    });
  }, [db.Partos, filtroDesteteBusqueda, filtroDesteteCampana, filtroDesteteFechaDesde, filtroDesteteFechaHasta]);

  // ---------------------------------------------------------------------------
  // LOTES DISPONIBLES EN CRÍA PARA DESTETAR
  // ---------------------------------------------------------------------------
  const lotesDisponiblesParaDestete = useMemo(() => {
    return (db.Partos || [])
      .map(p => {
        const nac = Number(p.nacidos_vivos) || 0;
        const baj = Number(p.bajas_lactancia) || 0;
        const adop = Number(p.adopciones_transferencias) || 0;
        const dest = Number(p.destetados) || 0;
        const disp = Math.max(0, nac - baj + adop - dest);
        return {
          parto: p,
          lote_id: p.lote_generado_id || p.id,
          madre_id: p.madre_id,
          fecha_parto: p.fecha_parto,
          disponible: disp,
          destetados: dest,
          nacidos_vivos: nac
        };
      })
      .filter(x => x.disponible > 0);
  }, [db.Partos]);

  // ---------------------------------------------------------------------------
  // MÉTRICAS RESUMEN DE CRÍA
  // ---------------------------------------------------------------------------
  const metricasCria = useMemo(() => {
    const partos = db.Partos || [];
    const totalPartos = partos.length;
    const totalNacidosVivos = partos.reduce((acc, p) => acc + (Number(p.nacidos_vivos) || 0), 0);
    const totalNacidosMuertos = partos.reduce((acc, p) => acc + (Number(p.nacidos_muertos) || 0), 0);
    const totalBajasLactancia = partos.reduce((acc, p) => acc + (Number(p.bajas_lactancia) || 0), 0);
    const totalDestetados = partos.reduce((acc, p) => acc + (Number(p.destetados) || 0), 0);
    
    const disponiblesActuales = Math.max(0, totalNacidosVivos - totalBajasLactancia - totalDestetados);
    const tasaSupervivencia = totalNacidosVivos > 0 
      ? (((totalNacidosVivos - totalBajasLactancia) / totalNacidosVivos) * 100).toFixed(1)
      : '0.0';

    return {
      totalPartos,
      totalNacidosVivos,
      totalNacidosMuertos,
      totalBajasLactancia,
      totalDestetados,
      disponiblesActuales,
      tasaSupervivencia
    };
  }, [db.Partos]);

  // ---------------------------------------------------------------------------
  // MÉTRICAS RESUMEN DE DESTETE
  // ---------------------------------------------------------------------------
  const metricasDestete = useMemo(() => {
    const list = destetesRegistrados;
    const eventos = list.length;
    const totalLechones = list.reduce((acc, d) => acc + d.cantidad_destetada, 0);
    const kgTotales = list.reduce((acc, d) => acc + d.kg_totales, 0);
    const pesoPromedioGlobal = totalLechones > 0 ? (kgTotales / totalLechones).toFixed(2) : '0.00';
    
    // Promedio ponderado de ganancia diaria en lactancia
    let gdpPonderada = '0.00';
    if (totalLechones > 0) {
      const sumaGdp = list.reduce((acc, d) => acc + (d.gdp_lactancia * d.cantidad_destetada), 0);
      gdpPonderada = (sumaGdp / totalLechones).toFixed(2);
    }

    return {
      eventos,
      totalLechones,
      kgTotales,
      pesoPromedioGlobal,
      gdpPonderada
    };
  }, [destetesRegistrados]);

  const handleEditarParto = (parto: Parto) => {
    setEditingPartoId(parto.id);
    setFormParto({
      madre_id: parto.madre_id,
      lote_generado_id: parto.lote_generado_id || parto.id,
      padrillo_id: parto.padrillo_id || '',
      fecha_parto: parto.fecha_parto,
      nacidos_vivos: parto.nacidos_vivos,
      nacidos_muertos: parto.nacidos_muertos,
      bajas_lactancia: parto.bajas_lactancia || 0,
      campana_id: parto.campana_id || campanaActiva,
      observaciones: parto.observaciones || ''
    });
    setShowPartoModal(true);
  };

  // ---------------------------------------------------------------------------
  // COLUMNAS: TABLA CRÍA (PARTOS)
  // ---------------------------------------------------------------------------
  const columnsCria: Column<Parto>[] = [
    {
      key: 'lote_generado_id',
      header: 'Identificador Lote',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[#1a442b] bg-[#ebf5ed] px-2.5 py-1 rounded-md border border-[#c3decb] inline-flex items-center gap-1.5 shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-[#24633e]" />
          {p.lote_generado_id || `PARTO_${p.madre_id}`}
        </span>
      )
    },
    { 
      key: 'madre_id', 
      header: 'Cerda Madre',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[#1b4a2e] bg-[#f4f8f4] px-2 py-0.5 rounded border border-[#d2e5d7] inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#1b7a3d]" />
          {p.madre_id}
        </span>
      )
    },
    { 
      key: 'fecha_parto', 
      header: 'Fecha Parto',
      render: (p) => <span className="font-mono text-xs text-[#2b4436] font-semibold">{p.fecha_parto}</span>
    },
    { 
      key: 'nacidos_vivos', 
      header: 'Nac. Vivos', 
      align: 'right',
      render: (p) => <span className="font-mono font-bold text-[#143422]">{p.nacidos_vivos}</span>
    },
    { 
      key: 'nacidos_muertos', 
      header: 'Nac. Muertos', 
      align: 'right',
      render: (p) => (
        <span className={`font-mono ${p.nacidos_muertos > 0 ? 'text-[#8a3333] font-semibold' : 'text-[#849a8d]'}`}>
          {p.nacidos_muertos}
        </span>
      )
    },
    { 
      key: 'bajas_lactancia', 
      header: 'Bajas Lactancia', 
      align: 'right',
      render: (p) => (
        <span className={`font-mono ${Number(p.bajas_lactancia) > 0 ? 'text-[#a83232] font-semibold' : 'text-[#849a8d]'}`}>
          {p.bajas_lactancia || 0}
        </span>
      )
    },
    {
      key: 'destetados',
      header: 'Disponibles / Destetados',
      align: 'right',
      render: (p) => {
        const nac = Number(p.nacidos_vivos) || 0;
        const baj = Number(p.bajas_lactancia) || 0;
        const adop = Number(p.adopciones_transferencias) || 0;
        const dest = Number(p.destetados) || 0;
        const disp = Math.max(0, nac - baj + adop - dest);
        return (
          <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
            <span className={`font-bold px-1.5 py-0.5 rounded ${disp > 0 ? 'bg-[#ebf8ee] text-[#1b6b3e] border border-[#bce2c7]' : 'text-[#8ca294]'}`}>
              {disp} disp.
            </span>
            <span className="text-[#6d8a78]">/ {dest} dest.</span>
          </div>
        );
      }
    },
    {
      key: 'campana_id',
      header: 'Campaña',
      render: (p) => (
        <span className="text-[11px] font-mono text-[#5b7565]">
          {p.campana_id || 'CAMP_2024_2025'}
        </span>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p) => <StatusTag estado={p.estado} />
    },
    {
      key: 'id',
      header: 'Operaciones',
      align: 'center',
      render: (p) => {
        const nac = Number(p.nacidos_vivos) || 0;
        const baj = Number(p.bajas_lactancia) || 0;
        const adop = Number(p.adopciones_transferencias) || 0;
        const dest = Number(p.destetados) || 0;
        const disp = Math.max(0, nac - baj + adop - dest);

        return (
          <div className="flex items-center justify-center gap-1.5">
            <RowActions
              unit="PORCINOS"
              canEdit={permissions.canModifyRecords}
              onEdit={() => handleEditarParto(p)}
              onViewDetail={() => setDetailRecord({
                record: p,
                tableName: 'Partos',
                unit: 'PORCINOS',
                title: `Parto Camada ${p.lote_generado_id || p.id}`
              })}
            />
            {disp > 0 && !permissions.isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  handleSelectLoteCriaParaDestete(p.lote_generado_id || p.id);
                  setActiveTab('destete');
                  setShowDesteteModal(true);
                }}
                className="px-2 py-1 bg-[#1b5e37] hover:bg-[#14472a] text-white text-[11px] font-semibold rounded-md shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Proceder a destetar este lote"
              >
                <span>Destetar</span>
                <MoveRight className="w-3 h-3" />
              </button>
            )}

            {!permissions.isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPartoParaNovedad(p);
                  setFormNovedad(prev => ({
                    ...prev,
                    parto_id: p.id,
                    cantidad: 1,
                    lote_destino_transferencia: ''
                  }));
                  setShowNovedadModal(true);
                }}
                className="p-1 text-[#3f634d] hover:text-[#183925] hover:bg-[#edf4ee] rounded-md transition-colors cursor-pointer"
                title="Registrar baja en lactancia o transferencia"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
              </button>
            )}

            {p.estado === 'Borrador' && permissions.canConfirm('produccion') && (
              <button
                type="button"
                onClick={() => onConfirmRecord('Partos', p.id)}
                className="p-1 text-[#227242] hover:bg-[#eaf4ed] rounded-md transition-colors cursor-pointer"
                title="Confirmar Parto"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  // ---------------------------------------------------------------------------
  // COLUMNAS: TABLA DESTETE
  // ---------------------------------------------------------------------------
  const columnsDestete: Column<any>[] = [
    {
      key: 'lote_cria_id',
      header: 'Lote Cría (Origen)',
      render: (d) => (
        <span className="font-mono text-xs font-bold text-[#19422a] bg-[#eef7f0] px-2 py-0.5 rounded border border-[#cbe5d3]">
          {d.lote_cria_id}
        </span>
      )
    },
    {
      key: 'lote_destino_id',
      header: 'Lote Recría (Destino)',
      render: (d) => (
        <span className="font-mono text-xs font-bold text-[#235836] bg-[#f1f8f3] px-2 py-0.5 rounded border border-[#d2e9d9] inline-flex items-center gap-1">
          <ArrowRight className="w-3 h-3 text-[#2d7749]" />
          {d.lote_destino_id}
        </span>
      )
    },
    {
      key: 'madre_id',
      header: 'Madre',
      render: (d) => (
        <span className="font-mono text-xs text-[#2b4b37]">
          {d.madre_id}
        </span>
      )
    },
    {
      key: 'fecha_parto',
      header: 'F. Parto',
      render: (d) => <span className="font-mono text-xs text-[#637d6e]">{d.fecha_parto}</span>
    },
    {
      key: 'fecha_destete',
      header: 'F. Destete',
      render: (d) => <span className="font-mono text-xs font-bold text-[#193a26]">{d.fecha_destete}</span>
    },
    {
      key: 'dias_lactancia',
      header: 'Lactancia',
      align: 'right',
      render: (d) => <span className="font-mono text-xs text-[#204730]">{d.dias_lactancia} días</span>
    },
    {
      key: 'cantidad_destetada',
      header: 'Destetados',
      align: 'right',
      render: (d) => <span className="font-mono text-xs font-bold text-[#15542e]">{d.cantidad_destetada} cab</span>
    },
    {
      key: 'peso_promedio',
      header: 'P. Promedio',
      align: 'right',
      render: (d) => <span className="font-mono text-xs font-bold text-[#143422]">{d.peso_promedio} kg</span>
    },
    {
      key: 'kg_totales',
      header: 'Kilos Totales',
      align: 'right',
      render: (d) => <span className="font-mono text-xs text-[#4b6354]">{d.kg_totales} kg</span>
    },
    {
      key: 'gdp_lactancia',
      header: 'GDP Lactancia',
      align: 'right',
      render: (d) => (
        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
          d.gdp_lactancia >= 0.23 ? 'bg-[#ebf7ee] text-[#1a6e3d]' : 'bg-[#fff5e6] text-[#9c5f11]'
        }`}>
          {d.gdp_lactancia} kg/d
        </span>
      )
    },
    {
      key: 'campana_id',
      header: 'Campaña',
      render: (d) => <span className="font-mono text-[11px] text-[#637e6f]">{d.campana_id || 'CAMP_2024_2025'}</span>
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (d) => <StatusTag estado={d.estado} />
    }
  ];

  // ---------------------------------------------------------------------------
  // COLUMNAS: PASES & BAJAS GENERALES
  // ---------------------------------------------------------------------------
  const columnsPases: Column<MovimientoFisico>[] = [
    { 
      key: 'fecha', 
      header: 'Fecha',
      render: (m) => <span className="font-mono text-xs text-[#2b4436]">{m.fecha}</span>
    },
    { 
      key: 'tipo_evento', 
      header: 'Evento',
      render: (m) => {
        const colors: Record<string, string> = {
          NACIMIENTO: 'bg-[#eaf4ed] text-[#1b7a3d] border-[#c2e2cc]',
          PASE_FASE: 'bg-[#edf3f8] text-[#1e5888] border-[#c5daf0]',
          MUERTE: 'bg-[#fdf2f2] text-[#a83232] border-[#f8c8c8]',
          DESCARTE: 'bg-[#fcf5e5] text-[#9c6a16] border-[#f7e0af]',
          VENTA: 'bg-[#f0f9f3] text-[#155a30] border-[#c8e6d2]',
          AJUSTE: 'bg-[#f5f5f5] text-[#555] border-[#ddd]'
        };
        return (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${colors[m.tipo_evento] || ''}`}>
            {m.tipo_evento}
          </span>
        );
      }
    },
    { 
      key: 'lote_id', 
      header: 'Lote',
      render: (m) => <span className="font-mono text-xs font-semibold text-[#183a26]">{m.lote_id}</span>
    },
    { 
      key: 'cantidad_cabezas', 
      header: 'Cabezas', 
      align: 'right',
      render: (m) => <span className="font-mono font-bold text-[#143422]">{m.cantidad_cabezas}</span>
    },
    { 
      key: 'kg_totales', 
      header: 'Kg Totales', 
      align: 'right',
      render: (m) => <span className="font-mono text-xs text-[#3b5344]">{m.kg_totales} kg</span>
    },
    { 
      key: 'fase_origen_id', 
      header: 'Fase Origen',
      render: (m) => <span className="text-xs text-[#526a5c]">{m.fase_origen_id || '—'}</span>
    },
    { 
      key: 'fase_destino_id', 
      header: 'Fase Destino',
      render: (m) => <span className="text-xs font-semibold text-[#1c4d30]">{m.fase_destino_id || '—'}</span>
    },
    { 
      key: 'motivo', 
      header: 'Observaciones / Motivo',
      render: (m) => <span className="text-xs text-[#597263] truncate max-w-xs block" title={m.motivo}>{m.motivo || '—'}</span>
    },
    { 
      key: 'estado', 
      header: 'Estado',
      render: (m) => <StatusTag estado={m.estado} />
    }
  ];

  // ---------------------------------------------------------------------------
  // COLUMNAS: LOTES DE PIARA
  // ---------------------------------------------------------------------------
  const columnsLotes: Column<LoteAnimales>[] = [
    { 
      key: 'codigo_lote', 
      header: 'Código de Lote',
      render: (l) => <span className="font-mono text-xs font-bold text-[#1b4a2e]">{l.codigo_lote}</span>
    },
    { 
      key: 'fecha_formacion', 
      header: 'Fecha Formación',
      render: (l) => <span className="font-mono text-xs text-[#364e40]">{l.fecha_formacion}</span>
    },
    { 
      key: 'fase_actual_id', 
      header: 'Fase Actual',
      render: (l) => {
        const fase = db.Fases_Proceso.find(f => f.id === l.fase_actual_id);
        return <span className="text-xs font-semibold text-[#183a26]">{fase?.nombre || l.fase_actual_id}</span>;
      }
    },
    { 
      key: 'cabezas_actuales', 
      header: 'Cabezas', 
      align: 'right',
      render: (l) => <span className="font-mono font-bold text-[#153a24]">{l.cabezas_actuales}</span>
    },
    { 
      key: 'kg_actuales', 
      header: 'Kg Actuales', 
      align: 'right',
      render: (l) => <span className="font-mono text-xs text-[#3b5344]">{l.kg_actuales} kg</span>
    },
    { 
      key: 'origen', 
      header: 'Origen / Trazabilidad',
      render: (l) => <span className="text-xs text-[#5c7365] truncate max-w-xs block" title={l.origen}>{l.origen}</span>
    },
    { 
      key: 'estado', 
      header: 'Estado',
      render: (l) => <StatusTag estado={l.estado} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado Principal y Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d8e2d7]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e5837] bg-[#eef7f0] px-2.5 py-1 rounded-md border border-[#c6e5cf]">
              UNIDAD PRODUCTIVA: PORCINOS
            </span>
            <span className="text-[11px] font-semibold text-[#3b634b] bg-white px-2 py-0.5 rounded border border-[#d6e2d6]">
              Proceso: Cría & Piara
            </span>
            <span className="text-[11px] font-mono text-[#5f7a6b]">
              Campaña: {campanaActiva}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#143222] tracking-tight">
            PORCINOS · GESTIÓN DE CRÍA, DESTETE Y LOTES
          </h2>
          <p className="text-xs text-[#4b6354] mt-0.5">
            Operación: Registro de Parto y Nacimientos, trazabilidad biológica de camadas, destete controlado a recría y movimientos físicos.
          </p>
        </div>

        {/* Pestañas Principales: Cría y Destete Destacadas */}
        <div className="flex items-center gap-1.5 p-1 bg-[#e7eee6] rounded-xl border border-[#cddccd] overflow-x-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('cria')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cria' 
                ? 'bg-white text-[#133c23] font-bold shadow-xs border border-[#b2cfb8]' 
                : 'text-[#476652] hover:text-[#143c24] font-medium'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Cría ({db.Partos?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('destete')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'destete' 
                ? 'bg-white text-[#133c23] font-bold shadow-xs border border-[#b2cfb8]' 
                : 'text-[#476652] hover:text-[#143c24] font-medium'
            }`}
          >
            <MoveRight className="w-3.5 h-3.5" />
            <span>Destete ({destetesRegistrados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pases')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pases' 
                ? 'bg-white text-[#133c23] font-bold shadow-xs border border-[#b2cfb8]' 
                : 'text-[#476652] hover:text-[#143c24] font-medium'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Pases & Bajas ({db.Movimientos_Fisicos?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lotes')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lotes' 
                ? 'bg-white text-[#133c23] font-bold shadow-xs border border-[#b2cfb8]' 
                : 'text-[#476652] hover:text-[#143c24] font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lotes ({db.Lotes_Animales?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Banner de Rango Operativo */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Auditor de Hacienda:</strong> Modo de solo lectura activo. No se permiten altas ni modificaciones de registros de campo.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] border border-[#b2d0ea]">Solo Lectura</span>
        </div>
      )}

      {permissions.rolId === 'ROL_OPERARIO' && (
        <div className="bg-[#fef9ee] border border-[#f7e0af] text-[#7a4e14] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Operario de Campo:</strong> Los partos y movimientos registrados se guardarán como <strong>Borrador</strong> para posterior revisión y confirmación del Encargado.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fce49d] text-[#734509] border border-[#ebd083]">Carga en Borrador</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA A: CRÍA (PARTOS Y CAMADAS)                                       */}
      {/* ======================================================================= */}
      {activeTab === 'cria' && (
        <div className="space-y-5">
          {/* Tarjetas Resumen de Cría */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Partos Totales</span>
              <span className="font-mono text-xl font-bold text-[#143422]">{metricasCria.totalPartos}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Plantel 34 madres</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Nacidos Vivos</span>
              <span className="font-mono text-xl font-bold text-[#1b6b3e]">{metricasCria.totalNacidosVivos}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">1.40 kg nac. promedio</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Nacidos Muertos</span>
              <span className="font-mono text-xl font-bold text-[#8f3232]">{metricasCria.totalNacidosMuertos}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Control de mortinatos</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Bajas Lactancia</span>
              <span className="font-mono text-xl font-bold text-[#a03636]">{metricasCria.totalBajasLactancia}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Mortalidad perinatal</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Disponibles Cría</span>
              <span className="font-mono text-xl font-bold text-[#134927]">{metricasCria.disponiblesActuales}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">En parideras a campo</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Supervivencia</span>
              <span className="font-mono text-xl font-bold text-[#1a5b33]">{metricasCria.tasaSupervivencia}%</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Meta CMI: &gt;= 88%</span>
            </div>
          </div>

          {/* Sector 1: Filtros de Cría (Buscar lote o madre, Selección madres, Campaña, Fecha desde, Fecha hasta) */}
          <div className="bg-white p-4 rounded-xl border border-[#d7e3d7] shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#eef3ee]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d583c] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Filtros de Búsqueda y Período
              </span>
              {(filtroCriaBusqueda || filtroCriaMadre !== 'TODAS' || filtroCriaCampana !== 'TODAS' || filtroCriaFechaDesde || filtroCriaFechaHasta) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroCriaBusqueda('');
                    setFiltroCriaMadre('TODAS');
                    setFiltroCriaCampana('TODAS');
                    setFiltroCriaFechaDesde('');
                    setFiltroCriaFechaHasta('');
                  }}
                  className="text-[11px] text-[#4d705a] hover:text-[#183925] font-semibold underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs pt-1">
              {/* 1. Buscar lote o madre */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6c8676] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar lote o madre..."
                  value={filtroCriaBusqueda}
                  onChange={(e) => setFiltroCriaBusqueda(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#235f3b]"
                />
              </div>

              {/* 2. Selección de Madres */}
              <div>
                <select
                  value={filtroCriaMadre}
                  onChange={(e) => setFiltroCriaMadre(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#235f3b]"
                >
                  <option value="TODAS">Todas las Madres</option>
                  {Array.from(new Set((db.Partos || []).map(p => p.madre_id))).map(m => (
                    <option key={m} value={m}>Madre: {m}</option>
                  ))}
                </select>
              </div>

              {/* 3. Selección de Campaña */}
              <div>
                <select
                  value={filtroCriaCampana}
                  onChange={(e) => setFiltroCriaCampana(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#235f3b]"
                >
                  <option value="TODAS">Todas las Campañas</option>
                  {(db.D_Campana || []).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.id})</option>
                  ))}
                </select>
              </div>

              {/* 4. Fecha Desde */}
              <div>
                <input
                  type="date"
                  value={filtroCriaFechaDesde}
                  onChange={(e) => setFiltroCriaFechaDesde(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] text-[11px] focus:bg-white focus:outline-none"
                  title="Fecha Parto Desde"
                />
              </div>

              {/* 5. Fecha Hasta */}
              <div>
                <input
                  type="date"
                  value={filtroCriaFechaHasta}
                  onChange={(e) => setFiltroCriaFechaHasta(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] text-[11px] focus:bg-white focus:outline-none"
                  title="Fecha Parto Hasta"
                />
              </div>
            </div>
          </div>

          {/* Sector 2: Acciones de Cría (Registrar Parto, Novedad Lactancia, Exportar) */}
          <div className="bg-white p-3.5 rounded-xl border border-[#d7e3d7] shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e5837] flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5" />
              Acciones Operativas de Cría
            </span>

            <div className="flex items-center gap-2.5">
              {!permissions.isReadOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPartoModal(true)}
                    className="px-4 py-2 bg-[#1d5234] hover:bg-[#153f27] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors border border-[#16432a]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Parto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartoParaNovedad(db.Partos?.[0] || null);
                      setFormNovedad(prev => ({
                        ...prev,
                        parto_id: db.Partos?.[0]?.id || '',
                        cantidad: 1,
                        lote_destino_transferencia: ''
                      }));
                      setShowNovedadModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#f4f7f4] hover:bg-[#e7eee8] text-[#1b4e2f] border border-[#c3d8c6] text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Registrar bajas de lactancia o transferencias entre camadas"
                  >
                    <HeartHandshake className="w-4 h-4 text-[#1f663c]" />
                    <span>Novedad Lactancia</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onExportCsv('Partos')}
                className="px-3 py-2 rounded-lg border border-[#c6d7c7] text-[#4d6b58] hover:text-[#183925] hover:bg-[#edf4ee] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar Partos a CSV"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Tabla de Cría */}
          <DataTable
            columns={columnsCria}
            data={partosFiltrados}
            title="Registro de Partos y Camadas (Fase Cría / Lactancia)"
            subtitle="Identificador de lote persistido, cerda madre, nacimientos y control perinatal"
            onExportCsv={() => onExportCsv('Partos')}
            emptyMessage="No se encontraron registros de partos con los filtros aplicados. Registre un nuevo parto para generar el lote."
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA B: DESTETE (TRANSICIÓN DE CRÍA A RECRÍA)                         */}
      {/* ======================================================================= */}
      {activeTab === 'destete' && (
        <div className="space-y-5">
          {/* Tarjetas Resumen de Destete */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Eventos de Destete</span>
              <span className="font-mono text-xl font-bold text-[#143422]">{metricasDestete.eventos}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Lotes transferidos a recría</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Cabezas Destetadas</span>
              <span className="font-mono text-xl font-bold text-[#1b6b3e]">{metricasDestete.totalLechones}</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">{metricasDestete.kgTotales} kg totales</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">Peso Promedio al Destete</span>
              <span className="font-mono text-xl font-bold text-[#134927]">{metricasDestete.pesoPromedioGlobal} kg</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Rango óptimo: 8 a 10 kg</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e2d6] shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f7a69] block">GDP Lactancia P7.1</span>
              <span className="font-mono text-xl font-bold text-[#18532f]">{metricasDestete.gdpPonderada} kg/d</span>
              <span className="text-[10px] text-[#708a79] block mt-0.5">Meta CMI: &gt;= 0.23 kg/d</span>
            </div>
          </div>

          {/* Explicación del Recorrido Zootécnico */}
          <div className="p-3 bg-[#edf6f0] border border-[#c7e3d1] rounded-xl text-xs text-[#19472c] flex items-start gap-2 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#1a703d] shrink-0 mt-0.5" />
            <div>
              <strong>Recorrido Trazable Cría → Destete:</strong> Seleccione un lote registrado previamente en Cría. El sistema recupera de forma automática la cerda madre, fecha de nacimiento y lechones disponibles. Al destetar, se actualizan las existencias de Cría, se genera el lote de Recría y se actualizan los indicadores P2, P3 y P7.
            </div>
          </div>

          {/* Filtros y Acción de Destete */}
          <div className="bg-white p-4 rounded-xl border border-[#d7e3d7] shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6c8676] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar lote origen, recría o madre..."
                    value={filtroDesteteBusqueda}
                    onChange={(e) => setFiltroDesteteBusqueda(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#235f3b]"
                  />
                </div>

                {/* Filtro Campaña */}
                <div>
                  <select
                    value={filtroDesteteCampana}
                    onChange={(e) => setFiltroDesteteCampana(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#235f3b]"
                  >
                    <option value="TODAS">Todas las Campañas</option>
                    {(db.D_Campana || []).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.id})</option>
                    ))}
                  </select>
                </div>

                {/* Rango de Fechas de Destete */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filtroDesteteFechaDesde}
                    onChange={(e) => setFiltroDesteteFechaDesde(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] text-[11px] focus:bg-white focus:outline-none"
                    title="Fecha Destete Desde"
                  />
                  <span className="text-[#7d9787]">-</span>
                  <input
                    type="date"
                    value={filtroDesteteFechaHasta}
                    onChange={(e) => setFiltroDesteteFechaHasta(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-[#c6d7c7] bg-[#f8faf8] text-[#143222] text-[11px] focus:bg-white focus:outline-none"
                    title="Fecha Destete Hasta"
                  />
                </div>
              </div>

              {/* Botón Registrar Destete */}
              <div className="flex items-center gap-2 shrink-0">
                {!permissions.isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      if (lotesDisponiblesParaDestete.length > 0) {
                        handleSelectLoteCriaParaDestete(lotesDisponiblesParaDestete[0].lote_id);
                      }
                      setShowDesteteModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#1a5b34] hover:bg-[#134728] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors border border-[#144225]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Destete de Lote</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onExportCsv('Partos')}
                  className="p-1.5 rounded-lg border border-[#c6d7c7] text-[#4d6b58] hover:text-[#183925] hover:bg-[#edf4ee] transition-colors cursor-pointer"
                  title="Exportar Destetes a CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Destetes */}
          <DataTable
            columns={columnsDestete}
            data={destetesRegistrados}
            title="Historial de Destetes a Recría"
            subtitle="Vinculación inequívoca con lote de Cría, días de lactancia y peso promedio verificado"
            onExportCsv={() => onExportCsv('Partos')}
            emptyMessage="No se han registrado destetes en el período seleccionado. Seleccione un lote disponible en Cría para destetarlo."
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA C: PASES Y BAJAS GENERALES                                       */}
      {/* ======================================================================= */}
      {activeTab === 'pases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#526d5c]">
              Histórico general de transiciones entre fases (Recría a Engorde, Ventas a Faena, Bajas y Ajustes de Piara).
            </div>
            {!permissions.isReadOnly && (
              <button
                type="button"
                onClick={() => setShowPaseModal(true)}
                className="px-3 py-1.5 bg-[#1d5234] hover:bg-[#153f27] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Pase / Baja</span>
              </button>
            )}
          </div>

          <DataTable
            columns={columnsPases}
            data={db.Movimientos_Fisicos}
            title="Movimientos Físicos de Hacienda"
            subtitle="Pases entre fases, bajas por mortandad, descartes y ventas comerciales"
            onExportCsv={() => onExportCsv('Movimientos_Fisicos')}
            emptyMessage="No se han registrado movimientos físicos."
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* PESTAÑA D: LOTES DE PIARA                                                */}
      {/* ======================================================================= */}
      {activeTab === 'lotes' && (
        <div className="space-y-4">
          <DataTable
            columns={columnsLotes}
            data={db.Lotes_Animales}
            title="Lotes de Hacienda Activos y Cerrados"
            subtitle="Consolidado de cabezas y kilos por grupo productivo y fase del establecimiento"
            onExportCsv={() => onExportCsv('Lotes_Animales')}
            emptyMessage="No hay lotes formados. Los lotes se generan automáticamente al registrar partos o compras."
          />
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: REGISTRAR PARTO (CRÍA)                                          */}
      {/* ======================================================================= */}
      {showPartoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-[#1b5e37]" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#1e5837]">
                    Unidad Productiva: Porcinos · Proceso: Cría
                  </div>
                  <h3 className="text-base font-bold text-[#153422]">
                    PORCINOS · REGISTRO DE PARTO Y NACIMIENTOS
                  </h3>
                  <span className="text-[11px] text-[#648070] block">
                    Formación de Lote de Cría · Plantel 34 reproductoras
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPartoModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarParto} className="space-y-3.5 text-xs">
              {/* Madre y Padrillo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Cerda Madre (Caravana) *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. MADRE_01 o C034"
                    value={formParto.madre_id}
                    onChange={(e) => handleMadreOrFechaChange(e.target.value, formParto.fecha_parto)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#235e3b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Padrillo (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="ej. PADRILLO_01"
                    value={formParto.padrillo_id}
                    onChange={(e) => setFormParto({ ...formParto, padrillo_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Identificador de Lote Único (Autosugerido pero Editable) */}
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Identificador de Lote Único *:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="ej. LOTE_CRIA_MADRE01_20250201"
                    value={formParto.lote_generado_id}
                    onChange={(e) => setFormParto({ ...formParto, lote_generado_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f3f9f4] text-[#1b4b2e] font-mono font-bold outline-none focus:bg-white"
                  />
                  <span className="text-[10px] text-[#638070] mt-0.5 block">
                    Este identificador persiste en todo el ciclo y se utilizará al seleccionar la camada para el Destete.
                  </span>
                </div>
              </div>

              {/* Fecha y Campaña */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fecha del Parto *:
                  </label>
                  <input
                    type="date"
                    required
                    value={formParto.fecha_parto}
                    onChange={(e) => handleMadreOrFechaChange(formParto.madre_id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Campaña Asignada:
                  </label>
                  <select
                    value={formParto.campana_id}
                    onChange={(e) => setFormParto({ ...formParto, campana_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none focus:bg-white"
                  >
                    {(db.D_Campana || []).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nacidos Vivos, Muertos y Bajas Iniciales */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#f5f9f6] border border-[#dbe7dc]">
                <div>
                  <label className="block font-semibold text-[#183a26] mb-1">
                    Nacidos Vivos *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    required
                    value={formParto.nacidos_vivos}
                    onChange={(e) => setFormParto({ ...formParto, nacidos_vivos: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white text-[#183123] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#7c2929] mb-1">
                    Nac. Muertos:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formParto.nacidos_muertos}
                    onChange={(e) => setFormParto({ ...formParto, nacidos_muertos: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white text-[#7c2929] font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#6d7920] mb-1">
                    Bajas Lactancia:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formParto.bajas_lactancia}
                    onChange={(e) => setFormParto({ ...formParto, bajas_lactancia: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c8d8ca] bg-white text-[#55601a] font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Observaciones:
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de parición, peso camada o estado de la madre..."
                  value={formParto.observaciones}
                  onChange={(e) => setFormParto({ ...formParto, observaciones: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPartoModal(false)}
                  className="px-4 py-2 border border-[#cbd8cb] text-[#557160] hover:text-[#183123] hover:bg-[#f3f7f3] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Formar Lote</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: REGISTRAR DESTETE (CRÍA → DESTETE/RECRÍA)                      */}
      {/* ======================================================================= */}
      {showDesteteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <MoveRight className="w-5 h-5 text-[#1b5e37]" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#1e5837]">
                    Unidad Productiva: Porcinos · Proceso: Destete/Recría
                  </div>
                  <h3 className="text-base font-bold text-[#153422]">
                    PORCINOS · DESTETE DE CAMADA
                  </h3>
                  <span className="text-[11px] text-[#648070] block">
                    Pase de Cría a Destete/Recría con pesaje e indicador GDP
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesteteModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDestete} className="space-y-3.5 text-xs">
              {/* Selección de Lote Registrado Previamente en Cría */}
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Seleccionar Lote Registrado en Cría *:
                </label>
                <select
                  required
                  value={formDestete.lote_cria_id}
                  onChange={(e) => handleSelectLoteCriaParaDestete(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f5faf6] text-[#164327] font-mono font-bold outline-none focus:bg-white"
                >
                  <option value="">-- Seleccionar lote de cría --</option>
                  {(db.Partos || []).map(p => {
                    const nac = Number(p.nacidos_vivos) || 0;
                    const baj = Number(p.bajas_lactancia) || 0;
                    const adop = Number(p.adopciones_transferencias) || 0;
                    const dest = Number(p.destetados) || 0;
                    const disp = Math.max(0, nac - baj + adop - dest);
                    const loteId = p.lote_generado_id || p.id;
                    return (
                      <option key={p.id} value={loteId}>
                        {loteId} (Madre {p.madre_id} · {disp} disp. / {dest} ya dest.)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Panel Informativo Recuperado Automáticamente del Lote */}
              {infoLoteSeleccionadoDestete && (
                <div className="p-3.5 rounded-xl bg-[#edf6f0] border border-[#c6e5cf] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#144428]">
                    <span>Datos Recuperados de Cría:</span>
                    <span className="font-mono text-[#1a6639]">
                      Camada Madre: {infoLoteSeleccionadoDestete.madreId}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-white p-2 rounded-lg border border-[#c8e2ce]">
                      <span className="text-[#648070] block">Fecha Parto</span>
                      <span className="font-mono font-bold text-[#1a442a]">{infoLoteSeleccionadoDestete.fechaParto}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#c8e2ce]">
                      <span className="text-[#648070] block">Días Lactancia</span>
                      <span className="font-mono font-bold text-[#1a442a]">{infoLoteSeleccionadoDestete.diasLactancia} días</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#c8e2ce]">
                      <span className="text-[#648070] block">Disp. a Destetar</span>
                      <span className="font-mono font-bold text-[#1b7a3d] text-xs">{infoLoteSeleccionadoDestete.cantidadDisponible} cab.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha de Destete y Cantidad Efectivamente Destetada */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fecha de Destete *:
                  </label>
                  <input
                    type="date"
                    required
                    value={formDestete.fecha_destete}
                    onChange={(e) => setFormDestete({ ...formDestete, fecha_destete: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Cantidad a Destetar (Cabezas) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={infoLoteSeleccionadoDestete?.cantidadDisponible || 30}
                    required
                    value={formDestete.destetados}
                    onChange={(e) => setFormDestete({ ...formDestete, destetados: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-bold outline-none focus:bg-white"
                  />
                  <span className="text-[10px] text-[#61806f] mt-0.5 block">
                    Admite destetes parciales.
                  </span>
                </div>
              </div>

              {/* Peso Promedio y Lote Destino de Recría */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Peso Promedio Destete (kg) *:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="4"
                    max="20"
                    required
                    placeholder="ej. 8.5"
                    value={formDestete.peso_promedio_destete}
                    onChange={(e) => setFormDestete({ ...formDestete, peso_promedio_destete: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-bold outline-none focus:bg-white"
                  />
                  {infoLoteSeleccionadoDestete && (
                    <span className="text-[10px] text-[#1f6b3e] font-semibold mt-0.5 block">
                      GDP estimada: {infoLoteSeleccionadoDestete.gdpLactancia} kg/día
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Lote Destino (Recría) *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. LOTE_REC_MADRE01_202502"
                    value={formDestete.lote_destino_id}
                    onChange={(e) => setFormDestete({ ...formDestete, lote_destino_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-semibold outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Observaciones:
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de pesaje, corrales de destino en recría o novedades sanitarias..."
                  value={formDestete.observaciones}
                  onChange={(e) => setFormDestete({ ...formDestete, observaciones: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDesteteModal(false)}
                  className="px-4 py-2 border border-[#cbd8cb] text-[#557160] hover:text-[#183123] hover:bg-[#f3f7f3] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Destete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: REGISTRAR NOVEDAD LACTANCIA (BAJAS O TRANSFERENCIAS)             */}
      {/* ======================================================================= */}
      {showNovedadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#216139]" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#1e5837]">
                    Unidad Productiva: Porcinos · Cría
                  </div>
                  <h3 className="text-base font-bold text-[#153422]">
                    PORCINOS · NOVEDADES EN LACTANCIA
                  </h3>
                  <span className="text-[11px] text-[#648070] block">
                    Bajas Perinatales o Transferencias entre Camadas
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNovedadModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNovedad} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Camada / Parto Afectado:
                </label>
                <select
                  value={formNovedad.parto_id}
                  onChange={(e) => setFormNovedad({ ...formNovedad, parto_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                >
                  {(db.Partos || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lote_generado_id || p.id} (Madre: {p.madre_id} · {p.fecha_parto})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Tipo de Novedad:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormNovedad({ ...formNovedad, tipo: 'BAJA' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      formNovedad.tipo === 'BAJA'
                        ? 'bg-[#fdf2f2] border-[#f4b6b6] text-[#9c2d2d]'
                        : 'bg-[#fbfdfb] border-[#d8e3d8] text-[#5b7566]'
                    }`}
                  >
                    Baja por Mortalidad
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormNovedad({ ...formNovedad, tipo: 'TRANSFERENCIA' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      formNovedad.tipo === 'TRANSFERENCIA'
                        ? 'bg-[#eaf4ed] border-[#bfe2cb] text-[#196d39]'
                        : 'bg-[#fbfdfb] border-[#d8e3d8] text-[#5b7566]'
                    }`}
                  >
                    Adopción / Transferencia
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Cantidad (Cabezas) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formNovedad.cantidad}
                    onChange={(e) => setFormNovedad({ ...formNovedad, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fecha del Evento:
                  </label>
                  <input
                    type="date"
                    required
                    value={formNovedad.fecha}
                    onChange={(e) => setFormNovedad({ ...formNovedad, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono"
                  />
                </div>
              </div>

              {formNovedad.tipo === 'TRANSFERENCIA' && (
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Camada Receptora (Adopción) *:
                  </label>
                  <select
                    required
                    value={formNovedad.lote_destino_transferencia}
                    onChange={(e) => setFormNovedad({ ...formNovedad, lote_destino_transferencia: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                  >
                    <option value="">-- Seleccionar camada nodriza / receptora --</option>
                    {(db.Partos || []).filter(p => p.id !== formNovedad.parto_id).map(p => (
                      <option key={p.id} value={p.lote_generado_id || p.id}>
                        {p.lote_generado_id || p.id} (Madre: {p.madre_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Motivo / Causa:
                </label>
                <input
                  type="text"
                  required
                  placeholder={formNovedad.tipo === 'BAJA' ? 'ej. Aplastamiento, debilidad congénita...' : 'ej. Camada numerosa, madre con mastitis...'}
                  value={formNovedad.motivo}
                  onChange={(e) => setFormNovedad({ ...formNovedad, motivo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNovedadModal(false)}
                  className="px-4 py-2 border border-[#cbd8cb] text-[#557160] hover:text-[#183123] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Novedad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 4: REGISTRAR PASE / BAJA GENERAL                                  */}
      {/* ======================================================================= */}
      {showPaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-[#1b5e37]" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#1e5837]">
                    Unidad Productiva: Porcinos · Piara
                  </div>
                  <h3 className="text-base font-bold text-[#153422]">
                    PORCINOS · REGISTRO DE MOVIMIENTO FÍSICO / PASE
                  </h3>
                  <span className="text-[11px] text-[#648070] block">
                    Pases entre Fases, Bajas o Ventas a Faena
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaseModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPase} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Lote Afectado *:
                </label>
                <select
                  required
                  value={formPase.lote_id}
                  onChange={(e) => setFormPase({ ...formPase, lote_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                >
                  <option value="">-- Seleccionar lote --</option>
                  {db.Lotes_Animales?.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.codigo_lote} ({l.cabezas_actuales} cab. en {l.fase_actual_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Tipo de Evento:
                  </label>
                  <select
                    value={formPase.tipo_evento}
                    onChange={(e) => setFormPase({ ...formPase, tipo_evento: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                  >
                    <option value="PASE_FASE">Pase de Fase</option>
                    <option value="MUERTE">Muerte</option>
                    <option value="DESCARTE">Descarte</option>
                    <option value="AJUSTE">Ajuste de Censo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fase Destino:
                  </label>
                  <select
                    value={formPase.fase_destino_id}
                    onChange={(e) => setFormPase({ ...formPase, fase_destino_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-semibold outline-none"
                  >
                    {db.Fases_Proceso?.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre} ({f.peso_min}-{f.peso_max} kg)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Cabezas Afectadas *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPase.cantidad_cabezas}
                    onChange={(e) => setFormPase({ ...formPase, cantidad_cabezas: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Kilos Totales de Balanza *:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formPase.kg_totales}
                    onChange={(e) => setFormPase({ ...formPase, kg_totales: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Motivo / Observaciones:
                </label>
                <input
                  type="text"
                  placeholder="Detalles del movimiento o causa de baja..."
                  value={formPase.motivo}
                  onChange={(e) => setFormPase({ ...formPase, motivo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaseModal(false)}
                  className="px-4 py-2 border border-[#cbd8cb] text-[#557160] hover:text-[#183123] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Movimiento</span>
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
        unit={detailRecord?.unit || 'PORCINOS'}
        title={detailRecord?.title || ''}
        db={db}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
};
