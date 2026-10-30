import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  SlidersHorizontal,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Layers,
  FileText
} from 'lucide-react';
import { ModuleKey } from './Sidebar';

interface GroupDefinition {
  id: string;
  label: string;
  keys: ModuleKey[];
}

interface ModuleItem {
  key: ModuleKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: ModuleKey[];
  onSaveOrder: (newOrder: ModuleKey[]) => void;
  allModules: ModuleItem[];
  defaultOrder: ModuleKey[];
}

// Grupos principales por defecto del sistema
const DEFAULT_GROUPS: GroupDefinition[] = [
  { id: 'panel_general', label: '1. Panel General', keys: ['inicio'] },
  { id: 'produccion', label: '2. Producción', keys: ['produccion', 'alimentacion', 'stock', 'existencias', 'bov_rodeo', 'bov_manga', 'bov_alimentacion', 'bov_sanidad', 'ovi_majada', 'ovi_zafra', 'ovi_sanidad'] },
  { id: 'gestion_comercial', label: '3. Gestión Comercial', keys: ['compras', 'ventas', 'porc_simulacion', 'bov_simulacion', 'ovi_simulacion'] },
  { id: 'gestion_economica', label: '4. Gestión Económica', keys: ['presupuesto', 'historico'] },
  { id: 'modelo_gestion', label: '5. Modelo de Gestión', keys: ['indicadores'] },
  { id: 'administracion', label: '6. Administración', keys: ['usuarios', 'configuracion', 'auditoria'] },
  { id: 'ayuda', label: '7. Ayuda y Soporte', keys: ['manual', 'tour', 'gemini'] }
];

export const ReorderTabsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOrder,
  onSaveOrder,
  allModules
}) => {
  const [groups, setGroups] = useState<GroupDefinition[]>(DEFAULT_GROUPS);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    panel_general: true,
    produccion: true,
    gestion_comercial: true,
    gestion_economica: true,
    modelo_gestion: true,
    administracion: true,
    ayuda: true
  });
  const [hasChanges, setHasChanges] = useState(false);

  const modulesMap = new Map(allModules.map(m => [m.key, m]));

  useEffect(() => {
    if (isOpen) {
      // Reconstruir grupos basados en currentOrder si es posible
      // O mantener DEFAULT_GROUPS ordenados según currentOrder
      setHasChanges(false);
    }
  }, [isOpen, currentOrder, allModules]);

  if (!isOpen) return null;

  // Mover grupo completo arriba o abajo
  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    const newGroups = [...groups];
    const temp = newGroups[index];
    newGroups[index] = newGroups[targetIndex];
    newGroups[targetIndex] = temp;

    setGroups(newGroups);
    setHasChanges(true);
  };

  // Mover sub-item dentro de su grupo
  const moveItemInGroup = (groupIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    const group = groups[groupIndex];
    if (!group) return;
    if (targetIndex < 0 || targetIndex >= group.keys.length) return;

    const newGroups = [...groups];
    const newKeys = [...group.keys];
    const temp = newKeys[itemIndex];
    newKeys[itemIndex] = newKeys[targetIndex];
    newKeys[targetIndex] = temp;

    newGroups[groupIndex] = { ...group, keys: newKeys };
    setGroups(newGroups);
    setHasChanges(true);
  };

  const toggleGroupOpen = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleReset = () => {
    setGroups(DEFAULT_GROUPS);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Aplanar todas las claves de todos los grupos en un único array para tabsOrder
    const flattened: ModuleKey[] = [];
    groups.forEach(g => {
      g.keys.forEach(k => {
        if (!flattened.includes(k)) {
          flattened.push(k);
        }
      });
    });
    // Añadir cualquier módulo faltante
    allModules.forEach(m => {
      if (!flattened.includes(m.key)) {
        flattened.push(m.key);
      }
    });

    onSaveOrder(flattened);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#d8e2d7] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Cabecera */}
        <div className="bg-[#0c1f15] text-white p-4 flex items-center justify-between border-b border-[#1b442b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c4b31] border border-[#2d8350] flex items-center justify-center text-[#7ee7a9] shadow-sm">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">
                Organizador Jerárquico de Grupos y Pestañas
              </h3>
              <p className="text-[11px] text-[#9fc4ac]">
                Modifica el orden de las secciones principales y de sus sub-módulos asociados
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9fc4ac] hover:text-white hover:bg-[#163b25] transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instrucciones */}
        <div className="bg-[#f4f7f4] px-4 py-2.5 border-b border-[#dce6dc] text-xs text-[#4b6b57] flex items-center justify-between">
          <span>Reordena los grupos temáticos y los sub-elementos a tu comodidad:</span>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-[#1b5e37] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            title="Restablecer orden predeterminado"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Contenedor Jerárquico */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfdfb]">
          {groups.map((group, groupIndex) => {
            const isOpen = !!openGroups[group.id];
            const isFirstGroup = groupIndex === 0;
            const isLastGroup = groupIndex === groups.length - 1;

            return (
              <div 
                key={group.id}
                className="border border-[#dce6dc] rounded-2xl bg-white shadow-xs overflow-hidden transition-all"
              >
                {/* Cabecera del Grupo */}
                <div className="bg-[#edf6f0] px-3.5 py-2.5 flex items-center justify-between border-b border-[#d2e6d5]">
                  <div className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0" onClick={() => toggleGroupOpen(group.id)}>
                    <button type="button" className="text-[#1b5e37]">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Layers className="w-4 h-4 text-[#1b5e37] shrink-0" />
                    <span className="font-bold text-xs text-[#143422] uppercase tracking-wider truncate">
                      {group.label}
                    </span>
                    <span className="text-[10px] bg-white text-[#1b5e37] px-2 py-0.5 rounded-full font-bold border border-[#bbf7d0] ml-2">
                      {group.keys.length} ítems
                    </span>
                  </div>

                  {/* Botones para mover el Grupo entero */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => moveGroup(groupIndex, 'up')}
                      disabled={isFirstGroup}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isFirstGroup ? 'text-gray-300 cursor-not-allowed' : 'text-[#1b5e37] hover:bg-white'
                      }`}
                      title="Subir Grupo completo"
                    >
                      ↑ Grupo
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGroup(groupIndex, 'down')}
                      disabled={isLastGroup}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isLastGroup ? 'text-gray-300 cursor-not-allowed' : 'text-[#1b5e37] hover:bg-white'
                      }`}
                      title="Bajar Grupo completo"
                    >
                      ↓ Grupo
                    </button>
                  </div>
                </div>

                {/* Sub-ítems del Grupo */}
                {isOpen && (
                  <div className="p-2 space-y-1.5 bg-[#fcfdfc]">
                    {group.keys.map((key, itemIndex) => {
                      const mod = modulesMap.get(key);
                      if (!mod) return null;
                      const Icon = mod.icon;
                      const isFirstItem = itemIndex === 0;
                      const isLastItem = itemIndex === group.keys.length - 1;

                      return (
                        <div 
                          key={key}
                          className="flex items-center justify-between p-2 pl-4 rounded-xl border border-[#e5ede7] bg-white hover:border-[#1c4b31]/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-[#5f7e6a] shrink-0" />
                            <div className="w-6 h-6 rounded-lg bg-[#f0f4f1] text-[#1b5e37] flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-[#1e3b2a] truncate">
                              {mod.label}
                            </span>
                          </div>

                          {/* Botones para mover sub-item arriba/abajo */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveItemInGroup(groupIndex, itemIndex, 'up')}
                              disabled={isFirstItem}
                              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                isFirstItem ? 'text-gray-200 cursor-not-allowed' : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                              }`}
                              title="Subir ítem"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemInGroup(groupIndex, itemIndex, 'down')}
                              disabled={isLastItem}
                              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                isLastItem ? 'text-gray-200 cursor-not-allowed' : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                              }`}
                              title="Bajar ítem"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie de modal */}
        <div className="p-3.5 bg-[#f4f7f4] border-t border-[#dce6dc] flex items-center justify-between">
          <span className="text-[11px] text-[#597864] font-medium">
            {hasChanges ? 'Cambios pendientes de aplicar' : 'Organización guardada'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#c8d8ca] text-xs font-semibold hover:bg-white text-[#345340] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#1c4b31] hover:bg-[#123823] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Organización</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
