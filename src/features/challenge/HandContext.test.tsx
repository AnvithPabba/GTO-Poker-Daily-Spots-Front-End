import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heroOopSpotFixture, publicSpotFixture } from "../../test/fixtures.js";
import { HandContext } from "./HandContext.js";

describe("HandContext", () => {
  it("renders one compact, data-driven story and the immediate range trigger", () => {
    render(<HandContext spot={heroOopSpotFixture} />);
    expect(screen.getByRole("region", { name: "Hand context" })).toBeVisible();
    expect.soft(screen.getByRole("heading", { name: "Hand history" })).toBeVisible();
    expect.soft(screen.getByText("Opponent (BTN) opens to 2.5 bb → You call from the BB", { exact: true })).toBeVisible();
    expect.soft(screen.getByText("Q♠ J♥ 2♥", { exact: true })).toBeVisible();
    expect.soft(screen.getByText("You act first", { exact: true })).toBeVisible();
    expect.soft(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "View starting ranges" })).toBeVisible();
  });

  it("opens a focusable full-screen range dialog and restores the trigger focus", () => {
    render(<HandContext spot={heroOopSpotFixture} />);
    const trigger = screen.getByRole("button", { name: "View starting ranges" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Starting ranges" })).toBeVisible();
    expect(screen.getByRole("grid", { name: "You · BB · OOP starting range" })).toBeVisible();
    expect(screen.getByRole("grid", { name: "Opponent · BTN · IP starting range" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Starting ranges" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Starting ranges" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not invent a preflop range when context is unknown", () => {
    const spot = { ...publicSpotFixture, preflop: { status: "unknown", label: "Preflop start unavailable", summary: "Legacy context was not preserved." } as const };
    render(<HandContext spot={spot} />);
    expect(screen.getByText("Starting action unavailable", { exact: true })).toBeVisible();
    expect(screen.getByText("Preflop details were not saved for this spot.", { exact: true })).toBeVisible();
    expect(screen.queryByRole("button", { name: "View starting ranges" })).not.toBeInTheDocument();
  });
});
