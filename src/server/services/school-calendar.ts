import ical, { type CalendarResponse, type VEvent } from "node-ical";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TIME_ZONE } from "@/lib/dates";

export interface SchoolCalendarEvent {
  uid: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isFullDay: boolean;
}

/** Parses raw .ics text into node-ical's component map. Throws if the text isn't valid iCalendar data. */
export function parseIcsCalendar(icsText: string): CalendarResponse {
  return ical.sync.parseICS(icsText);
}

function summaryText(summary: VEvent["summary"]): string {
  if (!summary) return "Evento del colegio";
  return typeof summary === "string" ? summary : (summary.val ?? "Evento del colegio");
}

function descriptionText(description: VEvent["description"]): string | null {
  if (!description) return null;
  const text = typeof description === "string" ? description : description.val;
  return text && text.trim().length > 0 ? text.trim() : null;
}

/** Y/M/D read back with the same local interpretation used to construct the Date, so it's correct regardless of the server process's timezone. */
function fullDayDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Expands every VEVENT (recurring or not) within [rangeStart, rangeEnd] into
 * flat instances, in the app's ISO-with-Buenos-Aires-offset convention so
 * they slot into the same day-bucketing the rest of Agenda already uses.
 *
 * The query window handed to node-ical is padded a day on each side: for a
 * single (non-recurring) full-day event, its range check compares the raw
 * UTC-midnight instant node-ical normalizes all-day dates to against
 * rangeStart/rangeEnd directly, so an offset like Buenos Aires' -03:00 can
 * exclude a real match right at the boundary. We pad the query, then
 * re-filter ourselves using the timezone-correct value we actually compute.
 */
export function expandSchoolCalendarEvents(
  calendar: CalendarResponse,
  rangeStart: Date,
  rangeEnd: Date,
): SchoolCalendarEvent[] {
  const queryFrom = new Date(rangeStart.getTime() - ONE_DAY_MS);
  const queryTo = new Date(rangeEnd.getTime() + ONE_DAY_MS);
  const rangeStartDay = formatInTimeZone(rangeStart, APP_TIME_ZONE, "yyyy-MM-dd");
  const rangeEndDay = formatInTimeZone(rangeEnd, APP_TIME_ZONE, "yyyy-MM-dd");

  const events: SchoolCalendarEvent[] = [];

  for (const component of Object.values(calendar)) {
    if (!component || typeof component !== "object" || component.type !== "VEVENT") continue;
    const vevent = component;
    const instances = ical.expandRecurringEvent(vevent, { from: queryFrom, to: queryTo });

    const description = descriptionText(vevent.description);

    for (const instance of instances) {
      if (instance.isFullDay) {
        const dateStr = fullDayDateStr(instance.start);
        if (dateStr < rangeStartDay || dateStr > rangeEndDay) continue;
        events.push({
          uid: vevent.uid,
          title: summaryText(instance.summary),
          description,
          startsAt: `${dateStr}T00:00:00-03:00`,
          endsAt: `${dateStr}T23:59:59-03:00`,
          isFullDay: true,
        });
        continue;
      }
      if (instance.start < rangeStart || instance.start > rangeEnd) continue;
      events.push({
        uid: vevent.uid,
        title: summaryText(instance.summary),
        description,
        startsAt: formatInTimeZone(instance.start, APP_TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        endsAt: formatInTimeZone(instance.end, APP_TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        isFullDay: false,
      });
    }
  }

  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
