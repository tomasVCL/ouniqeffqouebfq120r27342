import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const updates = [
  {
    id: 30001,
    narrative: `Carbonfact es la opción principal para WTS Peru. Su motor de LCA automatizado con relleno de datos por IA para información incompleta aborda directamente el desafío central de las cadenas de suministro textil, donde los datos de proveedores de Nivel 2 y 3 son escasos. El módulo nativo de DPP (conforme a ESPR) y la certificación PEF/ISO14040 la convierten en la solución más completa de extremo a extremo en el mercado. Se recomienda como proveedor principal para un piloto inmediato.`
  },
  {
    id: 30002,
    narrative: `Circularise ocupa el segundo lugar con la especialización en DPP más sólida del mercado. Su arquitectura de Prueba de Conocimiento Cero (Zero-Knowledge Proof) permite la divulgación selectiva de datos, algo crítico para WTS Peru al compartir información de la cadena de suministro con marcas sin exponer información competitiva. El módulo de trazabilidad por balance de masa es directamente aplicable a mezclas de algodón y poliéster. Se recomienda como capa de infraestructura DPP junto a Carbonfact o como solución independiente.`
  },
  {
    id: 30003,
    narrative: `Fairly Made ofrece LCA granular a nivel de componente, un diferenciador clave para prendas complejas de múltiples materiales. Su capa de comunicación B2C (QR al consumidor) agrega valor comercial más allá del cumplimiento regulatorio. Su origen francés y su sólida base de clientes de retail en la UE (Decathlon, Galeries Lafayette) aportan casos de referencia relevantes para los clientes de WTS Peru. Se recomienda como capa complementaria de LCA y comunicación.`
  },
  {
    id: 30004,
    narrative: `Kezzler aporta 25 años de experiencia en serialización a escala industrial, con capacidades comprobadas de anti-falsificación. Si bien su motor de LCA es menos desarrollado que el de las tres primeras, su infraestructura de serialización UID es la más madura para la gestión de grandes volúmenes de SKU. Se recomienda para clientes de WTS Peru con catálogos extensos que requieran una trazabilidad físico-digital robusta.`
  },
  {
    id: 30005,
    narrative: `Ecochain está especializada en LCA a nivel de portafolio para manufactura compleja, con sólidas capacidades de Declaración Ambiental de Producto (EPD). Sus herramientas de análisis de puntos críticos ayudan a identificar qué materiales y procesos generan mayor impacto ambiental, lo cual es útil para la planificación estratégica de WTS Peru. Se recomienda para clientes que prioricen la profundidad de LCA y la certificación EPD por encima del cumplimiento de DPP.`
  },
  {
    id: 30006,
    narrative: `TrusTrace es la plataforma más lista para entornos enterprise en el mercado, con trayectoria comprobada en Serie B y arquitectura API-first. Su Knowledge Hub para actualizaciones regulatorias (CSRD, EUDR, ESPR) reduce significativamente la carga de cumplimiento. Se recomienda para clientes grandes de WTS Peru que requieran una columna vertebral de trazabilidad escalable y probada, con DPP como módulo adicional.`
  },
  {
    id: 30007,
    narrative: `Carbon Trail destaca por su enfoque de Copiloto de IA para LCA, que permite evaluaciones más rápidas con benchmarking automático frente a pares de la industria. Al ser una empresa en etapa Seed, conlleva un mayor riesgo de ejecución, pero ofrece la UX más innovadora del mercado. Se recomienda para clientes de WTS Peru dispuestos a co-desarrollar y participar en la hoja de ruta del producto a cambio de condiciones de acceso temprano.`
  },
  {
    id: 30008,
    narrative: `osapiens sobresale en la automatización de flujos de cumplimiento CSRD/EUDR, con la mayor profundidad en automatización de due diligence del mercado. Si bien su motor de LCA es menos especializado que el del nivel superior, su capacidad de automatización regulatoria es incomparable. Se recomienda para clientes de WTS Peru cuyo principal dolor sea el cumplimiento legal y la automatización de auditorías, más que el modelado profundo de LCA.`
  },
  {
    id: 30009,
    narrative: `Myneral Labs muestra potencial como solución accesible de trazabilidad blockchain para PYMEs, pero su etapa Seed y sus referencias enterprise limitadas la hacen demasiado temprana para un despliegue en WTS Peru. La sede en el Reino Unido también genera complejidad regulatoria post-Brexit para el cumplimiento del DPP en la UE. Se recomienda monitorear durante 12 a 18 meses y reevaluar en Serie A con entidad establecida en la UE.`
  },
  {
    id: 30010,
    narrative: `EcoVadis es la red de calificación ESG más grande del mundo, con más de 100.000 proveedores, pero carece de un motor de LCA nativo y de capacidad de generación de DPP, los dos requisitos centrales de este proyecto. Su propuesta de valor es la puntuación ESG de proveedores, no el pasaporte ambiental a nivel de producto. No se recomienda para este caso de uso; podría ser relevante como capa complementaria de evaluación de proveedores dentro de un programa ESG más amplio.`
  }
];

for (const u of updates) {
  await conn.query('UPDATE recommendations SET narrative = ? WHERE id = ?', [u.narrative, u.id]);
  console.log(`Updated ID ${u.id}`);
}

await conn.end();
console.log('Done.');
process.exit(0);
