import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { publicSpotFixture } from "../test/fixtures.js";
import { PreflopPanel } from "./PreflopPanel.js";

describe("PreflopPanel", () => {
  it("shows the scenario story before revealing sparse starting-range assumptions", () => {
    // Arrange
    render(<PreflopPanel spot={publicSpotFixture} />);

    // Assert
    expect.soft(screen.getByRole("heading", { name: "BTN opens, BB calls" })).toBeVisible();
    expect.soft(screen.getByText("BTN opens to 2.5 bb")).toBeVisible();
    expect(screen.queryByRole("grid", { name: "BTN · IP starting range" })).not.toBeInTheDocument();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "View starting-range assumptions" }));

    // Assert
    expect.soft(screen.getByRole("grid", { name: "BTN · IP starting range" })).toBeVisible();
    expect.soft(screen.getByRole("gridcell", { name: "AA, 100%" })).toBeDisabled();
    expect.soft(screen.getByRole("gridcell", { name: "A5s, 50%" })).toBeDisabled();
  });

  it("labels unknown legacy context honestly instead of inventing a story", () => {
    const legacy = { ...publicSpotFixture, preflop: { status: "unknown", label: "Preflop start unavailable", summary: "Legacy context was not preserved." } as const };
    render(<PreflopPanel spot={legacy} />);
    expect.soft(screen.getByRole("heading", { name: "Preflop start unavailable" })).toBeVisible();
    expect.soft(screen.getByText(/No story has been guessed/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /starting-range/ })).not.toBeInTheDocument();
  });
});
