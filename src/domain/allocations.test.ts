import { describe, expect, it } from "vitest";
import { allocationTotal, equalAllocation, isValidAllocation, updateAllocation } from "./allocations.js";

describe("basis-point allocation", () => {
  it.each([[1, [10000]], [2, [5000, 5000]], [3, [3333, 3333, 3334]], [4, [2500, 2500, 2500, 2500]]])("equalizes %i actions to 10000", (count, expected) => {
    const result = equalAllocation(Array.from({ length: count }, (_, index) => `a${index}`));
    expect(Object.values(result)).toEqual(expected);
    expect(allocationTotal(result)).toBe(10000);
  });

  it("accepts exactly one integer value for every legal action", () => {
    const allocation = { a0: 729, a1: 9271 };
    expect.soft(isValidAllocation(allocation, ["a0", "a1"])).toBe(true);
    expect.soft(isValidAllocation({ a0: 729 }, ["a0", "a1"])).toBe(false);
    expect.soft(isValidAllocation({ a0: 729, a1: 9272 }, ["a0", "a1"])).toBe(false);
  });

  it("rounds percentage input to basis points and clamps unsafe input", () => {
    expect(updateAllocation({ a0: 0 }, "a0", 7.29)).toEqual({ a0: 729 });
    expect(updateAllocation({ a0: 0 }, "a0", 500)).toEqual({ a0: 10000 });
    expect(updateAllocation({ a0: 0 }, "a0", -2)).toEqual({ a0: 0 });
  });
});
