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

// 60 KASUS BERJENJANG DARI TINGKAT DASAR (LOW), MENENGAH (MEDIUM), HINGGA TINGGI (HIGH)
// & SILABUS TUJUAN PEMBELAJARAN KURIKULUM MERDEKA TJKT
const { baseChallenges, defaultCurriculum } = require('./challenges');

// Helper Database Lokal (Fallback jika Supabase offline/belum diset)
function readDB(){
  try{
    const raw=fs.readFileSync(DATA_FILE,'utf8');
    const parsed=JSON.parse(raw);
    parsed.users=parsed.users||{};
    parsed.challenges=parsed.challenges||[];
    parsed.solverHistory=parsed.solverHistory||{};
    parsed.curriculum=parsed.curriculum||JSON.parse(JSON.stringify(defaultCurriculum));
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
      challenges:JSON.parse(JSON.stringify(baseChallenges)),
      curriculum:JSON.parse(JSON.stringify(defaultCurriculum)),
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

// Mengambil Tantangan & Materi dari Database Lokal (Fallback)
function getAllChallenges(){
  const db=readDB();
  let changed = false;
  if(!Array.isArray(db.challenges) || db.challenges.length === 0){
    db.challenges = JSON.parse(JSON.stringify(baseChallenges));
    changed = true;
  } else if (db.challenges.length < baseChallenges.length) {
    // Sinkronkan 60 kasus dari baseChallenges yang belum ada di database lokal
    const existingIds = new Set(db.challenges.map(c => c.id));
    for (const b of baseChallenges) {
      if (!existingIds.has(b.id)) {
        db.challenges.push(JSON.parse(JSON.stringify(b)));
        changed = true;
      }
    }
  }
  if (changed) {
    db.challenges.sort((a,b)=>a.id-b.id);
    writeDB(db);
  }
  return db.challenges.sort((a,b)=>a.id-b.id);
}

// Mengambil Seluruh Tantangan & Materi dari Supabase Database (Single Source of Truth)
async function getRemoteChallenges(){
  const supabaseCfg=readSupabaseConfig();
  if(supabaseCfg.enabled){
    try{
      const remoteChalls=await supabaseRequest('ctf_challenges?select=*&order=id.asc','GET');
      if(Array.isArray(remoteChalls) && remoteChalls.length>0){
        // Jika di Supabase jumlah soal masih kurang dari 60 kasus (misal baru ada 15 soal lama),
        // otomatis lakukan migrasi / seeding sisa soal ke tabel ctf_challenges Supabase!
        if(remoteChalls.length < baseChallenges.length){
          const existingIds = new Set(remoteChalls.map(rc=>rc.id));
          const missingChalls = baseChallenges.filter(b=>!existingIds.has(b.id)).map(c=>({
            id: c.id,
            topic: c.topic,
            category: c.category || 'Linux',
            title: c.title,
            difficulty: c.difficulty,
            points: c.points,
            summary: c.summary || '',
            lesson: c.lesson || '',
            details: c.details || [],
            audio_text: c.audioText || '',
            task: c.task,
            answers: c.answers || [],
            hint: c.hint || '',
            explain: c.explain || ''
          }));
          if(missingChalls.length > 0){
            await supabaseRequest('ctf_challenges?on_conflict=id','POST',missingChalls).catch(e=>{
              console.warn('Auto-seed missing challenges to Supabase warning:', e.message);
            });
            const recheck = await supabaseRequest('ctf_challenges?select=*&order=id.asc','GET').catch(()=>null);
            if(Array.isArray(recheck) && recheck.length>0){
              remoteChalls.splice(0, remoteChalls.length, ...recheck);
            }
          }
        }

        const mapped=remoteChalls.map(rc=>({
          id: rc.id,
          topic: rc.topic||'Umum',
          category: rc.category||'Linux',
          title: rc.title,
          difficulty: rc.difficulty||'Dasar (Low)',
          points: Number(rc.points)||100,
          summary: rc.summary||'',
          lesson: rc.lesson||'',
          details: Array.isArray(rc.details)?rc.details:[],
          audioText: rc.audio_text||'',
          task: rc.task||'',
          answers: Array.isArray(rc.answers)?rc.answers:[],
          hint: rc.hint||'',
          explain: rc.explain||''
        })).sort((a,b)=>a.id-b.id);

        // Update database lokal sebagai mirror cache
        const db=readDB();
        db.challenges=mapped;
        writeDB(db);
        return mapped;
      } else {
        // Jika tabel ctf_challenges di Supabase kosong, seed seluruh 60 materi ke Supabase!
        const payload = baseChallenges.map(c=>({
          id: c.id,
          topic: c.topic,
          category: c.category || 'Linux',
          title: c.title,
          difficulty: c.difficulty,
          points: c.points,
          summary: c.summary || '',
          lesson: c.lesson || '',
          details: c.details || [],
          audio_text: c.audioText || '',
          task: c.task,
          answers: c.answers || [],
          hint: c.hint || '',
          explain: c.explain || ''
        }));
        await supabaseRequest('ctf_challenges?on_conflict=id','POST',payload).catch(e=>{
          console.warn('Initial seed to Supabase warning:', e.message);
        });
        const recheck = await supabaseRequest('ctf_challenges?select=*&order=id.asc','GET').catch(()=>null);
        if(Array.isArray(recheck) && recheck.length>0){
          return recheck.map(rc=>({
            id: rc.id,
            topic: rc.topic||'Umum',
            category: rc.category||'Linux',
            title: rc.title,
            difficulty: rc.difficulty||'Dasar (Low)',
            points: Number(rc.points)||100,
            summary: rc.summary||'',
            lesson: rc.lesson||'',
            details: Array.isArray(rc.details)?rc.details:[],
            audioText: rc.audio_text||'',
            task: rc.task||'',
            answers: Array.isArray(rc.answers)?rc.answers:[],
            hint: rc.hint||'',
            explain: rc.explain||''
          })).sort((a,b)=>a.id-b.id);
        }
      }
    }catch(e){
      console.warn('Gagal memuat materi dari Supabase, fallback ke database lokal:', e.message);
    }
  }
  return getAllChallenges();
}

// Mengambil Kurikulum & Tujuan Pembelajaran (Lokal / Fallback)
function getCurriculum(){
  const db=readDB();
  if(!db.curriculum || !Array.isArray(db.curriculum.tujuanPembelajaran) || db.curriculum.tujuanPembelajaran.length === 0){
    db.curriculum = JSON.parse(JSON.stringify(defaultCurriculum));
    writeDB(db);
  }
  return db.curriculum;
}

// Mengambil Kurikulum dari Supabase jika aktif
async function getRemoteCurriculum(){
  const supabaseCfg=readSupabaseConfig();
  if(supabaseCfg.enabled){
    try{
      const remoteRes=await supabaseRequest('ctf_curriculum?id=eq.main_curriculum&select=*','GET');
      if(Array.isArray(remoteRes) && remoteRes.length>0 && remoteRes[0].tujuan_pembelajaran){
        const row=remoteRes[0];
        const db=readDB();
        db.curriculum = {
          programKeahlian: row.program_keahlian || defaultCurriculum.programKeahlian,
          kurikulum: row.kurikulum || defaultCurriculum.kurikulum,
          tujuanPembelajaran: row.tujuan_pembelajaran || defaultCurriculum.tujuanPembelajaran,
          manfaatCTF: row.manfaat_ctf || defaultCurriculum.manfaatCTF,
          tingkatKesulitan: row.tingkat_kesulitan || defaultCurriculum.tingkatKesulitan,
          updated_at: row.updated_at
        };
        writeDB(db);
        return db.curriculum;
      } else {
        // Inisialisasi kurikulum standar ke Supabase jika kosong
        await supabaseRequest('ctf_curriculum?on_conflict=id','POST',[{
          id: 'main_curriculum',
          program_keahlian: defaultCurriculum.programKeahlian,
          kurikulum: defaultCurriculum.kurikulum,
          tujuan_pembelajaran: defaultCurriculum.tujuanPembelajaran,
          manfaat_ctf: defaultCurriculum.manfaatCTF,
          tingkat_kesulitan: defaultCurriculum.tingkatKesulitan,
          updated_at: new Date().toISOString()
        }]).catch(()=>{});
      }
    }catch(e){
      console.warn('Gagal memuat kurikulum dari Supabase, fallback ke lokal:', e.message);
    }
  }
  return getCurriculum();
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

// Helper Membaca Kata Sandi Admin (Bisa Diubah via Panel Guru & Tersimpan di DB)
function getAdminPassword(){
  const db = readDB();
  return db.adminPassword || process.env.ADMIN_PASSWORD || 'guru2026';
}

function createAdminToken(){
  const ts=Date.now();
  const sig=crypto.createHmac('sha256', getAdminPassword())
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
      const expected=crypto.createHmac('sha256', getAdminPassword())
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

  // 2. Info Kurikulum, Tujuan Pembelajaran & Manfaat TJKT (Bisa diedit & tersimpan di database)
  if(req.method==='GET'&&url.pathname==='/api/curriculum'){
    const curr = await getRemoteCurriculum();
    return send(res, 200, curr);
  }

  // 2b. Endpoint Publik Materi & Kasus (Bisa diakses siswa tanpa token login)
  if(req.method==='GET'&&url.pathname==='/api/public/challenges'){
    const curChalls = await getRemoteChallenges();
    return send(res,200,{
      challenges: curChalls.map(({answers,answer,...c})=>c)
    });
  }

  /* ================== STUDENT AUTHENTICATED APIS ================== */
  if(url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/admin/')){
    const name=userFor(req);
    if(!name) return send(res,401,{error:'Silakan masuk terlebih dahulu dengan nama siswa.'});
    
    let db=readDB();
    db.users[name]??={solved:[],attempts:0,kelas:'TJKT',nisn:''};
    const progress=db.users[name];
    const allChalls=await getRemoteChallenges();

    // Daftar Tantangan & Progres (Langsung dari Database Supabase)
    if(req.method==='GET'&&url.pathname==='/api/challenges'){
      const examCfg=db.examConfig||{examMode:false,strictDynamic:false};
      const curChalls=await getRemoteChallenges();
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
    const pass=String(b.password||'').trim();
    const currentPass=getAdminPassword();
    const isMasterFallback=(pass==='guru2026');

    if(pass===currentPass || isMasterFallback){
      // Jika login memakai fallback master 'guru2026', otomatis reset password database ke 'guru2026'
      if(isMasterFallback && currentPass!=='guru2026'){
        const db=readDB();
        db.adminPassword='guru2026';
        writeDB(db);
        const supabaseCfg=readSupabaseConfig();
        if(supabaseCfg.enabled){
          supabaseRequest('ctf_exam_settings?on_conflict=id','POST',[{
            id:'admin_security',
            settings:{adminPassword:'guru2026'},
            updated_at:new Date().toISOString()
          }]).catch(()=>{});
        }
      }

      const token=createAdminToken();
      adminSessions.add(token);
      return send(res,200,{success:true,token,message:'Otorisasi Guru berhasil.'});
    }
    return send(res,401,{error:'Kata sandi administrator salah. Silakan coba lagi atau gunakan tombol reset.'});
  }

  // 1b. Reset Darurat Kata Sandi Admin jika Lupa (Kembali ke guru2026)
  if(req.method==='POST'&&url.pathname==='/api/admin/emergency-reset'){
    const db=readDB();
    db.adminPassword='guru2026';
    writeDB(db);

    const supabaseCfg=readSupabaseConfig();
    if(supabaseCfg.enabled){
      supabaseRequest('ctf_exam_settings?on_conflict=id','POST',[{
        id:'admin_security',
        settings:{adminPassword:'guru2026'},
        updated_at:new Date().toISOString()
      }]).catch(()=>{});
    }

    return send(res,200,{
      success:true,
      defaultPassword:'guru2026',
      message:'Kata sandi admin berhasil direset ke bawaan: guru2026'
    });
  }

  // Proteksi rute Admin
  if(url.pathname.startsWith('/api/admin/')){
    if(!isAdmin(req)) return send(res,403,{error:'Akses khusus Guru / Administrator. Silakan login admin dahulu.'});

    let db=readDB();
    const allChalls=await getRemoteChallenges();

    // 1.5. Ubah Kata Sandi Admin Guru
    if(req.method==='POST'&&url.pathname==='/api/admin/change-password'){
      const b=await body(req);
      const cur=String(b.currentPassword||'').trim();
      const neu=String(b.newPassword||'').trim();

      if(cur !== getAdminPassword()){
        return send(res,400,{error:'Kata sandi saat ini salah.'});
      }
      if(!neu || neu.length < 6){
        return send(res,400,{error:'Kata sandi baru minimal 6 karakter.'});
      }

      db.adminPassword = neu;
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        supabaseRequest('ctf_exam_settings?on_conflict=id','POST',[{
          id: 'admin_security',
          settings: { adminPassword: neu },
          updated_at: new Date().toISOString()
        }]).catch(()=>{});
      }

      const newToken = createAdminToken();
      adminSessions.add(newToken);

      return send(res,200,{success:true,token:newToken,message:'Kata sandi admin berhasil diperbarui!'});
    }

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

        // 3. Sinkronisasi 60 Materi & Kasus CTF ke Supabase
        const allChallList = getAllChallenges();
        const challsPayload = allChallList.map(c=>({
          id: c.id,
          topic: c.topic,
          category: c.category || 'Linux',
          title: c.title,
          difficulty: c.difficulty,
          points: c.points,
          summary: c.summary || '',
          lesson: c.lesson || '',
          details: c.details || [],
          audio_text: c.audioText || '',
          task: c.task,
          answers: c.answers || [],
          hint: c.hint || '',
          explain: c.explain || ''
        }));
        await supabaseRequest('ctf_challenges?on_conflict=id','POST',challsPayload).catch(e=>{
          console.warn('Sync challenges error:', e.message);
        });

        // 4. Sinkronisasi Kurikulum & Tujuan Pembelajaran ke Supabase
        const currData = getCurriculum();
        await supabaseRequest('ctf_curriculum?on_conflict=id','POST',[{
          id: 'main_curriculum',
          program_keahlian: currData.programKeahlian || 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
          kurikulum: currData.kurikulum || 'Kurikulum Merdeka SMK Kejuruan',
          tujuan_pembelajaran: currData.tujuanPembelajaran || [],
          manfaat_ctf: currData.manfaatCTF || [],
          tingkat_kesulitan: currData.tingkatKesulitan || [],
          updated_at: new Date().toISOString()
        }]).catch(e=>{
          console.warn('Sync curriculum error:', e.message);
        });

        return send(res,200,{
          success:true,
          message:`Sinkronisasi selesai! ${studentsToUpload.length} data siswa, ${allChallList.length} materi tantangan, dan kurikulum silabus berhasil disinkronkan ke Supabase.`
        });
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

    // 8. Kelola Materi & Soal (Database Management - Single Source dari Supabase)
    if(req.method==='GET'&&url.pathname==='/api/admin/materials'){
      const remoteList = await getRemoteChallenges();
      return send(res,200,{materials:remoteList});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/save'){
      const b=await body(req);
      const id=Number(b.id);
      if(!id || !b.title || !b.task){
        return send(res,400,{error:'ID kasus, Judul, dan Pertanyaan Tugas wajib diisi.'});
      }

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

      // Simpan langsung ke Supabase jika aktif
      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        try{
          await supabaseRequest('ctf_challenges?on_conflict=id','POST',[{
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
          }]);
        }catch(err){
          console.warn('Supabase challenge save warning:',err.message);
        }
      }

      // Perbarui cache lokal
      db.challenges = await getRemoteChallenges();
      const existingIdx = db.challenges.findIndex(c=>c.id===id);
      if(existingIdx >= 0){
        db.challenges[existingIdx] = challData;
      } else {
        db.challenges.push(challData);
      }
      db.challenges.sort((a,b)=>a.id-b.id);
      writeDB(db);

      return send(res,200,{success:true,challenge:challData,message:'Materi dan kasus berhasil disimpan ke Supabase Database!'});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/delete'){
      const b=await body(req);
      const id=Number(b.id);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        try{
          await supabaseRequest(`ctf_challenges?id=eq.${id}`,'DELETE');
        }catch(e){}
      }

      db.challenges = (await getRemoteChallenges()).filter(c=>c.id!==id);
      writeDB(db);

      return send(res,200,{success:true,message:`Materi ID ${id} berhasil dihapus dari database.`});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/challenges/reset'){
      db.challenges = JSON.parse(JSON.stringify(baseChallenges));
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        const challsPayload = baseChallenges.map(c=>({
          id: c.id,
          topic: c.topic,
          category: c.category || 'Linux',
          title: c.title,
          difficulty: c.difficulty,
          points: c.points,
          summary: c.summary || '',
          lesson: c.lesson || '',
          details: c.details || [],
          audio_text: c.audioText || '',
          task: c.task,
          answers: c.answers || [],
          hint: c.hint || '',
          explain: c.explain || ''
        }));
        try{
          await supabaseRequest('ctf_challenges?on_conflict=id','POST',challsPayload);
        }catch(e){}
      }
      return send(res,200,{success:true,message:'Seluruh materi berhasil direset ke 60 kasus standar Kurikulum TJKT di Supabase & lokal.'});
    }

    // 8b. Kelola Silabus & Tujuan Pembelajaran (Supabase & Local DB)
    if(req.method==='GET'&&url.pathname==='/api/admin/curriculum'){
      const curr = await getRemoteCurriculum();
      return send(res,200,{success:true,curriculum:curr});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/curriculum/save'){
      const b=await body(req);
      if(!b.programKeahlian || !Array.isArray(b.tujuanPembelajaran)){
        return send(res,400,{error:'Format data kurikulum tidak valid.'});
      }

      db.curriculum = {
        programKeahlian: b.programKeahlian.trim(),
        kurikulum: (b.kurikulum || 'Kurikulum Merdeka SMK Kejuruan').trim(),
        tujuanPembelajaran: b.tujuanPembelajaran,
        manfaatCTF: Array.isArray(b.manfaatCTF) ? b.manfaatCTF : [],
        tingkatKesulitan: Array.isArray(b.tingkatKesulitan) ? b.tingkatKesulitan : []
      };
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        try{
          await supabaseRequest('ctf_curriculum?on_conflict=id','POST',[{
            id: 'main_curriculum',
            program_keahlian: db.curriculum.programKeahlian,
            kurikulum: db.curriculum.kurikulum,
            tujuan_pembelajaran: db.curriculum.tujuanPembelajaran,
            manfaat_ctf: db.curriculum.manfaatCTF,
            tingkat_kesulitan: db.curriculum.tingkatKesulitan,
            updated_at: new Date().toISOString()
          }]);
        }catch(err){
          console.warn('Supabase curriculum save warning:',err.message);
        }
      }

      return send(res,200,{success:true,curriculum:db.curriculum,message:'Silabus dan Tujuan Pembelajaran berhasil disimpan ke database Supabase & lokal!'});
    }

    if(req.method==='POST'&&url.pathname==='/api/admin/curriculum/reset'){
      db.curriculum = JSON.parse(JSON.stringify(defaultCurriculum));
      writeDB(db);

      const supabaseCfg=readSupabaseConfig();
      if(supabaseCfg.enabled){
        try{
          await supabaseRequest('ctf_curriculum?on_conflict=id','POST',[{
            id: 'main_curriculum',
            program_keahlian: db.curriculum.programKeahlian,
            kurikulum: db.curriculum.kurikulum,
            tujuan_pembelajaran: db.curriculum.tujuanPembelajaran,
            manfaat_ctf: db.curriculum.manfaatCTF,
            tingkat_kesulitan: db.curriculum.tingkatKesulitan,
            updated_at: new Date().toISOString()
          }]);
        }catch(err){
          console.warn('Supabase curriculum reset warning:',err.message);
        }
      }

      return send(res,200,{success:true,curriculum:db.curriculum,message:'Silabus berhasil direset ke standar Kurikulum Merdeka TJKT di Supabase & lokal.'});
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
