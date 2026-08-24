import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heroOopSpotFixture } from "../test/fixtures.js";
import { PokerTable } from "./PokerTable.js";

describe("PokerTable positions", () => {
  it("puts the dealer button on BTN and makes hero BB/OOP first to act", () => {
    render(<PokerTable spot={heroOopSpotFixture} state={heroOopSpotFixture.decision} />);

    const opponent = screen.getByRole("group", { name: "Opponent · BTN · IP, dealer" });
    const hero = screen.getByRole("group", { name: "You · BB · OOP" });
    expect.soft(within(opponent).getByLabelText("Dealer button")).toBeVisible();
    expect.soft(within(hero).queryByLabelText("Dealer button")).not.toBeInTheDocument();
    expect.soft(within(opponent).getByText("BTN · IP")).toBeVisible();
    expect.soft(within(hero).getByText("BB · OOP")).toBeVisible();
    expect.soft(document.querySelector(".table-meta")).not.toBeInTheDocument();
    expect.soft(screen.queryByText("In position")).not.toBeInTheDocument();
    expect.soft(screen.queryByText("Out of position")).not.toBeInTheDocument();
  });
});
