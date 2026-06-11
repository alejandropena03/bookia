import { render, screen } from "@testing-library/react"
import MetricCard from "@/components/dashboard/MetricCard"

describe("MetricCard", () => {
  it("renderiza el título y el valor correctamente", () => {
    render(<MetricCard title="Mensajes hoy" value={47} delta="+23% vs ayer" deltaPositive icon="💬" />)
    expect(screen.getByText("Mensajes hoy")).toBeInTheDocument()
    expect(screen.getByText("47")).toBeInTheDocument()
    expect(screen.getByText("+23% vs ayer")).toBeInTheDocument()
  })

  it("renderiza con valor string", () => {
    render(<MetricCard title="Tasa conversión" value="68%" delta="Meta: 70%" deltaPositive={false} icon="📊" />)
    expect(screen.getByText("68%")).toBeInTheDocument()
  })

  it("aplica color verde para deltaPositive=true", () => {
    const { container } = render(<MetricCard title="T" value={1} delta="ok" deltaPositive icon="⚡" />)
    expect(container.querySelector(".text-emerald-600")).toBeInTheDocument()
  })

  it("aplica color ámbar para deltaPositive=false", () => {
    const { container } = render(<MetricCard title="T" value={1} delta="ok" deltaPositive={false} icon="⚡" />)
    expect(container.querySelector(".text-amber-600")).toBeInTheDocument()
  })
})
