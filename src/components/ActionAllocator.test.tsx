import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ActionAllocator } from "./ActionAllocator.js";

describe("ActionAllocator", () => {
  it("renders dynamic legal actions and emits basis points", async () => {
    const onChange = vi.fn();
    render(<ActionAllocator actions={[{ id: "a0", type: "check", isAllIn: false, displayLabel: "Check" }, { id: "a1", type: "bet", amount: 30, isAllIn: false, displayLabel: "Bet 30" }]} value={{ a0: 5000, a1: 5000 }} onChange={onChange} />);
    expect.soft(screen.getByLabelText("Check percentage")).toBeInTheDocument();
    expect.soft(screen.getByLabelText("Bet 30 percentage")).toBeInTheDocument();
    expect(screen.queryByText("50.00%", { exact: true })).not.toBeInTheDocument();
    const input = screen.getByLabelText("Check percentage");
    fireEvent.change(input, { target: { value: "25" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ a0: 2500 }));
  });

  it("preserves intermediate decimal typing and commits an empty field as zero", () => {
    function Harness() {
      const [value, setValue] = useState<Record<string, number>>({ a0: 5000, a1: 5000 });
      return <ActionAllocator actions={[{ id: "a0", type: "check", isAllIn: false, displayLabel: "Check" }, { id: "a1", type: "bet", amount: 30, isAllIn: false, displayLabel: "Bet 30" }]} value={value} onChange={setValue} />;
    }
    render(<Harness />);
    const check = screen.getByLabelText("Check percentage");

    fireEvent.focus(check);
    fireEvent.change(check, { target: { value: "12." } });
    expect(check).toHaveValue("12.");
    fireEvent.change(check, { target: { value: "" } });
    expect(check).toHaveValue("");
    fireEvent.blur(check);

    expect(check).toHaveValue("0.00");
    expect(screen.getByRole("status")).toHaveTextContent("50.00%");
  });
});
