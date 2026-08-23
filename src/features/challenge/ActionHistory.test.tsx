import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { publicSpotFixture } from "../../test/fixtures.js";
import { initialPlayback, reducePlayback } from "../../domain/playback.js";
import { ActionHistory } from "./ActionHistory.js";

describe("ActionHistory", () => {
  it("shows preflop context before replay while locking postflop details", () => {
    // Arrange
    render(<ActionHistory spot={publicSpotFixture} playback={initialPlayback()} onPlayback={vi.fn()} />);

    // Assert
    expect.soft(screen.getByRole("heading", { name: "Action history" })).toBeVisible();
    expect.soft(screen.getByText("BTN opens to 2.5 bb")).toBeVisible();
    expect.soft(screen.getByText("BB calls")).toBeVisible();
    expect.soft(screen.getAllByText("Locked until replay")).toHaveLength(publicSpotFixture.history.length);
    expect(screen.queryByText("Decision · OOP to act")).not.toBeInTheDocument();
    expect(screen.getByText(`0/${publicSpotFixture.history.length} replayed`)).toBeVisible();
  });

  it("reveals the replay event and keeps the counter limited to replayable history", () => {
    // Arrange
    const playback = reducePlayback(initialPlayback(), { type: "skip" }, publicSpotFixture.history);

    // Act
    render(<ActionHistory spot={publicSpotFixture} playback={playback} onPlayback={vi.fn()} />);

    // Assert
    expect.soft(screen.getByText("Decision · BTN to act")).toBeVisible();
    expect.soft(screen.getByText(`${publicSpotFixture.history.length}/${publicSpotFixture.history.length} replayed`)).toBeVisible();
    expect(screen.queryByText("Locked until replay")).not.toBeInTheDocument();
    expect(screen.getByText("BB CHECK")).toBeVisible();
  });

  it("uses one control row for playback without inventing event labels", () => {
    // Arrange
    const onPlayback = vi.fn();
    const view = render(<ActionHistory spot={publicSpotFixture} playback={initialPlayback()} onPlayback={onPlayback} />);

    // Act / Assert
    fireEvent.click(screen.getByRole("button", { name: /^Play$/ }));
    expect(onPlayback).toHaveBeenLastCalledWith({ type: "start" });

    const started = reducePlayback(initialPlayback(), { type: "start" }, publicSpotFixture.history);
    view.rerender(<ActionHistory spot={publicSpotFixture} playback={started} onPlayback={onPlayback} />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next action" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Replay" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Sound off" }));
    expect(onPlayback).toHaveBeenLastCalledWith({ type: "toggle_sound" });
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onPlayback).toHaveBeenLastCalledWith({ type: "skip" });
  });

  it("keeps range assumptions behind one compact disclosure", () => {
    // Arrange
    render(<ActionHistory spot={publicSpotFixture} playback={initialPlayback()} onPlayback={vi.fn()} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "View starting-range assumptions" }));

    // Assert
    expect.soft(screen.getByRole("grid", { name: "BTN · IP starting range" })).toBeVisible();
    expect.soft(screen.getByText("2bet_ip")).toBeVisible();
    expect(screen.getByRole("grid", { name: "BB · OOP starting range" })).toBeVisible();
  });
});
