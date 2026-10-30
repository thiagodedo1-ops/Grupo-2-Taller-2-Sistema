/**
 * @file InteractiveTour.tsx
 * @description Guía interactiva de bienvenida y tour guiado con spotlight visual (Spotlight Overlay)
 * Establecimiento Pozo del Carril – La Aguada | UNRC
 *
 * Características principales:
 * - Activación automática en el primer ingreso por usuario (guardado en localStorage).
 * - Pantalla de Bienvenida con "Iniciar recorrido" u "Omitir por ahora".
 * - Resaltado visual exacto mediante recorte SVG (Spotlight) y contorno luminoso (Glow Ring).
 * - Menú lateral se despliega e ilumina automáticamente según el grupo correspondiente.
 * - Desplazamiento automático para mantener siempre visible el elemento explicado.
 * - 12 Pasos detallados según especificación oficial.
 * - Pantalla final con "Finalizar e ir al Panel General".
 * - Posibilidad de reiniciar el tour desde la sección Ayuda.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  HelpCircle,
  LayoutDashboard,
  Layers,
  ShoppingCart,
  Calculator,
  LineChart,
  Settings,
  BookOpen,
  Bell,
  DollarSign,
  Bot
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { getRolePermissions } from '../lib/permissions';
import { ModuleKey } from './Sidebar';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestedModule?: ModuleKey;
  sidebarGroup?: string;
  adminOnly?: boolean;
  isModalStep?: boolean;
}

interface Props {
  currentUser?: Usuario | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ModuleKey) => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const InteractiveTour: React.FC<Props> = ({
  currentUser = null,
  isOpen,
  onClose,
  onNavigate
}) => {
  const permissions = getRolePermissions(currentUser);
  const userId = currentUser?.usuario_id || 'default';
  const storageKey = `pozo_del_carril_tour_status_${userId}`;

  // Modos de vista del Tour: 'idle' | 'welcome' | 'tour' | 'completed'
  const [mode, setMode] = useState<'idle' | 'welcome' | 'tour' | 'completed'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Pasos Oficiales del Recorrido Guiado
  const rawSteps: TourStep[] = [
    {
      id: 'step-1-unit-selector',
      targetId: 'tour-business-unit-selector',
      title: 'Selector de Unidad Productiva',
      description: 'Permite alternar entre Porcinos, Bovinos, Ovinos y el modo Consolidado. Al cambiar de unidad, la interfaz adapta sus datos y colores institucionales manteniendo la misma experiencia de navegación.',
      icon: Compass,
      suggestedModule: 'inicio'
    },
    {
      id: 'step-2-panel-general',
      targetId: 'tour-group-panel_general',
      sidebarGroup: 'panel_general',
      title: 'Panel General',
      description: 'Permite consultar un resumen de la situación productiva y económica de la unidad seleccionada, con tarjetas de resultados, semáforos de alerta y metas configurables.',
      icon: LayoutDashboard,
      suggestedModule: 'inicio'
    },
    {
      id: 'step-3-produccion',
      targetId: 'tour-group-produccion',
      sidebarGroup: 'produccion',
      title: 'Producción Ganadera',
      description: 'Permite registrar animales, etapas productivas, existencias físicas, movimientos, pesadas y eventos sanitarios específicos de cada unidad ganadera.',
      icon: Layers,
      suggestedModule: 'produccion'
    },
    {
      id: 'step-4-comercial',
      targetId: 'tour-group-gestion_comercial',
      sidebarGroup: 'gestion_comercial',
      title: 'Gestión Comercial',
      description: 'Incluye las compras de insumos a proveedores, las ventas de hacienda y las herramientas de simulación comercial con precios de mercado (ROSPORC / MAG Cañuelas).',
      icon: ShoppingCart,
      suggestedModule: 'compras'
    },
    {
      id: 'step-5-economica',
      targetId: 'tour-group-gestion_economica',
      sidebarGroup: 'gestion_economica',
      title: 'Gestión Económica',
      description: 'Permite consultar costos directos de producción, control de presupuestos por campaña, análisis causa-raíz de desvíos e históricos económicos.',
      icon: Calculator,
      suggestedModule: 'presupuesto'
    },
    {
      id: 'step-6-modelo-gestion',
      targetId: 'tour-group-modelo_gestion',
      sidebarGroup: 'modelo_gestion',
      title: 'Modelo de Gestión',
      description: 'Acceso a los Cuadros de Mando Integral (CMI) de cada unidad y del Consolidado, con semáforos, metas editables e indicadores prioritarios marcados con estrella.',
      icon: LineChart,
      suggestedModule: 'indicadores'
    },
    {
      id: 'step-7-administracion',
      targetId: 'tour-group-administracion',
      sidebarGroup: 'administracion',
      title: 'Administración',
      description: 'Permite a los usuarios autorizados gestionar maestros, cuentas de usuario, asignación de permisos por rol y vinculación directa con Google Sheets.',
      icon: Settings,
      suggestedModule: 'usuarios',
      adminOnly: true
    },
    {
      id: 'step-8-notificaciones',
      targetId: 'tour-notifications-bell',
      title: 'Notificaciones y Alertas',
      description: 'Permite consultar avisos zootécnicos, alertas de conversión (ICA), vencimientos sanitarios y notas creadas por el equipo operativo en el almacén de alertas.',
      icon: Bell
    },
    {
      id: 'step-9-moneda',
      targetId: 'tour-currency-selector',
      title: 'Moneda ARS / USD',
      description: 'Permite visualizar importes en Pesos Argentinos o Dólares y consultar la cotización oficial bimonetaria del Banco Nación (BNA) en tiempo real o histórica.',
      icon: DollarSign
    },
    {
      id: 'step-10-ganaderia',
      targetId: 'tour-ganaderia-btn',
      title: 'Asistente IA (GanaderIA)',
      description: 'Abre el asistente de inteligencia artificial especializado para orientar al usuario en la utilización del sistema y responder consultas del establecimiento.',
      icon: Sparkles
    },
    {
      id: 'step-11-ayuda',
      targetId: 'tour-group-ayuda',
      sidebarGroup: 'ayuda',
      title: 'Ayuda y Manual',
      description: 'Contiene recursos para aprender a utilizar el sistema, descargar el Manual de Uso oficial en PDF y volver a iniciar este recorrido guiado en cualquier momento.',
      icon: HelpCircle,
      suggestedModule: 'manual'
    },
    {
      id: 'step-12-final',
      targetId: 'tour-dashboard-main',
      title: 'Finalización del Recorrido',
      description: 'Ya conocés las herramientas habilitadas para tu perfil en el Sistema Integral de Gestión Ganadera. Podés volver a realizar este recorrido desde la sección Ayuda.',
      icon: CheckCircle2,
      isModalStep: true
    }
  ];

  // Filtrar pasos de forma estricta según el rol del usuario y los módulos permitidos
  const steps = useMemo(() => {
    return rawSteps.filter(s => {
      // 1. Si el paso requiere explícitamente rol Administrador
      if (s.adminOnly && permissions.rolId !== 'ROL_ADMIN') {
        return false;
      }

      // 2. Si el paso sugiere un módulo específico, verificar que esté en los módulos autorizados del usuario
      if (s.suggestedModule && !permissions.allowedModules.includes(s.suggestedModule)) {
        return false;
      }

      // 3. Si el paso apunta a un grupo de la barra lateral, verificar que el grupo tenga módulos permitidos
      if (s.sidebarGroup) {
        const groupModulesMap: Record<string, ModuleKey[]> = {
          panel_general: ['inicio'],
          produccion: [
            'produccion', 'alimentacion', 'stock',
            'bov_rodeo', 'bov_manga', 'bov_alimentacion', 'bov_sanidad',
            'ovi_majada', 'ovi_zafra', 'ovi_sanidad'
          ],
          gestion_comercial: ['compras', 'ventas', 'porc_simulacion', 'bov_simulacion', 'ovi_simulacion'],
          gestion_economica: ['presupuesto', 'historico'],
          modelo_gestion: ['indicadores', 'cmi'],
          administracion: ['usuarios', 'configuracion', 'auditoria'],
          ayuda: ['manual', 'tour', 'gemini']
        };

        const groupMods = groupModulesMap[s.sidebarGroup];
        if (groupMods && !groupMods.some(m => permissions.allowedModules.includes(m))) {
          return false;
        }
      }

      return true;
    });
  }, [permissions, rawSteps]);

  // Iniciar automáticamente en pantalla de bienvenida con opción de iniciar o omitir
  useEffect(() => {
    if (!isOpen) {
      setMode('idle');
      return;
    }

    setMode('welcome');
    setCurrentStepIndex(0);
  }, [isOpen]);

  // Asegurar que el índice del paso permanezca dentro de los límites válidos
  useEffect(() => {
    if (currentStepIndex >= steps.length && steps.length > 0) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [steps.length, currentStepIndex]);

  // Función para medir la posición del elemento objetivo
  const updateTargetRect = useCallback(() => {
    if (mode !== 'tour') {
      setTargetRect(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep || currentStep.isModalStep) {
      setTargetRect(null);
      return;
    }

    // Si el paso hace referencia a un grupo de la barra lateral, expandirlo automáticamente
    if (currentStep.sidebarGroup) {
      window.dispatchEvent(new CustomEvent('tour-expand-group', { detail: { groupId: currentStep.sidebarGroup } }));
    }

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });
    } else {
      setTargetRect(null);
    }

    setViewportSize({ width: window.innerWidth, height: window.innerHeight });
  }, [currentStepIndex, mode, steps]);

  // Manejador de scroll y resize continuo durante el tour
  useEffect(() => {
    if (mode !== 'tour') return;

    const currentStep = steps[currentStepIndex];
    if (currentStep?.suggestedModule && permissions.allowedModules.includes(currentStep.suggestedModule)) {
      onNavigate(currentStep.suggestedModule);
    }

    // Dar tiempo breve para render o expansión de subgrupos en la barra lateral
    const timer1 = setTimeout(() => {
      updateTargetRect();
      const el = currentStep?.targetId ? document.getElementById(currentStep.targetId) : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    const timer2 = setTimeout(() => {
      updateTargetRect();
    }, 350);

    const handleResizeOrScroll = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [currentStepIndex, mode, steps, updateTargetRect, onNavigate, permissions.allowedModules]);

  const handleStartTour = () => {
    setCurrentStepIndex(0);
    setMode('tour');
    if (steps[0]?.suggestedModule) {
      onNavigate(steps[0].suggestedModule);
    }
  };

  const handleSkipWelcome = () => {
    try {
      localStorage.setItem(storageKey, 'skipped');
    } catch {}
    window.dispatchEvent(new CustomEvent('tour-close-all-groups'));
    setMode('idle');
    onNavigate('inicio');
    onClose();
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (steps[nextIndex]?.suggestedModule) {
        onNavigate(steps[nextIndex].suggestedModule);
      }
    } else {
      handleFinishTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (steps[prevIndex]?.suggestedModule) {
        onNavigate(steps[prevIndex].suggestedModule);
      }
    }
  };

  const handleFinishTour = () => {
    try {
      localStorage.setItem(storageKey, 'completed');
    } catch {}
    window.dispatchEvent(new CustomEvent('tour-close-all-groups'));
    setMode('completed');
  };

  const handleCompleteFinal = () => {
    setMode('idle');
    onNavigate('inicio');
    onClose();
  };

  const handleCancel = () => {
    try {
      localStorage.setItem(storageKey, 'skipped');
    } catch {}
    window.dispatchEvent(new CustomEvent('tour-close-all-groups'));
    setMode('idle');
    onNavigate('inicio');
    onClose();
  };

  if (mode === 'idle') return null;

  // 1. Pantalla de Bienvenida Inicial
  if (mode === 'welcome') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#cbe4d2] text-[#143422] relative">
          <div className="w-14 h-14 rounded-2xl bg-[#edf7f0] border border-[#b8dfc4] text-[#1c4b31] flex items-center justify-center mb-5 shadow-xs">
            <Sparkles className="w-7 h-7 text-[#1c4b31]" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#936435] block mb-1">
            Inducción y Bienvenida
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-[#143422] tracking-tight leading-snug">
            Bienvenido al Sistema Integral de Gestión Ganadera
          </h2>

          <p className="text-xs sm:text-sm text-[#4c6756] mt-3 leading-relaxed">
            Te invitamos a conocer las principales herramientas del sistema para gestionar las unidades productivas Porcinos, Bovinos y Ovinos, y analizar sus resultados desde el modo Consolidado.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#edf2ec]">
            <button
              type="button"
              onClick={handleStartTour}
              className="w-full sm:w-auto flex-1 px-5 py-3 bg-[#1c4b31] hover:bg-[#143a24] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar recorrido</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSkipWelcome}
              className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-[#5d7d6a] hover:text-[#183a26] hover:bg-[#f2f7f3] rounded-xl transition-all cursor-pointer"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pantalla Final o Modal de Cierre
  if (mode === 'completed') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-[#b8dfc4] text-[#143422] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#143422]">
              ¡Recorrido Finalizado!
            </h3>
            <p className="text-xs sm:text-sm text-[#4c6756] mt-2 leading-relaxed">
              Ya conocés las principales herramientas del Sistema Integral de Gestión Ganadera. Podés volver a realizar este recorrido desde la sección Ayuda.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCompleteFinal}
            className="w-full py-3 bg-[#1c4b31] hover:bg-[#143a24] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            Finalizar e ir al Panel General
          </button>
        </div>
      </div>
    );
  }

  // 3. Recorrido Paso a Paso con Spotlight Visual
  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep?.icon || Sparkles;
  const isFinalModalStep = currentStep?.isModalStep || false;

  const padding = 8;
  const rectPad = targetRect ? {
    top: Math.max(0, targetRect.top - padding),
    left: Math.max(0, targetRect.left - padding),
    width: targetRect.width + 2 * padding,
    height: targetRect.height + 2 * padding
  } : null;

  // Cálculo inteligente de posición de la tarjeta explicativa flotante
  const calculateTooltipStyle = () => {
    if (!rectPad) {
      return {
        bottom: '2rem',
        right: '2rem'
      };
    }

    // Si el elemento está en la barra lateral izquierda
    if (rectPad.left < 320) {
      return {
        top: `${Math.min(Math.max(20, rectPad.top), viewportSize.height - 280)}px`,
        left: `${rectPad.left + rectPad.width + 20}px`
      };
    }

    // Si el elemento está cerca del borde superior derecho (header / campanita / moneda)
    if (rectPad.top < 120) {
      return {
        top: `${rectPad.top + rectPad.height + 15}px`,
        left: `${Math.max(20, Math.min(rectPad.left - 120, viewportSize.width - 420))}px`
      };
    }

    // Posición predeterminada debajo del elemento o flotante abajo a la derecha
    return {
      top: `${Math.min(rectPad.top + rectPad.height + 15, viewportSize.height - 280)}px`,
      left: `${Math.max(20, Math.min(rectPad.left, viewportSize.width - 420))}px`
    };
  };

  const tooltipStyle = calculateTooltipStyle();

  return (
    <div className="fixed inset-0 z-[100] font-sans">
      {/* MÁSCARA SVG DE OCULTAMIENTO (SPOTLIGHT CUTOUT) */}
      {rectPad ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-[101]">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width={viewportSize.width} height={viewportSize.height} fill="white" />
              <rect
                x={rectPad.left}
                y={rectPad.top}
                width={rectPad.width}
                height={rectPad.height}
                rx="12"
                ry="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={viewportSize.width}
            height={viewportSize.height}
            fill="rgba(15, 23, 42, 0.68)"
            mask="url(#tour-spotlight-mask)"
            className="transition-all duration-200"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs pointer-events-none z-[101]" />
      )}

      {/* MARCO CONTORNO LUMINOSO ALREDEDOR DEL ELEMENTO HIGHLIGHTED */}
      {rectPad && (
        <div
          className="fixed pointer-events-none z-[102] transition-all duration-200 rounded-2xl border-3 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.85),inset_0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
          style={{
            top: `${rectPad.top}px`,
            left: `${rectPad.left}px`,
            width: `${rectPad.width}px`,
            height: `${rectPad.height}px`
          }}
        />
      )}

      {/* CAPA DE CAPTURA DE CLICS EXTERNOS PARA DERECHO A CANCELAR */}
      <div 
        className="fixed inset-0 z-[102] cursor-pointer"
        onClick={handleCancel}
        title="Hacer clic afuera para omitir el recorrido"
      />

      {/* TARJETA DE EXPLICACIÓN DEL PASO ACTUAL (TOOLTIP CARD) */}
      <div
        className="fixed z-[105] max-w-md w-[calc(100vw-3rem)] pointer-events-auto transition-all duration-300 animate-in fade-in zoom-in-95"
        style={tooltipStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl p-5 shadow-2xl border-2 border-[#1c4b31] text-[#143422] flex flex-col justify-between">
          <div>
            {/* Cabecera de la tarjeta */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#edf6f0] border border-[#c5e4cf] text-[#1b5e37] flex items-center justify-center shrink-0">
                  <StepIcon className="w-4 h-4 text-[#1c4b31]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#91622b]">
                    Guía de Orientación Ganadera
                  </span>
                  <div className="text-[11px] font-bold text-[#1e5333]">
                    Paso {currentStepIndex + 1} de {steps.length}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-[#688574] hover:text-[#183925] hover:bg-[#edf5f0] transition-colors cursor-pointer"
                title="Omitir recorrido"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del paso */}
            <h4 className="text-base font-bold text-[#143422] tracking-tight mt-1">
              {currentStep.title}
            </h4>
            <p className="text-xs text-[#486353] mt-2 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-[#e8f1ea] h-1.5 rounded-full overflow-hidden my-4">
            <div 
              className="bg-[#1c4b31] h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Botones del Paso */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#edf2ec]">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrevStep}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#506e5c] hover:text-[#143422] hover:bg-[#edf5ef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-medium text-[#7a9384] hover:text-[#183424] cursor-pointer"
              >
                Omitir
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-[#1c4b31] hover:bg-[#133c23] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
