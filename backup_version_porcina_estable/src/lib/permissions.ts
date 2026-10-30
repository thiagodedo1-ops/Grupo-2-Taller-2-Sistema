/**
 * @file permissions.ts
 * @description Control de Acceso Basado en Roles (RBAC) para el Sistema de Gestión Porcina
 * Taller de Práctica II - FCE UNRC - Grupo 2
 *
 * Niveles y Rangos:
 * 1. ROL_ADMIN (Administrador General): Acceso total, auditoría, configuración, cierres y reaperturas.
 * 2. ROL_ENCARGADO (Encargado de Producción): Gestión operativa, compras, ventas, confirmación y cierres.
 * 3. ROL_OPERARIO (Operario de Campo): Carga en campo (partos, pases, raciones, stock) solo en borrador.
 * 4. ROL_AUDITOR (Auditor / Consultor): Modo Solo Lectura en módulos operativos, indicadores y trazabilidad.
 */

import { Usuario, RolId } from '../types/schema';
import { ModuleKey } from '../components/Sidebar';

export interface RolePermissions {
  rolId: RolId | string;
  roleName: string;
  roleShortName: string;
  allowedModules: ModuleKey[];
  canCreate: (module: ModuleKey) => boolean;
  canEdit: (module: ModuleKey) => boolean;
  canConfirm: (module: ModuleKey) => boolean;
  canCancel: (module: ModuleKey) => boolean;
  canClosePeriod: boolean;
  canReopenPeriod: boolean;
  canManageConfig: boolean;
  canViewFinancials: boolean;
  isReadOnly: boolean;
  canModifyMetas: boolean;
  canCreateRecords: boolean;
  canModifyRecords: boolean;
  canDeleteRecords: boolean;
  badgeLabel: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  description: string;
}

export function getRolePermissions(user: Usuario | null): RolePermissions {
  if (!user) {
    return {
      rolId: 'ANONYMOUS',
      roleName: 'Sin Sesión',
      roleShortName: 'Invitado',
      allowedModules: ['inicio', 'manual'],
      canCreate: () => false,
      canEdit: () => false,
      canConfirm: () => false,
      canCancel: () => false,
      canClosePeriod: false,
      canReopenPeriod: false,
      canManageConfig: false,
      canViewFinancials: false,
      isReadOnly: true,
      canModifyMetas: false,
      canCreateRecords: false,
      canModifyRecords: false,
      canDeleteRecords: false,
      badgeLabel: 'No autenticado',
      badgeStyle: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200'
      },
      description: 'Usuario no autenticado'
    };
  }

  const role = String(user.rol_id).trim().toUpperCase();

  switch (role) {
    case 'ROL_ADMIN':
      return {
        rolId: 'ROL_ADMIN',
        roleName: 'Administrador General',
        roleShortName: 'Administrador',
        allowedModules: [
          'inicio',
          'produccion',
          'alimentacion',
          'compras',
          'ventas',
          'stock',
          'existencias',
          'presupuesto',
          'historico',
          'indicadores',
          'usuarios',
          'manual',
          'auditoria',
          'configuracion'
        ],
        canCreate: () => true,
        canEdit: () => true,
        canConfirm: () => true,
        canCancel: () => true,
        canClosePeriod: true,
        canReopenPeriod: true,
        canManageConfig: true,
        canViewFinancials: true,
        isReadOnly: false,
        canModifyMetas: true,
        canCreateRecords: true,
        canModifyRecords: true,
        canDeleteRecords: true,
        badgeLabel: 'Administrador',
        badgeStyle: {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200'
        },
        description: 'Acceso irrestricto, configuración del sistema, auditoría, cierres y reaperturas.'
      };

    case 'ROL_ENCARGADO':
      return {
        rolId: 'ROL_ENCARGADO',
        roleName: 'Encargado de Producción',
        roleShortName: 'Encargado',
        allowedModules: [
          'inicio',
          'produccion',
          'alimentacion',
          'compras',
          'ventas',
          'stock',
          'existencias',
          'presupuesto',
          'historico',
          'indicadores',
          'manual',
          'auditoria'
        ],
        canCreate: (mod) => mod !== 'configuracion',
        canEdit: (mod) => mod !== 'configuracion',
        canConfirm: () => true,
        canCancel: () => true,
        canClosePeriod: true,
        canReopenPeriod: false, // Solo Admin puede reabrir períodos
        canManageConfig: false,
        canViewFinancials: true,
        isReadOnly: false,
        canModifyMetas: true,
        canCreateRecords: true,
        canModifyRecords: true,
        canDeleteRecords: true,
        badgeLabel: 'Encargado',
        badgeStyle: {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200'
        },
        description: 'Gestión técnica y comercial completa, confirmación de comprobantes y cierre de período.'
      };

    case 'ROL_OPERARIO':
      return {
        rolId: 'ROL_OPERARIO',
        roleName: 'Operario de Campo',
        roleShortName: 'Operario',
        allowedModules: [
          'inicio',
          'produccion',
          'alimentacion',
          'stock',
          'manual'
        ],
        canCreate: (mod) => ['produccion', 'alimentacion', 'stock'].includes(mod),
        canEdit: (mod) => ['produccion', 'alimentacion', 'stock'].includes(mod),
        canConfirm: () => false, // Requiere validación del Encargado
        canCancel: () => false,
        canClosePeriod: false,
        canReopenPeriod: false,
        canManageConfig: false,
        canViewFinancials: false, // Precios y márgenes reservados
        isReadOnly: false,
        canModifyMetas: false,
        canCreateRecords: true,
        canModifyRecords: true,
        canDeleteRecords: false,
        badgeLabel: 'Operario de Campo',
        badgeStyle: {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200'
        },
        description: 'Registro de novedades en campo (partos, pases, raciones). Guarda en borrador.'
      };

    case 'ROL_AUDITOR':
      return {
        rolId: 'ROL_AUDITOR',
        roleName: 'Auditor / Consultor',
        roleShortName: 'Auditor',
        allowedModules: [
          'inicio',
          'produccion',
          'alimentacion',
          'compras',
          'ventas',
          'stock',
          'existencias',
          'presupuesto',
          'historico',
          'indicadores',
          'manual',
          'auditoria'
        ],
        canCreate: () => false,
        canEdit: () => false,
        canConfirm: () => false,
        canCancel: () => false,
        canClosePeriod: false,
        canReopenPeriod: false,
        canManageConfig: false,
        canViewFinancials: true,
        isReadOnly: true, // Estricto solo lectura
        canModifyMetas: false,
        canCreateRecords: false,
        canModifyRecords: false,
        canDeleteRecords: false,
        badgeLabel: 'Auditor (Solo Lectura)',
        badgeStyle: {
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200'
        },
        description: 'Revisión y verificación de consistencia, trazabilidad e indicadores sin permisos de edición.'
      };

    default:
      return {
        rolId: role,
        roleName: 'Usuario General',
        roleShortName: 'Usuario',
        allowedModules: ['inicio', 'produccion', 'alimentacion', 'stock', 'manual'],
        canCreate: () => false,
        canEdit: () => false,
        canConfirm: () => false,
        canCancel: () => false,
        canClosePeriod: false,
        canReopenPeriod: false,
        canManageConfig: false,
        canViewFinancials: false,
        isReadOnly: true,
        canModifyMetas: false,
        canCreateRecords: false,
        canModifyRecords: false,
        canDeleteRecords: false,
        badgeLabel: 'Usuario',
        badgeStyle: {
          bg: 'bg-slate-50',
          text: 'text-slate-600',
          border: 'border-slate-200'
        },
        description: 'Perfil con permisos básicos de visualización.'
      };
  }
}
