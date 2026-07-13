import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile, getExpenses } from "../src/tools.js";

describe("xpense tools", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getProfile calls fetch with correct URL and returns profile on success", async () => {
    const mockProfile = { id: "user-123", name: "Test User", email: "test@example.com" };
    
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    });
    global.fetch = fetchMock;

    const result = await getProfile("test-token");
    
    expect(result).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5001/api/users/profile",
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token",
        },
      })
    );
  });

  it("getExpenses throws an error when NestJS API returns an error status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials or expired token" }),
    });
    global.fetch = fetchMock;

    await expect(getExpenses("invalid-token")).rejects.toThrow(
      "Invalid credentials or expired token"
    );
  });
});
