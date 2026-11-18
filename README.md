# CyberLab CTF — Media Pembelajaran Interaktif Node.js

Aplikasi pembelajaran **defensive cybersecurity** berbahasa Indonesia. Berisi 10 misi demonstrasi, materi dan audio narasi browser, simulator terminal, validasi jawaban sisi server, XP, progres dan papan peringkat.

## Persyaratan
- Node.js versi 18 atau lebih baru
- Browser Chrome atau Edge (suara bahasa Indonesia bergantung pada voice yang terpasang)

## Menjalankan
```bash
cd cyberlab-ctf
npm start
```
Buka `http://localhost:3000`.

**Tidak perlu `npm install`** karena tidak menggunakan dependensi eksternal.

## Penggunaan di VirtualBox
Jalankan aplikasi pada Ubuntu Server. Jika VM memakai NAT, atur port forwarding TCP host 3000 → guest 3000; atau gunakan mode bridged dan akses `http://IP-VM:3000` dari komputer lain.

## Catatan penting
- Terminal adalah **simulator**: tidak menjalankan perintah OS dan tidak mengakses jaringan.
- Jawaban benar hanya disimpan di `server.js`, tidak dikirim ke browser.
- Progres tersimpan pada `data/progress.json`; dibuat otomatis.
- Akun berbasis nama **hanya untuk demo kelas**, bukan autentikasi produksi. Siswa dapat memakai nama yang sama. Untuk deployment nyata, tambahkan akun unik, password hash, HTTPS, pembatasan percobaan, session persistence, dan peran guru/siswa.
- Audio narasi menggunakan Web Speech API; tidak menyertakan berkas MP3. Ketersediaan suara Indonesia tergantung browser dan sistem operasi.
- 10 misi merupakan fondasi yang dapat dikembangkan menjadi 50 tantangan HOTS dengan validator layanan Ubuntu Server nyata.
# ctf-web-interaktif
