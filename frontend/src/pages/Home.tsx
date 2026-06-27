import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div style={{ padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "1rem" }}>
        React Vite Monorepo
      </h1>
      <p style={{ fontSize: "1.125rem", color: "#64748b", marginBottom: "2rem" }}>
        Welcome to your production-ready workspace. This React frontend has TypeScript, 
        path aliases, React Router, and a shadcn/ui folder layout configured.
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Button variant="default">Get Started</Button>
        <Button variant="outline" onClick={() => window.open("/api/docs", "_blank")}>
          API Docs
        </Button>
      </div>
    </div>
  )
}
