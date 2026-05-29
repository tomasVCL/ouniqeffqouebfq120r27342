/**
 * Update script — BAC Credomatic / Mauricio Retana
 * Updates existing project data with exact Excel values:
 *   - geo values, requirement descriptions, cluster names (Spanish),
 *     startup websiteUrls, WSM rationales, and recommendation narratives.
 *
 * Run with: DATABASE_URL=<url> tsx scripts/update-bac-retana.ts
 */

// dotenv not needed — DATABASE_URL passed via env directly
import mysql2 from "mysql2/promise";
import { and, eq } from "drizzle-orm";
import { getDb } from "../server/db.js";
import { projects, requirements, clusters, startups, wsmScores, recommendations, rankings } from "../drizzle/schema.js";

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

// ── Find project ───────────────────────────────────────────────────────────
const [project] = await db.select().from(projects)
  .where(and(eq(projects.clientSlug, "bac"), eq(projects.problemId, "001")))
  .limit(1);

if (!project) { console.error("❌  Project bac/001 not found"); process.exit(1); }
const projectId = project.id;
console.log(`✅  Found project ID ${projectId}`);

// ── Update geo ─────────────────────────────────────────────────────────────
await db.update(projects).set({ geoAllowed: "Todo el mundo", geoExcluded: "Ninguna", analystName: "Tomás Valles" })
  .where(eq(projects.id, projectId));
console.log("✅  Updated geo values + analystName");

// ── Update requirement descriptions ───────────────────────────────────────
const reqUpdates: Record<string, string> = {
  "Reducción de riesgo":
    "La solución debe identificar, priorizar y gestionar casos con alto riesgo de devolución, dirección dudosa, SLA próximo a vencer o necesidad de contacto adicional, mitigando riesgos operativos asociados a reprocesos, entregas fallidas, información incorrecta y gestión manual.",
  "Interfaz operativa, analítica e impacto":
    "Interfaz para configurar parámetros, revisar rutas, analizar escenarios, gestionar excepciones y monitorear resultados mediante dashboards/reportes que permitan medir reducción de reprocesos, devoluciones, visitas fallidas, tiempos, costos, cumplimiento de SLAs y productividad por formalizador/proveedor.",
  "Integración con sistemas existentes":
    "Consumir de forma segura la base de paquetes/casos y devolver/cargar resultados a herramientas actuales de formalización, distribución o gestión interna.",
};

const allReqs = await db.select().from(requirements).where(eq(requirements.projectId, projectId));
for (const req of allReqs) {
  if (reqUpdates[req.name]) {
    await db.update(requirements).set({ description: reqUpdates[req.name] }).where(eq(requirements.id, req.id));
    console.log(`  ✓ Updated description: ${req.name}`);
  }
}

// ── Update cluster names to Spanish ───────────────────────────────────────
const clusterNameMap: Record<string, string> = {
  "Enterprise Full-Service Platforms":      "Plataformas Enterprise de Última Milla",
  "LATAM Route Intelligence & Workforce":   "Optimización de Rutas & Workforce Management",
  "Fintech Delivery & Urban Fulfillment":   "Fulfillment Fintech & Última Milla Urbana",
};

const allClusters = await db.select().from(clusters).where(eq(clusters.projectId, projectId));
for (const c of allClusters) {
  if (clusterNameMap[c.name]) {
    await db.update(clusters).set({ name: clusterNameMap[c.name] }).where(eq(clusters.id, c.id));
    console.log(`  ✓ Renamed cluster: ${c.name} → ${clusterNameMap[c.name]}`);
  }
}

// ── Update startup website URLs ────────────────────────────────────────────
const websiteUrls: Record<string, string> = {
  "DispatchTrack": "https://www.dispatchtrack.com/",
  "FarEye":        "https://fareye.com/",
  "Bringg":        "https://www.bringg.com/",
  "Wise Systems":  "https://www.wisesystems.com/",
  "Routific":      "https://www.routific.com/",
  "SimpliRoute":   "https://simpliroute.com/",
  "OneRail":       "https://www.onerail.com/",
  "SmartQuick":    "https://smartquick.ai/",
  "Moova":         "https://moova.io/",
  "Mienvío":       "https://www.mienvio.mx/",
  "Cubbo":         "https://www.cubbo.com/",
  "Ravent":        "https://ravent.com/",
};

const allStartups = await db.select().from(startups).where(eq(startups.projectId, projectId));
for (const s of allStartups) {
  if (websiteUrls[s.name]) {
    await db.update(startups).set({ websiteUrl: websiteUrls[s.name] } as any).where(eq(startups.id, s.id));
    console.log(`  ✓ websiteUrl: ${s.name} → ${websiteUrls[s.name]}`);
  }
}

// ── Update WSM score rationales ────────────────────────────────────────────
// Format: { startup: [ r1, r2, r3, r4, r5, r6, r7, r8 ] }
// Order matches sortOrder of requirements: 1-8
const rationaleData: Record<string, string[]> = {
  "FarEye": [
    "Con el uso de su herramienta Pilot prometen una reducción de tiempo humano de 10 horas a 60 minutos. Comunicandose automáticamente con repartidores, recalculando asignación de rutas, monitoreando y solucionando problemas de ruteo.",
    "Delivery status page con branding para clientes, facilita el cross selling con personalised adds",
    "Tecnología 'geosmart' que convierte direcciones no estándar en smart codes (exactitud tipo Waze) y Smart Suggestións con IA.",
    "Asigna órdenes considerando capacidad del vehículo, tráfico, zonas/horarios de servicio, preferencias y familiaridad del conductor con la zona.",
    "FarEye gestióna el cumplimiento de SLAs al gestiónar el trafico, capacidad de vehiculos y las habilidades de los conductores. Con uso de IA se definen las rutas de entrega y se mantiene al cliente informado sobre tiempos estimados de entrega. Prometiendo una reducción de entregas no realizadas de hasta 25%.",
    "Security Of IT Infrastructure And Its Related Assets, Viz. Information, Computer Systems, Network Elements, Related Services Are Vital Importance Certificaciónes, ISO 27001:2018\nISO 27001:2013",
    "FarEye cuenta con una plataforma de análisis de medición de tendencias y KPIs, permitiendo tomar decisiones, evaluar cumplimiento de SLA's al igual que analizando la productividad de los repartidores.",
    "FarEye tiene capacidades de integración con su API. Mencionan integraciónes con WMS, OMS, ERP, CRM al igual que con porvedores de logística externos.",
  ],
  "Wise Systems": [
    "Optimización autónoma con ML que reduce kilómetros y mejora utilización de flota; Strategic Planner para planeación de territorios/recursos.",
    "Delivery status page con branding para clientes, facilita el cross selling",
    "Ruteo dinámico con ML, re-secuenciación ante tráfico y ETAs precisas en tiempo real.",
    "Despacho autónomo: decisiones de despliegue de conductores/vehículos por software, zonas por preferencia del conductor y transferencia de paradas entre conductores (mejor ajuste a 'balanceo de formalizadores').",
    "Gestión de excepciones, prueba de entrega (firma, código de barras, foto, notas) y reducción de entregas tardías; priorización específica de riesgo parcial.",
    "Wise Systems utilizes enterprise-grade best practices to protect our customers. SOC 2 compliant",
    "Performance Manager mide on-time % por ruta y por conductor, volúmenes de tareas y planificado vs. real (productividad por formalizador).",
    "Plataforma cloud que importa órdenes e integra vía API; amplitud de integración enterprise por validar.",
  ],
  "Bringg": [
    "Orquestación enterprise con AI routing y modelo mixto (flota propia + 3PL) que optimiza la operación de última milla.",
    "Comunicación con el cliente durante la entrega (superficie de marca); branding en la entrega.",
    "Ruteo con IA para última milla a escala enterprise.",
    "Asignación y orquestación de conductores/flota (propios y 3PL) con dispatch inteligente.",
    "Gestión de excepciones y comunicación al cliente con cumplimiento de SLA en tiempo real; priorización específica de riesgo parcial, cliente puede reagendar entregas.",
    "Certificaciónes ISO/IEC 27001 (renovada anualmente) y SOC 2 Tipo 2, más controles HIPAA (Trust Center de Bringg). Nivel adecuado para entorno financiero.",
    "Dashboards y analítica de orquestación con visibilidad en tiempo real.",
    "Integraciónes enterprise (respaldo de Salesforce Ventures) y modelo multi-fuente (propio + 3PL).",
  ],
  "DispatchTrack": [
    "Optimización de rutas con IA y costeo automático de rutas (rentabilidad), adaptado a in-house fleets, 3PLs, contractors, o una combinación.",
    "'Text Me Widget' de interacción pre-entrega que capta leads calificados y encuestas post-entrega; habilita interacción comercial, no un módulo pleno de cross-selling.",
    "Plataforma de última milla con optimización de rutas por IA y mejor ruta por camión; geolocalización en tiempo real.",
    "Determina la mejor ruta y carga por camión y gestióna el dispatch (Driver AI); asignación por conductor sólida.",
    "Track & Trace con traza de auditoría que combate falsa responsabilidad, gestión de excepciones desde el dashboard y prueba de entrega geoetiquetada/fechada.",
    "Enterprise-grade best practices to protect customers. SOC 2 compliant",
    "Dashboard en tiempo real con KPIs personalizables y reportes; conecta con Power BI/Tableau y compara planificado vs. real.",
    "Buena integración con sistemas; Total Visibility unifica datos propios y de 3PL en un solo panel.",
  ],
  "SimpliRoute": [
    "Optimización de rutas con uso da IA para reducir vehículos necesarios y kilómetros recorridos. Cuenta con asignación por capacidad/habilidades de vehículo, agrupación de flotas y zonificación personalizada por repartidor.",
    "Sin cross-selling como parte del producto. Software específico de gestión logística.",
    "Consiste de capacidades como optimización don tráfico en tiempo real, edición de rutas, alertas predictivas, tiempo estimado de llegada y rastreo en vivo para el cliente.",
    "Optimización de rutas con uso de IA para reducir la cantidad de vehículos en la flota, asignación por capacidad/habilidades del vehículo, agrupación de flotas y zonificación personalizada por repartidor/formalizador. \"Al usar este optimizador, tus visitas se asignarán de manera equilibrada a cada uno de los vehículos disponibles\"",
    "Se comunica el tiempo exacto de entrega con actualizaciones a través de Email, SMS, WhatsApp y LiveTracking. Facilitando la comunicación de manera que se reduce el riesgo de una entrega fallida con necesidad de reproceso.",
    "Cuenta con certificación ISO 27000 como Sistema de Gestión de Seguridad de la Información",
    "SLA se pueden atender con la planeación de asignación de entregas por fecha. Consiste de monitoreo en tiempo real, dashboard integrál, generación de reportes a la medida al igual que machine learning para optimizar en base a historial.",
    "Plataforma cloud con APIs e integraciónes. Manejan integraciónes visa SimpliRoute Direct, Zapier y \"custom made\" con uso de su API.",
  ],
  "OneRail": [
    "Con uso de IA se optimiza el modo de envío, carrier, costo y capacidad, con redundancia de red. utilizando su plataforma OmniPoint.",
    "PV — sin evidencia de cross-selling en la entrega.",
    "Se cumple el requisito ya que cuentan con un app llamado OneRail el cual facilita a los repartidores la navegación con GPS y Llamadas o texto con clientes para facilitar entregas.",
    "OneRail facilita la asignación al optimizar en base a los repartidores disponibles y sus capacidades específicas. Maximizando la utilización y reduciendo costos.",
    "Optimización de rutas con uso de IA para reducir la cantidad de vehículos en la flota, asignación por capacidad/habilidades del vehículo, agrupación de flotas y zonificación personalizada por repartidor/formalizador. \"Al usar este optimizador, tus visitas se asignarán de manera equilibrada a cada uno de los vehiculos disponibles\"",
    "Cumplen con certificaciónes ISO 27001:2022 & SOC 2 en el manejo de la seguridad de la información.",
    "OneRail menciona la capacidad de gestiónar excepciones \"Exception Assist\" al intervenir con un equipo especializado en casos necesarios. También cuentan con un sistema de gestión unificado en el que se consolida la información.",
    "OneRail menciona integraciónes específicamente con IBM y SAP como sus fundamentos de crecimiento y desarrollo. Al igual que integradores de sistema y socios estratégicos de tecnología. Incluyendo APIs con alta capacidad de personalización.",
  ],
  "Routific": [
    "Optimización de rutas con reducción de combustible/costo (hasta 25-40%), capacidad de vehículo y ventanas horarias; enfoque PyME/mediano.",
    "PV — sin evidencia de cross-selling en la entrega.",
    "Ruteo con ML y ETAs precisas (tráfico histórico, túneles, puentes); validación de direcciones y definición de parada por coordenadas GPS, rutas navegables desde Waze/Maps.",
    "Reasignación de paradas entre conductores y consideración de velocidades/turnos/prioridades; balanceo de fuerza laboral limitado.",
    "Validación de direcciones (reduce entregas fallidas) y prueba de entrega con foto/firma; sin priorización avanzada de riesgo ni auditoría profunda (señalado como limitación).",
    "Reportado como 'ligero' en cumplimiento profundo y trazas de auditoría de largo plazo; sin certificación publicada.",
    "Edición de rutas, reportes de desempeño del conductor y captura de datos de entrega; ofrece un support dashboard.",
    "API de optimización de rutas líder y fácil de integrar (elegida por software partners); amplitud de integración con sistemas internos. Se puede alimentar directamente con excel files",
  ],
  "SmartQuick": [
    "Ruteo ML (-30% combustible), y selección predictiva de flota; 25-35% de reducción de costos (claims del proveedor).",
    "sin evidencia de cross-selling en la entrega.",
    "Ruteo con ML no supervisado, georreferenciación, ventanas horarias y restricciones viales (orientado a transporte de carga; claims del proveedor).",
    "Asignación predictiva de operadores y selección de flota; orientado a vehículos/monitoreo más que a formalizadores en campo.",
    "Torre de control con monitoreo predictivo (-40% fallas, claim), OCR de documentos y alertas; priorización de riesgo de entrega parcial, incluye agentes de voz con IA que realizan llamadas automáticas a conductores y clientes para confirmar estados de entrega, notificar ETAs y gestiónar novedades",
    "Encriptación AES-256 para datos en reposo y TLS 1.3 para datos en tránsito. Cumplimiento de estándares de seguridad de la información. Nada respecto al entorno financiero",
    "Dashboard IA con Cronómetro ANS con monitoreo en tiempo real, OCR y reportes; analítica operativa sólida.",
    "APIs abiertas y webhooks para integración con ERP y WMS; integración con core bancario por validar.",
  ],
  "Moova": [
    "Moova ofrece servicio de administración de logística de flotas como herramienta para terceros. Ofrece \"herramientas de ruteo, seguimiento y eficiencia en la última milla\" Moova también menciona que \"puedes integrar la tecnología de Moova y optimizar tu sistema de envíos con Inteligencia Artificial y Machine Learning.\"",
    "No se menciona cross-selling directamente. Permiten recolectar datos en la entrega al igual que envío de documentación.",
    "Moova ofrece un sistema de ruteo inteligente, panel de control en tiempo real de envios y tracking. Mencionan una tecnología avanzada de ruteo.",
    "tecnología de ruteo de avanzada pero no una asignación a formalizadores de manera explícita.",
    "Prueba de entrega con foto, escaneo de documento obligatorio en la entrega, verificación de pregunta secreta, al igual que comprobante con firma digital en la entrega.",
    "No se menciona directamente. Mencionan operaciones con Scotiabank y una sección específica sobre su funcionalidad con empresas fintech.",
    "Se menciona el seguimiento en tiempo real y los mecanismos de evidencia de entregas, poseen al menos 4 diferentes vistas en sus dashboards otorgando vision geografica, a través del tiempo y con conteo de entregas exitosas / no exitosas.",
    "Se mencionan integraciónes con uso de su API. También se cuenta con plugins a distintas plataformas. Pendiente validar necesidades de especificad de BAC.",
  ],
  "Mienvío": [
    "Optimiza recursos a nivel multi paquetería, no flota propia. Incluyen la selección automática del mejor carrier por costo, SLA y capacidad. Mencionan 15-25% de ahorro en costos de envío.",
    "Ofrecen entregas de \"Kits de bienvenida\" Por ejemplo, la tarjeta, tokens de seguridad y material promocional",
    "Ruteo automático por costo, SLA y zona",
    "Asigna inteligente de carriers, Reportes de dependencia para migrar entre flotilla propia y terceros.",
    "Se menciona \"Configuramos reglas + SLAs definido como un motor de reglas para OTD, prioridades, restricciones y gestión de excepciones.\" También cuentan con analítica de pre incidencias para prevenir fallas de entrega.",
    "Mienvío menciona experiencia con el manejo de documentos sensibles: Contratos, estados de cuenta y correspondencia regulatoria con cadena de custodia y confirmación de recepción. También se menciona cumplimiento de estándares enterprise, control de acceso y encriptación de datos.",
    "Gestión de incidencias, auditoría continua y reportes de performance.",
    "Mienvío menciona que facilitan la integración de convenios existentes o tarifas negociadas por ellos mismos. Sin reconstruir integraciónes. También se menciona integración vía API REST o dashboard a sistemas de emisión de tarjetas. También mencionan en el tema de integración un API con documentación completa y sandbox en menos de una semana. \"Integración directa con tu ERP, WMS u OMS\"",
  ],
  "Cubbo": [
    "Asignación inteligente del carrier más eficiente por zona\nen función de costo y servicio Optimiza fulfillment, inventario y red de microbodegas urbanas para acortar tiempos/costos; no optimiza flota ni fuerza de distribución en campo.",
    "Cubbo se especializa en simplificar la logística de envíos y fulfillment. Sin cross selling como area de enfoque.",
    "Modelo de fulfillment; la última milla se ejecuta vía carriers. Sin motor propio de ruteo/geolocalización tipo Waze.",
    "Asignación inteligente del carrier más eficiente por zona",
    "Da visibilidad sobre el estado del pedido\ny disminuye los tickets y cancelaciones por incidentes, le notifica al cliente cuándo le va a llegar el envio y este tiene un tracking de su pedido, cuenta con algunos dashboards sobre rendimiento de carriers",
    "Tienen experiencia directa con 4 bancos diferentes a nivel LATAM",
    "Muestra dashboards para el manejo de paquetería y cliente, invoices, rendimiento de carriers y desempeño en tiempos de entrega",
    "Cuentan con integraciónes hacia diferentes plataformas, integración directa a la app del cliente para desplegar el estatus del envío",
  ],
  "Ravent": [
    "RAVENT tiene capacidades sólidas de orchestration logística y fulfillment end-to-end. Su plataforma optimiza asignaciones, automatiza workflows, coordina recursos y mejora la utilización operativa mediante routing inteligente, automatización de tareas y monitoreo centralizado.",
    "La solución incorpora capacidades de customer communication omnicanal, workflows automatizados y engagement contextual durante el proceso de entrega/formalización. Aunque no es una plataforma comercial especializada, sí podría habilitar oportunidades de cross-selling o comunicación comercial contextualizada.",
    "RAVENT incluye optimización de rutas, tracking en tiempo real, ETAs dinámicos, geofencing y navegación integrada. La plataforma está diseñada específicamente para coordinar operaciones de campo y entregas con visibilidad en tiempo real.",
    "La plataforma cuenta con capacidades de task assignment, dispatching y workload orchestration. Permite distribuir órdenes/casos entre distintos operadores o equipos, monitorear productividad y coordinar ejecución operativa de manera balanceada.",
    "Este es uno de los puntos más fuertes de RAVENT. La solución incorpora SLA monitoring, exception management, customer re-engagement, alertas automáticas, workflows de seguimiento, ETAs dinámicos y automatización de excepciones para mitigar reprocesos y entregas fallidas.",
    "No cuentan con informacion detallando el manejo de la informacion ni hacen alusion a poseer una certificacion que los respalde",
    "Tienen dashboards operativos, KPIs, analytics de utilización, live tracking, exception management, workflow builder y monitoreo de productividad. Muy alineado al requerimiento.",
    "Muy fuerte. APIs centralizadas, multi-provider orchestration e integración omnicanal son prácticamente core del producto.",
  ],
};

const sortedReqs = allReqs.sort((a, b) => a.sortOrder - b.sortOrder);

for (const s of allStartups) {
  const rationales = rationaleData[s.name];
  if (!rationales) continue;
  const allScores = await db.select().from(wsmScores)
    .where(and(eq(wsmScores.projectId, projectId), eq(wsmScores.startupId, s.id)));
  for (let i = 0; i < sortedReqs.length && i < rationales.length; i++) {
    const reqId = sortedReqs[i].id;
    const score = allScores.find(sc => sc.requirementId === reqId);
    if (score) {
      await db.update(wsmScores).set({ rationale: rationales[i] }).where(eq(wsmScores.id, score.id));
    }
  }
  console.log(`  ✓ Updated rationales: ${s.name}`);
}

// ── Update recommendation narratives ──────────────────────────────────────
const narrativeData: Record<string, string> = {
  "FarEye":
    "FarEye obtiene el puntaje perfecto: cumple los 8 criterios al máximo nivel. Su tecnología geosmart convierte direcciones no estándar en smart codes (exactitud tipo Waze, requisito explícito del cliente), su herramienta Pilot reduce el tiempo humano de planificación de 10 horas a 60 minutos y su gestión de SLAs cubre tráfico, capacidad de vehículos y habilidades del conductor. Cuenta con certificaciones ISO 27001 + SOC 2 y experiencia con clientes como DHL, UPS y Walmart. Es la opción más completa de extremo a extremo para el problema de logística de entrega de tarjetas de BAC y se recomienda como proveedor principal para un piloto inmediato.",
  "Wise Systems":
    "Wise Systems alcanza el segundo lugar con un dispatch autónomo basado en ML que elimina la intervención manual en la asignación, atacando directamente el dolor de los reprocesos. Su Performance Manager mide on-time por ruta y por conductor — métricas clave para el alto reproceso reportado por BAC. Cumple SOC 2 y reduce kilómetros con re-secuenciación dinámica ante tráfico. Su única limitación es una integración enterprise por validar; aun así, es una solución de primer nivel para el entorno operativo y se recomienda como segunda opción de piloto o como capa de optimización si BAC priza el dispatch automatizado.",
  "SimpliRoute":
    "SimpliRoute es el líder LATAM del comparativo: cumple los 8 criterios y aporta 120+ clientes en México con casos comprobados de 25-35% de reducción de costos logísticos. Cuenta con ISO 27001 (único en su cluster), ruteo con ML, georreferenciación con ventanas horarias y comunicación multicanal (Email/SMS/WhatsApp/LiveTracking) que reduce devoluciones por ausencia. Su debilidad es el cross-selling, no contemplado en la plataforma. Se recomienda como piloto LATAM más alineado culturalmente al equipo de Distribución y como benchmark de mercado regional.",
  "Bringg":
    "Bringg orquesta última milla a escala enterprise con un modelo mixto (flota propia + 3PL), ideal para BAC si combina formalizadores internos con servicios tercerizados. Sus certificaciones ISO/IEC 27001 + SOC 2 Tipo 2 + controles HIPAA son las más sólidas para datos sensibles como contratos y tarjetas. El respaldo de Salesforce Ventures asegura integraciones empresariales. Su única debilidad relativa es el cross-selling, limitado a comunicación de marca durante la entrega. Se recomienda para clientes BAC que requieran orquestar formalizadores diversos con control central.",
  "DispatchTrack":
    "DispatchTrack ofrece optimización de rutas con IA y costeo automático por ruta — una ventaja directa para medir la rentabilidad por intento de entrega que hoy BAC no cuantifica. Total Visibility unifica datos propios y de 3PL, su Driver AI gestiona el dispatch y el Text Me Widget pre-entrega capta leads calificados (puntaje 2 en cross-selling). La certificación de seguridad específica es ligera para entorno bancario, lo que requeriría validación. Se recomienda como solución probada con 2,500+ clientes y 180M entregas/año, ideal para escala enterprise.",
  "OneRail":
    "OneRail consolida 100+ carriers en una sola API con SLA tracking en tiempo real, lo que reduce el riesgo de devolución al cambiar dinámicamente de proveedor ante fallas. Su Exception Assist combina IA con un equipo humano que interviene en casos de alto riesgo — un mecanismo directo para mitigar el 80% de reprocesos reportado por BAC. Cuenta con ISO 27001:2022 + SOC 2 y respaldo de IBM y SAP para integración. Su debilidad es cross-selling. Se recomienda si BAC busca una capa multi-carrier sin migrar el flujo actual.",
  "Moova":
    "Moova es el único especialista del universo evaluado en logística fintech: opera entrega de tarjetas bancarias y POS, exactamente el problema de BAC. Su ruteo inteligente con panel de control en tiempo real es robusto (puntaje 4 en rutas y optimización), aunque no detalla certificaciones bancarias estándar — punto a validar en due diligence. Respaldo de Toyota Tsusho y Wayra (Telefónica) le da estabilidad. Se recomienda fuertemente como piloto vertical: ningún otro proveedor tiene experiencia 1:1 con entrega de plásticos bancarios en LATAM.",
  "Mienvío":
    "Mienvío opera un Control Tower multi-paquetería con 30+ paqueterías y 40,000+ códigos postales, con cobertura existente en Centroamérica y experiencia documentada en entrega de contratos, estados de cuenta y certificados — análogo al caso de BAC. Su motor de reglas configurable cubre SLAs, prioridades y restricciones de entrega, y su capacidad de integrar convenios existentes facilita el onboarding. Ruteo automático por costo, SLA y zona, es un buen fit para BAC si se trata especialmente de tarjetas.",
  "Routific":
    "Routific destaca por su API de optimización de rutas líder en el mercado, elegida por integradores de software por su facilidad de embebido. Reduce 30% km, 25% combustible y 50% tiempo de planificación, con validación de direcciones y prueba de entrega con foto/firma. Su debilidad principal es la profundidad en cumplimiento y trazas de auditoría de largo plazo, sin certificaciones específicas para entorno bancario — un riesgo a evaluar. Se recomienda como motor de ruteo embebido en una plataforma BAC existente, no como solución end-to-end.",
  "SmartQuick":
    "SmartQuick es un TMS colombiano con cubicaje 3D, RNDC automático y selección predictiva de flota. Su torre de control con monitoreo predictivo reclama -40% en fallas y dispone de OCR para documentos — útil para la formalización en campo que BAC requiere. Cuenta con encriptación AES-256 y TLS 1.3, aunque sin certificaciones bancarias estándar (puntaje 2 en confidencialidad). Se recomienda como opción LATAM de menor costo si el piloto se acota a optimización de rutas y no a manejo profundo de información confidencial.",
  "Cubbo":
    "Cubbo se especializa en fulfillment urbano que convierte espacios en microbodegas logísticas same-day desde CDMX y Bogotá. Tiene experiencia directa con 4 bancos a nivel LATAM (puntaje 3 en confidencialidad), pero su modelo de última milla se ejecuta vía carriers terceros y carece de motor propio de ruteo o geolocalización — un gap importante frente al requisito explícito de capacidad tipo Waze. Se recomienda monitorear su evolución o evaluar para escenarios de almacenamiento de tarjetas pre-entrega, no como solución integral.",
  "Ravent":
    "Ravent ingresa al comparativo en el sexto lugar (WSM 9.25) con desempeño sobresaliente en 7 de 8 criterios. Su plataforma de fulfillment orchestration centraliza pedidos multi-canal, automatiza el flujo order-to-cash y coordina recursos de campo con routing inteligente, ETAs dinámicos, SLA monitoring y exception management automatizado — una cobertura end-to-end directamente alineada al problema de entrega de BAC. Cuenta con task dispatching, workload balancing, geofencing y APIs multi-proveedor que facilitan la integración con el ecosistema tecnológico existente. Su único punto débil es la ausencia de certificaciones de seguridad documentadas (ISO 27001 / SOC 2), elemento crítico para el manejo de información bancaria sensible que deberá validarse en due diligence. Empresa joven (2019, 6 empleados), sin funding externo, lo que implica riesgo adicional de escalabilidad y soporte. Se recomienda considerar para piloto dentro del Cluster Enterprise una vez que presente evidencia de controles de seguridad certificados.",
};

const allRecs = await db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
for (const rec of allRecs) {
  const startup = allStartups.find(s => s.id === rec.startupId);
  if (!startup) continue;
  const narrative = narrativeData[startup.name];
  if (narrative) {
    await db.update(recommendations).set({ narrative }).where(eq(recommendations.id, rec.id));
    console.log(`  ✓ Updated narrative: ${startup.name}`);
  }
}

// ── Update individual WSM scores (score-only changes from new Excel) ───────
// req2 = Cross-Selling (sortOrder index 1), req6 = Confidencialidad (sortOrder index 5)
const scoreUpdates: Record<string, { reqIndex: number; humanScore: number }[]> = {
  "FarEye":       [{ reqIndex: 1, humanScore: 7.5  }],
  "Wise Systems": [{ reqIndex: 1, humanScore: 2.5  }],
  "Bringg":       [{ reqIndex: 1, humanScore: 2.5  }],
  "DispatchTrack":[{ reqIndex: 1, humanScore: 2.5  }, { reqIndex: 5, humanScore: 10 }],
  "Mienvío":      [{ reqIndex: 1, humanScore: 5    }],
};

for (const [startupName, updates] of Object.entries(scoreUpdates)) {
  const s = allStartups.find(x => x.name === startupName);
  if (!s) { console.warn(`  ⚠  ${startupName} not found`); continue; }
  const scoreRows = await db.select().from(wsmScores)
    .where(and(eq(wsmScores.projectId, projectId), eq(wsmScores.startupId, s.id)));
  for (const { reqIndex, humanScore } of updates) {
    const reqId = sortedReqs[reqIndex]?.id;
    if (!reqId) continue;
    const row = scoreRows.find(sc => sc.requirementId === reqId);
    if (row) {
      await db.update(wsmScores).set({ humanScore }).where(eq(wsmScores.id, row.id));
      console.log(`  ✓ Score: ${startupName} req[${reqIndex + 1}] → ${humanScore}`);
    }
  }
}

// ── Mienvío full scores (req2 now 5 instead of 7.5) ─────────────────────
const mienvio = allStartups.find(s => s.name === "Mienvío");
if (mienvio) {
  // Scores already handled above via scoreUpdates; just confirm
  console.log("✅  Mienvío req2 score updated → 5 (WSM 9.125)");
}

// ── Mark boxful as ineligible (removing from analysis) ───────────────────
const boxful = allStartups.find(s => s.name === "boxful");
if (boxful) {
  await db.update(startups).set({ eligible: false, excludedReason: "Reemplazado por Ravent en la evaluación final" } as any)
    .where(eq(startups.id, boxful.id));
  console.log("✅  boxful → ineligible (excluido del análisis)");
}

// ── Insert Ravent startup (skip if already exists) ────────────────────────
let ravent = allStartups.find(s => s.name === "Ravent");
if (!ravent) {
  const enterpriseCluster = allClusters.find(
    c => c.name === "Plataformas Enterprise de Última Milla" || c.name === "Enterprise Full-Service Platforms"
  );
  const [inserted] = await db.insert(startups).values({
    projectId,
    name: "Ravent",
    description: "Plataforma para gestión de cumplimiento de servicios (fulfillment), órdenes y transporte. Centraliza pedidos de múltiples canales y orquesta el fulfillment entre equipos y ubicaciones. Automatiza el proceso order-to-cash.",
    hqCity: "Miguel Hidalgo, Ciudad de México",
    hqCountry: "México",
    foundedYear: 2019,
    fundingAmount: "N/A",
    employeeRange: "6",
    eligible: true,
    websiteUrl: "https://ravent.com/",
    clusterId: enterpriseCluster?.id ?? null,
    sortOrder: 6,
  } as any);
  // Fetch the inserted startup
  const freshStartups = await db.select().from(startups).where(eq(startups.projectId, projectId));
  ravent = freshStartups.find(s => s.name === "Ravent")!;
  console.log(`✅  Ravent startup inserted (id ${ravent.id})`);
} else {
  console.log(`✅  Ravent already exists (id ${ravent.id}), skipping insert`);
}

// ── Insert Ravent WSM scores ───────────────────────────────────────────────
const raventScores = [10, 10, 10, 10, 10, 2.5, 10, 10]; // 0-4 × 2.5 stored as 0-10
const raventRationales = [
  "RAVENT tiene capacidades sólidas de orchestration logística y fulfillment end-to-end. Su plataforma optimiza asignaciones, automatiza workflows, coordina recursos y mejora la utilización operativa mediante routing inteligente, automatización de tareas y monitoreo centralizado.",
  "La solución incorpora capacidades de customer communication omnicanal, workflows automatizados y engagement contextual durante el proceso de entrega/formalización. Aunque no es una plataforma comercial especializada, sí podría habilitar oportunidades de cross-selling o comunicación comercial contextualizada.",
  "RAVENT incluye optimización de rutas, tracking en tiempo real, ETAs dinámicos, geofencing y navegación integrada. La plataforma está diseñada específicamente para coordinar operaciones de campo y entregas con visibilidad en tiempo real.",
  "La plataforma cuenta con capacidades de task assignment, dispatching y workload orchestration. Permite distribuir órdenes/casos entre distintos operadores o equipos, monitorear productividad y coordinar ejecución operativa de manera balanceada.",
  "Este es uno de los puntos más fuertes de RAVENT. La solución incorpora SLA monitoring, exception management, customer re-engagement, alertas automáticas, workflows de seguimiento, ETAs dinámicos y automatización de excepciones para mitigar reprocesos y entregas fallidas.",
  "No cuentan con informacion detallando el manejo de la informacion ni hacen alusion a poseer una certificacion que los respalde",
  "Tienen dashboards operativos, KPIs, analytics de utilización, live tracking, exception management, workflow builder y monitoreo de productividad. Muy alineado al requerimiento.",
  "Muy fuerte. APIs centralizadas, multi-provider orchestration e integración omnicanal son prácticamente core del producto.",
];

const existingRaventScores = await db.select().from(wsmScores)
  .where(and(eq(wsmScores.projectId, projectId), eq(wsmScores.startupId, ravent.id)));

for (let i = 0; i < sortedReqs.length && i < raventScores.length; i++) {
  const reqId = sortedReqs[i].id;
  const existing = existingRaventScores.find(sc => sc.requirementId === reqId);
  if (existing) {
    await db.update(wsmScores).set({ humanScore: raventScores[i], rationale: raventRationales[i] })
      .where(eq(wsmScores.id, existing.id));
  } else {
    await db.insert(wsmScores).values({
      projectId,
      startupId: ravent.id,
      requirementId: reqId,
      humanScore: raventScores[i],
      rationale: raventRationales[i],
    });
  }
}
console.log("✅  Ravent WSM scores & rationales upserted");

// ── Insert/update Ravent recommendation ──────────────────────────────────
const allRecs2 = await db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
const raventRec = allRecs2.find(r => r.startupId === ravent!.id);
const raventNarrative = "Ravent ingresa al comparativo en el sexto lugar (WSM 9.25) con desempeño sobresaliente en 7 de 8 criterios. Su plataforma de fulfillment orchestration centraliza pedidos multi-canal, automatiza el flujo order-to-cash y coordina recursos de campo con routing inteligente, ETAs dinámicos, SLA monitoring y exception management automatizado — una cobertura end-to-end directamente alineada al problema de entrega de BAC. Cuenta con task dispatching, workload balancing, geofencing y APIs multi-proveedor que facilitan la integración con el ecosistema tecnológico existente. Su único punto débil es la ausencia de certificaciones de seguridad documentadas (ISO 27001 / SOC 2), elemento crítico para el manejo de información bancaria sensible que deberá validarse en due diligence. Empresa joven (2019, 6 empleados), sin funding externo, lo que implica riesgo adicional de escalabilidad y soporte. Se recomienda considerar para piloto dentro del Cluster Enterprise una vez que presente evidencia de controles de seguridad certificados.";
if (raventRec) {
  await db.update(recommendations).set({ narrative: raventNarrative, decision: "recommended" })
    .where(eq(recommendations.id, raventRec.id));
} else {
  await db.insert(recommendations).values({
    projectId,
    startupId: ravent.id,
    narrative: raventNarrative,
    decision: "recommended",
  });
}
console.log("✅  Ravent recommendation upserted");

// ── Update all rankings (new scores after Excel revision) ─────────────────
const newRankings: { name: string; rank: number; wsmScore: number; tier: number }[] = [
  { name: "FarEye",         rank: 1,  wsmScore: 9.875, tier: 1 },
  { name: "DispatchTrack",  rank: 2,  wsmScore: 9.625, tier: 2 },
  { name: "SimpliRoute",    rank: 3,  wsmScore: 9.5,   tier: 2 },
  { name: "Wise Systems",   rank: 4,  wsmScore: 9.375, tier: 2 },
  { name: "Bringg",         rank: 5,  wsmScore: 9.375, tier: 2 },
  { name: "Ravent",         rank: 6,  wsmScore: 9.25,  tier: 2 },
  { name: "Mienvío",        rank: 7,  wsmScore: 9.125, tier: 2 },
  { name: "OneRail",        rank: 8,  wsmScore: 8.625, tier: 2 },
  { name: "Moova",          rank: 9,  wsmScore: 8.125, tier: 3 },
  { name: "Routific",       rank: 10, wsmScore: 7.75,  tier: 3 },
  { name: "SmartQuick",     rank: 11, wsmScore: 7.625, tier: 3 },
  { name: "Cubbo",          rank: 12, wsmScore: 6.875, tier: 4 },
];

const freshStartupsAll = await db.select().from(startups).where(eq(startups.projectId, projectId));
const allRankings = await db.select().from(rankings).where(eq(rankings.projectId, projectId));

for (const entry of newRankings) {
  const s = freshStartupsAll.find(x => x.name === entry.name);
  if (!s) { console.warn(`  ⚠  ${entry.name} not found for ranking`); continue; }
  const existing = allRankings.find(r => r.startupId === s.id);
  if (existing) {
    await db.update(rankings).set({ rank: entry.rank, wsmScore: entry.wsmScore, tier: entry.tier })
      .where(eq(rankings.id, existing.id));
    console.log(`  ✓ Rank: ${entry.name} → #${entry.rank} (WSM ${entry.wsmScore})`);
  } else {
    await db.insert(rankings).values({
      projectId,
      startupId: s.id,
      rank: entry.rank,
      wsmScore: entry.wsmScore,
      tier: entry.tier,
    });
    console.log(`  ✓ Rank (insert): ${entry.name} → #${entry.rank} (WSM ${entry.wsmScore})`);
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Update BAC Retana completado

  Geo: Todo el mundo / Ninguna
  Analista: Tomás Valles
  Requirements: descripciones actualizadas
  Clusters: nombres en español
  Startups: websiteUrls actualizados
  WSM rationales: texto exacto del Excel
  Scores req2: FarEye/WS/Bringg/DispatchTrack/Mienvío actualizados
  DispatchTrack req6: score 10 + SOC 2 rationale
  boxful: marcado como ineligible
  Ravent: startup insertada, scores, ranking, recomendación
  Rankings: 12 startups actualizados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
