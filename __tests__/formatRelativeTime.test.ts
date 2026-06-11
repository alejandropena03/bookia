import { formatRelativeTime } from "@/lib/time"

describe("formatRelativeTime", () => {
  it('devuelve "ahora" para menos de 1 minuto', () => {
    const ts = new Date(Date.now() - 30000).toISOString()
    expect(formatRelativeTime(ts)).toBe("ahora")
  })

  it('devuelve "hace X min" para menos de 1 hora', () => {
    const ts = new Date(Date.now() - 5 * 60000).toISOString()
    expect(formatRelativeTime(ts)).toBe("hace 5 min")
  })

  it('devuelve "hace Xh" para menos de 24 horas', () => {
    const ts = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(formatRelativeTime(ts)).toBe("hace 3h")
  })

  it('devuelve "hace Xd" para más de 24 horas', () => {
    const ts = new Date(Date.now() - 2 * 86400000).toISOString()
    expect(formatRelativeTime(ts)).toBe("hace 2d")
  })
})
