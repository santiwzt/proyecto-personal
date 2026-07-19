-- ============================================================================
-- 0012_monthly_budget.sql
-- Adds an optional monthly spending budget (in ARS, the app's default
-- currency) to user_preferences. Mirrors UserPreferences.monthlyBudgetArs
-- in domain.ts.
-- ============================================================================

alter table user_preferences
  add column if not exists monthly_budget_ars numeric check (monthly_budget_ars is null or monthly_budget_ars >= 0);
