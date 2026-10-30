import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  GripVertical, 
  SlidersHorizontal,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';
import { ModuleKey } from './Sidebar';

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

export const ReorderTabsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOrder,
  onSaveOrder,
  allModules,
  defaultOrder
}) => {
  const [orderedKeys, setOrderedKeys] = useState<ModuleKey[]>(currentOrder);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Asegurarse de incluir todos los módulos disponibles en la lista ordenada
      const existing = [...currentOrder];
      allModules.forEach(m => {
        if (!existing.includes(m.key)) {
          existing.push(m.key);
        }
      });
      setOrderedKeys(existing);
      setHasChanges(false);
    }
  }, [isOpen, currentOrder, allModules]);

  if (!isOpen) return null;

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedKeys.length) return;

    const newKeys = [...orderedKeys];
    const temp = newKeys[index];
    newKeys[index] = newKeys[targetIndex];
    newKeys[targetIndex] = temp;

    setOrderedKeys(newKeys);
    setHasChanges(true);
  };

  const moveToExtreme = (index: number, position: 'top' | 'bottom') => {
    if (position === 'top' && index === 0) return;
    if (position === 'bottom' && index === orderedKeys.length - 1) return;

    const newKeys = [...orderedKeys];
    const [item] = newKeys.splice(index, 1);
    if (position === 'top') {
      newKeys.unshift(item);
    } else {
      newKeys.push(item);
    }

    setOrderedKeys(newKeys);
    setHasChanges(true);
  };

  const handleReset = () => {
    setOrderedKeys([...defaultOrder]);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveOrder(orderedKeys);
    onClose();
  };

  // Mapear claves a objetos completos
  const modulesMap = new Map(allModules.map(m => [m.key, m]));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#d8e2d7] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Cabecera */}
        <div className="bg-[#0c1f15] text-white p-4 flex items-center justify-between border-b border-[#1b442b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c4b31] border border-[#2d8350] flex items-center justify-center text-[#7ee7a9] shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">
                Personalizar Orden de Pestañas
              </h3>
              <p className="text-[11px] text-[#9fc4ac]">
                Organiza las hojas del sistema según tu preferencia de trabajo
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
          <span>Usa las flechas para subir o bajar cada pestaña en el menú de navegación:</span>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-[#1b5e37] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            title="Restablecer el orden predeterminado de fábrica"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Lista de pestañas reordenables */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-[#fbfdfb]">
          {orderedKeys.map((key, index) => {
            const mod = modulesMap.get(key);
            if (!mod) return null;
            const Icon = mod.icon;
            const isFirst = index === 0;
            const isLast = index === orderedKeys.length - 1;

            return (
              <div 
                key={key}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#dce6dc] bg-white hover:border-[#1c4b31]/40 hover:shadow-2xs transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#f0f4f1] text-[#345c43] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#edf6f0] text-[#1b5e37] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#143422] truncate">
                    {mod.label}
                  </span>
                </div>

                {/* Botones de acción de movimiento */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveToExtreme(index, 'top')}
                    disabled={isFirst}
                    className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isFirst 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                    }`}
                    title="Mover al inicio"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={isFirst}
                    className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isFirst 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                    }`}
                    title="Subir una posición"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={isLast}
                    className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isLast 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                    }`}
                    title="Bajar una posición"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveToExtreme(index, 'bottom')}
                    disabled={isLast}
                    className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isLast 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-[#4e705b] hover:bg-[#edf6f0] hover:text-[#1c4b31]'
                    }`}
                    title="Mover al final"
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie de modal */}
        <div className="p-3 bg-[#f4f7f4] border-t border-[#dce6dc] flex items-center justify-between">
          <span className="text-[11px] text-[#597864]">
            {hasChanges ? 'Hay cambios pendientes de guardar' : 'Orden sincronizado'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-[#c8d8ca] text-xs font-semibold hover:bg-white text-[#345340] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#1c4b31] hover:bg-[#123823] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Orden</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
