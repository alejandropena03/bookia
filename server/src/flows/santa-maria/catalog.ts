export interface MarketPrice {
  price: string;
  promoPrice?: string;
  promoLabel?: string;
}

export interface CatalogItem {
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  durationMinutes: number | null;
  cities: string[];
  imageKeys: string[];
  promoLabel?: string;
  prices?: Record<string, MarketPrice>;
  // A6.6 — mercados en los que NO tenemos precio confirmado; el agente
  // NO inventa el valor y ofrece confirmar con Elkin / humano.
  requiresHumanConfirmation?: Array<"COP" | "MXN" | "USD" | "EUR">;
}

const CO_CITIES = ["Medellín", "Bogotá", "Cali", "Bucaramanga", "Barranquilla"];
const ALL_CITIES = ["Medellín", "Bogotá", "Cali", "Bucaramanga", "Barranquilla", "CDMX", "Miami"];

export const SANTA_MARIA_CATALOG: CatalogItem[] = [
  {
    name: "Valoración o reserva",
    description:
      "La cita de valoración tiene un valor de $50.000 pesos. Si decides realizarte el procedimiento con nosotros, ¡la valoración te queda totalmente GRATIS! y los $50.000 se descuentan del total del tratamiento que elijas. Durante la valoración, el doctor realiza una evaluación personalizada, revisa tu caso, resuelve todas tus dudas y te orienta sobre el tratamiento más adecuado, las opciones disponibles y el presupuesto según tus objetivos. Además, si lo deseas el mismo día de la valoración puedes realizarte el procedimiento.",
    price: "50000",
    currency: "COP",
    category: "consultas",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "50000" },
      MXN: { price: "2000" },
      USD: { price: "80" },
      EUR: { price: "80" },
    },
  },
  {
    name: "Botox por zona",
    description:
      "Botox facial. Tratamiento ideal para relajar los músculos del rostro, suavizar líneas de expresión y lograr una apariencia más fresca y descansada. Zonas individuales: Entrecejo, Frente, Orbicular de párpados, Fox Eyes o Perfilamiento facial (zona mandibular).",
    price: "630000",
    currency: "COP",
    category: "inyectables",
    durationMinutes: 20,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "630000" },
      MXN: { price: "5000" },
      USD: { price: "290" },
      EUR: { price: "290" },
    },
  },
  {
    name: "Full Face Botox",
    description:
      "Botox facial completo. Incluye todas las zonas: entrecejo, frente, orbicular de párpados, fox eyes y perfilamiento mandibular.",
    price: "1580000",
    currency: "COP",
    category: "inyectables",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "1580000" },
      MXN: { price: "15000" },
      USD: { price: "900" },
      EUR: { price: "899" },
    },
  },
  {
    name: "Russian Lips",
    description:
      "Técnica de relleno de labios que busca un efecto más elevado y definido, con proyección del arco de cupido.",
    price: "820000",
    currency: "COP",
    category: "labios",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: ["wa_09.jpg", "wa_11.jpg", "wa_33.jpg"],
    prices: {
      COP: { price: "820000" },
      MXN: { price: "8500" },
      USD: { price: "499" },
      EUR: { price: "400" },
    },
  },
  {
    name: "Doll Lips",
    description:
      "Relleno de labios con volumen marcado, estilo muñeca. Mayor proyección y definición.",
    price: "1640000",
    currency: "COP",
    category: "labios",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: ["wa_08.jpg", "wa_14.jpg", "wa_34.jpg"],
    prices: {
      COP: { price: "1640000" },
      MXN: { price: "16000" },
      USD: { price: "899" },
      EUR: { price: "800" },
    },
  },
  {
    name: "Red Lips",
    description:
      "Relleno de labios con ácido hialurónico, resultado natural y equilibrado.",
    price: "670000",
    currency: "COP",
    category: "labios",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: ["wa_20.jpg", "wa_21.jpg", "wa_26.jpg", "wa_29.jpg"],
    prices: {
      COP: { price: "670000" },
      MXN: { price: "6500" },
      USD: { price: "350" },
      EUR: { price: "300" },
    },
  },
  {
    name: "Full Face — Ácido Hialurónico",
    description:
      "Armonización facial completa con ácido hialurónico. Diseño facial personalizado para realzar tu belleza con resultados elegantes, equilibrados y completamente naturales. Trabajamos cada detalle del rostro para mejorar proporciones, definir estructuras y aportar un aspecto más fresco y sofisticado, sin alterar tu esencia, sino elevando tu imagen.",
    price: "2999000",
    currency: "COP",
    category: "armonización",
    durationMinutes: 60,
    cities: ALL_CITIES,
    imageKeys: ["wa_02.jpg", "wa_06.jpg", "wa_15.jpg"],
    prices: {
      COP: { price: "2999000" },
      MXN: { price: "20000" },
      USD: { price: "1500" },
      EUR: { price: "1390" },
    },
  },
  {
    name: "Full Face — Radiesse",
    description:
      "Bioestimulación completa con Radiesse. Estimula colágeno, redefine contorno y mejora la calidad de la piel.",
    price: "3999000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 60,
    cities: ALL_CITIES,
    imageKeys: ["wa_05.jpg", "wa_07.jpg", "wa_16.jpg", "wa_22.jpg"],
    prices: {
      COP: { price: "3999000" },
      MXN: { price: "27000" },
      USD: { price: "1800" },
      EUR: { price: "1800" },
    },
  },
  {
    name: "Full Face — Sculptra",
    description:
      "Bioestimulación completa con Sculptra. Estimula producción natural de colágeno de forma progresiva.",
    price: "3999000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 60,
    cities: ALL_CITIES,
    imageKeys: ["wa_01.jpg", "wa_10.jpg", "wa_17.jpg"],
    prices: {
      COP: { price: "3999000" },
      MXN: { price: "27000" },
      USD: { price: "1800" },
      EUR: { price: "1800" },
    },
  },
  {
    name: "Radiesse (por vial)",
    description:
      "Tratamiento bioestimulador que ayuda a mejorar la calidad de la piel, redefinir el contorno facial y estimular la producción de colágeno de forma natural. Beneficios: corrige líneas de expresión, arrugas y pliegues faciales; redefine contorno facial; mejora flacidez y restaura elasticidad; efecto lifting natural; estimula colágeno del propio cuerpo. Duración: hasta 18 meses aproximadamente.",
    price: "2600000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 45,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "2600000" },
      MXN: { price: "19000" },
      USD: { price: "699" },
      EUR: { price: "699" },
    },
  },
  {
    name: "Radiesse Plus (por vial)",
    description:
      "Radiesse Plus — versión reforzada del bioestimulador Radiesse. Mismo perfil de beneficios con mayor concentración para resultados más intensos. Duración hasta 18 meses.",
    price: "2800000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 45,
    cities: CO_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "2800000" },
    },
    // No se maneja en MXN/USD/EUR por ahora — no inventar precio, remitir a Elkin.
    requiresHumanConfirmation: ["MXN", "USD", "EUR"],
  },
  {
    name: "Sculptra (por vial)",
    description:
      "Bioestimulador facial que estimula la producción natural de colágeno. Resultados graduales y naturales. Mejora firmeza, elasticidad y calidad de la piel. Apto para diferentes tipos de piel.",
    price: "2500000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 45,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "2500000" },
      MXN: { price: "18000" },
      USD: { price: "699" },
      EUR: { price: "699" },
    },
  },
  {
    name: "Korean Face",
    description:
      "Procedimiento enfocado en mejorar la calidad de la piel y lograr un efecto de rejuvenecimiento natural, ideal para quienes desean una piel más luminosa, hidratada y saludable, sin sensación de relleno. Basado en centella asiática. Beneficios: piel más luminosa con efecto glow, hidratación profunda, mejora en textura y calidad, efecto lifting suave y natural.",
    price: "1899000",
    currency: "COP",
    category: "facial",
    durationMinutes: 60,
    cities: ALL_CITIES,
    // image27.jpeg estaba mal asignada (en realidad es Full Face Sculptra) — sin foto real, mejor no enviar nada.
    imageKeys: [],
    prices: {
      COP: { price: "1899000" },
      MXN: { price: "15000" },
      USD: { price: "999" },
      EUR: { price: "999" },
    },
  },
  {
    name: "PNDR — Esperma de Salmón",
    description:
      "Uno de los tratamientos más avanzados en regeneración de la piel, enfocado en mejorar luminosidad, textura y calidad de la piel desde el interior, con resultados visibles y naturales.",
    price: "800000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: ["wa_12.jpg", "wa_13.jpg"],
    // Precio regular — la promo de lanzamiento ya no aplica (confirmado por Carlos, 2026-07).
    prices: {
      COP: { price: "800000" },
      MXN: { price: "5700" },
      USD: { price: "300" },
      EUR: { price: "300" },
    },
  },
  {
    name: "Rinomodelación",
    description:
      "Rinomodelación sin cirugía. Procedimiento no quirúrgico en el que utilizamos ácido hialurónico para mejorar la forma de la nariz. Nos permite perfilar el dorso, levantar la punta y corregir pequeñas asimetrías, logrando un resultado más armónico y natural sin necesidad de cirugía. Tratamiento rápido, con resultados inmediatos y mínima incapacidad.",
    price: "820000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    // wa_19.jpg es la guía de cuidados post-tratamiento, no una foto de venta —
    // no se debe mandar cuando el cliente apenas pregunta por el servicio.
    imageKeys: [],
    prices: {
      COP: { price: "820000" },
      MXN: { price: "8500" },
    },
  },
  {
    name: "Marcación mandibular",
    description:
      "Perfilamiento facial – Reborde mandibular con ácido hialurónico. Procedimiento ideal para definir el contorno del rostro y resaltar la línea mandibular, logrando una apariencia más estilizada, armónica y estructurada, sin perder naturalidad.",
    price: "1640000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    // image17.jpeg estaba mal asignada (en realidad es Full Face Radiesse) — sin foto real, mejor no enviar nada.
    imageKeys: [],
    prices: {
      COP: { price: "1640000" },
      MXN: { price: "16000" },
      USD: { price: "900" },
      EUR: { price: "900" },
    },
  },
  {
    name: "Proyección de mentón",
    description:
      "Proyección de mentón con ácido hialurónico. Tratamiento que permite equilibrar el rostro y proyectar el mentón de forma natural, mejorando el perfil y la simetría facial.",
    price: "820000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    // image18.jpeg estaba mal asignada (en realidad es Full Face Sculptra) — sin foto real, mejor no enviar nada.
    imageKeys: [],
    prices: {
      COP: { price: "820000" },
      MXN: { price: "8500" },
      USD: { price: "499" },
      EUR: { price: "499" },
    },
  },
  {
    name: "Proyección de pómulos",
    description:
      "Proyección de pómulos con ácido hialurónico (2 ml). Tratamiento ideal para realzar y definir los pómulos, aportando volumen y soporte al rostro de forma armónica y natural.",
    price: "1640000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    // image19.jpeg estaba mal asignada (en realidad es Masculinización facial) — sin foto real, mejor no enviar nada.
    imageKeys: [],
    prices: {
      COP: { price: "1640000" },
      MXN: { price: "16000" },
      USD: { price: "899" },
      EUR: { price: "899" },
    },
  },
  {
    name: "Ojeras con ácido hialurónico",
    description:
      "Tratamiento de ojeras con ácido hialurónico. Ayuda a mejorar la apariencia de las ojeras, aportando hidratación, mejorando la pigmentación y disminuyendo las bolsitas.",
    price: "820000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "820000" },
      MXN: { price: "8500" },
      USD: { price: "499" },
      EUR: { price: "499" },
    },
  },
  {
    name: "NCTF — Ojeras",
    description:
      "Tratamiento de ojeras con NCTF. Enfocado en hidratar profundamente la piel y mejorar la pigmentación de la ojera.",
    price: "630000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "630000" },
      MXN: { price: "5700" },
      USD: { price: "300" },
      EUR: { price: "300" },
    },
  },
  {
    name: "Nasolabiales con AH",
    description:
      "Nasolabiales con ácido hialurónico. Tratamiento indicado para suavizar las líneas que van desde la nariz hacia la comisura de los labios, mejorando la apariencia del rostro de forma natural.",
    price: "820000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "820000" },
      MXN: { price: "8500" },
      USD: { price: "499" },
      EUR: { price: "499" },
    },
  },
  {
    name: "Lipopapada enzimática",
    description:
      "Lipopapada enzimática. Procedimiento realizado con enzimas del laboratorio LIPORAH, diseñadas para ayudar a reducir la grasa localizada en la zona de la papada. Incluye dos aplicaciones (la segunda 8 días después de la primera). Recomendación: uso de faja mentonera durante 21 noches para potenciar los resultados.",
    price: "368000",
    currency: "COP",
    category: "facial",
    durationMinutes: 20,
    cities: CO_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "368000" },
    },
    requiresHumanConfirmation: ["MXN", "USD", "EUR"],
  },
  {
    name: "Faja mentonera",
    description:
      "Faja mentonera post-lipopapada. Recomendada para potenciar los resultados de la lipopapada enzimática. Uso durante 21 noches.",
    price: "60000",
    currency: "COP",
    category: "accesorios",
    durationMinutes: null,
    cities: CO_CITIES,
    imageKeys: [],
  },
  {
    name: "Bichectomía enzimática",
    description:
      "Bichectomía enzimática. Tratamiento que, mediante infiltración con microaguja, aplica enzimas que ayudan a reducir la grasa localizada en las bolsas de Bichat, afinando el contorno facial.",
    price: "368000",
    currency: "COP",
    category: "facial",
    durationMinutes: 20,
    cities: CO_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "368000" },
    },
    // No se maneja en MXN/USD/EUR por ahora — no inventar precio, remitir a Elkin.
    requiresHumanConfirmation: ["MXN", "USD", "EUR"],
  },
  {
    name: "Hialuronidasa",
    description:
      "Retiro de ácido hialurónico en labios. Procedimiento realizado con hialuronidasa, indicado para corregir excesos, irregularidades o resultados no deseados.",
    price: "530000",
    currency: "COP",
    category: "correctivos",
    durationMinutes: 15,
    cities: CO_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "530000" },
      MXN: { price: "5500" },
      USD: { price: "300" },
      EUR: { price: "300" },
    },
  },
  {
    name: "Mesobotox para acné",
    description:
      "Mesobotox para acné. Tratamiento enfocado en mejorar la calidad de la piel, ayudando a regular el sebo y mejorar la apariencia del acné.",
    price: "1580000",
    currency: "COP",
    category: "facial",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "1580000" },
      MXN: { price: "15000" },
      USD: { price: "900" },
      EUR: { price: "900" },
    },
  },
  {
    name: "Barbie Botox",
    description:
      "Barbie Botox: más que estética, bienestar. Tratamiento médico aplicado en puntos estratégicos del cuello y la espalda alta (músculos trapecios), diseñado para relajar la tensión muscular, aliviar molestias por estrés y mala postura, afinar visualmente el cuello y los hombros, y lograr una espalda más estilizada y armoniosa. Zonas de aplicación: cuello y espalda. Mediante valoración médica personalizada.",
    price: "2999000",
    currency: "COP",
    category: "bienestar",
    durationMinutes: 30,
    cities: CO_CITIES,
    // image26.jpeg estaba mal asignada (en realidad es Full Face Ácido Hialurónico) — sin foto real, mejor no enviar nada.
    imageKeys: [],
    prices: {
      COP: { price: "2999000" },
    },
    // Disponibilidad y precio en CDMX/Miami pendientes de confirmar con Elkin.
    requiresHumanConfirmation: ["MXN", "USD", "EUR"],
  },
  {
    name: "NCTF — Hidratación de labios",
    description:
      "Hidratación de labios con NCTF. Tratamiento ideal para labios resecos o deshidratados. Aporta hidratación profunda, suavidad, luminosidad y mejora la textura sin aumentar volumen. Estimula la regeneración de la piel y deja los labios más saludables y rejuvenecidos.",
    price: "630000",
    currency: "COP",
    category: "labios",
    durationMinutes: 20,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "630000" },
      MXN: { price: "5700" },
      USD: { price: "300" },
      EUR: { price: "300" },
    },
  },
  {
    name: "Boost Skin Glow",
    description:
      "Skin Glow Boost. La combinación que tu piel estaba esperando: Radiesse + Belotero Revive para potenciar hidratación, luminosidad y mejorar la calidad de la piel desde adentro. Un tratamiento pensado para quienes buscan una piel más fresca, luminosa y con ese efecto de piel saludable que se nota.",
    price: "3420000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 60,
    cities: CO_CITIES,
    imageKeys: [],
  },
  {
    name: "Micropigmentación de labios",
    description:
      "Micropigmentación de labios. Procedimiento realizado con pigmentos orgánicos ideal para dar color. Duración: hasta 1 año. Contamos con una amplia gama de colores. Incluye primera sesión, retoque al mes y aplicación de vitamina.",
    price: "650000",
    currency: "COP",
    category: "micropigmentación",
    durationMinutes: 90,
    cities: ["Medellín"],
    imageKeys: [],
    prices: {
      COP: { price: "650000" },
    },
    requiresHumanConfirmation: ["MXN", "USD", "EUR"],
  },
  {
    name: "Promo — Renovación Facial Masculina",
    description:
      "Renovación Facial Masculina – Mes de los Padres. Papá también se cuida. Rejuvenece y suaviza líneas de expresión con nuestro tratamiento de Botox para lograr una apariencia más fresca, descansada y natural. Por cada hombre que refieras y tome la promoción, tú recibes GRATIS: Hidratación de labios con NCTF o Hidratación facial con NCTF. Promoción válida por tiempo limitado o hasta agotar los cupos disponibles asignados.",
    price: "1580000",
    currency: "COP",
    category: "promociones",
    durationMinutes: 30,
    cities: CO_CITIES,
    imageKeys: ["wa_03.jpg", "wa_04.jpg"],
    promoLabel: "Mes del Padre",
  },
  // ── Hand Rejuvenation — mismo precio que Radiesse/Sculptra por vial, confirmado por Carlos ──
  {
    name: "Hand Rejuvenation (Radiesse)",
    description:
      "Hand Rejuvenation con Radiesse. Tratamiento bioestimulador para rejuvenecer la piel de las manos, mejorando la textura, hidratación y apariencia general. Estimula colágeno, reduce venas visibles y arrugas. Resultados naturales y progresivos.",
    price: "699",
    currency: "USD",
    category: "bioestimuladores",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "2600000" },
      MXN: { price: "19000" },
      USD: { price: "699" },
      EUR: { price: "699" },
    },
  },
  {
    name: "Hand Rejuvenation (Sculptra)",
    description:
      "Hand Rejuvenation con Sculptra. Bioestimulación progresiva para rejuvenecer las manos. Estimula la producción natural de colágeno, mejora la firmeza y reduce la apariencia de envejecimiento en las manos.",
    price: "699",
    currency: "USD",
    category: "bioestimuladores",
    durationMinutes: 30,
    cities: ALL_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "2500000" },
      MXN: { price: "18000" },
      USD: { price: "699" },
      EUR: { price: "699" },
    },
  },
  // ── A6.6 — Masculinización facial con AH ──
  {
    name: "Masculinización facial con AH",
    description:
      "Masculinización facial con ácido hialurónico. Tratamiento diseñado para realzar los rasgos masculinos del rostro: define la mandíbula, proyecta el mentón, afina el contorno facial y aporta volumen estratégico para lograr un perfil más angular y masculino, manteniendo un resultado natural.",
    price: "2999000",
    currency: "COP",
    category: "armonización",
    durationMinutes: 60,
    cities: ALL_CITIES,
    imageKeys: ["wa_04.jpg", "wa_18.jpg", "wa_25.jpg", "wa_32.jpg"],
    prices: {
      COP: { price: "2999000" },
      MXN: { price: "20000" },
      USD: { price: "1500" },
      EUR: { price: "1500" },
    },
  },
];

export function getCatalogByCity(city: string): CatalogItem[] {
  const normalized = ciudadNormalize(city);
  return SANTA_MARIA_CATALOG.filter((item) => {
    if (item.cities.length === 0) return true;
    return item.cities.some((c) => ciudadNormalize(c) === normalized);
  });
}

function ciudadNormalize(city: string): string {
  const map: Record<string, string> = {
    medellin: "Medellín",
    "medellín": "Medellín",
    mde: "Medellín",
    bogota: "Bogotá",
    "bogotá": "Bogotá",
    bgt: "Bogotá",
    cali: "Cali",
    bucaramanga: "Bucaramanga",
    bucara: "Bucaramanga",
    barranquilla: "Barranquilla",
    barranca: "Barranquilla",
    "ciudad de méxico": "CDMX",
    cdmx: "CDMX",
    "méxico": "CDMX",
    mexico: "CDMX",
    miami: "Miami",
  };
  const key = city.toLowerCase().trim();
  return map[key] || city;
}

export function formatPrice(price: string, currency: string = "COP"): string {
  const num = parseInt(price, 10);
  if (isNaN(num)) return price;
  const formatted = new Intl.NumberFormat("es-CO").format(num);
  const symbols: Record<string, string> = {
    COP: "$",
    MXN: "$",
    USD: "$",
    EUR: "€",
  };
  return `${symbols[currency] || "$"}${formatted} ${currency}`;
}

// `market`: moneda/mercado real de la imagen (COP/MXN/USD/EUR). Si no está definido,
// la imagen es genérica (sin precio visible) y se incluye para cualquier mercado.
// Se usa para filtrar qué fotos recibe el cliente según la ciudad que dio (ej. Bogotá → COP).
export const IMAGE_MANIFEST: Record<string, { service: string; description: string; type: string; market?: "COP" | "MXN" | "USD" | "EUR" }> = {
  "image1.jpeg": { service: "price_list", description: "Lista de precios en EUROS (€) — Services & Prices Europa", type: "price_card" },
  "image2.jpeg": { service: "price_list", description: "Lista de precios en PESOS COLOMBIANOS (COP)", type: "price_card" },
  "image3.jpeg": { service: "price_list", description: "Lista de precios en PESOS MEXICANOS (MXN)", type: "price_card" },
  "image4.jpeg": { service: "price_list", description: "Lista de precios en DÓLARES (USD) — EE.UU.", type: "price_card" },
  "image5.jpeg": { service: "Red Lips", description: "Card de Red Lips — $670,000 COP", type: "service_card" },
  "image6.jpeg": { service: "Russian Lips", description: "Card de Russian Lips — precio en MXN", type: "service_card" },
  "image7.jpeg": { service: "Russian Lips", description: "Card de Russian Lips — diseño alternativo", type: "service_card" },
  "image8.jpeg": { service: "Doll Lips", description: "Card de Doll Lips — precio en COP", type: "service_card" },
  "image9.jpeg": { service: "Doll Lips", description: "Card de Doll Lips — precio en COP (alternativo)", type: "service_card" },
  "image10.jpeg": { service: "Red Lips", description: "Card de Red Lips — $6,500 MXN", type: "service_card" },
  "image11.jpeg": { service: "Red Lips", description: "Card de Red Lips — $350 USD", type: "service_card" },
  "image12.jpeg": { service: "Red Lips", description: "Card de Red Lips — 800 €", type: "service_card" },
  "image13.jpeg": { service: "Doll Lips", description: "Card de Doll Lips — vista alternativa", type: "service_card" },
  "image14.jpeg": { service: "Doll Lips", description: "Card de Doll Lips — $899", type: "service_card" },
  "image15.jpeg": { service: "Doll Lips", description: "Card de Doll Lips — 800", type: "service_card" },
  "image16.jpeg": { service: "Full Face — Ácido Hialurónico", description: "Card de Full Face Ácido Hialurónico", type: "service_card" },
  "image17.jpeg": { service: "Marcación mandibular", description: "Card de marcación mandibular", type: "service_card" },
  "image18.jpeg": { service: "Proyección de mentón", description: "Card de proyección de mentón", type: "service_card" },
  "image19.jpeg": { service: "Proyección de pómulos", description: "Card de proyección de pómulos", type: "service_card" },
  "image20.jpeg": { service: "Facial Rejuvenation", description: "Card de rejuvenecimiento facial (inglés)", type: "service_card" },
  "image21.jpeg": { service: "Facial Masculinization", description: "Card de masculinización facial (inglés)", type: "service_card" },
  "image22.jpeg": { service: "Masculinización facial", description: "Card de masculinización facial", type: "service_card" },
  "image23.jpeg": { service: "Full Face — Radiesse", description: "Card de Full Face Radiesse", type: "service_card" },
  "image24.jpeg": { service: "Full Face — Sculptra", description: "Card de Full Face Sculptra", type: "service_card" },
  "image25.jpeg": { service: "Rinomodelación", description: "Card de rinomodelación", type: "service_card" },
  "image26.jpeg": { service: "Barbie Botox", description: "Card de Barbie Botox (trapecios)", type: "service_card" },
  "image27.jpeg": { service: "Korean Face", description: "Card de Korean Face", type: "service_card" },
  "image28.jpeg": { service: "Full Face — Ácido Hialurónico", description: "Card de Full Face Ácido Hialurónico (alternativa)", type: "service_card" },
  // WhatsApp promo images (wa_01–wa_34) — fuente: Fotossantamaria de Carlos, 2026-06-29
  "wa_01.jpg": { service: "Full Face — Sculptra", description: "Promo Full Face Sculptra COP $3'999.000 — Botox+Rino+Russian Lips+Mentón", type: "promo", market: "COP" },
  "wa_02.jpg": { service: "Full Face — Ácido Hialurónico", description: "Promo Full Face AH COP $2'999.000 — Botox+Pómulos+Rino+Russian+Mentón+Marcación", type: "promo", market: "COP" },
  "wa_03.jpg": { service: "Masculinización facial con Radiesse", description: "Promo Masculinización+Rejuvenecimiento COP $3'999.000 — Radiesse+Rino+Mentón+Marcación", type: "promo", market: "COP" },
  "wa_04.jpg": { service: "Masculinización facial con AH", description: "Promo Masculinización Facial COP $2'999.000 — Botox+Rino+Mentón+Marcación", type: "promo", market: "COP" },
  "wa_05.jpg": { service: "Full Face — Radiesse", description: "Promo Full Face Radiesse MXN $27.000 — Botox+Rino+Russian Lips+Mentón", type: "promo", market: "MXN" },
  "wa_06.jpg": { service: "Full Face — Ácido Hialurónico", description: "Promo Full Face AH MXN $20.000 — Botox+Pómulos+Rino+Russian+Mentón+Marcación", type: "promo", market: "MXN" },
  "wa_07.jpg": { service: "Full Face — Radiesse", description: "Promo Full Face Radiesse COP $3'999.000 — Botox+Rino+Russian Lips+Mentón", type: "promo", market: "COP" },
  "wa_08.jpg": { service: "Doll Lips", description: "Doll Lips COP $1.640.000 — Perfilamiento+volumen labial máxima simetría, 2ml AH", type: "service_card", market: "COP" },
  "wa_09.jpg": { service: "Russian Lips", description: "Russian Lips COP $820.000 — Proyección arco de cupido, 1ml AH", type: "service_card", market: "COP" },
  "wa_10.jpg": { service: "Full Face — Sculptra", description: "Promo Full Face Sculptra MXN $27.000 — Botox+Rino+Russian Lips+Mentón", type: "promo", market: "MXN" },
  "wa_11.jpg": { service: "Russian Lips", description: "Russian Lips MXN $8.500 — Proyección arco de cupido, 1ml AH", type: "service_card", market: "MXN" },
  "wa_12.jpg": { service: "Esperma de Salmón / PDRN", description: "Promo Esperma de Salmón/PDRN COP — Antes $800.000 / Hoy $499.000", type: "promo", market: "COP" },
  "wa_13.jpg": { service: "Esperma de Salmón / PDRN", description: "Promo Esperma de Salmón/PDRN MXN — Antes $5.700 / Hoy $3.800", type: "promo", market: "MXN" },
  "wa_14.jpg": { service: "Doll Lips", description: "Doll Lips MXN $16.000 — Perfilamiento labial", type: "service_card", market: "MXN" },
  "wa_15.jpg": { service: "Full Face — Ácido Hialurónico", description: "Full Face Hyaluronic Acid (inglés) — Botox, Cheekbones, Rino, Russian Lips, Chin, Jawline", type: "promo" },
  "wa_16.jpg": { service: "Masculinización facial con Radiesse", description: "Facial Masculinization Rejuvenation (inglés) — Full face Radiesse, Rino, Chin, Jawline", type: "promo" },
  "wa_17.jpg": { service: "Full Face — Sculptra", description: "Full Face Sculptra (inglés) — Sculptra, Botox, Rino, Russian Lips, Chin", type: "promo" },
  "wa_18.jpg": { service: "Masculinización facial con AH", description: "Facial Masculinization (inglés) — Botox, Rino, Chin, Jawline", type: "promo" },
  "wa_19.jpg": { service: "Rinomodelación", description: "Guía post-tratamiento Rinomodelación — Evitar sol, presión, actividad física 24h, hielo; inflamación 1 semana", type: "post_treatment" },
  "wa_20.jpg": { service: "Red Lips", description: "Antes/Después Red Lips MXN $6.500 precio de lanzamiento — resultado real", type: "before_after", market: "MXN" },
  "wa_21.jpg": { service: "Red Lips", description: "Antes/Después Red Lips USD $350 precio de lanzamiento — resultado real", type: "before_after", market: "USD" },
  "wa_22.jpg": { service: "Full Face — Radiesse", description: "Full Face Radiesse (inglés) — Full face Radiesse, Botox, Rino, Russian Lips, Chin", type: "promo" },
  "wa_23.jpg": { service: "price_list", description: "Lista de precios USD completa — Services & Prices USD (26 servicios)", type: "price_catalog", market: "USD" },
  "wa_24.jpg": { service: "Masculinización facial con Radiesse", description: "Masculinización Facial con Radiesse USD $1800 — Radiesse facial, Rino AH, Mentón AH, Jawline AH", type: "promo", market: "USD" },
  "wa_25.jpg": { service: "Masculinización facial con AH", description: "Masculinización Facial con AH USD $1500 — Botox, Rino AH, Mentón AH, Jawline AH, Marcación", type: "promo", market: "USD" },
  "wa_26.jpg": { service: "Red Lips", description: "Antes/Después Red Lips COP $670.000 precio de lanzamiento — resultado real", type: "before_after", market: "COP" },
  "wa_27.jpg": { service: "price_list", description: "Lista de precios COP completa — Servicios y Precios COP (24 servicios)", type: "price_catalog", market: "COP" },
  "wa_28.jpg": { service: "price_list", description: "Lista de precios EUR completa — Services & Prices EUR (26 servicios)", type: "price_catalog", market: "EUR" },
  "wa_29.jpg": { service: "Red Lips", description: "Antes/Después Red Lips EUR 300€ precio de lanzamiento — resultado real", type: "before_after", market: "EUR" },
  "wa_30.jpg": { service: "price_list", description: "Lista de precios USD completa (mal referenciada antes como promo de Sculptra)", type: "price_catalog", market: "USD" },
  "wa_31.jpg": { service: "Masculinización facial con Radiesse", description: "Masculinización Facial con Radiesse EUR 1.800€ — Radiesse facial, Rino AH, Mentón AH, Marcación", type: "promo", market: "EUR" },
  "wa_32.jpg": { service: "Masculinización facial con AH", description: "Masculinización Facial con AH EUR 1.500€ — Botox, Rino AH, Mentón AH, Marcación mandibular", type: "promo", market: "EUR" },
  "wa_33.jpg": { service: "Russian Lips", description: "Russian Lips EUR 400€ — Labios carnosos y armónicos, AH, resultados naturales", type: "service_card" },
  "wa_34.jpg": { service: "Doll Lips", description: "Doll Lips EUR 800€ — Volumen natural, definición perfecta, forma de corazón, simetría armónica", type: "service_card" },
};