/**
 * @file theme.ts
 * @description Definición completa de paletas de colores dinámicas por Unidad de Negocio
 * para menús, botones, tarjetas, filtros activos y elementos de interacción.
 */

export type BusinessUnit = 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';

export interface UnitTheme {
  name: BusinessUnit;
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondaryBg: string;
  border: string;
  textDark: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  ringColor: string;
  cardHeaderBg: string;
  iconBg: string;
  buttonSecondary: string;
  activeFilter: string;
  inactiveFilter: string;
}

export function getUnitTheme(unit: BusinessUnit): UnitTheme {
  switch (unit) {
    case 'BOVINOS':
      return {
        name: 'BOVINOS',
        primary: 'bg-[#78350f] hover:bg-[#58250b] text-white',
        primaryHover: 'hover:bg-[#58250b]',
        primaryText: 'text-amber-900',
        secondaryBg: 'bg-[#fbf4ee]',
        border: 'border-[#e7d4c4]',
        textDark: 'text-[#2c1d11]',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-200',
        accentColor: '#78350f',
        ringColor: 'focus:ring-amber-700',
        cardHeaderBg: 'bg-[#f7efe9]',
        iconBg: 'bg-[#f2e6de] text-[#78350f]',
        buttonSecondary: 'bg-[#fbf4ee] hover:bg-[#f2e6de] text-[#78350f] border border-[#e7d4c4]',
        activeFilter: 'bg-[#78350f] text-white shadow-xs',
        inactiveFilter: 'bg-[#f2e6de]/60 hover:bg-[#f2e6de] text-[#5c3a21]'
      };
    case 'OVINOS':
      return {
        name: 'OVINOS',
        primary: 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white',
        primaryHover: 'hover:bg-[#1e3a8a]',
        primaryText: 'text-blue-900',
        secondaryBg: 'bg-[#eff6ff]',
        border: 'border-[#bfdbfe]',
        textDark: 'text-[#0f172a]',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-800',
        badgeBorder: 'border-blue-200',
        accentColor: '#1e40af',
        ringColor: 'focus:ring-blue-600',
        cardHeaderBg: 'bg-[#ebf3ff]',
        iconBg: 'bg-[#dbeafe] text-[#1e40af]',
        buttonSecondary: 'bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]',
        activeFilter: 'bg-[#1e40af] text-white shadow-xs',
        inactiveFilter: 'bg-[#dbeafe]/60 hover:bg-[#dbeafe] text-[#1e3a8a]'
      };
    case 'CONSOLIDADO':
      return {
        name: 'CONSOLIDADO',
        primary: 'bg-[#581c87] hover:bg-[#4c1d95] text-white',
        primaryHover: 'hover:bg-[#4c1d95]',
        primaryText: 'text-purple-900',
        secondaryBg: 'bg-[#faf5ff]',
        border: 'border-[#e9d5ff]',
        textDark: 'text-[#0f172a]',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-800',
        badgeBorder: 'border-purple-200',
        accentColor: '#581c87',
        ringColor: 'focus:ring-purple-600',
        cardHeaderBg: 'bg-[#f5eefc]',
        iconBg: 'bg-[#ede5fb] text-[#581c87]',
        buttonSecondary: 'bg-[#faf5ff] hover:bg-[#ede5fb] text-[#581c87] border border-[#e9d5ff]',
        activeFilter: 'bg-[#581c87] text-white shadow-xs',
        inactiveFilter: 'bg-[#ede5fb]/60 hover:bg-[#ede5fb] text-[#4c1d95]'
      };
    case 'PORCINOS':
    default:
      return {
        name: 'PORCINOS',
        primary: 'bg-[#1c4b31] hover:bg-[#133c23] text-white',
        primaryHover: 'hover:bg-[#133c23]',
        primaryText: 'text-emerald-900',
        secondaryBg: 'bg-[#edf5ef]',
        border: 'border-[#cce3d2]',
        textDark: 'text-[#183123]',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-200',
        accentColor: '#1c4b31',
        ringColor: 'focus:ring-emerald-600',
        cardHeaderBg: 'bg-[#eaf4ec]',
        iconBg: 'bg-[#d8ebd9] text-[#1c4b31]',
        buttonSecondary: 'bg-[#edf5ef] hover:bg-[#d8ebd9] text-[#1c4b31] border border-[#cce3d2]',
        activeFilter: 'bg-[#1c4b31] text-white shadow-xs',
        inactiveFilter: 'bg-[#d8ebd9]/60 hover:bg-[#d8ebd9] text-[#133c23]'
      };
  }
}
