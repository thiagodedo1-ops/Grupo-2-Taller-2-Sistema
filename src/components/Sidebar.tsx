/**
 * @file Sidebar.tsx
 * @description Barra lateral de navegación profesional con grupos temáticos desplegables (Acordeón)
 * Establecimiento Pozo del Carril – La Aguada | UNRC
 * Secciones: Panel General, Producción, Gestión Comercial, Gestión Económica,
 * Modelo de Gestión, Administración y Ayuda.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Utensils,
  ShoppingCart,
  TrendingUp,
  Boxes,
  LineChart,
  ShieldAlert,
  Settings,
  Shield,
  Briefcase,
  Wrench,
  FileSearch,
  Lock,
  Compass,
  Calculator,
  History,
  BookOpen,
  Sparkles,
  Users,
  ChevronDown,
  ChevronRight,
  Compass as CompassIcon,
  HelpCircle,
  Play,
  Scale,
  BarChart3,
  DollarSign,
  FileCheck2,
  Sliders,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { getRolePermissions } from '../lib/permissions';

export type ModuleKey =
  | 'inicio'
  | 'produccion'
  | 'alimentacion'
  | 'stock'
  | 'compras'
  | 'ventas'
  | 'existencias'
  | 'presupuesto'
  | 'historico'
  | 'indicadores'
  | 'manual'
  | 'auditoria'
  | 'configuracion'
  | 'usuarios'
  | 'tour'
  | 'gemini'
  // Módulos de Vista Consolidada
  | 'panel'
  | 'economico'
  | 'productivo'
  | 'cmi'
  // Sub-módulos específicos de Ganadería Bovina
  | 'bov_rodeo'
  | 'bov_manga'
  | 'bov_alimentacion'
  | 'bov_sanidad'
  | 'bov_simulacion'
  // Sub-módulos específicos de Ganadería Ovina
  | 'ovi_majada'
  | 'ovi_zafra'
  | 'ovi_sanidad'
  | 'ovi_simulacion'
  // Sub-módulos específicos de Producción Porcina
  | 'porc_simulacion';

interface Props {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  observedCount: number;
  currentUser?: Usuario | null;
  activeBusinessUnit?: string;
  onOpenManual?: () => void;
  onOpenGemini?: () => void;
  onOpenReorderTabs?: () => void;
  customOrder?: ModuleKey[];
  onStartTour?: () => void;
  consolidadoTab?: string;
  onSelectConsolidadoTab?: (tab: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSubItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavSubItem[];
}

export const Sidebar: React.FC<Props> = ({ 
  activeModule, 
  onSelectModule, 
  observedCount,
  currentUser = null,
  activeBusinessUnit = 'PORCINOS',
  onOpenManual,
  onOpenGemini,
  onOpenReorderTabs,
  onStartTour,
  consolidadoTab = 'panel',
  onSelectConsolidadoTab,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const permissions = getRolePermissions(currentUser);

  const isBovinos = activeBusinessUnit === 'BOVINOS';
  const isOvinos = activeBusinessUnit === 'OVINOS';
  const isConsolidado = activeBusinessUnit === 'CONSOLIDADO';

  // Grupos centrales de navegación según la Unidad de Negocio activa
  const coreGroups: NavGroup[] = isConsolidado ? [
    {
      id: 'panel',
      label: '1. Tablero Ejecutivo',
      icon: BarChart3,
      items: [
        { key: 'panel' as ModuleKey, label: 'Tablero Ejecutivo', icon: BarChart3, description: 'Síntesis ejecutiva y resumen general consolidado' }
      ]
    },
    {
      id: 'economico',
      label: '2. Estado de Resultados & Conciliación',
      icon: DollarSign,
      items: [
        { key: 'economico' as ModuleKey, label: 'Estado de Resultados & Conciliación', icon: DollarSign, description: 'Conciliación contable multi-especie' }
      ]
    },
    {
      id: 'productivo',
      label: '3. Situación Productiva por Especie',
      icon: Layers,
      items: [
        { key: 'productivo' as ModuleKey, label: 'Situación Productiva por Especie', icon: Layers, description: 'Porcinos, bovinos y ovinos' }
      ]
    },
    {
      id: 'auditoria',
      label: '4. Auditoría Matemática (Pruebas A-I)',
      icon: FileCheck2,
      items: [
        { key: 'auditoria' as ModuleKey, label: 'Auditoría Matemática (Pruebas A-I)', icon: FileCheck2, description: 'Verificación de ecuaciones y pruebas' }
      ]
    },
    {
      id: 'cmi',
      label: '5. Cuadro de Mando Integral',
      icon: Sliders,
      items: [
        { key: 'cmi' as ModuleKey, label: 'Cuadro de Mando Integral', icon: Sliders, description: 'Perspectivas estratégicas del CMI' }
      ]
    }
  ] : isBovinos ? [
    {
      id: 'panel_general',
      label: 'Panel General',
      icon: LayoutDashboard,
      items: [
        { key: 'inicio', label: 'Inicio · Ganadería Bovina', icon: LayoutDashboard, description: 'Síntesis ejecutiva de rodeo, ADPV, forraje y CMI' }
      ]
    },
    {
      id: 'produccion',
      label: 'Producción',
      icon: Layers,
      items: [
        { 
          key: 'bov_rodeo', 
          label: 'Rodeo, Cría & Cabaña', 
          icon: Layers, 
          description: 'Roster individual, RFID SENASA, servicios, tacto y destete' 
        },
        { 
          key: 'bov_manga', 
          label: 'Manga & Pesadas (ADPV)', 
          icon: Scale, 
          description: 'Control de pesadas, evolución y condición corporal' 
        },
        { 
          key: 'bov_alimentacion', 
          label: 'Alimentación, Potreros & Carga', 
          icon: Utensils, 
          description: 'Receptividad EV/ha, oferta forrajera y raciones corral' 
        },
        { 
          key: 'bov_sanidad', 
          label: 'Sanidad SENASA', 
          icon: ShieldAlert, 
          description: 'Libreta oficial SENASA, aftosa, carbunclo y actas' 
        },
        { 
          key: 'stock', 
          label: 'Stock de Insumos Bovinos', 
          icon: Boxes, 
          description: 'Silos, rollos, concentrados y vacunas' 
        },
        { 
          key: 'existencias', 
          label: 'Existencias & Cierres', 
          icon: Compass, 
          description: 'Inventario físico y valuación del rodeo' 
        }
      ]
    },
    {
      id: 'gestion_comercial',
      label: 'Gestión Comercial',
      icon: ShoppingCart,
      items: [
        { key: 'compras', label: 'Compras & Proveedores Bovinos', icon: ShoppingCart, description: 'Insumos ganaderos, vacunas y maíz propio UNRC' },
        { 
          key: 'ventas', 
          label: 'Ventas de Hacienda / Liquidaciones', 
          icon: TrendingUp, 
          description: 'Liquidaciones novillos, toros y comprobantes DTE' 
        },
        { 
          key: 'bov_simulacion', 
          label: 'Simulación de Venta', 
          icon: Calculator, 
          description: 'Modelo de decisión incremental con MAG Cañuelas' 
        }
      ]
    },
    {
      id: 'gestion_economica',
      label: 'Gestión Económica',
      icon: Calculator,
      items: [
        { key: 'presupuesto', label: 'Presupuestos & Desvíos Bovinos', icon: Calculator, description: 'Control por campaña y subunidades bovinas' },
        { key: 'historico', label: 'Histórico Económico Bovino', icon: History, description: 'Series cronológicas y margen bruto RT 54' }
      ]
    },
    {
      id: 'modelo_gestion',
      label: 'Modelo de Gestión',
      icon: LineChart,
      items: [
        { key: 'indicadores', label: 'Indicadores & CMI Bovino', icon: LineChart, description: 'Cuadro de Mando Integral 4 perspectivas' }
      ]
    }
  ] : [
    {
      id: 'panel_general',
      label: 'Panel General',
      icon: LayoutDashboard,
      items: [
        { key: 'inicio', label: isOvinos ? 'Inicio · Ganadería Ovina' : 'Inicio / Panel General', icon: LayoutDashboard }
      ]
    },
    {
      id: 'produccion',
      label: 'Producción',
      icon: Layers,
      items: isOvinos ? [
        { key: 'ovi_majada', label: 'Majada y Categorías', icon: Layers, description: 'Estructura y condición' },
        { key: 'ovi_zafra', label: 'Zafras Laneras', icon: Shield, description: 'Esquila y vellón' },
        { key: 'ovi_sanidad', label: 'Sanidad', icon: Shield, description: 'Eventos y señalada' },
        { key: 'alimentacion', label: 'Pasturas & Suplementación', icon: Utensils, description: 'Carga y flushing' },
        { key: 'stock', label: 'Stock de Insumos', icon: Boxes, description: 'Silos y materias primas' },
        { key: 'existencias', label: 'Existencias & Cierres', icon: Compass, description: 'Inventario físico' }
      ] : [
        { 
          key: 'produccion', 
          label: 'Producción & Piara', 
          icon: Layers, 
          description: 'Cría, recría y destetes' 
        },
        { 
          key: 'alimentacion', 
          label: 'Alimentación & Raciones', 
          icon: Utensils, 
          description: 'Consumos y dietas' 
        },
        { key: 'stock', label: 'Stock de Insumos', icon: Boxes, description: 'Silos y materias primas' },
        { key: 'existencias', label: 'Existencias & Cierres', icon: Compass, description: 'Inventario físico y valuación' }
      ]
    },
    {
      id: 'gestion_comercial',
      label: 'Gestión Comercial',
      icon: ShoppingCart,
      items: [
        { key: 'compras', label: 'Compras & Proveedores', icon: ShoppingCart, description: 'Insumos y costos directos' },
        { 
          key: 'ventas', 
          label: isOvinos ? 'Venta Corderos & Carne' : 'Ventas de Hacienda', 
          icon: TrendingUp, 
          description: isOvinos ? 'Consignación cordero pesado' : 'Capones, cerdas y clientes' 
        },
        ...(isOvinos ? [
          { 
            key: 'ovi_simulacion' as ModuleKey, 
            label: 'Simulación de Venta', 
            icon: Calculator, 
            description: 'Simulador de comercialización de carne y corderos' 
          }
        ] : [
          { 
            key: 'porc_simulacion' as ModuleKey, 
            label: 'Simulación de Venta', 
            icon: Calculator, 
            description: 'Simulador comercial de capones, cachorros y lechones' 
          }
        ])
      ]
    },
    {
      id: 'gestion_economica',
      label: 'Gestión Económica',
      icon: Calculator,
      items: [
        { key: 'presupuesto', label: 'Presupuestos & Desvíos', icon: Calculator, description: 'Control presupuestario' },
        { key: 'historico', label: 'Histórico Económico', icon: History, description: 'Series temporales y evolución' }
      ]
    },
    {
      id: 'modelo_gestion',
      label: 'Modelo de Gestión',
      icon: LineChart,
      items: [
        { key: 'indicadores', label: 'Indicadores & CMI', icon: LineChart, description: 'Cuadro de Mando Integral' }
      ]
    }
  ];

  // Secciones inferiores fijas e independientes de la unidad activa: Administración y Ayuda
  const bottomGroups: NavGroup[] = [
    {
      id: 'administracion',
      label: 'Administración',
      icon: Settings,
      items: [
        { key: 'usuarios', label: 'Gestión de Usuarios & Maestros', icon: Users, description: 'Usuarios, clientes y proveedores' },
        { key: 'configuracion', label: 'Configuración & Sheets', icon: Settings, description: 'Conexión a Google Sheets' },
        { key: 'auditoria', label: 'Auditoría & Trazabilidad', icon: ShieldAlert, badge: observedCount, description: 'Control de inconsistencias' }
      ]
    },
    {
      id: 'ayuda',
      label: 'Ayuda',
      icon: HelpCircle,
      items: [
        { key: 'manual', label: 'Manual de Uso (PDF)', icon: BookOpen, description: 'Documentación oficial descargable e imprimible' },
        { key: 'tour', label: 'Guía Interactiva (Tour)', icon: Play, description: 'Recorrido guiado interactivo paso a paso' },
        { key: 'gemini', label: 'Asistente IA', icon: Sparkles, description: 'Consultar al Asistente IA de Pozo del Carril' }
      ]
    }
  ];

  const groups: NavGroup[] = [...coreGroups, ...bottomGroups];

  // Identificar qué grupo contiene el módulo activo
  const findGroupIdForModule = (mod: ModuleKey): string => {
    for (const g of groups) {
      if (g.items.some(i => i.key === mod)) {
        return g.id;
      }
    }
    return 'panel_general';
  };

  // Estado de grupos abiertos: inicialmente contraídos (todos false al inicio)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    panel_general: false,
    produccion: false,
    gestion_comercial: false,
    gestion_economica: false,
    modelo_gestion: false,
    administracion: false,
    ayuda: false
  });

  const isInitialMount = React.useRef(true);

  // Escuchar eventos de la guía interactiva para expandir o contraer grupos cuando se destaca un elemento
  useEffect(() => {
    const handleTourExpand = (e: any) => {
      const groupId = e.detail?.groupId;
      if (groupId) {
        setOpenGroups(prev => ({ ...prev, [groupId]: true }));
      }
    };
    const handleTourReset = () => {
      setOpenGroups({
        panel_general: false,
        produccion: false,
        gestion_comercial: false,
        gestion_economica: false,
        modelo_gestion: false,
        administracion: false,
        ayuda: false
      });
    };
    window.addEventListener('tour-expand-group', handleTourExpand);
    window.addEventListener('tour-close-all-groups', handleTourReset);
    return () => {
      window.removeEventListener('tour-expand-group', handleTourExpand);
      window.removeEventListener('tour-close-all-groups', handleTourReset);
    };
  }, []);

  // Al navegar directamente a un submódulo específico posterior al inicio, expandir únicamente ese grupo
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const activeGroupId = findGroupIdForModule(activeModule);
    if (activeGroupId && activeModule !== 'inicio') {
      setOpenGroups(prev => ({
        ...prev,
        [activeGroupId]: true
      }));
    }
  }, [activeModule]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getRoleIcon = () => {
    switch (permissions.rolId) {
      case 'ROL_ADMIN':
        return Shield;
      case 'ROL_ENCARGADO':
        return Briefcase;
      case 'ROL_OPERARIO':
        return Wrench;
      case 'ROL_AUDITOR':
        return FileSearch;
      default:
        return Lock;
    }
  };

  const RoleIcon = getRoleIcon();

  const theme = {
    PORCINOS: {
      sidebarBg: 'bg-[#0a1b12] text-[#b4d2bd] border-[#153823]',
      headerBg: 'bg-[#07150e] border-[#143622]',
      logoBg: 'bg-[#1b5033] border-[#2d774e] text-white',
      groupBg: 'border-[#143622]/60 bg-[#0c2217]/50',
      groupActive: 'text-white bg-[#143d28]',
      groupHover: 'text-[#8cb498] hover:text-white hover:bg-[#112f1f]',
      groupIconActive: 'text-[#34d399]',
      groupIconInactive: 'text-[#6b9979]',
      subBg: 'bg-[#091a11]/60 border-[#143622]/40',
      itemActive: 'bg-[#18482d] text-white shadow-xs border-l-3 border-[#34d399]',
      itemInactive: 'text-[#a2c2ad] hover:text-white hover:bg-[#123120]',
      itemIconActive: 'text-[#34d399]',
      itemIconInactive: 'text-[#6a9878]',
      roleBox: 'bg-[#0f281b] border-[#1b482e]',
      roleIconBg: 'bg-[#183e29] border-[#26633f] text-[#34d399]'
    },
    BOVINOS: {
      sidebarBg: 'bg-[#1c120c] text-[#e6dbd0] border-[#362319]',
      headerBg: 'bg-[#120a06] border-[#2c1b12]',
      logoBg: 'bg-[#78350f] border-[#92400e] text-amber-100',
      groupBg: 'border-[#362319]/60 bg-[#251811]/50',
      groupActive: 'text-white bg-[#45230f]',
      groupHover: 'text-[#d4b8a3] hover:text-white hover:bg-[#2d1b13]',
      groupIconActive: 'text-[#f59e0b]',
      groupIconInactive: 'text-[#a8826c]',
      subBg: 'bg-[#170e0a]/60 border-[#362319]/40',
      itemActive: 'bg-[#78350f] text-white shadow-xs border-l-3 border-[#f59e0b]',
      itemInactive: 'text-[#d1bcaa] hover:text-white hover:bg-[#331f15]',
      itemIconActive: 'text-[#f59e0b]',
      itemIconInactive: 'text-[#a8826c]',
      roleBox: 'bg-[#29170e] border-[#422617]',
      roleIconBg: 'bg-[#3d2315] border-[#59331f] text-[#f59e0b]'
    },
    OVINOS: {
      sidebarBg: 'bg-[#090e17] text-[#cbd5e1] border-[#1e293b]',
      headerBg: 'bg-[#05080d] border-[#111827]',
      logoBg: 'bg-[#1e40af] border-[#2563eb] text-blue-100',
      groupBg: 'border-[#1e293b]/60 bg-[#0f172a]/50',
      groupActive: 'text-white bg-[#172554]',
      groupHover: 'text-[#94a3b8] hover:text-white hover:bg-[#111827]',
      groupIconActive: 'text-[#38bdf8]',
      groupIconInactive: 'text-[#64748b]',
      subBg: 'bg-[#070b14]/60 border-[#1e293b]/40',
      itemActive: 'bg-[#1e40af] text-white shadow-xs border-l-3 border-[#38bdf8]',
      itemInactive: 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]',
      itemIconActive: 'text-[#38bdf8]',
      itemIconInactive: 'text-[#64748b]',
      roleBox: 'bg-[#0f172a] border-[#1e293b]',
      roleIconBg: 'bg-[#1e293b] border-[#334155] text-[#38bdf8]'
    },
    CONSOLIDADO: {
      sidebarBg: 'bg-[#110c1d] text-[#e0e7ff] border-[#2e234a]',
      headerBg: 'bg-[#0a0712] border-[#221938]',
      logoBg: 'bg-[#581c87] border-[#7e22ce] text-purple-100',
      groupBg: 'border-[#2e234a]/60 bg-[#19112e]/50',
      groupActive: 'text-white bg-[#3b1160]',
      groupHover: 'text-[#c4b5fd] hover:text-white hover:bg-[#25183d]',
      groupIconActive: 'text-[#c084fc]',
      groupIconInactive: 'text-[#9a84be]',
      subBg: 'bg-[#130d24]/60 border-[#2e234a]/40',
      itemActive: 'bg-[#581c87] text-white shadow-xs border-l-3 border-[#c084fc]',
      itemInactive: 'text-[#d8b4fe]/80 hover:text-white hover:bg-[#2b184d]',
      itemIconActive: 'text-[#c084fc]',
      itemIconInactive: 'text-[#9a84be]',
      roleBox: 'bg-[#1d1433] border-[#322354]',
      roleIconBg: 'bg-[#2b1c4d] border-[#432c75] text-[#c084fc]'
    }
  }[activeBusinessUnit] || {
    sidebarBg: 'bg-[#0a1b12] text-[#b4d2bd] border-[#153823]',
    headerBg: 'bg-[#07150e] border-[#143622]',
    logoBg: 'bg-[#1b5033] border-[#2d774e] text-white',
    groupBg: 'border-[#143622]/60 bg-[#0c2217]/50',
    groupActive: 'text-white bg-[#143d28]',
    groupHover: 'text-[#8cb498] hover:text-white hover:bg-[#112f1f]',
    groupIconActive: 'text-[#34d399]',
    groupIconInactive: 'text-[#6b9979]',
    subBg: 'bg-[#091a11]/60 border-[#143622]/40',
    itemActive: 'bg-[#18482d] text-white shadow-xs border-l-3 border-[#34d399]',
    itemInactive: 'text-[#a2c2ad] hover:text-white hover:bg-[#123120]',
    itemIconActive: 'text-[#34d399]',
    itemIconInactive: 'text-[#6a9878]',
    roleBox: 'bg-[#0f281b] border-[#1b482e]',
    roleIconBg: 'bg-[#183e29] border-[#26633f] text-[#34d399]'
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <aside 
      id="tour-sidebar"
      className={`w-68 ${theme.sidebarBg} flex flex-col shrink-0 border-r select-none font-sans transition-all duration-200`}
    >
      {/* Encabezado del Sistema */}
      <div className={`p-4 border-b ${theme.headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${theme.logoBg} border flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
            PC
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm tracking-tight truncate">
              Pozo del Carril
            </span>
            <span className="text-[10px] opacity-80 truncate font-semibold uppercase tracking-wider">
              {activeBusinessUnit === 'BOVINOS' ? 'GANADERÍA BOVINA' : activeBusinessUnit === 'OVINOS' ? 'GANADERÍA OVINA' : activeBusinessUnit === 'CONSOLIDADO' ? 'VISTA CONSOLIDADA' : 'GANADERÍA PORCINA'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenReorderTabs && (
            <button
              type="button"
              onClick={onOpenReorderTabs}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Personalizar Orden y Agrupación de Pestañas"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Ocultar menú lateral (Ver pantalla completa)"
            >
              <PanelLeftClose className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Navegación con Secciones Desplegables */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar flex flex-col justify-between">
        <div className="space-y-1.5">
          {isConsolidado ? (
            <div className="space-y-1.5">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#c084fc] opacity-90">
                Vista Consolidada
              </div>
              {[
                { key: 'panel', label: '1. Tablero Ejecutivo', icon: BarChart3 },
                { key: 'economico', label: '2. Estado de Resultados & Conciliación', icon: DollarSign },
                { key: 'productivo', label: '3. Situación Productiva por Especie', icon: Layers },
                { key: 'auditoria', label: '4. Auditoría Matemática (Pruebas A-I)', icon: FileCheck2 },
                { key: 'cmi', label: '5. Cuadro de Mando Integral', icon: Sliders }
              ].filter(tab => permissions.allowedModules.includes(tab.key as ModuleKey)).map(tab => {
                const Icon = tab.icon;
                const isActive = consolidadoTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      onSelectConsolidadoTab?.(tab.key);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#581c87] text-white shadow-sm border-l-3 border-[#c084fc]'
                        : 'text-[#d8b4fe]/80 hover:text-white hover:bg-[#2b184d]'
                    }`}
                    title={tab.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c084fc]' : 'text-[#9a84be]'}`} />
                    <span className="truncate text-left">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            coreGroups.map((group) => {
            // Filtrar items según permisos del usuario
            const visibleItems = group.items.filter(item => permissions.allowedModules.includes(item.key));
            
            // Si el grupo no tiene items visibles para este rol, no mostrarlo
            if (visibleItems.length === 0) return null;

            const isGroupOpen = !!openGroups[group.id];
            const hasActiveChild = isConsolidado
              ? visibleItems.some(i => i.key === consolidadoTab)
              : visibleItems.some(i => i.key === activeModule);
            const GroupIcon = group.icon;

            return (
              <div 
                key={group.id} 
                id={`tour-group-${group.id}`}
                className={`rounded-xl overflow-hidden border ${theme.groupBg}`}
              >
                {/* Botón de Cabecera del Grupo */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    hasActiveChild
                      ? theme.groupActive
                      : theme.groupHover
                  }`}
                  title={`Expandir o contraer ${group.label}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? theme.groupIconActive : theme.groupIconInactive}`} />
                    <span className="tracking-wide uppercase text-[11px] truncate">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Badge de alertas en cabecera si está contraído */}
                    {!isGroupOpen && visibleItems.some(i => i.badge && i.badge > 0) && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#b91c1c] text-white">
                        !
                      </span>
                    )}
                    {isGroupOpen ? (
                      <ChevronDown className={`w-3.5 h-3.5 ${theme.groupIconInactive}`} />
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 ${theme.groupIconInactive}`} />
                    )}
                  </div>
                </button>

                {/* Sub-módulos Desplegables */}
                {isGroupOpen && (
                  <div className={`px-1.5 py-1 space-y-0.5 ${theme.subBg} border-t`}>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isConsolidado ? consolidadoTab === item.key : activeModule === item.key;
                      return (
                        <button
                          key={item.key}
                          id={`tour-nav-${item.key}`}
                          type="button"
                          onClick={() => {
                            if (item.key === 'tour') {
                              onStartTour?.();
                            } else if (item.key === 'gemini') {
                              onOpenGemini?.();
                            } else if (isConsolidado) {
                              onSelectConsolidadoTab?.(item.key);
                            } else {
                              onSelectModule(item.key);
                            }
                          }}
                          className={`w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isActive
                              ? theme.itemActive
                              : theme.itemInactive
                          }`}
                          title={item.description || item.label}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className={`w-3 h-3 shrink-0 ${isActive ? theme.itemIconActive : theme.itemIconInactive}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#b91c1c] text-white shrink-0 ml-2">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        {/* Sección inferior fija para Administración y Ayuda (Separada de las pestañas variables por unidad) */}
        <div className="pt-6 mt-6 border-t border-current/15 space-y-1.5">
          <div className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
            Sistema & Soporte
          </div>
          {bottomGroups.map((group) => {
            // Filtrar items según permisos del usuario
            const visibleItems = group.items.filter(item => permissions.allowedModules.includes(item.key));
            
            // Si el grupo no tiene items visibles para este rol, no mostrarlo
            if (visibleItems.length === 0) return null;

            const isGroupOpen = !!openGroups[group.id];
            const hasActiveChild = visibleItems.some(i => i.key === activeModule);
            const GroupIcon = group.icon;

            return (
              <div 
                key={group.id} 
                id={`tour-group-${group.id}`}
                className={`rounded-xl overflow-hidden border ${theme.groupBg}`}
              >
                {/* Botón de Cabecera del Grupo */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    hasActiveChild
                      ? theme.groupActive
                      : theme.groupHover
                  }`}
                  title={`Expandir o contraer ${group.label}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveChild ? theme.groupIconActive : theme.groupIconInactive}`} />
                    <span className="tracking-wide uppercase text-[11px] truncate">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Badge de alertas en cabecera si está contraído */}
                    {!isGroupOpen && visibleItems.some(i => i.badge && i.badge > 0) && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#b91c1c] text-white">
                        !
                      </span>
                    )}
                    {isGroupOpen ? (
                      <ChevronDown className={`w-3.5 h-3.5 ${theme.groupIconInactive}`} />
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 ${theme.groupIconInactive}`} />
                    )}
                  </div>
                </button>

                {/* Sub-módulos Desplegables */}
                {isGroupOpen && (
                  <div className={`px-1.5 py-1 space-y-0.5 ${theme.subBg} border-t`}>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeModule === item.key;
                      return (
                        <button
                          key={item.key}
                          id={`tour-nav-${item.key}`}
                          type="button"
                          onClick={() => {
                            if (item.key === 'tour') {
                              onStartTour?.();
                            } else if (item.key === 'gemini') {
                              onOpenGemini?.();
                            } else {
                              onSelectModule(item.key);
                            }
                          }}
                          className={`w-full flex items-center justify-between pl-8 pr-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                            isActive
                              ? theme.itemActive
                              : theme.itemInactive
                          }`}
                          title={item.description || item.label}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className={`w-3 h-3 shrink-0 ${isActive ? theme.itemIconActive : theme.itemIconInactive}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#b91c1c] text-white shrink-0 ml-2">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* BOTÓN OBLIGATORIO DE GANADERIA AL FINAL DE LA NAVEGACIÓN LATERAL */}
      <div className={`px-3 pt-3 pb-1 border-t ${theme.headerBg}`}>
        <button
          id="tour-ganaderia-btn"
          type="button"
          onClick={onOpenGemini}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md border border-emerald-600/50 transition-all cursor-pointer group"
          title="Abrir Asistente de IA GanaderIA"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-700/80 text-emerald-200 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="tracking-wide">GanaderIA</span>
          </div>
          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-semibold">
            Asistente IA
          </span>
        </button>
      </div>

      {/* Pie de Barra Lateral: Info de Rango y Perfil */}
      <div className={`p-3 ${theme.headerBg}`}>
        <div className={`${theme.roleBox} p-2.5 rounded-xl border flex items-center gap-2.5`}>
          <div className={`w-7 h-7 rounded-lg ${theme.roleIconBg} border flex items-center justify-center shrink-0`}>
            <RoleIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-white truncate">
              {currentUser?.nombre || 'Usuario'}
            </span>
            <span className="text-[10px] opacity-80 truncate">
              {permissions.roleShortName}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
