import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { publicSpotFixture } from "../test/fixtures.js";
import { HandSelectionModal } from "./HandSelectionModal.js";

describe("HandSelectionModal", () => {
  it("offers only unblocked API-provided exact combos and saves a complete allocation", () => {
    // Arrange
    const onSave = vi.fn();
    render(<HandSelectionModal open selectable={publicSpotFixture.selectableCombos} selected={["AhAs"]} featuredCombo="AhAs" blockedCards={new Set(["Ac"])} actions={publicSpotFixture.legalActions} allocations={{}} onClose={vi.fn()} onSave={onSave} />);

    // Act
    fireEvent.click(screen.getByRole("gridcell", { name: "AA" }));

    // Assert
    expect(screen.queryByRole("button", { name: "AcAd" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /A♥ A♠ · featured/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A♦ A♠" })).toBeEnabled();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "A♦ A♠" }));
    fireEvent.click(screen.getByRole("button", { name: "Save A♦ A♠" }));

    // Assert
    expect(onSave).toHaveBeenCalledWith("AdAs", { a0: 3333, a1: 3333, a2: 3334 });
  });

  it("opens an existing exact combo directly in edit mode", () => {
    render(<HandSelectionModal open selectable={publicSpotFixture.selectableCombos} selected={["AhAs", "AdAs"]} featuredCombo="AhAs" blockedCards={new Set()} actions={publicSpotFixture.legalActions} allocations={{ AdAs: { a0: 1000, a1: 9000, a2: 0 } }} editingCombo="AdAs" onClose={vi.fn()} onSave={vi.fn()} />);
    expect.soft(screen.getByRole("heading", { name: "Edit A♦ A♠" })).toBeVisible();
    expect.soft(screen.getByLabelText("Check percentage")).toHaveValue("10");
    expect.soft(screen.getByLabelText("Bet 25 bb percentage")).toHaveValue("90");
  });
});
