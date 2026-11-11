import { afterEach, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AppointmentCalendar, calendarDays, shopToday, validDate } from "../src/appointment-calendar";

let root: Root | undefined;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { if (root) act(() => root?.unmount()); root = undefined; document.body.innerHTML = ""; vi.useRealTimers(); });

it("keeps calendar dates aligned through leap years and six-week months", () => {
  const leap = calendarDays("2028-02");
  expect(leap).toContain("2028-02-29");
  expect(leap[0]).toBe("2028-01-30");
  expect(calendarDays("2026-08")).toHaveLength(42);
  expect(validDate("2026-02-30")).toBe(false);
  expect(validDate("2028-02-29")).toBe(true);
  expect(validDate("not a date")).toBe(false);
  expect(shopToday(new Date("2026-11-11T02:00:00Z"))).toBe("2026-11-10");
});

it("shows six appointments, expands overflow, opens details, and preserves undated requests", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T16:00:00Z"));
  const rows = Array.from({ length: 8 }, (_, index) => ({
    _id: String(index), name: `Customer ${index}`, vehicle: "Test vehicle", service: "Brakes", status: "new",
    preferredDate: "2026-11-10", preferredTime: index < 2 ? "afternoon" : "morning",
  }));
  const undated = { ...rows[0], _id: "undated", name: "Undated customer", preferredDate: "" };
  const open = vi.fn();
  const host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  act(() => root!.render(<AppointmentCalendar rows={[...rows, undated]} onOpen={open} />));
  const day = host.querySelector('[aria-label="Tuesday, November 10, 2026"]')!;
  expect(day.querySelectorAll(".calendar-appointment")).toHaveLength(6);
  expect(day.querySelector(".calendar-time")?.textContent).toBe("morning");
  expect(host.querySelector(".calendar-undated")?.textContent).toContain("Undated customer");
  act(() => day.querySelector<HTMLButtonElement>(".calendar-more")!.click());
  expect(day.querySelectorAll(".calendar-appointment")).toHaveLength(8);
  act(() => day.querySelector<HTMLButtonElement>(".calendar-appointment")!.click());
  expect(open).toHaveBeenCalledWith(rows[2]);
  act(() => day.querySelector<HTMLButtonElement>(".calendar-more")!.click());
  expect(day.querySelectorAll(".calendar-appointment")).toHaveLength(6);
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click());
  expect(host.querySelector("h3")?.textContent).toBe("December 2026");
  expect(host.querySelector(".calendar-toolbar p")?.textContent).toBe("0 matching appointments this month");
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click());
  expect(host.querySelector("h3")?.textContent).toBe("January 2027");
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')!.click());
  expect(host.querySelector("h3")?.textContent).toBe("December 2026");
  act(() => Array.from(host.querySelectorAll("button")).find(b => b.textContent === "Today")!.click());
  expect(host.querySelector("h3")?.textContent).toBe("November 2026");
  act(() => root!.render(<AppointmentCalendar rows={[]} onOpen={open} />));
  expect(host.querySelectorAll(".calendar-appointment")).toHaveLength(0);
  expect(host.querySelector(".calendar-toolbar p")?.textContent).toBe("0 matching appointments this month");
});
