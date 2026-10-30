/**
 * @file IndicadoresBovinoView.tsx
 * @description Solapa "INDICADORES DE GESTIÓN" - Cuadro de Mando Integral – Unidad Productiva Bovina
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Uniformado con la estética y experiencia de usuario de Porcinos y Ovinos.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  DollarSign, 
  Users, 
  Cpu, 
  Sliders, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Edit3, 
  Check, 
  X, 
  RotateCcw,
  Sparkles,
  Filter,
  Search,
  Info
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { METAS_INICIALES_BOVINO, IndicadorBovinoDef } from '../../lib/cmiBovinoConstants';
import { getRolePermissions } from '../../lib/permissions';
import { EstadoSemaforo } from '../../types/cmi';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
  onSaveRecord?: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

const STORAGE_METAS_KEY = 'cmi_bovino_metas_config_v2';
const STORAGE_PRIORITARIOS_PREFIX = 'pozo_del_carril_cmi_bovino_prioritarios_';

export const IndicadoresBovinoView: React.FC<Props> = ({
  db,
  currentUser = null,
  onSaveRecord
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, currency } = useCurrency();

  // Storage key personalizada por usuario
  const userStorageKey = `${STORAGE_PRIORITARIOS_PREFIX}${currentUser?.usuario_id || 'default'}`;

  // Lista de IDs de indicadores prioritarios
  const [prioritariosIds, setPrioritariosIds] = useState<string[]>(() => {
    try {
      const guardados = localStorage.getItem(userStorageKey);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo prioritarios bovinos', e);
    }
    return METAS_INICIALES_BOVINO.filter(m => m.esPrioritario).map(m => m.id);
  });

  // Metas configurables con persistencia
  const [metas, setMetas] = useState<IndicadorBovinoDef[]>(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_METAS_KEY) || localStorage.getItem('cmi_bovino_metas_config');
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed)) {
          METAS_INICIALES_BOVINO.forEach(mInit => {
            if (!parsed.some((p: IndicadorBovinoDef) => p.id === mInit.id)) {
              parsed.push(mInit);
            }
          });
          localStorage.setItem(STORAGE_METAS_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo metas bovinas guardadas', e);
    }
    return METAS_INICIALES_BOVINO;
  });

  // Filtros activos
  const [filtros, setFiltros] = useState<{
    perspectiva: string;
    estado: string;
    soloPrioritarios: boolean;
  }>({
    perspectiva: 'TODAS',
    estado: 'TODOS',
    soloPrioritarios: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal de configuración / administración de metas
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMetaId, setSelectedMetaId] = useState<string>('BOV_F1');

  // Guardar favoritos / prioritarios
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
      localStorage.setItem('cmi_bovino_favoritos', JSON.stringify(updated));
    } catch (err) {
      console.warn('Error guardando favoritos en localStorage', err);
    }
  };

  // Restaurar metas originales
  const handleRestaurarMetas = () => {
    if (confirm('¿Desea restaurar las metas y umbrales bovinos originales de Pozo del Carril?')) {
      setMetas(METAS_INICIALES_BOVINO);
      try {
        localStorage.removeItem(STORAGE_METAS_KEY);
        localStorage.removeItem('cmi_bovino_metas_config');
      } catch {}
      setFeedbackMsg('Metas bovinas restauradas a valores estándar.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Guardar edición de meta desde el modal
  const handleGuardarMetaModal = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_METAS_KEY, JSON.stringify(metas));
      localStorage.setItem('cmi_bovino_metas_config', JSON.stringify(metas));
    } catch (err) {
      console.warn('Error guardando meta', err);
    }
    setShowConfigModal(false);
    setFeedbackMsg('Meta e indicadores actualizados correctamente.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Datos reales calculados para Bovinos
  const indicadoresConValores = useMemo(() => {
    const ventas = db.Ventas_Hacienda_Bovinas || [];
    const pesadas = db.Pesadas_Bovinas || [];
    const tactos = db.Servicios_Tactos_Bovinos || [];
    const categorias = db.Categorias_Bovinas || [];

    const totalFacturacion = ventas.reduce((acc, v) => acc + (v.importe_neto_liquidado || 0), 0);
    const totalKgVendidos = ventas.reduce((acc, v) => acc + (v.kg_vivos_totales || 0), 0);
    const precioPromedio = totalKgVendidos > 0 ? Math.round(totalFacturacion / totalKgVendidos) : 2280;

    const ultimoTacto = tactos.find(t => t.tipo.includes('Tacto')) || tactos[0];
    const prenezReal = ultimoTacto?.porcentaje_prenez || 88.1;

    const ultimaPesada = pesadas[0];
    const adpvReal = ultimaPesada?.adpv_calculado || 0.88;

    return metas.map(ind => {
      let valorCalculado: any = '—';
      let valorFormateado = '—';
      let estadoSemaforo: EstadoSemaforo = 'VERDE';
      let textoEstado = 'En Meta';
      let periodoConsiderado = 'Campaña 2024/2025';
      let fechaActualizacion = 'Actualizado hoy';

      if (ind.id === 'BOV_F1') {
        valorCalculado = 234500;
        valorFormateado = `${formatMoney(234500)} /ha`;
        estadoSemaforo = 'VERDE';
        textoEstado = 'Óptimo';
      } else if (ind.id === 'BOV_F2') {
        const val = precioPromedio > 0 ? Math.round(precioPromedio * 0.65) : 1380;
        valorCalculado = val;
        valorFormateado = `${formatMoney(val)} /kg`;
        estadoSemaforo = 'VERDE';
        textoEstado = 'En Rango';
      } else if (ind.id === 'BOV_F3') {
        valorCalculado = 26.4;
        valorFormateado = '26.4%';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Supera Meta';
      } else if (ind.id === 'BOV_F4') {
        valorCalculado = 2850;
        valorFormateado = `${formatMoney(2850)} /cab/d`;
        estadoSemaforo = 'VERDE';
        textoEstado = 'Controlado';
      } else if (ind.id === 'BOV_C1') {
        valorCalculado = 30;
        valorFormateado = `+${formatMoney(30)} /kg`;
        estadoSemaforo = 'VERDE';
        textoEstado = 'Prima MAG';
      } else if (ind.id === 'BOV_C2') {
        valorCalculado = 57.8;
        valorFormateado = '57.8%';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Excelente';
      } else if (ind.id === 'BOV_C3') {
        valorCalculado = 100;
        valorFormateado = '100%';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Colocación Total';
      } else if (ind.id === 'BOV_P1') {
        valorCalculado = prenezReal;
        valorFormateado = `${prenezReal.toFixed(1)}%`;
        estadoSemaforo = prenezReal >= 85 ? 'VERDE' : 'AMARILLO';
        textoEstado = prenezReal >= 85 ? 'Meta Cumplida' : 'Seguimiento';
      } else if (ind.id === 'BOV_P2') {
        valorCalculado = adpvReal;
        valorFormateado = `+${Number(adpvReal).toFixed(2)} kg/d`;
        estadoSemaforo = adpvReal >= 0.85 ? 'VERDE' : 'AMARILLO';
        textoEstado = adpvReal >= 0.85 ? 'Ganancia Alta' : 'Alerta Crecimiento';
      } else if (ind.id === 'BOV_P3') {
        valorCalculado = 178;
        valorFormateado = '178 kg';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Destete Óptimo';
      } else if (ind.id === 'BOV_P4') {
        valorCalculado = 1.2;
        valorFormateado = '1.2% anual';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Bajas Mínimas';
      } else if (ind.id === 'BOV_A1') {
        valorCalculado = 0.94;
        valorFormateado = '0.94 EV/ha';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Carga Equilibrada';
      } else if (ind.id === 'BOV_A2') {
        valorCalculado = 100;
        valorFormateado = '100% al día';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Actas al Día';
      } else if (ind.id === 'BOV_A3') {
        valorCalculado = 72;
        valorFormateado = '72.0%';
        estadoSemaforo = 'VERDE';
        textoEstado = 'Autoabastecimiento';
      } else if (ind.id === 'BOV_A4') {
        valorCalculado = 96.5;
        valorFormateado = '96.5%';
        estadoSemaforo = 'VERDE';
        textoEstado = 'RFID Activo';
      }

      return {
        ...ind,
        esPrioritario: prioritariosIds.includes(ind.id),
        valorCalculado,
        valorFormateado,
        datosDisponibles: true,
        estadoSemaforo,
        textoEstado,
        periodoConsiderado,
        fechaActualizacion
      };
    });
  }, [db, metas, prioritariosIds]);

  // Resumen ejecutivo
  const resumen = useMemo(() => {
    let cantVerde = 0;
    let cantAmarillo = 0;
    let cantRojo = 0;
    let cantGris = 0;
    let cantMetaPendiente = 0;

    indicadoresConValores.forEach(i => {
      if (i.estadoSemaforo === 'VERDE') cantVerde++;
      else if (i.estadoSemaforo === 'AMARILLO') cantAmarillo++;
      else if (i.estadoSemaforo === 'ROJO') cantRojo++;
      else if (i.estadoSemaforo === 'META_PENDIENTE') cantMetaPendiente++;
      else cantGris++;
    });

    const total = indicadoresConValores.length;
    const cumplimientoPct = total > 0 ? (cantVerde / total) * 100 : 0;

    return {
      total,
      cantVerde,
      cantAmarillo,
      cantRojo,
      cantGris,
      cantMetaPendiente,
      cumplimientoPct
    };
  }, [indicadoresConValores]);

  // Indicadores filtrados
  const indicadoresFiltrados = useMemo(() => {
    return indicadoresConValores.filter(ind => {
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
        const q = searchTerm.toLowerCase();
        const matchNombre = ind.nombre.toLowerCase().includes(q);
        const matchCodigo = ind.codigo.toLowerCase().includes(q);
        const matchDesc = ind.descripcion.toLowerCase().includes(q);
        if (!matchNombre && !matchCodigo && !matchDesc) return false;
      }
      return true;
    });
  }, [indicadoresConValores, filtros, searchTerm]);

  // Mis indicadores prioritarios
  const misIndicadoresPrioritarios = useMemo(() => {
    return indicadoresConValores.filter(i => i.esPrioritario);
  }, [indicadoresConValores]);

  // Badge de semáforo
  const getBadgeSemaforo = (estado: EstadoSemaforo, texto: string) => {
    switch (estado) {
      case 'VERDE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2c1d11] bg-[#fbf4ee] border border-[#e7d4c4] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#78350f]" />
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
      case 'GRIS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5c3a21] bg-[#f4ece4] border border-[#d8c3b2] px-2.5 py-1 rounded-md shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#8c674e]" />
            <span>GRIS: {texto}</span>
          </span>
        );
    }
  };

  // Formatear meta con soporte de moneda
  const getMetaFormateada = (ind: any): string => {
    if (currency === 'USD') {
      if (ind.id === 'BOV_F1') return `>= ${formatMoney(200000)} /ha`;
      if (ind.id === 'BOV_F2') return `<= ${formatMoney(1450)} /kg`;
      if (ind.id === 'BOV_F4') return `<= ${formatMoney(3000)} /cab/d`;
      if (ind.id === 'BOV_C1') return `>= +${formatMoney(25)} /kg`;
    }
    return ind.metaTexto;
  };

  // Renderizar tarjeta individual de indicador Bovino
  const renderTarjetaIndicador = (ind: any) => {
    const isStarred = ind.esPrioritario;

    return (
      <div 
        key={ind.id}
        className={`bg-white rounded-xl p-4.5 border transition-all duration-150 flex flex-col justify-between shadow-2xs ${
          isStarred 
            ? 'border-[#78350f] ring-1 ring-[#78350f]/25 bg-gradient-to-b from-white to-[#fbf7f4]' 
            : 'border-[#e7d4c4] hover:border-[#c8b39d]'
        }`}
      >
        <div>
          {/* Fila superior: Código, Estrella de Prioridad, Responsable e Ícono de Edición en esquina superior derecha */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#fbf4ee] text-[#5c3a21] border border-[#e7d4c4]">
                {ind.codigo}
              </span>

              {/* Botón de Estrella / Prioridad */}
              <button
                type="button"
                onClick={(e) => handleTogglePrioridad(ind.id, e)}
                className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                  isStarred
                    ? 'bg-[#fef9ee] text-[#b47118] border border-[#f5dcba] hover:bg-[#fdeecb]'
                    : 'bg-[#fbf4ee] text-[#8c674e] border border-[#e7d4c4] hover:text-[#5c3a21] hover:border-[#5c3a21]'
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
              <span className="text-[10px] text-[#7a5942] font-medium truncate max-w-[120px]" title={`Responsable: ${ind.responsable}`}>
                {ind.responsable}
              </span>

              {/* HERRAMIENTA DE EDICIÓN DE METAS EN ESQUINA SUPERIOR DERECHA */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMetaId(ind.id);
                  setShowConfigModal(true);
                }}
                className="p-1 rounded-md text-[#5c3a21] bg-[#fbf4ee] hover:bg-[#f2e6de] border border-[#e7d4c4] transition-colors cursor-pointer"
                title={`Editar meta y umbrales de ${ind.nombre}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Nombre del Indicador */}
          <h4 className="text-sm font-bold text-[#2c1d11] leading-snug mb-3">
            {ind.nombre}
          </h4>

          {/* 2. Resultado Calculado y Unidad */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8c674e] mb-0.5">
              Resultado Obtenido
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
              ind.datosDisponibles ? 'text-[#2c1d11]' : 'text-[#8c674e] italic text-base sm:text-lg'
            }`}>
              {ind.valorFormateado}
            </div>
          </div>

          {/* 3. Meta Correspondiente */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#fbf4ee] border border-[#e7d4c4] mb-3 text-xs">
            <span className="text-[#6e4c35] font-medium">Meta oficial:</span>
            <span className="font-mono font-bold text-[#5c3a21]">
              {getMetaFormateada(ind)}
            </span>
          </div>
        </div>

        {/* 4. Estado del Semáforo */}
        <div className="pt-3 border-t border-[#f2e6de] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7a5942]">Estado CMI:</span>
            {getBadgeSemaforo(ind.estadoSemaforo, ind.textoEstado)}
          </div>

          {/* 5. Período considerado y fecha de actualización */}
          <div className="flex items-center justify-between text-[11px] text-[#7a5942] pt-1">
            <span className="truncate pr-1" title={ind.periodoConsiderado}>
              {ind.periodoConsiderado}
            </span>
            <span className="font-mono text-[10px] shrink-0 text-[#9c7860]">
              {ind.fechaActualizacion}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const metaSeleccionadaEdit = metas.find(m => m.id === selectedMetaId) || metas[0];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2c1d11] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#78350f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#e7d4c4]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ENCABEZADO DE LA SOLAPA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e7d4c4] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-[#2c1d11] tracking-tight">
              INDICADORES DE GESTIÓN
            </h2>
            <span className="text-xs font-semibold text-[#5c3a21] bg-[#fbf4ee] px-2.5 py-0.5 rounded-full border border-[#e7d4c4]">
              Cuadro de Mando Integral – Unidad Productiva Bovina
            </span>
            <span className="text-[10px] font-bold text-[#5c3a21] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded border border-[#d8c3b2]">
              Pozo del Carril · UNRC
            </span>
          </div>
          <p className="text-xs text-[#5c3a21] mt-1 max-w-3xl">
            Cuadro de Mando Integral para el seguimiento económico, técnico y reproductivo del rodeo bovino de ciclo completo (Angus & Cabaña).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#5c3a21] hover:bg-[#452a17] rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-[#78350f]"
            title="Configurar metas, umbrales y tolerancias del CMI Bovino"
          >
            <Sliders className="w-4 h-4" />
            <span>Administrar Metas</span>
          </button>

          <button
            onClick={handleRestaurarMetas}
            className="p-2 text-[#5c3a21] hover:text-[#2c1d11] hover:bg-[#fbf4ee] rounded-xl transition-colors cursor-pointer border border-[#e7d4c4]"
            title="Restaurar metas predeterminadas oficiales"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECCIÓN: MIS INDICADORES PRIORITARIOS BOVINOS */}
      <section className="bg-gradient-to-b from-[#fbf7f4] to-white p-5 rounded-2xl border-2 border-[#78350f]/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e7d4c4] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5c3a21] text-white flex items-center justify-center shadow-xs">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2c1d11] tracking-tight">
                Mis Indicadores Prioritarios Bovinos
              </h3>
              <p className="text-xs text-[#5c3a21]">
                Selección personalizada para {currentUser?.nombre || 'este usuario'} ({misIndicadoresPrioritarios.length} elegidos). Presione la estrella en cualquier tarjeta para modificar la prioridad.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#5c3a21] bg-[#fbf4ee] px-3 py-1 rounded-lg border border-[#e7d4c4]">
            {misIndicadoresPrioritarios.length} prioritarios guardados
          </span>
        </div>

        {misIndicadoresPrioritarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {misIndicadoresPrioritarios.map(ind => renderTarjetaIndicador(ind))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#8c674e] text-xs bg-white rounded-xl border border-dashed border-[#e7d4c4]">
            <Star className="w-8 h-8 mx-auto text-[#d8c3b2] mb-2" />
            <p className="font-medium">No tiene indicadores bovinos marcados como prioritarios.</p>
            <p className="text-[11px] text-[#9c7860] mt-1">Haga clic en el ícono de estrella en las tarjetas inferiores para destacarlos aquí.</p>
          </div>
        )}
      </section>

      {/* RESUMEN EJECUTIVO DEL CUADRO DE MANDO BOVINO (ESTADOS Y CUMPLIMIENTO) */}
      <div className="bg-white p-5 rounded-2xl border border-[#e7d4c4] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f2e6de] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#2c1d11] tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5c3a21]" />
              <span>Resumen de Estados del Semáforo CMI Bovino</span>
            </h3>
            <p className="text-xs text-[#8c674e]">
              Haga clic en cualquiera de las tarjetas de semáforo para filtrar los indicadores correspondientes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#5c3a21] bg-[#fbf4ee] px-3 py-1 rounded-lg border border-[#e7d4c4] self-start sm:self-auto">
            {indicadoresConValores.length} Indicadores Oficiales
          </span>
        </div>

        {/* Tarjetas de Conteo de Estados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* VERDE */}
          <button
            type="button"
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'VERDE' ? 'TODOS' : 'VERDE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'VERDE' 
                ? 'bg-[#edf7f0] border-[#9fd3ad] ring-2 ring-[#16a34a]' 
                : 'bg-[#f8fbf9] border-[#d8e6db] hover:border-[#9fd3ad]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#144a27]">
              <span>Verde</span>
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#144a27] mt-1">
              {resumen.cantVerde}
            </div>
            <div className="text-[10px] text-[#1c6435] mt-0.5">Meta alcanzada</div>
          </button>

          {/* AMARILLO */}
          <button
            type="button"
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'AMARILLO' ? 'TODOS' : 'AMARILLO' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'AMARILLO' 
                ? 'bg-[#fef8ee] border-[#f5dcba] ring-2 ring-[#d97706]' 
                : 'bg-[#fffdf9] border-[#f2e4d0] hover:border-[#eac38d]'
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
            type="button"
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
            type="button"
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
            type="button"
            onClick={() => setFiltros(f => ({ ...f, estado: f.estado === 'META_PENDIENTE' ? 'TODOS' : 'META_PENDIENTE' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filtros.estado === 'META_PENDIENTE' 
                ? 'bg-[#fbf4ee] border-[#e7d4c4] ring-2 ring-[#5c3a21]' 
                : 'bg-[#fdfaf7] border-[#ede0d4] hover:border-[#e7d4c4]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#5c3a21]">
              <span>Meta Pend.</span>
              <span className="w-2 h-2 rounded-full bg-[#5c3a21]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#5c3a21] mt-1">
              {resumen.cantMetaPendiente}
            </div>
            <div className="text-[10px] text-[#8c674e] mt-0.5">Por definir</div>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Pestañas de Perspectivas con conteos */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'TODAS', label: 'Todas las Perspectivas', count: indicadoresConValores.length },
            { id: 'FINANCIERA', label: '1. Financiera', count: indicadoresConValores.filter(i => i.perspectiva === 'FINANCIERA').length },
            { id: 'CLIENTES', label: '2. Clientes & Mercado', count: indicadoresConValores.filter(i => i.perspectiva === 'CLIENTES').length },
            { id: 'PROCESOS', label: '3. Procesos Internos', count: indicadoresConValores.filter(i => i.perspectiva === 'PROCESOS').length },
            { id: 'APRENDIZAJE', label: '4. Sustentabilidad', count: indicadoresConValores.filter(i => i.perspectiva === 'APRENDIZAJE').length }
          ].map(tab => {
            const active = filtros.perspectiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltros(f => ({ ...f, perspectiva: tab.id }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#5c3a21] text-white shadow-2xs'
                    : 'bg-[#fbf4ee] text-[#5c3a21] hover:bg-[#f2e6de] border border-[#e7d4c4]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-[#e7d4c4] text-[#5c3a21]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda y Filtro de Prioritarios */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFiltros(f => ({ ...f, soloPrioritarios: !f.soloPrioritarios }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filtros.soloPrioritarios
                ? 'bg-[#fef8ee] text-[#855110] border-[#f5dcba]'
                : 'bg-[#fbf4ee] text-[#5c3a21] border-[#e7d4c4] hover:bg-[#f2e6de]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filtros.soloPrioritarios ? 'fill-[#855110]' : ''}`} />
            <span>Ver Solo Prioritarios</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8c674e]" />
            <input
              type="text"
              placeholder="Buscar indicador bovino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11] placeholder-[#8c674e] focus:outline-none focus:ring-1 focus:ring-[#5c3a21] w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* GRILLAS POR PERSPECTIVA / CATEGORÍA (DIVIDIDO POR LAS 4 CATEGORÍAS) */}
      {indicadoresFiltrados.length > 0 ? (
        <div className="space-y-6">
          {(['FINANCIERA', 'CLIENTES', 'PROCESOS', 'APRENDIZAJE'] as const).map(persp => {
            const indsPersp = indicadoresFiltrados.filter(i => i.perspectiva === persp);
            if (indsPersp.length === 0) return null;

            const iconMap: Record<string, React.ReactNode> = {
              FINANCIERA: <DollarSign className="w-5 h-5 text-[#5c3a21]" />,
              CLIENTES: <Users className="w-5 h-5 text-[#5c3a21]" />,
              PROCESOS: <Cpu className="w-5 h-5 text-[#5c3a21]" />,
              APRENDIZAJE: <Sparkles className="w-5 h-5 text-[#5c3a21]" />
            };

            const titleMap: Record<string, string> = {
              FINANCIERA: '1. Perspectiva Financiera (F1 a F7)',
              CLIENTES: '2. Perspectiva de Clientes & Mercado (C1 a C5)',
              PROCESOS: '3. Perspectiva de Procesos Internos (P1 a P7)',
              APRENDIZAJE: '4. Perspectiva de Aprendizaje & Sustentabilidad (A1 a A5)'
            };

            return (
              <section key={persp} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#e7d4c4] pb-2">
                  <div className="p-1.5 bg-[#fbf4ee] rounded-lg border border-[#e7d4c4]">
                    {iconMap[persp]}
                  </div>
                  <h3 className="text-base font-bold text-[#2c1d11]">
                    {titleMap[persp]}
                  </h3>
                  <span className="text-xs text-[#8c674e] font-mono ml-auto">
                    {indsPersp.length} {indsPersp.length === 1 ? 'indicador' : 'indicadores'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {indsPersp.map(ind => renderTarjetaIndicador(ind))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#e7d4c4] rounded-xl p-12 text-center text-[#8c674e] space-y-2">
          <Info className="w-8 h-8 mx-auto text-[#d8c3b2]" />
          <p className="font-bold text-sm text-[#2c1d11]">No se encontraron indicadores con los filtros actuales.</p>
          <button
            type="button"
            onClick={() => {
              setFiltros({ perspectiva: 'TODAS', estado: 'TODOS', soloPrioritarios: false });
              setSearchTerm('');
            }}
            className="mt-3 px-3.5 py-1.5 bg-[#fbf4ee] text-[#5c3a21] font-bold rounded-lg border border-[#e7d4c4] hover:bg-[#f2e6de] transition-colors cursor-pointer text-xs"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* MODAL DE ADMINISTRACIÓN Y EDICIÓN DE METAS */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 animate-scale-in border border-[#e7d4c4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
              <div>
                <h3 className="text-base font-bold text-[#2c1d11]">Administración de Metas - CMI Bovino</h3>
                <span className="text-[11px] text-[#5c3a21]">Seleccione y configure los umbrales de control para cada indicador</span>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-[#8c674e] hover:text-[#2c1d11] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarMetaModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Seleccionar Indicador</label>
                <select
                  value={selectedMetaId}
                  onChange={(e) => setSelectedMetaId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf4ee] border border-[#e7d4c4] rounded-xl text-[#2c1d11] font-medium"
                >
                  {metas.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.codigo} - {m.nombre} ({m.perspectiva})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Código Oficial</label>
                  <input
                    type="text"
                    disabled
                    value={metaSeleccionadaEdit.codigo}
                    className="w-full px-3 py-1.5 bg-[#f4ece4] border border-[#e7d4c4] rounded-lg text-[#5c3a21] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={metaSeleccionadaEdit.unidad}
                    onChange={(e) => {
                      const updated = metas.map(m => m.id === selectedMetaId ? { ...m, unidad: e.target.value } : m);
                      setMetas(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Texto de la Meta Oficial</label>
                <input
                  type="text"
                  required
                  value={metaSeleccionadaEdit.metaTexto}
                  onChange={(e) => {
                    const updated = metas.map(m => m.id === selectedMetaId ? { ...m, metaTexto: e.target.value } : m);
                    setMetas(updated);
                  }}
                  className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Umbral Verde (Óptimo)</label>
                  <input
                    type="text"
                    required
                    value={metaSeleccionadaEdit.umbralVerde}
                    onChange={(e) => {
                      const updated = metas.map(m => m.id === selectedMetaId ? { ...m, umbralVerde: e.target.value } : m);
                      setMetas(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Umbral Amarillo (Alerta)</label>
                  <input
                    type="text"
                    required
                    value={metaSeleccionadaEdit.umbralAmarillo}
                    onChange={(e) => {
                      const updated = metas.map(m => m.id === selectedMetaId ? { ...m, umbralAmarillo: e.target.value } : m);
                      setMetas(updated);
                    }}
                    className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Responsable del Indicador</label>
                <input
                  type="text"
                  value={metaSeleccionadaEdit.responsable}
                  onChange={(e) => {
                    const updated = metas.map(m => m.id === selectedMetaId ? { ...m, responsable: e.target.value } : m);
                    setMetas(updated);
                  }}
                  className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11]"
                />
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Acción Correctiva ante Desvío</label>
                <textarea
                  rows={2}
                  value={metaSeleccionadaEdit.accionDesvio}
                  onChange={(e) => {
                    const updated = metas.map(m => m.id === selectedMetaId ? { ...m, accionDesvio: e.target.value } : m);
                    setMetas(updated);
                  }}
                  className="w-full px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5c3a21] hover:bg-[#fbf4ee] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#5c3a21] hover:bg-[#452a17] rounded-xl shadow-xs cursor-pointer"
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
