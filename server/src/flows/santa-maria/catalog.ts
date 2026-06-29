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
    cities: CO_CITIES,
    imageKeys: [],
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
    imageKeys: ["image6.jpeg", "image7.jpeg"],
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
    imageKeys: ["image8.jpeg", "image9.jpeg", "image14.jpeg", "image15.jpeg"],
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
    imageKeys: ["image5.jpeg", "image10.jpeg", "image11.jpeg", "image12.jpeg"],
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
    imageKeys: ["image16.jpeg", "image28.jpeg"],
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
    imageKeys: ["image23.jpeg"],
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
    imageKeys: ["image24.jpeg"],
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
  },
  {
    name: "Radiesse Plus (por vial)",
    description:
      "Radiesse Plus — versión reforzada del bioestimulador Radiesse. Mismo perfil de beneficios con mayor concentración para resultados más intensos. Duración hasta 18 meses.",
    price: "2800000",
    currency: "COP",
    category: "bioestimuladores",
    durationMinutes: 45,
    cities: ALL_CITIES,
    imageKeys: [],
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
  },
  {
    name: "Korean Face",
    description:
      "Procedimiento enfocado en mejorar la calidad de la piel y lograr un efecto de rejuvenecimiento natural, ideal para quienes desean una piel más luminosa, hidratada y saludable, sin sensación de relleno. Basado en centella asiática. Beneficios: piel más luminosa con efecto glow, hidratación profunda, mejora en textura y calidad, efecto lifting suave y natural.",
    price: "1899000",
    currency: "COP",
    category: "facial",
    durationMinutes: 60,
    cities: CO_CITIES,
    imageKeys: ["image27.jpeg"],
    prices: {
      COP: { price: "1899000" },
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
    cities: CO_CITIES,
    imageKeys: [],
    prices: {
      COP: { price: "800000", promoPrice: "499000", promoLabel: "Lanzamiento" },
      MXN: { price: "5700", promoPrice: "3800", promoLabel: "Lanzamiento" },
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
    imageKeys: ["image25.jpeg"],
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
    imageKeys: ["image17.jpeg"],
    prices: {
      COP: { price: "1640000" },
      USD: { price: "899" },
      EUR: { price: "800" },
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
    imageKeys: ["image18.jpeg"],
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
    imageKeys: ["image19.jpeg"],
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
    cities: CO_CITIES,
    imageKeys: [],
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
    imageKeys: ["image26.jpeg"],
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
    imageKeys: ["image22.jpeg"],
    promoLabel: "Mes del Padre",
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

export const IMAGE_MANIFEST: Record<string, { service: string; description: string; type: string }> = {
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
};