/**
 * Template engine: reemplaza {variable} con valores del contexto.
 * Si una variable no tiene valor, se omite (se reemplaza por "").
 */
export function renderTemplate(template: string, context: Record<string, string | undefined | null>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = context[key];
    return val ?? "";
  });
}
