/**
 * Business logic tool functions that communicate with the NestJS API.
 * Each function is registered as an MCP tool in index.ts.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001/api";

// General-purpose helper function to fetch data from the NestJS backend
async function apiRequest(path: string, token: string): Promise<any> {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

// 1. Fetch authenticated user profile info
export async function getProfile(token: string) {
  return apiRequest("/users/profile", token);
}

// 2. Fetch list of expenses
export async function getExpenses(token: string) {
  return apiRequest("/expenses", token);
}

// 3. Fetch list of incomes
export async function getIncome(token: string) {
  return apiRequest("/income", token);
}

// 4. Fetch user assets
export async function getAssets(token: string) {
  return apiRequest("/assets", token);
}

// 5. Fetch user loans
export async function getLoans(token: string) {
  return apiRequest("/loans", token);
}

// 6. Fetch user borrowings
export async function getBorrowings(token: string) {
  return apiRequest("/borrowings", token);
}

// 7. Fetch financial summary (Analytics)
export async function getSummary(token: string) {
  return apiRequest("/analytics/summary", token);
}
