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
  Plus,
  Trash2
} from 'lucide-react';
import { BaseDatosPorcina, Usuario, Cliente, Proveedor } from '../types/schema';
import { dbManager } from '../lib/storage';
import { generateRandomPassword, validatePasswordPolicy, PASSWORD_POLICY_DESCRIPTION } from '../lib/security';

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
    email: '',
    rol_id: 'ROL_OPERARIO',
    unidades_autorizadas: ['UN_PORCINOS', 'UN_BOVINOS', 'UN_OVINOS'] as string[],
    password: '',
    confirmPassword: '',
    activo: true
  });
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Modal Restablecer / Cambiar Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<Usuario | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [adminWarningConfirmed, setAdminWarningConfirmed] = useState(false);

  // Modal Cliente
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteForm, setClienteForm] = useState<Partial<Cliente>>({
    razon_social: '',
    cuit: '',
    tipo_persona: 'Jurídica',
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
  const [isSubmittingCliente, setIsSubmittingCliente] = useState(false);

  // Modal Proveedor
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [proveedorForm, setProveedorForm] = useState<Partial<Proveedor>>({
    razon_social: '',
    cuit: '',
    rubro_actividad: 'Granos y Cereales',
    tipo_suministro: 'Granos y Cereales',
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
  const [isSubmittingProveedor, setIsSubmittingProveedor] = useState(false);

  // Otros catálogos
  const [selectedCatalog, setSelectedCatalog] = useState<'D_Insumo' | 'Categorias_SENASA' | 'D_Cuenta'>('D_Insumo');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    nombre: '',
    codigo: '',
    tipo_insumo: 'GRANO',
    es_alimento: true,
    um_id: 'UM_KG',
    cuenta_id: 'CTA_ALIM_MAIZ',
    peso_min: 0,
    peso_max: 100,
    sexo_aplica: 'Ambos',
    rubro: 'RESULTADOS_NEGATIVOS',
    tipo_cuenta: 'IMPUTABLE',
    activo: true
  });
  const [isSubmittingCatalog, setIsSubmittingCatalog] = useState(false);

  // Modal Diagnóstico de Sincronización
  const [syncDiagnosticRecord, setSyncDiagnosticRecord] = useState<{ table: 'Usuarios' | 'Clientes' | 'Proveedores'; item: Usuario | Cliente | Proveedor } | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  // Modal Eliminar Registro (Local + Sheets)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    tableName: 'Usuarios' | 'Clientes' | 'Proveedores' | 'D_Insumo' | 'Categorias_SENASA' | 'D_Cuenta';
    id: string;
    label: string;
  } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  const handleDeleteConfirmSubmit = async () => {
    if (!deleteConfirm || isDeletingRecord) return;
    setIsDeletingRecord(true);
    try {
      const res = await dbManager.deleteRecord(deleteConfirm.tableName, deleteConfirm.id);
      if (res.success) {
        showNotification('success', `Registro "${deleteConfirm.label}" eliminado localmente y desvinculado en Google Sheets.`);
      } else {
        showNotification('error', res.message || 'Error al eliminar el registro.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al eliminar el registro.');
    } finally {
      setIsDeletingRecord(false);
      setDeleteConfirm(null);
    }
  };

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
      email: '',
      rol_id: 'ROL_OPERARIO',
      unidades_autorizadas: ['UN_PORCINOS', 'UN_BOVINOS', 'UN_OVINOS'],
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
      email: user.email || '',
      rol_id: user.rol_id,
      unidades_autorizadas: user.unidades_autorizadas && user.unidades_autorizadas.length > 0
        ? user.unidades_autorizadas
        : ['UN_PORCINOS', 'UN_BOVINOS', 'UN_OVINOS'],
      password: '',
      confirmPassword: '',
      activo: user.activo
    });
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingUser) return;

    const trimmedUser = userForm.usuario.trim().toLowerCase().replace(/\s+/g, '');
    const trimmedNombre = userForm.nombre.trim();
    const trimmedEmail = userForm.email.trim();

    if (!trimmedUser || !trimmedNombre) {
      showNotification('error', 'Complete los campos obligatorios: Nombre de Usuario y Nombre y Apellido.');
      return;
    }

    if (trimmedUser.length < 3) {
      showNotification('error', 'El nombre de usuario debe tener al menos 3 caracteres alfanuméricos.');
      return;
    }

    // Validación formato email si fue ingresado
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showNotification('error', 'El formato del correo electrónico es inválido (ej. usuario@unrc.edu.ar).');
      return;
    }

    // Al menos una unidad autorizada
    if (!userForm.unidades_autorizadas || userForm.unidades_autorizadas.length === 0) {
      showNotification('error', 'Debe seleccionar al menos una unidad productiva autorizada para el usuario.');
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

    setIsSubmittingUser(true);
    try {
      const res = await dbManager.saveUser(
        {
          usuario_id: editingUser?.usuario_id,
          usuario: trimmedUser,
          nombre: trimmedNombre,
          email: trimmedEmail,
          rol_id: userForm.rol_id,
          unidades_autorizadas: userForm.unidades_autorizadas,
          activo: userForm.activo
        },
        userForm.password ? userForm.password : undefined
      );

      if (res.success) {
        const syncMsg = isOnlineWithSheets
          ? 'Registrado y sincronizado con Google Sheets'
          : 'Guardado localmente en almacén seguro (Pendiente de sincronización)';
        showNotification(
          'success',
          `Usuario ${trimmedUser} ${editingUser ? 'modificado' : 'creado'} correctamente. ${syncMsg}.`
        );
        setShowUserModal(false);
      } else {
        showNotification('error', res.error || 'Error al guardar el usuario.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al guardar usuario.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleOpenResetPassword = (user: Usuario) => {
    setResetTargetUser(user);
    setNewPasswordValue('');
    setConfirmPasswordValue('');
    setShowResetPassword(false);
    setShowConfirmResetPassword(false);
    setAdminWarningConfirmed(user.rol_id !== 'ROL_ADMIN');
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || isSubmittingReset) return;

    const trimmedPassword = newPasswordValue.trim();
    const trimmedConfirm = confirmPasswordValue.trim();

    if (!trimmedPassword) {
      showNotification('error', 'Ingrese la nueva contraseña.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showNotification('error', 'Las contraseñas ingresadas no coinciden. Verifique ambas casillas.');
      return;
    }

    const policy = validatePasswordPolicy(trimmedPassword);
    if (!policy.valid) {
      showNotification('error', policy.message || 'La contraseña debe contener al menos 12 caracteres.');
      return;
    }

    if (resetTargetUser.rol_id === 'ROL_ADMIN' && !adminWarningConfirmed) {
      showNotification('error', 'Debe marcar la casilla de confirmación administrativa para modificar la cuenta de Administrador.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await dbManager.resetUserPassword(resetTargetUser.usuario_id, trimmedPassword);
      if (res.success) {
        showNotification(
          'success',
          `Contraseña cambiada permanentemente para el usuario ${resetTargetUser.usuario}. La clave anterior ha dejado de funcionar de inmediato.`
        );
        setShowResetModal(false);
        setNewPasswordValue('');
        setConfirmPasswordValue('');
      } else {
        showNotification('error', res.error || 'Error al cambiar la contraseña.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al guardar la contraseña.');
    } finally {
      setIsSubmittingReset(false);
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
      tipo_persona: 'Jurídica',
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
    setClienteForm({
      ...c,
      tipo_persona: c.tipo_persona || 'Jurídica'
    });
    setShowClienteModal(true);
  };

  const handleSaveClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCliente) return;

    const razonSocial = clienteForm.razon_social?.trim();
    const rawCuit = clienteForm.cuit?.trim() || '';

    if (!razonSocial) {
      showNotification('error', 'Ingrese la Razón Social o Nombre del cliente.');
      return;
    }

    // Validación CUIT: si no está vacío o no es 'Sin CUIT', validar 11 dígitos numéricos
    if (rawCuit && rawCuit !== 'Sin CUIT') {
      const cleanCuit = rawCuit.replace(/[-\s]/g, '');
      if (!/^\d{11}$/.test(cleanCuit)) {
        showNotification('error', 'El CUIT debe contener 11 dígitos numéricos (ej. 30-12345678-9).');
        return;
      }
    }

    if (clienteForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteForm.email.trim())) {
      showNotification('error', 'El formato del correo electrónico del cliente no es válido.');
      return;
    }

    setIsSubmittingCliente(true);
    try {
      const res = await dbManager.saveCliente({
        ...clienteForm,
        razon_social: razonSocial,
        cuit: rawCuit || 'Sin CUIT',
        id: editingCliente?.id
      });

      if (res.success) {
        const syncMsg = isOnlineWithSheets
          ? 'Registrado y sincronizado con Google Sheets'
          : 'Guardado localmente en almacén seguro (Pendiente de sincronización)';
        showNotification(
          'success',
          `Cliente ${razonSocial} guardado exitosamente. ${syncMsg}. Ya disponible en Ventas de Porcinos, Bovinos y Ovinos.`
        );
        setShowClienteModal(false);
      } else {
        showNotification('error', res.error || 'Error al guardar cliente.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al guardar cliente.');
    } finally {
      setIsSubmittingCliente(false);
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
      rubro_actividad: 'Granos y Cereales',
      tipo_suministro: 'Granos y Cereales',
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
    setShowProveedorModal(true);
  };

  const handleOpenEditProveedor = (p: Proveedor) => {
    setEditingProveedor(p);
    setProveedorForm({
      ...p,
      rubro_actividad: p.rubro_actividad || p.tipo_suministro || 'Granos y Cereales'
    });
    setShowProveedorModal(true);
  };

  const handleSaveProveedorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingProveedor) return;

    const razonSocial = proveedorForm.razon_social?.trim();
    const rawCuit = proveedorForm.cuit?.trim() || '';

    if (!razonSocial) {
      showNotification('error', 'Ingrese la Razón Social o Nombre del proveedor.');
      return;
    }

    // Validación CUIT: si no está vacío o no es 'Sin CUIT', validar 11 dígitos numéricos
    if (rawCuit && rawCuit !== 'Sin CUIT') {
      const cleanCuit = rawCuit.replace(/[-\s]/g, '');
      if (!/^\d{11}$/.test(cleanCuit)) {
        showNotification('error', 'El CUIT debe contener 11 dígitos numéricos (ej. 30-12345678-9).');
        return;
      }
    }

    if (proveedorForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proveedorForm.email.trim())) {
      showNotification('error', 'El formato del correo electrónico del proveedor no es válido.');
      return;
    }

    setIsSubmittingProveedor(true);
    try {
      const res = await dbManager.saveProveedor({
        ...proveedorForm,
        razon_social: razonSocial,
        cuit: rawCuit || 'Sin CUIT',
        id: editingProveedor?.id
      });

      if (res.success) {
        const syncMsg = isOnlineWithSheets
          ? 'Registrado y sincronizado con Google Sheets'
          : 'Guardado localmente en almacén seguro (Pendiente de sincronización)';
        showNotification(
          'success',
          `Proveedor ${razonSocial} guardado exitosamente. ${syncMsg}. Ya disponible en Compras de Porcinos, Bovinos y Ovinos.`
        );
        setShowProveedorModal(false);
      } else {
        showNotification('error', res.error || 'Error al guardar proveedor.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al guardar proveedor.');
    } finally {
      setIsSubmittingProveedor(false);
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

  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCatalog) return;

    if (!catalogForm.nombre?.trim() && !catalogForm.codigo?.trim()) {
      showNotification('error', 'Debe ingresar un nombre o código para el registro.');
      return;
    }

    setIsSubmittingCatalog(true);
    try {
      const res = await dbManager.saveCatalogRecord(selectedCatalog, { ...catalogForm });
      if (res.success) {
        showNotification('success', `Registro agregado y vinculado exitosamente en ${selectedCatalog}.`);
        setShowCatalogModal(false);
        setCatalogForm({
          nombre: '',
          codigo: '',
          tipo_insumo: 'GRANO',
          es_alimento: true,
          um_id: 'UM_KG',
          cuenta_id: 'CTA_ALIM_MAIZ',
          peso_min: 0,
          peso_max: 100,
          sexo_aplica: 'Ambos',
          rubro: 'RESULTADOS_NEGATIVOS',
          tipo_cuenta: 'IMPUTABLE',
          activo: true
        });
      } else {
        showNotification('error', res.error || 'Error al guardar elemento en el catálogo.');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Error inesperado al guardar elemento.');
    } finally {
      setIsSubmittingCatalog(false);
    }
  };

  // --- LISTAS FILTRADAS ---
  const filteredUsers = useMemo(() => {
    return db.Usuarios.filter(u => {
      const uStr = `${u.usuario || ''} ${u.nombre || ''} ${u.email || ''} ${u.rol_id || ''}`.toLowerCase();
      const matchText = uStr.includes(searchQuery.toLowerCase().trim());
      if (!matchText) return false;
      if (filterEstado === 'ACTIVOS') return u.activo;
      if (filterEstado === 'INACTIVOS') return !u.activo;
      return true;
    });
  }, [db.Usuarios, searchQuery, filterEstado]);

  const filteredClientes = useMemo(() => {
    return db.Clientes.filter(c => {
      const cStr = `${c.razon_social || ''} ${c.cuit || ''} ${c.localidad || ''} ${c.email || ''}`.toLowerCase();
      const matchText = cStr.includes(searchQuery.toLowerCase().trim());
      if (!matchText) return false;
      if (filterEstado === 'ACTIVOS') return c.activo;
      if (filterEstado === 'INACTIVOS') return !c.activo;
      return true;
    });
  }, [db.Clientes, searchQuery, filterEstado]);

  const filteredProveedores = useMemo(() => {
    return db.Proveedores.filter(p => {
      const pStr = `${p.razon_social || ''} ${p.cuit || ''} ${p.tipo_suministro || ''} ${p.localidad || ''}`.toLowerCase();
      const matchText = pStr.includes(searchQuery.toLowerCase().trim());
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

  const renderSyncBadge = (
    table: 'Usuarios' | 'Clientes' | 'Proveedores',
    item: Usuario | Cliente | Proveedor
  ) => {
    const syncStatus = item.sync_status;
    if (syncStatus === 'ERROR') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSyncDiagnosticRecord({ table, item });
          }}
          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 mt-1 hover:bg-red-200 transition-colors cursor-pointer"
          title="Ver diagnóstico detallado de sincronización y reintentar"
        >
          <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
          <span>Error Sync</span>
          <Info className="w-2.5 h-2.5 ml-0.5 opacity-70" />
        </button>
      );
    }
    if (syncStatus === 'PENDIENTE') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSyncDiagnosticRecord({ table, item });
          }}
          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 mt-1 hover:bg-amber-200 transition-colors cursor-pointer"
          title="Guardado localmente. Haz clic para ver detalles."
        >
          <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
          <span>Pendiente Sync</span>
        </button>
      );
    }
    if (syncStatus === 'LOCAL') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSyncDiagnosticRecord({ table, item });
          }}
          className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-1 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Guardado en almacén local"
        >
          <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
          <span>Local Ok</span>
        </button>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSyncDiagnosticRecord({ table, item });
        }}
        className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1 hover:bg-emerald-100 transition-colors cursor-pointer"
        title="Sincronizado y verificado con Google Sheets"
      >
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
        <span>Sincronizado</span>
      </button>
    );
  };

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
                className="px-3.5 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Nuevo Usuario</span>
              </button>
            )}

            {activeTab === 'clientes' && (
              <button
                onClick={handleOpenCreateCliente}
                className="px-3.5 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Cliente</span>
              </button>
            )}

            {activeTab === 'proveedores' && (
              <button
                onClick={handleOpenCreateProveedor}
                className="px-3.5 py-1.5 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Proveedor</span>
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
                  filteredUsers.map((u, idx) => (
                    <tr key={`${u.usuario_id || u.usuario || 'usr'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
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
                      <td className="p-3">
                        <span className="font-medium text-[#20402e] block">{u.nombre}</span>
                        {u.email && <span className="text-[10px] text-[#637d6e]">{u.email}</span>}
                      </td>
                      <td className="p-3">
                        {getRoleBadge(u.rol_id)}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(u.unidades_autorizadas && u.unidades_autorizadas.length > 0
                            ? u.unidades_autorizadas
                            : ['UN_PORCINOS', 'UN_BOVINOS', 'UN_OVINOS']
                          ).map(unit => (
                            <span key={unit} className="text-[9px] bg-[#eef4ef] text-[#2c533c] px-1.5 py-0.2 rounded font-semibold border border-[#d6e3d8]">
                              {unit === 'UN_PORCINOS' ? 'Porcinos' : unit === 'UN_BOVINOS' ? 'Bovinos' : 'Ovinos'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#587363] bg-[#f2f6f3] px-2 py-0.5 rounded border border-[#dae5dc]">
                          <Lock className="w-3 h-3 text-[#2a6842]" />
                          •••••••• (SHA-256)
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
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
                          {renderSyncBadge('Usuarios', u)}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-[#607b6c] font-mono">
                        {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1 rounded-lg text-[#255d3a] hover:bg-[#eaf4ee] transition-colors cursor-pointer"
                            title="Cambiar Contraseña"
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
                          <button
                            onClick={() => setDeleteConfirm({ show: true, tableName: 'Usuarios', id: u.usuario_id, label: u.usuario })}
                            disabled={currentUser?.usuario_id === u.usuario_id}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.usuario_id === u.usuario_id
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              currentUser?.usuario_id === u.usuario_id
                                ? 'No puede eliminar su propio usuario'
                                : 'Eliminar usuario (Local y Google Sheets)'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
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
                  <th className="p-3">Tipo</th>
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
                    <td colSpan={9} className="p-6 text-center text-[#738b7c] italic">
                      No se encontraron clientes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c, idx) => (
                    <tr key={`${c.id || 'cli'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1b4b2e]">{c.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-[#1a3826] block">{c.razon_social}</span>
                        <span className="text-[11px] text-[#698273]">{c.condicion_iva || 'Responsable Inscripto'}</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-block bg-[#f0f4f0] text-[#2b563b] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#d6e2d8]">
                          {c.tipo_persona || 'Jurídica'}
                        </span>
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
                        <div className="flex flex-col items-start gap-1">
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
                          {renderSyncBadge('Clientes', c)}
                        </div>
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
                          <button
                            onClick={() => setDeleteConfirm({ show: true, tableName: 'Clientes', id: c.id, label: c.razon_social })}
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar cliente (Local y Google Sheets)"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  filteredProveedores.map((p, idx) => (
                    <tr key={`${p.id || 'prov'}_${idx}`} className="hover:bg-[#f9fbf9] transition-colors">
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
                        {p.rubro_actividad && p.rubro_actividad !== p.tipo_suministro && (
                          <span className="block text-[10px] text-[#5e7769] mt-0.5">{p.rubro_actividad}</span>
                        )}
                      </td>
                      <td className="p-3 text-[#3d5948]">
                        <span>{p.localidad || 'Río Cuarto'}, {p.provincia || 'Córdoba'}</span>
                        {p.direccion && <span className="block text-[10px] text-[#789182]">{p.direccion}</span>}
                      </td>
                      <td className="p-3 text-[#3d5948]">
                        <div>{p.telefono || 'Sin teléfono'}</div>
                        <div className="text-[10px] text-[#688172]">{p.email || ''}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-start gap-1">
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
                          {renderSyncBadge('Proveedores', p)}
                        </div>
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
                          <button
                            onClick={() => setDeleteConfirm({ show: true, tableName: 'Proveedores', id: p.id, label: p.razon_social })}
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar proveedor (Local y Google Sheets)"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={() => {
                  setCatalogForm({
                    nombre: '',
                    codigo: '',
                    tipo_insumo: 'GRANO',
                    es_alimento: true,
                    um_id: 'UM_KG',
                    cuenta_id: 'CTA_ALIM_MAIZ',
                    peso_min: 0,
                    peso_max: 100,
                    sexo_aplica: 'Ambos',
                    rubro: 'RESULTADOS_NEGATIVOS',
                    tipo_cuenta: 'IMPUTABLE',
                    activo: true
                  });
                  setShowCatalogModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Agregar nuevo elemento a esta tabla maestra y sincronizar con Google Sheets"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Ítem</span>
              </button>
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
                    <th className="p-3 text-right">Acciones</th>
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
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm({ show: true, tableName: 'D_Insumo', id: i.id, label: i.nombre })}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar insumo (Local y Google Sheets)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                    <th className="p-3 text-right">Acciones</th>
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
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm({ show: true, tableName: 'Categorias_SENASA', id: c.id, label: c.nombre })}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar categoría (Local y Google Sheets)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                    <th className="p-3 text-right">Acciones</th>
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
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm({ show: true, tableName: 'D_Cuenta', id: c.id, label: c.nombre })}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar cuenta (Local y Google Sheets)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <div className="space-y-4">
          {/* Panel de Gestión Rápida y Vinculación por Categoría */}
          <div className="bg-[#f6f9f6] p-4 rounded-2xl border border-[#d8e2d7] space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a3826] flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-[#1b5e37]" />
              Gestión & Vinculación Directa por Categorías Maestras
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Usuarios</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.Usuarios.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={handleOpenCreateUser}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#174e2d] text-white rounded-lg hover:bg-[#123e24] flex items-center justify-center gap-1 cursor-pointer"
                    title="Crear y vincular nuevo usuario en modelo local y Google Sheets"
                  >
                    <Plus className="w-3 h-3" /> + Agregar / Vincular
                  </button>
                  <button
                    onClick={() => setActiveTab('usuarios')}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                    title="Gestionar y eliminar usuarios del modelo y Google Sheets"
                  >
                    <Trash2 className="w-3 h-3" /> Gestionar / Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Clientes</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.Clientes.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={handleOpenCreateCliente}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#174e2d] text-white rounded-lg hover:bg-[#123e24] flex items-center justify-center gap-1 cursor-pointer"
                    title="Crear y vincular cliente en modelo local y Google Sheets"
                  >
                    <Plus className="w-3 h-3" /> + Agregar / Vincular
                  </button>
                  <button
                    onClick={() => setActiveTab('clientes')}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                    title="Gestionar y eliminar clientes del modelo y Google Sheets"
                  >
                    <Trash2 className="w-3 h-3" /> Gestionar / Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Proveedores</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.Proveedores.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={handleOpenCreateProveedor}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#174e2d] text-white rounded-lg hover:bg-[#123e24] flex items-center justify-center gap-1 cursor-pointer"
                    title="Crear y vincular proveedor en modelo local y Google Sheets"
                  >
                    <Plus className="w-3 h-3" /> + Agregar / Vincular
                  </button>
                  <button
                    onClick={() => setActiveTab('proveedores')}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                    title="Gestionar y eliminar proveedores del modelo y Google Sheets"
                  >
                    <Trash2 className="w-3 h-3" /> Gestionar / Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Insumos</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.D_Insumo.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('D_Insumo'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#eef4ef] text-[#1e4d30] border border-[#cbe0d0] rounded-lg hover:bg-[#e2ede4] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Vincular / Ver
                  </button>
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('D_Insumo'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Cuentas</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.D_Cuenta.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('D_Cuenta'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#eef4ef] text-[#1e4d30] border border-[#cbe0d0] rounded-lg hover:bg-[#e2ede4] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Vincular / Ver
                  </button>
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('D_Cuenta'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#d2e2d6] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5e7769] block uppercase">Categorías SENASA</span>
                  <span className="text-sm font-extrabold text-[#173a25]">{db.Categorias_SENASA.length} reg.</span>
                </div>
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#edf2ee]">
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('Categorias_SENASA'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-[#eef4ef] text-[#1e4d30] border border-[#cbe0d0] rounded-lg hover:bg-[#e2ede4] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Vincular / Ver
                  </button>
                  <button
                    onClick={() => { setActiveTab('catalogos'); setSelectedCatalog('Categorias_SENASA'); }}
                    className="w-full text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e5ece5] bg-[#fbfdfb] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#143222]">Registro de Auditoría de Operaciones Administrativas</h3>
                <p className="text-xs text-[#5e7769]">
                  Trazabilidad legal y de seguridad: altas de usuarios, restablecimientos de contraseñas, modificaciones y eliminaciones de clientes y proveedores.
                </p>
              </div>
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
                    <th className="p-3 text-right">Acciones (Vincular / Eliminar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ee]">
                  {filteredAuditoria.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#738b7c] italic">
                        No hay registros de auditoría administrativa recientes.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditoria.map((a, idx) => (
                      <tr key={`${a.id || 'aud'}_${idx}`} className="hover:bg-[#f9fbf9]">
                        <td className="p-3 font-mono text-[11px] text-[#556e5f]">
                          {new Date(a.fecha_hora).toLocaleString('es-AR')}
                        </td>
                        <td className="p-3 font-semibold text-[#1a3a27]">{a.usuario}</td>
                        <td className="p-3 font-mono text-[#2b593c]">{a.tabla}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            a.operacion === 'ANULACION'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-[#edf4ee] text-[#1c4b2e] border-[#d4e2d6]'
                          }`}>
                            {a.operacion}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#4d6657]">{a.registro_id}</td>
                        <td className="p-3 text-[#2a4d36]">{a.detalle}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {a.tabla === 'Usuarios' && (
                              <button
                                onClick={() => setActiveTab('usuarios')}
                                className="text-[10px] font-bold text-[#1b5e37] hover:underline"
                              >
                                Vincular / Ver
                              </button>
                            )}
                            {a.tabla === 'Clientes' && (
                              <button
                                onClick={() => setActiveTab('clientes')}
                                className="text-[10px] font-bold text-[#1b5e37] hover:underline"
                              >
                                Vincular / Ver
                              </button>
                            )}
                            {a.tabla === 'Proveedores' && (
                              <button
                                onClick={() => setActiveTab('proveedores')}
                                className="text-[10px] font-bold text-[#1b5e37] hover:underline"
                              >
                                Vincular / Ver
                              </button>
                            )}
                            {a.registro_id && (
                              <button
                                onClick={() => setDeleteConfirm({
                                  show: true,
                                  tableName: (a.tabla as any) || 'Proveedores',
                                  id: a.registro_id,
                                  label: a.detalle || a.registro_id
                                })}
                                className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
                                title="Eliminar este registro del modelo y Google Sheets"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            )}
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

            {editingUser && (
              <div className="flex items-center justify-between p-2.5 bg-[#f0f5f1] border border-[#d2e2d6] rounded-xl text-[11px] text-[#2a5439] mb-3">
                <span><strong>Identificador Único:</strong> <span className="font-mono font-bold">{editingUser.usuario_id}</span></span>
                <span><strong>Alta:</strong> {editingUser.fecha_creacion ? new Date(editingUser.fecha_creacion).toLocaleDateString('es-AR') : 'Preexistente'}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserSubmit} className="space-y-3.5 text-xs">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="ej. usuario@unrc.edu.ar"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <span className="text-[10px] text-[#698474]">Para auditoría y notificaciones</span>
                </div>
              </div>

              {/* Unidades Productivas Autorizadas */}
              <div className="p-3 bg-[#f6f9f6] border border-[#d8e5da] rounded-xl space-y-1.5">
                <label className="block font-semibold text-[#1d472c] text-xs">
                  Unidades Productivas Autorizadas (*)
                </label>
                <div className="flex flex-wrap gap-4 text-xs font-medium">
                  {[
                    { id: 'UN_PORCINOS', label: 'Porcinos' },
                    { id: 'UN_BOVINOS', label: 'Bovinos' },
                    { id: 'UN_OVINOS', label: 'Ovinos' }
                  ].map(u => (
                    <label key={u.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.unidades_autorizadas.includes(u.id)}
                        onChange={e => {
                          const current = [...userForm.unidades_autorizadas];
                          if (e.target.checked) {
                            if (!current.includes(u.id)) current.push(u.id);
                          } else {
                            const idx = current.indexOf(u.id);
                            if (idx !== -1) current.splice(idx, 1);
                          }
                          setUserForm({ ...userForm, unidades_autorizadas: current });
                        }}
                        className="rounded border-[#cfddcf] text-[#1b5e37] focus:ring-[#1b5e37]"
                      />
                      <span className="text-[#20402e] font-semibold">{u.label}</span>
                    </label>
                  ))}
                </div>
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
                  disabled={isSubmittingUser}
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] disabled:bg-[#73947f] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingUser ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmittingUser ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CAMBIAR CONTRASEÑA (ADMINISTRACIÓN CENTRALIZADA)                     */}
      {/* ========================================================================= */}
      {showResetModal && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#143222]">Cambiar Contraseña de Usuario</h3>
                  <p className="text-[11px] text-[#556e5f]">Gestión administrativa de seguridad y acceso permanente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer p-1 rounded-lg hover:bg-[#edf4ee]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              {/* Ficha del Usuario Seleccionado */}
              <div className="p-3.5 bg-[#f5f9f6] border border-[#d2e4d7] rounded-xl space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#2e593e] tracking-wider">
                  Datos de la Cuenta a Modificar
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#5b7867] block text-[11px]">Usuario seleccionado:</span>
                    <span className="font-mono font-bold text-[#143222] text-sm">{resetTargetUser.usuario}</span>
                  </div>
                  <div>
                    <span className="text-[#5b7867] block text-[11px]">Nombre y Apellido:</span>
                    <span className="font-bold text-[#1a3826]">{resetTargetUser.nombre}</span>
                  </div>
                  <div>
                    <span className="text-[#5b7867] block text-[11px]">Rol operativo:</span>
                    <div className="mt-0.5">{getRoleBadge(resetTargetUser.rol_id)}</div>
                  </div>
                  <div>
                    <span className="text-[#5b7867] block text-[11px]">Identificador interno:</span>
                    <span className="font-mono text-[11px] text-[#42614f]">{resetTargetUser.usuario_id}</span>
                  </div>
                </div>
              </div>

              {/* Advertencia Administrativa Especial para cuentas de Administrador */}
              {resetTargetUser.rol_id === 'ROL_ADMIN' && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Confirmación Requerida: Cuenta de Administrador General</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Está modificando la clave de una cuenta con privilegios administrativos totales. La nueva contraseña reemplazará a la actual de forma inmediata y definitiva en toda la plataforma.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-semibold text-amber-950 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={adminWarningConfirmed}
                      onChange={e => setAdminWarningConfirmed(e.target.checked)}
                      className="rounded border-amber-400 text-amber-700 focus:ring-amber-600"
                    />
                    <span>Confirmo el cambio de contraseña para esta cuenta de Administrador</span>
                  </label>
                </div>
              )}

              {/* Campo: Nueva Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#21432f]">
                    Nueva Contraseña (*)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = generateRandomPassword();
                      setNewPasswordValue(suggested);
                      setConfirmPasswordValue(suggested);
                    }}
                    className="text-[10px] text-[#185e33] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Sugerir frase segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    placeholder="Mínimo 12 caracteres (admite frases de paso)"
                    className="w-full pl-3 pr-9 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#688574] hover:text-[#193a26]"
                    title={showResetPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Indicador de longitud */}
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className={newPasswordValue.length >= 12 ? 'text-emerald-700 font-semibold' : 'text-[#728f7d]'}>
                    {newPasswordValue.length >= 12 ? '✓ Longitud requerida alcanzada (>= 12 caracteres)' : `Longitud: ${newPasswordValue.length} / 12 caracteres`}
                  </span>
                </div>
              </div>

              {/* Campo: Confirmar Nueva Contraseña */}
              <div>
                <label className="block font-semibold text-[#21432f] mb-1">
                  Confirmar Nueva Contraseña (*)
                </label>
                <div className="relative">
                  <input
                    type={showConfirmResetPassword ? 'text' : 'password'}
                    required
                    value={confirmPasswordValue}
                    onChange={e => setConfirmPasswordValue(e.target.value)}
                    placeholder="Reingrese exactamente la nueva contraseña"
                    className="w-full pl-3 pr-9 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#688574] hover:text-[#193a26]"
                    title={showConfirmResetPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                  >
                    {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Indicador de coincidencia */}
                {confirmPasswordValue.length > 0 && (
                  <div className="mt-1 text-[10px]">
                    {newPasswordValue === confirmPasswordValue ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Las contraseñas coinciden
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        ✕ Las contraseñas no coinciden
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Nota de Política y Persistencia */}
              <div className="p-3 bg-[#eef5f0] border border-[#d0e3d5] rounded-xl text-[#2d563d] text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1 text-[#174828]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Política de Seguridad y Persistencia Permanente:
                </span>
                <p>
                  {PASSWORD_POLICY_DESCRIPTION} Al confirmar el cambio, la contraseña anterior dejará de funcionar de inmediato y la nueva clave quedará registrada permanentemente en la base de datos y bóveda criptográfica segura.
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-[#e5eee5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingReset}
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingReset ||
                    newPasswordValue.length < 12 ||
                    newPasswordValue !== confirmPasswordValue ||
                    (resetTargetUser.rol_id === 'ROL_ADMIN' && !adminWarningConfirmed)
                  }
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] disabled:bg-[#86a892] disabled:cursor-not-allowed text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingReset ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmittingReset ? 'Guardando...' : 'Guardar cambio'}</span>
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

            {editingCliente && (
              <div className="flex items-center justify-between p-2.5 bg-[#f0f5f1] border border-[#d2e2d6] rounded-xl text-[11px] text-[#2a5439] mb-3">
                <span><strong>Código Cliente:</strong> <span className="font-mono font-bold">{editingCliente.id}</span></span>
                <span><strong>Alta:</strong> {editingCliente.fecha_creacion ? new Date(editingCliente.fecha_creacion).toLocaleDateString('es-AR') : 'Preexistente'}</span>
              </div>
            )}

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
                    CUIT / CUIL (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteForm.cuit}
                    onChange={e => setClienteForm({ ...clienteForm, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X (11 dígitos)"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <span className="text-[10px] text-[#698474]">11 dígitos sin espacios ni guiones</span>
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Tipo de Persona
                  </label>
                  <select
                    value={clienteForm.tipo_persona || 'Jurídica'}
                    onChange={e => setClienteForm({ ...clienteForm, tipo_persona: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs font-semibold"
                  >
                    <option value="Jurídica">Persona Jurídica (S.A., S.R.L., etc.)</option>
                    <option value="Física">Persona Física / Humana</option>
                  </select>
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

                <div className="sm:col-span-2">
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
                  disabled={isSubmittingCliente}
                  onClick={() => setShowClienteModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCliente}
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] disabled:bg-[#73947f] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingCliente ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmittingCliente ? 'Guardando...' : editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
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

            {editingProveedor && (
              <div className="flex items-center justify-between p-2.5 bg-[#f0f5f1] border border-[#d2e2d6] rounded-xl text-[11px] text-[#2a5439] mb-3">
                <span><strong>Código Proveedor:</strong> <span className="font-mono font-bold">{editingProveedor.id}</span></span>
                <span><strong>Alta:</strong> {editingProveedor.fecha_creacion ? new Date(editingProveedor.fecha_creacion).toLocaleDateString('es-AR') : 'Preexistente'}</span>
              </div>
            )}

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
                    CUIT / CUIL (*)
                  </label>
                  <input
                    type="text"
                    required
                    value={proveedorForm.cuit}
                    onChange={e => setProveedorForm({ ...proveedorForm, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X (11 dígitos)"
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#1f5936]"
                  />
                  <span className="text-[10px] text-[#698474]">11 dígitos sin espacios ni guiones</span>
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Rubro o Actividad Comercial
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.rubro_actividad || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, rubro_actividad: e.target.value })}
                    placeholder="ej. Nutrición Animal, Sanidad, Fletes..."
                    className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#21432f] mb-1">
                    Tipo de Suministro
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
                    Condición Frente al IVA
                  </label>
                  <select
                    value={proveedorForm.condicion_iva}
                    onChange={e => setProveedorForm({ ...proveedorForm, condicion_iva: e.target.value })}
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
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={proveedorForm.direccion || ''}
                    onChange={e => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                    placeholder="ej. Ruta 36 Km 610"
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
                  disabled={isSubmittingProveedor}
                  onClick={() => setShowProveedorModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c6d7c8] text-[#3e5a48] font-semibold hover:bg-[#edf4ee] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProveedor}
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] disabled:bg-[#73947f] text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingProveedor ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmittingProveedor ? 'Guardando...' : editingProveedor ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL DIAGNÓSTICO DE SINCRONIZACIÓN                                      */}
      {/* ========================================================================= */}
      {syncDiagnosticRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  syncDiagnosticRecord.item.sync_status === 'ERROR'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : syncDiagnosticRecord.item.sync_status === 'PENDIENTE'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#143222]">Diagnóstico de Sincronización</h3>
                  <p className="text-[11px] text-[#5c7767]">
                    Detalles técnicos de persistencia y estado en Google Sheets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSyncDiagnosticRecord(null)}
                className="text-[#657f70] hover:text-[#183a25] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#f8faf8] border border-[#d8e2d7] p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tabla:</span>
                  <span className="font-mono font-bold text-[#1a3826]">{syncDiagnosticRecord.table}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium font-sans">Identificador:</span>
                  <span className="font-mono text-[#1a3826]">
                    {'usuario_id' in syncDiagnosticRecord.item ? syncDiagnosticRecord.item.usuario_id : syncDiagnosticRecord.item.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium font-sans">Nombre / Razón Social:</span>
                  <span className="font-semibold text-[#1a3826]">
                    {'usuario' in syncDiagnosticRecord.item ? syncDiagnosticRecord.item.usuario : syncDiagnosticRecord.item.razon_social}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium font-sans">Estado de Sincronización:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    syncDiagnosticRecord.item.sync_status === 'ERROR'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : syncDiagnosticRecord.item.sync_status === 'PENDIENTE'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : syncDiagnosticRecord.item.sync_status === 'LOCAL'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {syncDiagnosticRecord.item.sync_status || 'DESCONOCIDO'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Fecha y Hora de Último Intento:</label>
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono text-[11px] text-slate-800">
                  {syncDiagnosticRecord.item.last_sync_attempt || 'Sin registro de intento previo'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Motivo / Diagnóstico:</label>
                <div className={`p-2.5 rounded-lg text-[11px] leading-relaxed border ${
                  syncDiagnosticRecord.item.sync_status === 'ERROR'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : syncDiagnosticRecord.item.sync_status === 'PENDIENTE'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {syncDiagnosticRecord.item.sync_error_message ||
                    (syncDiagnosticRecord.item.sync_status === 'ERROR'
                      ? 'No se recibió respuesta satisfactoria del servidor de Google Apps Script. El registro se encuentra protegido en el almacenamiento local y disponible para compras y ventas.'
                      : syncDiagnosticRecord.item.sync_status === 'PENDIENTE'
                      ? 'El registro fue creado/modificado localmente y está en la cola de envío hacia Google Sheets.'
                      : syncDiagnosticRecord.item.sync_status === 'LOCAL'
                      ? 'El registro está guardado de forma segura en la base local del navegador y 100% operativo en todas las listas de compras y ventas.'
                      : 'El registro se encuentra correctamente procesado y sincronizado con Google Sheets.')
                  }
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[11px] text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Disponibilidad funcional:</strong> El registro está 100% disponible y operativo en las listas desplegables y formularios de compras y ventas de todas las unidades (Porcinos, Bovinos y Ovinos).
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSyncDiagnosticRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  setIsRetryingSync(true);
                  try {
                    const recordId = 'usuario_id' in syncDiagnosticRecord.item ? syncDiagnosticRecord.item.usuario_id : syncDiagnosticRecord.item.id;
                    const res = await dbManager.retryAdminRecordSync(syncDiagnosticRecord.table, recordId);
                    if (res.success) {
                      showNotification('info', 'Reintento de sincronización enviado a Google Sheets.');
                      setSyncDiagnosticRecord(null);
                    } else {
                      showNotification('error', res.message || 'Error al reintentar la sincronización.');
                    }
                  } catch (err: any) {
                    showNotification('error', err?.message || 'Error inesperado al reintentar.');
                  } finally {
                    setIsRetryingSync(false);
                  }
                }}
                disabled={isRetryingSync}
                className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
                <span>{isRetryingSync ? 'Reintentando...' : 'Reintentar Sincronización'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONFIRMACIÓN DE ELIMINACIÓN (LOCAL + GOOGLE SHEETS)                */}
      {/* ========================================================================= */}
      {deleteConfirm && deleteConfirm.show && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-red-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-red-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-red-900">Confirmar Eliminación de Registro</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Tabla: {deleteConfirm.tableName}</span>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-red-900 leading-relaxed">
                <p className="font-bold mb-1">¿Está seguro de eliminar este registro?</p>
                <p>
                  Registro: <strong>{deleteConfirm.label}</strong> (<span className="font-mono">{deleteConfirm.id}</span>)
                </p>
                <p className="mt-2 text-[11px] text-red-700">
                  Esta acción eliminará el registro de la base local y enviará la orden de eliminación a la hoja correspondiente en Google Sheets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={handleDeleteConfirmSubmit}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-red-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isDeletingRecord ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingRecord ? 'Eliminando...' : 'Eliminar Registro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AGREGAR ÍTEM A TABLA MAESTRA DE SOPORTE                           */}
      {/* ========================================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-[#d8e2d7] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#edf3ee] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ec] text-[#174e2d] flex items-center justify-center border border-[#cde2d1]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#143422]">
                    {selectedCatalog === 'D_Insumo' && 'Agregar Nuevo Insumo / Alimento'}
                    {selectedCatalog === 'Categorias_SENASA' && 'Agregar Nueva Categoría SENASA'}
                    {selectedCatalog === 'D_Cuenta' && 'Agregar Nueva Cuenta Contable'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Tabla Maestra: {selectedCatalog}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCatalogItem} className="space-y-4 text-xs">
              {selectedCatalog === 'D_Insumo' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Nombre del Insumo / Ración *</label>
                    <input
                      type="text"
                      required
                      value={catalogForm.nombre}
                      onChange={e => setCatalogForm({ ...catalogForm, nombre: e.target.value })}
                      placeholder="Ej. Núcleo Vitamínico Mineral Porcino"
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none focus:border-[#174e2d]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Tipo de Insumo</label>
                      <select
                        value={catalogForm.tipo_insumo}
                        onChange={e => setCatalogForm({ ...catalogForm, tipo_insumo: e.target.value })}
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      >
                        <option value="GRANO">Grano / Cereal</option>
                        <option value="PROTEICO">Proteico / Concentrado</option>
                        <option value="BALANCEADO">Alimento Balanceado</option>
                        <option value="SANIDAD">Sanidad / Vacuna / Medicamento</option>
                        <option value="FORRAJE">Forraje / Reserva</option>
                        <option value="SEMEN">Genética / Semen</option>
                        <option value="OTROS">Otros Insumos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Unidad de Medida (U.M.)</label>
                      <select
                        value={catalogForm.um_id}
                        onChange={e => setCatalogForm({ ...catalogForm, um_id: e.target.value })}
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      >
                        <option value="UM_KG">Kilogramo (kg)</option>
                        <option value="UM_TN">Tonelada (tn)</option>
                        <option value="UM_UN">Unidad (un)</option>
                        <option value="UM_DOSIS">Dosis</option>
                        <option value="UM_CAB">Cabezas (cab)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[#f4f8f4] border border-[#d6e6d8] rounded-xl">
                    <input
                      type="checkbox"
                      id="es_alimento_chk"
                      checked={catalogForm.es_alimento}
                      onChange={e => setCatalogForm({ ...catalogForm, es_alimento: e.target.checked })}
                      className="w-4 h-4 rounded text-[#174e2d] focus:ring-0"
                    />
                    <label htmlFor="es_alimento_chk" className="font-semibold text-[#1b4329] cursor-pointer">
                      ¿Es alimento o componente de ración nutritiva?
                    </label>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Cuenta Contable de Imputación</label>
                    <select
                      value={catalogForm.cuenta_id}
                      onChange={e => setCatalogForm({ ...catalogForm, cuenta_id: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                    >
                      {db.D_Cuenta.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} - {c.nombre} ({c.rubro})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedCatalog === 'Categorias_SENASA' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Nombre de la Categoría SENASA *</label>
                    <input
                      type="text"
                      required
                      value={catalogForm.nombre}
                      onChange={e => setCatalogForm({ ...catalogForm, nombre: e.target.value })}
                      placeholder="Ej. Cachorra de Reposición"
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none focus:border-[#174e2d]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Peso Mínimo (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={catalogForm.peso_min}
                        onChange={e => setCatalogForm({ ...catalogForm, peso_min: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Peso Máximo (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={catalogForm.peso_max}
                        onChange={e => setCatalogForm({ ...catalogForm, peso_max: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Sexo Aplica</label>
                    <select
                      value={catalogForm.sexo_aplica}
                      onChange={e => setCatalogForm({ ...catalogForm, sexo_aplica: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                    >
                      <option value="Ambos">Ambos</option>
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>
                </>
              )}

              {selectedCatalog === 'D_Cuenta' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Código Contable *</label>
                      <input
                        type="text"
                        required
                        value={catalogForm.codigo}
                        onChange={e => setCatalogForm({ ...catalogForm, codigo: e.target.value })}
                        placeholder="Ej. 5.1.01.20"
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1a3826] mb-1">Tipo de Cuenta</label>
                      <select
                        value={catalogForm.tipo_cuenta}
                        onChange={e => setCatalogForm({ ...catalogForm, tipo_cuenta: e.target.value })}
                        className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                      >
                        <option value="IMPUTABLE">Imputable (Asienta movimientos)</option>
                        <option value="NO_IMPUTABLE">No Imputable (Rubro / Título)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Denominación de la Cuenta *</label>
                    <input
                      type="text"
                      required
                      value={catalogForm.nombre}
                      onChange={e => setCatalogForm({ ...catalogForm, nombre: e.target.value })}
                      placeholder="Ej. Costo Alimentación - Suplementos Ovinos"
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1a3826] mb-1">Rubro Contable</label>
                    <select
                      value={catalogForm.rubro}
                      onChange={e => setCatalogForm({ ...catalogForm, rubro: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8faf8] border border-[#cfddcf] rounded-xl focus:outline-none"
                    >
                      <option value="RESULTADOS_NEGATIVOS">Resultados Negativos (Costos / Gastos)</option>
                      <option value="RESULTADOS_POSITIVOS">Resultados Positivos (Ingresos / Ventas)</option>
                      <option value="ACTIVO">Activo (Bienes de Cambio / Disponibilidades)</option>
                      <option value="PASIVO">Pasivo (Deudas comerciales)</option>
                      <option value="PATRIMONIO_NETO">Patrimonio Neto</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#edf3ee]">
                <button
                  type="button"
                  disabled={isSubmittingCatalog}
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCatalog}
                  className="px-4 py-2 rounded-xl bg-[#174e2d] hover:bg-[#123e24] disabled:bg-[#72927d] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmittingCatalog ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmittingCatalog ? 'Guardando...' : 'Guardar y Vincular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
