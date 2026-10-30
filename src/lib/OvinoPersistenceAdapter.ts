/**
 * @file OvinoPersistenceAdapter.ts
 * @description Adaptador de persistencia para la Unidad Ovina utilizando la conexión principal del sistema.
 */

import { dbManager } from './storage';
import { 
  ExistenciaOvina, 
  ProduccionOvina, 
  ConsumoInsumoOvino, 
  CompraOvina, 
  VentaOvina 
} from '../types/ovino_schema';
import { validateExistencia, validateProduccion } from './ovino_validation';

export const OvinoAdapter = {
  checkConnection: async () => {
    return { success: dbManager.getState().isOnlineWithSheets, message: dbManager.getState().syncError || 'Conexión principal activa' };
  },

  // Guardar Existencia
  saveExistencia: async (data: ExistenciaOvina) => {
    validateExistencia(data);
    // @ts-ignore
    return await dbManager.saveRecord('Existencias_Ovinas', data);
  },

  // Guardar Evento Producción
  saveProduccion: async (data: ProduccionOvina) => {
    validateProduccion(data);
    // @ts-ignore
    return await dbManager.saveRecord('Produccion_Ovina', data);
  },

  // Guardar Consumo
  saveConsumo: async (data: ConsumoInsumoOvino) => {
    // @ts-ignore
    return await dbManager.saveRecord('Consumos_Ovinos', data);
  },

  // Guardar Compra
  saveCompra: async (compra: CompraOvina) => {
    // @ts-ignore
    return await dbManager.saveRecord('Compras_Ovinas', compra);
  },

  // Guardar Venta
  saveVenta: async (venta: VentaOvina) => {
    // @ts-ignore
    return await dbManager.saveRecord('Ventas_Ovinas', venta);
  }
};
