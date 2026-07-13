import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import chalk from "chalk";
import {
  getProfile,
  getExpenses,
  getIncome,
  getAssets,
  getLoans,
  getBorrowings,
  getSummary,
} from "./tools.js";

// ============================================================================
// Dev Logging Utilities
// ============================================================================

const isDev = process.env.NODE_ENV !== "production";

// ============================================================================
// MCP Server Setup
// ============================================================================

// Build a FRESH MCP server per request to handle stateless HTTP/SSE.
function createMcpServer(token: string): McpServer {
  const server = new McpServer({
    name: "xpense-mcp",
    version: "1.0.0",
  });

  // 1. Register get_profile tool
  server.registerTool(
    "get_profile",
    { description: "Fetch the profile details of the authenticated user." },
    async () => {
      const output = await getProfile(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 2. Register get_expenses tool
  server.registerTool(
    "get_expenses",
    { description: "Fetch all expense transactions recorded by the user." },
    async () => {
      const output = await getExpenses(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 3. Register get_income tool
  server.registerTool(
    "get_income",
    { description: "Fetch all income transactions recorded by the user." },
    async () => {
      const output = await getIncome(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 4. Register get_assets tool
  server.registerTool(
    "get_assets",
    { description: "Fetch all user financial assets (bank accounts, wallets, etc.)." },
    async () => {
      const output = await getAssets(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 5. Register get_loans tool
  server.registerTool(
    "get_loans",
    { description: "Fetch list of active loans given by the user to others." },
    async () => {
      const output = await getLoans(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 6. Register get_borrowings tool
  server.registerTool(
    "get_borrowings",
    { description: "Fetch list of borrowings and debts owed by the user to lenders." },
    async () => {
      const output = await getBorrowings(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // 7. Register get_summary tool
  server.registerTool(
    "get_summary",
    { description: "Fetch financial aggregates including income, expenses, and loan totals." },
    async () => {
      const output = await getSummary(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  return server;
}

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});

// MCP endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  const server = createMcpServer(token);
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// JSON error handler
app.use((_err: unknown, _req: Request, res: Response, _next: Function) => {
  res.status(500).json({ error: "Internal server error" });
});

// ============================================================================
// Start Server
// ============================================================================

const port = parseInt(process.env.PORT || "8080");
const httpServer = app.listen(port, () => {
  console.log();
  console.log(
    chalk.bold("MCP Server running on"),
    chalk.cyan(`http://localhost:${port}`),
  );
  console.log(`  ${chalk.gray("Health:")} http://localhost:${port}/health`);
  console.log(`  ${chalk.gray("MCP:")}    http://localhost:${port}/mcp`);

  if (isDev) {
    console.log();
    console.log(chalk.gray("─".repeat(50)));
    console.log();
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  httpServer.close(() => {
    process.exit(0);
  });
});
