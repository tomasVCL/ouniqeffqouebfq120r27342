/**
 * Seed script — BAC Credomatic / Mauricio Retana
 * Proyecto: Logística de entrega de tarjetas con altos reprocesos
 * Workshop: CRTW26
 *
 * Run with: DATABASE_URL=<url> tsx scripts/seed-bac-retana.ts
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  createProject,
  upsertRequirement,
  upsertCluster,
  upsertStartup,
  upsertWsmScore,
  upsertRanking,
  upsertRecommendation,
  updateProject,
} from "../server/db.js";

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL not set. Run: DATABASE_URL=<url> tsx scripts/seed-bac-retana.ts");
  process.exit(1);
}

// ── Passkey ────────────────────────────────────────────────────────────────
const PASSKEY = "BAC2@26-qweyukc";
const passkeyHash = await bcrypt.hash(PASSKEY, 10);

// ── Project ────────────────────────────────────────────────────────────────
console.log("📁 Creando proyecto BAC...");
const projectId = await createProject({
  title: "Logística de Entrega de Tarjetas con Altos Reprocesos",
  clientName: "BAC Credomatic",
  industry: "Finanzas / Banca",
  geoAllowed: "Costa Rica y Centroamérica",
  geoExcluded: "Resto del mundo",
  reportDate: "Mayo 2026",
  analystName: "Equipo de Analistas de VCL studio",
  analystEmail: "hola@vclstudio.com",
  scopeDescription:
    "BAC Credomatic enfrenta más del 80% de reprocesos en su proceso de entrega de tarjetas y productos financieros. El dolor central está en la coordinación, asignación a formalizadores, optimización de rutas y seguimiento del flujo de entrega. Se evaluaron 12 startups especializadas en logística de última milla para identificar la solución más adecuada.",
  universeSize: 12,
  eligibleCount: 12,
  excludedCount: 0,
  clientSlug: "bac",
  problemId: "retana-001",
  passkeyHash,
  published: true,
  publishedAt: new Date(),
});
console.log(`✅  Proyecto creado — ID: ${projectId}`);

// ── Requirements ───────────────────────────────────────────────────────────
console.log("\n📋 Insertando requisitos...");
const reqDefs = [
  {
    name: "Optimización del uso de recursos",
    description: "La solución debe contribuir a utilizar mejor los recursos del proceso de distribución y entrega.",
    weight: 0.15,
    mandatory: true,
    sortOrder: 1,
  },
  {
    name: "Promoción de Cross-Selling",
    description: "La solución debería facilitar condiciones para venta cruzada o captura de oportunidades comerciales durante la entrega.",
    weight: 0.05,
    mandatory: false,
    sortOrder: 2,
  },
  {
    name: "Optimización de rutas y exactitud de direcciones",
    description: "La solución debería incorporar o integrarse con capacidades de ubicación, ruteo o referencia geográfica similares a aplicaciones tipo Waze.",
    weight: 0.10,
    mandatory: true,
    sortOrder: 3,
  },
  {
    name: "Asignación balanceada a formalizadores",
    description: "La solución debe permitir asignar productos a distintos formalizadores optimizando productividad y equilibrando esfuerzo.",
    weight: 0.15,
    mandatory: true,
    sortOrder: 4,
  },
  {
    name: "Reducción de riesgo",
    description: "La solución debe identificar, priorizar y gestionar casos con alto riesgo de devolución, dirección dudosa o incumplimiento de SLA.",
    weight: 0.25,
    mandatory: true,
    sortOrder: 5,
  },
  {
    name: "Manejo confidencial de la información",
    description: "La solución debe resguardar información sensible del cliente y cumplir criterios de confidencialidad adecuados para un entorno financiero.",
    weight: 0.10,
    mandatory: true,
    sortOrder: 6,
  },
  {
    name: "Interfaz operativa, analítica e impacto",
    description: "Interfaz para configurar parámetros, revisar rutas, analizar escenarios, gestionar excepciones y monitorear desempeño.",
    weight: 0.10,
    mandatory: false,
    sortOrder: 7,
  },
  {
    name: "Integración con sistemas existentes",
    description: "Consumir de forma segura la base de paquetes/casos y devolver/cargar resultados a herramientas actuales del cliente.",
    weight: 0.10,
    mandatory: false,
    sortOrder: 8,
  },
];

const reqIds: number[] = [];
for (const r of reqDefs) {
  const id = await upsertRequirement({ projectId, ...r });
  reqIds.push(id!);
  console.log(`  ✓ [${id}] ${r.name}`);
}

// ── Clusters ───────────────────────────────────────────────────────────────
console.log("\n🏷️  Insertando clusters...");
const clusterDefs = [
  {
    name: "Enterprise Full-Service Platforms",
    description: "Plataformas full-stack con IA, probadas en entornos enterprise de alta escala. Capacidad para transformar la operación logística completa de BAC.",
    color: "#3B82F6",
    sortOrder: 1,
  },
  {
    name: "LATAM Route Intelligence & Workforce",
    description: "Soluciones especializadas en route intelligence y gestión de fuerza laboral, con fuerte presencia LATAM o capacidades técnicas diferenciadoras para el modelo operativo BAC.",
    color: "#10B981",
    sortOrder: 2,
  },
  {
    name: "Fintech Delivery & Urban Fulfillment",
    description: "Especialistas en logística urbana y entrega de productos financieros. Alta afinidad con el modelo operativo de BAC: tarjetas, POS, insumos bancarios y gestión fintech de última milla.",
    color: "#F59E0B",
    sortOrder: 3,
  },
];

const clusterIds: number[] = [];
for (const c of clusterDefs) {
  const id = await upsertCluster({ projectId, ...c });
  clusterIds.push(id!);
  console.log(`  ✓ [${id}] ${c.name}`);
}
const [clusterA, clusterB, clusterC] = clusterIds;

// ── Startups ───────────────────────────────────────────────────────────────
console.log("\n🚀 Insertando startups...");
const startupDefs = [
  // Cluster A — Enterprise Full-Service Platforms
  {
    name: "FarEye",
    description: "Plataforma SaaS de delivery logistics con IA para gestionar, rastrear y monitorear operaciones de carriers y shippers.",
    hqCity: "Chicago, IL / Noida",
    hqCountry: "EE.UU. / India",
    foundedYear: 2013,
    fundingStage: "Series B+" as const,
    employeeRange: "596",
    fundingAmount: "$191M total",
    investors: "TCV, Dragoneer Investment Group, Eight Roads Ventures, Elevation Capital",
    clientsRef: "DHL, UPS, Walmart, FedEx, Domino's, Hilti, J&J",
    keyDifferentiator: "Plataforma AI-first con motor geosmart, dispatch dinámico y SOC 2 + HIPAA. Top score por cobertura total de los 8 criterios.",
    strategicFit: "Suite AI-powered con reducción de 27% en tiempos y 57% en riesgos operativos. Clientes DHL, UPS, Walmart, FedEx. Serie E ($191M). Alta madurez para entornos financieros regulados.",
    clusterId: clusterA,
    sortOrder: 2,
    eligible: true,
  },
  {
    name: "Wise Systems",
    description: "AI-powered route optimization y workforce management con dispatch automático sin intervención manual.",
    hqCity: "Boston, MA / Londres",
    hqCountry: "EE.UU. / UK",
    foundedYear: 2015,
    fundingStage: "Series A" as const,
    employeeRange: "56",
    fundingAmount: "$30M+",
    investors: "Valo Ventures, Gradient Ventures, Ford, Techstars",
    clientsRef: "Enterprise EE.UU./UK",
    keyDifferentiator: "Dispatch autónomo sin intervención humana + Performance Manager. Elimina error humano en asignación y mide on-time por conductor.",
    strategicFit: "Dispatch automático sin intervención manual + workforce management con IA. Elimina error humano en asignación de formalizadores. Presencia en EE.UU. y UK; modelo enterprise probado.",
    clusterId: clusterA,
    sortOrder: 4,
    eligible: true,
  },
  {
    name: "Bringg",
    description: "Plataforma tecnológica para gestión de logística de última milla. Orquestación de entrega enterprise con AI routing y customer communication.",
    hqCity: "Tel Aviv / Nueva York",
    hqCountry: "Israel / EE.UU.",
    foundedYear: 2013,
    fundingStage: "Series B+" as const,
    employeeRange: "201",
    fundingAmount: "$50M+",
    investors: "Siemens Next47, Salesforce Ventures, Coca-Cola",
    clientsRef: "Home Depot, Walmart, McDonald's, Coca-Cola, Tesco, L'Oréal, Maersk, Mercadona",
    keyDifferentiator: "Orquestación enterprise con modelo mixto propio+3PL, ISO 27001 + SOC 2 + controles HIPAA. Respaldo de Salesforce Ventures.",
    strategicFit: "Orquestación de última milla enterprise con un modelo mixto (flota propia + 3PL). Certificaciones ISO/IEC 27001 + SOC 2 Tipo 2 + controles HIPAA. Respaldo de Salesforce Ventures.",
    clusterId: clusterA,
    sortOrder: 3,
    eligible: true,
  },
  {
    name: "DispatchTrack",
    description: "Software de logística y monitoreo de entregas de última milla en la nube. Planificación territorial con IA, sincronización TMS/CRM tiempo real.",
    hqCity: "San Jose, CA",
    hqCountry: "EE.UU.",
    foundedYear: 2010,
    fundingStage: "Series B+" as const,
    employeeRange: "220",
    fundingAmount: "$144M",
    investors: "Spectrum Equity",
    clientsRef: "Enterprise EE.UU. (2,500+ clientes globales)",
    keyDifferentiator: "Optimización de rutas con IA y costeo automático por ruta (rentabilidad). Total Visibility unifica datos propios y 3PL.",
    strategicFit: "Plataforma enterprise con IA para planificación territorial y sincronización TMS/CRM en tiempo real. 2,500+ clientes globales. Elimina operación manual con Excel.",
    clusterId: clusterA,
    sortOrder: 1,
    eligible: true,
  },
  // Cluster B — LATAM Route Intelligence & Workforce
  {
    name: "SimpliRoute",
    description: "Smart Logistics con IA/ML para route optimization, geocodificación y workforce management. 120+ clientes en 26 países.",
    hqCity: "Santiago",
    hqCountry: "Chile",
    foundedYear: 2014,
    fundingStage: "Series A" as const,
    employeeRange: "125",
    fundingAmount: "$11M",
    investors: "TheVentureCity, LatamList, Nuto",
    clientsRef: "120+ clientes en México (transporte, retail, CPG, e-commerce)",
    keyDifferentiator: "IA/ML nativo LATAM con ISO 27001. 120+ clientes en México y casos comprobados de reducción 25-35% de costos logísticos.",
    strategicFit: "Smart Logistics con IA/ML nativo LATAM. 120+ clientes en México, presencia en 26 países. Geocodificación avanzada + workforce management con precios adaptados a mercados latinoamericanos.",
    clusterId: clusterB,
    sortOrder: 5,
    eligible: true,
  },
  {
    name: "OneRail",
    description: "Delivery fulfillment SaaS con multi-carrier network (100+ carriers en una API). Última milla para enterprise shippers con SLA tracking.",
    hqCity: "Orlando, FL",
    hqCountry: "EE.UU.",
    foundedYear: 2018,
    fundingStage: "Series B" as const,
    employeeRange: "122",
    fundingAmount: "$54.5M",
    investors: "Piva Capital, Arsenal Growth Equity",
    clientsRef: "Amazon, FedEx, DHL partners",
    keyDifferentiator: "Red de 100+ carriers integrados en una API + Exception Assist con equipo humano. ISO 27001:2022 + SOC 2 para datos sensibles.",
    strategicFit: "Red de 100+ carriers integrados en una API con SLA tracking tiempo real. Serie B ($54.5M). Permite activar carriers externos según demanda pico sin infraestructura adicional.",
    clusterId: clusterB,
    sortOrder: 7,
    eligible: true,
  },
  {
    name: "Routific",
    description: "Route optimization SaaS con enfoque en sostenibilidad. Reduce 30% km, 25% combustible, 50% tiempo de planeación.",
    hqCity: "Vancouver / Londres",
    hqCountry: "Canadá / UK",
    foundedYear: 2014,
    fundingStage: "Series A" as const,
    employeeRange: "27",
    fundingAmount: "$10M+",
    investors: "Techstars, Pallasite Ventures",
    clientsRef: "FedEx, UPS, Walmart",
    keyDifferentiator: "API de optimización de rutas líder, fácil de integrar. Reduce 30% km, 25% combustible y 50% tiempo de planificación.",
    strategicFit: "Route optimization SaaS con foco en sostenibilidad. Reduce 30% km, 25% combustible, 50% tiempo de planeación. API robusta y rutas navegables desde Waze/Maps.",
    clusterId: clusterB,
    sortOrder: 9,
    eligible: true,
  },
  {
    name: "SmartQuick",
    description: "SaaS TMS con IA para optimización de rutas, georreferenciación automática, cubicaje 3D y RNDC automático con ML.",
    hqCity: "Bogotá",
    hqCountry: "Colombia",
    foundedYear: 2014,
    fundingStage: "Seed" as const,
    employeeRange: "11-50",
    fundingAmount: "~$200K COP/mes (SaaS)",
    investors: "BICTIA",
    clientsRef: "Empresas logísticas en Colombia",
    keyDifferentiator: "TMS colombiano con cubicaje 3D y selección predictiva de flota. Reduce 30% de costos logísticos con OCR y monitoreo predictivo.",
    strategicFit: "TMS colombiano con cubicaje 3D, RNDC automático y selección predictiva de flota. Reduce 30% costos logísticos. Profundo entendimiento regulatorio LATAM.",
    clusterId: clusterB,
    sortOrder: 8,
    eligible: true,
  },
  // Cluster C — Fintech Delivery & Urban Fulfillment
  {
    name: "Moova",
    description: "Flexible urban logistics con IA para optimización de rutas. Soluciones fintech: envío tarjetas, destrucción, insumos POS, API, logística inversa.",
    hqCity: "Buenos Aires",
    hqCountry: "Argentina",
    foundedYear: 2018,
    fundingStage: "Series A" as const,
    employeeRange: "172",
    fundingAmount: "~$20M+",
    investors: "Toyota Tsusho, Wayra Hispam (Telefónica)",
    clientsRef: "Enterprise fintech LATAM (tarjetas bancarias, POS)",
    keyDifferentiator: "Único especialista del universo en logística fintech: entrega de tarjetas bancarias y POS. Toyota Tsusho como inversor estratégico.",
    strategicFit: "Único especialista en logística fintech del universo evaluado. Opera entrega de tarjetas bancarias, POS e insumos. Respaldado por Toyota Tsusho y Wayra Hispam.",
    clusterId: clusterC,
    sortOrder: 6,
    eligible: true,
  },
  {
    name: "Mienvío",
    description: "Plataforma de orquestación multipaquetería Control Tower para ecommerce y marketplaces. API + SDKs, 30+ paqueterías, +40,000 códigos postales.",
    hqCity: "Monterrey",
    hqCountry: "México",
    foundedYear: 2015,
    fundingStage: "Seed" as const,
    employeeRange: "26",
    fundingAmount: "~$2M+",
    investors: "Silicon Valley Angels, BlueBox, 500 Startups, Ahora Money",
    clientsRef: "Pymes ecommerce, 2,500+ clientes",
    keyDifferentiator: "Control Tower con 30+ paqueterías y 40,000+ CPs México. Experiencia documentada en entrega de contratos y estados de cuenta.",
    strategicFit: "Orquestación multipaquetería Control Tower: 30+ paqueterías, 40,000+ CPs México. Setup <1 semana sin reconstruir integraciones. Cercanía operativa con BAC.",
    clusterId: clusterC,
    sortOrder: 10,
    eligible: true,
  },
  {
    name: "Cubbo",
    description: "Fulfillment SaaS para e-commerce que transforma espacios urbanos en centros logísticos. Storage, empaque, envío same-day.",
    hqCity: "Bogotá / CDMX",
    hqCountry: "Colombia / México",
    foundedYear: 2021,
    fundingStage: "Seed" as const,
    employeeRange: "302",
    fundingAmount: "$4M+",
    investors: "SV LatAm Capital, Gerdau Next Ventures, Arsenal Growth Equity, Dallas Venture Capital",
    clientsRef: "Marcas e-commerce LATAM, 4 bancos LATAM",
    keyDifferentiator: "Fulfillment urbano con microbodegas same-day en CDMX y Bogotá. Experiencia directa con 4 bancos LATAM aunque sin motor de ruteo propio.",
    strategicFit: "Fulfillment SaaS que convierte espacios urbanos en microbodegas logísticas. Same-day desde CDMX y Bogotá. Aplicable a BAC para distribución de kits y materiales POS.",
    clusterId: clusterC,
    sortOrder: 11,
    eligible: true,
  },
  {
    name: "boxful",
    description: "Plataforma multicarrier para e-commerce centroamericano con envíos same-day/next-day, lockers inteligentes y fulfillment.",
    hqCity: "San Salvador",
    hqCountry: "El Salvador",
    foundedYear: 2023,
    fundingStage: "Pre-seed" as const,
    employeeRange: "11-50",
    fundingAmount: "$1.9M",
    investors: "Innogen Capital, Carao Ventures, Yango Group",
    clientsRef: "Vendedores sociales, Pymes e-commerce Centroamérica",
    keyDifferentiator: "Multicarrier centroamericano con lockers inteligentes. Pre-seed con foco e-commerce; sin capacidades nativas para entorno financiero.",
    strategicFit: "Única solución nativa para Centroamérica: lockers inteligentes, same-day y pago contra entrega. Pre-seed: oportunidad de piloto exclusivo o coinversión temprana.",
    clusterId: clusterC,
    sortOrder: 12,
    eligible: true,
  },
];

const startupIds: Record<string, number> = {};
for (const s of startupDefs) {
  const id = await upsertStartup({ projectId, ...s });
  startupIds[s.name] = id!;
  console.log(`  ✓ [${id}] ${s.name}`);
}

// ── WSM Scores ─────────────────────────────────────────────────────────────
// Scores converted from 0-4 scale → 0-10 (× 2.5)
console.log("\n📊 Insertando scores WSM...");

type ScoreRow = { startup: string; scores: number[]; rationales: string[] };

const wsmData: ScoreRow[] = [
  {
    startup: "FarEye",
    scores: [10, 10, 10, 10, 10, 10, 10, 10],
    rationales: [
      "Con el uso de su herramienta Pilot prometen una reducción de tiempo humano de 10 horas a 60 minutos. Se comunica automáticamente con repartidores, recalcula asignación de rutas y monitorea problemas de ruteo.",
      "Delivery status page con branding personalizado para clientes, facilita el cross-selling con anuncios personalizados durante la entrega.",
      "Tecnología 'geosmart' que convierte direcciones no estándar en smart codes con exactitud tipo Waze. Smart Suggestions con IA para direcciones inválidas.",
      "Asigna órdenes considerando capacidad del vehículo, tráfico, zonas/horarios de servicio, preferencias y familiaridad del conductor con la zona.",
      "Gestiona cumplimiento de SLAs con uso de IA para rutas de entrega. Prometiendo reducción de entregas no realizadas de hasta 25%. ISO 27001 + SOC 2 + HIPAA.",
      "Security of IT Infrastructure certificada ISO 27001:2018 e ISO 27001:2013. Nivel enterprise adecuado para entorno financiero.",
      "Plataforma de análisis de KPIs que permite tomar decisiones, evaluar cumplimiento de SLAs y analizar productividad de repartidores.",
      "API REST con integraciones a WMS, OMS, ERP, CRM y proveedores de logística externos.",
    ],
  },
  {
    startup: "Wise Systems",
    scores: [10, 7.5, 10, 10, 10, 10, 10, 7.5],
    rationales: [
      "Optimización autónoma con ML que reduce kilómetros y mejora utilización de flota; Strategic Planner para planeación de territorios/recursos.",
      "Delivery status page con branding para clientes, facilita el cross-selling.",
      "Ruteo dinámico con ML, re-secuenciación ante tráfico y ETAs precisas en tiempo real.",
      "Despacho autónomo: decisiones de despliegue de conductores/vehículos por software, zonas por preferencia del conductor y transferencia de paradas entre conductores.",
      "Gestión de excepciones, prueba de entrega (firma, código de barras, foto, notas) y reducción de entregas tardías. SOC 2 compliant.",
      "Wise Systems utiliza enterprise-grade best practices para proteger a sus clientes. SOC 2 compliant.",
      "Performance Manager mide on-time % por ruta y por conductor, volúmenes de tareas y planificado vs. real.",
      "Plataforma cloud que importa órdenes e integra vía API; amplitud de integración enterprise por validar.",
    ],
  },
  {
    startup: "Bringg",
    scores: [10, 5, 7.5, 10, 10, 10, 10, 10],
    rationales: [
      "Orquestación enterprise con AI routing y modelo mixto (flota propia + 3PL) que optimiza la operación de última milla.",
      "Comunicación con el cliente durante la entrega (superficie de marca); branding en la entrega.",
      "Ruteo con IA para última milla a escala enterprise.",
      "Asignación y orquestación de conductores/flota (propios y 3PL) con dispatch inteligente.",
      "Gestión de excepciones y comunicación al cliente con cumplimiento de SLA en tiempo real; cliente puede reagendar entregas.",
      "Certificaciones ISO/IEC 27001 (renovada anualmente) y SOC 2 Tipo 2, más controles HIPAA. Nivel adecuado para entorno financiero.",
      "Dashboards y analítica de orquestación con visibilidad en tiempo real.",
      "Integraciones enterprise (respaldo de Salesforce Ventures) y modelo multi-fuente (propio + 3PL).",
    ],
  },
  {
    startup: "DispatchTrack",
    scores: [10, 5, 10, 10, 10, 5, 10, 10],
    rationales: [
      "Optimización de rutas con IA y costeo automático de rutas (rentabilidad), adaptado a in-house fleets, 3PLs, contractors o una combinación.",
      "'Text Me Widget' de interacción pre-entrega que capta leads calificados y encuestas post-entrega; habilita interacción comercial, no un módulo pleno de cross-selling.",
      "Plataforma de última milla con optimización de rutas por IA y geolocalización en tiempo real.",
      "Determina la mejor ruta y carga por camión y gestiona el dispatch (Driver AI); asignación por conductor sólida.",
      "Track & Trace con traza de auditoría que combate falsa responsabilidad, gestión de excepciones desde el dashboard y prueba de entrega geoetiquetada/fechada.",
      "Posicionamiento enterprise (2,500+ clientes, 180M entregas/año); certificación de seguridad específica no encontrada.",
      "Dashboard en tiempo real con KPIs personalizables y reportes; conecta con Power BI/Tableau y compara planificado vs. real.",
      "Buena integración con sistemas; Total Visibility unifica datos propios y de 3PL en un solo panel.",
    ],
  },
  {
    startup: "SimpliRoute",
    scores: [10, 0, 10, 10, 10, 10, 10, 10],
    rationales: [
      "Optimización de rutas con IA para reducir vehículos necesarios y kilómetros recorridos. Asignación por capacidad/habilidades de vehículo, agrupación de flotas y zonificación por repartidor.",
      "Sin cross-selling como parte del producto. Software específico de gestión logística.",
      "Optimización con tráfico en tiempo real, edición de rutas, alertas predictivas, tiempo estimado de llegada y rastreo en vivo para el cliente.",
      "'Al usar este optimizador, tus visitas se asignarán de manera equilibrada a cada uno de los vehículos disponibles.' Zonificación personalizada por repartidor/formalizador.",
      "Comunicación exacta de tiempo de entrega con actualizaciones via Email, SMS, WhatsApp y LiveTracking. Reduce riesgo de entrega fallida con reproceso.",
      "Cuenta con certificación ISO 27000 como Sistema de Gestión de Seguridad de la Información.",
      "SLA atendible con planeación de asignación de entregas por fecha. Monitoreo en tiempo real, dashboard integral, reportes y ML para optimizar con historial.",
      "Plataforma cloud con APIs e integraciones via SimpliRoute Direct, Zapier y custom API.",
    ],
  },
  {
    startup: "OneRail",
    scores: [7.5, 0, 7.5, 10, 10, 10, 7.5, 10],
    rationales: [
      "Con uso de IA se optimiza el modo de envío, carrier, costo y capacidad, con redundancia de red, utilizando su plataforma OmniPoint.",
      "Sin evidencia de cross-selling en la entrega.",
      "Cuenta con app llamado OneRail que facilita a los repartidores la navegación con GPS y llamadas/texto con clientes para facilitar entregas.",
      "OneRail facilita la asignación al optimizar en base a los repartidores disponibles y sus capacidades específicas, maximizando la utilización y reduciendo costos.",
      "Optimización de rutas con IA, asignación por capacidad/habilidades del vehículo y zonificación personalizada. Exception Assist con equipo especializado.",
      "Cumplen con certificaciones ISO 27001:2022 & SOC 2 en el manejo de la seguridad de la información.",
      "OneRail gestiona excepciones 'Exception Assist' al intervenir con equipo especializado. Sistema de gestión unificado con información consolidada.",
      "Integraciones específicamente con IBM y SAP como fundamentos de crecimiento. APIs con alta capacidad de personalización.",
    ],
  },
  {
    startup: "Routific",
    scores: [7.5, 0, 10, 10, 7.5, 5, 7.5, 10],
    rationales: [
      "Optimización de rutas con reducción de combustible/costo (hasta 25-40%), capacidad de vehículo y ventanas horarias; enfoque PyME/mediano.",
      "Sin evidencia de cross-selling en la entrega.",
      "Ruteo con ML y ETAs precisas (tráfico histórico, túneles, puentes); validación de direcciones y definición de parada por coordenadas GPS; rutas navegables desde Waze/Maps.",
      "Reasignación de paradas entre conductores y consideración de velocidades/turnos/prioridades; balanceo de fuerza laboral limitado.",
      "Validación de direcciones (reduce entregas fallidas) y prueba de entrega con foto/firma; sin priorización avanzada de riesgo ni auditoría profunda.",
      "Reportado como 'ligero' en cumplimiento profundo y trazas de auditoría de largo plazo; sin certificación publicada.",
      "Edición de rutas, reportes de desempeño del conductor y captura de datos de entrega; ofrece un support dashboard.",
      "API de optimización de rutas líder y fácil de integrar (elegida por software partners); se puede alimentar directamente con archivos Excel.",
    ],
  },
  {
    startup: "SmartQuick",
    scores: [10, 0, 10, 10, 7.5, 5, 5, 7.5],
    rationales: [
      "Ruteo ML (-30% combustible) y selección predictiva de flota; 25-35% de reducción de costos (claims del proveedor).",
      "Sin evidencia de cross-selling en la entrega.",
      "Ruteo con ML no supervisado, georreferenciación, ventanas horarias y restricciones viales (orientado a transporte de carga; claims del proveedor).",
      "Asignación predictiva de operadores y selección de flota; orientado a vehículos/monitoreo más que a formalizadores en campo.",
      "Torre de control con monitoreo predictivo (-40% fallas, claim), OCR de documentos y alertas. Agentes de voz con IA que realizan llamadas automáticas a conductores y clientes.",
      "Encriptación AES-256 para datos en reposo y TLS 1.3 para datos en tránsito. Sin certificaciones bancarias estándar.",
      "Dashboard IA con Cronómetro ANS, monitoreo en tiempo real, OCR y reportes; analítica operativa sólida.",
      "APIs abiertas y webhooks para integración con ERP y WMS; integración con core bancario por validar.",
    ],
  },
  {
    startup: "Moova",
    scores: [10, 2.5, 10, 7.5, 7.5, 7.5, 10, 7.5],
    rationales: [
      "Moova ofrece herramientas de ruteo, seguimiento y eficiencia en la última milla. Integración con IA y Machine Learning para optimizar sistema de envíos.",
      "No se menciona cross-selling directamente. Permiten recolectar datos en la entrega al igual que envío de documentación.",
      "Moova ofrece sistema de ruteo inteligente, panel de control en tiempo real de envíos y tracking. Tecnología avanzada de ruteo con IA.",
      "Tecnología de ruteo avanzada pero no una asignación a formalizadores de manera explícita.",
      "Prueba de entrega con foto, escaneo de documento obligatorio, verificación de pregunta secreta y comprobante con firma digital.",
      "No se menciona directamente. Mencionan operaciones con Scotiabank y sección específica sobre funcionalidad con empresas fintech.",
      "Seguimiento en tiempo real con mecanismos de evidencia de entregas. Al menos 4 vistas en dashboards: geográfica, temporal y conteo de entregas exitosas/no exitosas.",
      "Integraciones con uso de API. También cuenta con plugins a distintas plataformas. Pendiente validar necesidades específicas de BAC.",
    ],
  },
  {
    startup: "Mienvío",
    scores: [7.5, 7.5, 5, 5, 10, 10, 7.5, 10],
    rationales: [
      "Optimiza recursos a nivel multi-paquetería, no flota propia. Selección automática del mejor carrier por costo, SLA y capacidad. 15-25% de ahorro en costos de envío.",
      "Ofrecen entregas de 'Kits de bienvenida': por ejemplo, la tarjeta, tokens de seguridad y material promocional.",
      "Ruteo desarrollado por la paquetería/carrier seleccionada, no por Mienvío.",
      "Asigna a paqueterías, no a formalizadores en campo; no cuenta con balanceo de carga entre repartidores propios.",
      "Motor de reglas para OTD, prioridades, restricciones y gestión de excepciones. Analítica de pre-incidencias para prevenir fallas de entrega.",
      "Mienvío menciona experiencia con manejo de documentos sensibles: contratos, estados de cuenta y correspondencia regulatoria con cadena de custodia y confirmación de recepción.",
      "Gestión de incidencias, auditoría continua y reportes de performance.",
      "Facilitan integración de convenios existentes sin reconstruir integraciones. API REST o dashboard a sistemas de emisión de tarjetas. API con documentación completa y sandbox en <1 semana.",
    ],
  },
  {
    startup: "Cubbo",
    scores: [7.5, 0, 5, 7.5, 7.5, 7.5, 7.5, 7.5],
    rationales: [
      "Asignación inteligente del carrier más eficiente por zona en función de costo y servicio. Optimiza fulfillment, inventario y red de microbodegas urbanas; no optimiza flota ni fuerza de distribución en campo.",
      "Cubbo se especializa en simplificar la logística de envíos y fulfillment. Sin cross-selling como área de enfoque.",
      "Modelo de fulfillment; la última milla se ejecuta vía carriers. Sin motor propio de ruteo/geolocalización tipo Waze.",
      "Asignación inteligente del carrier más eficiente por zona.",
      "Da visibilidad sobre el estado del pedido y disminuye los tickets y cancelaciones por incidentes. Tracking del pedido para el cliente.",
      "Tienen experiencia directa con 4 bancos diferentes a nivel LATAM.",
      "Muestra dashboards para el manejo de paquetería y cliente, invoices, rendimiento de carriers y desempeño en tiempos de entrega.",
      "Cuentan con integraciones hacia diferentes plataformas, integración directa a la app del cliente para desplegar el estatus del envío.",
    ],
  },
  {
    startup: "boxful",
    scores: [5, 0, 5, 2.5, 5, 0, 5, 5],
    rationales: [
      "Plataforma que selecciona automáticamente paquetería + fulfillment. Optimización de recursos a nivel envío, no para flota propia.",
      "Boxful se especializa en simplificar la logística de envíos y fulfillment. Sin cross-selling como área de enfoque.",
      "Ruteo desarrollado por la paquetería/carrier seleccionada, no por boxful.",
      "Asigna a paqueterías, no a formalizadores en campo; no cuenta con balanceo de carga entre repartidores propios.",
      "Boxful permite gestionar envíos con entrega el mismo día. Al tercerizar la logística, no cuenta con métodos de gestión de casos de alto riesgo.",
      "Debido a su naturaleza con enfoque en logística de e-commerce, no se enfocan en manejo de información sensible.",
      "Plataforma integral de gestión y seguimiento de envíos. Seguimiento visible directamente sin acudir a portales de distintos proveedores.",
      "boxful facilita la conexión con sistemas existentes a través de su API para obtener información de envío, cotizaciones e historial.",
    ],
  },
];

for (const row of wsmData) {
  const startupId = startupIds[row.startup];
  for (let i = 0; i < reqIds.length; i++) {
    await upsertWsmScore({
      projectId,
      startupId,
      requirementId: reqIds[i],
      humanScore: row.scores[i],
      rationale: row.rationales[i],
    });
  }
  console.log(`  ✓ ${row.startup} — ${reqIds.length} scores`);
}

// ── Rankings ───────────────────────────────────────────────────────────────
console.log("\n🏆 Insertando rankings...");
const rankings = [
  { startup: "FarEye",        rank: 1,  wsmScore: 10.00,  tier: 1 },
  { startup: "Wise Systems",  rank: 2,  wsmScore: 9.625,  tier: 2 },
  { startup: "SimpliRoute",   rank: 3,  wsmScore: 9.50,   tier: 2 },
  { startup: "Bringg",        rank: 4,  wsmScore: 9.50,   tier: 2 },
  { startup: "DispatchTrack", rank: 5,  wsmScore: 9.25,   tier: 2 },
  { startup: "OneRail",       rank: 6,  wsmScore: 8.625,  tier: 2 },
  { startup: "Moova",         rank: 7,  wsmScore: 8.125,  tier: 3 },
  { startup: "Mienvío",       rank: 8,  wsmScore: 8.00,   tier: 3 },
  { startup: "Routific",      rank: 9,  wsmScore: 7.75,   tier: 3 },
  { startup: "SmartQuick",    rank: 10, wsmScore: 7.625,  tier: 3 },
  { startup: "Cubbo",         rank: 11, wsmScore: 6.875,  tier: 4 },
  { startup: "boxful",        rank: 12, wsmScore: 3.875,  tier: 4 },
];

for (const r of rankings) {
  await upsertRanking({
    projectId,
    startupId: startupIds[r.startup],
    rank: r.rank,
    wsmScore: r.wsmScore,
    tier: r.tier,
  });
  console.log(`  ✓ #${r.rank} ${r.startup} — WSM ${r.wsmScore} / Tier ${r.tier}`);
}

// ── Recommendations ────────────────────────────────────────────────────────
console.log("\n💬 Insertando recomendaciones...");
const recommendations = [
  {
    startup: "FarEye",
    decision: "recommended" as const,
    narrative:
      "FarEye obtiene el puntaje perfecto: cumple los 8 criterios al máximo nivel. Su tecnología geosmart convierte direcciones no estándar en smart codes (exactitud tipo Waze, requisito explícito del cliente), su herramienta Pilot reduce el tiempo humano de planificación de 10 horas a 60 minutos y su gestión de SLAs cubre tráfico, capacidad de vehículos y habilidades del conductor. Cuenta con certificaciones ISO 27001 + SOC 2 y experiencia con clientes como DHL, UPS y Walmart. Es la opción más completa de extremo a extremo para el problema de logística de entrega de tarjetas de BAC y se recomienda como proveedor principal para un piloto inmediato.",
  },
  {
    startup: "Wise Systems",
    decision: "recommended" as const,
    narrative:
      "Wise Systems alcanza el segundo lugar con un dispatch autónomo basado en ML que elimina la intervención manual en la asignación, atacando directamente el dolor de los reprocesos. Su Performance Manager mide on-time por ruta y por conductor — métricas clave para el alto reproceso reportado por BAC. Cumple SOC 2 y reduce kilómetros con re-secuenciación dinámica ante tráfico. Es una solución de primer nivel para el entorno operativo y se recomienda como segunda opción de piloto o como capa de optimización si BAC prioriza el dispatch automatizado.",
  },
  {
    startup: "SimpliRoute",
    decision: "recommended" as const,
    narrative:
      "SimpliRoute es el líder LATAM del comparativo: cumple los 8 criterios y aporta 120+ clientes en México con casos comprobados de 25-35% de reducción de costos logísticos. Cuenta con ISO 27001 (único en su cluster), ruteo con ML, georreferenciación con ventanas horarias y comunicación multicanal (Email/SMS/WhatsApp/LiveTracking) que reduce devoluciones por ausencia. Su debilidad es el cross-selling, no contemplado en la plataforma. Se recomienda como piloto LATAM más alineado culturalmente al equipo de Distribución.",
  },
  {
    startup: "Bringg",
    decision: "recommended" as const,
    narrative:
      "Bringg orquesta última milla a escala enterprise con un modelo mixto (flota propia + 3PL), ideal para BAC si combina formalizadores internos con servicios tercerizados. Sus certificaciones ISO/IEC 27001 + SOC 2 Tipo 2 + controles HIPAA son las más sólidas para datos sensibles como contratos y tarjetas. El respaldo de Salesforce Ventures asegura integraciones empresariales. Se recomienda para clientes BAC que requieran orquestar formalizadores diversos con control central.",
  },
  {
    startup: "DispatchTrack",
    decision: "recommended" as const,
    narrative:
      "DispatchTrack ofrece optimización de rutas con IA y costeo automático por ruta — una ventaja directa para medir la rentabilidad por intento de entrega que hoy BAC no cuantifica. Total Visibility unifica datos propios y de 3PL, su Driver AI gestiona el dispatch y el Text Me Widget pre-entrega capta leads calificados. La certificación de seguridad específica es ligera para entorno bancario, lo que requeriría validación. Se recomienda como solución probada con 2,500+ clientes y 180M entregas/año.",
  },
  {
    startup: "OneRail",
    decision: "recommended" as const,
    narrative:
      "OneRail consolida 100+ carriers en una sola API con SLA tracking en tiempo real, reduciendo el riesgo de devolución al cambiar dinámicamente de proveedor ante fallas. Su Exception Assist combina IA con un equipo humano que interviene en casos de alto riesgo — mecanismo directo para mitigar el 80% de reprocesos reportado por BAC. Cuenta con ISO 27001:2022 + SOC 2 y respaldo de IBM y SAP para integración. Se recomienda si BAC busca una capa multi-carrier sin migrar el flujo actual.",
  },
  {
    startup: "Moova",
    decision: "recommended" as const,
    narrative:
      "Moova es el único especialista del universo evaluado en logística fintech: opera entrega de tarjetas bancarias y POS, exactamente el problema de BAC. Su ruteo inteligente con panel de control en tiempo real es robusto, aunque no detalla certificaciones bancarias estándar — punto a validar en due diligence. Respaldo de Toyota Tsusho y Wayra (Telefónica) le da estabilidad. Se recomienda fuertemente como piloto vertical: ningún otro proveedor tiene experiencia 1:1 con entrega de plásticos bancarios en LATAM.",
  },
  {
    startup: "Mienvío",
    decision: "recommended" as const,
    narrative:
      "Mienvío opera un Control Tower multi-paquetería con 30+ paqueterías y 40,000+ códigos postales México, con experiencia documentada en entrega de contratos, estados de cuenta y certificados — análogo al caso de BAC. Su motor de reglas configurable cubre SLAs, prioridades y restricciones de entrega, y su capacidad de integrar convenios existentes facilita el onboarding. Sin motor propio de ruteo ni asignación a formalizadores en campo. Se recomienda como orquestador documental si BAC prefiere tercerizar la última milla.",
  },
  {
    startup: "Routific",
    decision: "recommended" as const,
    narrative:
      "Routific destaca por su API de optimización de rutas líder en el mercado, elegida por integradores de software por su facilidad de embebido. Reduce 30% km, 25% combustible y 50% tiempo de planificación, con validación de direcciones y prueba de entrega con foto/firma. Su debilidad principal es la profundidad en cumplimiento y trazas de auditoría de largo plazo, sin certificaciones específicas para entorno bancario — un riesgo a evaluar. Se recomienda como motor de ruteo embebido en una plataforma BAC existente, no como solución end-to-end.",
  },
  {
    startup: "SmartQuick",
    decision: "recommended" as const,
    narrative:
      "SmartQuick es un TMS colombiano con cubicaje 3D, RNDC automático y selección predictiva de flota. Su torre de control con monitoreo predictivo reclama -40% en fallas y dispone de OCR para documentos — útil para la formalización en campo que BAC requiere. Cuenta con encriptación AES-256 y TLS 1.3, aunque sin certificaciones bancarias estándar. Se recomienda como opción LATAM de menor costo si el piloto se acota a optimización de rutas y no a manejo profundo de información confidencial.",
  },
  {
    startup: "Cubbo",
    decision: "not_recommended" as const,
    decisionReason: "other" as const,
    narrative:
      "Cubbo se especializa en fulfillment urbano que convierte espacios en microbodegas logísticas same-day desde CDMX y Bogotá. Tiene experiencia directa con 4 bancos a nivel LATAM, pero su modelo de última milla se ejecuta vía carriers terceros y carece de motor propio de ruteo o geolocalización — un gap importante frente al requisito explícito de capacidad tipo Waze. Se recomienda monitorear su evolución o evaluar para escenarios de almacenamiento de tarjetas pre-entrega, no como solución integral.",
  },
  {
    startup: "boxful",
    decision: "not_recommended" as const,
    decisionReason: "below_threshold" as const,
    narrative:
      "boxful muestra el puntaje más bajo del comparativo (WSM 38.75%): es una solución pre-seed centroamericana enfocada en e-commerce y vendedores sociales, sin experiencia ni capacidades para entorno financiero. Carece de cross-selling, de manejo confidencial de información (puntaje 0) y no tiene motor propio de ruteo. Su valor estaría limitado a entregas en El Salvador a través de lockers inteligentes. No se recomienda para este caso de uso; podría reevaluarse en 12-18 meses si madura su oferta enterprise.",
  },
];

for (const r of recommendations) {
  await upsertRecommendation({
    projectId,
    startupId: startupIds[r.startup],
    narrative: r.narrative,
    decision: r.decision,
    decisionReason: (r as any).decisionReason ?? null,
  });
  console.log(`  ✓ ${r.startup} — ${r.decision}`);
}

// ── Done ───────────────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed BAC Retana completado

   Proyecto ID : ${projectId}
   URL         : /bac/retana-001
   Passkey     : ${PASSKEY}
   Startups    : ${Object.keys(startupIds).length}
   Requisitos  : ${reqIds.length}
   Clusters    : ${clusterIds.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
