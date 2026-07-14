import "dotenv/config";
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
  getSpendingAnalytics,
  getSpendingAverages,
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
    {
      description: "Fetch the profile details of the authenticated user.",
      inputSchema: z.object({
        _meta: z.string().optional().describe("Ignored"),
      }),
    },
    async () => {
      const output = await getProfile(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
      };
    },
  );

  // 2. Register get_expenses tool
  server.registerTool(
    "get_expenses",
    {
      description: "Fetch up to 10 recent expense transactions. You can optionally filter by category and date range.",
      inputSchema: z.object({
        category: z.string().optional().describe("Filter by category (e.g. Food, Rent, Utilities)"),
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
      }),
    },
    async (args) => {
      const output = await getExpenses(token, 10, args.category, args.startDate, args.endDate);
      const limited = Array.isArray(output) ? output.slice(0, 10) : output;
      return {
        content: [{ type: "text", text: JSON.stringify(limited) }],
      };
    },
  );

  // 3. Register get_income tool
  server.registerTool(
    "get_income",
    {
      description: "Fetch up to 10 recent income transactions. You can optionally filter by source and date range.",
      inputSchema: z.object({
        source: z.string().optional().describe("Filter by source (e.g. Salary, Freelance)"),
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
      }),
    },
    async (args) => {
      const output = await getIncome(token, 10, args.source, args.startDate, args.endDate);
      const limited = Array.isArray(output) ? output.slice(0, 10) : output;
      return {
        content: [{ type: "text", text: JSON.stringify(limited) }],
      };
    },
  );

  // 4. Register get_assets tool
  server.registerTool(
    "get_assets",
    {
      description: "Fetch all user financial assets (bank accounts, wallets, etc.).",
      inputSchema: z.object({
        _meta: z.string().optional().describe("Ignored"),
      }),
    },
    async () => {
      const output = await getAssets(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
      };
    },
  );

  // 5. Register get_loans tool
  server.registerTool(
    "get_loans",
    {
      description: "Fetch list of active loans given by the user to others.",
      inputSchema: z.object({
        _meta: z.string().optional().describe("Ignored"),
      }),
    },
    async () => {
      const output = await getLoans(token);
      const limited = Array.isArray(output) ? output.slice(0, 10) : output;
      return {
        content: [{ type: "text", text: JSON.stringify(limited) }],
      };
    },
  );

  // 6. Register get_borrowings tool
  server.registerTool(
    "get_borrowings",
    {
      description: "Fetch list of borrowings and debts owed by the user to lenders.",
      inputSchema: z.object({
        _meta: z.string().optional().describe("Ignored"),
      }),
    },
    async () => {
      const output = await getBorrowings(token);
      const limited = Array.isArray(output) ? output.slice(0, 10) : output;
      return {
        content: [{ type: "text", text: JSON.stringify(limited) }],
      };
    },
  );

  // 7. Register get_summary tool
  server.registerTool(
    "get_summary",
    {
      description: "Fetch financial aggregates including income, expenses, and loan totals.",
      inputSchema: z.object({
        _meta: z.string().optional().describe("Ignored"),
      }),
    },
    async () => {
      const output = await getSummary(token);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
      };
    },
  );

  // 8. Register get_spending_analytics tool
  server.registerTool(
    "get_spending_analytics",
    {
      description: "Fetch aggregated spending analytics, including total spending, category breakdown, and timeline data. Use this instead of fetching raw expenses when you need to calculate totals or summarize spending.",
      inputSchema: z.object({
        filterType: z.enum(["day", "month", "year"]).describe("The grouping type for the timeline data"),
        fromDate: z.string().optional().describe("Start date (YYYY-MM-DD for day, YYYY-MM for month, YYYY for year)"),
        toDate: z.string().optional().describe("End date (YYYY-MM-DD for day, YYYY-MM for month, YYYY for year)"),
      }),
    },
    async (args) => {
      const output = await getSpendingAnalytics(token, args.filterType, args.fromDate, args.toDate);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
      };
    },
  );

  // 9. Register get_spending_averages tool
  server.registerTool(
    "get_spending_averages",
    {
      description: "Fetch the user's average spending over time (e.g. average daily, monthly, or yearly spend).",
      inputSchema: z.object({
        type: z.enum(["day", "month", "year"]).describe("The interval to calculate averages for"),
        fromDate: z.string().optional().describe("Start date"),
        toDate: z.string().optional().describe("End date"),
      }),
    },
    async (args) => {
      const output = await getSpendingAverages(token, args.type, args.fromDate, args.toDate);
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
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
  console.log("[MCP Tool] Incoming headers:", JSON.stringify(req.headers));
  console.log("[MCP Tool] Incoming query:", JSON.stringify(req.query));
  console.log("[MCP Tool] Incoming cookies:", req.headers.cookie);
  
  // Extract token from query parameters or cookies because mcpize.run strips custom headers
  const cookieMatch = req.headers.cookie?.match(/xpense_token=([^;]+)/);
  const cookieToken = cookieMatch ? cookieMatch[1] : "";
  const token = (req.query.token as string) || cookieToken || "";

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
