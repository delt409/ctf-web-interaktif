// -------------------------------------------------------------
// HOTS – Dasar OS/CLI, Jaringan, & SSH (3 topik, masing‑3 level)
// -------------------------------------------------------------
module.exports = [
  // ---------------------------------------------------------
  // 1️⃣ Dasar Sistem Operasi & Perintah CLI
  // ---------------------------------------------------------

  // ----- Low ------------------------------------------------
  {
    id: 201,
    topic: "OS & CLI – Dasar",
    category: "Linux",
    title: "Navigasi file‑system dasar",
    difficulty: "Low",
    points: 100,
    lesson: "**Materi bacaan (Recall & Understand)**\n- Struktur direktori Linux (`/`, `/home`, `/var`, `/etc`).\n- Perintah dasar: ls, cd, pwd, mkdir, touch.\n- Konsep absolute vs relative path.",
    details: [
      "Buka terminal simulator.",
      "Gunakan `pwd` untuk menampilkan working directory.",
      "Buat folder `latihan` dengan `mkdir latihan`.",
      "Masuk ke folder tersebut (`cd latihan`).",
      "Buat file kosong `readme.txt` dengan `touch readme.txt`."
    ],
    task: "Tuliskan absolute path lengkap dari file `readme.txt` yang baru saja Anda buat.",
    answers: ["/home/student/latihan/readme.txt"],
    hint: "Gunakan `pwd` setelah berada di dalam folder latihan, lalu tambahkan `/readme.txt`.",
    explain: "Absolute path menunjukkan letak tepat file di seluruh sistem."
  },

  // ----- Medium ---------------------------------------------
  {
    id: 202,
    topic: "OS & CLI – Dasar",
    category: "Linux",
    title: "Manajemen hak akses file",
    difficulty: "Medium",
    points: 200,
    lesson: "**Materi bacaan (Apply & Analyze)**\n- Mode hak akses rwx untuk owner, group, others.\n- Representasi oktal (e.g., 644, 600).\n- Perintah chmod & chown.",
    details: [
      "Tampilkan hak akses file `readme.txt` dengan `ls -l readme.txt`.",
      "Ubah hak akses menjadi hanya dapat dibaca oleh pemilik (`chmod 600 readme.txt`).",
      "Ubah kepemilikan menjadi user `admin` (`chown admin:admin readme.txt`)."
    ],
    task: "Setelah melakukan perubahan, jalankan `ls -l readme.txt` dan masukkan output lengkapnya sebagai jawaban.",
    answers: ["-rw------- 1 admin admin 0 Sep  1 12:00 readme.txt"],
    hint: "Output harus dimulai dengan `-rw-------` dan menampilkan username `admin` dua kali.",
    explain: "Siswa belajar mengamankan file sensitif dengan prinsip least-privilege."
  },

  // ----- High ------------------------------------------------
  {
    id: 203,
    topic: "OS & CLI – Dasar",
    category: "Linux",
    title: "Menganalisis layanan systemd",
    difficulty: "High",
    points: 300,
    lesson: "**Materi bacaan (Evaluate & Create)**\n- Sistem init systemd & unit file.\n- Perintah systemctl status <service>, journalctl -u <service>.\n- Membuat unit file layanan sederhana (contoh: script helloworld.sh).",
    details: [
      "Buat skrip `/usr/local/bin/helloworld.sh` yang menuliskan `Hello World` ke `/var/log/helloworld.log`.",
      "Buat unit file `/etc/systemd/system/helloworld.service` yang menjalankan skrip pada boot.",
      "Reload daemon (`systemctl daemon-reload`) dan enable layanan (`systemctl enable helloworld`), lalu start (`systemctl start helloworld`).",
      "Tampilkan status layanan dengan `systemctl status helloworld`."
    ],
    task: "Masukkan tiga baris penting dari output `systemctl status helloworld`: Loaded line, Active line, dan Main PID line (gunakan placeholder <PID> untuk PID).",
    answers: [
      "Loaded: loaded (/etc/systemd/system/helloworld.service; enabled; vendor preset: enabled)",
      "Active: active (running) since ...",
      "Main PID: <PID> (helloworld.sh)"
    ],
    hint: "Hanya baris yang dimulai dengan Loaded:, Active: dan Main PID: yang diminta.",
    explain: "Siswa harus memahami cara men‑deploy layanan systemd dan memeriksa lognya."
  },

  // ---------------------------------------------------------
  // 2️⃣ Konsep Dasar & Konfigurasi Jaringan
  // ---------------------------------------------------------

  // ----- Low ------------------------------------------------
  {
    id: 301,
    topic: "Jaringan – Alamat IP",
    category: "Jaringan",
    title: "Menentukan subnet mask dari CIDR",
    difficulty: "Low",
    points: 100,
    lesson: "**Materi bacaan (Recall & Understand)**\n- Notasi CIDR (/24, /16, dsb.).\n- Konversi CIDR ke subnet mask desimal.",
    details: [
      "Anda diberikan jaringan `192.168.10.0/24`.",
      "Hitung subnet mask dalam notasi desimal."
    ],
    task: "Masukkan subnet mask untuk jaringan di atas (format 255.xxx.xxx.xxx).",
    answers: ["255.255.255.0"],
    hint: "Angka 24 berarti 24 bit pertama di‑set menjadi 1.",
    explain: "Subnet mask /24 → 255.255.255.0."
  },

  // ----- Medium ---------------------------------------------
  {
    id: 302,
    topic: "Jaringan – Netplan",
    category: "Jaringan",
    title: "Konfigurasi IP statis dengan Netplan",
    difficulty: "Medium",
    points: 200,
    lesson: "**Materi bacaan (Apply & Analyze)**\n- File konfigurasi Netplan (/etc/netplan/*.yaml).\n- Struktur YAML untuk interface enp0s3.\n- Perintah netplan apply.",
    details: [
      "Buat file `/etc/netplan/01-static.yaml` dengan isi:\n```yaml\nnetwork:\n  version: 2\n  ethernets:\n    enp0s3:\n      dhcp4: false\n      addresses: [10.0.0.20/24]\n      gateway4: 10.0.0.1\n      nameservers:\n        addresses: [8.8.8.8,8.8.4.4]\n```",
      "Jalankan `netplan apply` dan verifikasi IP dengan `ip addr show enp0s3`."
    ],
    task: "Tuliskan IP yang ditampilkan oleh perintah di atas (hanya address, tanpa prefix).",
    answers: ["10.0.0.20"],
    hint: "Output `inet 10.0.0.20/24` → ambil bagian sebelum `/`.",
    explain: "Siswa belajar men‑set alamat statis melalui Netplan."
  },

  // ----- High ------------------------------------------------
  {
    id: 303,
    topic: "Jaringan – Analisis Lalu Lintas",
    category: "Jaringan",
    title: "Menganalisis paket dengan tcpdump",
    difficulty: "High",
    points: 300,
    lesson: "**Materi bacaan (Evaluate & Create)**\n- Perintah dasar tcpdump (filtering, penulisan ke file).\n- Format output IP src -> dst.\n- Interpretasi header TCP SYN.",
    details: [
      "Jalankan capture pada interface `enp0s3` selama 5 detik: `tcpdump -i enp0s3 -c 5 -w /tmp/capture.pcap`.",
      "Buka file pcap dengan `tcpdump -r /tmp/capture.pcap`.",
      "Identifikasi baris pertama yang berisi paket TCP SYN."
    ],
    task: "Masukkan tiga nilai yang muncul pada baris SYN pertama, dipisahkan dengan spasi: Source IP, Destination IP, dan Port tujuan (angka).",
    answers: ["10.0.0.20 10.0.0.1 22"],
    hint: "Contoh output: `IP 10.0.0.20.54321 > 10.0.0.1.22: Flags [S]` → ambil IP sumber, IP tujuan, dan port tujuan (22).",
    explain: "Siswa dapat mengekstrak informasi penting dari capture paket."
  },

  // ---------------------------------------------------------
  // 3️⃣ Administrasi Layanan Jaringan – SSH
  // ---------------------------------------------------------

  // ----- Low ------------------------------------------------
  {
    id: 401,
    topic: "SSH – Dasar",
    category: "Jaringan",
    title: "Menyambung ke server via SSH",
    difficulty: "Low",
    points: 100,
    lesson: "**Materi bacaan (Recall & Understand)**\n- Protokol SSH, port default 22.\n- Sintaks dasar ssh <user>@<host>.",
    details: [
      "Server SSH berjalan pada IP `10.0.0.10` dengan user `student`.",
      "Gunakan perintah SSH untuk login ke server."
    ],
    task: "Tuliskan perintah lengkap yang harus dijalankan (tanpa tanda kutip).",
    answers: ["ssh student@10.0.0.10"],
    hint: "Gunakan format `ssh user@host`.",
    explain: "Ini menguji kemampuan mengakses layanan remote."
  },

  // ----- Medium ---------------------------------------------
  {
    id: 402,
    topic: "SSH – Otentikasi Kunci",
    category: "Jaringan",
    title: "Membuat dan meng‑install SSH key pair",
    difficulty: "Medium",
    points: 200,
    lesson: "**Materi bacaan (Apply & Analyze)**\n- Perintah ssh-keygen -t rsa -b 4096.\n- File ~/.ssh/id_rsa.pub → copy ke ~/.ssh/authorized_keys pada server.\n- Hak akses 600 untuk authorized_keys.",
    details: [
      "Di mesin lokal, buat pasangan kunci RSA dengan nama file default.",
      "Copy isi `~/.ssh/id_rsa.pub` ke server `10.0.0.10` pada `~/.ssh/authorized_keys` milik user `student`.",
      "Pastikan permission `chmod 600 ~/.ssh/authorized_keys`."
    ],
    task: "Berikan tiga baris perintah yang harus dijalankan secara berurutan (pisahkan dengan |): 1) generate key, 2) transfer public key ke server, 3) set permission pada server.",
    answers: ["ssh-keygen -t rsa -b 4096 -N '' -f ~/.ssh/id_rsa|ssh-copy-id -i ~/.ssh/id_rsa.pub student@10.0.0.10|ssh student@10.0.0.10 'chmod 600 ~/.ssh/authorized_keys'"],
    hint: "Gunakan ssh-copy-id untuk otomatis men‑copy key.",
    explain: "Siswa menyiapkan otentikasi kunci publik‑privat."
  },

  // ----- High ------------------------------------------------
  {
    id: 403,
    topic: "SSH – Hardening",
    category: "Jaringan",
    title: "Membatasi login root & men‑enable 2FA (simulasi)",
    difficulty: "High",
    points: 300,
    lesson: "**Materi bacaan (Evaluate & Create)**\n- File /etc/ssh/sshd_config → PermitRootLogin no, PasswordAuthentication no.\n- Men‑install paket libpam-google-authenticator (simulasi).\n- Restart service (systemctl restart sshd).",
    details: [
      "Edit `/etc/ssh/sshd_config` sehingga baris PermitRootLogin menjadi `no` dan PasswordAuthentication menjadi `no`.",
      "Tambahkan baris `ChallengeResponseAuthentication yes`.",
      "Restart daemon dan verifikasi bahwa login dengan password tidak memungkinkan."
    ],
    task: "Tuliskan **dua** baris konfigurasi yang harus ditambahkan/diubah dalam ss​hd_config (pisahkan dengan |).",
    answers: ["PermitRootLogin no|PasswordAuthentication no"],
    hint: "Kedua opsi berada pada baris terpisah.",
    explain: "Siswa belajar mengamankan akses SSH secara standar industri."
  }
];
