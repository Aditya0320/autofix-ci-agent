import { AppProvider } from "./context/AppContext";
import { RunForm } from "./components/RunForm";
import { RunProgress } from "./components/RunProgress";
import { SummaryCard } from "./components/SummaryCard";
import { ScorePanel } from "./components/ScorePanel";
import { FixesTable } from "./components/FixesTable";
import { CiTimeline } from "./components/CiTimeline";
import "./App.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80";

function App() {
  return (
    <AppProvider>
      <div className="app">
        <header className="header">
          <div className="hero">
            <div className="hero-bg" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-badge">RIFT 2026 — AI/ML • DevOps Automation</div>
              <h1 className="hero-title">Autonomous CI/CD Healing Agent</h1>
              <p className="hero-subtext">
                Clone, detect, fix, and push. AI-driven pipeline healing with deterministic fixes and optional Gemini.
              </p>
            </div>
          </div>
        </header>
        <main className="main">
          <RunForm />
          <RunProgress />
          <div className="dashboard-grid">
            <SummaryCard />
            <ScorePanel />
          </div>
          <FixesTable />
          <CiTimeline />
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
