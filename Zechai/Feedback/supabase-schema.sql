-- ============================================================
-- ZECHAI Cafe Feedback System — Supabase Schema (v2)
-- Run ALL of this in the Supabase SQL Editor
-- ============================================================

-- ── Existing tables (skip if already created) ─────────────────
CREATE TABLE IF NOT EXISTS customer_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  stars       smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  feedback_msg text,
  item_ordered text NOT NULL,
  suggestion  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  day_stars   smallint NOT NULL CHECK (day_stars BETWEEN 1 AND 5),
  complaints  text,
  suggestions text,
  feedback    text,
  others      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── NEW: Staff daily marks (admin assigned) ───────────────────
CREATE TABLE IF NOT EXISTS staff_marks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name  text NOT NULL,
  staff_phone text,
  mark        smallint NOT NULL CHECK (mark BETWEEN 0 AND 10),
  admin_note  text,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── NEW: Monthly best staff achievements ──────────────────────
CREATE TABLE IF NOT EXISTS staff_achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name  text NOT NULL,
  staff_phone text,
  month       smallint NOT NULL,
  year        int NOT NULL,
  title       text NOT NULL DEFAULT 'Best Staff of the Month',
  awarded_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE customer_feedback  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_marks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_achievements  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public insert" ON customer_feedback;
DROP POLICY IF EXISTS "Allow public insert" ON staff_reports;
DROP POLICY IF EXISTS "Allow public insert" ON staff_marks;
DROP POLICY IF EXISTS "Allow public insert" ON staff_achievements;
DROP POLICY IF EXISTS "Allow public select" ON customer_feedback;
DROP POLICY IF EXISTS "Allow public select" ON staff_reports;
DROP POLICY IF EXISTS "Allow public select" ON staff_marks;
DROP POLICY IF EXISTS "Allow public select" ON staff_achievements;

-- INSERT policies (anyone with anon key can submit)
CREATE POLICY "Allow public insert" ON customer_feedback  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON staff_reports       FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON staff_marks         FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON staff_achievements  FOR INSERT WITH CHECK (true);

-- SELECT policies (admin panel reads data)
CREATE POLICY "Allow public select" ON customer_feedback  FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON staff_reports       FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON staff_marks         FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON staff_achievements  FOR SELECT USING (true);
