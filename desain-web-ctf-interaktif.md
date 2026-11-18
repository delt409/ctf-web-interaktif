# Desain Web CTF Pembelajaran Interaktif
### Arah visual: "Buku Catatan Lapangan Peretas"

> Dokumen ini adalah panduan desain untuk platform CTF (Capture The Flag) yang mengajarkan keamanan siber lewat tantangan interaktif. Tujuan utamanya: **terlihat dibuat oleh manusia yang paham dunia hacking**, bukan template hasil AI.

---

## 1. Konsep Besar

Bayangkan sebuah **buku catatan lapangan milik peretas senior** yang diwariskan ke muridnya. Isinya:

- Halaman kertas yang sedikit kekuningan, ada coretan pensil, stabilo, dan stempel.
- Potongan output terminal yang "ditempel" seperti kliping.
- Catatan pinggir tulisan tangan: *"jangan lupa cek header-nya!"*
- Tantangan diberi nomor seperti kasus investigasi: `KASUS #014 — Cookie yang Terlalu Percaya Diri`.

Referensi rasa (bukan untuk ditiru mentah):
- Zine hacker lama (Phrack, 2600: The Hacker Quarterly)
- Manual teknis tahun 80–90an (manual Commodore, buku O'Reilly klasik)
- Buku catatan laboratorium & berkas detektif
- Poster riso-print / sablon dua warna

**Satu kalimat arah desain:**
*Hangat seperti kertas, tajam seperti terminal, jujur seperti catatan tangan.*

---

## 2. Ciri Desain "Generate AI" yang WAJIB Dihindari

| Hindari | Kenapa | Gantinya |
|---|---|---|
| Gradien ungu–biru neon | Klise paling umum di desain AI | Dua warna tinta solid (merah bata + hijau fosfor) |
| Glassmorphism / kartu blur transparan | Generik, tidak punya karakter | Kartu kertas dengan bayangan offset tegas |
| Hero "Learn Cybersecurity the Fun Way 🚀" + 3 kartu fitur | Tata letak yang bisa ditukar ke situs mana pun | Halaman depan berbentuk sampul buku catatan |
| Font Inter / Poppins di semua tempat | Default, tanpa suara | Kombinasi serif + monospace + tulisan tangan |
| Ilustrasi 3D gembung / avatar robot | Langsung terasa "stok" | Diagram garis tangan, panah coretan, foto hitam-putih bertekstur |
| Efek "matrix rain" hijau | Stereotip hacker film | Output terminal asli yang masuk akal |
| Ikon gembok + perisai di mana-mana | Visual malas untuk "keamanan" | Simbol spesifik: paket jaringan, byte hex, kunci tulisan tangan |
| Copy yang terlalu semangat & kosong | "Unlock your potential!" | Bahasa mentor yang santai dan spesifik |
| Semua sudut membulat 16px, semua simetris | Rapi tapi tak bernyawa | Sudut tajam, sedikit miring, elemen yang "ditempel" |

---

## 3. Palet Warna

Gunakan sedikit warna, pakai dengan tegas. Terinspirasi tinta cetak dua warna.

| Token | Peran | HEX | OKLCH |
|---|---|---|---|
| `--kertas` | Latar utama | `#F2EBDD` | `oklch(0.94 0.02 85)` |
| `--kertas-gelap` | Latar kartu / sisipan | `#E6DCC8` | `oklch(0.89 0.03 85)` |
| `--tinta` | Teks utama | `#1E1B16` | `oklch(0.21 0.01 70)` |
| `--pensil` | Teks sekunder, garis | `#6B6355` | `oklch(0.50 0.02 75)` |
| `--merah-bata` | Aksen utama, stempel, CTA | `#B8402A` | `oklch(0.55 0.16 35)` |
| `--fosfor` | Terminal, status "benar" | `#7FD36B` | `oklch(0.79 0.17 140)` |
| `--layar` | Latar terminal | `#14170F` | `oklch(0.20 0.02 130)` |
| `--stabilo` | Highlight teks penting | `#F5D547` | `oklch(0.87 0.16 95)` |

**Aturan pakai:**
- 80% halaman = kertas + tinta. Merah bata hanya untuk hal yang harus diperhatikan.
- Hijau fosfor **hanya** muncul di dalam terminal dan saat flag benar.
- Stabilo dipakai seperti stabilo sungguhan: miring sedikit, tidak rata sempurna.

---

## 4. Tipografi

| Peran | Font | Contoh pakai |
|---|---|---|
| Judul | **Fraunces** (serif, karakter kuat) atau **Newsreader** | Judul kasus, judul modul |
| Teks isi | **IBM Plex Sans** atau **Source Serif 4** | Penjelasan materi |
| Kode & terminal | **JetBrains Mono** atau **IBM Plex Mono** | Payload, output, flag |
| Catatan tangan | **Caveat** atau **Kalam** (hemat! maks 1–2 per layar) | Catatan pinggir mentor |

**Skala:**
- Judul halaman: 48–64px, serif, rapat (`letter-spacing: -0.02em`)
- Judul kasus: 28px
- Isi: 17–18px, line-height 1.65 (enak dibaca panjang)
- Label kecil/metadata: 12px monospace, HURUF BESAR, `letter-spacing: 0.08em`

---

## 5. Tekstur & Detail yang Membuat Terasa "Buatan Tangan"

- **Butiran kertas**: noise SVG halus (opasitas 4–6%) di latar.
- **Garis buku**: garis horizontal tipis di area catatan, margin merah vertikal di kiri.
- **Bayangan offset**: `box-shadow: 4px 4px 0 var(--tinta)` — tegas, tanpa blur.
- **Selotip**: potongan selotip semi-transparan di pojok kartu yang "ditempel".
- **Stempel**: "SELESAI", "TERPECAHKAN", "RAHASIA" dengan rotasi -6° sampai 4°, warna merah bata, tepi sedikit kasar.
- **Rotasi kecil**: kartu tantangan diputar acak -1° s/d 1° (konsisten per kartu, bukan acak tiap reload).
- **Coretan**: lingkaran pensil di sekitar angka penting, panah melengkung ke petunjuk.

> Batasan: tekstur adalah bumbu. Jika satu layar punya lebih dari 3 elemen dekoratif, kurangi.

---

## 6. Struktur Halaman

```text
/                 Sampul buku catatan (beranda)
/jalur            Daftar jalur belajar (Web, Kripto, Forensik, Reverse, OSINT)
/jalur/:slug      Peta kasus dalam satu jalur
/kasus/:id        Halaman tantangan interaktif (inti produk)
/arsip            Write-up & pembahasan kasus yang sudah selesai
/papan            Papan skor
/profil/:user     Buku catatan pribadi pemain
```

---

## 7. Beranda — "Sampul Buku Catatan"

```text
+--------------------------------------------------------------+
|  CATATAN LAPANGAN                         [Masuk] [Daftar]   |
|  ----------------------------------------------------------  |
|                                                              |
|   Vol. 03 — Edisi Belajar                                    |
|                                                              |
|   Cara Membobol                     ┌──────────────────┐     |
|   Sesuatu yang                      │ $ curl -I target │     |
|   Kamu Pahami.                      │ HTTP/1.1 200 OK  │     |
|                                     │ X-Debug: true  ◄─┼── "nah, ini dia"
|   ~~~~~~~~~~~~ (garis stabilo)      └──────────────────┘     |
|                                                              |
|   [ Buka Kasus Pertama → ]   47 kasus · 5 jalur              |
|                                                              |
|  ----------------------------------------------------------  |
|  DAFTAR ISI                                                  |
|  01  Web ........................ 14 kasus                   |
|  02  Kriptografi ................ 9 kasus                    |
|  03  Forensik ................... 10 kasus                   |
|  04  Reverse Engineering ........ 8 kasus                    |
|  05  OSINT ...................... 6 kasus                    |
+--------------------------------------------------------------+
```

- Tidak ada kartu "fitur" bertiga. Daftar isi dengan titik-titik bergaya buku menggantikan itu.
- Satu potongan terminal nyata sebagai visual utama, dengan catatan tangan yang menunjuk detail penting.

---

## 8. Halaman Kasus — Inti Pembelajaran Interaktif

Tata letak dua kolom: **berkas kasus** di kiri, **meja kerja** di kanan.

```text
+-------------------------------+------------------------------+
| KASUS #014          [WEB][★★☆]| MEJA KERJA                   |
| Cookie yang Terlalu           | ┌──────────────────────────┐ |
| Percaya Diri                  | │ terminal / browser mini  │ |
|                               | │ $ _                      │ |
| ▸ Situasi                     | │                          │ |
|   Sebuah toko online menyimpan| └──────────────────────────┘ |
|   peran user di cookie...     |                              |
|                               | [ Tab: Terminal | Request |  |
| ▸ Yang perlu kamu pahami      |         Decoder | Catatan ] |
|   - Apa itu cookie            |                              |
|   - Base64 bukan enkripsi  ✎  | ┌ KIRIM FLAG ─────────────┐ |
|                               | │ flag{________________}  │ |
| ▸ Petunjuk (3)                | │              [ Kirim ]  │ |
|   [Buka petunjuk 1  -0 poin]  | └─────────────────────────┘ |
|   [Buka petunjuk 2 -10 poin]  |                              |
|   [Buka petunjuk 3 -25 poin]  |                              |
+-------------------------------+------------------------------+
```

### Elemen interaktif

1. **Terminal mini di browser** — perintah terbatas yang aman (`curl`, `base64`, `xxd`, `strings`), output realistis.
2. **Inspektur request** — pemain bisa mengedit header/cookie lalu kirim ulang, melihat respons berubah.
3. **Decoder** — Base64, Hex, URL, ROT13, dengan tampilan langkah demi langkah.
4. **Catatan pribadi** — area bergaris tempat pemain menulis; tersimpan per kasus dan muncul lagi di profil.
5. **Petunjuk bertingkat** — petunjuk 1 gratis (arah berpikir), 2 berbiaya kecil (alat), 3 berbiaya besar (hampir jawaban).
6. **Mode "Pelajari dulu"** — sebelum kasus, ada mini-pelajaran 3–5 langkah dengan latihan kecil (isi kekosongan, pilih payload yang benar).

### Umpan balik flag

| Kondisi | Tampilan | Copy |
|---|---|---|
| Format salah | Garis bawah merah bergelombang | "Formatnya `flag{...}`, ya." |
| Salah | Kartu bergeser kecil (shake 200ms) | "Belum. Coba lihat lagi isi cookie-nya." |
| Hampir benar (opsional) | Coretan pensil | "Dekat. Ada satu karakter yang kurang." |
| Benar | Stempel "TERPECAHKAN" jatuh ke halaman + teks fosfor | "Kena. Sekarang baca kenapa ini bisa terjadi →" |

Setelah benar, **selalu** tampilkan bagian *"Kenapa ini berbahaya & cara memperbaikinya"* — inilah inti pembelajarannya, bukan cuma skor.

---

## 9. Peta Jalur Belajar

Bukan grid kartu. Gunakan **peta coretan** seperti denah tangan:

```text
   [#001]───[#002]───[#003]
     │                 │
   [#004]           [#005]───[#006 BOS]
     ╰──── jalan pintas ────╯
```

- Kasus selesai: diberi stempel kecil + coretan centang.
- Kasus terkunci: digambar putus-putus dengan pensil.
- Kasus "bos" di akhir jalur: kotak dobel, label tulisan tangan "ujian akhir".

---

## 10. Komponen Utama

### Kartu Kasus
- Latar `--kertas-gelap`, border 1.5px `--tinta`, bayangan offset 4px.
- Nomor kasus besar monospace di pojok kanan atas, warna `--pensil`.
- Label kategori seperti label map arsip (tab kecil di atas kartu).
- Tingkat kesulitan: bintang tulisan tangan, bukan ikon bintang standar.
- Hover: kartu "terangkat" (translate -2px, bayangan 6px). Tanpa glow.

### Tombol
| Varian | Gaya |
|---|---|
| Utama | Latar merah bata, teks kertas, sudut 2px, bayangan offset tinta |
| Sekunder | Border tinta, latar transparan, teks tinta |
| Terminal | Latar layar, teks fosfor, monospace, awalan `>` |
| Tautan | Garis bawah bergelombang tipis |

Saat ditekan: bayangan hilang, tombol turun 4px (seperti tombol fisik).

### Terminal
- Latar `--layar`, teks fosfor, sedikit scanline halus (opsional, opasitas 3%).
- Kursor berkedip blok `█`.
- Prompt realistis: `pemain@lab:~/kasus-014$`
- Jangan efek mengetik pelan untuk output panjang — menyebalkan saat belajar.

### Catatan Mentor
- Font tulisan tangan, warna `--merah-bata` atau `--pensil`.
- Diletakkan di margin dengan panah melengkung ke teks yang dimaksud.
- Isinya spesifik dan berguna: *"perhatikan `role=user` — gimana kalau diganti?"*

---

## 11. Gerak & Animasi

Prinsip: **gerak fisik, bukan gerak digital.**

| Momen | Animasi | Durasi |
|---|---|---|
| Halaman masuk | Kertas "digeser" dari bawah 8px + fade | 250ms |
| Stempel benar | Skala 1.4 → 1, rotasi sedikit, sedikit bounce | 350ms |
| Flag salah | Shake horizontal 3 kali | 200ms |
| Buka petunjuk | Lipatan kertas terbuka (scaleY dari atas) | 220ms |
| Stabilo | Garis tumbuh dari kiri ke kanan | 400ms |

- Hormati `prefers-reduced-motion`: matikan semua kecuali fade.
- Tidak ada partikel, confetti generik, atau animasi melayang terus-menerus.

---

## 12. Gaya Bahasa (Microcopy)

Suara: **mentor senior yang santai, jujur, sedikit jahil.** Bahasa Indonesia sehari-hari, istilah teknis tetap dalam bahasa aslinya.

| Jangan | Pakai |
|---|---|
| "Selamat datang di platform pembelajaran keamanan siber terbaik!" | "Ambil kopi. Kita bongkar sesuatu hari ini." |
| "Unlock your hacking potential 🚀" | "47 kasus. Semuanya pernah terjadi di dunia nyata." |
| "Jawaban Anda salah. Silakan coba lagi." | "Belum. Tapi kamu sudah di arah yang benar." |
| "Selamat! Anda berhasil!" | "Kena. Sekarang baca kenapa ini bisa terjadi." |
| "Error 404" | "Halaman ini sudah kami robek dari buku catatan." |
| "Leaderboard" | "Papan Skor" |

---

## 13. Ilustrasi & Gambar

- Diagram alur serangan digambar seperti di papan tulis: garis tangan, kotak tidak sempurna, panah coretan.
- Foto (jika ada): hitam-putih, grain tinggi, duotone tinta + kertas.
- Ikon: gaya garis 1.5px, sedikit tidak rata — atau gambar sendiri set ikon kecil (paket, byte, kunci, kaca pembesar, gembok rusak).
- **Tidak boleh**: maskot robot, karakter hoodie tanpa wajah, ilustrasi 3D, gambar stok "hacker di depan layar hijau".

---

## 14. Profil Pemain — "Buku Catatanku"

- Tampil seperti halaman pertama buku catatan: nama ditulis tangan, tanggal mulai.
- Koleksi stempel kasus yang sudah dipecahkan (seperti paspor).
- Semua catatan pribadi dari tiap kasus terkumpul — jadi pemain punya "buku" sendiri di akhir.
- Statistik ditulis seperti catatan, bukan dashboard: *"Paling kuat di: Web. Paling sering minta petunjuk di: Kripto."*

---

## 15. Papan Skor

- Tabel bergaya daftar hadir/ledger: garis horizontal, nomor urut monospace.
- 3 teratas diberi lingkaran pensil, bukan piala emas.
- Filter: minggu ini / semua waktu / per jalur.
- Tampilkan juga "pembelajar paling konsisten" (hari beruntun), bukan hanya poin — supaya pemula tetap termotivasi.

---

## 16. Responsif (Mobile)

- Halaman kasus: kolom ditumpuk; meja kerja jadi panel bawah yang bisa ditarik ke atas.
- Catatan mentor di margin pindah ke dalam alur teks sebagai kotak catatan bergaris.
- Terminal tetap bisa dipakai: tombol pintasan perintah di atas keyboard (`curl`, `base64`, `|`, `Tab`).

---

## 17. Aksesibilitas

- Kontras teks tinta di atas kertas ≥ 7:1; fosfor di atas layar ≥ 7:1.
- Font tulisan tangan **tidak pernah** untuk informasi penting saja — selalu ada versi teks biasa.
- Tekstur dan rotasi tidak mengganggu pembaca layar (dekoratif = `aria-hidden`).
- Semua interaksi terminal & form bisa dipakai keyboard penuh.
- Umpan balik flag diumumkan lewat `aria-live`.

---

## 18. Token Desain (Ringkas)

```css
:root {
  --kertas: oklch(0.94 0.02 85);
  --kertas-gelap: oklch(0.89 0.03 85);
  --tinta: oklch(0.21 0.01 70);
  --pensil: oklch(0.50 0.02 75);
  --merah-bata: oklch(0.55 0.16 35);
  --fosfor: oklch(0.79 0.17 140);
  --layar: oklch(0.20 0.02 130);
  --stabilo: oklch(0.87 0.16 95);

  --font-judul: "Fraunces", Georgia, serif;
  --font-isi: "IBM Plex Sans", system-ui, sans-serif;
  --font-kode: "JetBrains Mono", ui-monospace, monospace;
  --font-tangan: "Caveat", cursive;

  --radius: 2px;
  --bayangan-offset: 4px 4px 0 var(--tinta);
  --bayangan-angkat: 6px 6px 0 var(--tinta);
}
```

---

## 19. Daftar Periksa Sebelum Rilis

- [ ] Tidak ada gradien ungu/biru, glassmorphism, atau glow neon.
- [ ] Beranda tidak memakai pola "hero + 3 kartu fitur".
- [ ] Setiap kasus punya bagian "kenapa ini berbahaya & cara memperbaikinya".
- [ ] Catatan mentor isinya spesifik, bukan kalimat motivasi umum.
- [ ] Hijau fosfor hanya di terminal & status benar.
- [ ] Maksimal 3 elemen dekoratif per layar.
- [ ] Semua copy dibaca ulang: apakah ini terdengar seperti manusia?
- [ ] Animasi mematuhi `prefers-reduced-motion`.
- [ ] Bisa dimainkan penuh di HP.

---

*Catatan terakhir di pinggir halaman:* desain yang terasa "manusia" datang dari **keputusan yang spesifik** — warna yang sengaja sedikit, kalimat yang ditulis untuk satu kasus tertentu, dan detail kecil yang hanya terpikir oleh orang yang pernah benar-benar main CTF.
