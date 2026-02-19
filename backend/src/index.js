/**
 * Backend entry – Express app, CORS, routes.
 * RIFT 2026 – Autonomous CI/CD Healing Agent (skeleton only).
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const agentRoutes = require("./routes/agent");
const { ensureResultsDir } = require("./utils/results");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Agent API
app.use("/api", agentRoutes);

// Ensure output dir exists; results.json is only written after a real run (no sample/fake data)
ensureResultsDir();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
