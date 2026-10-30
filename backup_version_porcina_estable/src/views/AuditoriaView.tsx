/**
 * @file AuditoriaView.tsx
 * @description Módulo de Auditoría y Trazabilidad Forense
 * Bandeja de Registros Observados (cargados en Sheets a mano con inconsistencias),
 * historial de modificaciones, anulaciones con motivo, reaperturas y registros de acceso.
 */

import React, { useState } from 'react';
import { ShieldAlert, History, AlertTriangle, CheckCircle, FileText, UserCheck, Search, Filter } from 'lucide-react';
import { BaseDatosPorcina, AuditoriaCambio } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
}

export const AuditoriaView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onExportCsv
}) => {
  const [activeTab, setActiveTab] = useState<'observados' | 'historial' | 'accesos'>('observados');

  // Recopilar todos los registros con estado_validacion === 'Observado' de todas las tablas
  const registrosObservados = [
    ...db.Mov_Comercial_Enc.filter(r => r.estado_validacion === 'Observado').map(r => ({ ...r, _tabla: 'Mov_Comercial_Enc' })),
    ...db.Consumo_Alimento_Real.filter(r => r.estado_validacion === 'Observado').map(r => ({ ...r, _tabla: 'Consumo_Alimento_Real' })),
    ...db.Movimientos_Fisicos.filter(r => r.estado_validacion === 'Observado').map(r => ({ ...r, _tabla: 'Movimientos_Fisicos' })),
    ...db.F_Costos.filter(r => r.estado_validacion === 'Observado').map(r => ({ ...r, _tabla: 'F_Costos' })),
    ...db.F_Ingresos.filter(r => r.estado_validacion === 'Observado').map(r => ({ ...r, _tabla: 'F_Ingresos' }))
  ];

  // Historial de auditoría
  const historialCambios = db.Auditoria_Cambios.filter(a => a.operacion !== 'LOGIN');
  const historialAccesos = db.Auditoria_Cambios.filter(a => a.operacion === 'LOGIN');

  // Resolver registro observado (marcar como OK si se corrigió)
  const handleResolverObservado = async (item: any) => {
    const confirmacion = confirm(`¿Desea marcar como verificado y corregido el registro ${item.id} de la tabla ${item._tabla}?`);
    if (confirmacion) {
      await onSaveRecord(item._tabla as keyof BaseDatosPorcina, {
        ...item,
        estado_validacion: 'OK',
        observacion_validacion: 'Subsanado y verificado desde el panel de Auditoría'
      });
    }
  };

  // Columnas para Registros Observados
  const columnsObservados: Column<any>[] = [
    { key: 'id', header: 'ID Registro' },
    { key: '_tabla', header: 'Tabla en Sheets' },
    { 
      key: 'fecha', 
      header: 'Fecha Registro',
      render: (r) => r.fecha || r.fecha_creacion || '—'
    },
    { 
      key: 'observacion_validacion', 
      header: 'Motivo de Observación / Inconsistencia',
      render: (r) => (
        <span className="text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200 block whitespace-normal">
          {r.observacion_validacion || 'Inconsistencia formal detectada en la planilla'}
        </span>
      )
    },
    { 
      key: 'estado', 
      header: 'Estado', 
      render: (r) => <StatusTag estado={r.estado_validacion} motivo={r.observacion_validacion} /> 
    },
    {
      key: 'acciones',
      header: 'Acción',
      align: 'center',
      render: (r) => (
        <button
          onClick={() => handleResolverObservado(r)}
          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#1d4c32] hover:bg-[#153e27] rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer border border-[#163c26]"
        >
          Marcar Verificado
        </button>
      )
    }
  ];

  // Columnas para Historial de Cambios
  const columnsHistorial: Column<AuditoriaCambio>[] = [
    { 
      key: 'fecha_hora', 
      header: 'Fecha y Hora',
      render: (a) => (
        <span className="font-mono text-[#254231]">
          {new Date(a.fecha_hora).toLocaleString('es-AR')}
        </span>
      )
    },
    { key: 'usuario', header: 'Usuario Responsable' },
    { key: 'operacion', header: 'Operación' },
    { key: 'tabla', header: 'Tabla Afectada' },
    { key: 'registro_id', header: 'ID Registro' },
    { 
      key: 'detalle', 
      header: 'Detalle del Evento',
      render: (a) => <span className="whitespace-normal">{a.detalle}</span>
    }
  ];

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Módulo de Auditoría & Trazabilidad Ganadera
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Forense & Seguridad
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Control de registros observados de Google Sheets, historial de transacciones y registro de accesos
          </p>
        </div>

        {/* Pestañas de auditoría */}
        <div className="flex items-center p-1 bg-[#ebf0ea] border border-[#d2ded1] rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('observados')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'observados' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            <span>Bandeja de Observados</span>
            {registrosObservados.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#9c6314] text-white font-bold text-[10px]">
                {registrosObservados.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'historial' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Historial de Cambios ({historialCambios.length})
          </button>

          <button
            onClick={() => setActiveTab('accesos')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'accesos' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Accesos al Sistema ({historialAccesos.length})
          </button>
        </div>
      </div>

      {/* Regla de integridad de registros manuales en Sheets */}
      <div className="bg-[#fef8ee] border border-[#f6d99f] rounded-lg p-3 text-xs text-[#78460b] flex items-start gap-2 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-[#9c6314] shrink-0 mt-0.5" />
        <div>
          <strong>Regla de Sincronización e Integridad (Sección 3):</strong> Si en la planilla de Google Sheets aparece un registro cargado a mano con omisiones o inconsistencias, el backend no lo borra: le asigna <em>estado_validacion = "Observado"</em> con el detalle de la falla. Un registro observado <strong>no impacta en stock, costos, ingresos ni indicadores</strong> hasta que se subsane.
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'observados' && (
        <DataTable
          columns={columnsObservados}
          data={registrosObservados}
          title="Bandeja de Registros Observados Pendientes"
          subtitle="Filas con datos incompletos o reglas incumplidas cargadas directamente en Google Sheets"
          emptyMessage="No hay registros observados. Todos los datos de la base de datos cumplen las reglas de negocio."
        />
      )}

      {activeTab === 'historial' && (
        <DataTable
          columns={columnsHistorial}
          data={historialCambios}
          title="Historial de Modificaciones, Confirmaciones y Anulaciones"
          subtitle="Trazabilidad forense inmutable de todas las operaciones ejecutadas en el sistema"
          onExportCsv={() => onExportCsv('Auditoria_Cambios')}
          emptyMessage="No se han registrado modificaciones todavía."
        />
      )}

      {activeTab === 'accesos' && (
        <DataTable
          columns={columnsHistorial}
          data={historialAccesos}
          title="Historial de Ingresos de Usuarios"
          subtitle="Registro de inicios de sesión y autenticación en la plataforma"
          onExportCsv={() => onExportCsv('Auditoria_Cambios')}
          emptyMessage="No se han registrado ingresos."
        />
      )}
    </div>
  );
};
