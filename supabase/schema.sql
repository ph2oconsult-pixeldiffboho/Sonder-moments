-- ═══════════════════════════════════════════════════════════
-- Sonder — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════

-- Enums
CREATE TYPE plan_type AS ENUM ('sprout', 'grove', 'forest');
CREATE TYPE age_band AS ENUM ('5-6', '7-8', '9-10', '11-13', '14-16');
CREATE TYPE track_type AS ENUM ('wonder', 'beneath');
CREATE TYPE lesson_status AS ENUM ('not_started', 'in_progress', 'complete');
CREATE TYPE entry_type AS ENUM ('journal', 'milestone', 'badge', 'manual');
CREATE TYPE pace_setting AS ENUM ('daily', '3x_week', 'weekly', 'own_pace');
CREATE TYPE journey_style AS ENUM ('guided', 'free', 'mix');

-- Users (parents)
CREATE TABLE users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  name                   TEXT NOT NULL,
  plan                   plan_type NOT NULL DEFAULT 'sprout',
  plan_expires_at        TIMESTAMPTZ,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT,
  expo_push_token        TEXT,
  pace_setting           pace_setting NOT NULL DEFAULT '3x_week',
  journey_style          journey_style NOT NULL DEFAULT 'guided',
  pd_level               TEXT,
  notification_time      TIME DEFAULT '19:30:00',
  notif_daily_reminder   BOOLEAN DEFAULT true,
  notif_milestones       BOOLEAN DEFAULT true,
  notif_workshop         BOOLEAN DEFAULT false,
  notif_weekly_summary   BOOLEAN DEFAULT true,
  last_active_at         TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child profiles
CREATE TABLE child_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  age_band            age_band NOT NULL,
  track               track_type NOT NULL GENERATED ALWAYS AS (
                        CASE WHEN age_band IN ('5-6','7-8','9-10')
                          THEN 'wonder'::track_type ELSE 'beneath'::track_type END
                      ) STORED,
  sage_enabled        BOOLEAN DEFAULT true,
  sage_parent_visible BOOLEAN DEFAULT true,
  sage_topic_alerts   BOOLEAN DEFAULT true,
  expo_push_token     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worlds
CREATE TABLE worlds (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  core_question TEXT,
  colour        TEXT,
  sort_order    INTEGER NOT NULL
);

-- Lessons
CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id      INTEGER NOT NULL REFERENCES worlds(id),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  age_band      age_band NOT NULL,
  track         track_type NOT NULL DEFAULT 'wonder',
  duration_mins INTEGER NOT NULL DEFAULT 10,
  lesson_number INTEGER NOT NULL,
  is_sensitive  BOOLEAN DEFAULT false,
  is_guided     BOOLEAN DEFAULT false,
  parent_guide  TEXT,
  sort_order    INTEGER NOT NULL,
  story         JSONB,
  explore       JSONB,
  activities    JSONB,
  journal       JSONB,
  quiz          JSONB,
  parallel      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson progress
CREATE TABLE lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id),
  status       lesson_status NOT NULL DEFAULT 'not_started',
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, lesson_id)
);

-- Book entries
CREATE TABLE book_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id   UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  entry_type entry_type NOT NULL,
  title      TEXT NOT NULL,
  quote      TEXT,
  body       TEXT,
  lesson_id  UUID REFERENCES lessons(id),
  badge_key  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id  UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, badge_key)
);

-- Family values
CREATE TABLE family_values (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('parent', 'child')),
  owner_id    UUID NOT NULL,
  value_text  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, owner_id, value_text)
);

-- Sage sessions
CREATE TABLE sage_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  lesson_id   UUID REFERENCES lessons(id),
  messages    JSONB NOT NULL DEFAULT '[]',
  flagged     BOOLEAN DEFAULT false,
  flag_reason TEXT,
  parent_read BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,
  read       BOOLEAN DEFAULT false,
  sent_push  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity packs
CREATE TABLE activity_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id),
  child_name   TEXT,
  includes     JSONB,
  file_url     TEXT,
  generated_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_child_profiles_parent ON child_profiles(parent_id);
CREATE INDEX idx_lessons_world ON lessons(world_id);
CREATE INDEX idx_lessons_track ON lessons(track);
CREATE INDEX idx_progress_child ON lesson_progress(child_id);
CREATE INDEX idx_book_family ON book_entries(family_id, created_at DESC);
CREATE INDEX idx_badges_child ON badges(child_id);
CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_sage_child ON sage_sessions(child_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON child_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON book_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sage_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed worlds
INSERT INTO worlds (slug, name, description, core_question, colour, sort_order) VALUES
  ('emotions',    'Emotions & self-awareness',  'Understanding, naming, and befriending your inner weather',        'What am I feeling, and what is it telling me?',        '#C8A04A', 1),
  ('mindfulness', 'Mindfulness & gratitude',     'Presence, stillness, and the art of noticing what is good',       'How do I become present to my own life?',              '#534AB7', 2),
  ('growth',      'Growth mindset & resilience', 'The power of yet, learning from failure, and bouncing forward',    'What can I become if I stay curious and keep trying?', '#3C6E5A', 3),
  ('values',      'Values & character',          'Who you are when no one is watching',                              'Who am I when no one is watching?',                    '#2A1F4A', 4),
  ('empathy',     'Relationships & empathy',      'Seeing others fully — connection, conflict, true belonging',       'How do I truly see another person?',                   '#7A6A9A', 5),
  ('purpose',     'Purpose & goal-setting',       'Dreaming big, planning small, discovering what lights you up',     'What lights me up, and how do I move toward it?',      '#D85A30', 6);
