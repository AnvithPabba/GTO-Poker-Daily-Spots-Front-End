import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RangeGrid } from "./RangeGrid.js";

describe("RangeGrid", () => {
  it("opens concrete combinations instead of selecting an entire aggregate cell", () => {
    const onToggle = vi.fn();
    render(
      <RangeGrid
        featuredCombo="AhAs"
        selectable={[{ combo: "AhAs", category: "pair" }, { combo: "AcAd", category: "pair" }]}
        selected={["AhAs"]}
        blocked={new Set()}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /AA, 2 selectable combinations/ }));
    expect.soft(screen.getByRole("region", { name: "AA concrete combinations" })).toBeInTheDocument();
    expect.soft(screen.getAllByRole("button", { name: "A♥ A♠ · featured" }).every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "A♣ A♦" }));
    expect(onToggle).toHaveBeenCalledWith("AcAd");
  });
});
