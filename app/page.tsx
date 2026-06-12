import Navbar from "@/components/landing/navbar"
import Hero from "@/components/landing/hero"
import DemoChat from "@/components/landing/demo-chat"
import HowItWorks from "@/components/landing/how-it-works"
import Features from "@/components/landing/features"
import Metrics from "@/components/landing/metrics"
import Cta from "@/components/landing/cta"
import Footer from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Navbar />
      <Hero />
      <DemoChat />
      <HowItWorks />
      <Features />
      <Metrics />
      <Cta />
      <Footer />
    </div>
  )
}
