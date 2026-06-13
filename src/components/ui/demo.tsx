import { HeroSection } from "@/components/ui/hero-section-dark"
import { AuthForm } from "@/components/ui/auth-form"

function HeroSectionDemo() {
  return (
    <HeroSection
      title="JobGiga Platform"
      subtitle={{
        regular: "Hello, thank you for attending ",
        gradient: "JobGiga UAT",
      }}
      description="Please sign in or register to begin testing. Explore the new workflows, evaluate platform features, and help us finalize the release."
      ctaText="Get Started"
      ctaHref="#"
      bottomImage={{
        light: "https://www.launchuicomponents.com/app-light.png",
        dark: "https://www.launchuicomponents.com/app-dark.png",
      }}
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    >
      <AuthForm />
    </HeroSection>
  )
}
export { HeroSectionDemo }
