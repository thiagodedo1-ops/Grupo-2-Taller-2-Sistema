/**
 * @file ovino_validation.ts
 * @description Validaciones de integridad para registros Ovinos en memoria.
 */

import { ExistenciaOvina, ProduccionOvina } from '../types/ovino_schema';

export const validateExistencia = (reg: ExistenciaOvina) => {
  if (reg.cabezas < 0) throw new Error("La cantidad de cabezas no puede ser negativa");
  if (!reg.id_campana) throw new Error("Campaña obligatoria");
  return true;
};

export const validateProduccion = (reg: ProduccionOvina) => {
  if (reg.cabezas <= 0) throw new Error("La cantidad de animales debe ser mayor a cero");
  return true;
};
