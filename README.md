# CyberLab Academy — Source Code MVP

Proyek Next.js + Node.js + Supabase + Gemini AI untuk pembelajaran Linux, jaringan, server, dan cybersecurity berbasis CTF.

## Instalasi

1. Install Node.js 20+ dan npm.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local` dan isi Supabase URL serta anon/publishable key.
4. Buat project Supabase. Jalankan `supabase/migrations/001_init.sql` di SQL Editor pada project **baru/kosong**.
5. Di Supabase Authentication, konfigurasi URL aplikasi dan email verification.
6. Jalankan `npm run dev`, lalu buka http://localhost:3000.
7. Daftar siswa melalui `/register`.

## Menetapkan admin (hanya dari SQL Editor dengan akses pemilik project)

Setelah akun terdaftar, jalankan:

```sql
insert into public.user_roles(user_id,role)
select id,'admin' from auth.users where email='admin@example.com'
on conflict do nothing;
```

Ganti email dengan email akun admin yang benar. Tidak ada fitur registrasi admin publik.

## Contoh CTF

Tantangan pertama otomatis disiapkan melalui migration, flag untuk pengujian lokal: `CTF{pwd}`. Ganti/hapus contoh ini sebelum digunakan untuk penilaian sungguhan.

Untuk menambahkan flag challenge baru, jalankan dari SQL Editor:

```sql
insert into public.challenge_secrets(challenge_id,flag_hash)
values ('UUID_CHALLENGE',crypt('CTF{jawaban}',gen_salt('bf')))
on conflict(challenge_id) do update set flag_hash=excluded.flag_hash;
```

## Fitur tersedia

- Registrasi/login siswa via Supabase Auth.
- Role siswa/admin dengan RLS.
- Dashboard siswa: XP, penyelesaian CTF dan materi.
- Daftar materi dan penyelesaian pelajaran.
- Challenge easy/medium/hard dan submit flag server-side.
- Skor atomik, deduplikasi skor, dan batas percobaan 3 detik.
- Leaderboard pseudonim.
- Admin CRUD materi dan challenge.
- Statistik admin dasar.
- AI generator draft soal (Gemini API, belum menyimpan draft).

## Batasan versi ini

Ini **MVP sumber kode**, bukan seluruh 10 fase dari spesifikasi besar. Belum tersedia terminal simulasi xterm.js, editor rich text, kelas, badge, mastery kompetensi, rekomendasi adaptif, workflow review AI, export PDF/CSV, test suite, audit log, atau lab VM nyata. Admin global dapat melihat seluruh siswa. Belum ada pembatasan kuota AI per admin dan sistem rate limiting terdistribusi. Perkuat hal ini sebelum digunakan secara publik/produksi.

## Keamanan dan deployment

- Jangan memasukkan service role key ke browser.
- Simpan `GEMINI_API_KEY` hanya pada environment server Vercel.
- Verifikasi RLS sebelum go-live.
- Atur Supabase Auth redirect URLs untuk domain Vercel.
- Deploy repository ke Vercel dan isi environment variables.
- Penggunaan publik memerlukan peninjauan privasi siswa dan pengujian keamanan tambahan.
