/**
 * Business logic tool functions that communicate with the NestJS API.
 * Each function is registered as an MCP tool in index.ts.
 */

const BACKEND_URL =
  process.env.BACKEND_URL || "https://xpense-backend-g1y5.onrender.com/api";

// General-purpose helper function to fetch data from the NestJS backend
async function apiRequest(path: string, token: string): Promise<any> {
  const url = `${BACKEND_URL}${path}`;
  console.log(`[MCP Tool] Fetching data from: ${url}`);
  console.log(`[MCP Tool] Token received: ${token ? `YES (${token.length} chars)` : "EMPTY"}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message || `HTTP error! status: ${response.status}`;
    console.error(`[MCP Tool] Error fetching from ${url}:`, message);
    throw new Error(message);
  }

  const data = await response.json();
  console.log(
    `[MCP Tool] Successfully fetched data from ${url}. Response size: ${JSON.stringify(data).length} characters`,
  );
  return data;
}

// 1. Fetch authenticated user profile info
export async function getProfile(token: string) {
  return apiRequest("/users/profile", token);
}

// 2. Fetch list of expenses
export async function getExpenses(
  token: string,
  limit = 10,
  category?: string,
  startDate?: string,
  endDate?: string,
) {
  let url = `/expenses?limit=${limit}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  return apiRequest(url, token);
}

// 3. Fetch list of incomes
export async function getIncome(
  token: string,
  limit = 10,
  source?: string,
  startDate?: string,
  endDate?: string,
) {
  let url = `/income?limit=${limit}`;
  if (source) url += `&source=${encodeURIComponent(source)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  return apiRequest(url, token);
}

// 4. Fetch user assets
export async function getAssets(token: string) {
  return apiRequest("/assets", token);
}

// 5. Fetch user loans
export async function getLoans(token: string) {
  return apiRequest("/loans?limit=10", token);
}

// 6. Fetch user borrowings
export async function getBorrowings(token: string) {
  return apiRequest("/borrowings?limit=10", token);
}

// 7. Fetch financial summary (Analytics)
export async function getSummary(token: string) {
  return apiRequest("/analytics/summary", token);
}

// 8. Fetch spending history / analytics
export async function getSpendingAnalytics(
  token: string,
  filterType: "day" | "month" | "year",
  fromDate?: string,
  toDate?: string,
) {
  let url = `/analytics/history?`;
  if (filterType === "day") {
    if (fromDate) url += `fromDay=${encodeURIComponent(fromDate)}&`;
    if (toDate) url += `toDay=${encodeURIComponent(toDate)}&`;
  } else if (filterType === "month") {
    if (fromDate) url += `fromMonth=${encodeURIComponent(fromDate)}&`;
    if (toDate) url += `toMonth=${encodeURIComponent(toDate)}&`;
  } else if (filterType === "year") {
    if (fromDate) url += `fromYear=${encodeURIComponent(fromDate)}&`;
    if (toDate) url += `toYear=${encodeURIComponent(toDate)}&`;
  }
  return apiRequest(url, token);
}

// 9. Fetch spending averages
export async function getSpendingAverages(
  token: string,
  type: "day" | "month" | "year",
  fromDate?: string,
  toDate?: string,
) {
  let url = `/analytics/averages?type=${encodeURIComponent(type)}`;
  if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
  if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
  return apiRequest(url, token);
}
