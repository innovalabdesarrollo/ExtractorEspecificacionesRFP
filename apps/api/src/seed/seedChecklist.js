/**
 * Seed del checklist interno Lintel (~45 especificaciones).
 */
import { connectDb, getDb, pingDb } from '../db.js';

const CATEGORIES = [
	{ name: 'Áreas construidas', isArchitectural: true, order: 1 },
	{ name: 'Empleados y ocupación', isArchitectural: false, order: 2 },
	{ name: 'Alturas', isArchitectural: true, order: 3 },
	{ name: 'Estructura', isArchitectural: true, order: 4 },
	{ name: 'Iluminación', isArchitectural: false, order: 5 },
	{ name: 'Instalación eléctrica', isArchitectural: false, order: 6 },
	{ name: 'Andenes de carga', isArchitectural: true, order: 7 },
	{ name: 'Piso', isArchitectural: true, order: 8 },
	{ name: 'HVAC', isArchitectural: false, order: 9 },
	{ name: 'Protección contra incendio', isArchitectural: false, order: 10 },
	{ name: 'Requerimientos especiales', isArchitectural: true, order: 11 },
	{ name: 'Fachadas y planta general', isArchitectural: true, order: 12 }
];

const UNITS = [
	{ name: 'Metros cuadrados', symbol: 'm²', measurementType: 'area' },
	{ name: 'Metros', symbol: 'm', measurementType: 'longitud' },
	{ name: 'Pies', symbol: 'ft', measurementType: 'longitud' },
	{ name: 'Pies cuadrados', symbol: 'ft²', measurementType: 'area' },
	{ name: 'Kilovatios', symbol: 'kW', measurementType: 'potencia' },
	{ name: 'Amperios', symbol: 'A', measurementType: 'corriente' },
	{ name: 'Voltios', symbol: 'V', measurementType: 'voltaje' },
	{ name: 'Toneladas de refrigeración', symbol: 'TR', measurementType: 'capacidad' },
	{ name: 'Personas', symbol: 'pax', measurementType: 'cantidad' },
	{ name: 'Unidades', symbol: 'u', measurementType: 'cantidad' },
	{ name: 'Porcentaje', symbol: '%', measurementType: 'proporcion' },
	{ name: 'Lúmenes', symbol: 'lm', measurementType: 'iluminacion' },
	{ name: 'Lux', symbol: 'lx', measurementType: 'iluminacion' },
	{ name: 'PSI', symbol: 'psi', measurementType: 'presion' },
	{ name: 'Texto / condición', symbol: '—', measurementType: 'texto' }
];

/** [categoríaIndex, nombre, clave, unidadSymbol|null, requiresMeasurement, instrucciones, sinónimos] */
const SPECS = [
	[0, 'Área total construida', 'area_total', 'm²', true, 'Busca área total, construction area, building area', ['área total', 'gross area', 'superficie total']],
	[0, 'Área de producción / nave', 'area_produccion', 'm²', true, 'Área de planta industrial o nave', ['nave', 'production floor', 'warehouse area']],
	[0, 'Área de oficinas', 'area_oficinas', 'm²', true, 'Oficinas administrativas', ['office area', 'áreas administrativas']],
	[0, 'Área de almacén', 'area_almacen', 'm²', true, 'Almacén o storage', ['storage', 'warehouse']],
	[0, 'Área de estacionamiento', 'area_estacionamiento', 'm²', true, 'Parking / estacionamiento', ['parking', 'cajones']],
	[0, 'Número de cajones de estacionamiento', 'cajones_estacionamiento', 'u', true, 'Cantidad de cajones', ['parking spaces', 'cajones']],

	[1, 'Número de empleados', 'num_empleados', 'pax', true, 'Headcount / empleados totales', ['empleados', 'workforce', 'headcount']],
	[1, 'Empleados por turno', 'empleados_turno', 'pax', true, 'Personas por turno', ['por turno', 'per shift']],
	[1, 'Número de turnos', 'num_turnos', 'u', true, 'Turnos de operación', ['shifts', 'turnos']],
	[1, 'Horario de operación', 'horario_operacion', '—', false, 'Horarios de trabajo', ['horario', 'operating hours']],

	[2, 'Altura libre a acero', 'altura_libre_acero', 'm', true, 'Clear height to steel', ['clear height', 'altura libre', 'altura a acero']],
	[2, 'Altura a plafón / cielo', 'altura_plafon', 'm', true, 'Altura a plafón', ['ceiling height', 'plafón']],
	[2, 'Altura de entrepiso oficinas', 'altura_entrepiso', 'm', true, 'Altura entrepiso zona oficinas', ['entrepiso', 'mezzanine height']],

	[3, 'Sistema estructural', 'sistema_estructural', '—', false, 'Acero, concreto, precast, etc.', ['estructura', 'structural system', 'steel frame']],
	[3, 'Capacidad de carga de piso', 'capacidad_carga_piso', 'psi', true, 'Floor load capacity', ['live load', 'carga viva', 'psf']],
	[3, 'Separación de columnas', 'separacion_columnas', 'm', true, 'Bay spacing / grid', ['column spacing', 'claro', 'bay']],
	[3, 'Tipo de cubierta', 'tipo_cubierta', '—', false, 'Roof type', ['cubierta', 'roof', 'metal deck']],
	[3, 'Mezzanine / entrepiso', 'mezzanine', '—', false, 'Existencia y área de mezzanine', ['mezzanine', 'entrepiso']],

	[4, 'Nivel de iluminación requerido', 'nivel_iluminacion', 'lx', true, 'Footcandles o lux', ['iluminación', 'footcandle', 'lux', 'fc']],
	[4, 'Tipo de luminarias', 'tipo_luminarias', '—', false, 'LED, fluorescentes, etc.', ['LED', 'luminarias', 'lighting fixtures']],
	[4, 'Iluminación natural / skylights', 'iluminacion_natural', '—', false, 'Skylights o iluminación natural', ['skylight', 'claraboyas']],

	[5, 'Demanda eléctrica estimada', 'demanda_electrica', 'kW', true, 'Potencia eléctrica requerida', ['kW', 'electrical demand', 'carga eléctrica']],
	[5, 'Voltaje de servicio', 'voltaje_servicio', 'V', true, 'Voltaje primario', ['voltaje', 'voltage', '480V', '13.2kV']],
	[5, 'Amperaje de servicio', 'amperaje_servicio', 'A', true, 'Amperaje del servicio', ['amperaje', 'amps', 'service size']],
	[5, 'Respaldo / generador', 'generador_respaldo', '—', false, 'Generador o UPS', ['generator', 'backup', 'UPS']],

	[6, 'Número de andenes de carga', 'num_andenes', 'u', true, 'Dock doors / andenes', ['dock', 'andenes', 'muelles']],
	[6, 'Tipo de andén', 'tipo_anden', '—', false, 'Nivelado, con rampa, etc.', ['dock leveler', 'tipo andén']],
	[6, 'Altura de andén', 'altura_anden', 'm', true, 'Dock height', ['dock height', 'altura andén']],
	[6, 'Área de maniobras de trailers', 'area_maniobras', 'm', true, 'Truck court depth', ['truck court', 'maniobras']],

	[7, 'Tipo de piso', 'tipo_piso', '—', false, 'Concreto pulido, epoxy, etc.', ['piso', 'flooring', 'slab']],
	[7, 'Espesor de losa', 'espesor_losa', 'm', true, 'Slab thickness', ['espesor', 'slab thickness']],
	[7, 'Acabado de piso', 'acabado_piso', '—', false, 'Finish / treatment', ['sealant', 'epoxy', 'pulido']],
	[7, 'Juntas / joint layout', 'juntas_piso', '—', false, 'Control joints', ['juntas', 'joints']],

	[8, 'Sistema HVAC', 'sistema_hvac', '—', false, 'Tipo de HVAC / ventilación', ['HVAC', 'aire acondicionado', 'ventilación']],
	[8, 'Capacidad de enfriamiento', 'capacidad_enfriamiento', 'TR', true, 'Tons of cooling', ['toneladas', 'cooling tons']],
	[8, 'Temperatura objetivo', 'temperatura_objetivo', '—', false, 'Setpoint de temperatura', ['temperatura', 'setpoint']],
	[8, 'Ventilación / ACH', 'ventilacion_ach', '—', false, 'Air changes per hour', ['ACH', 'renovaciones', 'ventilación']],

	[9, 'Sistema contra incendio', 'sistema_incendio', '—', false, 'Sprinklers, ESFR, etc.', ['sprinkler', 'ESFR', 'incendio']],
	[9, 'Clasificación de riesgo', 'clasificacion_riesgo', '—', false, 'Hazard classification', ['hazard', 'riesgo', 'NFPA']],
	[9, 'Hidráulica / presión requerida', 'presion_incendio', 'psi', true, 'Presión de red o bomba', ['psi', 'bomba', 'fire pump']],
	[9, 'Alarmas / detección', 'alarmas_deteccion', '—', false, 'Fire alarm / detection', ['alarma', 'detección', 'smoke']],

	[10, 'Requerimientos de seguridad / access control', 'seguridad_acceso', '—', false, 'Access control, CCTV', ['seguridad', 'CCTV', 'acceso']],
	[10, 'Cuartos limpios / clean room', 'cuartos_limpios', '—', false, 'Clean room class', ['clean room', 'ISO']],
	[10, 'Almacenamiento de químicos / peligrosos', 'almacen_quimicos', '—', false, 'Hazardous storage', ['químicos', 'hazmat']],
	[10, 'Grúas / puentes grúa', 'puentes_grua', '—', false, 'Crane requirements', ['crane', 'grúa', 'toneladas grúa']],

	[11, 'Tipo de fachada', 'tipo_fachada', '—', false, 'Panel, block, glass, etc.', ['fachada', 'facade', 'exterior wall']],
	[11, 'Distribución / layout general', 'layout_general', '—', false, 'Planta general y zonificación', ['layout', 'planta', 'zonificación']],
	[11, 'Accesos peatonales y vehiculares', 'accesos', '—', false, 'Entradas y flujos', ['acceso', 'entrada', 'gate']]
];

await connectDb();
const info = await pingDb();
console.log(`Seed en DB: ${info.dbName}`);

const db = getDb();

await db.collection('units').deleteMany({});
await db.collection('categories').deleteMany({});
await db.collection('specifications').deleteMany({});

const unitDocs = UNITS.map((u) => ({ ...u, isActive: true, createdAt: new Date() }));
const unitRes = await db.collection('units').insertMany(unitDocs);
const unitIds = Object.values(unitRes.insertedIds);
const unitBySymbol = {};
UNITS.forEach((u, i) => {
	unitBySymbol[u.symbol] = unitIds[i];
});

const catDocs = CATEGORIES.map((c) => ({
	name: c.name,
	description: c.name,
	displayOrder: c.order,
	isActive: true,
	isArchitectural: c.isArchitectural,
	createdAt: new Date()
}));
const catRes = await db.collection('categories').insertMany(catDocs);
const catIds = Object.values(catRes.insertedIds);

const specDocs = SPECS.map((row) => {
	const [catIdx, name, key, unitSym, requiresMeasurement, instructions, synonyms] = row;
	return {
		name,
		description: name,
		categoryId: catIds[catIdx],
		unitId: unitSym && unitBySymbol[unitSym] ? unitBySymbol[unitSym] : null,
		altUnitIds: [],
		extractionKey: key,
		requiresMeasurement,
		dataType: requiresMeasurement ? 'numerico' : 'texto',
		evaluationCriteria: {
			instructions,
			synonyms,
			examples: []
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	};
});

await db.collection('specifications').insertMany(specDocs);
await db.collection('checklist_changes').insertOne({
	especificacionClave: '*',
	tipoCambio: 'seed',
	valorAnterior: null,
	valorNuevo: { specs: specDocs.length, categories: catDocs.length, units: unitDocs.length },
	usuarioId: 'seed',
	changedAt: new Date()
});

console.log(`OK: ${catDocs.length} categorías, ${unitDocs.length} unidades, ${specDocs.length} especificaciones`);
process.exit(0);
