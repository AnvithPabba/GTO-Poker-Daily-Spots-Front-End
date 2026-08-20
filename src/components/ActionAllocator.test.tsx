import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionAllocator } from "./ActionAllocator.js";

describe("ActionAllocator", () => {
  it("renders dynamic legal actions and emits basis points", async () => {
    const onChange = vi.fn();
    render(<ActionAllocator actions={[{ id: "a0", type: "check", isAllIn: false, displayLabel: "Check" }, { id: "a1", type: "bet", amount: 30, isAllIn: false, displayLabel: "Bet 30" }]} value={{ a0: 5000, a1: 5000 }} onChange={onChange} />);
    expect.soft(screen.getByLabelText("Check percentage")).toBeInTheDocument();
    expect.soft(screen.getByLabelText("Bet 30 percentage")).toBeInTheDocument();
    const input = screen.getByLabelText("Check percentage");
    fireEvent.change(input, { target: { value: "25" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ a0: 2500 }));
  });
});
