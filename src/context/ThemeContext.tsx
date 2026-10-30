/**
 * @file ThemeContext.tsx
 * @description Contexto de React para proveer la paleta de colores activa a toda la interfaz de usuario
 */

import React, { createContext, useContext } from 'react';
import { BusinessUnit, UnitTheme, getUnitTheme } from '../lib/theme';

interface ThemeContextType {
  activeBusinessUnit: BusinessUnit;
  theme: UnitTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  activeBusinessUnit: 'PORCINOS',
  theme: getUnitTheme('PORCINOS')
});

export const ThemeProvider: React.FC<{ activeBusinessUnit: BusinessUnit; children: React.ReactNode }> = ({
  activeBusinessUnit,
  children
}) => {
  const theme = getUnitTheme(activeBusinessUnit);
  return (
    <ThemeContext.Provider value={{ activeBusinessUnit, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
