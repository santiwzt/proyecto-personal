import { describe, expect, it } from "vitest";
import { expandSchoolCalendarEvents, parseIcsCalendar } from "@/server/services/school-calendar";

const FIXTURE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//ES
BEGIN:VEVENT
UID:holiday-1@test
DTSTAMP:20260101T000000Z
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260902
SUMMARY:Feriado
END:VEVENT
BEGIN:VEVENT
UID:exam-1@test
DTSTAMP:20260101T000000Z
DTSTART:20260910T130000Z
DTEND:20260910T150000Z
SUMMARY:Evaluacion de TIC
DESCRIPTION:Trae calculadora y el capitulo 4 impreso.
END:VEVENT
BEGIN:VEVENT
UID:weekly-1@test
DTSTAMP:20260101T000000Z
DTSTART:20260706T130000Z
DTEND:20260706T140000Z
RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10
SUMMARY:Clase de TIC
END:VEVENT
END:VCALENDAR
`;

describe("school-calendar", () => {
  it("expands a full-day event using the Buenos Aires date, not shifted by timezone", () => {
    const calendar = parseIcsCalendar(FIXTURE_ICS);
    const events = expandSchoolCalendarEvents(
      calendar,
      new Date("2026-09-01T00:00:00-03:00"),
      new Date("2026-09-01T23:59:59-03:00"),
    );
    const holiday = events.find((e) => e.uid === "holiday-1@test");
    expect(holiday).toEqual({
      uid: "holiday-1@test",
      title: "Feriado",
      description: null,
      startsAt: "2026-09-01T00:00:00-03:00",
      endsAt: "2026-09-01T23:59:59-03:00",
      isFullDay: true,
    });
  });

  it("converts a timed event to the Buenos Aires offset", () => {
    const calendar = parseIcsCalendar(FIXTURE_ICS);
    const events = expandSchoolCalendarEvents(
      calendar,
      new Date("2026-09-10T00:00:00-03:00"),
      new Date("2026-09-10T23:59:59-03:00"),
    );
    const exam = events.find((e) => e.uid === "exam-1@test");
    expect(exam).toEqual({
      uid: "exam-1@test",
      title: "Evaluacion de TIC",
      description: "Trae calculadora y el capitulo 4 impreso.",
      startsAt: "2026-09-10T10:00:00-03:00",
      endsAt: "2026-09-10T12:00:00-03:00",
      isFullDay: false,
    });
  });

  it("expands a weekly recurring event into one instance per matching week in range", () => {
    const calendar = parseIcsCalendar(FIXTURE_ICS);
    const events = expandSchoolCalendarEvents(
      calendar,
      new Date("2026-07-01T00:00:00-03:00"),
      new Date("2026-07-31T23:59:59-03:00"),
    );
    const weekly = events.filter((e) => e.uid === "weekly-1@test");
    expect(weekly.map((e) => e.startsAt)).toEqual([
      "2026-07-06T10:00:00-03:00",
      "2026-07-13T10:00:00-03:00",
      "2026-07-20T10:00:00-03:00",
      "2026-07-27T10:00:00-03:00",
    ]);
    expect(weekly.every((e) => e.title === "Clase de TIC" && !e.isFullDay)).toBe(true);
  });

  it("returns nothing for a range with no events", () => {
    const calendar = parseIcsCalendar(FIXTURE_ICS);
    const events = expandSchoolCalendarEvents(
      calendar,
      new Date("2020-01-01T00:00:00-03:00"),
      new Date("2020-01-31T23:59:59-03:00"),
    );
    expect(events).toEqual([]);
  });
});
