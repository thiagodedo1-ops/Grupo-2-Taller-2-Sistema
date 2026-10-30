/**
 * @file UsuariosView.tsx
 * @description Módulo de Administración Centralizada: Usuarios, Clientes, Proveedores y Catálogos Maestros
 * Integración directa con Google Sheets y Control de Acceso Basado en Roles (RBAC)
 * Establecimiento Pozo del Carril · La Aguada - UNRC - FCE
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Building2,
  Truck,
  FolderTree,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  Briefcase,
  Wrench,
  FileSearch,
  ShieldCheck,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { BaseDatosPorcina, Usuario, Cliente, Proveedor } from '../types/schema';
import { dbManager } from '../lib/storage';
import { generateRandomPassword } from '../lib/security';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  isOnlineWithSheets: boolean;
  onSync: () => Promise<boolean>;
}

type TabKey = 'usuarios' | 'clientes' | 'proveedores' | 'catalogos' | 'auditoria';

export const UsuariosView: React.FC<Props> = ({
  db,
  currentUser,
  isOnlineWithSheets,
  onSync
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('usuarios');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userForm, setUserForm] = useState({
    usuario: '',
    nombre: '',
    rol_id: 'ROL_OPERARIO',
    password: '',
    confirmPassword: '',
    activo: true
  });
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Modal Restablecer Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<Usuario | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Modal Cliente
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteForm, setClienteForm] = useState<Partial<Cliente>>({
    razon_social: '',
    cuit: '',
    condicion_iva: 'Responsable Inscripto',
    direccion: '',
    localidad: '',
    provincia: 'Córdoba',
    telefono: '',
    email: '',
    condiciones_pago: 'Contado',
    observaciones: '',
    activo: true
  });

  // Modal Proveedor
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [proveedorForm, setProveedorForm] = useState<Partial<Proveedor>>({
    razon_social: '',
    cuit: '',
    condicion_iva: 'Responsable Inscripto',
    direccion: '',
    localidad: '',
    provincia: 'Córdoba',
    telefono: '',
    email: '',
    tipo_suministro: 'Granos y Cereales',
    condiciones_pago: 'Contado',
    observaciones: '',
    activo: true
  });

  // Otros catálogos
  const [selectedCatalog, setSelectedCatalog] = useState<'D_Insumo' | 'Categorias_SENASA' | 'D_Cuenta'>('D_Insumo');

  // Control de Acceso Estricto: Sólo Administradores
  const isAdmin = currentUser?.rol_id === 'ROL_ADMIN';

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Acceso Exclusivo de Administrador</h2>
        <p className="text-sm text-slate-600 mt-2">
          El módulo de <strong>Usuarios y Administración Centralizada</strong> contiene operaciones de alta sensibilidad técnica y contable. Su usuario actual no posee el rango operativo de Administrador General.
        </p>
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          Si requiere gestionar accesos o catálogos maestros, solicite asistencia al Administrador del establecimiento.
        </div>
      </div>
    );
  }

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- HANDLERS USUARIOS ---
  const handleOpenCreateUser = () => {
    const tempPass = generateRandomPassword();
    setEditingUser(null);
    setUserForm({
      usuario: '',
      nombre: '',
      rol_id: 'ROL_OPERARIO',
      password: tempPass,
      confirmPassword: tempPass,
      activo: true
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user: Usuario) => {
    setEditingUser(user);
    setUserForm({
      usuario: user.usuario,
      nombre: user.nombre,
      rol_id: user.rol_id,
      password: '',
      confirmPassword: '',
      activo: user.activo
    });
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.usuario.trim() || !userForm.nombre.trim()) {
      showNotification('error', 'Complete los campos obligatorios.');
      return;
    }

    if (!editingUser) {
      if (!userForm.password || userForm.password.length < 6) {
        showNotification('error', 'La contraseña inicial debe tener al menos 6 caracteres.');
        return;
      }
      if (userForm.password !== userForm.confirmPassword) {
        showNotification('error', 'Las contraseñas ingresadas no coinciden.');
        return;
      }
    }

    const res = await dbManager.saveUser(
      {
        usuario_id: editingUser?.usuario_id,
        usuario: userForm.usuario.trim(),
        nombre: userForm.nombre.trim(),
        rol_id: userForm.rol_id,
        activo: userForm.activo
      },
      userForm.password ? userForm.password : undefined
    );

    if (res.success) {
      showNotification('success', `Usuario ${editingUser ? 'modificado' : 'creado'} correctamente y registrado en Google Sheets.`);
      setShowUserModal(false);
    } else {
      showNotification('error', res.error || 'Error al guardar el usuario.');
    }
  };

  const handleOpenResetPassword = (user: Usuario) => {
    setResetTargetUser(user);
    setNewPasswordValue(generateRandomPassword());
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (!newPasswordValue || newPasswordValue.length < 6) {
      showNotification('error', 'La nueva contraseña debe tener como mínimo 6 caracteres.');
      return;
    }

    const res = await dbManager.resetUserPassword(resetTargetUser.usuario_id, newPasswordValue);
    if (res.success) {
      showNotification('success', `Contraseña restablecida para ${resetTargetUser.usuario}. El usuario deberá utilizar esta clave temporal.`);
      setShowResetModal(false);
    } else {
      showNotification('error', res.error || 'Error al restablecer contraseña.');
    }
  };

  const handleToggleUserStatus = (user: Usuario) => {
    const newStatus = !user.activo;
    const res = dbManager.toggleUserStatus(user.usuario_id, newStatus);
    if (res.success) {
      showNotification('success', `Usuario ${user.usuario} ${newStatus ? 'activado' : 'desactivado'}.`);
    } else {
      showNotification('error', res.error || 'No se pudo cambiar el estado del usuario.');
    }
  };

  // --- HANDLERS CLIENTES ---
  const handleOpenCreateCliente = () => {
    setEditingCliente(null);
    setClienteForm({
      razon_social: '',
      cuit: '',
      condicion_iva: 'Responsable Inscripto',
      direccion: '',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '',
      email: '',
      condiciones_pago: 'Contado',
      observaciones: '',
      activo: true
    });
    setShowClienteModal(true);
  };

  const handleOpenEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setClienteForm({ ...c });
    setShowClienteModal(true);
  };

  const handleSaveClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteForm.razon_social?.trim()) {
      showNotification('error', 'Ingrese la Razón Social del cliente.');
      return;
    }

    const res = await dbManager.saveCliente({
      ...clienteForm,
      id: editingCliente?.id
    });

    if (res.success) {
      showNotification('success', `Cliente ${clienteForm.razon_social} guardado exitosamente. Ya está disponible en Ventas.`);
      setShowClienteModal(false);
    } else {
      showNotification('error', res.error || 'Error al guardar cliente.');
    }
  };

  const handleToggleClienteStatus = async (c: Cliente) => {
    const res = await dbManager.saveCliente({
      ...c,
      activo: !c.activo
    });
    if (res.success) {
      showNotification('info', `Cliente ${c.razon_social} marcado como ${!c.activo ? 'activo' : 'inactivo'}.`);
    }
  };

  // --- HANDLERS PROVEEDORES ---
  const handleOpenCreateProveedor = () => {
    setEditingProveedor(null);
    setProveedorForm({
      razon_social: '',
      cuit: '',
      condicion_iva: 'Responsable Inscripto',
      direccion: '',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '',
      email: '',
      tipo_suministro: 'Granos y Cereales',
      condiciones_pago: 'Contado',
      observaciones: '',
      activo: true
    });
    setShowProveedorModal(true);
  };

  const handleOpenEditProveedor = (p: Proveedor) => {
    setEditingProveedor(p);
    setProveedorForm({ ...p });
    setShowProveedorModal(true);
  };

  const handleSaveProveedorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorForm.razon_social?.trim()) {
      showNotification('error', 'Ingrese la Razón Social del proveedor.');
      return;
    }

    const res = await dbManager.saveProveedor({
      ...proveedorForm,
      id: editingProveedor?.id
    });

    if (res.success) {
      showNotification('success', `Proveedor ${proveedorForm.razon_social} guardado exitosamente. Ya está disponible en Compras.`);
      setShowProveedorModal(false);
    } else {
      showNotification('error', res.error || 'Error al guardar proveedor.');
    }
  };

  const handleToggleProveedorStatus = async (p: Proveedor) => {
    const res = await dbManager.saveProveedor({
      ...p,
      activo: !p.activo
    });
    if (res.success) {
      showNotification('info', `Proveedor ${p.razon_social} marcado como ${!p.activo ? 'activo' : 'inactivo'}.`);
    }
  };

  // --- LISTAS FILTRADAS ---
  const filteredUsers = useMemo(() => {
    return db.Usuarios.filter(u => {
      const matchText = (u.usuario + ' ' + u.nombre + ' ' + u.rol_id).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchText) return false;
      if (filterEstado === 'ACTIVOS') return u.activo;
      if (filterEstado === 'INACTIVOS') return !u.activo;
      return true;
    });
  }, [db.Usuarios, searchQuery, filterEstado]);

  const filteredClientes = useMemo(() => {
    return db.Clientes.filter(c => {
      const matchText = (c.razon_social + ' ' + c.cuit + ' ' + (c.localidad || '') + ' ' + (c.email || '')).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchText) return false;
      if (filterEstado === 'ACTIVOS') return c.activo;
      if (filterEstado === 'INACTIVOS') return !c.activo;
      return true;
    });
  }, [db.Clientes, searchQuery, filterEstado]);

  const filteredProveedores = useMemo(() => {
    return db.Proveedores.filter(p => {
      const matchText = (p.razon_social + ' ' + p.cuit + ' ' + (p.tipo_suministro || '') + ' ' + (p.localidad || '')).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchText) return false;
      if (filterEstado === 'ACTIVOS') return p.activo;
      if (filterEstado === 'INACTIVOS') return !p.activo;
      return true;
    });
  }, [db.Proveedores, searchQuery, filterEstado]);

  const filteredAuditoria = useMemo(() => {
    return db.Auditoria_Cambios
      .filter(a => ['Usuarios', 'Clientes', 'Proveedores'].includes(a.tabla))
      .slice(0, 50);
  }, [db.Auditoria_Cambios]);

  const getRoleBadge = (rolId: string) => {
    switch (rolId) {
      case 'ROL_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            Administrador
          </span>
        );
      case 'ROL_ENCARGADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Briefcase className="w-3 h-3" />
            Encargado
          </span>
        );
      case 'ROL_OPERARIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3" />
            Operario
          </span>
        );
      case 'ROL_AUDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileSearch className="w-3 h-3" />
            Auditor
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-mono">{rolId}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificación flotante de feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[#eef8f1] text-[#1c6436] border-[#b9e4c5]'
              : feedback.type === 'error'
              ? 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
              : 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline cursor-pointer ml-4">
            Cerrar
          </button>
        </div>
      )}

      {/* Cabecera Principal del Módulo */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d8e2d7] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2e593f] bg-[#eaf4ed] px-2.5 py-0.5 rounded-md border border-[#cbe3d3]">
              Administración Centralizada
            </span>
            <span className="text-xs text-[#627a6c] flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#216b3d]" />
              Acceso exclusivo Administrador
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#143222] tracking-tight">
            Módulo Usuarios & Maestros del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-[#546e5f] mt-1">
            Gestión de usuarios, clientes, proveedores y catálogos maestros sincronizados en tiempo real con Google Sheets.
          </p>
        </div>

        {/* Acciones y Conexión Sheets */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-[#f4f7f4] px-3 py-1.5 rounded-xl border border-[#d8e2d8] text-xs">
            <span className={`w-2 h-2 rounded-full ${isOnlineWithSheets ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`} />
            <span className="text-[#3b5445] font-semibold">
              {isOnlineWithSheets ? 'Sheets Conectado' : 'Almacén Local Resiliente'}
            </span>
          </div>
          <button
            onClick={async () => {
              const ok = await onSync();
              showNotification(ok ? 'success' : 'info', ok ? 'Catálogos sincronizados con Google Sheets.' : 'Modo local activo.');
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#c6d7c8] hover:bg-[#edf4ee] text-xs font-semibold text-[#1f4e32] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Sincronizar ahora con la planilla de Google Sheets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar Sheets</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div className="flex border-b border-[#d8e2d7] gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => { setActiveTab('usuarios'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'usuarios'
              ? 'border-[#1b5e37] text-[#143d24] bg-white border-t border-x border-[#d8e2d7]'
              : 'border-transparent text-[#5c7566] hover:text-[#19442a] hover:bg-[#eef4ee]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios</span>
          <span className="text-[10px] bg-[#e3ece4] text-[#255037] px-2 py-0.5 rounded-full font-mono">
            {db.Usuarios.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('clientes'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'clientes'
              ? 'border-[#1b5e37] text-[#143d24] bg-white border-t border-x border-[#d8e2d7]'
              : 'border-transparent text-[#5c7566] hover:text-[#19442a] hover:bg-[#eef4ee]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestión de Clientes</span>
          <span className="text-[10px] bg-[#e3ece4] text-[#255037] px-2 py-0.5 rounded-full font-mono">
            {db.Clientes.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('proveedores'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'proveedores'
              ? 'border-[#1b5e37] text-[#143d24] bg-white border-t border-x border-[#d8e2d7]'
              : 'border-transparent text-[#5c7566] hover:text-[#19442a] hover:bg-[#eef4ee]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Gestión de Proveedores</span>
          <span className="text-[10px] bg-[#e3ece4] text-[#255037] px-2 py-0.5 rounded-full font-mono">
            {db.Proveedores.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('catalogos'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'catalogos'
              ? 'border-[#1b5e37] text-[#143d24] bg-white border-t border-x border-[#d8e2d7]'
              : 'border-transparent text-[#5c7566] hover:text-[#19442a] hover:bg-[#eef4ee]'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Otros Catálogos</span>
        </button>

        <button
          onClick={() => { setActiveTab('auditoria'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'auditoria'
              ? 'border-[#1b5e37] text-[#143d24] bg-white border-t border-x border-[#d8e2d7]'
              : 'border-transparent text-[#5c7566] hover:text-[#19442a] hover:bg-[#eef4ee]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Auditoría de Cambios</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      {activeTab !== 'catalogos' && activeTab !== 'auditoria' && (
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#759080] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar en ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1f5936]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#657f70] font-medium mr-1">Estado:</span>
              {(['TODOS', 'ACTIVOS', 'INACTIVOS'] as const).map(est => (
                <button
                  key={est}
                  onClick={() => setFilterEstado(est)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    filterEstado === est
                      ? 'bg-[#1b5b35] text-white'
                      : 'bg-[#edf3ee] text-[#446250] hover:bg-[#e1eae2]'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>

            {activeTab === 'usuarios' && (
              <button
                onClick={handleOpenCreateUser}
                className="px-3 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo Usuario</span>
              </button>
            )}

            {activeTab === 'clientes' && (
              <button
                onClick={handleOpenCreateCliente}
                className="px-3 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cliente</span>
              </button>
            )}

            {activeTab === 'proveedores' && (
              <button
                onClick={handleOpenCreateProveedor}
                className="px-3 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Proveedor</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO 1: GESTIÓN DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ece5] bg-[#fbfdfb] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#143222]">Catálogo Central de Usuarios</h3>
              <p className="text-xs text-[#5e7769]">
                Cada usuario tiene un rango operativo asignado. Las contraseñas se almacenan mediante hash criptográfico y nunca en texto plano en Google Sheets.
              </p>
            </div>
            <span className="text-xs text-[#546e5f] font-mono font-medium">
              Mostrando {filteredUsers.length} de {db.Usuarios.length} usuarios
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Nombre y Apellido</th>
                  <th className="p-3">Rango Operativo</th>
                  <th className="p-3">Seguridad</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Último Acceso</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#738b7c] italic">
                      No se encontraron usuarios que coincidan con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.usuario_id} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-semibold text-[#183925]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#e2ede5] text-[#1c4b31] font-bold flex items-center justify-center text-xs">
                            {u.usuario.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-mono text-xs">{u.usuario}</span>
                            <span className="block text-[10px] text-[#738c7d] font-mono">{u.usuario_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-[#20402e]">{u.nombre}</td>
                      <td className="p-3">{getRoleBadge(u.rol_id)}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#587363] bg-[#f2f6f3] px-2 py-0.5 rounded border border-[#dae5dc]">
                          <Lock className="w-3 h-3 text-[#2a6842]" />
                          •••••••• (SHA-256)
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            u.activo
                              ? 'bg-[#eaf6ee] text-[#186435] border border-[#c0e4cb]'
                              : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-[#186435]' : 'bg-[#991b1b]'}`} />
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-[#607b6c] font-mono">
                        {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1 rounded-lg text-[#255d3a] hover:bg-[#eaf4ee] transition-colors cursor-pointer"
                            title="Restablecer Contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1 rounded-lg text-[#1f4e32] hover:bg-[#eaf4ee] transition-colors cursor-pointer"
                            title="Modificar Datos y Rango"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={currentUser?.usuario_id === u.usuario_id}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.usuario_id === u.usuario_id
                                ? 'text-slate-300 cursor-not-allowed'
                                : u.activo
                                ? 'text-[#b91c1c] hover:bg-red-50'
                                : 'text-[#15803d] hover:bg-green-50'
                            }`}
                            title={
                              currentUser?.usuario_id === u.usuario_id
                                ? 'No puede desactivar su propio usuario'
                                : u.activo
                                ? 'Desactivar usuario'
                                : 'Activar usuario'
                            }
                          >
                            {u.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* CONTENIDO 2: GESTIÓN DE CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ece5] bg-[#fbfdfb] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#143222]">Catálogo Maestro de Clientes</h3>
              <p className="text-xs text-[#5e7769]">
                Los clientes registrados aquí se guardan en la hoja de Google Sheets y aparecen automáticamente en los desplegables del módulo Ventas.
              </p>
            </div>
            <span className="text-xs text-[#546e5f] font-mono font-medium">
              Mostrando {filteredClientes.length} de {db.Clientes.length} clientes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                  <th className="p-3">Código</th>
                  <th className="p-3">Razón Social / Frigorífico</th>
                  <th className="p-3">CUIT</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Cond. Pago</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-[#738b7c] italic">
                      No se encontraron clientes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map(c => (
                    <tr key={c.id} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{c.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-[#1a3826] block">{c.razon_social}</span>
                        <span className="text-[11px] text-[#698273]">{c.condicion_iva || 'Responsable Inscripto'}</span>
                      </td>
                      <td className="p-3 font-mono text-[#385343]">{c.cuit}</td>
                      <td className="p-3 text-[#3d5948]">
                        <span>{c.localidad || 'Río Cuarto'}, {c.provincia || 'Córdoba'}</span>
                        {c.direccion && <span className="block text-[10px] text-[#789182]">{c.direccion}</span>}
                      </td>
                      <td className="p-3 text-[#3d5948]">
                        <div>{c.telefono || 'Sin teléfono'}</div>
                        <div className="text-[10px] text-[#688172]">{c.email || ''}</div>
                      </td>
                      <td className="p-3 text-[#3d5948] font-medium">{c.condiciones_pago || 'Contado'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            c.activo
                              ? 'bg-[#eaf6ee] text-[#186435] border border-[#c0e4cb]'
                              : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.activo ? 'bg-[#186435]' : 'bg-[#991b1b]'}`} />
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditCliente(c)}
                            className="p-1 rounded-lg text-[#1f4e32] hover:bg-[#eaf4ee] transition-colors cursor-pointer"
                            title="Modificar Cliente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleClienteStatus(c)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              c.activo ? 'text-[#b91c1c] hover:bg-red-50' : 'text-[#15803d] hover:bg-green-50'
                            }`}
                            title={c.activo ? 'Desactivar cliente' : 'Activar cliente'}
                          >
                            {c.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* CONTENIDO 3: GESTIÓN DE PROVEEDORES */}
      {activeTab === 'proveedores' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ece5] bg-[#fbfdfb] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#143222]">Catálogo Maestro de Proveedores</h3>
              <p className="text-xs text-[#5e7769]">
                Los proveedores registrados se sincronizan en Google Sheets y se integran automáticamente en los desplegables de Compras y Alimentos.
              </p>
            </div>
            <span className="text-xs text-[#546e5f] font-mono font-medium">
              Mostrando {filteredProveedores.length} de {db.Proveedores.length} proveedores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                  <th className="p-3">Código</th>
                  <th className="p-3">Razón Social / Empresa</th>
                  <th className="p-3">CUIT</th>
                  <th className="p-3">Rubro / Suministro</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {filteredProveedores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-[#738b7c] italic">
                      No se encontraron proveedores registrados.
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map(p => (
                    <tr key={p.id} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{p.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-[#1a3826] block">{p.razon_social}</span>
                        <span className="text-[11px] text-[#698273]">{p.condicion_iva || 'Responsable Inscripto'}</span>
                      </td>
                      <td className="p-3 font-mono text-[#385343]">{p.cuit}</td>
                      <td className="p-3">
                        <span className="inline-block bg-[#f1f6f2] text-[#265337] px-2 py-0.5 rounded text-[11px] font-semibold border border-[#d2e0d5]">
                          {p.tipo_suministro || 'Insumos Varios'}
                        </span>
                      </td>
                      <td className="p-3 text-[#3d5948]">
                        <span>{p.localidad || 'Río Cuarto'}, {p.provincia || 'Córdoba'}</span>
                      </td>
                      <td className="p-3 text-[#3d5948]">
                        <div>{p.telefono || 'Sin teléfono'}</div>
                        <div className="text-[10px] text-[#688172]">{p.email || ''}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.activo
                              ? 'bg-[#eaf6ee] text-[#186435] border border-[#c0e4cb]'
                              : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-[#186435]' : 'bg-[#991b1b]'}`} />
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProveedor(p)}
                            className="p-1 rounded-lg text-[#1f4e32] hover:bg-[#eaf4ee] transition-colors cursor-pointer"
                            title="Modificar Proveedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleProveedorStatus(p)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              p.activo ? 'text-[#b91c1c] hover:bg-red-50' : 'text-[#15803d] hover:bg-green-50'
                            }`}
                            title={p.activo ? 'Desactivar proveedor' : 'Activar proveedor'}
                          >
                            {p.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* CONTENIDO 4: OTROS CATÁLOGOS MAESTROS (AMPLIABLE) */}
      {activeTab === 'catalogos' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6eee6] pb-4">
            <div>
              <h3 className="font-bold text-sm text-[#143222]">Catálogos Maestros de Soporte</h3>
              <p className="text-xs text-[#5e7769]">
                Estructura extensible para la administración de tablas dimensionales satélites del sistema porcino.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#3b5745]">Catálogo:</label>
              <select
                value={selectedCatalog}
                onChange={e => setSelectedCatalog(e.target.value as any)}
                className="text-xs font-semibold px-3 py-1.5 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
              >
                <option value="D_Insumo">Insumos y Alimentos (D_Insumo)</option>
                <option value="Categorias_SENASA">Categorías SENASA (Categorias_SENASA)</option>
                <option value="D_Cuenta">Plan de Cuentas Contables (D_Cuenta)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {selectedCatalog === 'D_Insumo' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre del Insumo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Es Alimento</th>
                    <th className="p-3">U.M.</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ee]">
                  {db.D_Insumo.map(i => (
                    <tr key={i.id} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{i.id}</td>
                      <td className="p-3 font-medium text-[#20402e]">{i.nombre}</td>
                      <td className="p-3">
                        <span className="bg-[#edf3ee] text-[#2b553b] px-2 py-0.5 rounded text-[10px] font-semibold">
                          {i.tipo_insumo}
                        </span>
                      </td>
                      <td className="p-3">{i.es_alimento ? 'Sí (Ración)' : 'No'}</td>
                      <td className="p-3 font-mono">{i.um_id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${i.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {i.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedCatalog === 'Categorias_SENASA' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                    <th className="p-3">Código</th>
                    <th className="p-3">Categoría SENASA</th>
                    <th className="p-3">Rango de Peso (kg)</th>
                    <th className="p-3">Aplica Sexo</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ee]">
                  {db.Categorias_SENASA.map(c => (
                    <tr key={c.id} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{c.id}</td>
                      <td className="p-3 font-medium text-[#20402e]">{c.nombre}</td>
                      <td className="p-3 font-mono">
                        {c.peso_min || 0} a {c.peso_max || 'inf'} kg
                      </td>
                      <td className="p-3">{c.sexo_aplica || 'Ambos'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedCatalog === 'D_Cuenta' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                    <th className="p-3">ID</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Denominación Contable</th>
                    <th className="p-3">Rubro</th>
                    <th className="p-3">Tipo de Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ee]">
                  {db.D_Cuenta.map(c => (
                    <tr key={c.id} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{c.id}</td>
                      <td className="p-3 font-mono">{c.codigo}</td>
                      <td className="p-3 font-medium text-[#20402e]">{c.nombre}</td>
                      <td className="p-3 text-[#587363]">{c.rubro}</td>
                      <td className="p-3">
                        <span className="bg-[#edf3ee] text-[#2b553b] px-2 py-0.5 rounded text-[10px] font-semibold">
                          {c.tipo_cuenta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO 5: AUDITORÍA DE CAMBIOS ADMINISTRATIVOS */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ece5] bg-[#fbfdfb]">
            <h3 className="font-bold text-sm text-[#143222]">Registro de Auditoría de Operaciones Administrativas</h3>
            <p className="text-xs text-[#5e7769]">
              Trazabilidad legal y de seguridad: altas de usuarios, restablecimientos de contraseñas, modificaciones de clientes y proveedores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0f5f1] text-[#2c533c] uppercase tracking-wider text-[11px] font-bold border-b border-[#d8e2d7]">
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Usuario Ejecutor</th>
                  <th className="p-3">Tabla Afectada</th>
                  <th className="p-3">Operación</th>
                  <th className="p-3">ID Registro</th>
                  <th className="p-3">Detalle Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {filteredAuditoria.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#738b7c] italic">
                      No hay registros de auditoría administrativa recientes.
                    </td>
                  </tr>
                ) : (
                  filteredAuditoria.map(a => (
                    <tr key={a.id} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono text-[11px] text-[#556e5f]">
                        {new Date(a.fecha_hora).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 font-semibold text-[#1a3a27]">{a.usuario}</td>
                      <td className="p-3 font-mono text-[#2b593c]">{a.tabla}</td>
                      <td className="p-3">
                        <span className="bg-[#edf4ee] text-[#1c4b2e] px-2 py-0.5 rounded text-[10px] font-bold border border-[#d4e2d6]">
                          {a.operacion}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#4d6657]">{a.registro_id}</td>
                      <td className="p-3 text-[#2a4d36]">{a.detalle}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NUEVO / MODIFICAR USUARIO                                          */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#1a4a2c] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#143222]">
                  {editingUser ? `Modificar Usuario: ${editingUser.usuario}` : 'Crear Nuevo Usuario del Sistema'}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Nombre de Usuario (*)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={userForm.usuario}
                    onChange={e => setUserForm({ ...userForm, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="ej. juan.perez"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936] disabled:bg-[#eaeeea]"
                  />
                  <span className="text-[10px] text-[#698474]">Identificador para inicio de sesión</span>
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Rango Operativo (*)
                  </label>
                  <select
                    value={userForm.rol_id}
                    onChange={e => setUserForm({ ...userForm, rol_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-semibold text-xs focus:ring-1 focus:ring-[#1f5936]"
                  >
                    <option value="ROL_OPERARIO">Operario de Campo</option>
                    <option value="ROL_ENCARGADO">Encargado de Producción</option>
                    <option value="ROL_ADMIN">Administrador General</option>
                    <option value="ROL_AUDITOR">Auditor / Consultor</option>
                  </select>
                  <span className="text-[10px] text-[#698474]">Se asigna automáticamente al ingresar</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#21432f] mb-1">
                  Nombre y Apellido (*)
                </label>
                <input
                  type="text"
                  required
                  value={userForm.nombre}
                  onChange={e => setUserForm({ ...userForm, nombre: e.target.value })}
                  placeholder="ej. Juan Carlos Pérez"
                  className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs focus:ring-1 focus:ring-[#1f5936]"
                />
              </div>

              {!editingUser && (
                <div className="border border-[#dbe6dc] bg-[#f9fbf9] p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1f4b2f] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#1b5e37]" />
                      Contraseña Inicial Segura
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = generateRandomPassword();
                        setUserForm({ ...userForm, password: pass, confirmPassword: pass });
                      }}
                      className="text-[11px] font-semibold text-[#185e33] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Regenerar Clave
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      required
                      value={userForm.password}
                      onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3 pr-9 py-2 bg-white border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#688574] hover:text-[#193a26]"
                    >
                      {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#21432f] mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={userForm.confirmPassword}
                      onChange={e => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                    />
                  </div>

                  <p className="text-[10px] text-[#557161]">
                    Esta contraseña será encriptada mediante SHA-256 antes de guardarse. No se guardará en texto plano en la planilla de Google Sheets.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActivoCheck"
                  checked={userForm.activo}
                  onChange={e => setUserForm({ ...userForm, activo: e.target.checked })}
                  className="rounded border-[#cfddcf] text-[#1b5e37] focus:ring-[#1b5e37]"
                />
                <label htmlFor="userActivoCheck" className="font-semibold text-[#21432f] cursor-pointer">
                  Usuario habilitado para ingresar al sistema
                </label>
              </div>

              <div className="pt-4 border-t border-[#e5eee5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RESTABLECER CONTRASEÑA                                              */}
      {/* ========================================================================= */}
      {showResetModal && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#143222]">Restablecer Contraseña</h3>
                  <span className="text-[11px] text-[#556e5f] font-mono">Usuario: {resetTargetUser.usuario}</span>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Seguridad de Acceso:
                </span>
                <p>
                  Por razones de seguridad criptográfica, las contraseñas actuales no son accesibles para ningún usuario ni administrador. Al confirmar, se sobrescribirá con la nueva clave temporal provista.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#21432f]">
                    Nueva Contraseña Temporal (*)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue(generateRandomPassword())}
                    className="text-[10px] text-[#185e33] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Sugerir otra
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#688574] hover:text-[#193a26]"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e5eee5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Confirmar Restablecimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NUEVO / MODIFICAR CLIENTE                                          */}
      {/* ========================================================================= */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#1a4a2c] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#143222]">
                  {editingCliente ? `Modificar Cliente: ${editingCliente.razon_social}` : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setShowClienteModal(false)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClienteSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Razón Social / Nombre Comercial (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteForm.razon_social}
                    onChange={e => setClienteForm({ ...clienteForm, razon_social: e.target.value })}
                    placeholder="ej. Frigorífico Regional Río Cuarto S.A."
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    CUIT (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteForm.cuit}
                    onChange={e => setClienteForm({ ...clienteForm, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Condición Frente al IVA
                  </label>
                  <select
                    value={clienteForm.condicion_iva}
                    onChange={e => setClienteForm({ ...clienteForm, condicion_iva: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs font-semibold"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Localidad
                  </label>
                  <input
                    type="text"
                    value={clienteForm.localidad || ''}
                    onChange={e => setClienteForm({ ...clienteForm, localidad: e.target.value })}
                    placeholder="ej. Río Cuarto"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={clienteForm.provincia || ''}
                    onChange={e => setClienteForm({ ...clienteForm, provincia: e.target.value })}
                    placeholder="ej. Córdoba"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={clienteForm.telefono || ''}
                    onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    placeholder="ej. 358-4676100"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={clienteForm.email || ''}
                    onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })}
                    placeholder="ej. ventas@frigorifico.com.ar"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    value={clienteForm.condiciones_pago || ''}
                    onChange={e => setClienteForm({ ...clienteForm, condiciones_pago: e.target.value })}
                    placeholder="ej. Contado contra entrega / 30 días"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Dirección / Planta Faenadora
                  </label>
                  <input
                    type="text"
                    value={clienteForm.direccion || ''}
                    onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                    placeholder="ej. Ruta 8 Km 605"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={clienteForm.observaciones || ''}
                    onChange={e => setClienteForm({ ...clienteForm, observaciones: e.target.value })}
                    placeholder="Anotaciones comerciales, faena habitual, tipo de comprobante requerido..."
                    className="w-full px-3 py-1.5 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clienteActivoCheck"
                  checked={clienteForm.activo}
                  onChange={e => setClienteForm({ ...clienteForm, activo: e.target.checked })}
                  className="rounded border-[#cfddcf] text-[#1b5e37] focus:ring-[#1b5e37]"
                />
                <label htmlFor="clienteActivoCheck" className="font-semibold text-[#21432f] cursor-pointer">
                  Cliente habilitado para nuevas ventas y despachos comerciales
                </label>
              </div>

              <div className="pt-4 border-t border-[#e5eee5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NUEVO / MODIFICAR PROVEEDOR                                        */}
      {/* ========================================================================= */}
      {showProveedorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#1a4a2c] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#143222]">
                  {editingProveedor ? `Modificar Proveedor: ${editingProveedor.razon_social}` : 'Registrar Nuevo Proveedor'}
                </h3>
              </div>
              <button
                onClick={() => setShowProveedorModal(false)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProveedorSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Razón Social / Proveedor (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={proveedorForm.razon_social}
                    onChange={e => setProveedorForm({ ...proveedorForm, razon_social: e.target.value })}
                    placeholder="ej. Cooperativa Agropecuaria Río Cuarto Ltda."
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    CUIT (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={proveedorForm.cuit}
                    onChange={e => setProveedorForm({ ...proveedorForm, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Rubro / Tipo de Suministro
                  </label>
                  <select
                    value={proveedorForm.tipo_suministro}
                    onChange={e => setProveedorForm({ ...proveedorForm, tipo_suministro: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs font-semibold"
                  >
                    <option value="Granos y Cereales">Granos y Cereales (Maíz)</option>
                    <option value="Proteicos y Subproductos">Proteicos y Subproductos (Soja 48%)</option>
                    <option value="Sanidad y Biológicos">Sanidad y Biológicos (Vacunas, antibióticos)</option>
                    <option value="Genética y Reproductores">Genética y Reproductores (Padrillos/Dosis)</option>
                    <option value="Mantenimiento e Instalaciones">Mantenimiento e Instalaciones (Bebederos, arcos)</option>
                    <option value="Servicios Veterinarios">Servicios Veterinarios y Asesoramiento</option>
                    <option value="Fletes y Transporte">Fletes y Transporte de Hacienda/Granos</option>
                    <option value="Insumos Varios">Insumos Varios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Localidad
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.localidad || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, localidad: e.target.value })}
                    placeholder="ej. Río Cuarto"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.provincia || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, provincia: e.target.value })}
                    placeholder="ej. Córdoba"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.telefono || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                    placeholder="ej. 358-4500000"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={proveedorForm.email || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                    placeholder="ej. ventas@cooperativa.com.ar"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.condiciones_pago || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, condiciones_pago: e.target.value })}
                    placeholder="ej. 30 días fecha factura / Cheque diferido"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={proveedorForm.observaciones || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, observaciones: e.target.value })}
                    placeholder="Detalles sobre entrega en campo, calidad de proteína garantizada, etc."
                    className="w-full px-3 py-1.5 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="proveedorActivoCheck"
                  checked={proveedorForm.activo}
                  onChange={e => setProveedorForm({ ...proveedorForm, activo: e.target.checked })}
                  className="rounded border-[#cfddcf] text-[#1b5e37] focus:ring-[#1b5e37]"
                />
                <label htmlFor="proveedorActivoCheck" className="font-semibold text-[#21432f] cursor-pointer">
                  Proveedor habilitado para nuevas compras y órdenes de insumos
                </label>
              </div>

              <div className="pt-4 border-t border-[#e5eee5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProveedor ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
