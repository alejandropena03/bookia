export interface ObjectionInfo {
  type: "price" | "pain" | "trust" | "time" | "results" | "discount" | "payment";
  confidence: number;
  userSaid: string;
}

const OBJECTION_PATTERNS: Record<string, { type: ObjectionInfo["type"]; keywords: string[] }> = {
  price: {
    type: "price",
    keywords: ["caro", "costoso", "económico", "no tengo presupuesto", "muy caro",
      "bajen el precio", "descuento", "no me alcanza", "está caro", "me parece caro",
      "no vale la pena", "demasiado caro", "cuesta mucho"],
  },
  pain: {
    type: "pain",
    keywords: ["duele", "miedo al dolor", "da miedo", "nervioso", "ansiedad",
      "temor", "pánico", "no quiero sentir dolor", "me da cosa", "me da miedo"],
  },
  trust: {
    type: "trust",
    keywords: ["confianza", "desconfío", "no conozco", "primera vez", "nunca he ido",
      "es seguro", "tienen experiencia", "recomendado", "referencia"],
  },
  time: {
    type: "time",
    keywords: ["no tengo tiempo", "demora mucho", "cuánto tiempo", "sesiones",
      "tengo que pensar", "lo voy a pensar", "necesito pensarlo", "lo考虑", "lo pienso"],
  },
  results: {
    type: "results",
    keywords: ["resultados", "funciona realmente", "efecto", "dura", "cuánto dura",
      "vale la pena", "realmente funciona", "antes y después", "fotos"],
  },
  discount: {
    type: "discount",
    keywords: ["descuento", "promoción", "oferta", "más barato", "precio especial",
      "canje", "bonificación", "plan de pago", "financiación"],
  },
  payment: {
    type: "payment",
    keywords: ["anticipo", "no tengo anticipo", "sin anticipo", "pagar después",
      "no puedo pagar", "medio de pago", "cuotas", "financiar"],
  },
};

export function detectObjection(text: string): ObjectionInfo | null {
  const lower = text.toLowerCase();
  let best: ObjectionInfo | null = null;
  let maxMatches = 0;

  for (const [, pattern] of Object.entries(OBJECTION_PATTERNS)) {
    const matches = pattern.keywords.filter((kw) => lower.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      best = {
        type: pattern.type,
        confidence: Math.min(matches / 2, 1),
        userSaid: text,
      };
    }
  }

  return best;
}

export function getObjectionResponse(objection: ObjectionInfo): {
  validation: string;
  valueFrame: string;
  nextStep: string;
} {
  switch (objection.type) {
    case "price":
      return {
        validation: "Entiendo que el precio es una consideración importante.",
        valueFrame: "Nuestros tratamientos son realizados por profesionales especializados y usamos productos de alta calidad. La valoración es el primer paso para encontrar la mejor opción para ti.",
        nextStep: "¿Te gustaría agendar una valoración para conocer más detalles sin compromiso?",
      };
    case "pain":
      return {
        validation: "Es totalmente normal tener esa inquietud, sobre todo si es la primera vez.",
        valueFrame: "Usamos anestesia tópica y técnicas que minimizan las molestias. La mayoría de los pacientes describen la sensación como pequeños pinchazos muy tolerables.",
        nextStep: "En la valoración el médico te explicará todo el proceso y resolverá todas tus dudas.",
      };
    case "trust":
      return {
        validation: "Entiendo, la confianza es muy importante al elegir un lugar para tus cuidados.",
        valueFrame: "Santa María Clínica Estética cuenta con profesionales con amplia experiencia y nuestros pacientes nos respaldan.",
        nextStep: "¿Te gustaría agendar una valoración para conocer al equipo y las instalaciones?",
      };
    case "time":
      return {
        validation: "Entiendo que tu tiempo es valioso.",
        valueFrame: "La mayoría de nuestros tratamientos son rápidos. Por ejemplo, el botox toma aproximadamente 15-20 minutos.",
        nextStep: "Podemos agendar en el horario que mejor te funcione. ¿Qué día te queda bien?",
      };
    case "results":
      return {
        validation: "Es importante saber qué esperar del tratamiento.",
        valueFrame: "Los resultados varían según cada persona y el tratamiento. En la valoración, el médico te mostrará expectativas realistas para tu caso.",
        nextStep: "¿Quieres agendar una valoración para conocer más detalles?",
      };
    case "discount":
      return {
        validation: "Entiendo que busques la mejor opción.",
        valueFrame: "Te recomiendo agendar una valoración, donde podrás conocer todos los detalles y opciones disponibles.",
        nextStep: "¿Te gustaría agendar una cita de valoración?",
      };
    case "payment":
      return {
        validation: "Entiendo, el anticipo es un requisito para confirmar la cita.",
        valueFrame: "El anticipo asegura tu cupo y se descuenta del valor total del tratamiento.",
        nextStep: "¿Quieres que te explique las opciones disponibles?",
      };
    default:
      return {
        validation: "Gracias por compartir tu inquietud.",
        valueFrame: "",
        nextStep: "¿Hay algo más en lo que pueda ayudarte?",
      };
  }
}
