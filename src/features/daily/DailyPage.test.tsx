import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../../api/client.js";
import { DailyPage } from "./DailyPage.js";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><DailyPage /></MemoryRouter></QueryClientProvider>);
}

describe("DailyPage empty publication state", () => {
  afterEach(() => vi.restoreAllMocks());

  it("explains that a real imported spot is required when the database is empty", async () => {
    // Arrange
    vi.spyOn(api, "today").mockRejectedValue(new ApiError(404, "daily game is not available", "SPOT_NOT_AVAILABLE"));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByRole("heading", { name: "No published spots yet" })).toBeVisible();
    expect(screen.getByText(/real Solver spot is imported, approved, scheduled, and published/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
