import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import DemoLive from "@/components/dashboard/DemoLive"

// Mock de la API con espías para controlar flujo SSE.
// (var evita TDZ: la factoría de jest.mock se hoista antes que el `let`).
var sseOnMessage: ((data: unknown) => void) | null = null
var sendMock = jest.fn()

jest.mock("@/lib/api", () => ({
  sendSimMessage: (...args: unknown[]) => sendMock(...args),
  subscribeToSSE: (onMessage: (data: unknown) => void) => {
    sseOnMessage = onMessage
    return () => {
      sseOnMessage = null
    }
  },
}))

describe("DemoLive — chat en vivo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sseOnMessage = null
  })

  it("envía mensaje, usa agentResponse del POST como respuesta primaria", async () => {
    sendMock.mockResolvedValueOnce({
      messageId: "m1",
      conversationId: "conv-123",
      agentResponse: { text: "¡Hola! ¿En qué te ayudo hoy?", route: "canned" },
    })

    render(<DemoLive />)
    // Abrir widget
    fireEvent.click(screen.getByLabelText("Demo en vivo"))
    const input = screen.getByPlaceholderText("Escribe como cliente...")
    fireEvent.change(input, { target: { value: "hola" } })
    await act(async () => {
      fireEvent.submit(input.closest("form")!)
    })

    // La respuesta del agentResponse aparece (sin depender de SSE).
    await waitFor(() => {
      expect(screen.getByText("¡Hola! ¿En qué te ayudo hoy?")).toBeInTheDocument()
    })
    expect(sendMock).toHaveBeenCalledWith("hola")
  })

  it("ignora eventos SSE inbound (no duplica mensaje del usuario como bot)", async () => {
    sendMock.mockResolvedValueOnce({
      messageId: "m1",
      conversationId: "conv-123",
      agentResponse: { text: "ok", route: "canned" },
    })

    render(<DemoLive />)
    fireEvent.click(screen.getByLabelText("Demo en vivo"))
    const input = screen.getByPlaceholderText("Escribe como cliente...")
    fireEvent.change(input, { target: { value: "hola" } })
    await act(async () => {
      fireEvent.submit(input.closest("form")!)
    })
    await waitFor(() => expect(sendMock).toHaveBeenCalled())

    // El backend también emite el inbound por SSE — NO debe aparecer como burbuja bot.
    act(() => {
      sseOnMessage?.({
        conversationId: "conv-123",
        message: { id: "inb-1", direction: "inbound", senderType: "contact", text: "hola", createdAt: "x" },
      })
    })

    // Solo debe existir UN bot "ok" + un "hola" como user (no un bot "hola").
    const bub = screen.queryAllByText("hola")
    // "hola" aparece una vez (input vaciado tras submit; user bubble contiene "hola").
    expect(bub.length).toBe(1)
  })

  it("filtra cross-talk: ignora SSE outbound de otra conversationId", async () => {
    sendMock.mockResolvedValueOnce({
      messageId: "m1",
      conversationId: "conv-A",
      agentResponse: { text: "mi respuesta", route: "canned" },
    })

    render(<DemoLive />)
    fireEvent.click(screen.getByLabelText("Demo en vivo"))
    const input = screen.getByPlaceholderText("Escribe como cliente...")
    fireEvent.change(input, { target: { value: "x" } })
    await act(async () => {
      fireEvent.submit(input.closest("form")!)
    })
    await waitFor(() => expect(sendMock).toHaveBeenCalled())

    // SSE outbound de OTRA conversación (otra sesión demo) — debe ser filtrado.
    act(() => {
      sseOnMessage?.({
        conversationId: "conv-OTRA",
        message: { id: "out-other", direction: "outbound", senderType: "bot", text: "soy del otro", createdAt: "x" },
      })
    })

    expect(screen.queryByText("soy del otro")).toBeNull()
  })

  it("muestra mensaje de error si el backend falla", async () => {
    sendMock.mockRejectedValueOnce(new Error("backend boom"))
    render(<DemoLive />)
    fireEvent.click(screen.getByLabelText("Demo en vivo"))
    const input = screen.getByPlaceholderText("Escribe como cliente...")
    fireEvent.change(input, { target: { value: "ayuda" } })
    await act(async () => {
      fireEvent.submit(input.closest("form")!)
    })
    await waitFor(() => {
      expect(screen.getByText(/backend boom/)).toBeInTheDocument()
    })
  })
})