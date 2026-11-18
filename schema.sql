-- ====================================================================
-- SKRIP STRUKTUR TABEL, HAK AKSES & HIGH-PERFORMANCE INDEXING SUPABASE
-- CYBERLAB CTF — NATIONAL INNOVATION EDITION (SMK TJKT KEJURUAN)
-- Mendukung: 5-Stage HOTS Investigation, Smart Assessment, KKTP, 
--            Pretest-Posttest N-Gain, Portofolio Forensik & Lomba Inovasi Nasional
-- Salin dan jalankan seluruh isi skrip ini di SQL Editor Supabase Anda
-- ====================================================================

-- 1. Tabel Siswa & Progres Pembelajaran
CREATE TABLE IF NOT EXISTS public.ctf_students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password_hash TEXT DEFAULT '',
  kelas TEXT DEFAULT 'TJKT',
  nisn TEXT DEFAULT '',
  solved INTEGER[] DEFAULT '{}',
  attempts INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  speed_bonus INTEGER DEFAULT 0,
  notes TEXT DEFAULT '', -- Catatan Evaluasi & Peningkatan Siswa dari Guru
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS speed_bonus INTEGER DEFAULT 0;

-- 2. Tabel Materi & Kasus Tantangan CTF (60 Kasus Lengkap)
CREATE TABLE IF NOT EXISTS public.ctf_challenges (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Linux', -- Linux, Jaringan, Cyber, Hardware
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL,
  summary TEXT,
  lesson TEXT,
  details JSONB DEFAULT '[]', -- Konsep & detail materi teori mendalam
  audio_text TEXT,            -- Naskah narasi audio per materi
  task TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  hint TEXT,
  explain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ctf_challenges ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '[]';
ALTER TABLE public.ctf_challenges ADD COLUMN IF NOT EXISTS audio_text TEXT DEFAULT '';

-- 3. Tabel Log Pengiriman Jawaban Flag (Audit Keamanan & Penilaian)
CREATE TABLE IF NOT EXISTS public.ctf_submissions (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  challenge_id INTEGER NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  solver_rank INTEGER DEFAULT 0, -- Urutan penjawab (1 = First Blood, 2 = Rank 2, dst)
  points_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ctf_submissions ADD COLUMN IF NOT EXISTS solver_rank INTEGER DEFAULT 0;
ALTER TABLE public.ctf_submissions ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- 4. Tabel Tujuan Pembelajaran Kurikulum Merdeka TJKT (Bisa Diedit Guru)
CREATE TABLE IF NOT EXISTS public.ctf_curriculum (
  id TEXT PRIMARY KEY, -- 'main_curriculum'
  program_keahlian TEXT NOT NULL DEFAULT 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
  kurikulum TEXT NOT NULL DEFAULT 'Kurikulum Merdeka SMK Kejuruan',
  tujuan_pembelajaran JSONB NOT NULL DEFAULT '[]',
  manfaat_ctf JSONB NOT NULL DEFAULT '[]',
  tingkat_kesulitan JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pengaturan Ujian, Timer & Dynamic Scoring
CREATE TABLE IF NOT EXISTS public.ctf_exam_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- MODUL BARU: NATIONAL INNOVATION EDITION (HOTS, LKPD & ANALITIK RISET)
-- ====================================================================

-- 6. Tabel Manajemen Kelas TJKT
CREATE TABLE IF NOT EXISTS public.ctf_classes (
  id TEXT PRIMARY KEY, -- e.g. 'XII-TJKT-1', 'XI-TJKT-2'
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2025/2026',
  teacher_name TEXT NOT NULL DEFAULT 'Guru Pengampu TJKT',
  kktp_threshold NUMERIC(5,2) DEFAULT 75.00, -- Kriteria Ketercapaian Tujuan Pembelajaran Minimum
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Spesifikasi 5 Tahap Investigasi Kasus (HOTS C4 - C6)
CREATE TABLE IF NOT EXISTS public.ctf_investigation_stages (
  id BIGSERIAL PRIMARY KEY,
  challenge_id INTEGER REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 5), -- 1: Identifikasi, 2: Bukti, 3: Analisis, 4: Mitigasi, 5: Refleksi
  stage_name TEXT NOT NULL,
  hots_level TEXT NOT NULL DEFAULT 'C4', -- C4 (Analisis), C5 (Evaluasi), C6 (Kreasi/Mitigasi)
  instructions TEXT NOT NULL,
  expected_evidence TEXT,
  rubric_criteria JSONB DEFAULT '[]',
  validation_type TEXT DEFAULT 'flag', -- 'flag', 'regex', 'text', 'code', 'manual'
  validation_rule TEXT DEFAULT '',
  weight_percent INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (challenge_id, stage_number)
);

-- 8. Tabel Progres & Bukti Investigasi Siswa (Evidence Ledger & Portofolio)
CREATE TABLE IF NOT EXISTS public.ctf_investigation_progress (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  challenge_id INTEGER NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 5),
  problem_formulation TEXT DEFAULT '',    -- Tahap 1: Rumusan masalah & aset
  collected_evidence TEXT DEFAULT '',     -- Tahap 2: Log / baris konfigurasi
  root_cause_analysis TEXT DEFAULT '',    -- Tahap 3: Analisis hipotesis C4
  mitigation_applied TEXT DEFAULT '',     -- Tahap 4: Langkah perbaikan pertahanan C5
  reflection_report TEXT DEFAULT '',      -- Tahap 5: Laporan berita acara C6
  terminal_logs JSONB DEFAULT '[]',       -- Rekaman perintah terminal simulasi
  is_validated BOOLEAN DEFAULT FALSE,
  score_awarded NUMERIC(5,2) DEFAULT 0.00,
  teacher_feedback TEXT DEFAULT '',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_name, challenge_id, stage_number)
);

-- 9. Tabel Rubrik Analitik Penilaian HOTS (Smart Assessment Engine)
CREATE TABLE IF NOT EXISTS public.ctf_rubrics (
  id TEXT PRIMARY KEY, -- e.g. 'rubric_hots_default'
  name TEXT NOT NULL DEFAULT 'Rubrik Holistik Forensik Siber TJKT',
  weight_identifikasi INTEGER DEFAULT 15,
  weight_bukti INTEGER DEFAULT 20,
  weight_analisis INTEGER DEFAULT 25,
  weight_mitigasi INTEGER DEFAULT 25,
  weight_refleksi INTEGER DEFAULT 15,
  descriptors JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Bank Soal Pretest & Posttest Evaluasi Inovasi
CREATE TABLE IF NOT EXISTS public.ctf_eval_questions (
  id BIGSERIAL PRIMARY KEY,
  pillar TEXT NOT NULL, -- Linux, Jaringan, Cyber, Hardware
  hots_dimension TEXT NOT NULL DEFAULT 'C4', -- C4, C5, C6
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'short_case'
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]', -- [ {key:'A', text:'...'}, ... ]
  correct_answer TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Percobaan & Hasil Pretest, Posttest, dan N-Gain Siswa
CREATE TABLE IF NOT EXISTS public.ctf_eval_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('pretest', 'posttest')),
  score NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- Skala 0 - 100
  total_questions INTEGER NOT NULL DEFAULT 10,
  answers_submitted JSONB DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabel Umpan Balik Personal & Rekomendasi Remedial Guru
CREATE TABLE IF NOT EXISTS public.ctf_teacher_feedback (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  challenge_id INTEGER REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'remedial', -- 'remedial', 'pengayaan', 'apresiasi'
  feedback_notes TEXT NOT NULL,
  target_pillar TEXT NOT NULL DEFAULT 'Linux',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabel Instrumen Uji Validasi Ahli & Survei Siswa (Kesiapan Lomba Nasional)
CREATE TABLE IF NOT EXISTS public.ctf_validation_instruments (
  id BIGSERIAL PRIMARY KEY,
  evaluator_name TEXT NOT NULL,
  evaluator_role TEXT NOT NULL, -- 'Ahli Media', 'Ahli Materi', 'Guru Pamong', 'Siswa'
  aspect_scores JSONB NOT NULL DEFAULT '{}', -- Skor Likert 1-5
  general_comments TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- HIGH-PERFORMANCE DATABASE INDEXING (Mencegah Load Data Lambat)
-- Mengoptimalkan Query Leaderboard, Filter Kategori, dan Validasi Jawaban
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_ctf_students_name ON public.ctf_students(name);
CREATE INDEX IF NOT EXISTS idx_ctf_students_score ON public.ctf_students(score DESC);
CREATE INDEX IF NOT EXISTS idx_ctf_students_kelas ON public.ctf_students(kelas);
CREATE INDEX IF NOT EXISTS idx_ctf_students_active ON public.ctf_students(last_active DESC);

CREATE INDEX IF NOT EXISTS idx_ctf_challenges_category ON public.ctf_challenges(category);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_difficulty ON public.ctf_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_points ON public.ctf_challenges(points);

CREATE INDEX IF NOT EXISTS idx_ctf_submissions_student_chall ON public.ctf_submissions(student_name, challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_correct ON public.ctf_submissions(is_correct);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_time ON public.ctf_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_ctf_inv_stages_chall ON public.ctf_investigation_stages(challenge_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_ctf_inv_prog_student ON public.ctf_investigation_progress(student_name, challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctf_eval_attempts_student ON public.ctf_eval_attempts(student_name, test_type);

-- ====================================================================
-- PEMBERIAN HAK AKSES DATABASE (MENGATASI 'permission denied')
-- Memberikan hak SELECT, INSERT, UPDATE, DELETE ke role PostgREST Supabase
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.ctf_students TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_challenges TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_submissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_curriculum TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_exam_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_investigation_stages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_investigation_progress TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_rubrics TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_eval_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_eval_attempts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_teacher_feedback TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_validation_instruments TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ====================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.ctf_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_exam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_investigation_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_investigation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_eval_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_eval_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_teacher_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_validation_instruments ENABLE ROW LEVEL SECURITY;

-- Pasang RLS policies terbuka untuk antarmuka API backend terenkripsi
DROP POLICY IF EXISTS "Allow public read/write students" ON public.ctf_students;
DROP POLICY IF EXISTS "Allow public read/write challenges" ON public.ctf_challenges;
DROP POLICY IF EXISTS "Allow public read/write submissions" ON public.ctf_submissions;
DROP POLICY IF EXISTS "Allow public read/write curriculum" ON public.ctf_curriculum;
DROP POLICY IF EXISTS "Allow public read/write exam_settings" ON public.ctf_exam_settings;
DROP POLICY IF EXISTS "Allow public read/write classes" ON public.ctf_classes;
DROP POLICY IF EXISTS "Allow public read/write stages" ON public.ctf_investigation_stages;
DROP POLICY IF EXISTS "Allow public read/write progress" ON public.ctf_investigation_progress;
DROP POLICY IF EXISTS "Allow public read/write rubrics" ON public.ctf_rubrics;
DROP POLICY IF EXISTS "Allow public read/write questions" ON public.ctf_eval_questions;
DROP POLICY IF EXISTS "Allow public read/write attempts" ON public.ctf_eval_attempts;
DROP POLICY IF EXISTS "Allow public read/write feedback" ON public.ctf_teacher_feedback;
DROP POLICY IF EXISTS "Allow public read/write validation" ON public.ctf_validation_instruments;

CREATE POLICY "Allow public read/write students" ON public.ctf_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write challenges" ON public.ctf_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write submissions" ON public.ctf_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write curriculum" ON public.ctf_curriculum FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write exam_settings" ON public.ctf_exam_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write classes" ON public.ctf_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write stages" ON public.ctf_investigation_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write progress" ON public.ctf_investigation_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write rubrics" ON public.ctf_rubrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write questions" ON public.ctf_eval_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write attempts" ON public.ctf_eval_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write feedback" ON public.ctf_teacher_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write validation" ON public.ctf_validation_instruments FOR ALL USING (true) WITH CHECK (true);
