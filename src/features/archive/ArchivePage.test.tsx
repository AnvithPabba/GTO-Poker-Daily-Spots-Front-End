import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { ArchivePage } from "./ArchivePage.js";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><ArchivePage /></MemoryRouter></QueryClientProvider>);
}

describe("ArchivePage empty publication state", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows an explicit empty state when the database returns no published games", async () => {
    // Arrange
    vi.spyOn(api, "dailyGames").mockResolvedValue({ from: "2026-08-01", to: "2026-08-31", games: [] });

    // Act
    renderPage();

    // Assert
    expect(await screen.findByRole("heading", { name: "No published games yet" })).toBeVisible();
    expect(screen.getByText(/No solver files are read by this browser/)).toBeVisible();
  });
});
