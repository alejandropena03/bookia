export const SANTA_MARIA_CANNED: Record<string, string> = {
  // ── Precios ──
  precio:
    "¡Claro {nombre}! Algunos de nuestros precios:\n\n{catalog_list}\n\nDime ¿desde qué ciudad nos escribes? para darte información más específica ✨",

  // ── Agendamiento ──
  agendamiento:
    "En Santa María Clínica Estética te ofrecemos una valoración personalizada para diseñar un plan acorde a tus objetivos faciales. Será un placer atenderte. ¿Deseas reservar tu cita? 😊",

  // ── Ubicación ──
  ubicacion:
    "📍 Nuestras ubicaciones:\n\n🇨🇴 Colombia:\n📍 Medellín — Calle 16AA Sur # 42-91, Edificio Campestre 16-43, Consultorio 311 – El Poblado\n📍 Bogotá — Carrera 7 No. 127-48, Edificio Centro Empresarial 128, Consultorio 306\n📍 Cali — Calle 25 # 98-414, C.C. Jardín Plaza, Jardín Central 2 Business Center, Consultorio 504\n📍 Bucaramanga — Calle 42 # 33-42, Torre Vitro, Consultorio 1206\n📍 Barranquilla — Calle 93 # 49c - 29 Consultorio 203. El Poblado.\n\n🇲🇽 México:\n📍 Ciudad de México — Paseo de los Tamarindos 384, Col. Bosques de las Lomas, Delegación Cuajimalpa, C.P. 05119, CDMX\n\n🇺🇸 Estados Unidos:\n📍 Miami — 3837 SW 8th St, Coral Gables, FL 33134, United State\n\n📲 WhatsApp para citas: +57 301 291 1975 🤍",

  // ── Horarios ──
  horarios:
    "📅 Horarios de atención:\n🕘 Lunes a sábado de 9:00 a.m. a 7:00 p.m.",

  // ── Formas de pago ──
  pago:
    "💳 Métodos de pago disponibles:\n\n🇨🇴 Colombia:\n• Efectivo\n• Transferencia Bancolombia\n• Tarjetas débito y crédito\n• Link de pago\n\n🇺🇸 Estados Unidos:\n• Efectivo\n• Zelle\n• Link de pago\n\n🇲🇽 México:\n• Link de pago\n• Terminal",

  // ── Confirmación de cita ──
  confirmacion_cita:
    "Apreciado(a) paciente, su cita ha sido programada exitosamente en Santa María Clínica Estética ✨ Los detalles fueron enviados a su correo electrónico.\n\n*Recuerde asistir con su documento de identidad original, ya que es requerido para el cumplimiento de nuestros protocolos médicos y el ingreso a nuestras instalaciones.*\n\n*En caso de cancelación, debe informarse con mínimo 24 horas de anticipación; de lo contrario, el abono no será reembolsable.*\n\nAgradecemos su puntualidad. Muchas gracias por confiar en nosotros 🤍",

  // ── Recordatorio de cita ──
  recordatorio_cita:
    "Hola {nombre}, te escribimos desde Santa María Clínica Estética para recordarte tu cita. ¿Deseas confirmarla? 😊",

  // ── Charla / casual ──
  charla:
    "¡Con gusto te ayudo! 😊 Cuéntame, ¿qué servicio te interesa o qué duda tienes?",

  // ── Follow-up después de enviar info ──
  follow_up:
    "¿Tienes alguna duda o te gustaría recibir más información sobre el procedimiento que deseas realizarte? Con gusto te ayudo 😊",

  // ── Rinomodelación ──
  rinomodelacion:
    "💉✨ Rinomodelación sin cirugía ✨💉\n\nLa rinomodelación es un procedimiento no quirúrgico en el que utilizamos ácido hialurónico para mejorar la forma de la nariz. Nos permite perfilar el dorso, levantar la punta y corregir pequeñas asimetrías, logrando un resultado más armónico y natural sin necesidad de cirugía.\n\nEs un tratamiento rápido, con resultados inmediatos y mínima incapacidad.\n\n💰 Valor: $8,500 MXN / $820,000 COP\n\nAgenda tu valoración y cambia tu vida ✨",

  // ── Full Face / Armonización facial ──
  armonizacion_facial:
    "El tratamiento de Full Face (Armonización Facial) es una experiencia de diseño facial personalizada, enfocada en realzar tu belleza con resultados elegantes, equilibrados y completamente naturales.\n\nTrabajamos cada detalle del rostro para mejorar proporciones, definir estructuras y aportar un aspecto más fresco y sofisticado, sin alterar tu esencia, sino elevando tu imagen.",
};

export const SANTA_MARIA_ESCALATION_RULES = {
  keywords: [
    { keyword: "emergencia", reason: "Cliente menciona emergencia o reacción adversa", notify: true },
    { keyword: "reacción", reason: "Cliente menciona reacción adversa", notify: true },
    { keyword: "alergia", reason: "Cliente menciona reacción alérgica", notify: true },
    { keyword: "humano", reason: "Cliente pide explícitamente hablar con un humano", notify: true },
    { keyword: "elkin", reason: "Cliente pide hablar con Elkin específicamente", notify: true },
    { keyword: "insatisfecho", reason: "Cliente se muestra molesto o insatisfecho", notify: true },
    { keyword: "descuento", reason: "Cliente pide descuento o promoción no listada", notify: true },
    { keyword: "técnico", reason: "Cliente pregunta algo técnico/médico fuera del catálogo", notify: true },
    { keyword: "médico", reason: "Cliente pregunta algo técnico/médico fuera del catálogo", notify: true },
    { keyword: "cancelar", reason: "Cliente desea cancelar su cita", notify: true },
    { keyword: "queja", reason: "Cliente presenta una queja sobre el servicio", notify: true },
  ],
  no_decir: [
    "diagnósticos médicos",
    "recomendaciones médicas personalizadas",
    "precios que no estén en el catálogo",
    "promesas de resultados",
    "presupuestos sin valoración previa",
  ],
};
