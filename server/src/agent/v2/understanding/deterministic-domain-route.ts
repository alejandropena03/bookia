import type { AgentIntent, RouterDecision } from "../types/agent-intent.js";

type DomainSignal = {
	regex: RegExp;
	intent: AgentIntent;
	confidence: number;
	reason: string;
};

const BOOKING_KEYWORDS = [
	"agenda",
	"agendar",
	"separar cita",
	"separar turno",
	"pedir cita",
	"reservar cita",
	"quiero una cita",
	"necesito una cita",
	"para la cita",
];

function hasBookingIntent(text: string): boolean {
	const lower = text.toLowerCase();
	return BOOKING_KEYWORDS.some((kw) => lower.includes(kw));
}

const DOMAIN_SIGNALS: DomainSignal[] = [
	// ── dudas_medicas — qué es, cómo funciona, etc. ──
	{
		regex:
			/¿?(qué\s+es|que\s+es)\s+(el\s+|la\s+|los\s+|las\s+)?(botox|ácido|á\.\s*hialurónico|hialurónico|tratamiento|procedimiento|relleno|lipo|vitamina|vitonas?|plasma|plaxma|hilos?)/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "pregunta definición tratamiento",
	},
	{
		regex: /¿?(cómo\s+funciona|como\s+funciona)/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "pregunta mecanismo",
	},
	{
		regex: /para\s+qué\s+sirve/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "pregunta utilidad",
	},
	{
		regex:
			/¿?(qué\s+es\s+mejor|qué\s+diferencia|cuál\s+es\s+mejor|diferencia\s+entre)\s/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "comparación tratamientos",
	},
	{
		regex: /\b¿?(duele|duele\s+mucho|duele\s+muchísimo)\b/i,
		intent: "dudas_medicas",
		confidence: 0.95,
		reason: "pregunta dolor",
	},
	{
		regex:
			/\b(me\s+da\s+miedo|teng[oó].*\bmiedo\b|me\s+da\s+nervio|me\s+da\s+pánico)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "ansiedad procedimiento",
	},
	{
		regex: /\b(cuántas\s+unidades|cuantas\s+unidades)\b/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "consulta dosificación",
	},
	{
		regex: /¿?(cuánto\s+dura\s+la\s+sesión|cuanto\s+dura\s+la\s+sesion)\b/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "duración sesión",
	},
	// "¿cuánto dura el botox?" — duración de un TRATAMIENTO nombrado es info médica
	// (dudas_medicas: el canned de duraciones), no resultados_esperados (Instagram).
	// El router LLM variaba y a veces lo mandaba a resultados_esperados. Forzamos
	// determinísticamente ANTES del LLM. Debe ir antes de la regla de
	// resultados_esperados "cuánto dura el efecto/resultado" para ganarle; se excluye
	// explícitamente "efecto"/"resultado" para no pisar esa consulta legítima.
	{
		// NOTA: sin \b antes del grupo de tratamientos. \b en JS es solo ASCII: entre un
		// espacio y "á"/"ó" no hay frontera de palabra (ambos son no-word), así que
		// /\bácido/ NUNCA matchea "ácido". El espacio previo (\s) ya delimita.
		regex:
			/¿?(cu[aá]nto\s+(dura|tiempo\s+dura)|cu[aá]nto\s+tiempo)\b(?!.*\b(efecto|resultados?)\b).*(botox|b[óo]tox|[áa]cido\s+hialur[óo]nico|full\s+face|rinomodelaci[óo]n|russian\s+lips|doll\s+lips|red\s+lips|labios|rejuvenecimiento|bichectom[íi]a|lipopapada|sculptra|radiesse|pdrn|salm[óo]n|rostro\s+coreano|marcaci[óo]n)/i,
		intent: "dudas_medicas",
		confidence: 0.9,
		reason: "duración de tratamiento nombrado (info médica, no resultados)",
	},
	{
		regex:
			/\b(me\s+)?(puedo\s+)?hac[eé]r(?:melo|me|lo|se|selo)?\s+(si\s+)?(estoy\s+(en\s+)?(mi\s+)?(periodo|menstruación|menstruacion|regla)|con\s+(mi\s+)?(periodo|menstruación|menstruacion|regla))\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta período menstrual",
	},

	// ── refusal patterns (clinical safety boundary) ──
	{
		regex: /\b(qu[eé]\s+)?teng[oó]\s+(en\s+)?(la\s+)?(cara|piel|rostro)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta sobre condición en zona corporal",
	},
	{
		regex:
			/\b(crees?|piensas?|consideras?)\s+(que\s+)?(teng[oó]|podr[ií]a\s+tener|es)\b/i,
		intent: "dudas_medicas",
		confidence: 0.8,
		reason: "pregunta opinión sobre condición estética",
	},
	{
		regex: /\b(ha[sz]me|realiza)\s+un\s+diagn[oó]stic/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "solicitud diagnóstico",
	},
	{
		regex: /\b(rec[eé]tame|recetame|rec[eé]ta)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "solicitud receta",
	},
	{
		regex: /\b(qu[eé]\s+)?medicamento\s+(me\s+)?(recomiendas|sugieres)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta medicación",
	},
	{
		regex: /\b(me\s+)?garantizas?\b.*(resultados?|perfectos?|[eé]xito|seguro)/i,
		intent: "precio",
		confidence: 0.8,
		reason: "consulta garantía resultados",
	},
	{
		regex:
			/\b(me\s+)?prometes?\s+(que\s+)?(no\s+)?(duele|doler[aá]|funciona)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "pregunta sobre promesa resultado",
	},
	{
		regex: /\b(no\s+)?tiene\s+(ning[uú]n|nada\s+de)\s+riesgo/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta sobre riesgos",
	},
	{
		regex:
			/\b(recomi[eé]ndame|recomiendame|t[úu]\s+(qu[eé]\s+)?(me\s+)?recomiendas)\b/i,
		intent: "dudas_medicas",
		confidence: 0.8,
		reason: "solicitud recomendación personalizada",
	},
	{
		regex: /\b(me\s+lo\s+)?recomiendas?\s+(a\s+)?(m[ií]|mi)\b/i,
		intent: "dudas_medicas",
		confidence: 0.8,
		reason: "solicitud recomendación personalizada",
	},
	{
		regex:
			/\b(otro\s+doctor|otra\s+m[eé]dica?|otra\s+cl[ií]nica)\s+(me\s+)?(dijo|recomend[oó]|dijeron|sugiri[oó])\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "segunda opinión",
	},
	{
		regex:
			/\b(?:hacerme|haz?me)\s+(el\s+)?procedimiento\s+que\s+(me\s+)?(hicieron|recomendaron)\s+(en|a|para)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "procedimiento de otra clínica",
	},

	// ── precio — named service patterns (A6.6) ──
	{
		regex:
			/\b(?:hand\s+rejuvenation|rejuvenecimiento\s+de\s+manos|rejuvenecimiento\s+manos)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "precio Hand Rejuvenation (defensive knowledge)",
	},
	{
		regex:
			/\b(?:masculinizaci[óo]n\s+(?:facial\s+)?(?:con\s+)?(?:á\.?\s*hialur[óo]nico|ah|ácido\s+hialurónico)|facial\s+masculinization\s+(?:ha|hyaluronic))\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "precio masculinización facial AH",
	},
	// ── precio — precio en moneda / divisa ──
	{
		regex: /\bprecio\s+en\s+(d[oó]lares?|pesos?|euros?|reales?)\b/i,
		intent: "precio",
		confidence: 0.9,
		reason: "consulta precio en moneda específica",
	},

	// ── charla — existing appointment mention (not booking intent) ──
	{
		regex:
			/\btengo\s+(una\s+)?cita\s+(el\s+|pa(ra\s+)?\s+)?(lunes|martes|mi[eé]rcoles?|jueves|viernes|s[aá]bado|domingo|hoy|mañana|este\s+\w+|este\s+mes|pr[oó]xim[oa])\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "menciona cita existente",
	},

	// ── booking override patterns (must come before charla PII) ──
	// Third-party booking: name + phone/contact for someone else → agendamiento
	{
		regex:
			/\b(ella\s+se\s+llama|e[lL]\s+se\s+llama|(mi\s+)?(amig[oa]|familiar|herman[oa]|espos[oa]|hij[oa]|pap[aá]|mam[aá]|herman[ao])\s+se\s+llama)\b.*\b(n[uú]mero\s+(es|de|del)|tel[eé]fono|celular|whatsapp)\b/i,
		intent: "agendamiento",
		confidence: 0.9,
		reason: "booking tercero: nombre + contacto",
	},
	// Explicit booking with doctor (covers "quiero cita con doctor" without "agendar")
	{
		regex:
			/\b(quiero|necesito|me\s+puede|puedo|quisiera|requiero)\s+(agendar|separar|reservar|pedir|sacar)?\s*(una\s+|la\s+)?(cita|turno|hora|consulta)\s+(con\s+)?(el\s+|la\s+)?(doctor|doctora|dr)\b/i,
		intent: "agendamiento",
		confidence: 0.95,
		reason: "booking con doctor",
	},
	// Typo-tolerant booking (kiero ajendar votox)
	{
		regex:
			/\b(kiero|quero|qiero|kiere|kieren)\s+(ajendar|ajendar|agendar|aseparar|separar|reservar)\s+(votox|botox|botoz|botocs|votoz)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "booking con typos",
	},

	// ── charla — PII sharing ──
	// Only route to charla if there's no simultaneous booking intent
	// These patterns match users sharing personal data in conversation
	{
		regex:
			/\b(mi\s+)?(cédula|cc|documento|identificación|identificacion)\s+(es|:)\s*\d{5,10}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte documento identidad",
	},
	{
		regex: /\bmi\s+nombre\s+(es|:)\s+\w+\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte nombre",
	},
	{
		regex:
			/\b(mi\s+)?(correo|email|e-mail)\s+(es|:)\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte correo electrónico",
	},
	{
		regex:
			/\b(mi\s+)?(celular|teléfono|telefono|cel|whatsapp)\s+(es|:)\s*\d{7,10}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte número teléfono",
	},
	{
		regex: /\b(vivo\s+en|resido\s+en|mi\s+dirección)\s/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte dirección",
	},
	{
		regex: /\b(nac[íi]\s+el|fecha\s+de\s+(nacimiento|nac))\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte fecha nacimiento",
	},
	{
		regex: /\bmi\s+nombre\s+completo\s+(es|:)\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte nombre completo",
	},
	{
		regex:
			/\bte\s+(paso|doy|comparto|daré|dare)\s+(los\s+)?(datos|número|numero|teléfono|telefono|correo)\s+de\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte datos de tercero",
	},
	{
		regex: /\bmi\s+número\s+de\s+(seguridad\s+social|licencia)\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte número documento",
	},
	{
		regex: /\b(?:mi\s+)?pasaporte\s+(?:es|:)?\s*[A-Za-z]{2}\d{6}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte pasaporte",
	},
	{
		regex: /\bcédula\s+de\s+extranjer[ií]a\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte cédula extranjería",
	},
	{
		regex: /\b(?:mi\s+)?tel[eé]fono\s+fijo\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte teléfono fijo",
	},
	{
		regex: /\b(?:mi\s+)?cuenta\s+bancaria\b/i,
		intent: "pago",
		confidence: 0.9,
		reason: "comparte cuenta bancaria",
	},
	{
		regex:
			/\b(?:me\s+)?(?:diagnosticaron|diagnosticó)\s+(con\s+|que\s+tengo\s+)?(diabetes|c[aá]ncer|hipertensión|tiroides|lupus|artritis|epilepsia)\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte diagnóstico sin pregunta",
	},
	{
		regex: /\b(estoy\s+)?casad[oa]\s+y\s+(tengo|con)\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte estado civil",
	},
	{
		regex:
			/\b(te\s+)?(envío|paso|comparto|mando)\s+(un[ao]\s+|mis\s+|la\s+)?(comprobante|foto|fotografía|historia\s+cl[ií]nica|documento)\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte archivo/documento",
	},
	{
		regex:
			/\b(te\s+)?(doy|paso|comparto|dar[eé])\s+(mi\s+)?(correo|email|e-mail|tel[eé]fono|celular|whatsapp|n[uú]mero)\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "ofrece compartir dato contacto",
	},
	{
		regex: /\b(mis\s+)?correos?\s+(son|:)\s/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte correos",
	},
	{
		regex: /\b(eres?|sos?)\s+(una\s+)?persona\s+real\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta si es humano",
	},
	{
		regex:
			/\bcont[aá]ctame\s+a\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "da correo de contacto",
	},
	{
		regex: /\b(mi\s+)?n[uú]mero\s+(es|:)\s*\+?\d{1,3}\s*\d{3,10}\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte numero con código país",
	},
	{
		regex:
			/\bteng[oó]\s+(una\s+)?condici[oó]n\s+(card[ií]aca|m[eé]dica|de\s+salud)\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte condición salud sin pregunta",
	},
	{
		regex:
			/\b(tomo|toma|tome|tomar|us[ao])\s+\w+\s+(para\s+)?(la\s+)?(presi[oó]n|dolor|presión|diabetes|colesterol|tiroides|alergia|dormir|relajar|calmar)\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte medicación sin pregunta",
	},
	{
		regex: /\b(mi\s+)?licencia\s+de\s+conducir\s+(es|:)\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte licencia conducir",
	},
	{
		regex:
			/\b(te\s+)?compart[oó]\s+(mi\s+)?(historia\s+cl[ií]nica|expediente|archivo)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "comparte historia clínica",
	},
	{
		regex:
			/\bno\s+(creo|pienso|considero)\s+que\s+(me\s+)?(pase|pasar[aá]|vaya\s+a\s+pasar|ocurra|tenga)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "minimización de riesgo/preocupación",
	},

	// ── charla — AI questions ──
	{
		regex: /\b(eres\s+)?inteligencia\s+artificial\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta sobre IA",
	},
	{
		regex: /\bc[oó]mo\s+est[aá]s\s+programado\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta funcionamiento",
	},
	{
		// Note: "quien te creo" (unaccented) works; accented form handled via contains check below
		regex: /\bquien\s+te\s+creo\b|\bcreaste?\b.*\bbot\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta creador",
	},
	{
		// Fallback for accented "¿Quién te creó?" — uses includes() instead of regex due to encoding
		regex: /\bqui.n\s+te\s+cre.?\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta creador (accentuado)",
	},
	{
		regex: /\b(desde\s+)?cu[aá]ndo\s+existes\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta origen",
	},
	{
		regex: /\baprendes\s+de\s+(nuestras\s+)?conversaciones\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "pregunta aprendizaje",
	},
	{
		regex: /\bpuedes\s+responder\s+en\s+ingl[eé]s\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "pregunta idioma",
	},

	// "No necesito hablar con un humano, me ayudas tú" → charla (negated human request)
	{
		regex:
			/\b(no\s+necesito\s+(hablar|un\s+humano)|no\s+quiero\s+hablar\s+con\s+(una?\s+)?(persona|humano))\b/i,
		intent: "charla",
		confidence: 0.85,
		reason: "niega querer hablar con humano",
	},

	// ── charla — memory references ──
	{
		regex:
			/\bya\s+te\s+(d[ií]|dije|coment[eé])\s+(mi\s+)?(nombre|dato|información)\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "referencia a memoria",
	},
	{
		regex: /\bcomo\s+te\s+(dije|coment[eé])\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "referencia conversación anterior",
	},

	// ── queja — frustration / delay / estafa ──
	{
		regex:
			/\b(me\s+)?(hicieron|hizo)\s+(esperar|espera)\s+(mucho|demasiado)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por demora",
	},
	{
		regex: /\bnadie\s+(me\s+)?(responde|contesta|atiende)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por falta respuesta",
	},
	{
		regex: /\bya\s+(he|e)\s+llamado\s+\d\s+(vez|veces)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja llamadas sin respuesta",
	},
	{
		regex: /\b(estoy\s+)?hart[oa]\s+(de|con)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "frustración",
	},
	{
		regex: /\bdecepcionad[oa]\s+(con|de)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "decepción",
	},
	{
		regex: /\b(me\s+)?(estaf(a|ron|ar[oó]n)|estafa)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "sensación de estafa",
	},
	{
		regex: /\bno\s+(vuelvo|pienso\s+volver|regreso)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "no volverá",
	},
	{
		regex: /\bp[eé]rdida\s+de\s+tiempo\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "pérdida de tiempo",
	},
	{
		regex: /\b(cobraron|cobr[oó]|cobran)\s+(de\s+)?m[aá]s\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por cobro excesivo",
	},
	{
		regex: /\bfalta\s+de\s+respeto\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por maltrato",
	},
	{
		regex: /\b(estoy\s+)?furios[oa]\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "enojo",
	},
	{
		regex: /\b(estoy\s+)?(muy\s+)?triste\s+(con|por)\b/i,
		intent: "queja",
		confidence: 0.85,
		reason: "tristeza con resultado",
	},
	{
		regex: /\bexijo\s+(mi\s+)?derecho\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "reclamo derecho",
	},
	{
		regex:
			/\bno\s+(me\s+)?(gust[oó]|gustaron|gusta)\s+(cómo|como|el|la|los|las|nada)\b/i,
		intent: "queja",
		confidence: 0.85,
		reason: "queja por resultado",
	},
	{
		regex:
			/\b(no\s+)?vi\s+(ning[uú]n|ningunos?|nada\s+de)\s+(resultados?|mejora|cambio|efecto)\s+(despu[eé]s|post)\b/i,
		intent: "queja",
		confidence: 0.85,
		reason: "queja por falta resultados",
	},
	{
		regex:
			/\b(la\s+)?atenci[oó]n\s+(al\s+)?(cliente|usuario|paciente)\s+(es\s+|est[aá]\s+)?(p[eé]sim[oa]|mal[oa]|terrible|horrible|muy\s+mal[oa])\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja atención al cliente",
	},
	{
		regex:
			/\b(ejercer|solicitar|pedir|exijo|quiero)\s+(mi\s+)?(derecho|derechos)\s+(de|a)\s+(eliminaci[oó]n|protecci[oó]n|acceso|rectificaci[oó]n|cancelaci[oó]n|reembolso|devoluci[oó]n)\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "ejercicio derechos legales",
	},

	// ── additional dudas_medicas edge cases ──
	{
		regex: /\bcu[aá]ntas\s+sesiones\s+(necesito|debo|requiero)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta plan de tratamiento",
	},
	{
		regex:
			/\b(qu[eé]\s+)?(crema|producto|mascarilla|suero|ung[uü]ento)\s+(me\s+)?(recomiendas?|sugieres?|aconsejas?)\s+(para\s+)?(despu[eé]s|post)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "solicita recomendación producto post-tratamiento",
	},
	{
		regex:
			/\b(amiga|conocid[ao]|familiar|amig[ao])\s+(tuvo|tuv[oo]|le\s+(pas[oo]|dio|sali[oo]))\s+(problemas?|complicaciones?|reacci[oó]n|efecto)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "preocupación por terceros",
	},
	{
		regex:
			/\bm[aá]s\s+barato\s+(es\s+)?(igual\s+de\s+)?(seguro|bueno|efectivo|confiable)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "comparación costo-seguridad",
	},
	{
		regex: /\b(ya\s+)?teng[oó]\s+.{1,20}\s+de\s+antes\b/i,
		intent: "dudas_medicas",
		confidence: 0.8,
		reason: "consulta tratamiento previo",
	},
	{
		regex: /\bpuedo\s+retocar\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta retoque tratamiento",
	},
	{
		regex: /\bcu[aá]ntos?\s+d[ií]as?\s+(no\s+)?(puedo|debo|necesito)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta tiempo recuperación",
	},
	{
		regex:
			/\b(doctor[aí]?|doctora)\s+(me\s+)?(trat[oó]|atiende?)\s+(muy\s+)?mal\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por maltrato doctor",
	},
	{
		regex:
			/(?:qu[eé]\s+(?:m[aá]s\s+)?puedes\s+hacer|cu[aá]les\s+son\s+tus\s+limitaciones|qu[eé]\s+(?:m[aá]s\s+)?sabes\s+hacer|qu[eé]\s+otras?\s+cosas?\s+puedes)/i,
		intent: "charla",
		confidence: 0.85,
		reason: "curiosidad sobre capacidades del agente",
	},
	{
		regex:
			/\b(qu[eé]\s+)?opinas?\s+(del?|de\s+(la|los|las))\s+(tratamientos?|servicios?|atenci[oó]n|resultados?|cl[ií]nica|competencia)\b/i,
		intent: "otro",
		confidence: 0.85,
		reason: "solicita opinión subjetiva",
	},

	// ── otro — out of domain (must be high confidence to win vs charla) ──
	{
		regex:
			/\b(h[aá]blame|cu[eé]ntame|d[ií]me)\s+(de|sobre|acerca\s+de)\s+(otras?\s+cl[ií]nicas?|la\s+competencia|otros?\s+lugares?)\b/i,
		intent: "otro",
		confidence: 0.90,
		reason: "fuera de dominio: otras clínicas",
	},
	{
		regex:
			/\b(quiero|vamos|hablemos?)\s+(hablar|conversar)\s+(de|sobre)\s+(pol[ií]tica|f[uú]tbol|deporte|noticias?|econom[ií]a|religi[oó]n|filosofía|historia)\b/i,
		intent: "otro",
		confidence: 0.90,
		reason: "fuera de dominio: tema no relacionado",
	},
	// "¿Santa María es mejor que otras clínicas?" = competitive comparison → precio
	{
		regex:
			/\b(mejor|peor|mas\s+barata?|mas\s+cara?|mas\s+econ.mica?)\s+que\s+(otras?\s+cl.nicas?|la\s+competencia|otras?\s+opciones?)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "comparación precio/calidad con competencia",
	},
	// "Necesito información sobre temas legales" → queja (legal concerns directed at clinic)
	{
		regex:
			/\b(informaci[oó]n|asesor[ií]a|orientaci[oó]n|ayuda)\s+(sobre|en)\s+(temas?\s+legales?|asuntos?\s+legales?|derechos?|reclamaci[oó]n)\b/i,
		intent: "queja",
		confidence: 0.85,
		reason: "consulta legal contra la clínica",
	},
	// "Esto es muy complejo para explicarlo aquí" → hablar_humano
	{
		regex:
			/\b(es\s+)?(muy\s+)?(complejo|complicado|extenso|delicado|personal)\s+(para\s+)?(explicar(lo|la|les|me)?|contar(lo)?|hablar)\s*(aqu.?|en\s+un\s+(chat|mensaje|whatsapp))?/i,
		intent: "hablar_humano",
		confidence: 0.85,
		reason: "tema complejo para chat → escalar",
	},
	{
		regex:
			/\b(quiero|necesito)\s+(que\s+me\s+)?(atienda|vea|ve)\s+(el\s+)?(doctor|m[eé]dico|especialista)\s+(personalmente|directamente)\b/i,
		intent: "hablar_humano",
		confidence: 0.9,
		reason: "pide atención personal doctor",
	},
	{
		regex:
			/\b(plan\s+personalizado|plan\s+de\s+tratamiento|valoraci[oó]n\s+personalizada)\b/i,
		intent: "valoracion",
		confidence: 0.9,
		reason: "solicita plan personalizado",
	},
	{
		regex:
			/\b(derecho\s+(a|de)|eliminaci[oó]n\s+de\s+datos|protecci[oó]n\s+de\s+datos|proteccion\s+de\s+datos)\b/i,
		intent: "queja",
		confidence: 0.85,
		reason: "consulta legal/protección datos",
	},

	// ── faq_servicios — info request / service interest ──
	{
		regex:
			/(quisiera|querría|quería|me\s+interesa|me\s+gustaría|me\s+interesaría)\s+(información|info|saber|conocer)\s+(sobre|acerca\s+de|del|de\s+la|de\s+los|de\s+las)\s+(el\s+|la\s+|los\s+|las\s+)?(botox|ácido\s*hialurónico|tratamiento|procedimiento|servicio|limpieza|armonización|relleno|lipo|hilos?|plasma|vitamina|mesoterapia|radiofrecuencia)/i,
		intent: "faq_servicios",
		confidence: 0.9,
		reason: "solicita información sobre servicio",
	},
	{
		regex:
			/(tienen|hacen|ofrecen|manejan|trabajan\s+con|realizan)\s+(botox|ácido\s*hialurónico|tratamiento|limpieza|armonización|relleno|lipo|hilos?|plasma|vitamina|mesoterapia|radiofrecuencia)/i,
		intent: "faq_servicios",
		confidence: 0.9,
		reason: "pregunta si ofrecen servicio",
	},
	{
		regex:
			/\b(alg[úu]n|un|una|alguna|algo)\s+(tratamiento|servicio|procedimiento)\s+(para|por|contra)\s+(arrugas|ojeras|papada|manchas|celulitis|grasa|flacidez|estrías)/i,
		intent: "faq_servicios",
		confidence: 0.9,
		reason: "pregunta por tratamiento para condición",
	},
	{
		regex:
			/\b(prob(ar|é|a|emos?|ado)?\s+(otr[oa]|algo\s+diferente|un\s+nuev[oa]|otra\s+cosa))\b/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "quiere probar otro servicio",
	},
	{
		regex: /(tienen|dan|hacen)?\s*(garant[ií]a|garantias?)\b/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "consulta garantía servicio",
	},
	{
		regex: /\b(a\s+)?(domicilio|casa\s+del?\s+paciente|a\s+casa)\b/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "consulta servicio a domicilio",
	},
	{
		regex:
			/\b(me\s+)?(recomiendas?|aconsejas?|sugieres?|cu[aá]l\s+(me\s+)?recomiendas?)\s+(primero|primera\s+vez|para\s+empezar|inicial)\b/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "solicita recomendación inicial",
	},

	// ── faq_servicios — body part recommendations ──
	{
		regex:
			/(recomiendas|recomienda|recomendado|sugieres|sugiere)\s+(para|por)\s+(mis\s+|mi\s+)?(ojeras|papada|nariz|labios|frente|cuello|manos|barriga|abdomen|rostro|cara|ojos|párpados|parpados|mentón|menton|mejillas|brazos|piernas|espalda|glúteos|gluteos)/i,
		intent: "faq_servicios",
		confidence: 0.9,
		reason: "recomendación por zona corporal",
	},

	// ── faq_contacto — send info ──
	{
		regex:
			/\b(env[íi]a|manda|env[íi]enme|env[íi]eme|enviarme|mandarme|podr[ií]an\s+enviar)\s+(información|info|la\s+información|detalles?|datos?)\s+(a|al?\s+)?(mi\s+)?(correo|email|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
		intent: "faq_contacto",
		confidence: 0.9,
		reason: "solicita envío información",
	},
	// "¿Pueden enviarme información a email?" — enviar info to an email address
	{
		regex:
			/\b(pueden|podr[ií]an|puedes?)\s+enviarme\s+(información|info|detalles?|datos?)\b/i,
		intent: "faq_contacto",
		confidence: 0.85,
		reason: "solicita que envíen info a email",
	},
	{
		regex: /\b(whatsapp|wsp|wpp)\b/i,
		intent: "faq_contacto",
		confidence: 0.9,
		reason: "pregunta por WhatsApp",
	},
	{
		regex:
			/\b(n[uú]mero\s+(de\s+)?(tel[eé]fono|contacto|whatsapp)?|tel[eé]fono)\s+(de\s+)?(la\s+)?(cl[ií]nica|contacto|atenci[oó]n)\b/i,
		intent: "faq_contacto",
		confidence: 0.9,
		reason: "pregunta número teléfono clínica",
	},

	// ── pago — EPS, seguro, convenio ──
	{
		regex: /\b(convenio)\b/i,
		intent: "pago",
		confidence: 0.85,
		reason: "consulta convenio",
	},
	{
		regex: /\b(eps|convenio\s+con)\b/i,
		intent: "pago",
		confidence: 0.8,
		reason: "consulta convenio/EPS",
	},
	{
		regex: /\b(seguro\s+m[eé]dico|seguro)\s+(cubre|paga|cubrir[aá])\b/i,
		intent: "pago",
		confidence: 0.85,
		reason: "consulta cobertura seguro",
	},
	{
		regex:
			/\b(opciones\s+de\s+)?(financiaci[oó]n|financiar|cuotas|cualquier\s+entidad)\b/i,
		intent: "pago",
		confidence: 0.85,
		reason: "consulta financiación",
	},
	{
		regex: /\b(cr[eé]dito)\s/i,
		intent: "pago",
		confidence: 0.85,
		reason: "consulta crédito",
	},

	// ── resultados_esperados ──
	{
		regex:
			/\bcu[aá]ndo\s+(se\s+)?(ven|notan?|veo|ver[eé]|empiezan?\s+a\s+ver|voy\s+a\s+ver)\s+(los?\s+)?resultados?\b/i,
		intent: "resultados_esperados",
		confidence: 0.9,
		reason: "consulta tiempo resultados",
	},
	{
		regex:
			/\bcada\s+cu[aá]nto\s+(debo|tengo\s+que|hay\s+que|se\s+debe|puedo)\s+(ponerme|aplicar|hacerme|repetir)\b/i,
		intent: "resultados_esperados",
		confidence: 0.85,
		reason: "consulta frecuencia tratamiento",
	},
	{
		regex: /\bcu[aá]nto\s+(tiempo\s+)?dura\s+(el\s+)?(efecto|resultado)\b/i,
		intent: "resultados_esperados",
		confidence: 0.9,
		reason: "consulta duración efecto",
	},
	{
		regex: /\b(quedar\s+como\s+nueva?|quedar\s+nueva?|como\s+nueva)\b/i,
		intent: "resultados_esperados",
		confidence: 0.85,
		reason: "expectativa resultado",
	},
	{
		regex: /\b(resultados?\s+(son\s+)?naturales?)\b/i,
		intent: "resultados_esperados",
		confidence: 0.85,
		reason: "consulta naturalidad resultados",
	},

	// ── horarios ──
	{
		regex:
			/\b(est[aá]n\s+abiertos?|abierto\s+(ahora|hoy|los\s+(fines\s+de\s+)?semana|los\s+s[aá]bados))\b/i,
		intent: "horarios",
		confidence: 0.85,
		reason: "consulta horario atención",
	},

	// "¿Tienen horario/cita/espacio disponible para hoy/esta noche/mañana?" → agendamiento
	// (must come before horarios section catches standalone "horario disponible")
	{
		regex:
			/\b(horario|cita|turno|espacio|cupo)\s+(disponible|libre)\s+(para|esta\s+(noche|tarde|mañana)|hoy|mañana|el\s+(fin\s+de\s+semana|lunes|martes|mi[eé]rcoles?|jueves|viernes|s[aá]bado|domingo))\b/i,
		intent: "agendamiento",
		confidence: 0.90,
		reason: "consulta disponibilidad para fecha → booking",
	},

	// ── booking with PII (name + phone/email/tel abbreviation) — strong booking signal ──
	{
		regex:
			/\b(agenda|agendar|separar|reservar|pedir)\s+(para|una|cita\s+para|turno)\s+.{2,30}?(\btel[eé]fono\b|\bcelular\b|\bwhatsapp\b|\bcorreo\b|\bemail\b|\btel\b)/i,
		intent: "agendamiento",
		confidence: 0.9,
		reason: "booking con datos contacto",
	},

	// "¿Pueden enviarme información a email?" → faq_contacto
	{
		regex:
			/\b(env[ií]en?me|manden?me|pasen?me|compartan?)\s+(la\s+|el\s+|más\s+)?(informaci[oó]n|detalles?|datos?|cotizaci[oó]n)\s+(a|al?\s+correo|por\s+(whatsapp|correo))\b/i,
		intent: "faq_contacto",
		confidence: 0.85,
		reason: "solicitud envío de info por canal",
	},

	// ── agendamiento — data collection during booking ──
	{
		regex:
			/\b(soy|me\s+llamo|mi\s+nombre\s+(es|:))\s+\S+\s*[,;]?\s*\d{7,10}\b/i,
		intent: "agendamiento",
		confidence: 0.9,
		reason: "booking: comparte nombre + teléfono",
	},
	{
		regex:
			/\b(me\s+llamo|soy|mi\s+nombre\s+(es|:))\s+\S+(\s+\S+)?\s*,?\s*(c[eé]dula|cc|documento|tel[eé]fono|celular|whatsapp|celu)\s*\d{5,10}\b/i,
		intent: "agendamiento",
		confidence: 0.9,
		reason: "booking: nombre + documento/telefono",
	},
	{
		regex:
			/\b(prefiero|quiero|me\s+gusta|me\s+va\s+mejor|puedo)\s+(el|los|la\s+)?\s*(lunes|martes|mi[eé]rcoles?|jueves|viernes|s[aá]bado|domingo)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "booking: preferencia de día",
	},
	{
		regex:
			/\b(en\s+)?(la\s+)?(mañana|tarde|noche|madrugada)\b.*\b(puedo|prefiero|quiero|me\s+gusta|me\s+va|me\s+queda)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "booking: preferencia horaria",
	},
	{
		regex:
			/\b(cupo|disponibilidad|disponible|espacio|horario)\s+(para|de|esta)\s+(esta\s+)?(semana|semana\s+(que\s+)?viene|pr[oó]xim[oa]|hoy|mañana)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "consulta disponibilidad",
	},
	{
		regex:
			/\b(el\s+)?(d[ií]a\s+)?(m[aá]s\s+)?(pronto|cercano|pr[oó]xim[oa])\s+(disponible|que\s+tengan|cita|horario)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "consulta día más pronto",
	},
	{
		regex:
			/\b(agenda|agendar|separar|reservar|pedir)\s+(una\s+|la\s+)?(cita|turno|hora|valoración|valoracion|consulta)\s+(con\s+)?(el\s+)?(doctor|doctora|dr\.?|dra\.?)\b/i,
		intent: "agendamiento",
		confidence: 0.95,
		reason: "booking con doctor específico",
	},
	// ── agendamiento — "¿cuál es el día más pronto?", "¿cuándo tiene disponible?" ──
	{
		regex:
			/\bcu[aá]l\s+(es\s+)?(el\s+)?(d[ií]a\s+)?(m[aá]s\s+)?(pronto|pr[oó]xim[oa]|cercano)\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "consulta día más próximo",
	},
	{
		regex: /\bcu[aá]ndo\s+tiene(n|s)?\s+disponible\b/i,
		intent: "agendamiento",
		confidence: 0.85,
		reason: "consulta disponibilidad",
	},

	// ── dudas_medicas — "tengo molestia pero puede esperar / no es urgente" ──
	{
		regex:
			/\b(molestia|dolor\s+leve|malestar)\s+(pero|que)\s+(puede\s+(esperar|ser\s+normal)|no\s+(es\s+)?urgente)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta molestia no urgente",
	},

	// ── precio — cost inquiry ──
	{
		regex:
			/\bcu[aá]nto\s+(cuesta|vale|valen|sale|salen)\s+(el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(botox|ácido\s*hialurónico|tratamiento|procedimiento|sesi[oó]n|consulta|valoración|valoracion)\b/i,
		intent: "precio",
		confidence: 0.9,
		reason: "consulta precio tratamiento",
	},
	{
		regex:
			/\b(precio|precios|valor|costos?|tarifas?)\s+(del|de\s+la|de\s+los|de\s+las|de|para)\s+(botox|ácido\s*hialurónico|tratamiento|sesi[oó]n|consulta|procedimiento)\b/i,
		intent: "precio",
		confidence: 0.9,
		reason: "consulta precio tratamiento",
	},

	// ── post_tratamiento — flexible patterns (gap coverage for safetyPreRoute strict regexes) ──
	{
		regex:
			/\b(la\s+)?zona\s+(del\s+)?tratamiento\s+(?:qued[oó]|est[áa]|sinti[oó]|tengo\b)/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "complicación/comentario zona tratada",
	},
	{
		regex:
			/\b(me\s+)?(duele|duele\s+m[uú]cho|duele\s+un\s+poco|duele\s+bastante)\s+(la\s+)?zona\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "dolor en zona tratada",
	},
	{
		regex: /\b(bloqueador|protector\s+solar)\s+(despu[eé]s|post)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "cuidado post: bloqueador",
	},
	{
		regex:
			/\b(ejercicio|hacer\s+ejercicio|ir\s+al\s+gimnasio|deporte)\s+(despu[eé]s|post)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "cuidado post: ejercicio",
	},
	{
		regex:
			/\b(puedo|podr[ií]a|se\s+puede)\s+(hacer\s+)?(ejercicio|deporte|pesas|rutina)\b/i,
		intent: "post_tratamiento",
		confidence: 0.85,
		reason: "consulta si puede hacer ejercicio post",
	},
	{
		regex: /\b(alcohol|tomar\s+alcohol|beber)\s+(despu[eé]s|post)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "cuidado post: alcohol",
	},
	{
		regex: /\b(herida\s+abierta|sangr[ae])\s+(en\s+)?(la\s+)?zona\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "complicación post: herida",
	},
	{
		regex: /\b(no\s+)?siento\s+(la\s+)?(zona|sensibilidad)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "pérdida sensibilidad zona",
	},
	{
		regex:
			/\b(me\s+)?(hice|hicieron|realic[eé]|hice)\s+(una\s+|un\s+|el\s+|la\s+)?(mesoterapia|tratamiento|procedimiento|sesi[oó]n|limpieza|exfoliación)\b.*(ayer|anteayer|hace\s+\d+\s+(d[ií]as?|horas?|semanas?))\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "menciona tratamiento reciente",
	},
	{
		regex:
			/\b(me\s+)?(hice|hicieron|realic[eé])\s+(una\s+|un\s+|el\s+|la\s+)?(radiofrecuencia|armonizaci[oó]n|vitamina|hilos?|plasma|mesoterapia|limpieza|exfoliación)\b/i,
		intent: "post_tratamiento",
		confidence: 0.85,
		reason: "menciona tratamiento pasado genérico",
	},
	{
		regex:
			/\b(cuidados?|recomendaciones?|precauciones?|despu[eé]s)\s+(despu[eé]s|post|para\s+despu[eé]s|luego\s+del)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "consulta cuidados post",
	},
	{
		regex:
			/\b(tomar\s+sol|sol\s+despu[eé]s|tomar\s+el\s+sol\b|me\s+pongo\s+al\s+sol)\b/i,
		intent: "post_tratamiento",
		confidence: 0.95,
		reason: "cuidado post: sol",
	},
	{
		regex:
			/\b(ya\s+)?pas[oó]\s+(una\s+)?(semana|semana\s+del|un\s+(d[ií]a|poco))\s+(del\s+)?(tratamiento|procedimiento|sesi[oó]n)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "seguimiento post-tratamiento",
	},
	{
		regex:
			/\b(me\s+)?est[aá]\s+saliendo\s+(un\s+)?(moret[oó]n|morado|hematoma|roncha|bolita|bulto|protuberancia)\b/i,
		intent: "post_tratamiento",
		confidence: 0.9,
		reason: "reacción post: moretón",
	},

	// ── dudas_medicas — additional general medical questions ──
	{
		regex:
			/\b(tengo\s+que|debo|necesito|hay\s+que)\s+(tener|cuidar|evitar|hacer|saber|considerar)\s+(alg[úu]n|un|cierto|alg[úu]n\s+tipo\s+de)?\s*(cuidado|precaución|precaucion|consideración|atencion)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "consulta sobre precauciones",
	},
	{
		regex:
			/\b(estoy\s+)?tomando\s+(la\s+)?(decisi[oó]n|decisión)\s+(correcta|adecuada|indicada)\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "ansiedad decisión tratamiento",
	},
	{
		regex:
			/\b(me\s+)?(puedo|podr[ií]a)\s+(hacer|aplicar|poner)\s+(esto|eso|el\s+tratamiento|el\s+procedimiento)\s+(si|aunque|cuando)\s+(estoy\s+)?(embarazada|lactando|enferm[oa])\b/i,
		intent: "contraindicaciones",
		confidence: 0.95,
		reason: "contraindicación: condición + tratamiento",
	},
	{
		regex: /\b(eso\s+es|esto\s+es)\s+.{2,30}?\s+(o|ó)\s+.{2,30}?\b/i,
		intent: "dudas_medicas",
		confidence: 0.85,
		reason: "pregunta comparación entre tratamientos",
	},

	// ── precio — discount, negotiation, comparison ──
	{
		regex:
			/\b(descuento|rebaja|oferta|promoci[oó]n|m[aá]s\s+barato|mejor\s+precio|menos\s+caro)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "negociación descuento",
	},
	{
		regex:
			/\b(en\s+)?(otra|la\s+competencia|otro\s+lugar|otra\s+cl[ií]nica)\b.*\b(cuesta|cobran|pagan|sale|dan|vale)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "comparación de precios",
	},
	{
		regex:
			/\b(por\s+qu[eé]|raz[oó]n)\s+(son\s+tan\s+caros?|tan\s+caro|tan\s+cara|tan\s+caros|tan\s+caras)\b/i,
		intent: "precio",
		confidence: 0.85,
		reason: "cuestiona precio alto",
	},
	{
		regex:
			/\b(me\s+)?(puedes?|podr[ií]as?)\s+(hacer|dar|ofrecer)\s+(un\s+)?(descuento|mejor\s+precio|rebaja)\b/i,
		intent: "precio",
		confidence: 0.9,
		reason: "solicita descuento",
	},

	// ── charla — city mention, goodbye, personal info sharing ──
	// NOTE: No trailing \b after city capture group. JS word boundaries (\b) are ASCII-only:
	// accented chars (á/é/í/ó/ú/ñ) are NOT \w in JS, so \b between them and string-end is false.
	// E.g. /\bBogotá\b/i.test("Bogotá") === false. City names are long enough that context
	// ("soy de", "vivo en") prevents false positives, so we drop the \b.
	{
		regex:
			/\b(soy\s+de|vivo\s+en|resido\s+en|soy\s+de\s+la\s+ciudad\s+de|soy\s+de\s+la\s+capital)\s+(medell[ií]n|bogot[aá]|cali|barranquilla|cartagena|pereira|manizales|armenia|colombia|m[eé]xico)/i,
		intent: "charla",
		confidence: 0.85,
		reason: "comparte ciudad de origen",
	},
	{
		regex:
			/\b(hasta\s+(luego|pronto|despu[eé]s|la\s+vista)|nos\s+vemos|adi[oó]s|chao?|bye)\b/i,
		intent: "charla",
		confidence: 0.9,
		reason: "despedida",
	},
	{
		regex:
			/\b(soy|mi\s+nombre\s+(es|:))\s+\w+\s*[,.;]?\s+(t[eé]ng[oó]\s+\d+|naci[oó])\b/i,
		intent: "charla",
		confidence: 0.8,
		reason: "comparte nombre + dato personal",
	},

	// ── queja — complaint about staff / service quality ──
	{
		regex:
			/\b(la\s+)?(doctora|doctor|m[eé]dica?|recepcionista|asistente|enfermer[oa])\s+(fue|es|me\s+trat[oó]|me\s+atiendi[oó]|me\s+recibi[oó])\s+(muy\s+)?(brusc[oa]|mala?|groser[oa]|mal|descort[eé]s|r[uú]d[oa]|sec[oa]|antip[aá]tic[oa])\b/i,
		intent: "queja",
		confidence: 0.9,
		reason: "queja por atención del personal",
	},

	// ── contraindicaciones — fallback when safety-pre-router returns null ──
	{
		regex:
			/\b(estoy\s+)?embaraza(da|d[aá])\b.*\b(quiero|puedo|podr[ií]a|hacerme|aplicarme|ponerme|tratamiento|procedimiento|hac[eé]rmelo|hacerme\s+un)\b/i,
		intent: "contraindicaciones",
		confidence: 0.95,
		reason: "embarazo + interés tratamiento",
	},
	{
		regex:
			/\b(estoy\s+)?lactanc(ia|i[eé])\b.*\b(quiero|puedo|podr[ií]a|hacerme|aplicarme|ponerme|tratamiento)\b/i,
		intent: "contraindicaciones",
		confidence: 0.95,
		reason: "lactancia + interés tratamiento",
	},

	// ── contraindicaciones — follow-up reassurance ──
	{
		regex:
			/\bsegura?\s+que\s+(no\s+)?(hay\s+problema|puedo\b|funciona|sirve|es\s+seguro)\b/i,
		intent: "contraindicaciones",
		confidence: 0.85,
		reason: "reaseguramiento contraindicación",
	},

	// ── faq_servicios — "tienen algo para..." ──
	{
		regex: /\btienen\s+algo\s+(para|por|contra)\s+/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "pregunta por tratamiento para condición",
	},
	{
		regex: /\b(no\s+es\s+(nada\s+)?urgente|solo\s+(quiero|busco)\s+info)\b/i,
		intent: "faq_servicios",
		confidence: 0.85,
		reason: "aclara no urgencia + info",
	},

	// ── faq_contacto — number / WhatsApp ──
	{
		regex:
			/\bn[uú]mero\s+(de\s+)?(la\s+)?(cl[ií]nica|tel[eé]fono|contacto|atenci[oó]n)\b/i,
		intent: "faq_contacto",
		confidence: 0.9,
		reason: "pregunta número clínica",
	},

	// "Mi abogado se va a comunicar con ustedes" = legal threat = queja (NOT hablar_humano)
	// Must come BEFORE the hablar_humano abogado rule below
	{
		regex:
			/\b(mi\s+abogad[oa]|nuestro\s+abogad[oa])\s+(se\s+va\s+a\s+|va\s+a\s+)(comunicar(se)?|contactar(los?|las?)?|hablar|llamar|escribir)\b/i,
		intent: "queja",
		confidence: 0.90,
		reason: "amenaza legal — abogado va a contactar",
	},

	// ── hablar_humano — "alguien me llame", "abogado" ──
	{
		regex:
			/\b(alguien\s+(me\s+)?llame|que\s+me\s+llamen|me\s+llame\s+alguien|alguien\s+me\s+atienda)\b/i,
		intent: "hablar_humano",
		confidence: 0.85,
		reason: "pide que alguien lo contacte",
	},
	{
		regex: /\b(datos\s+del?\s+abogado|comunicarme\s+con\s+(el\s+|su\s+)?abogado)\b/i,
		intent: "hablar_humano",
		confidence: 0.85,
		reason: "pide datos legales/abogado",
	},

	// ── precio — "me interesa [servicio]" ──
	{
		regex:
			/\b(me\s+interesa|me\s+gustar[ií]a)\s+(el\s+|la\s+|un\s+|una\s+)?(botox|ácido\s*hialurónico|tratamiento|servicio|limpieza|relleno)\b/i,
		intent: "precio",
		confidence: 0.8,
		reason: "interés en servicio con intención precio",
	},
	{
		regex:
			/\b(tambi[eé]n|adem[aá]s)\s+(el|la|los|las)\s+(botox|ácido\s*hialurónico|relleno|hilos|limpieza)\b/i,
		intent: "precio",
		confidence: 0.8,
		reason: "adicional interés en otro servicio",
	},

	// ── cancelacion_reprogramacion — "cambiarla", "anticipo" ──
	{
		regex:
			/\b(cambiarla|cambiarlo|cambiar\s+la\s+cita|cambiar\s+el\s+turno)\s+(para\s+)?\b/i,
		intent: "cancelacion_reprogramacion",
		confidence: 0.85,
		reason: "solicita cambiar cita",
	},
	{
		regex:
			/\b(anticipo|dep[só]ito|se[aá]as)\s+(si\s+)?(la\s+)?(cambio|cancelo|cancelaci[oó]n)\b/i,
		intent: "cancelacion_reprogramacion",
		confidence: 0.8,
		reason: "pregunta sobre política cancelación",
	},
];

export function deterministicDomainRoute(text: string): RouterDecision | null {
	text = text.normalize("NFC");
	const trimmed = text.trim();
	if (!trimmed) return null;

	const lower = trimmed.toLowerCase();
	const hasBookingKeywords = hasBookingIntent(lower);

	for (const signal of DOMAIN_SIGNALS) {
		if (!signal.regex.test(trimmed)) continue;

		// Skip PII-sharing patterns if there's simultaneous booking intent
		// (user sharing data while trying to book → agendamiento, not charla)
		if (
			hasBookingKeywords &&
			signal.intent === "charla" &&
			signal.reason.startsWith("comparte")
		) {
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
