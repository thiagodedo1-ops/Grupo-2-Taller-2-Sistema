/**
 * @file test_ovino_persistence.ts
 * @description Pruebas unitarias aisladas para el adaptador de persistencia ovina.
 */

import { OvinoAdapter } from './OvinoPersistenceAdapter';
import { ExistenciaOvina } from '../types/ovino_schema';

const testExistencia: ExistenciaOvina = {
  id: 'OVI_TEST_001',
  id_campana: 'CAMP_2024',
  id_subunidad: 'OVI_CRIA',
  id_categoria: 'CAT_OVEJA',
  cabezas: 50,
  kg_totales: 2500,
  fecha: '2024-10-22',
  estado: 'Borrador'
};

async function runTests() {
  console.log("--- Iniciando Pruebas de Persistencia Ovina ---");

  try {
    // Prueba de Validación y Guardado Simulado
    await OvinoAdapter.saveExistencia(testExistencia);
    console.log("Test 1 (Existencia): PASSED");
  } catch (e) {
    console.error("Test 1 (Existencia): FAILED", e);
  }

  // Prueba de Validación (Cabezas negativas)
  try {
    const invalidExistencia = { ...testExistencia, cabezas: -10 };
    await OvinoAdapter.saveExistencia(invalidExistencia);
    console.error("Test 2 (Validación Negativa): FAILED");
  } catch (e) {
    console.log("Test 2 (Validación Negativa): PASSED");
  }
}

runTests();
