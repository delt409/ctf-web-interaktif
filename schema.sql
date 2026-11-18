-- ====================================================================
-- SKRIP STRUKTUR TABEL & HAK AKSES SUPABASE UNTUK CYBERLAB CTF (V2)
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

-- Migrasi kolom jika tabel sudah ada sebelumnya
ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';
ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.ctf_students ADD COLUMN IF NOT EXISTS speed_bonus INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ctf_students_name ON public.ctf_students(name);

-- 2. Tabel Materi & Kasus Tantangan CTF (Tersimpan di Database & Bisa Diupdate)
CREATE TABLE IF NOT EXISTS public.ctf_challenges (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Linux', -- Linux, Jaringan, Cyber, Hardware
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL,
  summary TEXT,
  lesson TEXT,
  details JSONB DEFAULT '[]', -- Konsep & detail materi teori
  audio_text TEXT,            -- Naskah narasi audio per materi
  task TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  hint TEXT,
  explain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi kolom jika tabel sudah ada sebelumnya
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

CREATE INDEX IF NOT EXISTS idx_ctf_submissions_student ON public.ctf_submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_chall ON public.ctf_submissions(challenge_id);

-- 4. Tabel Pengaturan Ujian, Timer & Dynamic Scoring
CREATE TABLE IF NOT EXISTS public.ctf_exam_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. PEMBERIAN HAK AKSES DATABASE (MENGATASI 'permission denied')
-- Memberikan hak SELECT, INSERT, UPDATE, DELETE ke role PostgREST Supabase
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.ctf_students TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_challenges TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_submissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ctf_exam_settings TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privilege untuk objek-objek baru di masa depan
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ====================================================================
-- 6. KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.ctf_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctf_exam_settings ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error duplikasi
DROP POLICY IF EXISTS "Allow public read/write students" ON public.ctf_students;
DROP POLICY IF EXISTS "Allow public read/write challenges" ON public.ctf_challenges;
DROP POLICY IF EXISTS "Allow public read/write submissions" ON public.ctf_submissions;
DROP POLICY IF EXISTS "Allow public read/write exam_settings" ON public.ctf_exam_settings;

-- Berikan akses penuh (SELECT, INSERT, UPDATE, DELETE) untuk koneksi aplikasi
CREATE POLICY "Allow public read/write students" ON public.ctf_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write challenges" ON public.ctf_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write submissions" ON public.ctf_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write exam_settings" ON public.ctf_exam_settings FOR ALL USING (true) WITH CHECK (true);
