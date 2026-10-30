/**
 * @file validate_ovino_types.ts
 * @description Script de validación en memoria para tipos ovinos.
 */

import { ExistenciaOvina } from '../types/ovino_schema';
import { validateExistencia } from '../lib/ovino_validation';

const testReg: ExistenciaOvina = {
  id: 'OVI_123',
  id_campana: 'CAMP_2024',
  id_subunidad: 'OVI_CRIA',
  id_categoria: 'CAT_OVEJA',
  cabezas: 100,
  kg_totales: 5000,
  fecha: '2024-10-22',
  estado: 'Borrador'
};

try {
  validateExistencia(testReg);
  console.log("Validación de Existencia: PASSED");
} catch (e) {
  console.error("Validación de Existencia: FAILED", e);
}
