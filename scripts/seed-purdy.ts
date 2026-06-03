/**
 * Seed script — Grupo Purdy (purdy/001)
 * Creates the full project from scratch: project, requirements, clusters,
 * startups, WSM scores/rationales, rankings, and recommendations.
 *
 * Run with: DATABASE_URL=<url> tsx scripts/seed-purdy.ts
 *
 * Passkey: Purdy2026-oqijonds  (share with the client for portal access)
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
const existing = await db.select().from(projects).where(eq(projects.clientSlug, "purdy")).limit(1);
if (existing.length > 0) {
  console.log("⚠️  Project purdy already exists. Aborting.");
  process.exit(0);
}

// ── 1. Create project ──────────────────────────────────────────────────────
const passkeyHash = await bcrypt.hash("Purdy2026-oqijonds", 10);
await db.insert(projects).values({
  title: "Scouting de Plataformas — Ecosistema Purdy Go",
  clientName: "Grupo Purdy",
  industry: "Automotriz",
  geoAllowed: "Global",
  geoExcluded: "Ninguna",
  reportDate: "Junio 2026",
  analystName: "Tomás Valles",
  analystEmail: "tomas@vclstudio.com",
  clientSlug: "purdy",
  problemId: "001",
  published: true,
  publishedAt: new Date(),
  passkeyHash,
  universeSize: 12,
  eligibleCount: 12,
  excludedCount: 0,
  scopeDescription: "Evaluación de plataformas tecnológicas para habilitar el ecosistema Purdy Go: fidelización escalonada, datos de comportamiento del cliente automotriz, conectividad vehicular y servicios de movilidad on-demand.",
} as any);

const [project] = await db.select().from(projects).where(eq(projects.clientSlug, "purdy")).limit(1);
const projectId = project.id;
console.log(`✅  Created project ID ${projectId}`);

// ── 2. Create requirements (7) ─────────────────────────────────────────────
const reqDefs = [
  {
    sortOrder: 1,
    name: "Generación de recurrencia e interacción frecuente",
    weight: 0.20,
    description: "Debe generar recurrencia e interacción frecuente con el usuario (no soluciones transaccionales aisladas), aportando a fidelización, generación de datos y nuevas fuentes de ingreso.",
  },
  {
    sortOrder: 2,
    name: "Integración escalable con Purdy Go y sus verticales de movilidad",
    weight: 0.20,
    description: "La solución debe integrarse con Purdy Go mediante APIs, permitiendo trazabilidad, gestión de usuarios bajo un único ID y conexión con verticales del ecosistema.",
  },
  {
    sortOrder: 3,
    name: "Alineación al modelo de valor escalonado",
    weight: 0.15,
    description: "Capacidad de alinearse al modelo Rewards, Connect y Pro, permitiendo beneficios distintos por nivel de cliente y facilitando la migración a modelos de suscripción.",
  },
  {
    sortOrder: 4,
    name: "Captura y uso de datos de comportamiento",
    weight: 0.15,
    description: "Debe permitir captura, procesamiento y uso de datos para habilitar personalización, modelos predictivos e insights de comportamiento del cliente.",
  },
  {
    sortOrder: 5,
    name: "Escalabilidad, conectividad y alianzas",
    weight: 0.10,
    description: "Debe ser escalable y capaz de habilitar servicios conectados del vehículo, como telemetría, geolocalización o alertas, así como alianzas con terceros que amplíen la propuesta de valor.",
  },
  {
    sortOrder: 6,
    name: "Modelo de ingresos claro",
    weight: 0.10,
    description: "Capacidad de integrar modelos de ingreso definidos: suscripción, revenue share o transaccional.",
  },
  {
    sortOrder: 7,
    name: "Experiencia de usuario de bajo esfuerzo",
    weight: 0.10,
    description: "Experiencia simple y de bajo esfuerzo de adopción para el usuario.",
  },
];

for (const r of reqDefs) {
  await db.insert(requirements).values({ projectId, ...r });
}
const allReqs = await db.select().from(requirements).where(eq(requirements.projectId, projectId));
const sortedReqs = allReqs.sort((a, b) => a.sortOrder - b.sortOrder);
console.log(`✅  Created ${allReqs.length} requirements`);

// ── 3. Create clusters (3) ─────────────────────────────────────────────────
await db.insert(clusters).values({ projectId, sortOrder: 1, name: "Loyalty, Engagement & Customer Data", description: "Plataformas de fidelización, engagement, customer data (CDP) y experiencia de cliente automotriz/dealer. Habilitan el modelo escalonado, recurrencia conductual, datos de comportamiento y monetización por suscripción/transacción." });
await db.insert(clusters).values({ projectId, sortOrder: 2, name: "Connected Car & Vehicle Data", description: "Plataformas de datos de vehículo conectado y telemetría (APIs, OBD, OTA). Aportan integración escalable con Purdy Go, captura de datos de comportamiento y motor predictivo bajo un único ID." });
await db.insert(clusters).values({ projectId, sortOrder: 3, name: "Servicios de Movilidad On-Demand", description: "Servicios de movilidad on-demand al consumidor (lavado, mantenimiento, combustible). Generan recurrencia y touchpoints físicos de alta frecuencia con UX de bajo esfuerzo." });

const allClusters = await db.select().from(clusters).where(eq(clusters.projectId, projectId));
const clusterA = allClusters.find(c => c.name.includes("Loyalty"))!;
const clusterB = allClusters.find(c => c.name.includes("Connected"))!;
const clusterC = allClusters.find(c => c.name.includes("Movilidad"))!;
console.log(`✅  Created ${allClusters.length} clusters`);

// ── 4. Startups ────────────────────────────────────────────────────────────
// humanScore = score(0-4) × 2.5 → stored as 0-10
// wsmScore   = total_pct / 10  → stored as 0-10
const startupDefs = [
  {
    name: "Antavo", sortOrder: 1, clusterId: clusterA.id,
    hqCity: "Londres", hqCountry: "Reino Unido", foundedYear: 2012, employeeRange: "150",
    fundingStage: "Series A" as const, fundingAmount: "~$11M", investors: "Euroventures, Lead Ventures, OTP",
    websiteUrl: "https://antavo.com/",
    description: "Enterprise Loyalty Cloud no-code: tiers, automatización, gamificación y analítica de comportamiento.",
    scores: [10, 10, 10, 10, 7.5, 10, 10],
    rationales: [
      "Antavo gestiona el la lealtad del cliente con gamificación y automatización. Ofrecen un sistema de gamificación para mantener interacción frecuente con los clientes.",
      "APIs y conectores enterprise para integración con plataformas e información existente. Desde plataformas comerciales y marketing hasta herramientas de automatización, sistemas POS y ERPs.",
      "Ofrecen el servicio de gestión \"Tiered loyalty program\" para manejar casos como el de Grupo Purdy, en el que se manejan distintos niveles de clientes.",
      "Con la herramienta Optimizer, facilitan la analítica de datos de los programas de lealtad. Usando IA para generar reportes de impacto y sugerencias de los siguientes pasos a tomar para continuar creciendo.",
      "Herramienta especializada en gestión de lealtad del cliente, no en la industria automotriz. Cuentan con una amplia red de alianzas con socios estratégicos cuales tienen el potencial de ampliar la propuesta de valor. Mencionan claramente la facilidad de escalar.",
      "Modelos de ingresos claros. Múltiples modos de incrementar ingresos, como suscripciones y referrals. Mencionan incremento CLTV de 30% e incremento en ingresos del 22% como ejemplos.",
      "Integración a sistemas existentes de Grupo Purdy. Diseñado para ofrecer experiencias fáciles de adoptar. Mencionan la facilidad de ofrecer modelos de gamificación dentro de apps existentes del cliente.",
    ],
    narrative: "Antavo aterriza prácticamente en todos los criterios evaluados. Su plataforma de lealtad enterprise cubre desde gamificación y programas escalonados hasta analítica avanzada con IA mediante su herramienta Optimizer, y está construida desde el inicio para integrarse con ecosistemas complejos: APIs, ERPs, POS, herramientas de marketing, sin requerir una reingeniería del sistema del cliente. Esto la hace especialmente relevante para un caso como el de Grupo Purdy, donde la coexistencia de múltiples verticales y niveles de cliente es precisamente el reto a resolver. Los números que citan tampoco son menores: 30% de incremento en CLTV y 22% en ingresos son métricas que hablan de impacto real, no solo de potencial. La única observación es que Antavo no viene del mundo automotriz, por lo que hay un trabajo de contextualización que Grupo Purdy tendría que liderar durante la implementación.",
    rank: 1, wsmScore: 9.75, tier: 1,
  },
  {
    name: "Open Loyalty", sortOrder: 2, clusterId: clusterA.id,
    hqCity: "Cracovia", hqCountry: "Polonia", foundedYear: 2017, employeeRange: "100",
    fundingStage: null, fundingAmount: "N/A", investors: "Incubado por Divante",
    websiteUrl: "https://openloyalty.io/",
    description: "Plataforma de fidelización headless / API-first: puntos, tiers, gamificación y recompensas integrables a cualquier stack.",
    scores: [10, 10, 10, 10, 2.5, 10, 10],
    rationales: [
      "Open Loyalty es una herramienta de fidelización gamificado que prioriza las APIs, diseñado para incrementar LTV al aumentar la frecuencia de compra. Reportan la duplicación de la frecuencia de compra y un valor de pedido un 41% mayor gracias a los programas de fidelización gamificados.",
      "Open Loyalty explícitamente menciona que es API-first en su método de fidelización. Ofrece acceso completo a las API y guías de desarrollo, lo que permite una integración profunda. Por ejemplo, con la plataforma de Purdy Go.",
      "La plataforma admite puntos, niveles o tiers, recompensas y otras funciones de gamificación. Por ejemplo, mencionan programas que convirtieron a compradores ocasionales en recurrentes mediante esquemas multinivel.",
      "Open Loyalty incluye análisis de fidelización \"seguimiento y mejora del rendimiento\" y promete la captura de datos para analítica especializada en lealtad de los clientes. Impulsa campañas personalizadas a través de datos en tiempo real.",
      "Open Loyalty se enfoca en el comercio electrónico minorista / retail y no ofrece directamente telemática de vehículos ni servicios de geolocalización. Puede integrarse con sistemas de terceros mediante API, pero no dispone de conectividad integrada con automóviles.",
      "Opera bajo un modelo SaaS híbrido que combina suscripción y transaccional. Facilitando la venta directa y modelos de suscripción de manera personalizada.",
      "Ofrece un UI de administración y módulos de fidelización listos para usar. Se trata de un motor de fidelización interno que se puede implementar directamente a la plataforma de Purdy via APIs.",
    ],
    narrative: "Open Loyalty se presenta como una plataforma de fidelización API-first con un enfoque en gamificación y escalabilidad. Reportan la duplicación de frecuencia de compra. Su arquitectura permite una integración profunda con plataformas como Purdy Go gracias a documentación abierta y módulos listos para implementar. Soporta puntos, niveles, recompensas y modelos híbridos de suscripción, lo que se alinea bien con el esquema escalonado Rewards/Connect/Pro. La limitación principal es que está construida para retail y comercio electrónico, sin conectividad nativa con vehículos ni telemetría, por lo que cualquier integración con datos del auto dependería de capas adicionales. Dicho lo anterior, es una de las opciones más sólidas del análisis y vale la pena considerarla seriamente para la siguiente etapa.",
    rank: 2, wsmScore: 9.25, tier: 1,
  },
  {
    name: "Impel AI", sortOrder: 3, clusterId: clusterA.id,
    hqCity: "Syracuse, NY", hqCountry: "EE.UU.", foundedYear: 2012, employeeRange: "450",
    fundingStage: "Series B+" as const, fundingAmount: "~$130M+", investors: "Silversmith Capital Partners",
    websiteUrl: "https://impel.ai/",
    description: "Plataforma de IA de engagement y ciclo de vida del cliente automotriz (ex-SpinCar): IA conversacional, datos de comportamiento del shopper e hiper personalización omnicanal.",
    scores: [10, 7.5, 10, 10, 10, 7.5, 10],
    rationales: [
      "IA conversacional que mantiene el engagement a lo largo de todo el journey. Fomentando lealtad y clientes de por vida con comunicación hiper personalizada.",
      "Integra CRM/DMS y marketplaces; APIs para el ecosistema del concesionario. Con más de 100 integraciones disponibles, desde plataformas de concesionario hasta marketplace y servicios de gestión de la información. Pendiente verificar detalle necesarios para integración con Purdy Go.",
      "Personalización por segmento; tiers no nativos pero habilitables a través de las opciones de personalización y entrenamiento de la IA.",
      "Datos propietarios de comportamiento del shopper + IA para hiper personalización. Un modelo 24/7 que contacta y gestiona interacciones con el cliente. Desde atención inmediata a dudas, hasta recordatorios de mantenimiento y outreach personalizado para la siguiente compra de su vehículo.",
      "Despliegue global (+50 paises) con dealers, OEMs y marketplaces; escala probada. Software \"AI native\" con más de 100 integraciones y casos de éxito de gran tamaño.",
      "Permite fomentar modelos de subscripción a través de la personalización en el contacto IA. No se menciona integración explícita con modelos de subscripción pero sí la personalización de la herramienta.",
      "IA conversacional omnicanal de bajo esfuerzo para el cliente final. Directamente influye en darle una experiencia personalizada y humana a el cliente.",
    ],
    narrative: "Pocas soluciones en este análisis logran cubrir con tanta profundidad el ciclo completo del cliente, y Impel AI es una de ellas. Su motor de IA conversacional opera 24/7 gestionando desde la atención inmediata de dudas hasta recordatorios de mantenimiento y outreach para la siguiente compra, todo con un nivel de personalización que va más allá de la segmentación básica. Su presencia en más de 50 países y más de 100 integraciones con CRMs, DMS y marketplaces le dan una solidez operativa difícil de ignorar. Los tiers de lealtad no son nativos, pero la flexibilidad de entrenamiento de la IA los habilita, lo que es suficiente para el propósito. El único punto pendiente es confirmar los detalles técnicos específicos para la integración con el ecosistema de Purdy Go. Con una calificación de 92.5%, Impel AI es uno de los dos candidatos más fuertes del análisis y merece ser priorizado en la siguiente etapa de conversaciones.",
    rank: 3, wsmScore: 9.25, tier: 2,
  },
  {
    name: "EasyRewardz", sortOrder: 4, clusterId: clusterA.id,
    hqCity: "Gurugram", hqCountry: "India", foundedYear: 2012, employeeRange: "300",
    fundingStage: "Series B" as const, fundingAmount: "~$25M", investors: "Apis Partners",
    websiteUrl: "https://easyrewardz.com/",
    description: "Suite SaaS de loyalty y customer engagement omnicanal: tiers, CRM, campañas y analítica de comportamiento.",
    scores: [7.5, 10, 7.5, 10, 2.5, 7.5, 7.5],
    rationales: [
      "Generación de premios y bonificaciones en tiempo real, captación de datos de comportamiento del cliente al igual que sus preferencias.",
      "Easyrewardz cuenta con un sistema que unifica los datos del cliente, todas sus interacciones con el ecosistema se registran bajo el usuario. Las interacciones Online y offline, incluyendo aplicaciones móviles, página de internet sms y más. También mencionan integración con cualquier solución en el tech stack.",
      "Con su herramienta DealCloud, tienen la capacidad de enviar ofertas a clientes dentro del programa de lealtad. Permitiendo la capacidad de compartir ofertas personalizadas para cada cliente. Incluso contemplando datos como cumplimiento de metas, Cumpleaños, beneficios de bienvenida al programa, entre otros. No especifica diferentes niveles dentro del programa.",
      "Ofrecen un \"360 customer view\". Lo que permite llevar control del ciclo de vida del cliente, compras anteriores, patrones y preferencias.",
      "Al ser una herramienta de CX general, no se menciona integración de telemetría.",
      "Ofrece una integración de todo el ciclo de venta del cliente. Gestionando todo el proceso de cada cliente y transacción. El Toolkit LPaaS gestiona el programa de lealtad.",
      "EasyRewardz enfatiza una UX omnicanal fluida \"experiencia de cliente consistente y personalizada\" y afirma que sus herramientas son fáciles de implementar \"ágiles, intuitivas\". Varios comentarios de clientes elogian la facilidad de uso en tareas de CRM.",
    ],
    narrative: "EasyRewardz tiene lo necesario para gestionar un programa de lealtad sólido: unifica interacciones online y offline bajo un mismo perfil, ofrece una visión 360° del cliente y personaliza ofertas en tiempo real con DealCloud. Sin embargo, al ser una solución de CX general, no contempla telemetría ni conectividad vehicular, y su modelo escalonado no queda del todo claro en términos de cómo se adaptaría al esquema Rewards/Connect/Pro de Purdy Go. Es una opción competente, pero encaja mejor como complemento dentro del stack que como solución principal.",
    rank: 4, wsmScore: 7.875, tier: 2,
  },
  {
    name: "Vinli", sortOrder: 5, clusterId: clusterB.id,
    hqCity: "Dallas, TX", hqCountry: "EE.UU.", foundedYear: 2014, employeeRange: "60",
    fundingStage: "Series B" as const, fundingAmount: "~$20M", investors: "Cox Automotive, Samsung, Continental, Westly Group",
    websiteUrl: "https://vin.li/",
    description: "Plataforma de datos de vehículo conectado y mercado de apps/servicios de movilidad (seguros, mantenimiento, fleet).",
    scores: [5, 10, 5, 10, 10, 7.5, 7.5],
    rationales: [
      "Vinli proporciona datos de automóviles conectados y soluciones para flotas/seguros. Puede captar clientes a través de aplicaciones o analíticas (como puntuación de conductores, seguimiento de flotas), pero se enfoca como proveedor de datos B2B. Marketplace de apps y servicios sobre el coche genera recurrencia de uso.",
      "La plataforma \"ERA\" de Vinli sintetiza datos de cualquier origen: dispositivos dongle de mercado secundario, integraciones con OEMs e incluso el GPS de teléfonos. Ofrece un ecosistema de API y herramientas (análisis predictivos, herramientas personalizadas).",
      "No es un sistema de tiers de loyalty nativo. Capacidad de adaptar acceso a datos con el modelo escalonado.",
      "La fortaleza de Vinli radica en la inteligencia de datos. \"Aprovecha el poder de los datos\" para reducir costos y aumentar las ganancias de los negocios de movilidad. Integra condiciones externas y el comportamiento del conductor para analíticas de riesgo.",
      "Vinli se conecta a los vehículos mediante dispositivos adicionales o flujos de datos de OEMs. Proporciona telemática, monitoreo del conductor y datos externos (clima, tráfico). Sus alianzas (Mobilisights de Stellantis, Toyota Data Solutions) demuestran que está integrada en redes de vehículos conectados.",
      "Vinli opera bajo un esquema de plataforma como servicio (PaaS). Su precio probablemente se calcula por vehículo o por flujo de datos, con opciones de suscripción o reparto de ingresos en soluciones para flotas. No se ofrece información de manera publica. Capacidad de generar ingresos con la predicción de mantenimientos.",
      "Vinli ofrece aplicaciones de consumo de marca blanca y paneles de control para flotas. Para los conductores, se destacan funciones como notificaciones instantáneas.",
    ],
    narrative: "Vinli destaca en su plataforma de datos. \"ERA\" analiza información de integraciones con OEMs e incluso GPS de teléfonos, lo que le permite construir analítica predictiva avanzada de movilidad, seguros y flotas. Sus alianzas con Mobilisights de Stellantis y Toyota Data Solutions confirman que está bien posicionada dentro del ecosistema de vehículos conectados. Su enfoque B2B la convierte más en un proveedor de inteligencia y telemetría que en una plataforma orientada al cliente final, y no cuenta con un sistema de lealtad por tiers nativo, aunque sí podría modularse el acceso a datos para alinearse al modelo escalonado. Puede aportar valor como capa de datos e inteligencia vehicular dentro del stack, particularmente si se busca reforzar capacidades predictivas y de monitoreo.",
    rank: 5, wsmScore: 7.75, tier: 3,
  },
  {
    name: "Orbee", sortOrder: 6, clusterId: clusterA.id,
    hqCity: "Irvine, CA", hqCountry: "EE.UU.", foundedYear: 2015, employeeRange: "60",
    fundingStage: "Series A" as const, fundingAmount: "~$10.3M", investors: "FM Capital, Holman, Flow, Pohanka, The Presidio Group",
    websiteUrl: "https://orbee.com/",
    description: "Customer Data Platform (CDP) automotriz con orquestación de marketing y advertising: unifica datos de múltiples fuentes del concesionario en un único perfil de cliente.",
    scores: [7.5, 10, 5, 7.5, 10, 5, 7.5],
    rationales: [
      "Orbee facilita la interacción recurrente con clientes de manera inteligente con el uso de email y sms usando triggers como comportamientos del cliente, y coordinacion multicanal. De igual forma personaliza campañas ajustándose al inventario actual de vehículos de la agencia.",
      "ORBEE maneja integración con APIs y SDKs. Permitiendo gestionar leads, campañas, customer journey y más. Diseñado para integrar la identidad del usuario en los diferentes canales de comunicación. Por ejemplo los registros en el crm, actividad \"offline\" y uso de la página de internet. De manera que se generan indicadores del comprador en base a su comportamiento.",
      "No se especializan en la gestión de modelos de subscripción. Dicho lo anterior, ofrecen \"custom solutions\" para integrar o añadir funcionalidades específicas que requiera el cliente. Por ejemplo integración a verticales de operaciones que comparten el mismo flujo de clientes.",
      "Captura, unifica y activa datos de comportamiento del cliente. Historial de contacto, vehículos del cliente históricos, financiamiento, citas, garantías, compras, comportamiento via clicks en ads, correos sms etc.",
      "Probada en grandes grupos de concesionarios (multi-rooftop) con integraciones de ads/marketing. Facilitando la conectividad de bases de datos de múltiples OEMs. Todo manejado por el ecosistema ORBEE.",
      "Modelo SaaS que permiten fomentar modelos de subscripción a través de todo el customer journey. No se menciona integración explícita con modelos de subscripción.",
      "Herramienta orientada para uso interno de Grupo Purdy. La experiencia final al cliente la define el corporativo en base a el uso de las distintas herramientas que ofrece el servicio.",
    ],
    narrative: "Orbee es una herramienta claramente diseñada para el mundo automotriz: su capacidad de integrar datos de múltiples concesionarios bajo un mismo ecosistema, así como es el caso de Grupo Purdy. Activar campañas en base al comportamiento del cliente y conectar identidad de usuario a través de canales online y offline le da una ventaja de contexto que pocas soluciones evaluadas tienen. Su historial con grandes grupos multi-rooftop habla de madurez operativa. El lado menos desarrollado está en la gestión de modelos de suscripción y en el esquema escalonado, donde depende de customizaciones que habría que negociar directamente. Vale aclarar que Orbee funciona más como una capa de inteligencia interna para Grupo Purdy que como una experiencia directa al cliente final, lo que no es necesariamente un problema pero sí define su rol dentro del ecosistema. Calificación: 76.25%.",
    rank: 6, wsmScore: 7.625, tier: 2,
  },
  {
    name: "Mojio", sortOrder: 7, clusterId: clusterB.id,
    hqCity: "Vancouver / Palo Alto", hqCountry: "Canadá / EE.UU.", foundedYear: 2012, employeeRange: "150",
    fundingStage: "Series B" as const, fundingAmount: "~$80M", investors: "Amazon Alexa Fund, Iris Capital, Kensington, BDC",
    websiteUrl: "https://moj.io/",
    description: "Plataforma de connected car para telcos y OEMs: telemetría en tiempo real, datos de comportamiento, alertas y servicios de valor agregado.",
    scores: [7.5, 7.5, 5, 7.5, 10, 7.5, 10],
    rationales: [
      "Mojio Engage - Servicios conectados y alertas en tiempo real impulsan interacción frecuente del conductor. Limitado al monitoreo de neumáticos, detección de mantenimientos preventivos, calificación del conductor en base a sus hábitos de manejo y recomendaciones de ubicaciones y tiempos de carga de combustible.",
      "Mojio permite conectar APIs y SDKs a datos vehiculares via hardware OBD2. Facilitando la integración de telemetría a PurdyGo. No se menciona capacidad de gestión de ID unico de cliente.",
      "No es un sistema de tiers de loyalty nativo. Es compatible con monetización por suscripción pero el framework requiere adaptación.",
      "ML framework para insights accionables: alertas vehiculares, predicción de mantenimiento, calificación de la calidad de la conducción. Alianzas con Bosch y AWS Azure IoT. Cuentan con más de 20,000,000,000 millas de telemetría.",
      "Su capacidad de escalar es amplia. Cuentan con socios estratégicos como Bosch e inversionistas como Amazon y T-mobile. El sistema gestiona todos los datos de telemetría del vehículo con la integración del hardware que ofrecen.",
      "Modelo B2B2C por suscripcion/revenue-share. Dichos modelos se pueden trasladar al cliente final al ofrecer el servicio de suscripción a el acceso a los datos del vehículo para diagnostico del vehículo al igual que funcionalidades de valor agregado como la integración de amazon Alexa a su vehículo.",
      "Mojio ofrece un app White Label que facilita la experiencia del usuario. También cuentan con la capacidad de integrarse a apps existentes de Grupo Purdy.",
    ],
    narrative: "Mojio ofrece una propuesta de telemetría vehicular bien respaldada, con más de 20,000 millones de millas de datos procesados, alianzas con Bosch y respaldo de inversionistas como Amazon y T-Mobile. Su valor está en habilitar servicios conectados como mantenimiento predictivo, alertas en tiempo real, calificación del conductor y recomendaciones contextuales, todo accesible vía APIs, SDKs o una app white label que puede integrarse a las plataformas existentes de Grupo Purdy. No es un sistema de lealtad por tiers en sí mismo, pero su modelo B2B2C por suscripción ofrece flexibilidad para construir esa capa encima. Su rol dentro del ecosistema sería el de proveedor de inteligencia vehicular y servicios conectados, más que el de plataforma central de fidelización. Vale la pena considerarla, particularmente si se decide reforzar el componente de telemetría.",
    rank: 7, wsmScore: 7.625, tier: 2,
  },
  {
    name: "Spiffy", sortOrder: 8, clusterId: clusterC.id,
    hqCity: "Durham, NC", hqCountry: "EE.UU.", foundedYear: 2014, employeeRange: "250",
    fundingStage: "Series B" as const, fundingAmount: "~$50M", investors: "Tribeca Venture Partners, Bullpen Capital",
    websiteUrl: "https://getspiffy.com/",
    description: "Cuidado y mantenimiento móvil del vehículo on-demand (lavado, aceite, llantas) para consumidor y flotas, con captura de datos de servicio.",
    scores: [7.5, 7.5, 5, 7.5, 7.5, 10, 10],
    rationales: [
      "Spiffy ofrece servicios móviles de detallado y mantenimiento automotriz. Se trata de servicios recurrentes como lavado, cambio de aceite, etc. Los concesionarios que utilizan Spiffy han sumado ingresos mensuales sustanciales (los testimonios mencionan $20,000 USD mensuales). Comunicación constante enfocada en mantenimiento y reparación.",
      "Spiffy es un proveedor de servicios de pila completa (software + furgonetas + dispositivos). No anuncian API abiertas para sistemas externos pero sí se menciona la integración con CRMs y procesos de pago como Stripe.",
      "Planes de suscripción para flotas y tiers de consumidor parciales. Falta conocer los detalles del modelo escalonado de Grupo Purdy para entender que tanto se alinea.",
      "El software \"Mobile 360\" de Spiffy realiza un seguimiento de cada trabajo (retiros del mercado, inspecciones, pagos, etc.). Dispositivos patentados (Easy Tread, Easy Flow) recopilan datos del vehículo como el desgaste de llantas y niveles de fluidos en el momento del servicio. Afirman construir una base de datos con las necesidades de servicio del vehículo.",
      "La conectividad de Spiffy proviene de sus dispositivos de diagnóstico y su CRM. Easy Tread, un escáner de neumáticos, e Easy Flow, su sensor de fluidos, se integran directamente con la plataforma. Ofrecen servicio de modificacion de camionetas de servicio pero se encuentran fuera de CR.",
      "Claramente ofrecen un servicio que se puede adaptar a distintos modelos de ingresos. Facilitando transacciones de servicio y mantenimiento directamente en la ubicación del cliente.",
      "Spiffy enfatiza la simplicidad: los concesionarios afirman que \"la plataforma simplemente funciona\". La aplicación móvil para los clientes es muy directa. Lo que indica una UX que requiere muy poco esfuerzo.",
    ],
    narrative: "Spiffy presenta una propuesta sólida y bien articulada: combina servicios móviles de mantenimiento automotriz recurrente con un ecosistema de software propietario (Mobile 360) y dispositivos de diagnóstico físico (Easy Tread, Easy Flow) que generan datos accionables del vehículo en cada intervención, lo que lo posiciona favorablemente en captura de datos, modelo de ingresos flexible y experiencia de usuario de bajo esfuerzo. Su integración con CRMs y plataformas de pago sugiere apertura técnica que podría facilitar una conexión con Purdy Go, aunque no exponen APIs abiertas de forma explícita. El punto de fricción más relevante es que su operación y la conversión de sus camionetas de servicio están basadas en EE.UU., sin presencia confirmada en Costa Rica ni en LATAM, y no se cuenta con validación directa con el startup. Con una calificación de 76.25%, Spiffy es un candidato que vale la pena explorar: se recomienda establecer contacto directo para evaluar su disposición a operar en el mercado costarricense y la viabilidad de adaptar su modelo operativo a la región.",
    rank: 8, wsmScore: 7.625, tier: 4,
  },
  {
    name: "Sibros", sortOrder: 9, clusterId: clusterB.id,
    hqCity: "San Jose, CA", hqCountry: "EE.UU.", foundedYear: 2018, employeeRange: "200",
    fundingStage: "Series B" as const, fundingAmount: "~$70M", investors: "Energy Impact Partners, Nexus Venture Partners",
    websiteUrl: "https://sibros.tech/",
    description: "Deep Connected Platform: actualizaciones OTA, data logging granular y comandos remotos para todo el vehículo.",
    scores: [5, 10, 2.5, 10, 10, 7.5, 5],
    rationales: [
      "La plataforma \"Deep Connected Platform\" de Sibros está orientada a fabricantes (OEM) y flotas, no al consumidor directo. Habilita funciones (como alertas de mantenimiento, análisis de uso) que pueden mantener indirectamente el engagement de los conductores.",
      "Sibros proporciona API RESTful (\"Deep Logger\", actualizaciones OTA, comandos remotos) para cualquier arquitectura de vehículo. Se integra completamente con la nube, por ejemplo, Google BigQuery como receptor de datos. Los OEMs pueden \"extraer datos a través de las API proporcionadas por Sibros\" para unificar la información del vehículo en la nube.",
      "Sibros no implementa niveles de clientes. Es una plataforma tecnológica para vehículos definidos por software, no un motor de fidelización de clientes.",
      "Los datos son el núcleo: Sibros registra datos CAN de alta resolución, flujos configurables, etc. Enfatiza que estos datos permiten realizar mantenimiento predictivo e insights de I+D. Los OEMs obtienen analíticas detalladas sobre patrones de conducción y uso de vehículos.",
      "Este es el foco de Sibros: \"actualizaciones OTA y registro de datos listos para usar\". Gestiona todas las ECU y puede actualizarlas de forma segura. Está diseñada específicamente para conectar vehículos a la nube en tiempo real. Sus asociaciones con NXP y Google Cloud demuestran un sólido respaldo de conectividad.",
      "Ofrecen esquemas de suscripción y tarifas por vehículo con el modelo de revenue sharing. Su alianza con Google Cloud sugiere un componente basado en el uso.",
      "La experiencia del usuario final se entrega a través de las aplicaciones del propio OEM; Sibros es el backend, pero no cuenta con una interfaz directa para el usuario final que pueda evaluarse.",
    ],
    narrative: "Sibros tiene un perfil técnico muy bien definido. La plataforma Deep Connected está construida para gestionar actualizaciones OTA, logging de datos CAN de alta resolución y comandos remotos en arquitecturas de vehículo complejas. Sus alianzas con Google Cloud y NXP, junto con la integración nativa con BigQuery, hablan de una solución pensada para OEMs y operaciones de flota a gran escala. Sin embargo, su enfoque es claramente backend y B2B con fabricantes, no con concesionarios ni con el cliente final. No ofrece un sistema de lealtad ni una interfaz directa al usuario, por lo que la experiencia de cliente la define quien construya encima de su plataforma. Para Purdy, su valor potencial estaría en escenarios muy específicos relacionados con conectividad profunda al vehículo, pero queda fuera del rol de plataforma central que busca el proyecto.",
    rank: 9, wsmScore: 7.125, tier: 3,
  },
  {
    name: "Smartcar", sortOrder: 10, clusterId: clusterB.id,
    hqCity: "Mountain View, CA", hqCountry: "EE.UU.", foundedYear: 2015, employeeRange: "100",
    fundingStage: "Series B" as const, fundingAmount: "~$36M", investors: "Andreessen Horowitz, NEA, Energize Ventures",
    websiteUrl: "https://smartcar.com/",
    description: "API de vehículo conectado OEM-agnóstica: acceso estandarizado a odómetro, ubicación, combustible/batería y comandos en +35 marcas.",
    scores: [5, 7.5, 5, 7.5, 7.5, 7.5, 10],
    rationales: [
      "Habilita servicios recurrentes vía datos del vehículo. Con su servicio de conectividad del vehículo, facilitan la oferta de mantenimientos predictivo al igual que la habilidad de generar recomendaciones de modelos de vehículo nuevos para el usuario en base a patrones de manejo. Genera datos para usar con el cliente pero no genera la recurrencia en sí.",
      "API OEM-agnostica de clase mundial. Diseñada para integración vía APIs con 46 marcas de vehiculos. Arquitectura del software diseñada específicamente para facilitar la integración y el manejo de los datos de los vehículos y su conectividad con el distribuidor.",
      "Smartcar se especializa en la conectividad de los vehículos con aquellos que requieren de la gestión de la información. No ofrecen modelos de rewards ni suscripciones para el usuario final. Método de alineación potencial a los modelos rewards vía integración del uso del servicio escalonado.",
      "Gestiona los datos del vehículo como el odometro, su ubicación con GPS, niveles de gasolina y batería al igual que datos como el estado del motor y la presión de las llantas. Comunicando dicha información con Grupo Purdy vía APIs. No ofrece comportamiento del consumidor a nivel cliente del grupo, si no a nivel del vehículo y conducción.",
      "Más de 45 marcas soportadas y arquitectura cloud altamente escalable. Experiencia con clientes como Lyft, Uber y ev.energy demuestra una amplia capacidad de alianzas con terceros al igual que de escalabilidad.",
      "Ofrecen modelos de precios por vehículo. Con un precio base de 2 USD por vehiculo al mes. También ofrecen paquetes personalizados en los que se puede incluir el servicio de \"Tiered usage based pricing\" de manera que se podría integrar como modelo de ingresos.",
      "Ofrecen SDKs que facilitan la integración de los datos a cualquier app de Grupo Purdy. Ofreciendo experiencia para el usuario de bajo esfuerzo.",
    ],
    narrative: "Smartcar opera en una categoría distinta al resto de las soluciones evaluadas: no es una plataforma de lealtad ni de experiencia de cliente, sino una capa de conectividad que permite a otras herramientas acceder a datos reales del vehículo. Su API compatible con más de 45 marcas, junto con clientes como Uber, Lyft y ev.energy, la posicionan como un habilitador técnico sólido. No compite directamente en tiers de lealtad ni en recurrencia, porque esa lógica reside en las plataformas que se construyan sobre ella. Por lo mismo, tiene sentido considerarla como pieza complementaria dentro del stack, especialmente si se avanza con alguna solución de lealtad o CX que requiera datos vehiculares para alcanzar su potencial completo.",
    rank: 10, wsmScore: 6.875, tier: 3,
  },
  {
    name: "CAFU", sortOrder: 11, clusterId: clusterC.id,
    hqCity: "Dubai", hqCountry: "EAU", foundedYear: 2018, employeeRange: "250",
    fundingStage: "Series B" as const, fundingAmount: "~$20M+", investors: "ADNOC, Saned/Wamda, Ahmed Bin Saeed",
    websiteUrl: "https://cafu.com/",
    description: "Plataforma on-demand de entrega de combustible y cuidado del vehículo (lavado, cambio de aceite, ITV) a domicilio.",
    scores: [7.5, 7.5, 2.5, 7.5, 7.5, 7.5, 2.5],
    rationales: [
      "El servicio principal de CAFU es el suministro de combustible bajo demanda. El combustible es una necesidad recurrente y CAFU busca que el proceso de pedido no requiera esfuerzo. CAFU interactúa con los usuarios cada vez que el vehículo necesita energía. Esto mantiene la interacción constante pero es limitado a pocos servicios.",
      "CAFU integra las API de Smartcar para conectarse con los vehículos. Esto permite que la aplicación de CAFU obtenga de forma automática la ubicación del coche del cliente y el estado de su batería.",
      "Ofrece membresías/paquetes, pero el modelo escalonado no es el core. Se especializa en servicio de ayuda/apoyo al consumidor.",
      "Al conectarse a los vehículos y recibir pedidos, CAFU recopila datos sobre los patrones de carga y preferencias de los usuarios. La integración con Smartcar aporta datos, que CAFU puede aprovechar para la personalización.",
      "Escala regional (EAU/KSA) con red operativa; alianzas energéticas (ADNOC). CAFU ofrece esencialmente combustible y recarga móvil bajo demanda. Utiliza GPS para ubicar los automóviles y despachar los camiones de servicio. Su aplicación de recarga de vehículos eléctricos utiliza de forma directa datos del vehículo conectado para conocer la ubicación y el estado de la carga.",
      "Ingresos por entrega y servicios; margenes de combustible.",
      "La aplicación de CAFU está diseñada para ser extremadamente sencilla: solicita combustible/carga directo al automóvil estacionado. Smartcar señala que CAFU los eligió por su confiabilidad y facilidad de uso. Falta comprobar la capacidad de ser implementado en CR.",
    ],
    narrative: "CAFU presenta un modelo atractivo de movilidad energética bajo demanda con recurrencia natural, integración técnica madura vía Smartcar y capacidad real de captura de datos de comportamiento vehicular, lo que lo hace relevante conceptualmente para un ecosistema como Purdy Go. No obstante, su operación está concentrada en EAU y Arabia Saudita, mercados con condiciones muy distintas a Costa Rica, y no se logró validación directa con el startup, lo que impide evaluar su disposición real para expandirse a LATAM. Se recomienda no avanzar a una siguiente etapa por el momento, aunque vale la pena darle seguimiento si emergen señales claras de internacionalización hacia la región.",
    rank: 11, wsmScore: 6.25, tier: 4,
  },
  {
    name: "myKaarma", sortOrder: 12, clusterId: clusterA.id,
    hqCity: "Long Beach, CA", hqCountry: "EE.UU.", foundedYear: 2011, employeeRange: "250",
    fundingStage: "Series B+" as const, fundingAmount: "n/d (PE)", investors: "Warburg Pincus, Kayne Partners, H.I.G. Growth",
    websiteUrl: "https://mykaarma.com/",
    description: "Plataforma de comunicaciones, agendamiento, pagos e inspección en video para el service lane (fixed ops) de concesionarios.",
    scores: [5, 5, 2.5, 5, 7.5, 7.5, 10],
    rationales: [
      "myKaarma se especializa en gestión de clientes para servicios de mantenimiento. Generando interacciones y recurrencia solamente para temas del auto. Gestionando citas y seguimiento de mantenimientos y recalls.",
      "Integración con múltiples actores relevantes para la gestión de ventas, información y mantenimiento. Ofrecen APIs para gestionar la conectividad. Las integraciones son muy específicas en y enfocadas en el taller de la agencia de autos.",
      "No cuenta con programa de tiers o loyalty nativo. Enfocado en UX de servicio y pagos. No tiene capacidad de diferenciación de cliente de manera escalonada (Rewards/Connect/Pro).",
      "Datos de historial de servicio, video inspecciones digitales, métricas de satisfacción del cliente. Modelo predictivo básico para re agendar citas canceladas y gestionar recalls.",
      "Cuentan con más de 1,800 concesionarios activos. myKaarma tiene una fuerte presencia en el vertical de fixed ops automotriz, pero es bastante limitado fuera del ecosistema de mantenimiento de agencias.",
      "Modelo SaaS enfocado en modelo de ingresos transaccional. Gestionando y facilitando las transacciones recurrentes de mantenimientos y reparaciones.",
      "Facilita la realización de citas, la comunicación, los registros detallados de mantenimientos y el pago post venta. Ofreciendo un excelente UX.",
    ],
    narrative: "myKaarma hace bien lo que hace, pero lo que hace es muy específico: gestión de citas, inspecciones digitales, comunicación post-servicio y pagos dentro del taller de la agencia. Su UX es reconocidamente buena y su presencia en más de 1,800 concesionarios habla de que el producto funciona en el mundo real. El problema es que su alcance termina en el fixed ops, sin capacidad de escalar hacia un programa de lealtad escalonado, sin datos de comportamiento más allá del historial de servicio y sin una propuesta que conecte con las verticales más amplias de Purdy Go. Para un ecosistema que busca fidelización integral y personalización avanzada, myKaarma resuelve solo una pieza del rompecabezas. No se recomienda avanzar como solución principal, aunque podría revisarse su rol como herramienta de apoyo en el área de mantenimiento.",
    rank: 12, wsmScore: 5.625, tier: 2,
  },
];

// Insert each startup with its scores, ranking and recommendation
for (const s of startupDefs) {
  const { scores, rationales, narrative, rank, wsmScore, tier, ...fields } = s;

  await db.insert(startups).values({
    projectId,
    name: fields.name,
    description: fields.description,
    hqCity: fields.hqCity,
    hqCountry: fields.hqCountry,
    foundedYear: fields.foundedYear,
    employeeRange: fields.employeeRange,
    fundingStage: fields.fundingStage,
    fundingAmount: fields.fundingAmount,
    investors: fields.investors,
    websiteUrl: fields.websiteUrl,
    clusterId: fields.clusterId,
    eligible: true,
    sortOrder: fields.sortOrder,
  } as any);

  const allSt = await db.select().from(startups).where(eq(startups.projectId, projectId));
  const inserted = allSt.filter(r => r.name === s.name).slice(-1)[0];

  for (let i = 0; i < sortedReqs.length; i++) {
    await db.insert(wsmScores).values({
      projectId,
      startupId: inserted.id,
      requirementId: sortedReqs[i].id,
      humanScore: scores[i],
      rationale: rationales[i],
    });
  }

  await db.insert(rankings).values({ projectId, startupId: inserted.id, rank, wsmScore, tier });

  await db.insert(recommendations).values({
    projectId,
    startupId: inserted.id,
    narrative,
    decision: "recommended",
  });

  console.log(`  ✓ ${s.name} (rank ${rank}, WSM ${wsmScore})`);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Seed Grupo Purdy completado

  Proyecto ID: ${projectId}
  URL portal:  /purdy/001
  Passkey:     Purdy2026-oqijonds
  Startups:    12 (Antavo #1 → myKaarma #12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
