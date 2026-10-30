/**
 * @file AuditoriaView.tsx
 * @description Módulo de Administración: Auditoría y Trazabilidad Forense
 * Establecimiento Pozo del Carril – La Aguada (UNRC)
 * Permite:
 * 1. Pestaña 1 – Registros: Búsqueda y filtrado transversal (Porcinos, Bovinos, Ovinos, Administración).
 *    Acciones por registro: Ver Detalle, Editar (campos autorizados), Ver Historial y Rectificar.
 * 2. Pestaña 2 – Historial de Modificaciones: Bitácora completa e inmutable de cambios y accesos.
 * 3. Pestaña 3 – Rectificaciones: Consulta de operaciones críticas rectificadas con motivo y trazabilidad.
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  UserCheck, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  X, 
  Lock, 
  Calendar, 
  User, 
  Building2, 
  Truck, 
  Scale, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Download,
  Check
} from 'lucide-react';
import { BaseDatosPorcina, AuditoriaCambio, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { RecordDetailModal } from '../components/RecordDetailModal';
import { dbManager } from '../lib/storage';
import { ModuleKey } from '../components/Sidebar';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
  onNavigate?: (moduleKey: ModuleKey) => void;
}

export type UnidadFiltro = 'TODAS' | 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'ADMINISTRACION';

export interface RegistroAuditoriaItem {
  id: string;
  tabla: keyof BaseDatosPorcina;
  unidad: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'ADMINISTRACION';
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario_responsable: string;
  estado: string;
  estado_validacion?: string;
  observacion_validacion?: string;
  esCritico: boolean;
  esEditable: boolean;
  moduloOrigen?: ModuleKey;
  rawRecord: any;
}

export const AuditoriaView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onExportCsv,
  currentUser = null,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'registros' | 'historial' | 'rectificaciones'>('registros');

  // Filtros de la pestaña Registros
  const [filtroUnidad, setFiltroUnidad] = useState<UnidadFiltro>('TODAS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtros de la pestaña Historial
  const [historialSearch, setHistorialSearch] = useState<string>('');
  const [filtroOperacion, setFiltroOperacion] = useState<string>('TODAS');

  // Modales de acción
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<{
    record: any;
    tableName: string;
    unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
    title: string;
  } | null>(null);

  // Modal Edición Administrativa
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RegistroAuditoriaItem | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [editJustification, setEditJustification] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal Rectificación Controlada
  const [rectifyModalOpen, setRectifyModalOpen] = useState(false);
  const [rectifyingItem, setRectifyingItem] = useState<RegistroAuditoriaItem | null>(null);
  const [rectifyMotivo, setRectifyMotivo] = useState<string>('');
  const [rectifyCampo, setRectifyCampo] = useState<string>('');
  const [rectifyValorAnterior, setRectifyValorAnterior] = useState<string>('');
  const [rectifyValorNuevo, setRectifyValorNuevo] = useState<string>('');
  const [isSavingRectify, setIsSavingRectify] = useState(false);

  // Modal Explicación / Info
  const [infoModalMessage, setInfoModalMessage] = useState<{ title: string; text: string } | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const isAdmin = currentUser?.rol_id === 'ROL_ADMIN';

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // =========================================================================
  // RECOPILACIÓN CENTRALIZADA DE REGISTROS DE LAS 3 UNIDADES Y ADMINISTRACIÓN
  // =========================================================================
  const allRegistros: RegistroAuditoriaItem[] = useMemo(() => {
    const list: RegistroAuditoriaItem[] = [];

    // --- PORCINOS: Ventas y Compras ---
    (db.Mov_Comercial_Enc || []).forEach(m => {
      const isCompra = m.tipo_operacion === 'COMPRA';
      const unidad = m.unidad_neg_id === 'UN_OVINOS' ? 'OVINOS' : m.unidad_neg_id === 'UN_BOVINOS' ? 'BOVINOS' : 'PORCINOS';
      list.push({
        id: m.id,
        tabla: 'Mov_Comercial_Enc',
        unidad,
        tipo: isCompra ? 'Compra de Insumos' : 'Venta de Hacienda',
        descripcion: `${isCompra ? 'Factura/Remito' : 'Liquidación Venta'} ${m.numero_comprobante || ''} - Total: $${Number(m.total_final || m.total_neto || 0).toLocaleString('es-AR')}`,
        fecha: m.fecha || m.fecha_creacion || '',
        usuario_responsable: m.creado_por || 'admin',
        estado: m.estado || 'Confirmado',
        estado_validacion: m.estado_validacion,
        observacion_validacion: m.observacion_validacion,
        esCritico: m.estado === 'Confirmado',
        esEditable: true,
        moduloOrigen: isCompra ? 'compras' : 'ventas',
        rawRecord: m
      });
    });

    // --- PORCINOS: Consumo de Alimento ---
    (db.Consumo_Alimento_Real || []).forEach(c => {
      list.push({
        id: c.id,
        tabla: 'Consumo_Alimento_Real',
        unidad: 'PORCINOS',
        tipo: 'Consumo Alimento',
        descripcion: `Consumo ${c.kg_consumidos || 0} kg (${c.insumo_id || ''}) - Lote ${c.lote_id || ''}`,
        fecha: c.fecha || '',
        usuario_responsable: c.creado_por || 'admin',
        estado: c.estado || 'Confirmado',
        estado_validacion: c.estado_validacion,
        observacion_validacion: c.observacion_validacion,
        esCritico: true,
        esEditable: true,
        moduloOrigen: 'alimentacion',
        rawRecord: c
      });
    });

    // --- PORCINOS: Movimientos Físicos ---
    (db.Movimientos_Fisicos || []).forEach(mf => {
      list.push({
        id: mf.id,
        tabla: 'Movimientos_Fisicos',
        unidad: 'PORCINOS',
        tipo: 'Movimiento Hacienda',
        descripcion: `${mf.tipo_evento || 'Movimiento'}: ${mf.cantidad_cabezas || 0} cabezas`,
        fecha: mf.fecha || '',
        usuario_responsable: mf.creado_por || 'admin',
        estado: mf.estado || 'Confirmado',
        estado_validacion: mf.estado_validacion,
        observacion_validacion: mf.observacion_validacion,
        esCritico: true,
        esEditable: true,
        moduloOrigen: 'produccion',
        rawRecord: mf
      });
    });

    // --- PORCINOS: Lotes de Animales ---
    (db.Lotes_Animales || []).forEach(la => {
      list.push({
        id: la.id,
        tabla: 'Lotes_Animales',
        unidad: 'PORCINOS',
        tipo: 'Lote Hacienda Porcina',
        descripcion: `Lote ${la.codigo_lote} (${la.cabezas_actuales} cabezas) - Fase: ${la.fase_actual_id}`,
        fecha: la.fecha_formacion || '',
        usuario_responsable: 'admin',
        estado: la.estado || 'Activo',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'produccion',
        rawRecord: la
      });
    });

    // --- BOVINOS: Ventas de Hacienda Bovinas ---
    (db.Ventas_Hacienda_Bovinas || []).forEach(vb => {
      list.push({
        id: vb.id,
        tabla: 'Ventas_Hacienda_Bovinas',
        unidad: 'BOVINOS',
        tipo: 'Venta de Hacienda Bovina',
        descripcion: `Venta ${vb.categoria} (${vb.cabezas} cab, ${vb.kg_vivos_totales || 0} kg) - DTE: ${vb.dte_numero || ''}`,
        fecha: vb.fecha || '',
        usuario_responsable: 'admin',
        estado: vb.estado || 'Confirmado',
        esCritico: true,
        esEditable: true,
        moduloOrigen: 'ventas',
        rawRecord: vb
      });
    });

    // --- BOVINOS: Pesadas Bovinas ---
    (db.Pesadas_Bovinas || []).forEach(pb => {
      list.push({
        id: pb.id,
        tabla: 'Pesadas_Bovinas',
        unidad: 'BOVINOS',
        tipo: 'Pesada Manga Bovina',
        descripcion: `Pesaje ${pb.lote_o_caravana || pb.id} - Peso: ${pb.peso_kg} kg (ADPV: ${pb.adpv_calculado || 0} kg/día)`,
        fecha: pb.fecha || '',
        usuario_responsable: pb.categoria_id || 'admin',
        estado: 'Confirmado',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'bov_manga',
        rawRecord: pb
      });
    });

    // --- BOVINOS: Eventos Sanitarios Bovinos ---
    (db.Eventos_Sanitarios_Bovinos || []).forEach(sb => {
      list.push({
        id: sb.id,
        tabla: 'Eventos_Sanitarios_Bovinos',
        unidad: 'BOVINOS',
        tipo: 'Sanidad SENASA Bovina',
        descripcion: `${sb.tipo_evento} - ${sb.cabezas_tratadas || 0} cabezas tratadas`,
        fecha: sb.fecha || '',
        usuario_responsable: sb.responsable || 'admin',
        estado: 'Confirmado',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'bov_sanidad',
        rawRecord: sb
      });
    });

    // --- OVINOS: Animales / Majada Ovina ---
    (db.Animales_Ovinos || []).forEach(ao => {
      list.push({
        id: ao.id,
        tabla: 'Animales_Ovinos',
        unidad: 'OVINOS',
        tipo: 'Roster Majada Ovina',
        descripcion: `${ao.caravana_o_lote || ao.id} (${ao.categoria}) - Potrero: ${ao.potrero || 'Potrero 1'}`,
        fecha: ao.fecha_nacimiento_ingreso || '',
        usuario_responsable: 'admin',
        estado: ao.estado_productivo || 'Activo',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'ovi_majada',
        rawRecord: ao
      });
    });

    // --- OVINOS: Zafras Laneras ---
    (db.Zafras_Laneras || []).forEach(zl => {
      list.push({
        id: zl.id,
        tabla: 'Zafras_Laneras',
        unidad: 'OVINOS',
        tipo: 'Zafra Lanera Ovina',
        descripcion: `Zafra ${zl.campana_id} - Esquila: ${zl.kg_lana_total || 0} kg (Finura: ${zl.finura_micras_aprox || 0} µ)`,
        fecha: zl.fecha || '',
        usuario_responsable: 'admin',
        estado: 'Confirmado',
        esCritico: true,
        esEditable: true,
        moduloOrigen: 'ovi_zafra',
        rawRecord: zl
      });
    });

    // --- OVINOS: Eventos Sanitarios Ovinos ---
    (db.Eventos_Sanitarios_Ovinos || []).forEach(so => {
      list.push({
        id: so.id,
        tabla: 'Eventos_Sanitarios_Ovinos',
        unidad: 'OVINOS',
        tipo: 'Sanidad Ovina',
        descripcion: `${so.tipo_evento} - Producto: ${so.producto_aplicado || ''}`,
        fecha: so.fecha || '',
        usuario_responsable: so.responsable || 'admin',
        estado: 'Confirmado',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'ovi_sanidad',
        rawRecord: so
      });
    });

    // --- ADMINISTRACIÓN: Clientes ---
    (db.Clientes || []).forEach(cli => {
      list.push({
        id: cli.id,
        tabla: 'Clientes',
        unidad: 'ADMINISTRACION',
        tipo: 'Cliente Maestro',
        descripcion: `${cli.razon_social} (CUIT: ${cli.cuit}) - ${cli.localidad || 'Río Cuarto'}`,
        fecha: cli.fecha_creacion || '',
        usuario_responsable: 'admin',
        estado: cli.activo ? 'Activo' : 'Inactivo',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'usuarios',
        rawRecord: cli
      });
    });

    // --- ADMINISTRACIÓN: Proveedores ---
    (db.Proveedores || []).forEach(prov => {
      list.push({
        id: prov.id,
        tabla: 'Proveedores',
        unidad: 'ADMINISTRACION',
        tipo: 'Proveedor Maestro',
        descripcion: `${prov.razon_social} (CUIT: ${prov.cuit}) - Rubro: ${prov.tipo_suministro || 'Insumos'}`,
        fecha: prov.fecha_creacion || '',
        usuario_responsable: 'admin',
        estado: prov.activo ? 'Activo' : 'Inactivo',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'usuarios',
        rawRecord: prov
      });
    });

    // --- ADMINISTRACIÓN: Usuarios del Sistema ---
    (db.Usuarios || []).forEach(usr => {
      list.push({
        id: usr.usuario_id,
        tabla: 'Usuarios',
        unidad: 'ADMINISTRACION',
        tipo: 'Cuenta de Usuario',
        descripcion: `${usr.nombre} (@${usr.usuario}) - Rol: ${usr.rol_id}`,
        fecha: usr.fecha_creacion || '',
        usuario_responsable: 'admin',
        estado: usr.activo ? 'Activo' : 'Inactivo',
        esCritico: false,
        esEditable: true,
        moduloOrigen: 'usuarios',
        rawRecord: usr
      });
    });

    // Ordenar por fecha descendente
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [db]);

  // Tipos únicos para el filtro
  const tiposDisponibles = useMemo(() => {
    const set = new Set<string>();
    allRegistros.forEach(r => set.add(r.tipo));
    return Array.from(set).sort();
  }, [allRegistros]);

  // Registros filtrados para la Pestaña 1
  const registrosFiltrados = useMemo(() => {
    return allRegistros.filter(r => {
      if (filtroUnidad !== 'TODAS' && r.unidad !== filtroUnidad) return false;
      if (filtroTipo !== 'TODOS' && r.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'TODOS') {
        const est = (r.estado || '').toLowerCase();
        const target = filtroEstado.toLowerCase();
        if (target === 'observado' && r.estado_validacion !== 'Observado' && est !== 'observado') return false;
        if (target !== 'observado' && !est.includes(target)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          r.id.toLowerCase().includes(q) ||
          r.descripcion.toLowerCase().includes(q) ||
          r.usuario_responsable.toLowerCase().includes(q) ||
          (r.rawRecord?.cuit && r.rawRecord.cuit.toLowerCase().includes(q)) ||
          (r.rawRecord?.numero_comprobante && r.rawRecord.numero_comprobante.toLowerCase().includes(q)) ||
          (r.rawRecord?.dte_numero && r.rawRecord.dte_numero.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allRegistros, filtroUnidad, filtroTipo, filtroEstado, searchQuery]);

  // Registros Rectificados para la Pestaña 3
  const rectificacionesRealizadas = useMemo(() => {
    return (db.Auditoria_Cambios || []).filter(a => a.operacion === 'RECTIFICACION');
  }, [db.Auditoria_Cambios]);

  // Historial filtrado para la Pestaña 2
  const historialFiltrado = useMemo(() => {
    return (db.Auditoria_Cambios || []).filter(a => {
      if (filtroOperacion !== 'TODAS' && a.operacion !== filtroOperacion) return false;
      if (historialSearch.trim()) {
        const q = historialSearch.toLowerCase();
        const match = 
          a.registro_id.toLowerCase().includes(q) ||
          a.detalle.toLowerCase().includes(q) ||
          a.usuario.toLowerCase().includes(q) ||
          a.tabla.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [db.Auditoria_Cambios, filtroOperacion, historialSearch]);

  // =========================================================================
  // HANDLERS DE ACCIONES POR REGISTRO
  // =========================================================================
  const handleOpenDetail = (item: RegistroAuditoriaItem) => {
    setSelectedRecordForDetail({
      record: item.rawRecord,
      tableName: item.tabla,
      unit: item.unidad as any,
      title: `${item.tipo}: ${item.id}`
    });
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (item: RegistroAuditoriaItem) => {
    if (!isAdmin) {
      showToast('error', 'Acceso denegado: Solo administradores pueden modificar registros en Auditoría.');
      return;
    }

    setEditingItem(item);
    // Clonar campos editables relevantes
    const fields: Record<string, any> = { ...item.rawRecord };
    setEditFields(fields);
    setEditJustification('');
    setEditModalOpen(true);
  };

  const handleOpenHistory = (item: RegistroAuditoriaItem) => {
    setActiveTab('historial');
    setHistorialSearch(item.id);
    showToast('info', `Filtrando historial de cambios para el registro ID: ${item.id}`);
  };

  const handleOpenRectify = (item: RegistroAuditoriaItem) => {
    if (!isAdmin) {
      showToast('error', 'Acceso denegado: Solo administradores pueden realizar rectificaciones.');
      return;
    }

    if (!item.esCritico) {
      setInfoModalMessage({
        title: 'Operación no clasificada como crítica',
        text: `El registro "${item.id}" (${item.tipo}) no altera existencias zootécnicas consolidadas ni estados contables definitivos. Puede modificarse directamente mediante la acción "Editar" con registro formal de auditoría.`
      });
      return;
    }

    setRectifyingItem(item);
    setRectifyMotivo('');
    setRectifyCampo('observaciones');
    setRectifyValorAnterior(item.rawRecord.observaciones || '');
    setRectifyValorNuevo('');
    setRectifyModalOpen(true);
  };

  // Guardar Edición Administrativa
  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editJustification.trim()) {
      showToast('error', 'Debe ingresar el motivo o justificación técnica de la modificación.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const now = new Date().toISOString();
      const updatedRecord = {
        ...editingItem.rawRecord,
        ...editFields,
        id: editingItem.id, // ID inmutable
        fecha_modificacion: now,
        modificado_por: currentUser?.usuario || 'admin'
      };

      // Si es cliente/proveedor/usuario, usar metodos específicos de dbManager para sincronización
      let res: any;
      if (editingItem.tabla === 'Clientes') {
        res = await dbManager.saveCliente(updatedRecord);
      } else if (editingItem.tabla === 'Proveedores') {
        res = await dbManager.saveProveedor(updatedRecord);
      } else if (editingItem.tabla === 'Usuarios') {
        res = await dbManager.saveUser(updatedRecord);
      } else {
        res = await onSaveRecord(editingItem.tabla, updatedRecord);
      }

      if (res && res.success === false) {
        showToast('error', res.error || 'Error al guardar la modificación.');
      } else {
        // Registrar log específico con el motivo
        dbManager.addAuditLog(
          editingItem.tabla as string,
          editingItem.id,
          'MODIFICACION',
          `Edición administrativa justificada: "${editJustification.trim()}". Modificado por ${currentUser?.usuario || 'admin'}.`,
          currentUser?.usuario || 'admin'
        );

        showToast('success', `Registro ${editingItem.id} modificado y registrado en la bitácora con éxito.`);
        setEditModalOpen(false);
      }
    } catch (err: any) {
      showToast('error', `Error al guardar: ${err.message || 'Fallo inesperado'}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Guardar Rectificación Controlada
  const handleSaveRectifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectifyingItem) return;

    if (!rectifyMotivo.trim()) {
      showToast('error', 'Debe detallar el motivo y fundamento formal de la rectificación.');
      return;
    }

    setIsSavingRectify(true);
    try {
      const now = new Date().toISOString();
      const user = currentUser?.usuario || 'admin';

      const updatedRecord = {
        ...rectifyingItem.rawRecord,
        id: rectifyingItem.id,
        estado: 'Rectificado',
        [rectifyCampo]: rectifyValorNuevo,
        rectificado_por: user,
        fecha_rectificacion: now,
        motivo_rectificacion: rectifyMotivo.trim(),
        datos_rectificados_anteriores: `${rectifyCampo}: "${rectifyValorAnterior}" -> "${rectifyValorNuevo}"`
      };

      const res = await onSaveRecord(rectifyingItem.tabla, updatedRecord);
      if (res && res.success === false) {
        showToast('error', res.error || 'Error al registrar la rectificación.');
      } else {
        // Registro formal de Rectificación en Auditoría
        dbManager.addAuditLog(
          rectifyingItem.tabla as string,
          rectifyingItem.id,
          'RECTIFICACION',
          `Rectificación formal: Campo [${rectifyCampo}] modificado de "${rectifyValorAnterior}" a "${rectifyValorNuevo}". Motivo: ${rectifyMotivo.trim()}`,
          user
        );

        showToast('success', `Rectificación del registro ${rectifyingItem.id} efectuada con trazabilidad completa.`);
        setRectifyModalOpen(false);
      }
    } catch (err: any) {
      showToast('error', `Error en rectificación: ${err.message || 'Fallo inesperado'}`);
    } finally {
      setIsSavingRectify(false);
    }
  };

  const getUnidadBadge = (unidad: string) => {
    switch (unidad) {
      case 'PORCINOS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#edf6f0] text-[#1c4b31] border border-[#cbe3d2]">PORCINOS</span>;
      case 'BOVINOS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fcf5ef] text-[#78350f] border border-[#f3d9c3]">BOVINOS</span>;
      case 'OVINOS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0f7ff] text-[#1e40af] border border-[#cfe2fe]">OVINOS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">ADMINISTRACIÓN</span>;
    }
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
          toast.type === 'success' ? 'bg-[#14281d] text-white border-[#2b583f]' :
          toast.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#eaf4ec] text-[#1c4b31] rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526b5c]">
              Administración Centralizada · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#14281d] tracking-tight">
            Auditoría, Trazabilidad & Rectificaciones
          </h1>
          <p className="text-xs text-[#526b5c] mt-0.5">
            Búsqueda transversal de registros de las 3 unidades ganaderas, edición controlada con motivo e inmutabilidad forense
          </p>
        </div>

        {/* Pestañas Principales Solicitadas (Req 2) */}
        <div className="flex items-center p-1 bg-[#edf3ee] border border-[#cfdece] rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('registros')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'registros'
                ? 'bg-white text-[#14281d] shadow-xs'
                : 'text-[#526b5c] hover:text-[#14281d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#1c4b31]" />
            <span>Pestaña 1 – Registros ({allRegistros.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-white text-[#14281d] shadow-xs'
                : 'text-[#526b5c] hover:text-[#14281d]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#1c4b31]" />
            <span>Pestaña 2 – Historial de Modificaciones ({db.Auditoria_Cambios?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rectificaciones')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rectificaciones'
                ? 'bg-white text-[#14281d] shadow-xs'
                : 'text-[#526b5c] hover:text-[#14281d]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1c4b31]" />
            <span>Pestaña 3 – Rectificaciones ({rectificacionesRealizadas.length})</span>
          </button>
        </div>
      </div>

      {/* Regla de Control Administrativo & Integridad Forense */}
      <div className="bg-[#fcfaf4] border border-[#ecd9b8] rounded-xl p-3.5 text-xs text-[#714d18] flex items-start gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-[#8a5d1b] shrink-0 mt-0.5" />
        <div>
          <strong>Protocolo Oficial de Auditoría y Control (UNRC):</strong> Las operaciones críticas confirmadas (hacienda, ventas, compras, consumos) <strong>no pueden eliminarse ni sobrescribirse silenciosamente</strong>. Toda modificación requiere justificación técnica obligatoria que queda asentada en la bitácora con identificación del usuario administrador responsable. Las rectificaciones de datos comerciales generan un evento formal inmutable sin alterar el ID original.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: REGISTROS GENERALES TRANSVERSALES                              */}
      {/* ========================================================================= */}
      {activeTab === 'registros' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Buscador */}
              <div className="md:col-span-1 relative">
                <label className="block text-[11px] font-semibold text-[#526b5c] mb-1">Buscar por ID, Comprobante o Texto</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#688574]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ID, comprobante, DTE, nombre..."
                    className="w-full pl-8 pr-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-[#fbfdfb] text-[#14281d] focus:outline-none focus:ring-1 focus:ring-[#1c4b31]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro Unidad Productiva */}
              <div>
                <label className="block text-[11px] font-semibold text-[#526b5c] mb-1">Unidad Productiva</label>
                <select
                  value={filtroUnidad}
                  onChange={e => setFiltroUnidad(e.target.value as UnidadFiltro)}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white text-[#14281d] font-medium"
                >
                  <option value="TODAS">Todas las Unidades (Global)</option>
                  <option value="PORCINOS">Porcinos (Semi-intensivo)</option>
                  <option value="BOVINOS">Bovinos (Cría & Cabaña Angus)</option>
                  <option value="OVINOS">Ovinos (Majada & Lana)</option>
                  <option value="ADMINISTRACION">Administración & Maestros</option>
                </select>
              </div>

              {/* Filtro Tipo de Operación */}
              <div>
                <label className="block text-[11px] font-semibold text-[#526b5c] mb-1">Tipo de Operación</label>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white text-[#14281d] font-medium"
                >
                  <option value="TODOS">Todos los Tipos de Operación</option>
                  {tiposDisponibles.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div>
                <label className="block text-[11px] font-semibold text-[#526b5c] mb-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white text-[#14281d] font-medium"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Observado">Observado (Inconsistente)</option>
                  <option value="Rectificado">Rectificado</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ee] text-xs text-[#526b5c]">
              <span>Mostrando <strong>{registrosFiltrados.length}</strong> de {allRegistros.length} registros auditables</span>
              {(filtroUnidad !== 'TODAS' || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroUnidad('TODAS');
                    setFiltroTipo('TODOS');
                    setFiltroEstado('TODOS');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-[#1c4b31] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f4f7f5] border-b border-[#d6e3d8] text-[11px] font-bold text-[#335441] uppercase tracking-wider">
                    <th className="p-3.5">ID Registro</th>
                    <th className="p-3.5">Unidad</th>
                    <th className="p-3.5">Tipo Operación</th>
                    <th className="p-3.5">Detalle / Descripción</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Responsable</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-center">Acciones de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef3ef]">
                  {registrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#526b5c]">
                        No se encontraron registros que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    registrosFiltrados.map((item, idx) => (
                      <tr key={`${item.tabla}_${item.id || 'reg'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#14281d] whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {getUnidadBadge(item.unidad)}
                        </td>
                        <td className="p-3.5 font-semibold text-[#14281d] whitespace-nowrap">
                          {item.tipo}
                        </td>
                        <td className="p-3.5 text-[#526b5c] max-w-xs truncate" title={item.descripcion}>
                          {item.descripcion}
                        </td>
                        <td className="p-3.5 font-mono text-[#526b5c] whitespace-nowrap">
                          {item.fecha || '—'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                          @{item.usuario_responsable}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {item.estado_validacion === 'Observado' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Observado
                            </span>
                          ) : item.estado === 'Rectificado' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              Rectificado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.estado}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Ver Detalle */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              className="px-2.5 py-1 bg-white hover:bg-[#edf4ee] border border-[#cbe1d3] text-[#1c4b31] rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Ver detalle completo del registro"
                            >
                              <Eye className="w-3 h-3 text-[#1c4b31]" />
                              <span>Ver</span>
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 border cursor-pointer ${
                                isAdmin
                                  ? 'bg-[#1c4b31] hover:bg-[#153a26] text-white border-[#173e28]'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              }`}
                              title={isAdmin ? "Editar campos autorizados con justificación" : "Exclusivo Administrador"}
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            {/* Ver Historial */}
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(item)}
                              className="px-2.5 py-1 bg-white hover:bg-[#f1f5f9] border border-slate-300 text-slate-700 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Ver historial de cambios de este registro"
                            >
                              <History className="w-3 h-3 text-slate-500" />
                              <span>Historial</span>
                            </button>

                            {/* Rectificar */}
                            <button
                              type="button"
                              onClick={() => handleOpenRectify(item)}
                              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 border cursor-pointer ${
                                item.esCritico && isAdmin
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-pointer'
                              }`}
                              title={item.esCritico ? "Procedimiento formal de rectificación controlada" : "Consultar estado"}
                            >
                              <ShieldCheck className="w-3 h-3 text-amber-700" />
                              <span>Rectificar</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: HISTORIAL DE MODIFICACIONES (BITÁCORA INMUTABLE)               */}
      {/* ========================================================================= */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#688574]" />
                <input
                  type="text"
                  value={historialSearch}
                  onChange={e => setHistorialSearch(e.target.value)}
                  placeholder="Buscar en historial por ID, usuario, detalle..."
                  className="pl-8 pr-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-[#fbfdfb] text-[#14281d] w-64"
                />
                {historialSearch && (
                  <button
                    onClick={() => setHistorialSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={filtroOperacion}
                onChange={e => setFiltroOperacion(e.target.value)}
                className="px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white text-[#14281d] font-medium"
              >
                <option value="TODAS">Todas las Operaciones</option>
                <option value="ALTA">Alta</option>
                <option value="MODIFICACION">Modificación</option>
                <option value="RECTIFICACION">Rectificación</option>
                <option value="ANULACION">Anulación</option>
                <option value="ESTADO">Cambio de Estado</option>
                <option value="SEGURIDAD">Seguridad / Claves</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => onExportCsv('Auditoria_Cambios')}
              className="px-3.5 py-1.5 bg-white hover:bg-[#f1f5f9] border border-[#c8d9cc] text-[#14281d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#1c4b31]" />
              <span>Exportar Bitácora (CSV)</span>
            </button>
          </div>

          <div className="bg-white border border-[#d6e3d8] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f4f7f5] border-b border-[#d6e3d8] text-[11px] font-bold text-[#335441] uppercase tracking-wider">
                    <th className="p-3.5">Fecha y Hora</th>
                    <th className="p-3.5">Usuario Responsable</th>
                    <th className="p-3.5">Tabla / Entidad</th>
                    <th className="p-3.5">ID Registro</th>
                    <th className="p-3.5">Operación</th>
                    <th className="p-3.5">Detalle / Motivo Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef3ef]">
                  {historialFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#526b5c]">
                        No se registran eventos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    historialFiltrado.map((h, idx) => (
                      <tr key={`${h.id || 'hist'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
                        <td className="p-3.5 font-mono text-[#526b5c] whitespace-nowrap">
                          {new Date(h.fecha_hora).toLocaleString('es-AR')}
                        </td>
                        <td className="p-3.5 font-semibold text-[#14281d] whitespace-nowrap">
                          @{h.usuario}
                        </td>
                        <td className="p-3.5 font-mono text-[#1c4b31] whitespace-nowrap">
                          {h.tabla}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {h.registro_id}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            h.operacion === 'RECTIFICACION' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            h.operacion === 'ALTA' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            h.operacion === 'ANULACION' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                            h.operacion === 'SEGURIDAD' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {h.operacion}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 leading-relaxed max-w-lg">
                          {h.detalle}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: RECTIFICACIONES DE OPERACIONES CRÍTICAS (REQ 2 & 6)             */}
      {/* ========================================================================= */}
      {activeTab === 'rectificaciones' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#14281d] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1c4b31]" />
              <span>Registro Oficial de Operaciones Críticas Rectificadas</span>
            </h3>
            <p className="text-xs text-[#526b5c] mt-1">
              Bitácora de operaciones donde se aplicó el procedimiento formal de rectificación contable o zootécnica. Conserva los datos originales, el motivo fundamentado y los valores corregidos para inspección forense.
            </p>
          </div>

          <div className="bg-white border border-[#d6e3d8] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f4f7f5] border-b border-[#d6e3d8] text-[11px] font-bold text-[#335441] uppercase tracking-wider">
                    <th className="p-3.5">Fecha y Hora</th>
                    <th className="p-3.5">ID Registro Original</th>
                    <th className="p-3.5">Tabla / Entidad</th>
                    <th className="p-3.5">Usuario Autorizante</th>
                    <th className="p-3.5">Motivo y Detalle de la Rectificación</th>
                    <th className="p-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef3ef]">
                  {rectificacionesRealizadas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#526b5c]">
                        <div className="max-w-md mx-auto space-y-2">
                          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                          <div className="font-bold text-[#14281d]">Sin rectificaciones registradas</div>
                          <p className="text-xs text-[#526b5c]">
                            Las operaciones críticas se encuentran en su estado original confirmado. Para efectuar una rectificación formal controlada, seleccione el registro en la <strong>Pestaña 1 – Registros</strong> y presione el botón <em>Rectificar</em>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rectificacionesRealizadas.map((r, idx) => (
                      <tr key={`${r.id || 'rect'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
                        <td className="p-3.5 font-mono text-[#526b5c] whitespace-nowrap">
                          {new Date(r.fecha_hora).toLocaleString('es-AR')}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-purple-900 whitespace-nowrap">
                          {r.registro_id}
                        </td>
                        <td className="p-3.5 font-mono text-[#1c4b31] whitespace-nowrap">
                          {r.tabla}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          @{r.usuario}
                        </td>
                        <td className="p-3.5 text-slate-700 leading-relaxed">
                          {r.detalle}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('historial');
                              setHistorialSearch(r.registro_id);
                            }}
                            className="px-2.5 py-1 bg-[#edf4ee] hover:bg-[#dbe9dd] text-[#1c4b31] rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Trazabilidad
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DETALLE DE REGISTRO & TRAZABILIDAD (REQ 4)                       */}
      {/* ========================================================================= */}
      {selectedRecordForDetail && (
        <RecordDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedRecordForDetail(null);
          }}
          record={selectedRecordForDetail.record}
          tableName={selectedRecordForDetail.tableName}
          unit={selectedRecordForDetail.unit}
          title={selectedRecordForDetail.title}
          db={db}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDICIÓN ADMINISTRATIVA CONTROLADA (REQ 5)                        */}
      {/* ========================================================================= */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-[#d8e2d7] animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#edf6f0] text-[#1c4b31] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#1c4b31] block">
                    {editingItem.unidad} · EDICIÓN ADMINISTRATIVA CONTROLADA
                  </span>
                  <h3 className="font-bold text-sm text-[#143222]">
                    Modificar Registro: {editingItem.id} ({editingItem.tipo})
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-4 text-xs">
              {/* Información General y Bloqueo de ID */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 block">ID Registro (Inmutable):</span>
                  <span className="font-mono font-bold text-slate-800">{editingItem.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Tabla Afectada:</span>
                  <span className="font-mono text-[#1c4b31]">{editingItem.tabla}</span>
                </div>
              </div>

              {/* Campos Editables según el tipo de registro */}
              <div className="space-y-3">
                {/* Si es Cliente / Proveedor */}
                {(editingItem.tabla === 'Clientes' || editingItem.tabla === 'Proveedores') && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#14281d] mb-1">Razón Social (*)</label>
                      <input
                        type="text"
                        required
                        value={editFields.razon_social || ''}
                        onChange={e => setEditFields({ ...editFields, razon_social: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14281d] mb-1">Localidad</label>
                        <input
                          type="text"
                          value={editFields.localidad || ''}
                          onChange={e => setEditFields({ ...editFields, localidad: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14281d] mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={editFields.telefono || ''}
                          onChange={e => setEditFields({ ...editFields, telefono: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Si es Usuario */}
                {editingItem.tabla === 'Usuarios' && (
                  <>
                    <div>
                      <label className="block font-semibold text-[#14281d] mb-1">Nombre Completo (*)</label>
                      <input
                        type="text"
                        required
                        value={editFields.nombre || ''}
                        onChange={e => setEditFields({ ...editFields, nombre: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14281d] mb-1">Rol Operativo</label>
                      <select
                        value={editFields.rol_id || ''}
                        onChange={e => setEditFields({ ...editFields, rol_id: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white"
                      >
                        <option value="ROL_OPERARIO">Operario</option>
                        <option value="ROL_ENCARGADO">Encargado</option>
                        <option value="ROL_ADMIN">Administrador General</option>
                        <option value="ROL_AUDITOR">Auditor</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Si es Comprobante Comercial o Consumo / Pesada / Sanidad */}
                {editingItem.tabla !== 'Clientes' && editingItem.tabla !== 'Proveedores' && editingItem.tabla !== 'Usuarios' && (
                  <div>
                    <label className="block font-semibold text-[#14281d] mb-1">Observaciones / Anotaciones Técnicas (*)</label>
                    <textarea
                      rows={2}
                      value={editFields.observaciones || ''}
                      onChange={e => setEditFields({ ...editFields, observaciones: e.target.value })}
                      placeholder="Actualización de detalle informativo..."
                      className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs"
                    />
                  </div>
                )}

                {/* Justificación Obligatoria de Auditoría (Req 5) */}
                <div className="pt-2 border-t border-[#edf3ee]">
                  <label className="block font-bold text-amber-900 mb-1">
                    Motivo / Justificación Técnica de la Modificación (*)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editJustification}
                    onChange={e => setEditJustification(e.target.value)}
                    placeholder="Especifique el fundamento de la modificación administrativa para constancia en bitácora..."
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/40 text-amber-950 focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-[#526b5c] block mt-0.5">
                    Este motivo se registrará de forma permanente en <code>Auditoria_Cambios</code> con su firma de usuario (@{currentUser?.usuario || 'admin'}).
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-[#e5eee5] flex items-center justify-between">
                {editingItem.moduloOrigen && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      onNavigate(editingItem.moduloOrigen!);
                    }}
                    className="text-xs text-[#1c4b31] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ir al módulo original</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#c8d9cc] text-[#526b5c] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-lg bg-[#1c4b31] hover:bg-[#153a26] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingEdit ? 'Guardando...' : 'Guardar Modificación'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROCEDIMIENTO FORMAL DE RECTIFICACIÓN CONTROLADA (REQ 6)         */}
      {/* ========================================================================= */}
      {rectifyModalOpen && rectifyingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-amber-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 block">
                    OPERACIÓN CRÍTICA · RECTIFICACIÓN CONTROLADA
                  </span>
                  <h3 className="font-bold text-sm text-[#14281d]">
                    Rectificar Registro: {rectifyingItem.id}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRectifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Procedimiento de Rectificación Inmutable:</strong> La rectificación no destruye el registro original. Deja constancia en la bitácora de auditoría del valor previo, el nuevo valor adoptado y el motivo justificado con su usuario responsable.
            </div>

            <form onSubmit={handleSaveRectifySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#14281d] mb-1">Campo a Rectificar</label>
                <select
                  value={rectifyCampo}
                  onChange={e => {
                    const c = e.target.value;
                    setRectifyCampo(c);
                    setRectifyValorAnterior(String(rectifyingItem.rawRecord[c] || ''));
                  }}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-xs bg-white font-medium"
                >
                  <option value="observaciones">Observaciones / Detalle Comercial</option>
                  <option value="condicion_pago">Condición de Pago</option>
                  <option value="numero_comprobante">Número de Comprobante / DTE</option>
                  <option value="estado">Estado Operativo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Valor Anterior (Registrado)</label>
                  <input
                    type="text"
                    disabled
                    value={rectifyValorAnterior || '(Vacío)'}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#14281d] mb-1">Valor Rectificado (*)</label>
                  <input
                    type="text"
                    required
                    value={rectifyValorNuevo}
                    onChange={e => setRectifyValorNuevo(e.target.value)}
                    placeholder="Nuevo valor a asentar..."
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Motivo / Fundamentación de la Rectificación (*)</label>
                <textarea
                  rows={2}
                  required
                  value={rectifyMotivo}
                  onChange={e => setRectifyMotivo(e.target.value)}
                  placeholder="Explique el error involuntario o motivo formal de la rectificación..."
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/50"
                />
              </div>

              <div className="pt-3 border-t border-[#edf3ee] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRectifyModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#c8d9cc] text-[#526b5c] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingRectify}
                  className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSavingRectify ? 'Procesando...' : 'Confirmar Rectificación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INFORMACIÓN TÉCNICA / EXPLICACIÓN                                */}
      {/* ========================================================================= */}
      {infoModalMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#14281d]">{infoModalMessage.title}</h3>
            </div>
            <p className="text-xs text-[#526b5c] leading-relaxed">
              {infoModalMessage.text}
            </p>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModalMessage(null)}
                className="px-4 py-2 bg-[#1c4b31] hover:bg-[#153a26] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
