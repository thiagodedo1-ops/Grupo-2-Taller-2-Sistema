/**
 * @file Sidebar.tsx
 * @description Barra lateral de navegación con paleta agropecuaria porcina y acceso a todos los módulos
 * Requerimientos 3, 5, 6 y 7: Inclusión de Presupuesto y Desvíos, Histórico Económico,
 * Indicadores de Gestión y nombres profesionales.
 */

import React from 'react';
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
  SlidersHorizontal,
  Users
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
  | 'usuarios';

interface Props {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  observedCount: number;
  currentUser?: Usuario | null;
  onOpenManual?: () => void;
  onOpenGemini?: () => void;
  onOpenReorderTabs?: () => void;
  customOrder?: ModuleKey[];
}

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<Props> = ({ 
  activeModule, 
  onSelectModule, 
  observedCount,
  currentUser = null,
  onOpenManual,
  onOpenGemini,
  onOpenReorderTabs,
  customOrder = []
}) => {
  const permissions = getRolePermissions(currentUser);

  const allNavItems: NavItem[] = [
    { key: 'inicio', label: 'Panel General', icon: LayoutDashboard },
    { key: 'produccion', label: 'Producción', icon: Layers },
    { key: 'alimentacion', label: 'Alimentación', icon: Utensils },
    { key: 'stock', label: 'Stock', icon: Boxes },
    { key: 'compras', label: 'Compras', icon: ShoppingCart },
    { key: 'ventas', label: 'Ventas', icon: TrendingUp },
    { key: 'existencias', label: 'Existencias', icon: Compass },
    { key: 'presupuesto', label: 'Presupuesto y Desvíos', icon: Calculator },
    { key: 'historico', label: 'Histórico Económico', icon: History },
    { key: 'indicadores', label: 'Indicadores de Gestión', icon: LineChart },
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'auditoria', label: 'Auditoría', icon: ShieldAlert, badge: observedCount },
    { key: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  // Filtrar según los módulos permitidos para el rango del usuario
  const allowed = allNavItems.filter((item) => permissions.allowedModules.includes(item.key));

  // Ordenar según la personalización a gusto propio del usuario
  const navItems = customOrder && customOrder.length > 0
    ? [...allowed].sort((a, b) => {
        const idxA = customOrder.indexOf(a.key);
        const idxB = customOrder.indexOf(b.key);
        const posA = idxA === -1 ? 999 : idxA;
        const posB = idxB === -1 ? 999 : idxB;
        return posA - posB;
      })
    : allowed;

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

  return (
    <aside className="w-64 bg-[#0c1f15] text-[#b9d3c2] flex flex-col shrink-0 border-r border-[#193d29] select-none font-sans">
      {/* Encabezado del Sistema */}
      <div className="p-4 border-b border-[#163624] bg-[#081810]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1c4b31] border border-[#2b714b] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            PC
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm tracking-tight truncate">
              Pozo del Carril
            </span>
            <span className="text-[11px] text-[#86a893] truncate font-medium">
              Unidad Porcina · UNRC
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Navegación */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#678873]">
          <span>Modelo de Gestión</span>
          {onOpenReorderTabs && (
            <button
              onClick={onOpenReorderTabs}
              className="p-1 rounded text-[#729c81] hover:text-white hover:bg-[#163c26] transition-colors cursor-pointer flex items-center gap-1"
              title="Personalizar orden de pestañas"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectModule(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#183d28] text-white shadow-sm ring-1 ring-[#38885b]/50 border-l-4 border-[#34d399]'
                  : 'text-[#a2c2ad] hover:text-white hover:bg-[#122e1e]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#34d399]' : 'text-[#729c81]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#b91c1c] text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Sección Ayuda */}
        <div className="pt-4 mt-3 border-t border-[#163624]">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#678873]">
            Ayuda
          </div>
          <button
            onClick={() => onSelectModule('manual')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'manual'
                ? 'bg-[#183d28] text-white shadow-sm ring-1 ring-[#38885b]/50 border-l-4 border-[#34d399]'
                : 'text-[#a2c2ad] hover:text-white hover:bg-[#122e1e]'
            }`}
            title="Abrir Manual de Uso del Sistema"
          >
            <div className="flex items-center gap-2.5 truncate">
              <BookOpen className={`w-4 h-4 shrink-0 ${activeModule === 'manual' ? 'text-[#34d399]' : 'text-[#729c81]'}`} />
              <span className="truncate">Manual de Uso</span>
            </div>
          </button>
          <button
            onClick={onOpenGemini}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#a2c2ad] hover:text-white hover:bg-[#122e1e] transition-all cursor-pointer mt-1"
            title="Consultar al Asistente de IA (Gemini)"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Sparkles className="w-4 h-4 shrink-0 text-[#729c81]" />
              <span className="truncate">Asistente IA (Gemini)</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Pie de Barra Lateral: Info de Rango y Perfil */}
      <div className="p-3 border-t border-[#163624] bg-[#081710]">
        <div className="bg-[#11291b] p-2.5 rounded-xl border border-[#1b432d] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#183b27] border border-[#255e3e] flex items-center justify-center shrink-0">
            <RoleIcon className="w-3.5 h-3.5 text-[#34d399]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-white truncate">
              {currentUser?.nombre || 'Usuario'}
            </span>
            <span className="text-[10px] text-[#86a893] truncate">
              {permissions.roleShortName}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
