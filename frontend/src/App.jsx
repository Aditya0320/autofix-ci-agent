import { AppProvider } from "./context/AppContext";
import { RunForm } from "./components/RunForm";
import { RunProgress } from "./components/RunProgress";
import { SummaryCard } from "./components/SummaryCard";
import { ScorePanel } from "./components/ScorePanel";
import { FixesTable } from "./components/FixesTable";
import { CiTimeline } from "./components/CiTimeline";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <div className="app">
        <header className="header">
          <h1>Autonomous CI/CD Healing Agent</h1>
          <p className="subtext">RIFT 2026 Hackathon</p>
        </header>
        <main className="main">
          <RunForm />
          <RunProgress />
          <SummaryCard />
          <ScorePanel />
          <FixesTable />
          <CiTimeline />
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
