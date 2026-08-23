import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { publicSpotFixture } from "../test/fixtures.js";
import { PreflopPanel } from "./PreflopPanel.js";

describe("PreflopPanel compatibility wrapper", () => {
  it("uses the same static context presentation as the challenge", () => {
    render(<PreflopPanel spot={publicSpotFixture} />);
    expect(screen.getByRole("region", { name: "Hand context" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View starting ranges" })).toBeVisible();
  });
});
