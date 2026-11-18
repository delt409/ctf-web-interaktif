-- ====================================================================
-- SKRIP STRUKTUR TABEL SUPABASE UNTUK CYBERLAB CTF (TJKT SMKN)
-- Salin dan jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
-- ====================================================================

-- 1. Tabel Siswa & Progres Pembelajaran
CREATE TABLE IF NOT EXISTS ctf_students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  kelas TEXT DEFAULT 'TJKT',
  nisn TEXT DEFAULT '',
  solved INTEGER[] DEFAULT '{}',
  attempts INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat berdasarkan nama siswa
CREATE INDEX IF NOT EXISTS idx_ctf_students_name ON ctf_students(name);

-- 2. Tabel Kasus Tantangan Kustom (Dibuat Guru via Panel Admin)
CREATE TABLE IF NOT EXISTS ctf_challenges (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Linux', -- Linux, Jaringan, Cyber, Hardware
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL,
  summary TEXT,
  lesson TEXT,
  task TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  hint TEXT,
  explain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Log Pengiriman Jawaban Flag (Audit Keamanan & Penilaian)
CREATE TABLE IF NOT EXISTS ctf_submissions (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  challenge_id INTEGER NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query analitik siswa
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_student ON ctf_submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_chall ON ctf_submissions(challenge_id);

-- Aktifkan Row Level Security (RLS) & Berikan Kebijakan Akses API Publik/Service
ALTER TABLE ctf_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_submissions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Membuka hak baca & tulis untuk REST API key (anon / authenticated)
CREATE POLICY "Allow public read/write students" ON ctf_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write challenges" ON ctf_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write submissions" ON ctf_submissions FOR ALL USING (true) WITH CHECK (true);
