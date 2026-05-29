/**
 * Seed script — BAC Credomatic / Mauricio Retana (retana-001)
 * Creates the full project from scratch: project, requirements, clusters,
 * startups, WSM scores/rationales, rankings, and recommendations.
 *
 * Run with: DATABASE_URL=<url> tsx scripts/seed-bac-retana.ts
 *
 * Passkey: bac2025  (share with the client for portal access)
 */

// dotenv not needed — DATABASE_URL passed via env directly
import bcrypt from "bcryptjs";
import mysql2 from "mysql2/promise";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db.js";
import {
  projects, requirements, clusters, startups,
  wsmScores, rankings, recommendations,
} from "../drizzle/schema.js";

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL not set.");
  process.exit(1);
}

// ── Ensure websiteUrl column exists ───────────────────────────────────────
const rawConn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  await rawConn.execute("ALTER TABLE startups ADD COLUMN IF NOT EXISTS websiteUrl varchar(512)");
  console.log("✅  websiteUrl column ready");
} finally {
  await rawConn.end();
}

const db = await getDb();
if (!db) { console.error("❌  DB unavailable"); process.exit(1); }

// ── Guard: skip if project already exists ─────────────────────────────────
const existing = await db.select().from(projects)
  .where(eq(projects.clientSlug, "bac"))
  .limit(1);
if (existing.some(p => p.problemId === "retana-001")) {
  console.log("⚠️  Project bac/retana-001 already exists. Run update-bac-retana.ts instead.");
  process.exit(0);
}

// ── 1. Create project ──────────────────────────────────────────────────────
const passkeyHash = await bcrypt.hash("bac2025", 10);
await db.insert(projects).values({
  title: "Scouting de Plataformas de Última Milla",
  clientName: "BAC Credomatic",
  industry: "Servicios Financieros",
  geoAllowed: "Todo el mundo",
  geoExcluded: "Ninguna",
  reportDate: "Mayo 2025",
  analystName: "Tomás Valles",
  analystEmail: "tomas@vclstudio.com",
  clientSlug: "bac",
  problemId: "retana-001",
  published: true,
  publishedAt: new Date(),
  passkeyHash,
  universeSize: 13,
  eligibleCount: 12,
  excludedCount: 1,
  scopeDescription: "Evaluación de plataformas tecnológicas para la gestión integral del proceso de distribución y entrega de tarjetas, contratos y materiales financieros de BAC Credomatic en Centroamérica y México.",
} as any);

const [project] = await db.select().from(projects)
  .where(eq(projects.clientSlug, "bac"))
  .limit(1);
const projectId = project.id;
console.log(`✅  Created project ID ${projectId}`);

// ── 2. Create requirements ─────────────────────────────────────────────────
const reqDefs = [
  {
    sortOrder: 1,
    name: "Optimización del uso de recursos",
    weight: 0.15,
    description: "La solución debe contribuir a utilizar mejor los recursos del proceso de distribución y entrega.",
  },
  {
    sortOrder: 2,
    name: "Promoción de Cross-Selling",
    weight: 0.05,
    description: "La solución debería facilitar condiciones para venta cruzada o captura de oportunidades comerciales durante la entrega.",
  },
  {
    sortOrder: 3,
    name: "Optimización de rutas y exactitud de direcciones",
    weight: 0.10,
    description: "La solución debería incorporar o integrarse con capacidades de ubicación, ruteo o referencia geográfica similares a aplicaciones tipo Waze.",
  },
  {
    sortOrder: 4,
    name: "Asignación balanceada a formalizadores",
    weight: 0.15,
    description: "La solución debe permitir asignar productos a distintos formalizadores optimizando productividad y equilibrando esfuerzo.",
  },
  {
    sortOrder: 5,
    name: "Reducción de riesgo",
    weight: 0.25,
    description: "La solución debe identificar, priorizar y gestionar casos con alto riesgo de devolución, dirección dudosa, SLA próximo a vencer o necesidad de contacto adicional, mitigando riesgos operativos asociados a reprocesos, entregas fallidas, información incorrecta y gestión manual.",
  },
  {
    sortOrder: 6,
    name: "Manejo confidencial de la información",
    weight: 0.10,
    description: "La solución debe resguardar información sensible del cliente y cumplir criterios de confidencialidad adecuados para un entorno financiero.",
  },
  {
    sortOrder: 7,
    name: "Interfaz operativa, analítica e impacto",
    weight: 0.10,
    description: "Interfaz para configurar parámetros, revisar rutas, analizar escenarios, gestionar excepciones y monitorear resultados mediante dashboards/reportes que permitan medir reducción de reprocesos, devoluciones, visitas fallidas, tiempos, costos, cumplimiento de SLAs y productividad por formalizador/proveedor.",
  },
  {
    sortOrder: 8,
    name: "Integración con sistemas existentes",
    weight: 0.10,
    description: "Consumir de forma segura la base de paquetes/casos y devolver/cargar resultados a herramientas actuales de formalización, distribución o gestión interna.",
  },
];

for (const r of reqDefs) {
  await db.insert(requirements).values({ projectId, ...r });
}
const allReqs = await db.select().from(requirements).where(eq(requirements.projectId, projectId));
const sortedReqs = allReqs.sort((a, b) => a.sortOrder - b.sortOrder);
console.log(`✅  Created ${allReqs.length} requirements`);

// ── 3. Create clusters ─────────────────────────────────────────────────────
const clusterDefs = [
  { sortOrder: 1, name: "Plataformas Enterprise de Última Milla",    description: "Plataformas full-stack con IA, probadas en entornos enterprise globales" },
  { sortOrder: 2, name: "Optimización de Rutas & Workforce Management", description: "Soluciones especializadas en route intelligence y gestión de fuerza de trabajo" },
  { sortOrder: 3, name: "Fulfillment Fintech & Última Milla Urbana",  description: "Especialistas en logística urbana y entrega de productos fintech" },
];
for (const c of clusterDefs) {
  await db.insert(clusters).values({ projectId, ...c });
}
const allClusters = await db.select().from(clusters).where(eq(clusters.projectId, projectId));
const clusterA = allClusters.find(c => c.name.includes("Enterprise"))!;
const clusterB = allClusters.find(c => c.name.includes("Rutas"))!;
const clusterC = allClusters.find(c => c.name.includes("Fintech"))!;
console.log(`✅  Created ${allClusters.length} clusters`);

// ── 4. Create startups ─────────────────────────────────────────────────────
// Scores (0-4 scale × 2.5 = stored 0-10)
// [req1, req2, req3, req4, req5, req6, req7, req8]
const startupDefs = [
  {
    name: "DispatchTrack", sortOrder: 2, clusterId: clusterA.id, eligible: true,
    hqCity: "San Jose, CA", hqCountry: "EE.UU.", foundedYear: 2010, employeeRange: "220",
    fundingStage: "Series B+" as const, fundingAmount: "$144M", investors: "SpectrumEquity",
    websiteUrl: "https://www.dispatchtrack.com/",
    description: "Software de logística y monitoreo de entregas de última milla en la nube. Planificación territorial con IA, sincronización TMS/CRM tiempo real.",
    scores: [10, 2.5, 10, 10, 10, 10, 10, 10],
    rationales: [
      "Optimización de rutas con IA y costeo automático de rutas (rentabilidad), adaptado a in-house fleets, 3PLs, contractors, o una combinación.",
      "'Text Me Widget' de interacción pre-entrega que capta leads calificados y encuestas post-entrega; habilita interacción comercial, no un módulo pleno de cross-selling.",
      "Plataforma de última milla con optimización de rutas por IA y mejor ruta por camión; geolocalización en tiempo real.",
      "Determina la mejor ruta y carga por camión y gestióna el dispatch (Driver AI); asignación por conductor sólida.",
      "Track & Trace con traza de auditoría que combate falsa responsabilidad, gestión de excepciones desde el dashboard y prueba de entrega geoetiquetada/fechada.",
      "Enterprise-grade best practices to protect customers. SOC 2 compliant",
      "Dashboard en tiempo real con KPIs personalizables y reportes; conecta con Power BI/Tableau y compara planificado vs. real.",
      "Buena integración con sistemas; Total Visibility unifica datos propios y de 3PL en un solo panel.",
    ],
    narrative: "DispatchTrack ofrece optimización de rutas con IA y costeo automático por ruta — una ventaja directa para medir la rentabilidad por intento de entrega que hoy BAC no cuantifica. Total Visibility unifica datos propios y de 3PL, su Driver AI gestiona el dispatch y el Text Me Widget pre-entrega capta leads calificados (puntaje 2 en cross-selling). La certificación de seguridad específica es ligera para entorno bancario, lo que requeriría validación. Se recomienda como solución probada con 2,500+ clientes y 180M entregas/año, ideal para escala enterprise.",
    rank: 2, wsmScore: 9.625, tier: 2,
  },
  {
    name: "FarEye", sortOrder: 1, clusterId: clusterA.id, eligible: true,
    hqCity: "Chicago, IL", hqCountry: "EE.UU.", foundedYear: 2013, employeeRange: "596",
    fundingStage: "Series B+" as const, fundingAmount: "$191M total", investors: "TCV, Dragoneer Investment Group, Eight Roads Ventures, Elevation Capital",
    websiteUrl: "https://fareye.com/",
    description: "Plataforma SaaS de delivery logistics con IA para gestionar, rastrear y monitorear operaciones de carriers y shippers. Reduce 27% tiempo, 57% riesgos.",
    scores: [10, 7.5, 10, 10, 10, 10, 10, 10],
    rationales: [
      "Con el uso de su herramienta Pilot prometen una reducción de tiempo humano de 10 horas a 60 minutos. Comunicandose automáticamente con repartidores, recalculando asignación de rutas, monitoreando y solucionando problemas de ruteo.",
      "Delivery status page con branding para clientes, facilita el cross selling con personalised adds",
      "Tecnología 'geosmart' que convierte direcciones no estándar en smart codes (exactitud tipo Waze) y Smart Suggestións con IA.",
      "Asigna órdenes considerando capacidad del vehículo, tráfico, zonas/horarios de servicio, preferencias y familiaridad del conductor con la zona.",
      "FarEye gestióna el cumplimiento de SLAs al gestiónar el trafico, capacidad de vehiculos y las habilidades de los conductores. Con uso de IA se definen las rutas de entrega y se mantiene al cliente informado sobre tiempos estimados de entrega. Prometiendo una reducción de entregas no realizadas de hasta 25%.",
      "Security Of IT Infrastructure And Its Related Assets, Viz. Information, Computer Systems, Network Elements, Related Services Are Vital Importance Certificaciónes, ISO 27001:2018\nISO 27001:2013",
      "FarEye cuenta con una plataforma de análisis de medición de tendencias y KPIs, permitiendo tomar decisiones, evaluar cumplimiento de SLA's al igual que analizando la productividad de los repartidores.",
      "FarEye tiene capacidades de integración con su API. Mencionan integraciónes con WMS, OMS, ERP, CRM al igual que con porvedores de logística externos.",
    ],
    narrative: "FarEye obtiene el puntaje perfecto: cumple los 8 criterios al máximo nivel. Su tecnología geosmart convierte direcciones no estándar en smart codes (exactitud tipo Waze, requisito explícito del cliente), su herramienta Pilot reduce el tiempo humano de planificación de 10 horas a 60 minutos y su gestión de SLAs cubre tráfico, capacidad de vehículos y habilidades del conductor. Cuenta con certificaciones ISO 27001 + SOC 2 y experiencia con clientes como DHL, UPS y Walmart. Es la opción más completa de extremo a extremo para el problema de logística de entrega de tarjetas de BAC y se recomienda como proveedor principal para un piloto inmediato.",
    rank: 1, wsmScore: 9.875, tier: 1,
  },
  {
    name: "Bringg", sortOrder: 5, clusterId: clusterA.id, eligible: true,
    hqCity: "Tel Aviv", hqCountry: "Israel", foundedYear: 2013, employeeRange: "201",
    fundingStage: "Series B" as const, fundingAmount: "$50M+", investors: "Siemens Next47, Salesforce Ventures, Coca-Cola",
    websiteUrl: "https://www.bringg.com/",
    description: "Plataforma tecnológica para gestión de logística de última milla. Orquestación de entrega enterprise con AI routing y customer communication.",
    scores: [10, 2.5, 7.5, 10, 10, 10, 10, 10],
    rationales: [
      "Orquestación enterprise con AI routing y modelo mixto (flota propia + 3PL) que optimiza la operación de última milla.",
      "Comunicación con el cliente durante la entrega (superficie de marca); branding en la entrega.",
      "Ruteo con IA para última milla a escala enterprise.",
      "Asignación y orquestación de conductores/flota (propios y 3PL) con dispatch inteligente.",
      "Gestión de excepciones y comunicación al cliente con cumplimiento de SLA en tiempo real; priorización específica de riesgo parcial, cliente puede reagendar entregas.",
      "Certificaciónes ISO/IEC 27001 (renovada anualmente) y SOC 2 Tipo 2, más controles HIPAA (Trust Center de Bringg). Nivel adecuado para entorno financiero.",
      "Dashboards y analítica de orquestación con visibilidad en tiempo real.",
      "Integraciónes enterprise (respaldo de Salesforce Ventures) y modelo multi-fuente (propio + 3PL).",
    ],
    narrative: "Bringg orquesta última milla a escala enterprise con un modelo mixto (flota propia + 3PL), ideal para BAC si combina formalizadores internos con servicios tercerizados. Sus certificaciones ISO/IEC 27001 + SOC 2 Tipo 2 + controles HIPAA son las más sólidas para datos sensibles como contratos y tarjetas. El respaldo de Salesforce Ventures asegura integraciones empresariales. Su única debilidad relativa es el cross-selling, limitado a comunicación de marca durante la entrega. Se recomienda para clientes BAC que requieran orquestar formalizadores diversos con control central.",
    rank: 5, wsmScore: 9.375, tier: 2,
  },
  {
    name: "Wise Systems", sortOrder: 4, clusterId: clusterA.id, eligible: true,
    hqCity: "Boston, MA", hqCountry: "EE.UU.", foundedYear: 2015, employeeRange: "56",
    fundingStage: "Series A" as const, fundingAmount: "$30M+", investors: "Valo Ventures, Gradient Ventures, Ford, Techstars",
    websiteUrl: "https://www.wisesystems.com/",
    description: "AI-powered route optimization y workforce management con dispatch automático sin intervención manual.",
    scores: [10, 2.5, 10, 10, 10, 10, 10, 7.5],
    rationales: [
      "Optimización autónoma con ML que reduce kilómetros y mejora utilización de flota; Strategic Planner para planeación de territorios/recursos.",
      "Delivery status page con branding para clientes, facilita el cross selling",
      "Ruteo dinámico con ML, re-secuenciación ante tráfico y ETAs precisas en tiempo real.",
      "Despacho autónomo: decisiones de despliegue de conductores/vehículos por software, zonas por preferencia del conductor y transferencia de paradas entre conductores (mejor ajuste a 'balanceo de formalizadores').",
      "Gestión de excepciones, prueba de entrega (firma, código de barras, foto, notas) y reducción de entregas tardías; priorización específica de riesgo parcial.",
      "Wise Systems utilizes enterprise-grade best practices to protect our customers. SOC 2 compliant",
      "Performance Manager mide on-time % por ruta y por conductor, volúmenes de tareas y planificado vs. real (productividad por formalizador).",
      "Plataforma cloud que importa órdenes e integra vía API; amplitud de integración enterprise por validar.",
    ],
    narrative: "Wise Systems alcanza el segundo lugar con un dispatch autónomo basado en ML que elimina la intervención manual en la asignación, atacando directamente el dolor de los reprocesos. Su Performance Manager mide on-time por ruta y por conductor — métricas clave para el alto reproceso reportado por BAC. Cumple SOC 2 y reduce kilómetros con re-secuenciación dinámica ante tráfico. Su única limitación es una integración enterprise por validar; aun así, es una solución de primer nivel para el entorno operativo y se recomienda como segunda opción de piloto o como capa de optimización si BAC priza el dispatch automatizado.",
    rank: 4, wsmScore: 9.375, tier: 2,
  },
  {
    name: "Ravent", sortOrder: 6, clusterId: clusterA.id, eligible: true,
    hqCity: "Miguel Hidalgo, CDMX", hqCountry: "México", foundedYear: 2019, employeeRange: "6",
    fundingStage: null, fundingAmount: "N/A", investors: "N/A",
    websiteUrl: "https://ravent.com/",
    description: "Plataforma para gestión de cumplimiento de servicios (fulfillment), órdenes y transporte. Centraliza pedidos de múltiples canales y orquesta el fulfillment entre equipos y ubicaciones. Automatiza el proceso order-to-cash.",
    scores: [10, 10, 10, 10, 10, 2.5, 10, 10],
    rationales: [
      "RAVENT tiene capacidades sólidas de orchestration logística y fulfillment end-to-end. Su plataforma optimiza asignaciones, automatiza workflows, coordina recursos y mejora la utilización operativa mediante routing inteligente, automatización de tareas y monitoreo centralizado.",
      "La solución incorpora capacidades de customer communication omnicanal, workflows automatizados y engagement contextual durante el proceso de entrega/formalización. Aunque no es una plataforma comercial especializada, sí podría habilitar oportunidades de cross-selling o comunicación comercial contextualizada.",
      "RAVENT incluye optimización de rutas, tracking en tiempo real, ETAs dinámicos, geofencing y navegación integrada. La plataforma está diseñada específicamente para coordinar operaciones de campo y entregas con visibilidad en tiempo real.",
      "La plataforma cuenta con capacidades de task assignment, dispatching y workload orchestration. Permite distribuir órdenes/casos entre distintos operadores o equipos, monitorear productividad y coordinar ejecución operativa de manera balanceada.",
      "Este es uno de los puntos más fuertes de RAVENT. La solución incorpora SLA monitoring, exception management, customer re-engagement, alertas automáticas, workflows de seguimiento, ETAs dinámicos y automatización de excepciones para mitigar reprocesos y entregas fallidas.",
      "No cuentan con informacion detallando el manejo de la informacion ni hacen alusion a poseer una certificacion que los respalde",
      "Tienen dashboards operativos, KPIs, analytics de utilización, live tracking, exception management, workflow builder y monitoreo de productividad. Muy alineado al requerimiento.",
      "Muy fuerte. APIs centralizadas, multi-provider orchestration e integración omnicanal son prácticamente core del producto.",
    ],
    narrative: "Ravent ingresa al comparativo en el sexto lugar (WSM 9.25) con desempeño sobresaliente en 7 de 8 criterios. Su plataforma de fulfillment orchestration centraliza pedidos multi-canal, automatiza el flujo order-to-cash y coordina recursos de campo con routing inteligente, ETAs dinámicos, SLA monitoring y exception management automatizado — una cobertura end-to-end directamente alineada al problema de entrega de BAC. Cuenta con task dispatching, workload balancing, geofencing y APIs multi-proveedor que facilitan la integración con el ecosistema tecnológico existente. Su único punto débil es la ausencia de certificaciones de seguridad documentadas (ISO 27001 / SOC 2), elemento crítico para el manejo de información bancaria sensible que deberá validarse en due diligence. Empresa joven (2019, 6 empleados), sin funding externo, lo que implica riesgo adicional de escalabilidad y soporte. Se recomienda considerar para piloto dentro del Cluster Enterprise una vez que presente evidencia de controles de seguridad certificados.",
    rank: 6, wsmScore: 9.25, tier: 2,
  },
  {
    name: "SimpliRoute", sortOrder: 3, clusterId: clusterB.id, eligible: true,
    hqCity: "Santiago", hqCountry: "Chile", foundedYear: 2014, employeeRange: "125",
    fundingStage: "Series A" as const, fundingAmount: "$11M", investors: "TheVentureCity, LatamList, Nuto",
    websiteUrl: "https://simpliroute.com/",
    description: "Smart Logistics con IA/ML para route optimization, geocodificación y workforce management. 120+ clientes en México, 26 países.",
    scores: [10, 0, 10, 10, 10, 10, 10, 10],
    rationales: [
      "Optimización de rutas con uso da IA para reducir vehículos necesarios y kilómetros recorridos. Cuenta con asignación por capacidad/habilidades de vehículo, agrupación de flotas y zonificación personalizada por repartidor.",
      "Sin cross-selling como parte del producto. Software específico de gestión logística.",
      "Consiste de capacidades como optimización don tráfico en tiempo real, edición de rutas, alertas predictivas, tiempo estimado de llegada y rastreo en vivo para el cliente.",
      "Optimización de rutas con uso de IA para reducir la cantidad de vehículos en la flota, asignación por capacidad/habilidades del vehículo, agrupación de flotas y zonificación personalizada por repartidor/formalizador. \"Al usar este optimizador, tus visitas se asignarán de manera equilibrada a cada uno de los vehículos disponibles\"",
      "Se comunica el tiempo exacto de entrega con actualizaciones a través de Email, SMS, WhatsApp y LiveTracking. Facilitando la comunicación de manera que se reduce el riesgo de una entrega fallida con necesidad de reproceso.",
      "Cuenta con certificación ISO 27000 como Sistema de Gestión de Seguridad de la Información",
      "SLA se pueden atender con la planeación de asignación de entregas por fecha. Consiste de monitoreo en tiempo real, dashboard integrál, generación de reportes a la medida al igual que machine learning para optimizar en base a historial.",
      "Plataforma cloud con APIs e integraciónes. Manejan integraciónes visa SimpliRoute Direct, Zapier y \"custom made\" con uso de su API.",
    ],
    narrative: "SimpliRoute es el líder LATAM del comparativo: cumple los 8 criterios y aporta 120+ clientes en México con casos comprobados de 25-35% de reducción de costos logísticos. Cuenta con ISO 27001 (único en su cluster), ruteo con ML, georreferenciación con ventanas horarias y comunicación multicanal (Email/SMS/WhatsApp/LiveTracking) que reduce devoluciones por ausencia. Su debilidad es el cross-selling, no contemplado en la plataforma. Se recomienda como piloto LATAM más alineado culturalmente al equipo de Distribución y como benchmark de mercado regional.",
    rank: 3, wsmScore: 9.5, tier: 2,
  },
  {
    name: "OneRail", sortOrder: 8, clusterId: clusterB.id, eligible: true,
    hqCity: "Orlando, FL", hqCountry: "EE.UU.", foundedYear: 2018, employeeRange: "122",
    fundingStage: "Series B" as const, fundingAmount: "$54.5M", investors: "Piva Capital, Arsenal Growth Equity",
    websiteUrl: "https://www.onerail.com/",
    description: "Delivery fulfillment SaaS con multi-carrier network (100+ carriers en una API). Última milla para enterprise shippers con SLA tracking.",
    scores: [7.5, 0, 7.5, 10, 10, 10, 7.5, 10],
    rationales: [
      "Con uso de IA se optimiza el modo de envío, carrier, costo y capacidad, con redundancia de red. utilizando su plataforma OmniPoint.",
      "PV — sin evidencia de cross-selling en la entrega.",
      "Se cumple el requisito ya que cuentan con un app llamado OneRail el cual facilita a los repartidores la navegación con GPS y Llamadas o texto con clientes para facilitar entregas.",
      "OneRail facilita la asignación al optimizar en base a los repartidores disponibles y sus capacidades específicas. Maximizando la utilización y reduciendo costos.",
      "Optimización de rutas con uso de IA para reducir la cantidad de vehículos en la flota, asignación por capacidad/habilidades del vehículo, agrupación de flotas y zonificación personalizada por repartidor/formalizador. \"Al usar este optimizador, tus visitas se asignarán de manera equilibrada a cada uno de los vehiculos disponibles\"",
      "Cumplen con certificaciónes ISO 27001:2022 & SOC 2 en el manejo de la seguridad de la información.",
      "OneRail menciona la capacidad de gestiónar excepciones \"Exception Assist\" al intervenir con un equipo especializado en casos necesarios. También cuentan con un sistema de gestión unificado en el que se consolida la información.",
      "OneRail menciona integraciónes específicamente con IBM y SAP como sus fundamentos de crecimiento y desarrollo. Al igual que integradores de sistema y socios estratégicos de tecnología. Incluyendo APIs con alta capacidad de personalización.",
    ],
    narrative: "OneRail consolida 100+ carriers en una sola API con SLA tracking en tiempo real, lo que reduce el riesgo de devolución al cambiar dinámicamente de proveedor ante fallas. Su Exception Assist combina IA con un equipo humano que interviene en casos de alto riesgo — un mecanismo directo para mitigar el 80% de reprocesos reportado por BAC. Cuenta con ISO 27001:2022 + SOC 2 y respaldo de IBM y SAP para integración. Su debilidad es cross-selling. Se recomienda si BAC busca una capa multi-carrier sin migrar el flujo actual.",
    rank: 8, wsmScore: 8.625, tier: 2,
  },
  {
    name: "Routific", sortOrder: 10, clusterId: clusterB.id, eligible: true,
    hqCity: "Vancouver", hqCountry: "Canadá", foundedYear: 2014, employeeRange: "27",
    fundingStage: "Series A" as const, fundingAmount: "$10M+", investors: "Techstars, Pallasite Ventures",
    websiteUrl: "https://www.routific.com/",
    description: "Route optimization SaaS con enfoque en sostenibilidad. Reduce 30% km, 25% combustible, 50% tiempo de planeación.",
    scores: [7.5, 0, 10, 10, 7.5, 5, 7.5, 10],
    rationales: [
      "Optimización de rutas con reducción de combustible/costo (hasta 25-40%), capacidad de vehículo y ventanas horarias; enfoque PyME/mediano.",
      "PV — sin evidencia de cross-selling en la entrega.",
      "Ruteo con ML y ETAs precisas (tráfico histórico, túneles, puentes); validación de direcciones y definición de parada por coordenadas GPS, rutas navegables desde Waze/Maps.",
      "Reasignación de paradas entre conductores y consideración de velocidades/turnos/prioridades; balanceo de fuerza laboral limitado.",
      "Validación de direcciones (reduce entregas fallidas) y prueba de entrega con foto/firma; sin priorización avanzada de riesgo ni auditoría profunda (señalado como limitación).",
      "Reportado como 'ligero' en cumplimiento profundo y trazas de auditoría de largo plazo; sin certificación publicada.",
      "Edición de rutas, reportes de desempeño del conductor y captura de datos de entrega; ofrece un support dashboard.",
      "API de optimización de rutas líder y fácil de integrar (elegida por software partners); amplitud de integración con sistemas internos. Se puede alimentar directamente con excel files",
    ],
    narrative: "Routific destaca por su API de optimización de rutas líder en el mercado, elegida por integradores de software por su facilidad de embebido. Reduce 30% km, 25% combustible y 50% tiempo de planificación, con validación de direcciones y prueba de entrega con foto/firma. Su debilidad principal es la profundidad en cumplimiento y trazas de auditoría de largo plazo, sin certificaciones específicas para entorno bancario — un riesgo a evaluar. Se recomienda como motor de ruteo embebido en una plataforma BAC existente, no como solución end-to-end.",
    rank: 10, wsmScore: 7.75, tier: 3,
  },
  {
    name: "SmartQuick", sortOrder: 11, clusterId: clusterB.id, eligible: true,
    hqCity: "Bogotá", hqCountry: "Colombia", foundedYear: 2014, employeeRange: "11-50",
    fundingStage: "Seed" as const, fundingAmount: "~$200K COP/mes", investors: "BICTIA",
    websiteUrl: "https://smartquick.ai/",
    description: "SaaS TMS con IA para optimización de rutas, georreferenciación automática, cubicaje 3D, RNDC automático con ML, selección predictiva de flota.",
    scores: [10, 0, 10, 10, 7.5, 5, 5, 7.5],
    rationales: [
      "Ruteo ML (-30% combustible), y selección predictiva de flota; 25-35% de reducción de costos (claims del proveedor).",
      "sin evidencia de cross-selling en la entrega.",
      "Ruteo con ML no supervisado, georreferenciación, ventanas horarias y restricciones viales (orientado a transporte de carga; claims del proveedor).",
      "Asignación predictiva de operadores y selección de flota; orientado a vehículos/monitoreo más que a formalizadores en campo.",
      "Torre de control con monitoreo predictivo (-40% fallas, claim), OCR de documentos y alertas; priorización de riesgo de entrega parcial, incluye agentes de voz con IA que realizan llamadas automáticas a conductores y clientes para confirmar estados de entrega, notificar ETAs y gestiónar novedades",
      "Encriptación AES-256 para datos en reposo y TLS 1.3 para datos en tránsito. Cumplimiento de estándares de seguridad de la información. Nada respecto al entorno financiero",
      "Dashboard IA con Cronómetro ANS con monitoreo en tiempo real, OCR y reportes; analítica operativa sólida.",
      "APIs abiertas y webhooks para integración con ERP y WMS; integración con core bancario por validar.",
    ],
    narrative: "SmartQuick es un TMS colombiano con cubicaje 3D, RNDC automático y selección predictiva de flota. Su torre de control con monitoreo predictivo reclama -40% en fallas y dispone de OCR para documentos — útil para la formalización en campo que BAC requiere. Cuenta con encriptación AES-256 y TLS 1.3, aunque sin certificaciones bancarias estándar (puntaje 2 en confidencialidad). Se recomienda como opción LATAM de menor costo si el piloto se acota a optimización de rutas y no a manejo profundo de información confidencial.",
    rank: 11, wsmScore: 7.625, tier: 3,
  },
  {
    name: "Moova", sortOrder: 9, clusterId: clusterC.id, eligible: true,
    hqCity: "Buenos Aires", hqCountry: "Argentina", foundedYear: 2018, employeeRange: "172",
    fundingStage: "Series A" as const, fundingAmount: "~$20M+", investors: "Toyota Tsusho, Wayra (Telefónica)",
    websiteUrl: "https://moova.io/",
    description: "Flexible urban logistics con IA para optimización de rutas y entregas. Soluciones fintech: envío tarjetas, destrucción, insumos POS, API, logística inversa.",
    scores: [10, 2.5, 10, 7.5, 7.5, 7.5, 10, 7.5],
    rationales: [
      "Moova ofrece servicio de administración de logística de flotas como herramienta para terceros. Ofrece \"herramientas de ruteo, seguimiento y eficiencia en la última milla\" Moova también menciona que \"puedes integrar la tecnología de Moova y optimizar tu sistema de envíos con Inteligencia Artificial y Machine Learning.\"",
      "No se menciona cross-selling directamente. Permiten recolectar datos en la entrega al igual que envío de documentación.",
      "Moova ofrece un sistema de ruteo inteligente, panel de control en tiempo real de envios y tracking. Mencionan una tecnología avanzada de ruteo.",
      "tecnología de ruteo de avanzada pero no una asignación a formalizadores de manera explícita.",
      "Prueba de entrega con foto, escaneo de documento obligatorio en la entrega, verificación de pregunta secreta, al igual que comprobante con firma digital en la entrega.",
      "No se menciona directamente. Mencionan operaciones con Scotiabank y una sección específica sobre su funcionalidad con empresas fintech.",
      "Se menciona el seguimiento en tiempo real y los mecanismos de evidencia de entregas, poseen al menos 4 diferentes vistas en sus dashboards otorgando vision geografica, a través del tiempo y con conteo de entregas exitosas / no exitosas.",
      "Se mencionan integraciónes con uso de su API. También se cuenta con plugins a distintas plataformas. Pendiente validar necesidades de especificad de BAC.",
    ],
    narrative: "Moova es el único especialista del universo evaluado en logística fintech: opera entrega de tarjetas bancarias y POS, exactamente el problema de BAC. Su ruteo inteligente con panel de control en tiempo real es robusto (puntaje 4 en rutas y optimización), aunque no detalla certificaciones bancarias estándar — punto a validar en due diligence. Respaldo de Toyota Tsusho y Wayra (Telefónica) le da estabilidad. Se recomienda fuertemente como piloto vertical: ningún otro proveedor tiene experiencia 1:1 con entrega de plásticos bancarios en LATAM.",
    rank: 9, wsmScore: 8.125, tier: 3,
  },
  {
    name: "Mienvío", sortOrder: 7, clusterId: clusterC.id, eligible: true,
    hqCity: "Monterrey", hqCountry: "México", foundedYear: 2015, employeeRange: "26",
    fundingStage: "Seed" as const, fundingAmount: "~$2M+", investors: "Silicon Valley Angels, BlueBox, 500 Startups, Ahora Money",
    websiteUrl: "https://www.mienvio.mx/",
    description: "Plataforma de orquestación multipaquetería Control Tower para ecommerce y marketplaces. API + SDKs, setup <1 semana, SLA 24-48h, +40,000 códigos postales, 30+ paqueterías.",
    scores: [7.5, 5, 7.5, 10, 10, 10, 10, 10],
    rationales: [
      "Optimiza recursos a nivel multi paquetería, no flota propia. Incluyen la selección automática del mejor carrier por costo, SLA y capacidad. Mencionan 15-25% de ahorro en costos de envío.",
      "Ofrecen entregas de \"Kits de bienvenida\" Por ejemplo, la tarjeta, tokens de seguridad y material promocional",
      "Ruteo automático por costo, SLA y zona",
      "Asigna inteligente de carriers, Reportes de dependencia para migrar entre flotilla propia y terceros.",
      "Se menciona \"Configuramos reglas + SLAs definido como un motor de reglas para OTD, prioridades, restricciones y gestión de excepciones.\" También cuentan con analítica de pre incidencias para prevenir fallas de entrega.",
      "Mienvío menciona experiencia con el manejo de documentos sensibles: Contratos, estados de cuenta y correspondencia regulatoria con cadena de custodia y confirmación de recepción. También se menciona cumplimiento de estándares enterprise, control de acceso y encriptación de datos.",
      "Gestión de incidencias, auditoría continua y reportes de performance.",
      "Mienvío menciona que facilitan la integración de convenios existentes o tarifas negociadas por ellos mismos. Sin reconstruir integraciónes. También se menciona integración vía API REST o dashboard a sistemas de emisión de tarjetas. También mencionan en el tema de integración un API con documentación completa y sandbox en menos de una semana. \"Integración directa con tu ERP, WMS u OMS\"",
    ],
    narrative: "Mienvío opera un Control Tower multi-paquetería con 30+ paqueterías y 40,000+ códigos postales, con cobertura existente en Centroamérica y experiencia documentada en entrega de contratos, estados de cuenta y certificados — análogo al caso de BAC. Su motor de reglas configurable cubre SLAs, prioridades y restricciones de entrega, y su capacidad de integrar convenios existentes facilita el onboarding. Ruteo automático por costo, SLA y zona, es un buen fit para BAC si se trata especialmente de tarjetas.",
    rank: 7, wsmScore: 9.125, tier: 2,
  },
  {
    name: "Cubbo", sortOrder: 12, clusterId: clusterC.id, eligible: true,
    hqCity: "Bogotá / CDMX", hqCountry: "Colombia / México", foundedYear: 2021, employeeRange: "302",
    fundingStage: "Pre-seed" as const, fundingAmount: "$4M+", investors: "SV LatAm Capital, Gerdau Next Ventures, Arsenal Growth Equity",
    websiteUrl: "https://www.cubbo.com/",
    description: "Fulfillment SaaS para e-commerce que transforma espacios urbanos en centros logísticos. Storage, empaque, envío same-day, integración Shopify/Mercado Libre/Amazon.",
    scores: [7.5, 0, 5, 7.5, 7.5, 7.5, 7.5, 7.5],
    rationales: [
      "Asignación inteligente del carrier más eficiente por zona\nen función de costo y servicio Optimiza fulfillment, inventario y red de microbodegas urbanas para acortar tiempos/costos; no optimiza flota ni fuerza de distribución en campo.",
      "Cubbo se especializa en simplificar la logística de envíos y fulfillment. Sin cross selling como area de enfoque.",
      "Modelo de fulfillment; la última milla se ejecuta vía carriers. Sin motor propio de ruteo/geolocalización tipo Waze.",
      "Asignación inteligente del carrier más eficiente por zona",
      "Da visibilidad sobre el estado del pedido\ny disminuye los tickets y cancelaciones por incidentes, le notifica al cliente cuándo le va a llegar el envio y este tiene un tracking de su pedido, cuenta con algunos dashboards sobre rendimiento de carriers",
      "Tienen experiencia directa con 4 bancos diferentes a nivel LATAM",
      "Muestra dashboards para el manejo de paquetería y cliente, invoices, rendimiento de carriers y desempeño en tiempos de entrega",
      "Cuentan con integraciónes hacia diferentes plataformas, integración directa a la app del cliente para desplegar el estatus del envío",
    ],
    narrative: "Cubbo se especializa en fulfillment urbano que convierte espacios en microbodegas logísticas same-day desde CDMX y Bogotá. Tiene experiencia directa con 4 bancos a nivel LATAM (puntaje 3 en confidencialidad), pero su modelo de última milla se ejecuta vía carriers terceros y carece de motor propio de ruteo o geolocalización — un gap importante frente al requisito explícito de capacidad tipo Waze. Se recomienda monitorear su evolución o evaluar para escenarios de almacenamiento de tarjetas pre-entrega, no como solución integral.",
    rank: 12, wsmScore: 6.875, tier: 4,
  },
  {
    name: "boxful", sortOrder: 13, clusterId: clusterC.id, eligible: false,
    hqCity: "San Salvador", hqCountry: "El Salvador", foundedYear: 2023, employeeRange: "11-50",
    fundingStage: "Pre-seed" as const, fundingAmount: "$1.9M", investors: "Innogen Capital, Carao Ventures, Yango Group",
    websiteUrl: "https://goboxful.com/guatemala/",
    description: "Plataforma multicarrier para e-commerce centroamericano con envíos same-day/next-day, lockers inteligentes, fulfillment adaptado a pagos contra entrega.",
    excludedReason: "Reemplazado por Ravent en la evaluación final",
    scores: [5, 0, 5, 2.5, 5, 0, 5, 5],
    rationales: [
      "Plataforma que selecciona automáticamente paquetería + fulfillment. Implementan la optimización de recursos a nivel envío, no para flota propia.",
      "Boxful se especializa en simplificar la logística de envíos y fulfillment. Sin cross selling como area de enfoque.",
      "Ruteo desarrollado por la paquetería/carrier seleccionada, no por boxful.",
      "Asigna a paqueterías, no a formalizadores en campo; no cuenta con balanceo de carga entre repartidores propios, si no eso se gestión por parte de la paquetería de manera interna.",
      "Boxful permite gestiónar envíos con entrega el mismo día. Al tercerizar la logística, no cuenta con métodos de gestión de casos de alto riesgo, ni mdición de SLA's.",
      "Debido a su naturaleza con enfoque en logística de e-commerce, no se enfocan en manejo de información sensible.",
      "Plataforma integral de gestión y seguimiento de envíos. El seguimiento del proceso se puede ver directamente en la plataforma sin necesidad de acudir a los portales de los distintos proveedores de logística.",
      "boxful facilita la conexión de su servicio con sistemas existentes a través de su API. Permitiendo obtener información de envío, cotizaciônes al igual que información general del historial del cliente.",
    ],
    narrative: "boxful muestra el puntaje más bajo del comparativo (38.75): es una solución pre-seed centroamericana enfocada en e-commerce y vendedores sociales, sin experiencia ni capacidades para entorno financiero. Carece de cross-selling, de manejo confidencial de información (puntaje 0) y no tiene motor propio de ruteo. Su valor estaría limitado a entregas en El Salvador a través de lockers inteligentes. No se recomienda para este caso de uso; podría reevaluarse en 12-18 meses si madura su oferta enterprise.",
    rank: null, wsmScore: null, tier: null, // excluded, no ranking
  },
];

// Insert startups and their associated data
for (const s of startupDefs) {
  const { scores, rationales, narrative, rank, wsmScore, tier, excludedReason, ...startupFields } = s;

  await db.insert(startups).values({
    projectId,
    name: startupFields.name,
    description: startupFields.description,
    hqCity: startupFields.hqCity,
    hqCountry: startupFields.hqCountry,
    foundedYear: startupFields.foundedYear,
    employeeRange: startupFields.employeeRange,
    fundingStage: startupFields.fundingStage,
    fundingAmount: startupFields.fundingAmount,
    investors: startupFields.investors,
    websiteUrl: startupFields.websiteUrl,
    clusterId: startupFields.clusterId,
    eligible: startupFields.eligible,
    excludedReason: excludedReason ?? null,
    sortOrder: startupFields.sortOrder,
  } as any);

  const [inserted] = await db.select().from(startups)
    .where(eq(startups.projectId, projectId))
    .then(rows => rows.filter(r => r.name === s.name).slice(-1));

  // WSM scores
  for (let i = 0; i < sortedReqs.length; i++) {
    await db.insert(wsmScores).values({
      projectId,
      startupId: inserted.id,
      requirementId: sortedReqs[i].id,
      humanScore: scores[i],
      rationale: rationales[i],
    });
  }

  // Ranking (only for eligible startups)
  if (rank !== null && wsmScore !== null && tier !== null) {
    await db.insert(rankings).values({
      projectId,
      startupId: inserted.id,
      rank,
      wsmScore,
      tier,
    });
  }

  // Recommendation
  await db.insert(recommendations).values({
    projectId,
    startupId: inserted.id,
    narrative,
    decision: s.eligible ? "recommended" : "not_recommended",
  });

  console.log(`  ✓ ${s.name} (rank ${rank ?? "—"})`);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed BAC Retana completado

  Proyecto ID: ${projectId}
  URL portal:  /bac/retana-001
  Passkey:     bac2025
  Startups:    12 activos + 1 excluido (boxful)
  Rankings:    12 (FarEye #1 → Cubbo #12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
