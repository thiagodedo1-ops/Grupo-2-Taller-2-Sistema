/**
 * @file NotificationCenter.tsx
 * @description Centro y Almacén de Notificaciones & Alertas del Sistema Pozo del Carril
 * Almacena y gestiona alertas zootécnicas, sanitarias, de conversión (ICA), stock de granos,
 * cotización oficial BNA, desvíos del CMI y recordatorios de campo para operarios y encargados.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Plus,
  Search,
  X,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
  Utensils,
  TrendingUp,
  LineChart,
  Boxes,
  HelpCircle
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { ModuleKey } from './Sidebar';

export type SeveridadNotificacion = 'CRITICA' | 'ADVERTENCIA' | 'INFO' | 'EXITO';

export type CategoriaNotificacion = 
  | 'TODAS'
  | 'ZOOTECNICA' 
  | 'ALIMENTACION' 
  | 'STOCK' 
  | 'COMERCIAL' 
  | 'CMI' 
  | 'SISTEMA';

export interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  severidad: SeveridadNotificacion;
  categoria: 'ZOOTECNICA' | 'ALIMENTACION' | 'STOCK' | 'COMERCIAL' | 'CMI' | 'SISTEMA';
  fechaHora: string;
  timestamp: number;
  leida: boolean;
  moduloDestino?: ModuleKey;
  accionTexto?: string;
  origen: string;
}

// Catálogo de notificaciones predeterminadas y contextuales del establecimiento
const NOTIFICACIONES_BASE: NotificacionItem[] = [
  {
    id: 'notif-1',
    titulo: 'Parto inminente · Cerda Caravana M-104',
    mensaje: 'La cerda reproductora M-104 cumple 111 días de gestación (FPP a 3 días). Debe trasladarse al arco paridera n° 4 con cama de paja seca y verificar barras anti-aplastamiento.',
    severidad: 'CRITICA',
    categoria: 'ZOOTECNICA',
    fechaHora: 'Hoy, 07:45',
    timestamp: Date.now() - 1000 * 60 * 45,
    leida: false,
    moduloDestino: 'produccion',
    accionTexto: 'Ir a Producción / Partos',
    origen: 'Gestación & Reproducción'
  },
  {
    id: 'notif-2',
    titulo: 'Desvío en ICA de Terminación · Lote L-ENG-24',
    mensaje: 'El lote de terminación L-ENG-24 promedia una conversión de 2,94 kg/kg, aproximándose al límite de tolerancia fijado en el CMI (≤ 3,0 kg/kg). Revisar regulación de tolvas de maíz molido.',
    severidad: 'ADVERTENCIA',
    categoria: 'ALIMENTACION',
    fechaHora: 'Hoy, 08:30',
    timestamp: Date.now() - 1000 * 60 * 120,
    leida: false,
    moduloDestino: 'alimentacion',
    accionTexto: 'Ver Consumo & Raciones',
    origen: 'Nutrición & Conversión'
  },
  {
    id: 'notif-3',
    titulo: 'CMI · Indicador A5 (Visitas Estudiantiles) en seguimiento',
    mensaje: 'Se han completado 2 de las 4 visitas anuales previstas. Cátedras de Producción Porcina (FAV) y Costos Agropecuarios (FCE) confirmadas para coordinar fecha de extensión a campo.',
    severidad: 'ADVERTENCIA',
    categoria: 'CMI',
    fechaHora: 'Ayer, 16:10',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    leida: false,
    moduloDestino: 'indicadores',
    accionTexto: 'Abrir Cuadro de Mando (CMI)',
    origen: 'Extensión Universitaria UNRC'
  },
  {
    id: 'notif-4',
    titulo: 'Capones Lote L-ENG-23 listos para faena',
    mensaje: '82 capones alcanzaron un peso promedio de 108 kg de peso vivo (dentro del rango óptimo comercial 90-105 kg). Se debe solicitar DTe en autogestión SENASA y coordinar camión jaula.',
    severidad: 'EXITO',
    categoria: 'COMERCIAL',
    fechaHora: 'Ayer, 11:20',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    leida: false,
    moduloDestino: 'ventas',
    accionTexto: 'Gestionar Venta & Remito',
    origen: 'Comercialización Porcina'
  },
  {
    id: 'notif-5',
    titulo: 'Stock crítico de Núcleo Vitamínico-Mineral',
    mensaje: 'Existencia en galpón de insumos: 350 kg. Autonomía estimada para 6 días al ritmo de molienda actual. Se sugiere emitir orden de compra para evitar quiebre de stock.',
    severidad: 'ADVERTENCIA',
    categoria: 'STOCK',
    fechaHora: 'Hace 2 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    leida: false,
    moduloDestino: 'stock',
    accionTexto: 'Ver Inventario de Insumos',
    origen: 'Almacén de Granos & Silos'
  },
  {
    id: 'notif-6',
    titulo: 'Indicador C2: 0% Mortalidad en Transporte en último envío',
    mensaje: 'El frigorífico confirmó recepción de 90 capones con cero bajas en el trayecto (0 muertos a la llegada). Se mantiene el semáforo Verde en el indicador C2 de bienestar animal.',
    severidad: 'EXITO',
    categoria: 'CMI',
    fechaHora: 'Hace 3 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    leida: true,
    moduloDestino: 'indicadores',
    accionTexto: 'Ver Detalle en CMI',
    origen: 'Logística Frigorífica'
  },
  {
    id: 'notif-7',
    titulo: 'Cotización Oficial BNA sincronizada',
    mensaje: 'Tipo de cambio oficial Banco Nación actualizado para la presentación bimonetaria de existencias, liquidaciones y costeo de raciones en ARS y USD.',
    severidad: 'INFO',
    categoria: 'SISTEMA',
    fechaHora: 'Hace 4 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    leida: true,
    moduloDestino: 'existencias',
    accionTexto: 'Ver Valuación Bimonetaria',
    origen: 'Servicio BNA Oficial'
  },
  {
    id: 'notif-8',
    titulo: 'Recordatorio: Cierre contable y valuación VNR',
    mensaje: 'Al cierre del período mensual, el Encargado debe conciliar las existencias físicas, valuar los capones al Valor Neto de Realización (VNR) y bloquear el período en Auditoría.',
    severidad: 'INFO',
    categoria: 'SISTEMA',
    fechaHora: 'Hace 5 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 120,
    leida: true,
    moduloDestino: 'existencias',
    accionTexto: 'Ir a Existencias & VNR',
    origen: 'Control de Período'
  }
];

interface Props {
  currentUser?: Usuario | null;
  onNavigate?: (module: ModuleKey) => void;
}

export const NotificationCenter: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoriaNotificacion>('TODAS');
  const [soloSinLeer, setSoloSinLeer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulario de nuevo recordatorio manual de campo
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [nuevaSeveridad, setNuevaSeveridad] = useState<SeveridadNotificacion>('ADVERTENCIA');
  const [nuevaCategoria, setNuevaCategoria] = useState<'ZOOTECNICA' | 'ALIMENTACION' | 'STOCK' | 'COMERCIAL' | 'CMI' | 'SISTEMA'>('ZOOTECNICA');
  const [nuevoModulo, setNuevoModulo] = useState<ModuleKey>('produccion');

  const containerRef = useRef<HTMLDivElement>(null);

  const storageKey = `pozo_del_carril_notificaciones_${currentUser?.usuario_id || 'default'}`;

  // Estado con persistencia local
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error al leer notificaciones en localStorage', e);
    }
    return NOTIFICACIONES_BASE;
  });

  // Guardar cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notificaciones));
    } catch (e) {
      console.warn('Error guardando notificaciones', e);
    }
  }, [notificaciones, storageKey]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Contadores
  const unreadCount = useMemo(() => {
    return notificaciones.filter(n => !n.leida).length;
  }, [notificaciones]);

  const criticasCount = useMemo(() => {
    return notificaciones.filter(n => !n.leida && n.severidad === 'CRITICA').length;
  }, [notificaciones]);

  // Filtrado
  const filteredNotificaciones = useMemo(() => {
    return notificaciones.filter(n => {
      if (soloSinLeer && n.leida) return false;
      if (activeCategory !== 'TODAS' && n.categoria !== activeCategory) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitulo = n.titulo.toLowerCase().includes(term);
        const matchMensaje = n.mensaje.toLowerCase().includes(term);
        const matchOrigen = n.origen.toLowerCase().includes(term);
        if (!matchTitulo && !matchMensaje && !matchOrigen) return false;
      }
      return true;
    });
  }, [notificaciones, soloSinLeer, activeCategory, searchTerm]);

  // Acciones
  const handleToggleLeida = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, leida: !n.leida } : n))
    );
  };

  const handleMarcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleEliminarNotificacion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  const handleRestablecerNotificaciones = () => {
    setNotificaciones(NOTIFICACIONES_BASE);
  };

  const handleCrearRecordatorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoMensaje.trim()) return;

    const nueva: NotificacionItem = {
      id: `manual-${Date.now()}`,
      titulo: nuevoTitulo.trim(),
      mensaje: nuevoMensaje.trim(),
      severidad: nuevaSeveridad,
      categoria: nuevaCategoria,
      fechaHora: 'Recién cargada',
      timestamp: Date.now(),
      leida: false,
      moduloDestino: nuevoModulo,
      accionTexto: `Ir a ${nuevoModulo.charAt(0).toUpperCase() + nuevoModulo.slice(1)}`,
      origen: `Recordatorio de ${currentUser?.nombre || 'Operario'}`
    };

    setNotificaciones(prev => [nueva, ...prev]);
    setNuevoTitulo('');
    setNuevoMensaje('');
    setShowAddModal(false);
  };

  const handleItemClick = (n: NotificacionItem) => {
    // Marcar como leída automáticamente al hacer clic
    if (!n.leida) {
      setNotificaciones(prev =>
        prev.map(item => (item.id === n.id ? { ...item, leida: true } : item))
      );
    }
    if (n.moduloDestino && onNavigate) {
      onNavigate(n.moduloDestino);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Botón de Campana en la barra superior */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
          isOpen
            ? 'bg-[#1c4b31] text-white border-[#1c4b31] shadow-xs'
            : unreadCount > 0
            ? 'bg-white hover:bg-[#edf5ef] text-[#183123] border-[#dce4da] shadow-2xs'
            : 'bg-white hover:bg-[#edf5ef] text-[#556e5f] border-[#dce4da] shadow-2xs'
        }`}
        title={`Notificaciones y Alertas (${unreadCount} sin leer)`}
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 && !isOpen ? 'text-[#1c4b31]' : ''}`} />

        {/* Badge numérico de no leídas */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-xs ${
              criticasCount > 0 ? 'bg-[#dc2626] animate-pulse' : 'bg-[#1c4b31]'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel de Notificaciones Desplegable */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[340px] sm:w-[440px] md:w-[480px] bg-white border border-[#c8d8ca] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header del Almacén */}
          <div className="p-4 bg-linear-to-r from-[#143622] to-[#1c4b31] text-white flex items-center justify-between border-b border-[#25583b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#7ee7a9] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-white">
                    Almacén de Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#dc2626] text-white px-2 py-0.2 rounded-full font-bold">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#b0d1bd]">
                  Alertas zootécnicas, raciones, CMI y recordatorios de campo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAddModal(!showAddModal)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  showAddModal ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-[#c8e6d3]'
                }`}
                title="Añadir recordatorio manual de campo"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-semibold">Nota</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarcarTodasLeidas}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-[#c8e6d3] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Leídas</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 text-[#c8e6d3] rounded-lg transition-colors cursor-pointer ml-1"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formulario rápido para crear nuevo recordatorio de campo */}
          {showAddModal && (
            <form onSubmit={handleCrearRecordatorio} className="p-3.5 bg-[#f4f8f5] border-b border-[#d8e5da] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#143422]">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#1c4b31]" />
                  <span>Nuevo Recordatorio u Observación de Campo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-[#648370] hover:text-[#143422] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Título (ej. Mudar piquete 3, Revisar bebedero maternidad)"
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#c8d8ca] rounded-lg text-xs text-[#183123] focus:outline-hidden focus:ring-1 focus:ring-[#1c4b31]"
                  required
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Descripción detallada o instrucción para el equipo..."
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#c8d8ca] rounded-lg text-xs text-[#183123] focus:outline-hidden focus:ring-1 focus:ring-[#1c4b31]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#446050] block mb-0.5">Severidad:</label>
                  <select
                    value={nuevaSeveridad}
                    onChange={e => setNuevaSeveridad(e.target.value as SeveridadNotificacion)}
                    className="w-full px-2 py-1 bg-white border border-[#c8d8ca] rounded-lg text-[11px]"
                  >
                    <option value="CRITICA">🔴 Crítica</option>
                    <option value="ADVERTENCIA">🟡 Advertencia</option>
                    <option value="INFO">🔵 Informativa</option>
                    <option value="EXITO">🟢 Cumplimiento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#446050] block mb-0.5">Categoría:</label>
                  <select
                    value={nuevaCategoria}
                    onChange={e => setNuevaCategoria(e.target.value as any)}
                    className="w-full px-2 py-1 bg-white border border-[#c8d8ca] rounded-lg text-[11px]"
                  >
                    <option value="ZOOTECNICA">Zootécnica / Campo</option>
                    <option value="ALIMENTACION">Alimentación / ICA</option>
                    <option value="STOCK">Stock / Silos</option>
                    <option value="COMERCIAL">Comercial / Faena</option>
                    <option value="CMI">Cuadro de Mando (CMI)</option>
                    <option value="SISTEMA">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#446050] block mb-0.5">Módulo Destino:</label>
                  <select
                    value={nuevoModulo}
                    onChange={e => setNuevoModulo(e.target.value as ModuleKey)}
                    className="w-full px-2 py-1 bg-white border border-[#c8d8ca] rounded-lg text-[11px]"
                  >
                    <option value="produccion">Producción</option>
                    <option value="alimentacion">Alimentación</option>
                    <option value="stock">Stock</option>
                    <option value="compras">Compras</option>
                    <option value="ventas">Ventas</option>
                    <option value="existencias">Existencias</option>
                    <option value="indicadores">Indicadores (CMI)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1c4b31] hover:bg-[#143925] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Guardar en Almacén
                </button>
              </div>
            </form>
          )}

          {/* Filtros por Categoría & Buscador */}
          <div className="p-2.5 bg-[#f8faf8] border-b border-[#e2eae2] space-y-2">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6b8575]" />
              <input
                type="text"
                placeholder="Buscar en notificaciones..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#d2ded3] rounded-xl text-xs text-[#183123] placeholder:text-[#8ba293] focus:outline-hidden focus:ring-1 focus:ring-[#1c4b31]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-[#7f998a] hover:text-[#183123] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pestañas de Categoría */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
              {[
                { id: 'TODAS', label: 'Todas' },
                { id: 'ZOOTECNICA', label: 'Zootécnica' },
                { id: 'ALIMENTACION', label: 'Alimentos & ICA' },
                { id: 'STOCK', label: 'Stock' },
                { id: 'COMERCIAL', label: 'Ventas' },
                { id: 'CMI', label: 'CMI' }
              ].map(cat => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as CategoriaNotificacion)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1c4b31] text-white shadow-2xs'
                        : 'bg-white text-[#466553] hover:bg-[#edf5ef] border border-[#d6e2d7]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSoloSinLeer(!soloSinLeer)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ml-auto border ${
                  soloSinLeer
                    ? 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                    : 'bg-white text-[#6b8575] hover:text-[#183123] border-[#d6e2d7]'
                }`}
              >
                Solo no leídas
              </button>
            </div>
          </div>

          {/* Lista Scrolleable de Notificaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#edf3ee] max-h-[460px] bg-white">
            {filteredNotificaciones.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#f0f5f1] text-[#6b8575] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 text-[#227242]" />
                </div>
                <div className="text-xs font-bold text-[#183123]">
                  No hay notificaciones con los filtros actuales
                </div>
                <p className="text-[11px] text-[#6b8575] max-w-xs mx-auto">
                  Todas las alertas están al día o fueron descartadas. Puedes restablecer las notificaciones de fábrica o crear una nueva nota.
                </p>
                <button
                  type="button"
                  onClick={handleRestablecerNotificaciones}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#edf5ef] hover:bg-[#dcebdd] text-[#1c4b31] border border-[#b8d4bf] rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Alertas del Sistema</span>
                </button>
              </div>
            ) : (
              filteredNotificaciones.map(n => {
                const getBorderColor = () => {
                  switch (n.severidad) {
                    case 'CRITICA':
                      return 'border-l-4 border-l-[#dc2626] bg-[#fef2f2]/40';
                    case 'ADVERTENCIA':
                      return 'border-l-4 border-l-[#d97706] bg-[#fffbeb]/40';
                    case 'EXITO':
                      return 'border-l-4 border-l-[#16a34a] bg-[#f0fdf4]/40';
                    default:
                      return 'border-l-4 border-l-[#2563eb] bg-[#eff6ff]/30';
                  }
                };

                const getBadge = () => {
                  switch (n.severidad) {
                    case 'CRITICA':
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                          <AlertOctagon className="w-2.5 h-2.5 text-red-600" />
                          <span>Crítica</span>
                        </span>
                      );
                    case 'ADVERTENCIA':
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          <span>Atención</span>
                        </span>
                      );
                    case 'EXITO':
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Cumplido</span>
                        </span>
                      );
                    default:
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          <Info className="w-2.5 h-2.5 text-blue-600" />
                          <span>Info</span>
                        </span>
                      );
                  }
                };

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-[#f5faf6] flex flex-col gap-1.5 ${getBorderColor()} ${
                      !n.leida ? 'font-medium' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getBadge()}
                        <span className="text-[10px] font-semibold text-[#526f5d] bg-white px-1.5 py-0.2 rounded border border-[#d6e2d7]">
                          {n.origen}
                        </span>
                        {!n.leida && (
                          <span className="w-2 h-2 rounded-full bg-[#1c4b31]" title="No leída" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[10px] text-[#718b7b]">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{n.fechaHora}</span>

                        {/* Botón marcar leída / no leída */}
                        <button
                          type="button"
                          onClick={e => handleToggleLeida(n.id, e)}
                          className="p-1 hover:bg-[#e2ede4] text-[#4d6d59] rounded transition-colors ml-1 cursor-pointer"
                          title={n.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                        >
                          <Check className={`w-3.5 h-3.5 ${n.leida ? 'text-[#16a34a]' : 'text-[#87a090]'}`} />
                        </button>

                        {/* Botón descartar */}
                        <button
                          type="button"
                          onClick={e => handleEliminarNotificacion(n.id, e)}
                          className="p-1 hover:bg-red-50 text-[#87a090] hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Descartar notificación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#143422] leading-snug">
                      {n.titulo}
                    </h4>

                    <p className="text-[11px] text-[#3c5948] leading-relaxed">
                      {n.mensaje}
                    </p>

                    {n.moduloDestino && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#1c4b31] font-bold flex items-center gap-1 hover:underline">
                          <span>{n.accionTexto || 'Ver módulo correspondiente'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        <span className="text-[10px] font-mono text-[#789684] uppercase">
                          Módulo {n.moduloDestino}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Almacén */}
          <div className="p-2.5 bg-[#f5f8f5] border-t border-[#dce6dc] flex items-center justify-between text-[11px] text-[#557361]">
            <span className="truncate">
              Total: <strong>{notificaciones.length}</strong> ({unreadCount} sin leer)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestablecerNotificaciones}
                className="text-[11px] text-[#1c4b31] hover:underline font-semibold cursor-pointer"
                title="Restablece las 8 notificaciones operativas predeterminadas"
              >
                Restablecer predeterminadas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
