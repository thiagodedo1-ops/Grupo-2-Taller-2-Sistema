/**
 * @file StockBovinoView.tsx
 * @description Sub-módulo: Stock de Insumos Bovinos
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicado en GESTIÓN COMERCIAL.
 * Control de existencias físicas y valuación de insumos ganaderos:
 * rollos de alfalfa, silo de maíz, grano propio transferido, concentrados, vacunas SENASA y caravanas RFID.
 */

import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Wheat, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

interface InsumoStockBovino {
  id: string;
  nombre: string;
  categoria: 'Forrajes y Reservas' | 'Granos y Concentrados' | 'Sanidad Veterinaria' | 'Identificación Oficial';
  stockActual: number;
  unidadMedida: string;
  puntoReposicion: number;
  costoUnitario: number;
  origen: 'Compra Externa' | 'Cosecha Propia UNRC' | 'SENASA Oficial';
}

export const StockBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const { theme } = useTheme();
  const { formatMoney, currency } = useCurrency();
  const permissions = getRolePermissions(currentUser);
  const [busqueda, setBusqueda] = useState('');

  // Transferencias de maíz para calcular existencia real
  const transferencias = db.Transferencias_Granos?.filter(t => t.unidad_destino_id === 'UN_BOVINOS') || [];
  const kgMaizTransferido = transferencias.reduce((acc, t) => acc + (t.kg_transferidos || 0), 0);

  // Inventario de Insumos Ganaderos
  const inventario: InsumoStockBovino[] = [
    {
      id: 'INS_BOV_01',
      nombre: 'Rollos de Alfalfa 1ra Calidad (500 kg/u)',
      categoria: 'Forrajes y Reservas',
      stockActual: 140,
      unidadMedida: 'Rollos',
      puntoReposicion: 50,
      costoUnitario: 42000,
      origen: 'Compra Externa'
    },
    {
      id: 'INS_BOV_02',
      nombre: 'Silo de Maíz Planta Entera (Picado Fino)',
      categoria: 'Forrajes y Reservas',
      stockActual: 220,
      unidadMedida: 'Toneladas',
      puntoReposicion: 60,
      costoUnitario: 38500,
      origen: 'Cosecha Propia UNRC'
    },
    {
      id: 'INS_BOV_03',
      nombre: 'Grano de Maíz Seco (Planta UNRC)',
      categoria: 'Granos y Concentrados',
      stockActual: kgMaizTransferido > 0 ? kgMaizTransferido : 35000,
      unidadMedida: 'Kg',
      puntoReposicion: 10000,
      costoUnitario: 172.5,
      origen: 'Cosecha Propia UNRC'
    },
    {
      id: 'INS_BOV_04',
      nombre: 'Pellet de Harina de Soja 44% Prot.',
      categoria: 'Granos y Concentrados',
      stockActual: 8500,
      unidadMedida: 'Kg',
      puntoReposicion: 3000,
      costoUnitario: 385.0,
      origen: 'Compra Externa'
    },
    {
      id: 'INS_BOV_05',
      nombre: 'Núcleo Vitamínico-Mineral con Monensina',
      categoria: 'Granos y Concentrados',
      stockActual: 45,
      unidadMedida: 'Bolsas (25 kg)',
      puntoReposicion: 15,
      costoUnitario: 28500,
      origen: 'Compra Externa'
    },
    {
      id: 'INS_BOV_06',
      nombre: 'Vacuna Aftosa Bivalente Biogénesis Bagó',
      categoria: 'Sanidad Veterinaria',
      stockActual: 320,
      unidadMedida: 'Dosis',
      puntoReposicion: 100,
      costoUnitario: 1850,
      origen: 'SENASA Oficial'
    },
    {
      id: 'INS_BOV_07',
      nombre: 'Vacuna Carbunclo Bacteridiano Cepa Sterne',
      categoria: 'Sanidad Veterinaria',
      stockActual: 300,
      unidadMedida: 'Dosis',
      puntoReposicion: 80,
      costoUnitario: 820,
      origen: 'SENASA Oficial'
    },
    {
      id: 'INS_BOV_08',
      nombre: 'Caravanas Oficiales con Chip RFID SENASA',
      categoria: 'Identificación Oficial',
      stockActual: 85,
      unidadMedida: 'Dispositivos',
      puntoReposicion: 40,
      costoUnitario: 3200,
      origen: 'SENASA Oficial'
    }
  ];

  const inventarioFiltrado = inventario.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const valorizacionTotal = inventario.reduce((acc, i) => acc + (i.stockActual * i.costoUnitario), 0);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Encabezado */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1.5 ${theme.iconBg} rounded-lg`}>
              <Boxes className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526b5c]">
              Gestión Comercial Bovina · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#14281d] tracking-tight">
            Stock de Insumos Ganaderos & Materias Primas
          </h1>
          <p className="text-xs text-[#526b5c] mt-0.5">
            Inventario físico de forrajes, silos, grano propio transferido, sales minerales, vacunas SENASA y caravanas RFID
          </p>
        </div>

        <div className="px-3.5 py-2 bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-xs font-mono">
          <span className="text-[#526b5c]">Valuación Total Stock: </span>
          <strong className="text-[#14281d]">{formatMoney(valorizacionTotal)}</strong>
        </div>
      </div>

      {/* Tira de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Silo de Maíz Disponible</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            220 <span className="text-xs font-normal text-[#526b5c]">toneladas</span>
          </div>
          <div className="text-[11px] text-[#1c4b31] font-semibold mt-0.5">Silo bolsa en patio de raciones</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Rollos de Alfalfa</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            140 <span className="text-xs font-normal text-[#526b5c]">unidades</span>
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Reserva invernal cubierta</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Maíz Propio Almacenado</div>
          <div className="text-2xl font-bold text-[#1c4b31] font-mono tabular-nums mt-1">
            {kgMaizTransferido > 0 ? kgMaizTransferido.toLocaleString('es-AR') : '35.000'} <span className="text-xs font-normal text-[#526b5c]">kg</span>
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Silo aéreo UNRC</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Insumos Críticos en Alerta</div>
          <div className="text-2xl font-bold text-[#1c4b31] font-mono tabular-nums mt-1">
            0 <span className="text-xs font-normal text-[#526b5c]">ítems</span>
          </div>
          <div className="text-[11px] text-[#1c4b31] font-semibold mt-0.5">Stock por encima de reposición</div>
        </div>
      </div>

      {/* Tabla de Inventario de Insumos */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5efe7] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#14281d]">Planilla de Existencias y Puntos de Reposición</h2>
            <p className="text-xs text-[#526b5c]">Control volumétrico, costo unitario y origen del aprovisionamiento</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78a587] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar insumo ganadero..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-[#14281d] placeholder-[#8ba895] focus:outline-none focus:border-[#1c4b31]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                <th className="py-2.5 px-3">Insumo Ganadero</th>
                <th className="py-2.5 px-3">Rubro</th>
                <th className="py-2.5 px-3">Origen</th>
                <th className="py-2.5 px-3 text-right">Existencia Actual</th>
                <th className="py-2.5 px-3 text-right">Pto. Reposición</th>
                <th className="py-2.5 px-3 text-right">Costo Unitario ({currency === 'USD' ? 'US$' : '$'})</th>
                <th className="py-2.5 px-3 text-right">Valuación Total</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {inventarioFiltrado.map((item) => {
                const totalItem = item.stockActual * item.costoUnitario;
                const alerta = item.stockActual <= item.puntoReposicion;
                return (
                  <tr key={item.id} className="hover:bg-[#f8faf7] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#14281d]">
                      {item.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-[#526b5c]">
                      {item.categoria}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-semibold ${
                        item.origen === 'Cosecha Propia UNRC' ? 'text-[#1c4b31]' : 'text-[#1e3a8a]'
                      }`}>
                        {item.origen}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                      {item.stockActual.toLocaleString('es-AR')} {item.unidadMedida}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                      {item.puntoReposicion.toLocaleString('es-AR')} {item.unidadMedida}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                      {formatMoney(item.costoUnitario)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                      {formatMoney(totalItem)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        alerta ? 'bg-amber-100 text-amber-800' : 'bg-[#eaf4ec] text-[#1c4b31]'
                      }`}>
                        {alerta ? 'Pedir Reposición' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
