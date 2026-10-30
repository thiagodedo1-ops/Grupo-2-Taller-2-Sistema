import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Printer, 
  Download, 
  FileText, 
  Layers, 
  Users, 
  Sliders, 
  Compass, 
  LineChart, 
  TrendingUp, 
  Utensils, 
  Boxes, 
  Calculator, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Upload,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  Workflow,
  ArrowRight,
  Play,
  Eye,
  ShieldCheck,
  Check,
  HelpCircle,
  MapPin,
  Calendar,
  Clock,
  Award,
  RefreshCw,
  BarChart3,
  PieChart,
  MousePointerClick,
  FileCheck,
  DollarSign,
  Scale,
  ArrowDownRight,
  Tag,
  Star,
  Lock,
  Building2,
  Truck,
  FileSpreadsheet
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { getRolePermissions } from '../lib/permissions';

interface Props {
  currentUser?: Usuario | null;
  onOpenGemini?: () => void;
  onOpenReorderTabs?: () => void;
}

export const ManualView: React.FC<Props> = ({ 
  currentUser = null,
  onOpenGemini,
  onOpenReorderTabs
}) => {
  const permissions = getRolePermissions(currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string>('cap-1');
  const [viewMode, setViewMode] = useState<'tutorial' | 'interactive' | 'pdf'>('tutorial');
  const [selectedTutorialId, setSelectedTutorialId] = useState<string>('tut-ciclo');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activeStageId, setActiveStageId] = useState<string>('stage-partos');
  const [manualPdf, setManualPdf] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pozo_del_carril_manual_pdf');
    } catch {
      return null;
    }
  });

  const handleUploadPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor seleccione un archivo en formato PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          localStorage.setItem('pozo_del_carril_manual_pdf', base64);
          setManualPdf(base64);
          alert('Manual en formato PDF cargado exitosamente.');
        } catch (err) {
          console.error(err);
          alert('El archivo es demasiado grande para el almacenamiento local del navegador.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const capitulos = [
    {
      id: 'cap-1',
      num: '1',
      titulo: 'Introducción y Modelo Productivo',
      icono: Compass,
      tags: ['pozo del carril', 'unrc', 'fce', 'modelo', 'semi-intensivo', 'parideras', 'ciclo completo'],
      resumen: 'Fundamentos de la Unidad C de Producción Porcina, enfoque didáctico-productivo y fases biológicas a campo.'
    },
    {
      id: 'cap-2',
      num: '2',
      titulo: 'Roles, Permisos y Seguridad (RBAC)',
      icono: Users,
      tags: ['roles', 'permisos', 'admin', 'encargado', 'operario', 'auditor', 'seguridad', 'rbac'],
      resumen: 'Matriz de control de acceso basada en roles, responsabilidades operativas y trazabilidad de acciones.'
    },
    {
      id: 'cap-3',
      num: '3',
      titulo: 'Personalización y Reordenamiento de Pestañas',
      icono: Sliders,
      tags: ['orden', 'pestañas', 'hojas', 'personalizar', 'moneda', 'ars', 'usd', 'navegacion'],
      resumen: 'Configuración de navegación a gusto propio, reordenamiento de módulos y selección de divisa (ARS/USD).'
    },
    {
      id: 'cap-4',
      num: '4',
      titulo: 'Gestión Operativa: Producción y Manejo',
      icono: Layers,
      tags: ['produccion', 'servicios', 'partos', 'destete', 'mortandad', 'pases', 'camadas'],
      resumen: 'Flujo zootécnico: montas, control de gestación (114 d), pariciones, supervivencia al destete y pases.'
    },
    {
      id: 'cap-5',
      num: '5',
      titulo: 'Alimentación, Raciones e ICA',
      icono: Utensils,
      tags: ['alimento', 'raciones', 'ica', 'maiz', 'soja', 'nucleo', 'conversion', 'consumo'],
      resumen: 'Formulación y suministro de raciones por fase, balanceo nutricional y control del Índice de Conversión Alimenticia.'
    },
    {
      id: 'cap-6',
      num: '6',
      titulo: 'Compras e Insumos Agropecuarios',
      icono: Boxes,
      tags: ['compras', 'insumos', 'granos', 'concentrados', 'proveedores', 'costeo'],
      resumen: 'Circuito de compras, comprobantes de ingreso, imputación de costos y cálculo de precios ponderados.'
    },
    {
      id: 'cap-7',
      num: '7',
      titulo: 'Ventas y Comercialización Porcina',
      icono: TrendingUp,
      tags: ['ventas', 'capones', 'lechones', 'rosporc', 'flete', 'gastos comercializacion', 'frigorifico'],
      resumen: 'Despachos a faena, precios de referencia ROSPORC, flete y valorización de gastos comerciales.'
    },
    {
      id: 'cap-8',
      num: '8',
      titulo: 'Stock Físico y Balance de Masas',
      icono: Boxes,
      tags: ['stock', 'inventario', 'cabezas', 'balance masa', 'altas', 'bajas', 'categorias'],
      resumen: 'Control permanente del inventario por categoría zootécnica y conciliación de movimientos físicos.'
    },
    {
      id: 'cap-9',
      num: '9',
      titulo: 'Valuación de Existencias y Criterio VNR',
      icono: Calculator,
      tags: ['vnr', 'existencias', 'valuacion', 'costo acumulado', 'cierre', 'reapertura', 'mercado activo'],
      resumen: 'Fórmula de Valor Neto de Realización para capones, costo acumulado de recría y cierre mensual.'
    },
    {
      id: 'cap-10',
      num: '10',
      titulo: 'Presupuestos y Análisis de Desvíos',
      icono: Calculator,
      tags: ['presupuesto', 'desvios', 'economico', 'financiero', 'margen bruto', 'flujo fondos'],
      resumen: 'Planificación económica y financiera a 12 meses, margen bruto por capón y análisis causa-raíz de desvíos.'
    },
    {
      id: 'cap-11',
      num: '11',
      titulo: 'Histórico Económico y Tendencias',
      icono: TrendingUp,
      tags: ['historico', 'series', 'tendencia', 'margen', 'campañas', 'evolucion'],
      resumen: 'Evolución plurianual de márgenes brutos, costos por kilo vivo y relación de precios insumo/producto.'
    },
    {
      id: 'cap-12',
      num: '12',
      titulo: 'Cuadro de Mando Integral (CMI): Arquitectura y Totalidad de Indicadores',
      icono: LineChart,
      tags: ['cmi', 'indicadores', 'cuadro de mando', 'perspectivas', 'financiera', 'clientes', 'procesos', 'aprendizaje', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'c1', 'c2', 'c3', 'c4', 'c5', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'a1', 'a2', 'a3', 'a4', 'a5', 'semaforo', 'metas'],
      resumen: 'Funcionamiento integral del CMI: mapa causa-efecto entre las 4 perspectivas, reglas del semáforo, priorización dinámica y desglose exhaustivo de los 24 indicadores (F1-F7, C1-C5, P1-P7 y A1-A5).'
    },
    {
      id: 'cap-usuarios',
      num: '13',
      titulo: 'Administración de usuarios, clientes y proveedores',
      icono: Users,
      tags: ['usuarios', 'clientes', 'proveedores', 'sheets', 'seguridad', 'contraseñas', 'rbac', 'roles', 'administracion', 'catalogos'],
      resumen: 'Gestión centralizada de accesos y roles, registro de clientes y proveedores, seguridad criptográfica de contraseñas y sincronización automática con Google Sheets.'
    },
    {
      id: 'cap-13',
      num: '14',
      titulo: 'Auditoría, Trazabilidad y Control Interno',
      icono: ShieldAlert,
      tags: ['auditoria', 'trazabilidad', 'estados', 'borrador', 'confirmado', 'anulado', 'logs'],
      resumen: 'Bitácora inmutable de eventos, ciclo de vida de comprobantes y validaciones de consistencia.'
    },
    {
      id: 'cap-14',
      num: '15',
      titulo: 'Asistente de Inteligencia Artificial (Gemini)',
      icono: Sparkles,
      tags: ['ia', 'gemini', 'asistente', 'consultas', 'preguntas', 'sin api key'],
      resumen: 'Uso del asistente conversacional libre para resolver cualquier duda general, científica o del establecimiento.'
    },
    {
      id: 'cap-15',
      num: '16',
      titulo: 'Glosario Zootécnico y Fórmulas Clave',
      icono: BookOpen,
      tags: ['glosario', 'formulas', 'ica', 'vnr', 'desbaste', 'terminos', 'definiciones'],
      resumen: 'Compendio de fórmulas matemáticas, ratios zootécnicos y definiciones técnicas del sector porcino.'
    }
  ];

  const filteredCapitulos = useMemo(() => {
    if (!searchTerm.trim()) return capitulos;
    const term = searchTerm.toLowerCase();
    return capitulos.filter(c => 
      c.titulo.toLowerCase().includes(term) ||
      c.resumen.toLowerCase().includes(term) ||
      c.tags.some(t => t.includes(term))
    );
  }, [searchTerm, capitulos]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Encabezado Superior con Acciones */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#d8e2d7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1c4b31] border border-[#2b714b] flex items-center justify-center text-[#7ee7a9] shadow-sm shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-[#143422] tracking-tight">
                Manual de Uso del Sistema de Gestión Porcina
              </h2>
              <span className="text-[10px] bg-[#edf6f0] text-[#1b5e37] px-2 py-0.5 rounded-full font-bold border border-[#bbf7d0]">
                Versión 2.5 Oficial
              </span>
            </div>
            <p className="text-xs text-[#5c7767] mt-0.5">
              Establecimiento Didáctico-Productivo Pozo del Carril · La Aguada (Facultad de Ciencias Económicas - UNRC)
            </p>
          </div>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Conmutador Modo Tutoriales Gráficos / Manual Técnico / Modo PDF */}
          <div className="flex items-center bg-[#f0f4f1] p-1 rounded-xl border border-[#dce6dc] text-xs">
            <button
              onClick={() => setViewMode('tutorial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'tutorial'
                  ? 'bg-[#1c4b31] text-white shadow-2xs'
                  : 'text-[#5f7e6a] hover:text-[#1c4b31]'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Tutoriales Gráficos</span>
            </button>
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'interactive'
                  ? 'bg-white text-[#1c4b31] shadow-2xs'
                  : 'text-[#5f7e6a] hover:text-[#1c4b31]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual Técnico</span>
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'pdf'
                  ? 'bg-white text-[#1c4b31] shadow-2xs'
                  : 'text-[#5f7e6a] hover:text-[#1c4b31]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Oficial</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white hover:bg-[#f6f9f6] text-[#224430] border border-[#c8d8ca] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            title="Imprimir o Guardar en PDF este manual"
          >
            <Printer className="w-4 h-4 text-[#1b5e37]" />
            <span>Imprimir / PDF</span>
          </button>

          {onOpenReorderTabs && (
            <button
              onClick={onOpenReorderTabs}
              className="px-3 py-2 bg-[#edf6f0] hover:bg-[#dcf3e4] text-[#1c4b31] border border-[#bbf7d0] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Personalizar el orden de las pestañas en el menú"
            >
              <Sliders className="w-4 h-4 text-[#1b5e37]" />
              <span>Personalizar Pestañas</span>
            </button>
          )}

          {permissions.rolId === 'ROL_ADMIN' && (
            <label className="px-3 py-2 bg-[#1c4b31] hover:bg-[#123823] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>{manualPdf ? 'Reemplazar PDF' : 'Cargar PDF Oficial'}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleUploadPdf}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Modo Visor PDF Oficial */}
      {viewMode === 'pdf' && (
        <div className="bg-white p-6 rounded-2xl border border-[#d8e2d7] shadow-xs">
          {manualPdf ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#f4f8f5] p-3 rounded-xl border border-[#dce7dd] text-xs">
                <span className="font-semibold text-[#234230]">
                  Archivo PDF del Manual de Uso cargado por la administración
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={manualPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1b5e37] hover:bg-[#14472a] text-white font-bold rounded-lg text-xs"
                  >
                    Abrir en Nueva Pestaña
                  </a>
                  <a
                    href={manualPdf}
                    download="Manual_De_Uso_Pozo_Del_Carril.pdf"
                    className="px-3 py-1.5 border border-[#1b5e37] text-[#1b5e37] hover:bg-[#edf6f0] font-bold rounded-lg text-xs"
                  >
                    Descargar PDF
                  </a>
                </div>
              </div>
              <iframe
                src={manualPdf}
                className="w-full h-[750px] border border-[#d8e2d7] rounded-xl shadow-xs"
                title="Visor PDF Oficial"
              />
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-[#edf6f0] text-[#1b5e37] rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                📄
              </div>
              <h3 className="text-base font-bold text-[#143422]">
                No hay un archivo PDF externo cargado todavía
              </h3>
              <p className="text-xs text-[#5c7767] max-w-lg mx-auto leading-relaxed">
                El sistema dispone de <strong>Tutoriales Gráficos Paso a Paso</strong> y del <strong>Manual Técnico Completo</strong> en las solapas superiores. Si la administración dispone de un documento PDF oficial institucional, puede subirlo mediante el botón superior «Cargar PDF Oficial».
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setViewMode('tutorial')}
                  className="px-4 py-2 bg-[#1c4b31] text-white rounded-xl text-xs font-bold hover:bg-[#123823] cursor-pointer"
                >
                  Ver Tutoriales Gráficos
                </button>
                <button
                  onClick={() => setViewMode('interactive')}
                  className="px-4 py-2 bg-white border border-[#1c4b31] text-[#1c4b31] rounded-xl text-xs font-bold hover:bg-[#edf6f0] cursor-pointer"
                >
                  Ver Manual Técnico
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modo Tutoriales Gráficos (Paso a Paso) */}
      {viewMode === 'tutorial' && (
        <div className="space-y-6">
          {/* Banner de Presentación del Modelo Didáctico-Productivo */}
          <div className="bg-linear-to-r from-[#0c1f15] via-[#143622] to-[#1c4b31] rounded-2xl p-6 text-white shadow-md border border-[#23583d] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
            <div className="max-w-3xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b5e37]/70 border border-[#34d399]/40 text-[#7ee7a9] text-[11px] font-bold">
                <Workflow className="w-3.5 h-3.5" />
                <span>Guía Gráfica Oficial del Modelo Porcino</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Cómo Operar el Sistema de Gestión · Pozo del Carril (UNRC)
              </h3>
              <p className="text-xs text-[#b9d7c4] leading-relaxed">
                Este sistema digitaliza el <strong>ciclo completo semi-intensivo a campo</strong> del establecimiento didáctico-productivo. Conoce el flujo zootécnico (servicios, partos en arcos, destete, recría y engorde a capón) y el flujo contable (costeo de raciones con grano propio, valuación VNR y Cuadro de Mando Integral con el indicador A5 de visitas estudiantiles).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="bg-[#0b1b11] px-2.5 py-1 rounded-lg border border-[#1d4c32] text-[#9fc7ad]">
                  📍 Río Cuarto, Córdoba
                </span>
                <span className="bg-[#0b1b11] px-2.5 py-1 rounded-lg border border-[#1d4c32] text-[#9fc7ad]">
                  🐖 Madres F1 Landrace x Yorkshire + Padrillos Duroc/Pietrain
                </span>
                <span className="bg-[#0b1b11] px-2.5 py-1 rounded-lg border border-[#1d4c32] text-[#9fc7ad]">
                  🎯 Meta ICA Engorde ≤ 2.9 · Supervivencia Destete ≥ 85.8%
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Pestañas de Tutoriales */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#dce6dc]">
            {[
              { id: 'tut-ciclo', label: '1. Mapa del Ciclo Completo', icon: Compass },
              { id: 'tut-partos', label: '2. Partos & Pases de Lote', icon: Layers },
              { id: 'tut-alimento', label: '3. Alimentación & ICA', icon: Utensils },
              { id: 'tut-ventas', label: '4. Ventas & Valuación VNR', icon: TrendingUp },
              { id: 'tut-cmi', label: '5. Cuadro de Mando Integral (CMI)', icon: LineChart },
              { id: 'tut-pestanas', label: '6. Personalizar Pestañas', icon: Sliders },
              { id: 'tut-auditoria', label: '7. Auditoría & Cierres', icon: ShieldCheck },
              { id: 'tut-simulador', label: '8. Asistente Rápido ("¿Qué hago?")', icon: HelpCircle }
            ].map(t => {
              const Icon = t.icon;
              const isSelected = selectedTutorialId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTutorialId(t.id);
                    setActiveStep(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c4b31] text-white shadow-2xs'
                      : 'bg-white text-[#4a6b57] hover:bg-[#edf6f0] border border-[#d8e2d7]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#7ee7a9]' : 'text-[#6b8c77]'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TUTORIAL 1: MAPA DEL CICLO PRODUCTIVO (DIAGRAMA INTERACTIVO) */}
          {selectedTutorialId === 'tut-ciclo' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5ece5] pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                    <Compass className="w-3 h-3" />
                    <span>Diagrama de Flujo General del Establecimiento</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#143422] mt-1">
                    Mapa de Procesos: Del Servicio a la Faena y Valuación VNR
                  </h4>
                  <p className="text-xs text-[#5c7767]">
                    Haz clic en cualquiera de las 7 etapas para inspeccionar sus reglas zootécnicas, raciones y módulo de software.
                  </p>
                </div>
              </div>

              {/* Pipeline Horizontal de las 7 Etapas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                {[
                  {
                    id: 'stage-servicios',
                    num: '1',
                    nombre: 'Servicios',
                    sub: 'Piquetes a campo',
                    duracion: 'Monta / Celo',
                    color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
                    badge: 'Gestación 114 d'
                  },
                  {
                    id: 'stage-partos',
                    num: '2',
                    nombre: 'Partos',
                    sub: 'Arcos refugio',
                    duracion: '21 a 28 días',
                    color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
                    badge: '≥ 11 vivos/camada'
                  },
                  {
                    id: 'stage-destete',
                    num: '3',
                    nombre: 'Destete',
                    sub: 'Pase a pistas',
                    duracion: 'Día 21 - 28',
                    color: 'border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-900',
                    badge: '6.5 - 7.5 kg'
                  },
                  {
                    id: 'stage-recria',
                    num: '4',
                    nombre: 'Recría',
                    sub: 'Pistas confinadas',
                    duracion: 'Hasta ~30 kg',
                    color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
                    badge: 'ICA ≤ 1.7'
                  },
                  {
                    id: 'stage-engorde',
                    num: '5',
                    nombre: 'Terminación',
                    sub: 'Engorde pesado',
                    duracion: 'Hasta 110-115 kg',
                    color: 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-900',
                    badge: 'ICA ≤ 2.9'
                  },
                  {
                    id: 'stage-ventas',
                    num: '6',
                    nombre: 'Ventas',
                    sub: 'Despacho frigorífico',
                    duracion: 'Capones a faena',
                    color: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
                    badge: 'ROSPORC - flete'
                  },
                  {
                    id: 'stage-cierre',
                    num: '7',
                    nombre: 'Valuación & CMI',
                    sub: 'Cierre de período',
                    duracion: 'Fin de mes',
                    color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
                    badge: 'VNR + A5 Visitas'
                  }
                ].map((s) => {
                  const isCurrent = activeStageId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveStageId(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${s.color} ${
                        isCurrent ? 'ring-2 ring-[#1c4b31] shadow-sm scale-102 font-bold' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="w-5 h-5 rounded-full bg-white/90 font-mono text-[10px] font-bold flex items-center justify-center shadow-2xs">
                            {s.num}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 font-semibold truncate">
                            {s.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold leading-tight">{s.nombre}</div>
                        <div className="text-[10px] opacity-75">{s.sub}</div>
                      </div>
                      <div className="text-[9px] mt-2 font-mono text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{s.duracion}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detalle de la Etapa Seleccionada */}
              {activeStageId === 'stage-servicios' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#2563eb] text-white flex items-center justify-center text-xs">1</span>
                      <span>Etapa 1: Servicios y Control de Gestación a Campo</span>
                    </h5>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                      Módulo: Producción
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Zootécnica y Campo</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Monta natural dirigida en piquetes de pastoreo. Duración exacta de gestación: <strong>114 días</strong> (3 meses, 3 semanas, 3 días). Control de celo a los 21 días post-servicio.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Alimentación Asignada</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        <strong>Ración Gestación:</strong> 2.0 a 2.3 kg/día por cerda gestante (maíz molido propio + pellet de soja + núcleo vitamínico-mineral).
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Registro en el Sistema</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        En <strong>Producción &gt; Servicios</strong>: Cargar Caravana Madre, Padrillo utilizado, fecha de servicio y fecha probable de parto calculada automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-partos' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#16a34a] text-white flex items-center justify-center text-xs">2</span>
                      <span>Etapa 2: Maternidad y Partos en Arcos Refugio</span>
                    </h5>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Módulo: Producción
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Manejo en Parideras</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Arcos parideras a campo con cama de paja limpia y barras anti-aplastamiento. Meta zootécnica: <strong>≥ 11 lechones nacidos vivos</strong> por camada.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Lactancia y Cuidados</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Lactancia de 21 a 28 días. Descolmillado, corte/desinfección de cordón, hierro inyectable a las 48 hs. Ración Lactancia ad-libitum para la cerda.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Carga de Comprobante</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        En <strong>Producción &gt; Partos</strong>: Cargar vivos, muertos, momias y peso camada. El Operario guarda en <em>Borrador</em> y el Encargado <em>Confirma</em>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-destete' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#0d9488] text-white flex items-center justify-center text-xs">3</span>
                      <span>Etapa 3: Destete y Pase de Etapa Zootécnica</span>
                    </h5>
                    <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-md">
                      Módulo: Producción &amp; Stock
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Momento del Destete</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        A los 21-28 días de vida. Peso meta individual: <strong>6.5 a 7.5 kg</strong>. Supervivencia meta al destete institucional: <strong>≥ 85.8%</strong>.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Pase de Lote a Pistas</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Los lechones abandonan las parideras a campo e ingresan a las pistas techadas de destete/recría. Se forman lotes homogéneos por peso.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Balance de Masa Físico</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        El pase resta cabezas de «Lechones al pie» y suma cabezas a «Recría». El balance de masa asegura que ninguna cabeza se duplique ni se pierda.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-recria' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#d97706] text-white flex items-center justify-center text-xs">4</span>
                      <span>Etapa 4: Recría en Pistas Confinadas</span>
                    </h5>
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                      Módulos: Alimentación &amp; Stock
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Objetivo Zootécnico</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Llevar los lechones desde los 7 kg hasta los <strong>30 kg de peso vivo</strong> con sanidad rigurosa (plan de vacunas y desparasitación).
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Alimentación &amp; ICA Meta</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Ración Iniciador y Recría con alta proteína digestible. <strong>ICA Meta ≤ 1.6 - 1.8 kg alimento/kg ganado</strong>.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Valuación Contable</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Al no existir un mercado activo formal para capones en crecimiento de 20 kg, se valúan a <strong>Costo Acumulado de Producción</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-engorde' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#ea580c] text-white flex items-center justify-center text-xs">5</span>
                      <span>Etapa 5: Terminación y Engorde Pesado</span>
                    </h5>
                    <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                      Módulos: Alimentación &amp; Stock
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Fase de Máximo Consumo</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Desde los 30 kg hasta el peso de venta: <strong>110 a 115 kg de peso vivo</strong>. Esta etapa representa más del 70% del consumo de grano total.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Ración Propia y Conversión</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Maíz propio molido (68%) + pellet de soja (28%) + premezcla/núcleo (4%). <strong>ICA Meta de la fase ≤ 2.8 - 3.0 kg/kg</strong>.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Monitoreo de Desvíos</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        El semáforo de ICA en el CMI avisa si hay desperdicio en tolvas o problemas digestivos/sanitarios que encarezcan el costo por kilo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-ventas' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#4f46e5] text-white flex items-center justify-center text-xs">6</span>
                      <span>Etapa 6: Comercialización, Faena y Flete</span>
                    </h5>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                      Módulos: Ventas &amp; Stock
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Despacho a Frigorífico</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Pesada en báscula oficial de granja, descuento por desbaste de transporte (estándar 2.5% a 3%) y control de DTe de SENASA.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Precio de Referencia ROSPORC</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Se toma como precio base el promedio de la Bolsa de Comercio de Rosario (ROSPORC) o contrato pactado por kilo vivo puesto en destino.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Deducción de Gastos</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Se descuenta el flete por jaula y las comisiones comerciales para arribar al ingreso neto real de granja.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStageId === 'stage-cierre' && (
                <div className="p-5 bg-[#f8faf8] border border-[#d8e2d7] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#143422] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#9333ea] text-white flex items-center justify-center text-xs">7</span>
                      <span>Etapa 7: Cierre Mensual, Valuación VNR e Indicador A5</span>
                    </h5>
                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                      Módulos: Existencias &amp; Indicadores (CMI)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Fórmula VNR para Capones</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        <strong>VNR = Precio ROSPORC − Flete − Gastos Comerciales</strong>. Valúa las cabezas finales en pie que están listas para faena.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Indicador A5 (Visitas Estudiantiles)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Mide visitas universitarias y técnicas realizadas. Se carga desde «Gestionar Visitas» en la tarjeta del CMI y computa automáticamente.
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31]">Cierre de Campaña</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        El Encargado/Admin bloquea el período mensual. El sistema archiva los registros confirmados e impide modificaciones retroactivas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TUTORIAL 2: REGISTRO DE PARTOS Y PASES */}
          {selectedTutorialId === 'tut-partos' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <Layers className="w-3 h-3" />
                  <span>Tutorial Práctico Paso a Paso · Módulo Producción</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Cómo Registrar un Parto, Nacimientos y Pase a Maternidad
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Aprende la secuencia exacta para registrar un parto de forma segura respetando los roles de usuario.
                </p>
              </div>

              {/* Pasos Interactivos con Barra de Progreso */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#1c4b31]">
                  <span>Paso {activeStep + 1} de 4</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                      disabled={activeStep === 0}
                      className="px-2.5 py-1 rounded-lg border border-[#c8d8ca] bg-white text-xs disabled:opacity-40 cursor-pointer"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
                      disabled={activeStep === 3}
                      className="px-2.5 py-1 rounded-lg bg-[#1c4b31] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>

                <div className="w-full bg-[#e8efe9] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#1c4b31] h-full transition-all duration-300"
                    style={{ width: `${((activeStep + 1) / 4) * 100}%` }}
                  />
                </div>

                {/* Contenido de cada Paso */}
                {activeStep === 0 && (
                  <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#1c4b31] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        1
                      </span>
                      <div>
                        <h5 className="font-bold text-sm text-[#143422]">Ingreso al Módulo de Producción</h5>
                        <p className="text-xs text-[#5c7767]">Navegación inicial en el menú lateral</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#30523d] leading-relaxed">
                      En la barra lateral izquierda, selecciona la pestaña <strong>«Producción»</strong>. Una vez dentro de la vista, verás los submódulos zootécnicos: <em>Servicios</em>, <em>Partos</em>, <em>Destetes</em> y <em>Mortandad</em>. Haz clic en la solapa <strong>«Partos»</strong>.
                    </p>
                    <div className="p-3 bg-white border border-[#d0e0d2] rounded-xl flex items-center gap-3 text-xs">
                      <MousePointerClick className="w-5 h-5 text-[#16a34a] shrink-0" />
                      <span>Ruta: <code>Sidebar &gt; Producción &gt; Pestaña «Partos» &gt; Botón «+ Registrar Parto»</code></span>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#1c4b31] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        2
                      </span>
                      <div>
                        <h5 className="font-bold text-sm text-[#143422]">Carga de Datos Zootécnicos del Parto</h5>
                        <p className="text-xs text-[#5c7767]">Completar los campos del formulario oficial</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                        <div className="font-bold text-[#1c4b31]">Identificación de los Reproductores</div>
                        <ul className="list-disc pl-4 text-[11px] text-[#4d6a57] space-y-0.5">
                          <li><strong>Caravana Madre:</strong> ej. MAD-104 (F1 Landrace x Yorkshire).</li>
                          <li><strong>Caravana Padrillo:</strong> ej. PAD-08 (Duroc Jersey terminal).</li>
                          <li><strong>Fecha y Hora:</strong> Fecha de parición a campo.</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                        <div className="font-bold text-[#1c4b31]">Conteo de Lechones y Kilos</div>
                        <ul className="list-disc pl-4 text-[11px] text-[#4d6a57] space-y-0.5">
                          <li><strong>Nacidos Vivos:</strong> Lechones viables (Meta ≥ 11).</li>
                          <li><strong>Nacidos Muertos &amp; Momias:</strong> Descarte fetal.</li>
                          <li><strong>Kilos Totales Camada:</strong> ej. 15.6 kg promedio.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Regla de Integridad:</strong> El total nacidos siempre es calculado automáticamente: <em>Total = Vivos + Muertos + Momias</em>.</span>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#1c4b31] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        3
                      </span>
                      <div>
                        <h5 className="font-bold text-sm text-[#143422]">Guardado en Estado Borrador (Operario de Campo)</h5>
                        <p className="text-xs text-[#5c7767]">Segregación de funciones por rol (RBAC)</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#30523d] leading-relaxed">
                      Si quien registra el parto tiene el rol de <strong>Operario de Campo</strong>, el comprobante se almacena automáticamente en estado <strong>«Borrador»</strong>. Esto permite registrar la novedad rápidamente desde el potrero sin alterar aún los balances contables definitivos.
                    </p>
                    <div className="p-3 bg-white border border-[#d0e0d2] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Estado: Borrador
                        </span>
                        <span className="text-[11px] text-[#6b8c77]">Pendiente de revisión del Encargado</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: PAR-2026-104</span>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#1c4b31] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        4
                      </span>
                      <div>
                        <h5 className="font-bold text-sm text-[#143422]">Revisión y Confirmación (Encargado / Administrador)</h5>
                        <p className="text-xs text-[#5c7767]">Impacto definitivo en el stock y el CMI</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#30523d] leading-relaxed">
                      El <strong>Encargado de Producción</strong> revisa la lista de partos pendientes y hace clic en <strong>«Confirmar»</strong>. En ese instante:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                        <div className="font-bold text-emerald-900">Impacto en Stock Físico</div>
                        <p className="text-[11px] text-emerald-800">
                          Se suman los lechones vivos a la categoría <em>«Lechones al pie de la madre»</em> en el módulo Stock.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                        <div className="font-bold text-blue-900">Impacto en Indicadores CMI</div>
                        <p className="text-[11px] text-blue-800">
                          Se actualiza el promedio de nacidos vivos y la tasa de supervivencia al destete en el Cuadro de Mando Integral.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TUTORIAL 3: ALIMENTACIÓN E ICA */}
          {selectedTutorialId === 'tut-alimento' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <Utensils className="w-3 h-3" />
                  <span>Tutorial Práctico Paso a Paso · Módulo Alimentación</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Cómo Formular Raciones y Monitorear el Índice de Conversión Alimenticia (ICA)
                </h4>
                <p className="text-xs text-[#5c7767]">
                  El alimento representa entre el 65% y el 75% del costo de producción en Pozo del Carril.
                </p>
              </div>

              {/* Infografía de la Mezcla y la Tolva */}
              <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-4">
                <h5 className="font-bold text-xs text-[#143422] uppercase tracking-wider">
                  Composición de la Dieta Estándar en Granja Pozo del Carril
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-center space-y-1">
                    <span className="text-2xl font-bold font-mono text-amber-900">68%</span>
                    <div className="text-xs font-bold text-amber-950">Grano de Maíz Propio</div>
                    <p className="text-[10px] text-amber-800">Energía metabólica. Cosechado en el campo didáctico.</p>
                  </div>
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center space-y-1">
                    <span className="text-2xl font-bold font-mono text-emerald-900">28%</span>
                    <div className="text-xs font-bold text-emerald-950">Pellet de Soja (48% PB)</div>
                    <p className="text-[10px] text-emerald-800">Proteína bruta y aminoácidos esenciales (lisina).</p>
                  </div>
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-center space-y-1">
                    <span className="text-2xl font-bold font-mono text-blue-900">4%</span>
                    <div className="text-xs font-bold text-blue-950">Núcleo Vitamínico-Mineral</div>
                    <p className="text-[10px] text-blue-800">Micronutrientes, calcio, fósforo y promotores digestivos.</p>
                  </div>
                </div>

                {/* Fórmula Interactiva y Semáforo */}
                <div className="p-4 bg-[#f4f7f4] border border-[#c8d8ca] rounded-xl space-y-2">
                  <div className="text-xs font-bold text-[#143422] flex items-center justify-between">
                    <span>Fórmula del Índice de Conversión Alimenticia:</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-[#c8d8ca]">
                      ICA = Kilos Alimento ÷ Kilos Ganados
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg font-bold">
                      🟢 Verde: ICA ≤ 2.9 (Excelente)
                    </div>
                    <div className="p-2 bg-amber-100 text-amber-900 rounded-lg font-bold">
                      🟡 Amarillo: 3.0 - 3.2 (Alerta)
                    </div>
                    <div className="p-2 bg-red-100 text-red-900 rounded-lg font-bold">
                      🔴 Rojo: &gt; 3.2 (Desvío Crítico)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIAL 4: VENTAS Y VNR */}
          {selectedTutorialId === 'tut-ventas' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <TrendingUp className="w-3 h-3" />
                  <span>Tutorial Práctico Paso a Paso · Módulos Ventas &amp; Existencias</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Cómo Despachar Capones y Determinar el Valor Neto de Realización (VNR)
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Criterio económico-contable de valuación según la existencia de mercado activo (ROSPORC).
                </p>
              </div>

              {/* Tarjeta de Cálculo del VNR */}
              <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-4">
                <h5 className="font-bold text-xs text-[#143422] uppercase tracking-wider">
                  Desglose Matemático de la Fórmula VNR
                </h5>
                <div className="p-4 bg-linear-to-r from-[#1c4b31] to-[#25633a] text-white rounded-xl space-y-2">
                  <div className="text-xs text-[#9fd5b1] font-mono">FÓRMULA CONTABLE VNR</div>
                  <div className="text-base sm:text-lg font-bold font-mono">
                    VNR = (Precio ROSPORC $/kg) − (Flete $/kg) − (Comisiones y Gastos $/kg)
                  </div>
                  <p className="text-[11px] text-[#c9e8d4]">
                    Aplica exclusivamente a la categoría <strong>Capones Terminados</strong> listos para faena (mercado activo y fluido).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                    <span className="font-bold text-[#1c4b31]">1. Precio Base ROSPORC</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      Se toma la referencia oficial de la Bolsa de Comercio de Rosario para capón tipificado (ej. $2.250 / kg vivo).
                    </p>
                  </div>
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                    <span className="font-bold text-[#1c4b31]">2. Deducción del Flete</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      Costo del transporte en camión jaula desde Pozo del Carril hasta el frigorífico (ej. $85 / kg).
                    </p>
                  </div>
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1">
                    <span className="font-bold text-[#1c4b31]">3. VNR Unitario Resultante</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      $2.250 − $85 = <strong>$2.165 / kg</strong>. Con este valor se multiplican los kilos en pie finales del mes en el módulo Existencias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIAL 5: CUADRO DE MANDO INTEGRAL (CMI) COMPLETO */}
          {selectedTutorialId === 'tut-cmi' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <LineChart className="w-3 h-3" />
                  <span>Tutorial Práctico Paso a Paso · Módulo Indicadores (CMI)</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Cómo Operar el Cuadro de Mando Integral (CMI) y sus 4 Perspectivas
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Gestión integral de los 24 indicadores estratégicos, semaforización, priorización y metas configurables.
                </p>
              </div>

              {/* Diagrama Paso a Paso de las 4 Perspectivas del CMI */}
              <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#1c4b31] text-white font-bold flex items-center justify-center text-xs">1</span>
                    <div className="font-bold text-[#143422]">1. Financiera (F1-F7)</div>
                    <p className="text-[11px] text-[#4d6a57]">
                      Monitorea márgenes sobre ventas, costo por kilo vivo, desvío presupuestario y el VNR de capones.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#1c4b31] text-white font-bold flex items-center justify-center text-xs">2</span>
                    <div className="font-bold text-[#143422]">2. Clientes (C1-C5)</div>
                    <p className="text-[11px] text-[#4d6a57]">
                      Evalúa calidad en destino, capones en peso óptimo (90-105 kg), mortalidad en transporte (C2) y plazos de cobro.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#1c4b31] text-white font-bold flex items-center justify-center text-xs">3</span>
                    <div className="font-bold text-[#143422]">3. Procesos (P1-P7)</div>
                    <p className="text-[11px] text-[#4d6a57]">
                      El núcleo zootécnico: ICA de engorde (P1), supervivencia al destete (P2), partos por madre/año y GDP por subfases.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#1c4b31] text-white font-bold flex items-center justify-center text-xs">4</span>
                    <div className="font-bold text-[#143422]">4. Aprendizaje (A1-A5)</div>
                    <p className="text-[11px] text-[#4d6a57]">
                      Control de registros completos, cargas en 48 hs y gestión de visitas estudiantiles a la unidad (A5).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Funciones Clave del Módulo CMI</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    • <strong>Mis Indicadores Prioritarios:</strong> Selecciona con estrella (⭐) tus indicadores clave para agruparlos en la parte superior.<br />
                    • <strong>Semáforos Automáticos:</strong> Verde (meta alcanzada), Amarillo (atención), Rojo (desvío) y Gris (datos insuficientes).<br />
                    • <strong>Configuración de Metas:</strong> Encargados y Admins pueden ajustar metas y registrar el motivo de cambio para auditoría.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIAL 6: PERSONALIZAR PESTAÑAS */}
          {selectedTutorialId === 'tut-pestanas' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <Sliders className="w-3 h-3" />
                  <span>Tutorial de Interfaz · Navegación a Gusto Propio</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Cómo Editar y Personalizar el Orden de las Pestañas y Hojas
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Configura el sistema según tu flujo diario de trabajo y mantén persistido el orden.
                </p>
              </div>

              <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="font-bold text-[#1c4b31]">1. Abrir Modal de Orden</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      Haz clic en el icono de controles deslizantes junto al título <em>«Modelo de Gestión»</em> en el menú lateral, o desde el botón superior de esta solapa.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="font-bold text-[#1c4b31]">2. Subir o Bajar Hojas</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      Usa los botones con flechas (↑ Subir / ↓ Bajar) para ubicar tus pestañas frecuentes al inicio (ej. Producción o Indicadores).
                    </p>
                  </div>
                  <div className="p-3.5 bg-white border border-[#dce6dc] rounded-xl space-y-1.5">
                    <span className="font-bold text-[#1c4b31]">3. Guardar y Persistir</span>
                    <p className="text-[11px] text-[#4d6a57]">
                      Haz clic en <strong>«Guardar Orden»</strong>. La personalización se almacena de forma persistente en tu navegador.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIAL 7: AUDITORÍA Y CIERRES */}
          {selectedTutorialId === 'tut-auditoria' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tutorial de Control Interno · Auditoría y Cierre de Período</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  Ciclo de Vida de Comprobantes y Cierre de Campaña
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Trazabilidad inmutable de todas las operaciones cargadas en el sistema.
                </p>
              </div>

              <div className="p-5 bg-[#fbfdfb] border border-[#dce6dc] rounded-2xl space-y-4">
                <h5 className="font-bold text-xs text-[#143422] uppercase tracking-wider">
                  Estados de Validación de un Comprobante
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs text-center">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                      Borrador
                    </span>
                    <p className="text-[10px] text-amber-800">Cargado en campo por el Operario. No impacta stock definitivo.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                      Confirmado
                    </span>
                    <p className="text-[10px] text-emerald-800">Validado por Encargado. Actualiza cabezas, kilos y costos.</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-900 font-bold text-[10px]">
                      Observado
                    </span>
                    <p className="text-[10px] text-red-800">Inconsistencia en balance o precio. Requiere rectificación.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-900 font-bold text-[10px]">
                      Anulado
                    </span>
                    <p className="text-[10px] text-slate-700">Comprobante dado de baja con motivo justificado en bitácora.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIAL 8: SIMULADOR ASISTENTE RÁPIDO */}
          {selectedTutorialId === 'tut-simulador' && (
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
              <div className="border-b border-[#e5ece5] pb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#1b5e37] text-[10px] font-bold border border-[#bbf7d0]">
                  <HelpCircle className="w-3 h-3" />
                  <span>Asistente Rápido de Tareas Frecuentes</span>
                </span>
                <h4 className="text-lg font-bold text-[#143422] mt-1">
                  ¿Qué Deseas Hacer en el Sistema? (Guías Inmediatas)
                </h4>
                <p className="text-xs text-[#5c7767]">
                  Selecciona tu objetivo para ver el camino exacto de pantallas y reglas a seguir.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    titulo: 'Quiero registrar un parto ocurrido anoche',
                    pasos: '1. Sidebar > Producción > Pestaña Partos.\n2. Clic en «+ Registrar Parto».\n3. Completar Caravana Madre, lechones vivos, muertos y momias.\n4. Guardar en Borrador para confirmación del Encargado.',
                    modulo: 'Producción'
                  },
                  {
                    titulo: 'Quiero ver si el engorde está convirtiendo bien el alimento',
                    pasos: '1. Sidebar > Alimentación > Solapa Consumos.\n2. Verificar los kilos entregados.\n3. Abrir Indicadores de Gestión > Perspectiva Procesos Internos para ver el semáforo del ICA (Meta ≤ 2.9).',
                    modulo: 'Alimentación & CMI'
                  },
                  {
                    titulo: 'Quiero despachar capones y liquidar la venta',
                    pasos: '1. Sidebar > Ventas > «Nueva Venta».\n2. Cargar cabezas, kilos y precio base ROSPORC.\n3. Imputar flete a frigorífico.\n4. Verificar el VNR neto en la liquidación.',
                    modulo: 'Ventas'
                  },
                  {
                    titulo: 'Quiero registrar una visita de estudiantes de la UNRC',
                    pasos: '1. Sidebar > Indicadores de Gestión.\n2. En Perspectiva Aprendizaje, ubicar tarjeta «A5 - Visitas Estudiantiles».\n3. Clic en «Gestionar Visitas» > Cargar fecha, institución y alumnos.\n4. Marcar estado como «Realizada».',
                    modulo: 'Indicadores CMI'
                  },
                  {
                    titulo: 'Quiero cerrar las existencias al fin de mes',
                    pasos: '1. Sidebar > Existencias & Cierres.\n2. Conciliar cabezas en pie vs inventario teórico.\n3. Valuar capones a VNR y recría a Costo Acumulado.\n4. Clic en «Cerrar Período».',
                    modulo: 'Existencias'
                  },
                  {
                    titulo: 'Quiero consultar dudas al Asistente IA PorcIA',
                    pasos: '1. Clic en «Asistente IA (Gemini)» en la sección Ayuda de la barra lateral.\n2. Pregúntale cualquier duda sobre raciones, CMI, A5 o zootecnia porcina.\n3. PorcIA responderá ubicado en el establecimiento Pozo del Carril.',
                    modulo: 'Ayuda & IA'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-[#fbfdfb] border border-[#dce6dc] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-[#143422]">{item.titulo}</h6>
                      <span className="text-[10px] bg-[#edf6f0] text-[#1b5e37] px-2 py-0.5 rounded-md font-bold">
                        {item.modulo}
                      </span>
                    </div>
                    <pre className="text-[11px] text-[#4d6a57] whitespace-pre-wrap font-sans leading-relaxed bg-white p-2.5 rounded-lg border border-[#e5eee6]">
                      {item.pasos}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modo Manual Técnico Interactivo (15 Capítulos) */}
      {viewMode === 'interactive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Índice y Buscador */}
          <div className="lg:col-span-4 space-y-4">
            {/* Buscador de Contenido */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#72927e] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar temas, fórmulas, A5, VNR, ICA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#c8d8ca] rounded-xl text-xs text-[#143422] placeholder-[#81a18d] focus:outline-hidden focus:ring-2 focus:ring-[#1c4b31]/30 focus:border-[#1c4b31]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#72927e] hover:text-[#1c4b31]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lista de Capítulos */}
            <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-xs overflow-hidden">
              <div className="p-3.5 bg-[#f5f8f5] border-b border-[#dce6dc] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1c4b31] uppercase tracking-wider">
                  Tabla de Contenidos ({filteredCapitulos.length})
                </span>
                <span className="text-[10px] text-[#6b8b76]">15 Capítulos Técnicos</span>
              </div>
              <div className="p-2 divide-y divide-[#edf2ed] max-h-[620px] overflow-y-auto">
                {filteredCapitulos.map((cap) => {
                  const Icon = cap.icono;
                  const isActive = activeChapterId === cap.id;
                  return (
                    <button
                      key={cap.id}
                      onClick={() => setActiveChapterId(cap.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#1c4b31] text-white shadow-2xs'
                          : 'hover:bg-[#f3f7f4] text-[#224430]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0 mt-0.5 ${
                        isActive ? 'bg-[#2a6d47] text-white' : 'bg-[#e7eee8] text-[#1c4b31]'
                      }`}>
                        {cap.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-snug truncate">
                          {cap.titulo}
                        </div>
                        <div className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'text-[#b9e0c7]' : 'text-[#6c8877]'
                        }`}>
                          {cap.resumen}
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 ${
                        isActive ? 'text-[#7ee7a9]' : 'text-[#9ab5a4]'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tarjeta de Asistencia Inteligente */}
            {onOpenGemini && (
              <div className="p-4 rounded-2xl bg-linear-to-br from-[#0c1f15] to-[#163a26] text-white shadow-md border border-[#23583d] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#276e46] flex items-center justify-center text-[#7ee7a9]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">¿Tienes consultas adicionales?</h4>
                    <p className="text-[10px] text-[#a7ceb6]">El asistente IA responde cualquier duda técnica o general</p>
                  </div>
                </div>
                <button
                  onClick={onOpenGemini}
                  className="w-full py-2 bg-[#2d7d50] hover:bg-[#34925e] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Asistente IA (Gemini)</span>
                </button>
              </div>
            )}
          </div>

          {/* Columna Derecha: Contenido Detallado del Capítulo Seleccionado */}
          <div className="lg:col-span-8 space-y-6">
            {/* CAPÍTULO 1 */}
            {activeChapterId === 'cap-1' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 1 · Fundamentos Zootécnicos e Institucionales
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Introducción al Establecimiento Pozo del Carril y la Unidad Porcina
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Módulo de Producción Didáctico-Experimental · Facultad de Ciencias Económicas y Facultad de Agronomía y Veterinaria (UNRC)
                  </p>
                </div>

                <div className="prose prose-xs max-w-none text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El establecimiento <strong>Pozo del Carril · La Aguada</strong> alberga la <em>Unidad C de Producción Porcina</em>, concebida bajo un doble propósito esencial: actuar como un modelo productivo comercial rentable y sostenible, y simultáneamente servir como aula a campo para estudiantes de grado y posgrado, pasantes e investigadores de la <strong>Universidad Nacional de Río Cuarto (UNRC)</strong>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1.5">
                      <h4 className="font-bold text-xs text-[#1c4b31] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                        <span>Misión Técnico-Productiva</span>
                      </h4>
                      <p className="text-[11px] text-[#4d6a57]">
                        Producir capones pesados para faena con excelente conformación carnicera y bajo porcentaje de grasa dorsal, logrando índices zootécnicos de excelencia (conversión alimenticia global ≤ 3.0 kg/kg y supervivencia al destete ≥ 85.8%).
                      </p>
                    </div>

                    <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1.5">
                      <h4 className="font-bold text-xs text-[#1c4b31] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#16a34a]" />
                        <span>Misión Académica y Extensión</span>
                      </h4>
                      <p className="text-[11px] text-[#4d6a57]">
                        Brindar a los estudiantes universitarios y colegios agrotécnicos acceso directo a registros económicos en tiempo real, trazabilidad sanitaria, formulación de dietas y costeo basado en actividades (ABC).
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">
                    Características del Sistema de Producción Semi-Intensivo a Campo
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#3b5947]">
                    <li><strong>Genética:</strong> Base materna F1 Landrace x Yorkshire, destacada por su prolificidad, instinto maternal y rusticidad para pastoreo y campo. Padrillos terminales Pietrain o Duroc Jersey para aportar masa muscular y vigor híbrido en terminación.</li>
                    <li><strong>Servicio y Reproducción:</strong> Monta natural dirigida en piquetes de servicio con rotación de padrillos y descanso reglamentario. Período de gestación medio de 114 días (3 meses, 3 semanas y 3 días).</li>
                    <li><strong>Maternidad y Cría:</strong> Arcos parideras a campo orientados contra vientos predominantes, con protección perimetral contra aplastamiento de lechones y provisión de cama de paja seca y limpia.</li>
                    <li><strong>Destete y Recría:</strong> Destete formal entre los 21 y 28 días de vida con peso meta entre 6.5 y 7.5 kg. Pase inmediato a pistas de destete y recría equipadas con tolvas de alimentación ad-libitum y chupetes con agua fresca.</li>
                    <li><strong>Terminación a Capón:</strong> Engorde continuo hasta alcanzar el peso de mercado (110 a 115 kg de peso vivo), momento en el que se despachan a plantas frigoríficas habilitadas por SENASA.</li>
                  </ul>
                </div>
              </article>
            )}

            {/* CAPÍTULO 2 */}
            {activeChapterId === 'cap-2' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 2 · Seguridad Operativa y Control Interno
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Estructura de Roles y Permisos (RBAC)
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Matriz de responsabilidades y segregación funcional para la integridad de los datos
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El sistema implementa un estricto <strong>Control de Acceso Basado en Roles (RBAC)</strong> para garantizar la confiabilidad contable y el cumplimiento de las normas de auditoría interna de la UNRC:
                  </p>

                  <div className="border border-[#dce6dc] rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f0f5f1] text-[#1c4b31] font-bold border-b border-[#dce6dc]">
                        <tr>
                          <th className="p-3">Rol / Rango</th>
                          <th className="p-3">Módulos Habilitados</th>
                          <th className="p-3">Operaciones Permitidas</th>
                          <th className="p-3">Cierres y Reaperturas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2ed]">
                        <tr className="hover:bg-[#f9fbf9]">
                          <td className="p-3">
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              ROL_ADMIN
                            </span>
                            <div className="text-[10px] text-[#557361] mt-0.5">Administrador General</div>
                          </td>
                          <td className="p-3">Acceso total a todos los módulos</td>
                          <td className="p-3">Crear, editar, confirmar, anular comprobantes, configurar metas de CMI y cargar manual oficial</td>
                          <td className="p-3 font-semibold text-emerald-700">Cierre y Reapertura de Períodos</td>
                        </tr>
                        <tr className="hover:bg-[#f9fbf9]">
                          <td className="p-3">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ROL_ENCARGADO
                            </span>
                            <div className="text-[10px] text-[#557361] mt-0.5">Encargado de Producción</div>
                          </td>
                          <td className="p-3">Producción, Alimentación, Compras, Ventas, Stock, Existencias, Presupuesto, Indicadores, Auditoría</td>
                          <td className="p-3">Gestión operativa plena, confirmación de compras y ventas, edición de metas del CMI</td>
                          <td className="p-3 font-semibold text-emerald-700">Cierre de período (No reapertura)</td>
                        </tr>
                        <tr className="hover:bg-[#f9fbf9]">
                          <td className="p-3">
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ROL_OPERARIO
                            </span>
                            <div className="text-[10px] text-[#557361] mt-0.5">Operario de Campo</div>
                          </td>
                          <td className="p-3">Panel General, Producción, Alimentación, Stock Físico</td>
                          <td className="p-3">Registro de eventos a campo (servicios, partos, pases, raciones). Guarda en estado <em>Borrador</em></td>
                          <td className="p-3 text-red-600 font-semibold">Sin acceso</td>
                        </tr>
                        <tr className="hover:bg-[#f9fbf9]">
                          <td className="p-3">
                            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              ROL_AUDITOR
                            </span>
                            <div className="text-[10px] text-[#557361] mt-0.5">Auditor / Consultor</div>
                          </td>
                          <td className="p-3">Todos los módulos operativos, económicos e indicadores</td>
                          <td className="p-3 font-semibold text-sky-800">Modo Solo Lectura estricto (verificación y trazabilidad)</td>
                          <td className="p-3 text-red-600 font-semibold">Sin acceso</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>
            )}

            {/* CAPÍTULO 3 */}
            {activeChapterId === 'cap-3' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 3 · Ergonomía y Personalización del Entorno
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Personalización y Reordenamiento de Pestañas a Gusto Propio
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Cómo adaptar la navegación, el orden de las hojas y la visualización económica
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <h4 className="text-sm font-bold text-[#143422]">
                    1. Reordenamiento Dinámico de Pestañas (Hojas del Sistema)
                  </h4>
                  <p>
                    Cada usuario del sistema puede ordenar las hojas de navegación según su frecuencia de uso o preferencia operativa. Por ejemplo, un operario de campo puede desear tener *Producción* y *Alimentación* en los primeros puestos, mientras que el encargado de administración puede ubicar *Indicadores* o *Presupuesto* arriba.
                  </p>

                  <div className="p-4 bg-[#f4f8f5] rounded-xl border border-[#dce7dd] space-y-2">
                    <h5 className="font-bold text-[#1b5e37] text-xs">Paso a paso para modificar el orden de las pestañas:</h5>
                    <ol className="list-decimal pl-5 space-y-1 text-[#3b5947]">
                      <li>Haz clic en el botón con ícono de deslizadores <strong>(Reordenar Pestañas)</strong> en la barra lateral o en la parte superior de esta pantalla.</li>
                      <li>Se desplegará la ventana modal de personalización con el listado de las 13 hojas del sistema.</li>
                      <li>Utiliza las flechas <strong>▲ (Subir)</strong> y <strong>▼ (Bajar)</strong> para reubicar cada elemento, o los botones de salto rápido al inicio/final.</li>
                      <li>Presiona <strong>«Guardar Orden»</strong>. El nuevo esquema se guarda en tu almacenamiento local y la barra lateral se actualiza al instante.</li>
                      <li>Si deseas volver al esquema original de fábrica en cualquier momento, presiona <strong>«Restablecer»</strong>.</li>
                    </ol>
                  </div>

                  <h4 className="text-sm font-bold text-[#143422] pt-3">
                    2. Conmutación Bimonetaria (ARS / USD)
                  </h4>
                  <p>
                    En el encabezado superior del sistema se encuentra el conmutador de divisa. Al activarlo, todos los valores monetarios de ventas, compras, costos de raciones, márgenes brutos y valuación VNR se convierten automáticamente utilizando el tipo de cambio oficial mayorista o de referencia ingresado en Configuración.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 4 */}
            {activeChapterId === 'cap-4' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 4 · Registro Zootécnico
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Módulo de Producción: Servicios, Partos, Destetes y Pases
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Control exhaustivo de la eficiencia biológica del plantel reproductor
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <h4 className="text-sm font-bold text-[#143422]">4.1. Servicios y Montas</h4>
                  <p>
                    Se registran los servicios dirigidos registrando: caravana de la hembra (madre), caravana o nombre del padrillo, lote de monta y fecha. El sistema calcula automáticamente la <strong>Fecha Probable de Parto (FPP = Fecha + 114 días)</strong> y genera una alerta visual 7 días antes de la fecha estimada para trasladar la cerda a su arco paridera limpio.
                  </p>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">4.2. Registro de Partos y Camada</h4>
                  <p>
                    Al producirse el parto se registran tres variables fundamentales para el balance de prolificidad:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[#3b5947]">
                    <li><strong>Lechones Nacidos Vivos (LNV):</strong> Base para el cálculo de productividad de la camada (meta: ≥ 11 LNV/parto).</li>
                    <li><strong>Lechones Nacidos Muertos (LNM):</strong> Distinguiendo mortinatos pre-parto de asfixias intra-parto.</li>
                    <li><strong>Lechones Momificados:</strong> Indicador clave de sanidad reproductiva (Parvovirus / PRRS).</li>
                  </ul>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">4.3. Destete y Supervivencia Lactante</h4>
                  <p>
                    Al cumplir el período de lactancia (21 a 28 días) se registra el destete ingresando cabezas y peso total de la camada. El sistema calcula automáticamente el <strong>Porcentaje de Supervivencia al Destete</strong>:
                  </p>
                  <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl font-mono text-[11px] text-[#1c4b31]">
                    Supervivencia Destete (%) = (Cabezas Destetadas / Nacidos Vivos) × 100 [Meta: ≥ 85.8%]
                  </div>
                </div>
              </article>
            )}

            {/* CAPÍTULO 5 */}
            {activeChapterId === 'cap-5' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 5 · Nutrición y Costo de Raciones
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Módulo de Alimentación y Conversión Alimenticia (ICA)
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Formulación de dietas por categoría y control del principal componente del costo directo
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    En la producción porcina semi-intensiva, la alimentación representa entre el <strong>65% y el 75% del costo directo total</strong>. El módulo permite registrar la fórmula de cada ración y los consumos diarios por lote.
                  </p>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">Raciones Estándar del Establecimiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl">
                      <div className="font-bold text-xs text-[#1c4b31]">Iniciador (Destete)</div>
                      <div className="text-[11px] text-[#557361] mt-1">6 kg a 15 kg</div>
                      <div className="text-[10px] text-[#789684] mt-2">Maíz molido fino, pellet de soja alta proteína y premezcla láctea.</div>
                    </div>
                    <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl">
                      <div className="font-bold text-xs text-[#1c4b31]">Crecimiento / Recría</div>
                      <div className="text-[11px] text-[#557361] mt-1">15 kg a 50 kg</div>
                      <div className="text-[10px] text-[#789684] mt-2">Maíz 65%, Pellet de soja 30%, Núcleo mineral 5%.</div>
                    </div>
                    <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl">
                      <div className="font-bold text-xs text-[#1c4b31]">Terminación</div>
                      <div className="text-[11px] text-[#557361] mt-1">50 kg a 115 kg</div>
                      <div className="text-[10px] text-[#789684] mt-2">Maíz 75%, Pellet de soja 22%, Premezcla 3%. Mayor energía neta.</div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">Cálculo del Índice de Conversión Alimenticia (ICA)</h4>
                  <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl font-mono text-[11px] text-[#1c4b31]">
                    ICA = Alimento Total Consumido (kg) / Ganancia Total de Peso Vivo (kg) [Meta Global: ≤ 3.0 kg/kg]
                  </div>
                </div>
              </article>
            )}

            {/* CAPÍTULO 7 */}
            {activeChapterId === 'cap-7' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 7 · Comercialización y Mercados
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Módulo de Ventas: Capones, Precios ROSPORC y Gastos de Comercialización
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Criterios comerciales, deducciones de flete y liquidación frigorífica
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    Las ventas de capones terminados se liquidan en base al <strong>precio de pizarra ROSPORC</strong> (Rosario Porcinos) de la Bolsa de Comercio de Rosario, ajustado por calidad y tipificación de res.
                  </p>

                  <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                    <h5 className="font-bold text-[#1c4b31] text-xs">Conceptos Clave de la Liquidación:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-[#3b5947]">
                      <li><strong>Precio Bruto de Venta ($/kg):</strong> Precio pactado en balanza de frigorífico o destino.</li>
                      <li><strong>Flete a Frigorífico:</strong> Costo del camión jaula por kilómetro o por animal trasladado.</li>
                      <li><strong>Valorización de Gastos de Comercialización:</strong> Gravámenes de SENASA (DTA), guías municipales de traslado, aranceles de pesaje y comisiones comerciales.</li>
                      <li><strong>Ingreso Neto en Granja:</strong> Precio Bruto − (Flete + Gastos de Comercialización).</li>
                    </ul>
                  </div>
                </div>
              </article>
            )}

            {/* CAPÍTULO 9 */}
            {activeChapterId === 'cap-9' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 9 · Valuación Contable y Cierre de Período
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Valuación de Existencias y Criterio VNR (Valor Neto de Realización)
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Normas contables profesionales aplicadas a activos biológicos porcinos (RT 22 FACPCE)
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    La valuación de las existencias porcinas se realiza siguiendo dos metodologías rigurosas según la categoría biológica:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#edf6f0] border border-[#bbf7d0] rounded-xl space-y-2">
                      <h4 className="font-bold text-xs text-[#15803d]">1. Capones a Faena: Criterio VNR</h4>
                      <p className="text-[11px] text-[#2c5339]">
                        Dado que los capones terminados poseen un mercado activo, transparente y fluido, se valúan al <strong>Valor Neto de Realización</strong>:
                      </p>
                      <div className="p-2.5 bg-white border border-[#bbf7d0] rounded-lg font-mono text-[11px] text-[#15803d]">
                        VNR = Precio ROSPORC − (Flete + Valorización gastos comercialización)
                      </div>
                      <p className="text-[10px] text-[#4d7059]">
                        Valuación Total = VNR Unitario ($/kg) × Kilos Totales en Stock
                      </p>
                    </div>

                    <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                      <h4 className="font-bold text-xs text-[#1c4b31]">2. Recría y Reproductores: Costo Acumulado</h4>
                      <p className="text-[11px] text-[#4d6a57]">
                        Para categorías en desarrollo sin mercado fluido inmediato (lechones, cachorras y cerdas madre), la valuación se determina por el <strong>Costo Acumulado de Producción</strong> (costo de raciones devengadas + sanidad + cuota de reposición).
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#143422] pt-2">Cierre de Período y Reapertura</h4>
                  <p>
                    Al finalizar cada mes o campaña, el usuario con rango <strong>Encargado</strong> o <strong>Administrador</strong> ejecuta el <em>Cierre de Período</em>. Esto congela las existencias físicas y monetarias para evitar adulteraciones posteriores. La reapertura excepcional queda restringida exclusivamente al <strong>Administrador General</strong>, dejando registro inmutable en auditoría.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 12: CUADRO DE MANDO INTEGRAL (CMI) COMPLETO */}
            {activeChapterId === 'cap-12' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 12 · Cuadro de Mando Integral (CMI)
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Arquitectura, Funcionamiento y Totalidad de Indicadores del CMI Porcino
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Guía metodológica integral: mapa causa-efecto, semaforización dinámica, priorización y compendio de los 24 indicadores estratégicos
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-6">
                  {/* 1. FUNDAMENTOS Y ENFOQUE DEL CMI */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#1b5e37]" />
                      <span>1. Fundamentos del Cuadro de Mando Integral en la Unidad Porcina</span>
                    </h4>
                    <p>
                      El <strong>Cuadro de Mando Integral (CMI)</strong> de la Unidad C de Producción Porcina (Establecimiento <em>Pozo del Carril · La Aguada</em>, Facultad de Ciencias Económicas y Facultad de Agronomía y Veterinaria - UNRC) es el instrumento de gestión estratégica que traduce la doble misión del establecimiento —<strong>productiva/rentable</strong> y <strong>didáctica/universitaria</strong>— en un conjunto balanceado y coherente de objetivos, indicadores cuantitativos y metas operativas.
                    </p>
                    <p>
                      A diferencia de los sistemas tradicionales basados únicamente en estados financieros históricos, el CMI porcino articula los factores críticos de éxito biológicos, zootécnicos y pedagógicos con la viabilidad económica en tiempo real.
                    </p>

                    {/* Cadena Causa-Efecto */}
                    <div className="p-4 bg-linear-to-r from-[#0d2818] via-[#143b23] to-[#1c4b31] text-white rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-white/20 pb-2">
                        <span className="text-xs font-bold text-[#7ee7a9] uppercase tracking-wider">
                          Mapa Causal de Valor Porcino (Lógica de Causa-Efecto)
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                          Cadena Estratégica Integrada
                        </span>
                      </div>
                      <p className="text-[11px] text-[#c2dfcc] leading-relaxed">
                        Cada perspectiva sostiene a la superior en una relación rigurosa de causa y efecto:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 space-y-1">
                          <span className="text-[10px] font-bold text-[#a7f3d0] block">1. APRENDIZAJE (A)</span>
                          <span className="text-[11px] font-medium text-white block">Capacitación, registros completos en 48 hs y extensión a campo</span>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 space-y-1">
                          <span className="text-[10px] font-bold text-[#a7f3d0] block">2. PROCESOS (P)</span>
                          <span className="text-[11px] font-medium text-white block">Eficiencia zootécnica: ICA ≤ 3.0, supervivencia destete ≥ 88% y GDP</span>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 space-y-1">
                          <span className="text-[10px] font-bold text-[#a7f3d0] block">3. CLIENTES (C)</span>
                          <span className="text-[11px] font-medium text-white block">Capones en peso óptimo 90-105 kg, cero bajas en viaje y puntualidad</span>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 space-y-1">
                          <span className="text-[10px] font-bold text-[#a7f3d0] block">4. FINANCIERA (F)</span>
                          <span className="text-[11px] font-medium text-white block">Margen s/ ventas ≥ 30%, reducción costo/kg vivo y valor agregado</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 2. LAS 4 PERSPECTIVAS ESTRATÉGICAS */}
                  <section className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1b5e37]" />
                      <span>2. Las Cuatro Perspectivas del CMI Porcino</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#1c4b31]">
                          <DollarSign className="w-4 h-4 text-[#15803d]" />
                          <h5 className="font-bold text-xs uppercase tracking-wide">Perspectiva Financiera (7 Indicadores: F1 a F7)</h5>
                        </div>
                        <p className="text-[11px] text-[#4d6a57]">
                          Monitorea la salud económica, la rentabilidad neta por capón comercializado, la agregación de valor de la fase de engorde vs. recría, el costo por kilo producido y la incidencia porcentual del costo de alimentación sobre los costos operativos totales.
                        </p>
                      </div>

                      <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#1c4b31]">
                          <Users className="w-4 h-4 text-[#2563eb]" />
                          <h5 className="font-bold text-xs uppercase tracking-wide">Perspectiva Clientes y Mercado (5 Indicadores: C1 a C5)</h5>
                        </div>
                        <p className="text-[11px] text-[#4d6a57]">
                          Evalúa la calidad comercial del producto en destino (frigorífico), la homogeneidad de los lotes despachados (capones en peso óptimo 90-105 kg), el bienestar animal y mortalidad durante el transporte en camión jaula, la puntualidad logística y el plazo de cobranza.
                        </p>
                      </div>

                      <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#1c4b31]">
                          <LineChart className="w-4 h-4 text-[#d97706]" />
                          <h5 className="font-bold text-xs uppercase tracking-wide">Perspectiva Procesos Internos (7 Indicadores: P1 a P7)</h5>
                        </div>
                        <p className="text-[11px] text-[#4d6a57]">
                          El núcleo biológico-zootécnico: conversión alimenticia (ICA), supervivencia al destete en parideras a campo, prolificidad anual (lechones y partos por madre por año), duración del ciclo de vida y la Ganancia Media Diaria (GDP) desagregada en sus tres subfases (Cría P7.1, Recría P7.2 y Terminación P7.3).
                        </p>
                      </div>

                      <div className="p-4 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[#1c4b31]">
                          <GraduationCap className="w-4 h-4 text-[#7c3aed]" />
                          <h5 className="font-bold text-xs uppercase tracking-wide">Perspectiva Aprendizaje y Crecimiento (5 Indicadores: A1 a A5)</h5>
                        </div>
                        <p className="text-[11px] text-[#4d6a57]">
                          Sostiene la capacidad operativa y la función universitaria: completitud de registros de campo sin omisiones, tasa de errores/duplicados detectados por auditoría, puntualidad de carga en menos de 48 horas, horas de capacitación y la realización efectiva de visitas estudiantiles y de extensión.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 3. CATÁLOGO COMPLETO DE LOS 24 INDICADORES */}
                  <section className="space-y-4 pt-3">
                    <div className="border-b border-[#e2ece2] pb-2">
                      <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#1b5e37]" />
                        <span>3. Catálogo Exhaustivo de los 24 Indicadores del CMI</span>
                      </h4>
                      <p className="text-[11px] text-[#557361] mt-0.5">
                        Definición conceptual, fórmula de cálculo, unidad de medida, meta oficial y acción ante desvíos para cada uno de los 24 indicadores del sistema:
                      </p>
                    </div>

                    {/* BLOQUE A: PERSPECTIVA FINANCIERA (F1 - F7) */}
                    <div className="border border-[#cce0d2] rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#1c4b31] text-white px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Perspectiva Financiera (F1 a F7)</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          7 Indicadores
                        </span>
                      </div>
                      <div className="p-3 divide-y divide-[#eef4ef] space-y-2 bg-[#fcfdfc]">
                        {/* F1 */}
                        <div className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F1 · Margen sobre Ventas de Capones
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: ≥ 30% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>((Ingresos por Venta de Capones − Costos Directos Incurridos) / Ingresos por Ventas) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Desagregar por precio de venta obtenido en balanza, costo de raciones formuladas, mortandad en terminación y deducciones de flete.
                          </p>
                        </div>

                        {/* F2 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F2 · Resultado Incremental de Fase 3 (Engorde)
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: ≥ $0 · Regla Cero
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Ingreso Neto por Venta de Capón − (Valor de Mercado del Cachorro al Ingreso a Engorde + Costo de Alimento y Sanidad de Fase 3)</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Evalúa si engordar agrega valor económico respecto a comercializar cachorros. Si es negativo, revisar urgente el ICA de terminación o acortar el peso de salida.
                          </p>
                        </div>

                        {/* F3 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F3 · Costo por Kilogramo Vivo Producido
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: Reducción 5% s/ Base Real · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Costo Total Operativo del Período / Kilos Vivos Totales Ganados por la Piara ($/kg)</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Auditar compras de maíz y pellet de soja, analizar desperdicio en tolvas y evaluar el costo sanitario por cabeza.
                          </p>
                        </div>

                        {/* F4 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F4 · Participación de Alimentación en Costo Total
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: ≤ 75% · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Costo Devengado de Alimento Consumido / Costo Total Operativo) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Si supera el 75%, investigar pérdidas en tolvas, calibrar comederos y balancear la inclusión de grano propio cosechado en el campo.
                          </p>
                        </div>

                        {/* F5 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F5 · Desvío Presupuestario
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: [-5%, +5%] · Intervalo Tolerancia
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>((Costos Reales Totales − Costos Presupuestados) / Costos Presupuestados) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Analizar partidas sobre-ejecutadas (sanidad, fletes o mantenimiento de parideras) y revisar supuestos en el módulo Presupuestos.
                          </p>
                        </div>

                        {/* F6 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F6 · Cobertura del Precio de Equilibrio del Capón
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: ≥ 100% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Precio Promedio de Venta Neto Obtenido / Precio de Equilibrio Total por Kilo) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Revela si el precio cobrado cubre la totalidad de costos fijos y variables. Si es menor a 100%, ajustar momento de venta o reducir estructura.
                          </p>
                        </div>

                        {/* F7 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              F7 · Resultado Neto por Capón Vendido
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Meta: Configurable ($/cab) · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Resultado Operativo Total del Lote / Cantidad de Capones Vendidos</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Comparar rentabilidad unitaria entre diferentes lotes y estaciones climáticas.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE B: PERSPECTIVA CLIENTES Y MERCADO (C1 - C5) */}
                    <div className="border border-[#cce0d2] rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#1e40af] text-white px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Perspectiva Clientes y Destinatarios (C1 a C5)</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          5 Indicadores
                        </span>
                      </div>
                      <div className="p-3 divide-y divide-[#eef4ef] space-y-2 bg-[#fcfdfc]">
                        {/* C1 */}
                        <div className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              C1 · Capones Vendidos dentro del Peso Óptimo
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Meta: ≥ 95% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Capones despachados entre 90 kg y 105 kg / Total Capones Vendidos) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Animales fuera de rango sufren castigo en frigorífico (grasa dorsal excesiva o bajo rendimiento al gancho). Calibrar pesajes de control en granja.
                          </p>
                        </div>

                        {/* C2 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              C2 · Mortalidad en Transporte (Muertos a la Llegada)
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Meta: 0% (tolerancia ≤ 0,5%) · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Capones Muertos en Viaje / Capones Cargados en Camión Jaula) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Afecta bienestar animal, reputación y costos. Verificar ayuno previo (8-12 hs), densidad de carga por piso en la jaula, horario de viaje (evitar horas de calor) y pericia del transportista.
                          </p>
                        </div>

                        {/* C3 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              C3 · Entregas Realizadas en Fecha
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Meta: ≥ 95% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Despachos cumplidos en la fecha acordada / Total de Despachos Programados) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Revisar disponibilidad de fletes, emisión previa de DTe y estado de caminos rurales en días de lluvia.
                          </p>
                        </div>

                        {/* C4 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              C4 · Reclamos o Rechazos Comerciales
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Meta: ≤ 2% · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Operaciones con Reclamos Formales o Decomisos / Total Operaciones de Venta) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Analizar causas de decomiso en playa de faena (abscesos por inyección, hematomas por arreo o lesiones dérmicas).
                          </p>
                        </div>

                        {/* C5 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              C5 · Plazo Promedio de Cobranza
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Meta: ≤ 30 días · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Días transcurridos promedio desde la entrega del lote hasta la acreditación bancaria efectiva</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Exigir cumplimiento de plazos comerciales a los frigoríficos y suspender despachos a clientes morosos.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE C: PERSPECTIVA PROCESOS INTERNOS (P1 - P7 Y SUBFASES) */}
                    <div className="border border-[#cce0d2] rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#b45309] text-white px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          <LineChart className="w-4 h-4" />
                          <span>Perspectiva Procesos Internos (P1 a P7 y Subfases P7.1, P7.2, P7.3)</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          7 Indicadores + 3 Subfases
                        </span>
                      </div>
                      <div className="p-3 divide-y divide-[#eef4ef] space-y-2 bg-[#fcfdfc]">
                        {/* P1 */}
                        <div className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P1 · ICA de Engorde (Índice de Conversión Alimenticia)
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≤ 3,0 kg/kg · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Kg de Alimento Consumido en Terminación / Kg de Peso Vivo Ganados en la Fase</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Es el mayor determinante del costo por kilo. Revisar granulometría del maíz molido, balance aminoacídico, presencia de micotoxinas, desperdicio en comederos y sanidad respiratoria/digestiva.
                          </p>
                        </div>

                        {/* P2 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P2 · Supervivencia al Destete
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≥ 88% (base histórica ≥ 85,8%) · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Total Lechones Destetados / Total Nacidos Vivos) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> En maternidad a campo, investigar causas de aplastamiento en arcos refugio, aislamiento térmico de camas de paja, suministro de calostro y peso al nacer.
                          </p>
                        </div>

                        {/* P3 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P3 · Lechones Destetados por Madre por Año
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≥ 21 lech/madre/año · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Total Lechones Destetados en el Período / Promedio de Madres en Producción en el Período</code> (anualizado).
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Revela la eficiencia biológica reproductiva global. Analizar si la merma proviene de camadas pequeñas al nacer o de baja supervivencia lactante.
                          </p>
                        </div>

                        {/* P4 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P4 · Partos por Madre por Año
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≥ 2,1 partos/madre/año · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Total de Partos Registrados / Cerdas Reproductoras Activas</code> (ajustado por 365 días).
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Auditar días no productivos (DNP), detección temprana de celos de retorno a los 21 días y fertilidad de los padrillos.
                          </p>
                        </div>

                        {/* P5 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P5 · Mortalidad por Fase
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≤ 5% global · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Muertes Ocurridas en la Fase / Cabezas Ingresadas al Inicio de la Fase) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Diferenciar mortandad en recría vs. terminación. Consultar al médico veterinario y revisar plan profiláctico y vacunas.
                          </p>
                        </div>

                        {/* P6 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P6 · Duración del Ciclo Productivo
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              Meta: ≤ 165 días (nacimiento a venta) · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Fecha de Venta del Lote − Fecha Media de Parto de la Camada</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Si supera los 165 días, los animales están creciendo lento, ocupando pistas por más tiempo e incrementando el costo fijo por animal.
                          </p>
                        </div>

                        {/* P7 Y SUBFASES */}
                        <div className="pt-2 space-y-2 bg-[#fdfaf5] p-2.5 rounded-lg border border-[#f3e3ce]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              P7 · Ganancia Media Diaria (GDP) Global y por Subfases
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                              Global: ≥ 0,65 kg/día · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            El sistema calcula y permite gestionar las metas de manera independiente para cada subfase zootécnica:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="p-2 bg-white rounded-lg border border-[#e8d8c4] space-y-0.5">
                              <span className="font-bold text-[#854d0e] block">P7.1 Cría / Lactancia</span>
                              <span>Meta: <strong>≥ 0,23 kg/día</strong> (28 días)</span>
                              <p className="text-[10px] text-[#6e5843]">Desde ~1,4 kg al nacer hasta ~7,5 kg al destete.</p>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#e8d8c4] space-y-0.5">
                              <span className="font-bold text-[#854d0e] block">P7.2 Destete / Recría</span>
                              <span>Meta: <strong>≥ 0,40 kg/día</strong> (60 días)</span>
                              <p className="text-[10px] text-[#6e5843]">Pista techada: de 7,5 kg a ~31,5 kg con ración iniciadora.</p>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#e8d8c4] space-y-0.5">
                              <span className="font-bold text-[#854d0e] block">P7.3 Engorde / Terminación</span>
                              <span>Meta: <strong>≥ 0,65 kg/día</strong> (90 días)</span>
                              <p className="text-[10px] text-[#6e5843]">Piquete a campo: de 31,5 kg a 110-115 kg de venta.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE D: PERSPECTIVA APRENDIZAJE Y DESARROLLO (A1 - A5) */}
                    <div className="border border-[#cce0d2] rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#6d28d9] text-white px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>Perspectiva Aprendizaje y Crecimiento (A1 a A5)</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          5 Indicadores
                        </span>
                      </div>
                      <div className="p-3 divide-y divide-[#eef4ef] space-y-2 bg-[#fcfdfc]">
                        {/* A1 */}
                        <div className="pt-2 first:pt-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              A1 · Registros Completos
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Meta: ≥ 98% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Registros con todos los campos obligatorios completos sin omisiones / Total de Registros) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Verificar partes diarios de partos, caravanas de madres y pesajes omitidos en el módulo Producción.
                          </p>
                        </div>

                        {/* A2 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              A2 · Registros con Errores o Duplicados
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Meta: &lt; 1% · Menor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Registros marcados como "Observados" o Duplicados / Total de Registros Auditados) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Consultar el módulo de Auditoría, subsanar discordancias de caravana y capacitar al operario en carga unívoca.
                          </p>
                        </div>

                        {/* A3 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              A3 · Movimientos Cargados dentro de 48 Horas
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Meta: ≥ 95% · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>(Eventos de campo digitados dentro de las 48 hs de ocurridos / Total de Eventos) × 100</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> La oportunidad temporal evita pérdida de información y asegura que los indicadores reflejen el estado zootécnico real.
                          </p>
                        </div>

                        {/* A4 */}
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs">
                              A4 · Horas de Capacitación por Responsable
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Meta: ≥ 12 hs/persona/año · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fórmula:</strong> <code>Total de horas de capacitación técnica, sanitaria y de software recibidas / Personal Activo</code>.
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Programar talleres prácticos de bioseguridad porcina, arcos parideras, formulación de dietas y uso de este sistema.
                          </p>
                        </div>

                        {/* A5 */}
                        <div className="pt-2 space-y-1 bg-[#fbf8ff] p-2.5 rounded-lg border border-[#e9d5ff]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#143422] text-xs flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                              <span>A5 · Visitas Estudiantiles a Porcinos</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                              Meta: ≥ 4 visitas/año · Mayor es mejor
                            </span>
                          </div>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Definición estricta:</strong> Mide el número de visitas estudiantiles <em>EFECTIVAMENTE REALIZADAS</em> a la unidad porcina dentro del período seleccionado, computando cada visita una única vez.
                          </p>
                          <p className="text-[11px] text-[#425e4d]">
                            <strong>Fuente y carga:</strong> No proviene de una carga numérica manual arbitraria, sino exclusivamente del registro de visitas formales en el modal <strong>«Gestionar Visitas»</strong> (institución, cátedra, alumnos, fecha y estado <em>Realizada</em>).
                          </p>
                          <p className="text-[11px] text-[#557361]">
                            <em>Acción ante desvío:</em> Refuerza la misión de aula a campo y extensión de la UNRC. Si está rezagada, coordinar calendarios con docentes de Ciencias Económicas y Agronomía/Veterinaria.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. REGLAS DE SEMAFORIZACIÓN */}
                  <section className="space-y-3 pt-3">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#1b5e37]" />
                      <span>4. Reglas de Semáforos, Direcciones y Ponderación Temporal</span>
                    </h4>
                    <p>
                      El motor de cálculo del CMI evalúa cada indicador comparando el resultado real con la meta configurada según cuatro tipos de dirección matemática:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl space-y-1">
                        <span className="font-bold text-[#166534] block">Mayor es Mejor</span>
                        <p className="text-[10px] text-[#14532d]">
                          🟢 Verde: ≥ 100% de la meta<br />
                          🟡 Amarillo: entre 90% y 99.9%<br />
                          🔴 Rojo: &lt; 90% de la meta
                        </p>
                      </div>

                      <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl space-y-1">
                        <span className="font-bold text-[#991b1b] block">Menor es Mejor</span>
                        <p className="text-[10px] text-[#7f1d1d]">
                          🟢 Verde: ≤ 100% de la meta<br />
                          🟡 Amarillo: entre 100.1% y 110%<br />
                          🔴 Rojo: &gt; 110% de la meta
                        </p>
                      </div>

                      <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl space-y-1">
                        <span className="font-bold text-[#1e40af] block">Regla Cero (≥ $0)</span>
                        <p className="text-[10px] text-[#1e3a8a]">
                          🟢 Verde: Resultado ≥ $0<br />
                          🟡 Amarillo: Entre -$1 y -$5.000<br />
                          🔴 Rojo: Menor a -$5.000
                        </p>
                      </div>

                      <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl space-y-1">
                        <span className="font-bold text-[#92400e] block">Intervalo (F5 Desvíos)</span>
                        <p className="text-[10px] text-[#78350f]">
                          🟢 Verde: Dentro de [-5%, +5%]<br />
                          🟡 Amarillo: [-8%, -5%) o (+5%, +8%]<br />
                          🔴 Rojo: Desvío superior al 8%
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#edf6f0] border border-[#bbf7d0] rounded-xl text-[11px] text-[#245435] space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-[#15803d]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ponderación Pro-Rata en Metas Anuales en Curso</span>
                      </span>
                      <p>
                        Para metas con período anual (como <em>A5 Visitas Estudiantiles</em> o <em>A4 Capacitación</em>), el sistema no exige el 100% desde el primer mes. Aplica una ponderación temporal acumulada según los meses transcurridos de la campaña, evitando marcar falsos rojos al inicio del ciclo productivo.
                      </p>
                    </div>
                  </section>

                  {/* 5. SELECCIÓN DE PRIORITARIOS Y METAS CONFIGURABLES */}
                  <section className="space-y-3 pt-3">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#eab308]" />
                      <span>5. Personalización: «Mis Indicadores Prioritarios» y Configuración</span>
                    </h4>
                    <p>
                      Para evitar la sobrecarga informativa y permitir que cada perfil se enfoque en lo relevante para su función:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-[#3b5947]">
                      <li>
                        <strong>Marcado Dinámico con Estrella (⭐):</strong> Cada usuario puede hacer clic en la estrella de cualquier tarjeta de indicador. Los indicadores seleccionados se agrupan en la sección superior <em>«Mis Indicadores Prioritarios»</em> y quedan guardados en su perfil local.
                      </li>
                      <li>
                        <strong>Perfiles Sugeridos:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-[11px]">
                          <li><em>Operario de Campo:</em> P1 (ICA), P2 (Supervivencia Destete), P7 (GDP) y A3 (Carga en 48 hs).</li>
                          <li><em>Encargado de Producción:</em> F2 (Resultado Engorde), C1 (Peso Óptimo), C2 (Transporte), P3 (Lechones/Madre) y P6 (Duración Ciclo).</li>
                          <li><em>Administración / Auditoría:</em> F1 (Margen), F3 (Costo/kg), F4 (Alimentación), C5 (Cobranza), A1 (Completitud) y A5 (Visitas).</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Edición de Metas:</strong> Los usuarios con rol <strong>Encargado</strong> o <strong>Administrador</strong> pueden modificar el valor de las metas mediante el botón <strong>«Configurar Metas»</strong>, registrando el motivo de ajuste para auditoría interna.
                      </li>
                    </ul>
                  </section>

                  {/* 6. PROTOCOLO ANTE DESVÍOS */}
                  <section className="space-y-2 pt-3 border-t border-[#e2ece2]">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                      <span>6. Protocolo de Gestión Operativa ante Desvíos</span>
                    </h4>
                    <p>
                      Cuando un indicador pasa a semáforo <strong>Amarillo</strong> o <strong>Rojo</strong>, el sistema alerta en el <strong>Almacén de Notificaciones</strong> y el protocolo establece:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-[#3b5947]">
                      <li><strong>Diagnóstico de Causa Raíz:</strong> Leer la recomendación en la tarjeta del indicador o consultar al <em>Asistente IA (Gemini)</em> para cruzar datos de tolvas, partos o compras.</li>
                      <li><strong>Inspección a Campo:</strong> Verificar comederos, bebederos, camas de paja en arcos o báscula de pesaje según corresponda.</li>
                      <li><strong>Acción Correctiva:</strong> Ajustar la formulación de raciones, reprogramar el transporte o reforzar la sanidad.</li>
                      <li><strong>Monitoreo y Cierre:</strong> Comprobar la recuperación del indicador en el siguiente pesaje o ciclo y registrar las observaciones en el cierre mensual.</li>
                    </ol>
                  </section>
                </div>
              </article>
            )}

            {/* CAPÍTULO 6: COMPRAS */}
            {activeChapterId === 'cap-6' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 6 · Aprovisionamiento
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Compras e Insumos Agropecuarios
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Control de adquisiciones de granos, concentrados, núcleos minerales y productos veterinarios
                  </p>
                </div>
                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El módulo de <strong>Compras</strong> permite registrar todas las adquisiciones de insumos críticos para la unidad porcina (maíz, pellet de soja, complejos vitamínicos y medicamentos). Cada registro incluye proveedor, fecha, cantidad, costo unitario y estado de validación.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[#3b5947]">
                    <li><strong>Impacto en Costos:</strong> Los precios ingresados alimentan el costo de las raciones y la valuación de existencias.</li>
                    <li><strong>Validación:</strong> Los registros ingresados por operarios quedan en borrador hasta la confirmación definitiva por el Encargado.</li>
                  </ul>
                </div>
              </article>
            )}

            {/* CAPÍTULO 8: STOCK */}
            {activeChapterId === 'cap-8' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 8 · Inventario Físico
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Stock Físico y Balance de Masas
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Control de existencias de animales por categoría, altas, bajas y transferencias entre etapas
                  </p>
                </div>
                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El módulo de <strong>Stock</strong> realiza el seguimiento permanente del número de cabezas y kilogramos vivos en cada categoría zootécnica (reproductoras, lechones, recría y capones).
                  </p>
                  <p>
                    <strong>Balance de Masas:</strong> Stock Inicial + Altas (nacimientos, compras, pases de etapa) − Bajas (ventas, mortandad, transferencias) = Stock Final.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 10: PRESUPUESTO */}
            {activeChapterId === 'cap-10' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 10 · Planificación Económica
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Presupuestos y Análisis de Desvíos
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Proyección de ingresos, costos directos y análisis de desvíos presupuestarios mensuales
                  </p>
                </div>
                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    Permite planificar el presupuesto económico y financiero a 12 meses de la unidad porcina, comparando los valores estimados con la ejecución real para detectar desvíos en consumos de alimento o precios de venta.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 11: HISTÓRICO */}
            {activeChapterId === 'cap-11' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 11 · Análisis Plurianual
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Histórico Económico y Tendencias
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Evolución plurianual de márgenes brutos y costos de producción por kilogramo vivo
                  </p>
                </div>
                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    Módulo destinado a evaluar la evolución histórica de la rentabilidad del establecimiento a lo largo de sucesivas campañas productivas.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 13: ADMINISTRACIÓN DE USUARIOS, CLIENTES Y PROVEEDORES */}
            {activeChapterId === 'cap-usuarios' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 13 · Administración Centralizada
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Administración de Usuarios, Clientes y Proveedores
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Control de accesos y roles, catálogos maestros integrados y sincronización automática con Google Sheets
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-6">
                  {/* 1. OBJETIVO Y ACCESO EXCLUSIVO */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1b5e37]" />
                      <span>1. Acceso y Autorización Exclusiva del Módulo</span>
                    </h4>
                    <p>
                      El módulo <strong>USUARIOS</strong> está situado en el panel lateral izquierdo del sistema y ha sido concebido para centralizar el gobierno de accesos, credenciales de seguridad y la gestión de los catálogos maestros de clientes y proveedores del <strong>Establecimiento Pozo del Carril · La Aguada (UNRC)</strong>.
                    </p>
                    <div className="p-3.5 bg-[#fbf5ee] border border-[#f3dfc8] rounded-xl text-[#784615] space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-[#8c4f14]">
                        <AlertTriangle className="w-4 h-4" />
                        Regla de Seguridad Estricta (RBAC):
                      </span>
                      <p className="text-[11px]">
                        Esta opción es visible y accesible <strong>exclusivamente para usuarios con rango operativo de Administrador General (ROL_ADMIN)</strong>. Los usuarios con rangos de Encargado, Operario o Auditor no visualizan este módulo en el menú ni pueden ingresar mediante enlaces directos; el sistema valida la identidad en cada operación e intercepta accesos no autorizados redirigiendo al panel inicial.
                      </p>
                    </div>
                  </section>

                  {/* 2. GESTIÓN DE USUARIOS */}
                  <section className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1b5e37]" />
                      <span>2. Administración de Usuarios del Sistema</span>
                    </h4>
                    <p>
                      Desde la subpestaña <strong>«Gestión de Usuarios»</strong>, el Administrador tiene control total sobre las cuentas operativas del establecimiento:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1.5">
                        <span className="font-bold text-[#183925] block text-xs">A. Creación de un Nuevo Usuario</span>
                        <ol className="list-decimal pl-4 space-y-1 text-[#436150]">
                          <li>Haga clic en el botón superior <strong>«+ Nuevo Usuario»</strong>.</li>
                          <li>Ingrese el <strong>Nombre de Usuario</strong> (ej. <code>mario.garcia</code>, sin espacios).</li>
                          <li>Complete el <strong>Nombre y Apellido</strong> del responsable.</li>
                          <li>Seleccione el <strong>Rango Operativo</strong> correspondiente al perfil de trabajo.</li>
                          <li>El sistema generará automáticamente una <strong>Contraseña Inicial Segura</strong> sugerida, o podrá ingresar una clave personalizada (mínimo 6 caracteres).</li>
                          <li>Presione <strong>«Crear Usuario»</strong> para confirmar y registrar en Google Sheets.</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1.5">
                        <span className="font-bold text-[#183925] block text-xs">B. Asignación Automática de Rangos</span>
                        <p className="text-[#436150]">
                          Al ingresar al sistema por la pantalla de login, el usuario digita únicamente su identificador y contraseña. <strong>No existe ningún selector manual de rango para el usuario:</strong> el sistema identifica su cuenta y le asigna automáticamente sus permisos predefinidos:
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[#436150]">
                          <li><strong>Administrador:</strong> Acceso irrestricto, configuración y usuarios.</li>
                          <li><strong>Encargado:</strong> Carga y confirmación comercial, cierres y CMI.</li>
                          <li><strong>Operario:</strong> Carga de partos, pases y raciones en borrador.</li>
                          <li><strong>Auditor:</strong> Modo solo lectura y bitácora de trazabilidad.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Seguridad y Hash de Contraseñas */}
                    <div className="p-4 bg-[#f3f9f4] border border-[#cbe3d0] rounded-xl space-y-2">
                      <span className="font-bold text-[#154627] text-xs flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-[#1b5e37]" />
                        Mecanismo Criptográfico y Seguridad de Contraseñas
                      </span>
                      <p className="text-[11px] text-[#345340]">
                        El sistema implementa los estándares más rigurosos de protección de credenciales:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#345340]">
                        <li>
                          <strong>Sin texto plano en Google Sheets:</strong> Las contraseñas se procesan mediante algoritmo hash <strong>SHA-256</strong> con sal de seguridad antes de persistir. La hoja de Google Sheets almacena únicamente los atributos administrativos no sensibles (identificador, nombre, rol, estado y fecha de acceso).
                        </li>
                        <li>
                          <strong>Protección en Interfaz:</strong> En los listados de usuarios, las contraseñas se enmascaran visualmente como <code>•••••••• (SHA-256)</code>. Ningún usuario ni administrador puede consultar la contraseña actual de otro integrante.
                        </li>
                        <li>
                          <strong>Restablecimiento de Contraseñas:</strong> Mediante el icono de llave en la fila del usuario, el administrador puede generar una nueva contraseña temporal segura para entregársela al operador ante olvidos o extravíos.
                        </li>
                        <li>
                          <strong>Activación y Desactivación:</strong> Con el botón de estado se puede suspender temporalmente el acceso de un operario sin eliminar su historial ni romper la autoría de sus movimientos zootécnicos previos.
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* 3. GESTIÓN DE CLIENTES */}
                  <section className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1b5e37]" />
                      <span>3. Administración de Clientes y Desplegables de Ventas</span>
                    </h4>
                    <p>
                      En la subpestaña <strong>«Gestión de Clientes»</strong> se administran los frigoríficos, matarifes y compradores de capones o lechones de la unidad productiva:
                    </p>
                    <div className="space-y-2 text-[11px] text-[#3a5845]">
                      <p>
                        <strong>Campos Relevados:</strong> Identificador único (ej. <code>CLI_FRIGORIFICO_REGIONAL</code>), Razón Social o Nombre Comercial, CUIT oficial, Condición ante el IVA, Localidad, Provincia, Teléfono, Correo Electrónico, Condiciones de Pago pactadas y Observaciones.
                      </p>
                      <p>
                        <strong>Actualización Dinámica de Desplegables:</strong> Cada vez que se registra o modifica un cliente en esta sección:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1 text-[#3a5845]">
                        <li>El registro se valida e impacta automáticamente en la hoja <strong>Clientes</strong> de Google Sheets.</li>
                        <li>El catálogo maestro local se actualiza en memoria sin necesidad de recargar la página.</li>
                        <li>Al dirigirse al módulo <strong>Ventas</strong> e iniciar una nueva venta de capones a faena, el nuevo cliente aparece de forma inmediata en la lista desplegable <strong>«Cliente / Frigorífico»</strong>, ordenado alfabéticamente.</li>
                        <li><strong>Regla de Clientes Inactivos:</strong> Si un cliente es marcado como inactivo, deja de ofrecerse para nuevas operaciones comerciales, pero sus liquidaciones y ventas históricas conservan íntegramente su nombre y CUIT en los reportes económicos.</li>
                      </ol>
                    </div>
                  </section>

                  {/* 4. GESTIÓN DE PROVEEDORES */}
                  <section className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#1b5e37]" />
                      <span>4. Administración de Proveedores y Desplegables de Compras</span>
                    </h4>
                    <p>
                      En la subpestaña <strong>«Gestión de Proveedores»</strong> se registran los proveedores de maíz, pellet de soja, núcleos vitamínicos, insumos sanitarios y servicios:
                    </p>
                    <div className="space-y-2 text-[11px] text-[#3a5845]">
                      <p>
                        <strong>Campos Relevados:</strong> Razón Social, CUIT, Rubro de Suministro (Granos, Proteicos, Sanidad, Genética, Mantenimiento, Fletes), Localidad, Teléfono, Correo y Condiciones Comerciales de Pago.
                      </p>
                      <p>
                        <strong>Integración con Compras y Raciones:</strong> Al crear un nuevo proveedor, este queda automáticamente habilitado en los desplegables de comprobantes de compra (Facturas A, B, remitos) y en la imputación de costos directos de alimentación.
                      </p>
                      <p>
                        <strong>Conservación Histórica:</strong> Los proveedores asociados a compras históricas nunca se eliminan físicamente; únicamente se desactivan si cesa la relación comercial.
                      </p>
                    </div>
                  </section>

                  {/* 5. INTEGRACIÓN CON GOOGLE SHEETS */}
                  <section className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#1b5e37]" />
                      <span>5. Integración Centralizada con Google Sheets & Tolerancia a Fallos</span>
                    </h4>
                    <p>
                      Google Sheets actúa como la fuente de verdad y repositorio centralizado de datos del establecimiento. El flujo de persistencia garantiza máxima fiabilidad:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="p-3 bg-[#f8faf8] border border-[#dbe6dc] rounded-xl space-y-1">
                        <span className="font-bold text-[#183925] block">1. Validación y Confirmación</span>
                        <p className="text-[#436150]">
                          El sistema valida formato de CUIT, unicidad de usuarios y campos requeridos antes de emitir cualquier petición de guardado.
                        </p>
                      </div>

                      <div className="p-3 bg-[#f8faf8] border border-[#dbe6dc] rounded-xl space-y-1">
                        <span className="font-bold text-[#183925] block">2. Propagación Inmediata</span>
                        <p className="text-[#436150]">
                          Mediante Google Apps Script, los registros se insertan en la hoja correspondiente (<code>Usuarios</code>, <code>Clientes</code> o <code>Proveedores</code>) manteniendo encabezados en snake_case.
                        </p>
                      </div>

                      <div className="p-3 bg-[#f8faf8] border border-[#dbe6dc] rounded-xl space-y-1">
                        <span className="font-bold text-[#183925] block">3. Resiliencia Rural</span>
                        <p className="text-[#436150]">
                          Ante cortes de internet en La Aguada, los registros se salvaguardan en el almacén local integrado. Al restablecerse la red, se sincronizan con un clic en <strong>«Sincronizar Sheets»</strong>.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 6. DESCARGA E IMPRESIÓN DEL MANUAL EN PDF */}
                  <section className="space-y-2 pt-3 border-t border-[#e2ece2]">
                    <h4 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#1b5e37]" />
                      <span>6. Disponibilidad y Exportación del Manual en PDF</span>
                    </h4>
                    <p className="text-[11px] text-[#425e4d]">
                      El Manual de Uso completo se encuentra siempre accesible desde el menú lateral en <strong>AYUDA → MANUAL DE USO</strong>. Puede imprimirse o guardarse en formato PDF en cualquier momento utilizando el botón superior <strong>«Imprimir / Guardar PDF»</strong> (o atajo <code>Ctrl+P</code> / <code>Cmd+P</code>), seleccionando como destino «Guardar como PDF».
                    </p>
                  </section>
                </div>
              </article>
            )}

            {/* CAPÍTULO 13: AUDITORÍA */}
            {activeChapterId === 'cap-13' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 13 · Control y Trazabilidad
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Auditoría, Trazabilidad y Control Interno
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Bitácora inmutable de eventos, ciclo de vida de comprobantes y validaciones
                  </p>
                </div>
                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El módulo de <strong>Auditoría</strong> recopila todas las alertas, registros observados y transacciones realizadas por los usuarios, asegurando la trazabilidad completa ante auditorías externas.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 14 */}
            {activeChapterId === 'cap-14' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 14 · Inteligencia Artificial y Consultas
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Asistente de Inteligencia Artificial (PorcIA)
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Asistencia conversacional experta en gestión porcina y consultas generales
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    El sistema integra a <strong>PorcIA</strong>, un asistente conversacional avanzado impulsado por Gemini, accesible desde la barra lateral. Está entrenado para resolver cualquier consulta sobre el establecimiento, indicadores CMI, nutrición, costos y preguntas generales.
                  </p>
                </div>
              </article>
            )}

            {/* CAPÍTULO 15: GLOSARIO TÉCNICO Y FÓRMULAS CLAVE */}
            {activeChapterId === 'cap-15' && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                <div className="border-b border-[#e2ece2] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                    Capítulo 15 · Glosario Zootécnico y Fórmulas
                  </span>
                  <h3 className="text-xl font-bold text-[#143422] mt-2">
                    Glosario de Términos Técnicos y Económicos Necesarios para el Modelo
                  </h3>
                  <p className="text-xs text-[#557361] mt-1">
                    Compendio de definiciones, ratios y conceptos imprescindibles para operar el sistema
                  </p>
                </div>

                <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                  <p>
                    A continuación se detallan las definiciones técnicas y zootécnicas fundamentales empleadas en el sistema de gestión porcina de <strong>Pozo del Carril</strong>:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">1. Conversión Alimenticia (ICA)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Relación entre los kilogramos de alimento consumido y los kilogramos de peso vivo ganado por el animal en un período o etapa. Cuanto menor sea el valor, mayor es la eficiencia biológica. Meta global en ciclo completo: ≤ 3.0 kg/kg.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">2. Valor Neto de Realización (VNR)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Criterio contable de valuación (RT 22) que surge de restar al precio de mercado de referencia (ROSPORC) los gastos directos de comercialización y flete hasta la planta frigorífica.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">3. Lechones Nacidos Vivos (LNV)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Número de lechones que nacen con signos vitales por camada. Es el denominador principal para evaluar la prolificidad materna y el éxito del servicio.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">4. Supervivencia al Destete (%)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Porcentaje de lechones destetados con respecto al total de nacidos vivos. Mide la eficiencia en maternidad y la prevención de aplastamientos. Meta institucional: ≥ 85.8%.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">5. Indicador A5 (Visitas Estudiantiles)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Métrica del Cuadro de Mando Integral (Perspectiva Aprendizaje y Desarrollo) que contabiliza las visitas estudiantiles efectivamente realizadas a la unidad porcina.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">6. Margen Bruto</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Diferencia entre el Valor de la Producción Total y los Costos Directos (alimentación, sanidad, fletes, servicios de terceros).
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">7. ROSPORC</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Sistema de información de precios de capones de la Bolsa de Comercio de Rosario, utilizado como referencia oficial para la liquidación comercial.
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#f8faf8] border border-[#dce6dc] rounded-xl space-y-1">
                      <div className="font-bold text-[#1c4b31] text-xs">8. RBAC (Control de Acceso Basado en Roles)</div>
                      <p className="text-[11px] text-[#4d6a57]">
                        Esquema de seguridad que asigna permisos específicos según el rol del usuario (Administrador, Encargado, Operario o Auditor).
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* RESTO DE CAPÍTULOS POR DEFECTO SI ESTÁN SELECCIONADOS */}
            {!['cap-1', 'cap-2', 'cap-3', 'cap-4', 'cap-5', 'cap-6', 'cap-7', 'cap-8', 'cap-9', 'cap-10', 'cap-11', 'cap-12', 'cap-13', 'cap-14', 'cap-15'].includes(activeChapterId) && (
              <article className="bg-white p-6 sm:p-8 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
                {(() => {
                  const capActual = capitulos.find(c => c.id === activeChapterId);
                  if (!capActual) return null;
                  return (
                    <>
                      <div className="border-b border-[#e2ece2] pb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b5e37] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                          Capítulo {capActual.num} · Guía Operativa
                        </span>
                        <h3 className="text-xl font-bold text-[#143422] mt-2">
                          {capActual.titulo}
                        </h3>
                        <p className="text-xs text-[#557361] mt-1">
                          {capActual.resumen}
                        </p>
                      </div>

                      <div className="text-xs text-[#234230] leading-relaxed space-y-4">
                        <p>
                          Este capítulo detalla los procedimientos y reglas de validación correspondientes al módulo <strong>{capActual.titulo}</strong>. Todos los registros cuentan con verificación cruzada para evitar inconsistencias en el balance de masa o el flujo económico.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </article>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
