/**
 * Backend entry – Express app, CORS, routes.
 * RIFT 2026 – Autonomous CI/CD Healing Agent (skeleton only).
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const agentRoutes = require("./routes/agent");
const { writeSampleResults, ensureResultsDir } = require("./utils/results");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Agent API
app.use("/api", agentRoutes);

// Ensure output dir exists and write sample results if missing (skeleton convenience)
(function initResults() {
  ensureResultsDir();
  const { readResults } = require("./utils/results");
  if (readResults() === null) {
    writeSampleResults();
  }
})();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
