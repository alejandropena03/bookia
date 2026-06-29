import type { RouterDecision, AgentIntent } from "../types/agent-intent.js";

type DomainSignal = {
  regex: RegExp;
  intent: AgentIntent;
  confidence: number;
  reason: string;
};

const BOOKING_KEYWORDS = ["agenda", "agendar", "separar cita", "separar turno", "pedir cita", "reservar cita", "quiero una cita", "necesito una cita", "para la cita"];

function hasBookingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

const DOMAIN_SIGNALS: DomainSignal[] = [
  // ── dudas_medicas — qué es, cómo funciona, etc. ──
  { regex: /¿?(qué\s+es|que\s+es)\s+(el\s+|la\s+|los\s+|las\s+)?(botox|ácido|á\.\s*hialurónico|hialurónico|tratamiento|procedimiento|relleno|lipo|vitamina|vitonas?|plasma|plaxma|hilos?)/i, intent: "dudas_medicas", confidence: 0.90, reason: "pregunta definición tratamiento" },
  { regex: /¿?(cómo\s+funciona|como\s+funciona)/i, intent: "dudas_medicas", confidence: 0.90, reason: "pregunta mecanismo" },
  { regex: /para\s+qué\s+sirve/i, intent: "dudas_medicas", confidence: 0.85, reason: "pregunta utilidad" },
  { regex: /¿?(qué\s+es\s+mejor|qué\s+diferencia|cuál\s+es\s+mejor|diferencia\s+entre)\s/i, intent: "dudas_medicas", confidence: 0.90, reason: "comparación tratamientos" },
  { regex: /\b¿?(duele|duele\s+mucho|duele\s+muchísimo)\b/i, intent: "dudas_medicas", confidence: 0.95, reason: "pregunta dolor" },
  { regex: /\b(me\s+da\s+miedo|teng[oó].*\bmiedo\b|me\s+da\s+nervio|me\s+da\s+pánico)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "ansiedad procedimiento" },
  { regex: /\b(cuántas\s+unidades|cuantas\s+unidades)\b/i, intent: "dudas_medicas", confidence: 0.90, reason: "consulta dosificación" },
  { regex: /¿?(cuánto\s+dura\s+la\s+sesión|cuanto\s+dura\s+la\s+sesion)\b/i, intent: "dudas_medicas", confidence: 0.90, reason: "duración sesión" },
  { regex: /\b(me\s+)?(puedo\s+)?hac[eé]r(?:melo|me|lo|se|selo)?\s+(si\s+)?(estoy\s+(en\s+)?(mi\s+)?(periodo|menstruación|menstruacion|regla)|con\s+(mi\s+)?(periodo|menstruación|menstruacion|regla))\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta período menstrual" },

  // ── refusal patterns (clinical safety boundary) ──
  { regex: /\b(qu[eé]\s+)?teng[oó]\s+(en\s+)?(la\s+)?(cara|piel|rostro)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta sobre condición en zona corporal" },
  { regex: /\b(crees?|piensas?|consideras?)\s+(que\s+)?(teng[oó]|podr[ií]a\s+tener|es)\b/i, intent: "dudas_medicas", confidence: 0.80, reason: "pregunta opinión sobre condición estética" },
  { regex: /\b(ha[sz]me|realiza)\s+un\s+diagn[oó]stic/i, intent: "dudas_medicas", confidence: 0.85, reason: "solicitud diagnóstico" },
  { regex: /\b(rec[eé]tame|recetame|rec[eé]ta)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "solicitud receta" },
  { regex: /\b(qu[eé]\s+)?medicamento\s+(me\s+)?(recomiendas|sugieres)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta medicación" },
  { regex: /\b(me\s+)?garantizas?\b.*(resultados?|perfectos?|[eé]xito|seguro)/i, intent: "precio", confidence: 0.80, reason: "consulta garantía resultados" },
  { regex: /\b(me\s+)?prometes?\s+(que\s+)?(no\s+)?(duele|doler[aá]|funciona)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "pregunta sobre promesa resultado" },
  { regex: /\b(no\s+)?tiene\s+(ning[uú]n|nada\s+de)\s+riesgo/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta sobre riesgos" },
  { regex: /\b(recomi[eé]ndame|recomiendame|t[úu]\s+(qu[eé]\s+)?(me\s+)?recomiendas)\b/i, intent: "dudas_medicas", confidence: 0.80, reason: "solicitud recomendación personalizada" },
  { regex: /\b(me\s+lo\s+)?recomiendas?\s+(a\s+)?(m[ií]|mi)\b/i, intent: "dudas_medicas", confidence: 0.80, reason: "solicitud recomendación personalizada" },
  { regex: /\b(otro\s+doctor|otra\s+m[eé]dica?|otra\s+cl[ií]nica)\s+(me\s+)?(dijo|recomend[oó]|dijeron|sugiri[oó])\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "segunda opinión" },
  { regex: /\b(?:hacerme|haz?me)\s+(el\s+)?procedimiento\s+que\s+(me\s+)?(hicieron|recomendaron)\s+(en|a|para)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "procedimiento de otra clínica" },

  // ── precio — precio en moneda / divisa ──
  { regex: /\bprecio\s+en\s+(d[oó]lares?|pesos?|euros?|reales?)\b/i, intent: "precio", confidence: 0.90, reason: "consulta precio en moneda específica" },

  // ── charla — PII sharing ──
  // Only route to charla if there's no simultaneous booking intent
  // These patterns match users sharing personal data in conversation
  { regex: /\b(mi\s+)?(cédula|cc|documento|identificación|identificacion)\s+(es|:)\s*\d{5,10}\b/i, intent: "charla", confidence: 0.85, reason: "comparte documento identidad" },
  { regex: /\b(mi\s+)?(correo|email|e-mail)\s+(es|:)\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i, intent: "charla", confidence: 0.85, reason: "comparte correo electrónico" },
  { regex: /\b(mi\s+)?(celular|teléfono|telefono|cel|whatsapp)\s+(es|:)\s*\d{7,10}\b/i, intent: "charla", confidence: 0.85, reason: "comparte número teléfono" },
  { regex: /\b(vivo\s+en|resido\s+en|mi\s+dirección)\s/i, intent: "charla", confidence: 0.80, reason: "comparte dirección" },
  { regex: /\b(nac[íi]\s+el|fecha\s+de\s+(nacimiento|nac))\b/i, intent: "charla", confidence: 0.85, reason: "comparte fecha nacimiento" },
  { regex: /\bmi\s+nombre\s+completo\s+(es|:)\b/i, intent: "charla", confidence: 0.85, reason: "comparte nombre completo" },
  { regex: /\bte\s+(paso|doy|comparto|daré|dare)\s+(los\s+)?(datos|número|numero|teléfono|telefono|correo)\s+de\b/i, intent: "charla", confidence: 0.80, reason: "comparte datos de tercero" },
  { regex: /\bmi\s+número\s+de\s+(seguridad\s+social|licencia)\b/i, intent: "charla", confidence: 0.85, reason: "comparte número documento" },
  { regex: /\b(?:mi\s+)?pasaporte\s+(?:es|:)?\s*[A-Za-z]{2}\d{6}\b/i, intent: "charla", confidence: 0.85, reason: "comparte pasaporte" },
  { regex: /\bcédula\s+de\s+extranjer[ií]a\b/i, intent: "charla", confidence: 0.85, reason: "comparte cédula extranjería" },
  { regex: /\b(?:mi\s+)?tel[eé]fono\s+fijo\b/i, intent: "charla", confidence: 0.85, reason: "comparte teléfono fijo" },
  { regex: /\b(?:mi\s+)?cuenta\s+bancaria\b/i, intent: "pago", confidence: 0.90, reason: "comparte cuenta bancaria" },
  { regex: /\b(?:me\s+)?(?:diagnosticaron|diagnosticó)\s+(con\s+|que\s+tengo\s+)?(diabetes|c[aá]ncer|hipertensión|tiroides|lupus|artritis|epilepsia)\b/i, intent: "charla", confidence: 0.80, reason: "comparte diagnóstico sin pregunta" },
  { regex: /\b(estoy\s+)?casad[oa]\s+y\s+(tengo|con)\b/i, intent: "charla", confidence: 0.85, reason: "comparte estado civil" },
  { regex: /\b(te\s+)?(envío|paso|comparto|mando)\s+(un[ao]\s+|mis\s+|la\s+)?(comprobante|foto|fotografía|historia\s+cl[ií]nica|documento)\b/i, intent: "charla", confidence: 0.80, reason: "comparte archivo/documento" },
  { regex: /\b(te\s+)?(doy|paso|comparto|dar[eé])\s+(mi\s+)?(correo|email|e-mail|tel[eé]fono|celular|whatsapp|n[uú]mero)\b/i, intent: "charla", confidence: 0.85, reason: "ofrece compartir dato contacto" },
  { regex: /\b(mis\s+)?correos?\s+(son|:)\s/i, intent: "charla", confidence: 0.85, reason: "comparte correos" },
  { regex: /\b(eres?|sos?)\s+(una\s+)?persona\s+real\b/i, intent: "charla", confidence: 0.85, reason: "pregunta si es humano" },
  { regex: /\bcont[aá]ctame\s+a\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i, intent: "charla", confidence: 0.85, reason: "da correo de contacto" },
  { regex: /\b(mi\s+)?n[uú]mero\s+(es|:)\s*\+?\d{1,3}\s*\d{3,10}\b/i, intent: "charla", confidence: 0.85, reason: "comparte numero con código país" },
  { regex: /\bteng[oó]\s+(una\s+)?condici[oó]n\s+(card[ií]aca|m[eé]dica|de\s+salud)\b/i, intent: "charla", confidence: 0.80, reason: "comparte condición salud sin pregunta" },
  { regex: /\b(tomo|toma|tome|tomar|us[ao])\s+\w+\s+(para\s+)?(la\s+)?(presi[oó]n|dolor|presión|diabetes|colesterol|tiroides|alergia|dormir|relajar|calmar)\b/i, intent: "charla", confidence: 0.80, reason: "comparte medicación sin pregunta" },
  { regex: /\b(mi\s+)?licencia\s+de\s+conducir\s+(es|:)\b/i, intent: "charla", confidence: 0.85, reason: "comparte licencia conducir" },
  { regex: /\b(te\s+)?compart[oó]\s+(mi\s+)?(historia\s+cl[ií]nica|expediente|archivo)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "comparte historia clínica" },
  { regex: /\bno\s+(creo|pienso|considero)\s+que\s+(me\s+)?(pase|pasar[aá]|vaya\s+a\s+pasar|ocurra|tenga)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "minimización de riesgo/preocupación" },

  // ── charla — AI questions ──
  { regex: /\b(eres\s+)?inteligencia\s+artificial\b/i, intent: "charla", confidence: 0.85, reason: "pregunta sobre IA" },
  { regex: /\bc[oó]mo\s+est[aá]s\s+programado\b/i, intent: "charla", confidence: 0.85, reason: "pregunta funcionamiento" },
  { regex: /\bqui[eé]n\s+te\s+cre[oó]\b/i, intent: "charla", confidence: 0.85, reason: "pregunta creador" },
  { regex: /\b(desde\s+)?cu[aá]ndo\s+existes\b/i, intent: "charla", confidence: 0.85, reason: "pregunta origen" },
  { regex: /\baprendes\s+de\s+(nuestras\s+)?conversaciones\b/i, intent: "charla", confidence: 0.80, reason: "pregunta aprendizaje" },
  { regex: /\bpuedes\s+responder\s+en\s+ingl[eé]s\b/i, intent: "charla", confidence: 0.85, reason: "pregunta idioma" },

  // ── charla — memory references ──
  { regex: /\bya\s+te\s+(d[ií]|dije|coment[eé])\s+(mi\s+)?(nombre|dato|información)\b/i, intent: "charla", confidence: 0.80, reason: "referencia a memoria" },
  { regex: /\bcomo\s+te\s+(dije|coment[eé])\b/i, intent: "charla", confidence: 0.80, reason: "referencia conversación anterior" },

  // ── queja — frustration / delay / estafa ──
  { regex: /\b(me\s+)?(hicieron|hizo)\s+(esperar|espera)\s+(mucho|demasiado)\b/i, intent: "queja", confidence: 0.90, reason: "queja por demora" },
  { regex: /\bnadie\s+(me\s+)?(responde|contesta|atiende)\b/i, intent: "queja", confidence: 0.90, reason: "queja por falta respuesta" },
  { regex: /\bya\s+(he|e)\s+llamado\s+\d\s+(vez|veces)\b/i, intent: "queja", confidence: 0.90, reason: "queja llamadas sin respuesta" },
  { regex: /\b(estoy\s+)?hart[oa]\s+(de|con)\b/i, intent: "queja", confidence: 0.90, reason: "frustración" },
  { regex: /\bdecepcionad[oa]\s+(con|de)\b/i, intent: "queja", confidence: 0.90, reason: "decepción" },
  { regex: /\b(me\s+)?(estaf(a|ron|ar[oó]n)|estafa)\b/i, intent: "queja", confidence: 0.90, reason: "sensación de estafa" },
  { regex: /\bno\s+(vuelvo|pienso\s+volver|regreso)\b/i, intent: "queja", confidence: 0.90, reason: "no volverá" },
  { regex: /\bp[eé]rdida\s+de\s+tiempo\b/i, intent: "queja", confidence: 0.90, reason: "pérdida de tiempo" },
  { regex: /\b(cobraron|cobr[oó]|cobran)\s+(de\s+)?m[aá]s\b/i, intent: "queja", confidence: 0.90, reason: "queja por cobro excesivo" },
  { regex: /\bfalta\s+de\s+respeto\b/i, intent: "queja", confidence: 0.90, reason: "queja por maltrato" },
  { regex: /\b(estoy\s+)?furios[oa]\b/i, intent: "queja", confidence: 0.90, reason: "enojo" },
  { regex: /\b(estoy\s+)?(muy\s+)?triste\s+(con|por)\b/i, intent: "queja", confidence: 0.85, reason: "tristeza con resultado" },
  { regex: /\bexijo\s+(mi\s+)?derecho\b/i, intent: "queja", confidence: 0.90, reason: "reclamo derecho" },
  { regex: /\bno\s+(me\s+)?(gust[oó]|gustaron|gusta)\s+(cómo|como|el|la|los|las|nada)\b/i, intent: "queja", confidence: 0.85, reason: "queja por resultado" },
  { regex: /\b(no\s+)?vi\s+(ning[uú]n|ningunos?|nada\s+de)\s+(resultados?|mejora|cambio|efecto)\s+(despu[eé]s|post)\b/i, intent: "queja", confidence: 0.85, reason: "queja por falta resultados" },
  { regex: /\b(la\s+)?atenc[ió]n\s+(al\s+)?(cliente|usuario|paciente)\s+(es\s+)?(p[eé]sim[oa]|mal[oa]|terrible|horrible)\b/i, intent: "queja", confidence: 0.90, reason: "queja atención al cliente" },
  { regex: /\b(ejercer|solicitar|pedir|exijo|quiero)\s+(mi\s+)?(derecho|derechos)\s+(de|a)\s+(eliminaci[oó]n|protecci[oó]n|acceso|rectificaci[oó]n|cancelaci[oó]n|reembolso|devoluci[oó]n)\b/i, intent: "queja", confidence: 0.90, reason: "ejercicio derechos legales" },

  // ── additional dudas_medicas edge cases ──
  { regex: /\bcu[aá]ntas\s+sesiones\s+(necesito|debo|requiero)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta plan de tratamiento" },
  { regex: /\b(qu[eé]\s+)?(crema|producto|mascarilla|suero|ung[uü]ento)\s+(me\s+)?(recomiendas?|sugieres?|aconsejas?)\s+(para\s+)?(despu[eé]s|post)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "solicita recomendación producto post-tratamiento" },
  { regex: /\b(amiga|conocid[ao]|familiar|amig[ao])\s+(tuvo|tuv[oo]|le\s+(pas[oo]|dio|sali[oo]))\s+(problemas?|complicaciones?|reacci[oó]n|efecto)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "preocupación por terceros" },
  { regex: /\bm[aá]s\s+barato\s+(es\s+)?(igual\s+de\s+)?(seguro|bueno|efectivo|confiable)\b/i, intent: "precio", confidence: 0.85, reason: "comparación costo-seguridad" },
  { regex: /\b(ya\s+)?teng[oó]\s+.{1,20}\s+de\s+antes\b/i, intent: "dudas_medicas", confidence: 0.80, reason: "consulta tratamiento previo" },
  { regex: /\bpuedo\s+retocar\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta retoque tratamiento" },
  { regex: /\bcu[aá]ntos?\s+d[ií]as?\s+(no\s+)?(puedo|debo|necesito)\b/i, intent: "dudas_medicas", confidence: 0.85, reason: "consulta tiempo recuperación" },
  { regex: /\b(doctor[aí]?|doctora)\s+(me\s+)?(trat[oó]|atiende?)\s+(muy\s+)?mal\b/i, intent: "queja", confidence: 0.90, reason: "queja por maltrato doctor" },
  { regex: /(?:qu[eé]\s+(?:m[aá]s\s+)?puedes\s+hacer|cu[aá]les\s+son\s+tus\s+limitaciones|qu[eé]\s+(?:m[aá]s\s+)?sabes\s+hacer|qu[eé]\s+otras?\s+cosas?\s+puedes)/i, intent: "charla", confidence: 0.85, reason: "curiosidad sobre capacidades del agente" },
  { regex: /\b(qu[eé]\s+)?opinas?\s+(del?|de\s+(la|los|las))\s+(tratamiento|servicio|atenc[ió]n|resultado|cl[ií]nica|competencia)\b/i, intent: "otro", confidence: 0.85, reason: "solicita opinión subjetiva" },
  { regex: /\b(quiero|necesito)\s+(que\s+me\s+)?(atienda|vea|ve)\s+(el\s+)?(doctor|m[eé]dico|especialista)\s+(personalmente|directamente)\b/i, intent: "hablar_humano", confidence: 0.90, reason: "pide atención personal doctor" },
  { regex: /\b(plan\s+personalizado|plan\s+de\s+tratamiento|valoraci[oó]n\s+personalizada)\b/i, intent: "valoracion", confidence: 0.90, reason: "solicita plan personalizado" },
  { regex: /\b(derecho\s+(a|de)|eliminaci[oó]n\s+de\s+datos|protecci[oó]n\s+de\s+datos|proteccion\s+de\s+datos)\b/i, intent: "queja", confidence: 0.85, reason: "consulta legal/protección datos" },

  // ── faq_servicios — body part recommendations ──
  { regex: /(recomiendas|recomienda|recomendado|sugieres|sugiere)\s+(para|por)\s+(mis\s+|mi\s+)?(ojeras|papada|nariz|labios|frente|cuello|manos|barriga|abdomen|rostro|cara|ojos|párpados|parpados|mentón|menton|mejillas|brazos|piernas|espalda|glúteos|gluteos)/i, intent: "faq_servicios", confidence: 0.90, reason: "recomendación por zona corporal" },

  // ── faq_contacto — send info ──
  { regex: /\b(env[íi]a|manda|env[íi]enme|env[íi]eme|podr[ií]an\s+enviar)\s+(información|info|la\s+información)\s+(a\s+)?(mi\s+)?(correo|email)\b/i, intent: "faq_contacto", confidence: 0.90, reason: "solicita envío información" },

  // ── pago — EPS, seguro, convenio ──
  { regex: /\b(eps|convenio\s+con)\b/i, intent: "pago", confidence: 0.80, reason: "consulta convenio/EPS" },
  { regex: /\b(seguro\s+m[eé]dico|seguro)\s+(cubre|paga|cubrir[aá])\b/i, intent: "pago", confidence: 0.85, reason: "consulta cobertura seguro" },
  { regex: /\b(opciones\s+de\s+)?(financiaci[oó]n|financiar|cuotas)\b/i, intent: "pago", confidence: 0.85, reason: "consulta financiación" },

  // ── resultados_esperados ──
  { regex: /\bcu[aá]ndo\s+(se\s+)?(ven|notan|empiezan\s+a\s+ver|voy\s+a\s+ver)\s+(los\s+)?resultados\b/i, intent: "resultados_esperados", confidence: 0.90, reason: "consulta tiempo resultados" },
  { regex: /\bcada\s+cu[aá]nto\s+(debo|tengo\s+que|hay\s+que|se\s+debe|puedo)\s+(ponerme|aplicar|hacerme|repetir)\b/i, intent: "resultados_esperados", confidence: 0.85, reason: "consulta frecuencia tratamiento" },
  { regex: /\bcu[aá]nto\s+(tiempo\s+)?dura\s+(el\s+)?(efecto|resultado)\b/i, intent: "resultados_esperados", confidence: 0.90, reason: "consulta duración efecto" },

  // ── booking with PII (name + phone/email) — strong booking signal ──
  { regex: /\b(agenda|agendar|separar|reservar|pedir)\s+(para|una|cita\s+para|turno)\s+.{2,30}?(tel[eé]fono|celular|whatsapp|correo|email)\s/i, intent: "agendamiento", confidence: 0.90, reason: "booking con datos contacto" },

  // ── precio — cost inquiry ──
  { regex: /\bcu[aá]nto\s+(cuesta|vale|valen|sale|salen)\s+(el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(botox|ácido\s*hialurónico|tratamiento|procedimiento|sesi[oó]n|consulta|valoración|valoracion)\b/i, intent: "precio", confidence: 0.90, reason: "consulta precio tratamiento" },
  { regex: /\b(precio|precios|valor|costos?|tarifas?)\s+(del|de\s+la|de\s+los|de\s+las|de|para)\s+(botox|ácido\s*hialurónico|tratamiento|sesi[oó]n|consulta|procedimiento)\b/i, intent: "precio", confidence: 0.90, reason: "consulta precio tratamiento" },

  // ── post_tratamiento — flexible patterns (gap coverage for safetyPreRoute strict regexes) ──
  { regex: /\b(la\s+)?zona\s+(del\s+)?tratamiento\s+(?:qued[oó]|est[áa]|sinti[oó]|tengo\b)/i, intent: "post_tratamiento", confidence: 0.90, reason: "complicación/comentario zona tratada" },
  { regex: /\b(me\s+)?(duele|duele\s+m[uú]cho|duele\s+un\s+poco|duele\s+bastante)\s+(la\s+)?zona\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "dolor en zona tratada" },
  { regex: /\b(bloqueador|protector\s+solar)\s+(despu[eé]s|post)\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "cuidado post: bloqueador" },
  { regex: /\b(ejercicio|hacer\s+ejercicio|ir\s+al\s+gimnasio|deporte)\s+(despu[eé]s|post)\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "cuidado post: ejercicio" },
  { regex: /\b(alcohol|tomar\s+alcohol|beber)\s+(despu[eé]s|post)\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "cuidado post: alcohol" },
  { regex: /\b(herida\s+abierta|sangr[ae])\s+(en\s+)?(la\s+)?zona\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "complicación post: herida" },
  { regex: /\b(no\s+)?siento\s+(la\s+)?(zona|sensibilidad)\b/i, intent: "post_tratamiento", confidence: 0.90, reason: "pérdida sensibilidad zona" },
];

export function deterministicDomainRoute(text: string): RouterDecision | null {
  text = text.normalize('NFC');
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const hasBookingKeywords = hasBookingIntent(lower);

  for (const signal of DOMAIN_SIGNALS) {
    if (!signal.regex.test(trimmed)) continue;

    // Skip PII-sharing patterns if there's simultaneous booking intent
    // (user sharing data while trying to book → agendamiento, not charla)
    if (hasBookingKeywords && signal.intent === "charla" && signal.reason.startsWith("comparte")) {
      continue;
    }

    const { intent, confidence, reason } = signal;
    return {
      intent,
      confidence,
      secondaryIntents: [],
      entities: {},
      reasoningSummary: `DOMAIN-ROUTER: ${reason}`,
    };
  }

  return null;
}
