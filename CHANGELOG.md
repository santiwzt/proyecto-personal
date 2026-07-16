# Changelog

All notable changes to this project are documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — MVP

### Added

- Project scaffold: Next.js 16 (App Router), React 19, TypeScript strict,
  Tailwind CSS v4, ESLint, Prettier, Vitest, Playwright.
- Domain model (`src/types/domain.ts`) covering every MVP entity plus
  habits/training/expenses/goals for future phases.
- Demo mode: in-memory data store with per-user isolation, seeded with
  realistic example data (Fisica/Matematica subjects, an upcoming exam
  with a deliberately weak topic, overdue and pending tasks, a project, a
  scheduling conflict).
- Supabase migrations (28 tables, RLS on every table, `pgvector` + full
  text search on `file_chunks`), hand-written database types, and
  browser/server/admin Supabase clients.
- Authentication: demo session cookie flow; Supabase Auth scaffolding for
  when a real project is connected.
- Onboarding flow.
- "Hoy" dashboard: next commitment, important tasks, upcoming exams with
  an explainable readiness score, recommended study time, daily progress,
  detected conflicts, recent activity.
- Subjects/topics/exams module with per-topic practice (question
  generation + graded answers, hint-before-solution flow) and an
  explainable exam-readiness calculation.
- Agenda module: events, weekly availability rules, deterministic
  conflict detection (overlaps, out-of-availability, overdue items,
  missing study sessions, missing breaks, daily overload).
- Weekly planner: deterministic scheduling engine with an explicit
  approve/reject flow — never writes to the real calendar without user
  approval.
- Projects module with a persistently visible "next step."
- Quick capture: rule-based Spanish natural-language parser for
  tasks/exams/events/ideas/expenses, always requiring confirmation before
  saving.
- Files module: real MIME sniffing, content-hash dedup, text extraction
  (PDF/DOCX/TXT/Markdown) with honest handling of scanned PDFs.
- AI assistant: streaming chat with source citations, scoped to
  user-authorized subjects/files; full-text retrieval fallback and a
  provider abstraction ready for real embeddings.
- Question generation and answer grading, each with a real (non-AI)
  heuristic fallback alongside the AI-assisted path.
- Expenses (lightweight) and Settings pages; Habits/Training pages
  intentionally minimal for this version.
- 71 automated tests (unit + integration) plus an end-to-end Playwright
  test covering the full golden path.
- GitHub Actions CI (lint, typecheck, unit tests, build, e2e).
- Documentation: README, ARCHITECTURE, ROADMAP, SECURITY, CONTRIBUTING,
  and six architecture decision records under `docs/decisions/`.
