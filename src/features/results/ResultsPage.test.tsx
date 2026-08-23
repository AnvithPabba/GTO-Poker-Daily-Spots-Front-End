import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attemptFixture, publicSpotFixture } from "../../test/fixtures.js";
import { ResultsPage } from "./ResultsPage.js";

afterEach(() => vi.unstubAllGlobals());

describe("ResultsPage", () => {
  it("loads a refreshable attempt result and drills from a scored class into exact combos", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("/attempts/") ? attemptFixture : publicSpotFixture;
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/results/fixture-attempt"]}><Routes><Route path="/results/:attemptId" element={<ResultsPage />} /></Routes></MemoryRouter></QueryClientProvider>);

    // Assert
    expect.soft(await screen.findByText("Official result")).toBeVisible();
    expect.soft(screen.getByRole("heading", { name: /875/ })).toBeVisible();
    expect.soft(screen.getByText("87.50% strategy similarity")).toBeVisible();
    expect.soft(await screen.findByText("GTO majority: Bet 25 bb")).toBeVisible();

    // Act
    fireEvent.click(screen.getByRole("gridcell", { name: "AA, 88%" }));

    // Assert
    expect.soft(screen.getByRole("heading", { name: "AA" })).toBeVisible();
    expect.soft(screen.getByText("A♥ A♠")).toBeVisible();
    expect(screen.getByRole("link", { name: "Daily summary" })).toHaveAttribute("href", "/daily");
  });
});
