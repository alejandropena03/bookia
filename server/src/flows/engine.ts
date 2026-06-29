import { renderTemplate } from "./template.js";

export interface FlowDefinition {
  initial: string;
  states: Record<string, FlowState>;
}

export interface FlowState {
  prompt: string;
  collects: string | null;
  next?: string | null;
  transitions?: Record<string, string>;
  description?: string;
}

export interface FlowContext {
  flowKey: string;
  currentState: string;
  slots: Record<string, string>;
}

export interface FlowResult {
  response: string;
  context: FlowContext;
  completed: boolean;
}

export interface CatalogItem {
  name: string;
  description?: string;
  price: string;
  currency: string;
  cities?: string[];
  imageKeys?: string[];
  promoLabel?: string | null;
}

function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—\-_\/,.;!¡¿?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LEADING_WORDS = ["quiero", "me gustaria", "quisiera", "necesito", "el", "la", "un", "una", "los", "las"];
const STOP_WORDS = ["de", "el", "la", "los", "las", "un", "una", "y", "e", "del", "con", "para", "por", "en"];

function stripLeadingWords(t: string): string {
  let result = t;
  for (const w of LEADING_WORDS) {
    if (result.startsWith(w + " ")) {
      result = result.slice(w.length + 1);
    }
  }
  return result;
}

function wordsOnly(t: string): string {
  return t.split(/\s+/).filter(w => !STOP_WORDS.includes(w)).join(" ");
}

export function formatPrice(price: string, currency?: string): string {
  const num = parseInt(price, 10);
  if (isNaN(num)) return price;
  const symbols: Record<string, string> = { COP: "$", MXN: "$", USD: "$", EUR: "€" };
  const sym = symbols[currency ?? ""] || "$";
  return `${sym}${new Intl.NumberFormat("es-CO").format(num)} ${currency ?? "COP"}`;
}

function buildTemplateContext(slots: Record<string, string>, catalogItems?: CatalogItem[]): Record<string, string> {
  const catalog = catalogItems ?? [];
  const rawName = slots.service || slots.service_name || "";
  const cleanName = wordsOnly(stripLeadingWords(normalizeText(rawName)));

  const selected = catalog.find((c) => {
    const cn = wordsOnly(normalizeText(c.name));
    return cleanName.includes(cn) || cn.includes(cleanName);
  });

  // Filter catalog by city slot for catalog_list
  const cityFilter = (slots.city || slots.ciudad || "").toLowerCase().trim();
  const cityFiltered = catalog.filter((c) => {
    if (!cityFilter || !c.cities || c.cities.length === 0) return true;
    return c.cities.some((ct) => ct.toLowerCase().trim() === cityFilter);
  });

  // Clean double-article patterns from slot values for nicer rendering
  function cleanSlot(val: string): string {
    const v = val.trim();
    const articles = ["el ", "la ", "un ", "una ", "los ", "las ", "de "];
    for (const a of articles) {
      if (v.toLowerCase().startsWith(a) && v.length > a.length + 2) {
        return v.slice(a.length).trim();
      }
    }
    return v;
  }

  return {
    ...slots,
    nombre: slots.nombre || "",
    city: cleanSlot(slots.city || slots.ciudad || ""),
    service_name: selected?.name ?? cleanSlot(slots.service_name ?? slots.service ?? ""),
    service_price: selected ? formatPrice(selected.price, selected.currency) : slots.service_price ?? "",
    service_description: selected?.description ?? "",
    datetime: cleanSlot(slots.datetime || ""),
    client_name: slots.client_name || slots.clientData || "",
    catalog_list: cityFiltered.length > 0
      ? cityFiltered.map((c) => `- ${c.name}: ${formatPrice(c.price, c.currency)}`).join("\n")
      : slots.catalog_list || "(Sin servicios disponibles)",
  };
}

function isStateTerminal(definition: FlowDefinition, stateName: string): boolean {
  const s = definition.states[stateName];
  if (!s) return true;
  return !s.transitions && (s.next == null || !definition.states[s.next]);
}

export function getNextState(definition: FlowDefinition, currentState: string, input: string): { next: string | null; completed: boolean } {
  const state = definition.states[currentState];
  if (!state) return { next: null, completed: true };

  if (state.collects && state.transitions) {
    const lower = input.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [key, target] of Object.entries(state.transitions)) {
      if (lower.includes(key)) {
        return { next: target, completed: isStateTerminal(definition, target) };
      }
    }
    return { next: currentState, completed: false };
  }

  const next = state.next ?? null;
  if (!next) return { next: null, completed: true };
  return { next, completed: isStateTerminal(definition, next) };
}

export function evaluateFlow(
  definition: FlowDefinition,
  context: FlowContext,
  input: string,
  catalogItems?: CatalogItem[]
): FlowResult {
  const state = definition.states[context.currentState];
  if (!state) {
    return {
      response: "Lo siento, no pude procesar tu solicitud. Un agente te atenderá pronto.",
      context,
      completed: true,
    };
  }

  const collects = state.collects;
  const newSlots = { ...context.slots };

  if (collects && input) {
    newSlots[collects] = input;
  }

  const { next, completed } = getNextState(definition, context.currentState, input);

  if (!next || completed) {
    // When next is null, the CURRENT state IS terminal — show its prompt.
    // When next is a named state, show that state's prompt.
    const targetState = next ? (definition.states[next] ?? state) : state;
    const templateContext = buildTemplateContext(newSlots, catalogItems);
    return {
      response: renderTemplate(targetState.prompt, templateContext),
      context: { ...context, currentState: next ?? context.currentState, slots: newSlots },
      completed: true,
    };
  }

  const nextState = definition.states[next];
  const templateContext = buildTemplateContext(newSlots, catalogItems);
  const response = nextState ? renderTemplate(nextState.prompt, templateContext) : state.prompt;

  return {
    response,
    context: { ...context, currentState: next, slots: newSlots },
    completed: false,
  };
}

export function startFlow(definition: FlowDefinition, contactName?: string, catalogItems?: CatalogItem[]): FlowResult {
  const initial = definition.states[definition.initial];
  if (!initial) {
    return {
      response: "Lo siento, hubo un error al iniciar el flujo.",
      context: { flowKey: "", currentState: "", slots: {} },
      completed: true,
    };
  }

  const context: FlowContext = {
    flowKey: "",
    currentState: definition.initial,
    slots: { nombre: contactName ?? "" },
  };

  const templateContext = buildTemplateContext(context.slots, catalogItems);
  const response = renderTemplate(initial.prompt, templateContext);

  // Flujo de un solo estado (terminal): el saludo one-shot.
  // Marcamos completed=true para que tryStartFlow NO persist state y el
  // siguiente mensaje continúe por el pipeline normal (router → flow real).
  const isTerminal =
    initial.next == null ||
    !definition.states[initial.next];
  return { response, context, completed: isTerminal };
}
