-- ============================================================================
-- 0013_school_calendar_ics_url.sql
-- Adds an optional external .ics calendar feed URL (e.g. a school's virtual
-- campus calendar) to user_preferences. Mirrors
-- UserPreferences.schoolCalendarIcsUrl in domain.ts. Fetched read-only and
-- merged into Agenda -- never written back to.
-- ============================================================================

alter table user_preferences
  add column if not exists school_calendar_ics_url text;
