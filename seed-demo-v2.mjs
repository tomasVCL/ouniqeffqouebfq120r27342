/**
 * Seed script for Project 5 — VCL Discover Phase v2
 * WTS Peru — Vendor & Capability Landscape — Hands-On Analysis
 * Run: node seed-demo-v2.mjs
 */
import mysql from "mysql2/promise";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ── Helpers ────────────────────────────────────────────────────────────────
const hashPasskey = (key) => crypto.createHash("sha256").update(key).digest("hex");

async function q(sql, params = []) {
  const [result] = await db.execute(sql, params);
  return result;
}

// ── 1. Project ─────────────────────────────────────────────────────────────
console.log("Creating project 5...");
await q(`DELETE FROM publish_log WHERE projectId = 5`);
await q(`DELETE FROM recommendations WHERE projectId = 5`);
await q(`DELETE FROM rankings WHERE projectId = 5`);
await q(`DELETE FROM wsm_scores WHERE projectId = 5`);
await q(`DELETE FROM pugh_scores WHERE projectId = 5`);
await q(`DELETE FROM capfit_scores WHERE projectId = 5`);
await q(`DELETE FROM capabilities WHERE projectId = 5`);
await q(`DELETE FROM clusters WHERE projectId = 5`);
await q(`DELETE FROM startups WHERE projectId = 5`);
await q(`DELETE FROM formula_variables WHERE formulaId IN (SELECT id FROM formulas WHERE projectId = 5)`);
await q(`DELETE FROM formulas WHERE projectId = 5`);
await q(`DELETE FROM requirements WHERE projectId = 5`);
await q(`DELETE FROM projects WHERE id = 5`);

await q(`INSERT INTO projects (id, title, clientName, industry, analystName, analystEmail, reportDate, scopeDescription, geoAllowed, geoExcluded, universeSize, eligibleCount, excludedCount, passkeyHash, published, publishedAt, createdAt) VALUES (5, 'Plataforma Escalable de DPP y LCA — WTS Peru v2', 'World Textile Sourcing (WTS) Peru', 'Textil / Sostenibilidad / DPP', 'Área de Innovación / Venture Clienting — VCL Studio', 'innovation@vclstudio.com', '2026-05-22', 'Análisis profundo Vendor & Capability Landscape para identificar y evaluar los proveedores más maduros de tecnología DPP y LCA para cadenas de suministro textil complejas, con metodología WSM ponderada y fórmulas de negocio cuantificables.', 'Unión Europea', 'Reino Unido, LATAM (excepto pilotos)', 10, 8, 2, ?, 1, NOW(), NOW())`,
  [hashPasskey("wts2026v2")]
);
console.log("Project 5 created.");

// ── 2. Requirements (9 WSM criteria) ──────────────────────────────────────
console.log("Creating requirements...");
const criteria = [
  { name: "Madurez Tecnológica (TRL 7)", description: "Tecnología validada en entornos operativos reales (TRL ≥ 7)", weight: 15, category: "must" },
  { name: "Experiencia en la Industria", description: "Casos de éxito comprobables con marcas de retail/textil", weight: 10, category: "must" },
  { name: "Arquitectura Cloud y API-driven", description: "Infraestructura cloud nativa con APIs para integraciones ERP/PLM", weight: 10, category: "should" },
  { name: "Escalabilidad y Seguridad", description: "Capacidad de escalar a nivel enterprise con seguridad robusta", weight: 10, category: "should" },
  { name: "Sistemas Colaborativos", description: "Portal multi-actor para colaboración con proveedores", weight: 5, category: "should" },
  { name: "Motor de LCA y Modelado", description: "Motor de cálculo de LCA certificado (PEF/ISO14040) a nivel de prenda", weight: 20, category: "must" },
  { name: "Automatización de Datos ESG", description: "Automatización de flujos de datos ESG (CSRD, EUDR)", weight: 5, category: "should" },
  { name: "IA y Analítica Avanzada", description: "Capacidades de IA para validación y análisis predictivo", weight: 5, category: "should" },
  { name: "DPP (Digital Product Passport)", description: "Generación de Pasaporte Digital de Producto conforme a ESPR", weight: 20, category: "must" },
];

const reqIds = {};
for (let i = 0; i < criteria.length; i++) {
  const c = criteria[i];
  const res = await q(
    `INSERT INTO requirements (projectId, name, description, weight, sortOrder, category, createdAt) VALUES (5, ?, ?, ?, ?, ?, NOW())`,
    [c.name, c.description, c.weight / 100, i + 1, c.category]
  );
  reqIds[c.name] = res.insertId;
}
console.log("Requirements created:", Object.keys(reqIds).length);

// ── 3. Startups ────────────────────────────────────────────────────────────
console.log("Creating startups...");
const startups = [
  { name: "EcoVadis", description: "Calificación de Sostenibilidad y ESG", foundedYear: 2007, hqCity: "París", hqCountry: "FR", employeeRange: "~1,800", clientsRef: "BASF, Michelin, Subway", fundingStage: "Series B+", fundingAmount: "$732M", investors: "Bain & Co, GIC, Gen. Atlantic", eligible: 1, excludedReason: null, strategicFit: "Red ESG de 100K+ proveedores — sin capacidad LCA/DPP directa", keyDifferentiator: "Mayor red de calificación ESG del mundo, pero sin motor LCA propio" },
  { name: "TrusTrace", description: "Trazabilidad para Moda y Calzado", foundedYear: 2016, hqCity: "Estocolmo", hqCountry: "SWE", employeeRange: "~150", clientsRef: "Adidas, ASICS, Tapestry", fundingStage: "Series B", fundingAmount: "$30M", investors: "Circularity Capital, Industrifonden", eligible: 1, excludedReason: null, strategicFit: "Trazabilidad enterprise API-first + DPP ESPR-compliant + Knowledge Hub", keyDifferentiator: "Plataforma enterprise de trazabilidad con DPP nativo y Knowledge Hub regulatorio" },
  { name: "osapiens", description: "Cumplimiento Normativo y EUDR", foundedYear: 2018, hqCity: "Mannheim", hqCountry: "DEU", employeeRange: "~250", clientsRef: "Porsche, Bosch, Lidl", fundingStage: "Series B", fundingAmount: "$147M", investors: "Goldman Sachs, Armira Growth", eligible: 1, excludedReason: null, strategicFit: "Hub cloud-native CSRD/EUDR + debida diligencia legal automatizada", keyDifferentiator: "Compliance CSRD/EUDR automatizado con flujos de debida diligencia legal a escala" },
  { name: "Fairly Made", description: "Ecodiseño y Transparencia en Suministro", foundedYear: 2018, hqCity: "París", hqCountry: "FR", employeeRange: "~30", clientsRef: "LVMH, Sandro, Maje", fundingStage: "Series A", fundingAmount: "$21.2M", investors: "BNP Paribas, ETF Partners", eligible: 1, excludedReason: null, strategicFit: "LCA a nivel componente + trazabilidad multi-tier + comunicación B2C", keyDifferentiator: "LCA granular a nivel de componente con integración B2C directa al consumidor final" },
  { name: "Carbonfact", description: "Análisis de Ciclo de Vida (LCA) para Moda", foundedYear: 2021, hqCity: "París", hqCountry: "FR", employeeRange: "~40", clientsRef: "Carhartt, New Balance", fundingStage: "Series A", fundingAmount: "$17M", investors: "Y Combinator, Alven", eligible: 1, excludedReason: null, strategicFit: "Motor LCA PEF/ISO14040 + DPP integrado + IA para datos incompletos", keyDifferentiator: "Motor LCA automatizado con IA para datos incompletos + DPP integrado nativo" },
  { name: "Kezzler", description: "Identidad Digital de Producto (UID)", foundedYear: 2001, hqCity: "Oslo", hqCountry: "NOR", employeeRange: "~60", clientsRef: "FrieslandCampina", fundingStage: "Series A", fundingAmount: "$17.7M", investors: "BillerudKorsnäs, Investinor", eligible: 1, excludedReason: null, strategicFit: "Serialización UID a alta velocidad + anti-falsificación + 25 años experiencia", keyDifferentiator: "25 años de experiencia en serialización UID a escala masiva con anti-falsificación" },
  { name: "Myneral Labs", description: "Trazabilidad Industrial con Blockchain y AI", foundedYear: 2020, hqCity: "Londres", hqCountry: "GBR", employeeRange: "<10", clientsRef: "Pilotos en curso", fundingStage: "Seed", fundingAmount: "$121K", investors: "Angel Investors", eligible: 1, excludedReason: null, strategicFit: "Trazabilidad blockchain accesible para PYMES — etapa seed", keyDifferentiator: "Solución blockchain accesible para PYMES con trazabilidad industrial, en etapa seed" },
  { name: "Ecochain", description: "Software de LCA para Manufactura Compleja", foundedYear: 2011, hqCity: "Ámsterdam", hqCountry: "NLD", employeeRange: "~40", clientsRef: "Philips, Signify", fundingStage: "Series A", fundingAmount: "$5.5M", investors: "phase2.earth, ABN AMRO", eligible: 1, excludedReason: null, strategicFit: "LCA de portafolio masivo (PCF) + EPD + hot-spot analysis industrial", keyDifferentiator: "Software LCA especializado para manufactura compleja con hot-spot analysis y EPD" },
  { name: "Circularise", description: "Pasaporte Digital de Producto (DPP)", foundedYear: 2016, hqCity: "La Haya", hqCountry: "NLD", employeeRange: "~45", clientsRef: "Porsche, Covestro", fundingStage: "Series A", fundingAmount: "$11.4M", investors: "SEKISUI CHEMICAL, Neste", eligible: 1, excludedReason: null, strategicFit: "DPP specialist en blockchain + Zero-Knowledge Proofs + mass-balance", keyDifferentiator: "Especialista DPP sobre blockchain con Zero-Knowledge Proofs para privacidad selectiva" },
  { name: "Carbon Trail", description: "Contabilidad de Carbono Automatizada", foundedYear: 2022, hqCity: "Copenhague", hqCountry: "DNK", employeeRange: "~10", clientsRef: "Diversos Retailers", fundingStage: "Seed", fundingAmount: "N/D", investors: "IIMA Ventures", eligible: 1, excludedReason: null, strategicFit: "AI Copilot para LCA + benchmarking + descarbonización en retail", keyDifferentiator: "AI Copilot nativo para LCA rápido, benchmarking automático y planificación de descarbonización" },
];

const startupIds = {};
for (const s of startups) {
  const res = await q(
    `INSERT INTO startups (projectId, name, description, foundedYear, hqCity, hqCountry, employeeRange, clientsRef, fundingStage, fundingAmount, investors, eligible, excludedReason, strategicFit, keyDifferentiator, createdAt) VALUES (5, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [s.name, s.description, s.foundedYear, s.hqCity, s.hqCountry, s.employeeRange, s.clientsRef, s.fundingStage, s.fundingAmount, s.investors, s.eligible, s.excludedReason, s.strategicFit, s.keyDifferentiator]
  );
  startupIds[s.name] = res.insertId;
}
console.log("Startups created:", Object.keys(startupIds).length);

// ── 4. WSM Scores with Rationale ──────────────────────────────────────────
console.log("Creating WSM scores with rationale...");

// [startup, criterion, score, rationale]
const scores = [
  // EcoVadis
  ["EcoVadis","Madurez Tecnológica (TRL 7)",10,"Empresa adquirida con 1,800 empleados y clientes Fortune 500 globales. Producto en producción masiva desde hace más de 15 años."],
  ["EcoVadis","Experiencia en la Industria",10,"Líder absoluto en calificación ESG de proveedores con más de 100,000 empresas evaluadas. Clientes como BASF, Michelin y Subway confirman presencia global."],
  ["EcoVadis","Arquitectura Cloud y API-driven",7,"Plataforma SaaS con API disponible, pero orientada a reporting ESG más que a integración técnica profunda con ERP/PLM."],
  ["EcoVadis","Escalabilidad y Seguridad",8,"Infraestructura probada a escala global con más de 100K proveedores. Adquisición por Bain & Co implica estándares de seguridad institucionales."],
  ["EcoVadis","Sistemas Colaborativos",8,"Portal colaborativo para evaluación de proveedores. Diseñado para múltiples actores pero orientado a compliance, no a co-diseño de productos."],
  ["EcoVadis","Motor de LCA y Modelado",2,"Sin motor LCA propio. EcoVadis evalúa políticas y prácticas ESG, no calcula impacto ambiental a nivel de producto o ciclo de vida."],
  ["EcoVadis","Automatización de Datos ESG",8,"Automatización de cuestionarios ESG y generación de scorecards. Flujos bien establecidos pero limitados al ámbito de compliance, no LCA."],
  ["EcoVadis","IA y Analítica Avanzada",5,"Analítica de benchmarking entre proveedores. IA limitada a comparación de scores ESG, sin capacidades de modelado ambiental avanzado."],
  ["EcoVadis","DPP (Digital Product Passport)",0,"Sin capacidad de generar DPP conforme a ESPR. Su producto es una calificación ESG de empresa, no un pasaporte de producto digital."],

  // TrusTrace
  ["TrusTrace","Madurez Tecnológica (TRL 7)",10,"Series B con Adidas y ASICS como clientes enterprise. Producto en producción real con trazabilidad a escala en cadenas de moda global."],
  ["TrusTrace","Experiencia en la Industria",9,"Especialización profunda en moda y calzado con Adidas, ASICS y Tapestry. Casos de uso directamente aplicables al proyecto WTS."],
  ["TrusTrace","Arquitectura Cloud y API-driven",9,"Arquitectura API-first documentada para integración con sistemas enterprise. Knowledge Hub regulatorio integrado en la plataforma."],
  ["TrusTrace","Escalabilidad y Seguridad",9,"Series B con infraestructura validada para trazabilidad enterprise. Circularity Capital como inversor confirma estándares de seguridad."],
  ["TrusTrace","Sistemas Colaborativos",8,"Portal de colaboración con proveedores multi-tier. Diseñado para onboarding masivo de proveedores con flujos guiados."],
  ["TrusTrace","Motor de LCA y Modelado",7,"LCA integrado con foco en trazabilidad de materiales. Motor de cálculo presente pero menos especializado que Carbonfact o Ecochain."],
  ["TrusTrace","Automatización de Datos ESG",8,"Motor de IA para validación de certificados y Knowledge Hub inteligente de regulaciones. IA aplicada a casos de uso concretos y bien definidos."],
  ["TrusTrace","IA y Analítica Avanzada",8,"Motor de IA para validación de certificados y Knowledge Hub inteligente de regulaciones. IA aplicada a casos de uso concretos y bien definidos."],
  ["TrusTrace","DPP (Digital Product Passport)",9,"Generación de IDs únicos y QR a escala, cumpliendo ESPR. DPP como producto central de su oferta enterprise. Muy sólido."],

  // osapiens
  ["osapiens","Madurez Tecnológica (TRL 7)",10,"$147M recaudados, clientes Fortune 500 (Porsche, Bosch). Infraestructura cloud nativa desplegada en producción a gran escala."],
  ["osapiens","Experiencia en la Industria",9,"8 años en compliance y ESG, clientes Porsche y Lidl. Fuerte en industria manufacturera y retail europeo con casos probados."],
  ["osapiens","Arquitectura Cloud y API-driven",9,"Cloud nativo con workflows automatizados. Excelente interoperabilidad corporativa, aunque foco en compliance más que en apertura de API."],
  ["osapiens","Escalabilidad y Seguridad",10,"$147M invertidos en infraestructura cloud nativa. Goldman Sachs como inversor implica estándares de seguridad institucionales muy altos."],
  ["osapiens","Sistemas Colaborativos",10,"Flujos de trabajo colaborativos automatizados para debida diligencia legal. Diseñado para múltiples actores empresariales en cadenas complejas."],
  ["osapiens","Motor de LCA y Modelado",5,"Reporting ambiental robusto (CSRD, EUDR) pero sin motor LCA a nivel de producto. Enfoque en cumplimiento normativo, no en modelado ambiental."],
  ["osapiens","Automatización de Datos ESG",10,"Flujos automatizados de debida diligencia legal. Solución cloud nativa diseñada para automatizar reporting ESG (CSRD, EUDR) a escala."],
  ["osapiens","IA y Analítica Avanzada",9,"Flujos automatizados con IA para auditorías y due diligence. Plataforma cloud nativa con capacidades analíticas avanzadas bien integradas."],
  ["osapiens","DPP (Digital Product Passport)",7,"Compliance ESPR + módulos de trazabilidad habilitan DPP. No es su diferenciador principal pero tiene capacidad normativa sólida."],

  // Fairly Made
  ["Fairly Made","Madurez Tecnológica (TRL 7)",9,"Series A con LVMH como cliente. Producto validado en fashion de lujo, aunque escala de equipo (~30) limita ligeramente la robustez operativa."],
  ["Fairly Made","Experiencia en la Industria",10,"Especialización profunda en moda y lujo (LVMH, Sandro, Maje). LCA a nivel de prenda con foco fashion = máxima relevancia para el proyecto."],
  ["Fairly Made","Arquitectura Cloud y API-driven",8,"Interfaz colaborativa con integración multi-nivel de proveedores. API disponible pero menos documentada que los líderes técnicos del sector."],
  ["Fairly Made","Escalabilidad y Seguridad",9,"Escalable para multi-tier supplier mapping. Series A con BNP Paribas implica auditorías de seguridad rigurosas del sistema."],
  ["Fairly Made","Sistemas Colaborativos",8,"Interfaz colaborativa explícita para mapear proveedores multi-nivel. Integración B2C directa para comunicación al consumidor final."],
  ["Fairly Made","Motor de LCA y Modelado",9,"LCA a nivel de componente (granularidad máxima). Análisis de biodiversidad y consumo de agua por material. Uno de los mejores en su clase."],
  ["Fairly Made","Automatización de Datos ESG",8,"Integración de impacto social + herramientas de marketing B2C automatizadas. Buena automatización de datos ESG a nivel de prenda."],
  ["Fairly Made","IA y Analítica Avanzada",7,"IA inferida en análisis de biodiversidad y materiales, pero no declarada explícitamente como fortaleza técnica diferencial destacada."],
  ["Fairly Made","DPP (Digital Product Passport)",9,"Trazabilidad nivel componente + integración marketing B2C = DPP completo y accionable para el consumidor final. Muy bien posicionado."],

  // Carbonfact
  ["Carbonfact","Madurez Tecnológica (TRL 7)",9,"Motor LCA validado con Carhartt y New Balance. Y Combinator + Series A confirman traction real. Aún en fase de escalado activo."],
  ["Carbonfact","Experiencia en la Industria",9,"Especialización en LCA para moda (Carhartt, New Balance). Nativa del sector, fundada en 2021 con foco muy específico y probado."],
  ["Carbonfact","Arquitectura Cloud y API-driven",8,"Integración vía API con ERP/PLM. Arquitectura moderna pero tamaño de equipo (~40) limita aún la madurez del developer experience."],
  ["Carbonfact","Escalabilidad y Seguridad",10,"Arquitectura LCA en cloud con IA para datos incompletos. Diseñada para manejar información fragmentada a escala industrial de manera robusta."],
  ["Carbonfact","Sistemas Colaborativos",10,"Diseñado para colaboración entre equipos de diseño, ESG y cadena de suministro. Tableros compartidos de simulación de escenarios."],
  ["Carbonfact","Motor de LCA y Modelado",9,"Motor LCA automatizado bajo estándares PEF e ISO14040. IA para datos incompletos. Core del producto; diferenciador técnico principal."],
  ["Carbonfact","Automatización de Datos ESG",6,"Automatización de cálculo LCA y reporting de emisiones. Menos amplia en automatización ESG general comparado con osapiens o TrusTrace."],
  ["Carbonfact","IA y Analítica Avanzada",7,"IA para completar datos LCA incompletos (gap-filling). Capacidad diferencial pero más estrecha que plataformas con IA más amplia."],
  ["Carbonfact","DPP (Digital Product Passport)",10,"LCA + DPP integrado nativamente. Motor PEF/ISO14040 + IA para datos incompletos = DPP técnicamente más sólido del mercado para moda."],

  // Kezzler
  ["Kezzler","Madurez Tecnológica (TRL 7)",10,"25 años de experiencia (fundada 2001). Infraestructura de serialización probada a escala masiva en múltiples industrias globales."],
  ["Kezzler","Experiencia en la Industria",7,"Experiencia en serialización cross-industry (alimentos, farmacia, moda). Menos especialización específica en fashion/sostenibilidad que competidores."],
  ["Kezzler","Arquitectura Cloud y API-driven",9,"API robusta para serialización a alta velocidad. Arquitectura diseñada para integración con líneas de producción y sistemas ERP."],
  ["Kezzler","Escalabilidad y Seguridad",10,"25 años de operación a escala masiva. Infraestructura probada para serialización de millones de unidades con anti-falsificación integrado."],
  ["Kezzler","Sistemas Colaborativos",7,"Portal de gestión de identidades digitales. Colaboración orientada a supply chain pero menos enfocada en sostenibilidad multi-actor."],
  ["Kezzler","Motor de LCA y Modelado",7,"Capacidad de vincular datos de trazabilidad con LCA de terceros. Motor LCA no es su core pero la integración es posible y documentada."],
  ["Kezzler","Automatización de Datos ESG",9,"Automatización de captura de datos en toda la cadena de suministro. Flujos de datos ESG automatizados como extensión de la trazabilidad."],
  ["Kezzler","IA y Analítica Avanzada",9,"IA para detección de falsificaciones y análisis de patrones en serialización. Analítica avanzada aplicada a integridad de producto."],
  ["Kezzler","DPP (Digital Product Passport)",10,"Serialización UID + QR a escala = infraestructura base del DPP. 25 años de experiencia en identidad digital de producto. Líder en este criterio."],

  // Myneral Labs
  ["Myneral Labs","Madurez Tecnológica (TRL 7)",7,"Seed stage, <10 empleados. Tecnología blockchain prometedora pero sin clientes de referencia tier-1 reconocibles; validación aún por demostrar."],
  ["Myneral Labs","Experiencia en la Industria",5,"Foco industrial con pilotos en curso. Sin clientes tier-1 reconocibles; experiencia comprobable muy limitada en esta etapa temprana."],
  ["Myneral Labs","Arquitectura Cloud y API-driven",9,"Plataforma blockchain moderna con portal de proveedores. AI-native en arquitectura aunque madurez de developer API no completamente documentada."],
  ["Myneral Labs","Escalabilidad y Seguridad",6,"Seed stage pero arquitectura blockchain diseñada para escala. Alta calificación por diseño técnico aunque aún no validado masivamente."],
  ["Myneral Labs","Sistemas Colaborativos",9,"Portal de engagement para proveedores funcional. Colaboración disponible pero no diferenciada respecto a competidores más maduros del sector."],
  ["Myneral Labs","Motor de LCA y Modelado",8,"Trazabilidad blockchain con capacidad de vincular datos LCA. Motor de modelado presente aunque menos maduro que los líderes especializados."],
  ["Myneral Labs","Automatización de Datos ESG",8,"Automatización de captura de datos ESG vía blockchain. Flujos automatizados aunque con menor madurez operativa que competidores Series A/B."],
  ["Myneral Labs","IA y Analítica Avanzada",7,"IA integrada para análisis de trazabilidad industrial. Capacidades prometedoras pero sin casos de uso validados a escala comercial."],
  ["Myneral Labs","DPP (Digital Product Passport)",7,"Trazabilidad blockchain + datos ESG = base para DPP. Sin certificación ESPR específica documentada; requiere desarrollo adicional."],

  // Ecochain
  ["Ecochain","Madurez Tecnológica (TRL 7)",9,"Series A con Philips y Signify como clientes. Software LCA especializado en producción real para manufactura compleja desde 2011."],
  ["Ecochain","Experiencia en la Industria",7,"Especialización en manufactura compleja (Philips, Signify). Menos experiencia directa en fashion/textil, aunque LCA es completamente transferible."],
  ["Ecochain","Arquitectura Cloud y API-driven",8,"Plataforma SaaS con integración para sistemas de manufactura. Arquitectura moderna pero menos declarada como API-first en su comunicación."],
  ["Ecochain","Escalabilidad y Seguridad",8,"Capacidad de calcular portfolios masivos de PCF. Escala validada en manufactura compleja, aunque con equipo reducido (~40 personas)."],
  ["Ecochain","Sistemas Colaborativos",7,"Software de análisis técnico (LCA) con menor énfasis en portales colaborativos multi-actor. Orientado al equipo de sostenibilidad interno."],
  ["Ecochain","Motor de LCA y Modelado",10,"Software especializado LCA para manufactura compleja (Helix y Mobius). Portfolios masivos PCF, hot-spots, EPD. Líder técnico absoluto en LCA."],
  ["Ecochain","Automatización de Datos ESG",9,"Cálculo automático de portfolios masivos de PCF. Soporte para EPD automatizadas. Automatización de procesos industriales complejos bien resuelta."],
  ["Ecochain","IA y Analítica Avanzada",9,"Análisis de Hot-Spot (identificación de puntos críticos de contaminación). Modelado avanzado de procesos industriales. Analítica especializada profunda."],
  ["Ecochain","DPP (Digital Product Passport)",9,"LCA + EPD declarations + modelado de procesos = componentes técnicos del DPP cubiertos. No es DPP-specialist pero cubre el requisito con calidad."],

  // Circularise
  ["Circularise","Madurez Tecnológica (TRL 7)",9,"Series A con Porsche y Covestro como clientes. DPP en producción real con modelo de privacidad zero-knowledge en fase de maduración."],
  ["Circularise","Experiencia en la Industria",7,"DPP en químicos y automotriz (Porsche, Covestro). Aplicación específica en fashion/sostenibilidad aún en desarrollo y expansión sectorial."],
  ["Circularise","Arquitectura Cloud y API-driven",10,"Arquitectura más técnicamente avanzada del mercado: modular, blockchain + ZK proofs, altamente configurable sin código. Máxima interoperabilidad."],
  ["Circularise","Escalabilidad y Seguridad",9,"Zero-Knowledge Proofs = máxima privacidad por diseño. Blockchain añade seguridad inmutable. Series A confirma viabilidad técnica a escala."],
  ["Circularise","Sistemas Colaborativos",10,"Colaboración con privacidad selectiva via ZK-proofs = innovación única. Permite compartir datos sensibles entre competidores sin revelar IP."],
  ["Circularise","Motor de LCA y Modelado",9,"DPP con balances de masa digitales para materiales reciclados. Modelado de flujos de materiales + carbono (CBAM). LCA integrado con privacidad."],
  ["Circularise","Automatización de Datos ESG",7,"Gestión automática de balances de masa digitales. Plantillas configurables sin código. Automatización presente pero menos amplia que líderes."],
  ["Circularise","IA y Analítica Avanzada",7,"ZK-proofs como innovación técnica diferencial, pero IA/ML no declarada como fortaleza específica. Más criptografía avanzada que machine learning."],
  ["Circularise","DPP (Digital Product Passport)",10,"Especialista puro en DPP sobre blockchain. Plantillas configurables + ZK-proofs para compartir datos sensibles en pasaportes de manera segura."],

  // Carbon Trail
  ["Carbon Trail","Madurez Tecnológica (TRL 7)",7.5,"Seed stage, ~10 empleados. IA para LCA prometedora pero sin clientes de referencia tier-1 reconocibles; validación aún por demostrar."],
  ["Carbon Trail","Experiencia en la Industria",8,"Foco en retail y sostenibilidad con propuesta relevante. Sin clientes tier-1 reconocibles; experiencia comprobable limitada en esta etapa."],
  ["Carbon Trail","Arquitectura Cloud y API-driven",8,"Plataforma moderna con portal de proveedores. AI-native en arquitectura aunque madurez de developer API no completamente documentada."],
  ["Carbon Trail","Escalabilidad y Seguridad",10,"Seed stage pero arquitectura IA-first diseñada para escala retail masiva. Alta calificación por diseño técnico aunque aún no validado masivamente."],
  ["Carbon Trail","Sistemas Colaborativos",7,"Portal de engagement para proveedores funcional. Colaboración disponible pero no diferenciada respecto a competidores más maduros del sector."],
  ["Carbon Trail","Motor de LCA y Modelado",8.5,"AI Copilot para LCAs rápidos y automatizados. Benchmarking de emisiones + escenarios de descarbonización. Sólido aunque menos técnico que Ecochain."],
  ["Carbon Trail","Automatización de Datos ESG",9,"AI Copilot para recomendaciones automáticas de reducción. Planeación de descarbonización automatizada + benchmarking continuo = propuesta completa."],
  ["Carbon Trail","IA y Analítica Avanzada",9,"'AI Copilot' es el core del producto. Recomendaciones de reducción de impacto + benchmarking automático = IA aplicada directamente al usuario."],
  ["Carbon Trail","DPP (Digital Product Passport)",9,"LCA automatizado + benchmarking + portal de proveedores = base sólida para DPP. AI Copilot para recomendaciones dentro del pasaporte de producto."],
];

for (const [startupName, criterionName, score, rationale] of scores) {
  const startupId = startupIds[startupName];
  const reqId = reqIds[criterionName];
  if (!startupId || !reqId) {
    console.warn(`Missing ID for ${startupName} / ${criterionName}`);
    continue;
  }
  await q(
    `INSERT INTO wsm_scores (projectId, startupId, requirementId, humanScore, rationale, updatedAt) VALUES (5, ?, ?, ?, ?, NOW())`,
    [startupId, reqId, score, rationale]
  );
}
console.log("WSM scores created:", scores.length);

// ── 5. Rankings ────────────────────────────────────────────────────────────
console.log("Creating rankings...");
const rankings = [
  { startup: "Carbonfact",   cluster: "Impact & LCA engines",                       wsmScore: 9.0,   tier: "TOP PICK", differentiator: "Motor LCA PEF/ISO14040 + DPP integrado + IA para datos incompletos" },
  { startup: "Circularise",  cluster: "Hybrid strategic leaders",                    wsmScore: 8.95,  tier: "STRONG",   differentiator: "DPP specialist en blockchain + Zero-Knowledge Proofs + mass-balance" },
  { startup: "Fairly Made",  cluster: "Hybrid strategic leaders",                    wsmScore: 8.8,   tier: "STRONG",   differentiator: "LCA a nivel componente + trazabilidad multi-tier + comunicación B2C" },
  { startup: "Kezzler",      cluster: "Traceability & supply chain orchestration",   wsmScore: 8.75,  tier: "STRONG",   differentiator: "Serialización UID a alta velocidad + anti-falsificación + 25 años experiencia" },
  { startup: "Ecochain",     cluster: "Impact & LCA engines",                        wsmScore: 8.7,   tier: "STRONG",   differentiator: "LCA de portafolio masivo (PCF) + EPD + hot-spot analysis industrial" },
  { startup: "TrusTrace",    cluster: "Traceability & supply chain orchestration",   wsmScore: 8.6,   tier: "STRONG",   differentiator: "Trazabilidad enterprise API-first + DPP ESPR-compliant + Knowledge Hub" },
  { startup: "Carbon Trail", cluster: "Impact & LCA engines",                        wsmScore: 8.475, tier: "VIABLE",   differentiator: "AI Copilot para LCA + benchmarking + descarbonización en retail" },
  { startup: "osapiens",     cluster: "Traceability & supply chain orchestration",   wsmScore: 8.15,  tier: "VIABLE",   differentiator: "Hub cloud-native CSRD/EUDR + debida diligencia legal automatizada" },
  { startup: "Myneral Labs", cluster: "Traceability & supply chain orchestration",   wsmScore: 7.25,  tier: "MONITOR",  differentiator: "Trazabilidad blockchain accesible para PYMES — etapa seed" },
  { startup: "EcoVadis",     cluster: "Traceability & supply chain orchestration",   wsmScore: 5.45,  tier: "MONITOR",  differentiator: "Red ESG de 100K+ proveedores — sin capacidad LCA/DPP directa" },
];

for (let i = 0; i < rankings.length; i++) {
  const r = rankings[i];
  const startupId = startupIds[r.startup];
  await q(
    "INSERT INTO rankings (projectId, startupId, `rank`, compositeScore, wsmScore, pughNormalized, capfitAvg, tier) VALUES (5, ?, ?, ?, ?, 0, 0, ?)",
    [startupId, i + 1, r.wsmScore, r.wsmScore, r.tier]
  );
}
console.log("Rankings created:", rankings.length);

// ── 6. Clusters ────────────────────────────────────────────────────────────
console.log("Creating clusters...");
const clusterDefs = [
  {
    name: "Impact & LCA engines",
    description: "Startups con motor de LCA automatizado como núcleo de producto. Sus inversores, clientes de referencia y descripción de producto giran en torno al modelado ambiental cuantificable.",
    color: "#166534",
    members: ["Carbonfact", "Ecochain", "Carbon Trail"],
  },
  {
    name: "Hybrid strategic leaders",
    description: "Startups con perfil balanceado entre trazabilidad, impacto, escalabilidad y aplicabilidad comercial. Capacidades integrales que las posicionan como socios estratégicos en co-desarrollo de soluciones DPP robustas.",
    color: "#1e40af",
    members: ["Fairly Made", "Circularise"],
  },
  {
    name: "Traceability & supply chain orchestration",
    description: "Startups especializadas en capturar, estructurar y validar información a lo largo de cadenas de suministro complejas. Trazabilidad, compliance normativo e integridad de datos como base operativa para DPP.",
    color: "#92400e",
    members: ["TrusTrace", "EcoVadis", "osapiens", "Kezzler", "Myneral Labs"],
  },
];

for (const cl of clusterDefs) {
  const res = await q(
    `INSERT INTO clusters (projectId, name, description, color, createdAt) VALUES (5, ?, ?, ?, NOW())`,
    [cl.name, cl.description, cl.color]
  );
  const clusterId = res.insertId;
  for (const memberName of cl.members) {
    const startupId = startupIds[memberName];
    if (startupId) {
      await q(`UPDATE startups SET clusterId = ? WHERE id = ?`, [clusterId, startupId]);
    }
  }
}
console.log("Clusters created:", clusterDefs.length);

// ── 7. Publish log ─────────────────────────────────────────────────────────
await q(`INSERT INTO publish_log (projectId, action, publishedAt) VALUES (5, 'published', NOW())`);
console.log("Publish log created.");

await db.end();
console.log("\n✅ Project 5 seeded successfully!");
console.log("   URL: /client/5");
console.log("   Passkey: wts2026v2");
