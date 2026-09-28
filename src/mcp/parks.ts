/**
 * Los 39 parques nacionales de Argentina (Administración de Parques
 * Nacionales), para el servidor MCP de Sliabh (src/mcp/server.ts).
 *
 * Solo datos estables y verificables: nombre, provincias y región APN. Las
 * rutas de cada parque no se copian acá: salen de los mismos datos que usa el
 * sitio (src/data/hubs.ts), enlazadas por `area` ("Parque Nacional …"), así un
 * sendero nuevo en la app aparece solo en el MCP.
 *
 * Plain TS, sin React Native: lo cargan la función de Netlify y los scripts.
 */
export type ParkRegion = 'noroeste' | 'noreste' | 'centro' | 'patagonia-norte' | 'patagonia-austral';

export interface NationalPark {
  slug: string;
  /** Nombre oficial, sin el prefijo "Parque Nacional". */
  name: string;
  provinces: string[];
  region: ParkRegion;
}

export const REGION_LABEL: Record<ParkRegion, { es: string; en: string }> = {
  noroeste: { es: 'Noroeste', en: 'Northwest' },
  noreste: { es: 'Noreste', en: 'Northeast' },
  centro: { es: 'Centro y Cuyo', en: 'Center & Cuyo' },
  'patagonia-norte': { es: 'Patagonia Norte', en: 'Northern Patagonia' },
  'patagonia-austral': { es: 'Patagonia Austral', en: 'Southern Patagonia' },
};

export const NATIONAL_PARKS: NationalPark[] = [
  // Noroeste
  { slug: 'aconquija', name: 'Aconquija', provinces: ['Tucumán'], region: 'noroeste' },
  { slug: 'baritu', name: 'Baritú', provinces: ['Salta'], region: 'noroeste' },
  { slug: 'calilegua', name: 'Calilegua', provinces: ['Jujuy'], region: 'noroeste' },
  { slug: 'campo-de-los-alisos', name: 'Campo de los Alisos', provinces: ['Tucumán'], region: 'noroeste' },
  { slug: 'copo', name: 'Copo', provinces: ['Santiago del Estero'], region: 'noroeste' },
  { slug: 'el-rey', name: 'El Rey', provinces: ['Salta'], region: 'noroeste' },
  { slug: 'los-cardones', name: 'Los Cardones', provinces: ['Salta'], region: 'noroeste' },
  // Noreste
  { slug: 'chaco', name: 'Chaco', provinces: ['Chaco'], region: 'noreste' },
  { slug: 'el-impenetrable', name: 'El Impenetrable', provinces: ['Chaco'], region: 'noreste' },
  { slug: 'laguna-el-palmar', name: 'Laguna El Palmar', provinces: ['Chaco'], region: 'noreste' },
  { slug: 'el-palmar', name: 'El Palmar', provinces: ['Entre Ríos'], region: 'noreste' },
  { slug: 'pre-delta', name: 'Pre-Delta', provinces: ['Entre Ríos'], region: 'noreste' },
  { slug: 'ibera', name: 'Iberá', provinces: ['Corrientes'], region: 'noreste' },
  { slug: 'mburucuya', name: 'Mburucuyá', provinces: ['Corrientes'], region: 'noreste' },
  { slug: 'iguazu', name: 'Iguazú', provinces: ['Misiones'], region: 'noreste' },
  { slug: 'rio-pilcomayo', name: 'Río Pilcomayo', provinces: ['Formosa'], region: 'noreste' },
  { slug: 'islas-de-santa-fe', name: 'Islas de Santa Fe', provinces: ['Santa Fe'], region: 'noreste' },
  // Centro y Cuyo
  { slug: 'ansenuza', name: 'Ansenuza', provinces: ['Córdoba'], region: 'centro' },
  { slug: 'quebrada-del-condorito', name: 'Quebrada del Condorito', provinces: ['Córdoba'], region: 'centro' },
  { slug: 'traslasierra', name: 'Traslasierra', provinces: ['Córdoba'], region: 'centro' },
  { slug: 'campos-del-tuyu', name: 'Campos del Tuyú', provinces: ['Buenos Aires'], region: 'centro' },
  { slug: 'ciervo-de-los-pantanos', name: 'Ciervo de los Pantanos', provinces: ['Buenos Aires'], region: 'centro' },
  { slug: 'lihue-calel', name: 'Lihué Calel', provinces: ['La Pampa'], region: 'centro' },
  { slug: 'sierra-de-las-quijadas', name: 'Sierra de las Quijadas', provinces: ['San Luis'], region: 'centro' },
  { slug: 'el-leoncito', name: 'El Leoncito', provinces: ['San Juan'], region: 'centro' },
  { slug: 'san-guillermo', name: 'San Guillermo', provinces: ['San Juan'], region: 'centro' },
  { slug: 'talampaya', name: 'Talampaya', provinces: ['La Rioja'], region: 'centro' },
  // Patagonia Norte
  { slug: 'laguna-blanca', name: 'Laguna Blanca', provinces: ['Neuquén'], region: 'patagonia-norte' },
  { slug: 'lanin', name: 'Lanín', provinces: ['Neuquén'], region: 'patagonia-norte' },
  { slug: 'los-arrayanes', name: 'Los Arrayanes', provinces: ['Neuquén'], region: 'patagonia-norte' },
  { slug: 'nahuel-huapi', name: 'Nahuel Huapi', provinces: ['Neuquén', 'Río Negro'], region: 'patagonia-norte' },
  { slug: 'lago-puelo', name: 'Lago Puelo', provinces: ['Chubut'], region: 'patagonia-norte' },
  { slug: 'los-alerces', name: 'Los Alerces', provinces: ['Chubut'], region: 'patagonia-norte' },
  // Patagonia Austral
  { slug: 'bosques-petrificados-de-jaramillo', name: 'Bosques Petrificados de Jaramillo', provinces: ['Santa Cruz'], region: 'patagonia-austral' },
  { slug: 'monte-leon', name: 'Monte León', provinces: ['Santa Cruz'], region: 'patagonia-austral' },
  { slug: 'patagonia', name: 'Patagonia', provinces: ['Santa Cruz'], region: 'patagonia-austral' },
  { slug: 'perito-moreno', name: 'Perito Moreno', provinces: ['Santa Cruz'], region: 'patagonia-austral' },
  { slug: 'los-glaciares', name: 'Los Glaciares', provinces: ['Santa Cruz'], region: 'patagonia-austral' },
  { slug: 'tierra-del-fuego', name: 'Tierra del Fuego', provinces: ['Tierra del Fuego'], region: 'patagonia-austral' },
];

/** "Parque Nacional Los Glaciares": el valor de `area` en los datos de rutas. */
export function parkAreaName(p: NationalPark): string {
  return `Parque Nacional ${p.name}`;
}
