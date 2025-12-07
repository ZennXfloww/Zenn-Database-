const USERS_DB = "settings/users.json";

const API_NUMBERS   = 'https://api.github.com/repos/ZennXfloww/ZennDB-V2/contents/db.json';
const TOKEN_NUMBERS = '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';

let state = { user:null, role:null, loginList:[] };

function toast(el, msg, ok=true){ 
  el.textContent = msg; 
  el.style.color = ok? 'var(--success)':'var(--danger)'; 
}

function setView(id){
  document.querySelectorAll('main[id^="view-"]').forEach(m=>m.classList.add('hidden'));
  document.getElementById('view-'+id).classList.remove('hidden');
  document.querySelectorAll('.menu a').forEach(a=>a.classList.remove('active'));
  const link = document.querySelector(`.menu a[data-view="${id}"]`);
  if(link) link.classList.add('active');
  drawer.classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}

async function loadLogins(){
  if(state.loginList.length === 0){
    const res = await fetch(USERS_DB);
    if(!res.ok) throw new Error("Gagal load users.json");
    state.loginList = await res.json();
  }
  const stored = localStorage.getItem("accounts");
  if(stored){
    const arr = JSON.parse(stored);
    arr.forEach(u=>{
      if(!state.loginList.some(x=>x.username===u.username)){
        state.loginList.push(u);
      }
    });
  }
}

async function doLogin(username, password){
  await loadLogins();
  const found = state.loginList.find(u => u.username === username && u.password === password);
  if(!found) return null;
  state.user = username; 
  state.role = found.role;
  localStorage.setItem('session', JSON.stringify({u:username, r:found.role}));
  return found;
}

function restoreSession(){
  const s = localStorage.getItem('session');
  if(!s) return;
  const {u, r} = JSON.parse(s);
  state.user = u; 
  state.role = r;
  document.getElementById('who').textContent = u + ' • ' + r;
  document.getElementById('userBadge').classList.remove('hidden');
  document.getElementById('roleChip').textContent = r;
  document.getElementById('btnHamburger').classList.remove('hidden');
  if(r === 'admin') document.getElementById('adminSection').classList.remove('hidden');
  setView('dashboard');
  renderAccounts();
}

function logout(){
  localStorage.removeItem('session'); location.reload();
}

function renderAccounts(){
  const body = document.getElementById('accountsTable');
  body.innerHTML = '';
  state.loginList.forEach((u, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${u.username}</td><td>${u.role}</td>
      <td><button class="btn danger" data-deluser="${u.username}"><i class="fa-solid fa-user-xmark"></i> Hapus</button></td>`;
    body.appendChild(tr);
  });
  document.querySelectorAll('[data-deluser]').forEach(b=>{
    b.onclick = ()=>{
      if(!confirm('Hapus user '+b.dataset.deluser+' ?')) return;
      state.loginList = state.loginList.filter(x=>x.username!==b.dataset.deluser);
      localStorage.setItem("accounts", JSON.stringify(state.loginList));
      renderAccounts();
      toast(accMsg, "User dihapus", true);
    }
  })
}

async function createAccount(u,p,r){
  if(!u||!p) throw new Error('Username & password wajib');
  if(state.loginList.some(x=>x.username===u)) throw new Error('Username sudah ada');
  const newAcc = {username:u, password:p, role:r};
  state.loginList.push(newAcc);
  localStorage.setItem("accounts", JSON.stringify(state.loginList));
  renderAccounts();
}

const formLogin = document.getElementById('formLogin');
const loginMsg = document.getElementById('loginMsg');
const accMsg   = document.getElementById('accMsg');
const drawer   = document.getElementById('drawer');

document.getElementById('btnHamburger').onclick = ()=> drawer.classList.toggle('open');
document.getElementById('btnLogout').onclick = logout;

document.querySelectorAll('.menu a[data-view]').forEach(a=>{
  a.addEventListener('click', async (e)=>{
    e.preventDefault(); 
    const v = a.dataset.view; 
    setView(v);
    if(v==='accounts'){ await loadLogins(); renderAccounts(); }
  })
})

formLogin.addEventListener('submit', async (e)=>{
  e.preventDefault(); 
  loginMsg.textContent = 'Memeriksa…';
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  try{
    const ok = await doLogin(u,p);
    if(!ok){ 
      toast(loginMsg, 'Username atau password salah', false); 
      return; 
    }
    toast(loginMsg, 'Berhasil masuk');
    document.getElementById('who').textContent = u + ' • ' + ok.role;
    document.getElementById('userBadge').classList.remove('hidden');
    document.getElementById('roleChip').textContent = ok.role;
    if(ok.role==='admin') document.getElementById('adminSection').classList.remove('hidden');
    document.getElementById('btnHamburger').classList.remove('hidden');
    setView('dashboard');
  }catch(err){ 
    toast(loginMsg, err.message, false); 
  }
});

document.getElementById('btnCreate').onclick = async()=>{
  if(state.role!=='admin'){ toast(accMsg,'Hanya admin', false); return }
  const u = document.getElementById('newUser').value.trim();
  const p = document.getElementById('newPass').value.trim();
  const r = document.getElementById('newRole').value;
  try{ await createAccount(u,p,r); toast(accMsg,'Akun dibuat'); document.getElementById('newUser').value=''; document.getElementById('newPass').value='' }
  catch(e){ toast(accMsg, e.message, false) }
}

const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible') })
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

(function(){
  const chars = ["D","a","f","f","a"," ","D","e","v"];
  const name = chars.join("");
  const icon = "</i>";
  document.getElementById("brand").innerHTML = `${icon} <h1>${name}</h1>`;
})();

async function loadConfig(){
  try{
    const res = await fetch("settings/config.json");
    if(!res.ok) throw new Error("Gagal load config.json");
    const cfg = await res.json();

    const year = new Date().getFullYear(); // otomatis tahun sekarang

    document.getElementById("code").innerHTML = 
      `© ${year} ${cfg.copyright} <a href="${cfg.link}" target="_blank">${cfg.nama}</a>`;
  }catch(e){
    console.error("Config error:", e);
  }
}
loadConfig();
restoreSession();


state.numbers = [];
state.numbersSha = null;

async function githubGet(url, token){
  const res = await fetch(url, { headers:{Authorization:`token ${token}`, Accept:'application/vnd.github+json'} });
  if(res.status === 404) return {content:null, sha:null, notFound:true};
  if(!res.ok) throw new Error('GitHub GET failed: '+res.status);
  const data = await res.json();
  const decoded = data.content ? JSON.parse(atob(data.content)) : null;
  return {content:decoded, sha:data.sha};
}

async function githubPut(url, token, jsonContent, message, sha){
  const body = { message, content: btoa(JSON.stringify(jsonContent, null, 2)), sha: sha || undefined };
  const res = await fetch(url, {
    method:'PUT',
    headers:{'Content-Type':'application/json', Authorization:`token ${token}`, Accept:'application/vnd.github+json'},
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('GitHub PUT failed: '+res.status);
  return await res.json();
}

async function loadNumbers(){
  const res = await githubGet(API_NUMBERS, TOKEN_NUMBERS);
  if(res.notFound){ state.numbers = []; state.numbersSha = null; }
  else { state.numbers = Array.isArray(res.content) ? res.content : []; state.numbersSha = res.sha; }
  renderNumbers();
}

async function addNumber(num){
  if(!/^\d{6,20}$/.test(num)) throw new Error('Nomor hanya angka 6-20 digit');
  if(state.numbers.some(n => n.nomor === num)) throw new Error('Nomor sudah ada');
  state.numbers.push({ nomor: num });
  const result = await githubPut(API_NUMBERS, TOKEN_NUMBERS, state.numbers, `add number ${num}`, state.numbersSha);
  state.numbersSha = result.content?.sha || result.sha || state.numbersSha;
  renderNumbers();
}

function renderNumbers(){
  const tbody = document.getElementById('numbersTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  state.numbers.forEach((n,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${n.nomor}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('btnAddNumber')?.addEventListener('click', async()=>{
  const field = document.getElementById('numberInput');
  if(!field) return;
  try{ 
    await addNumber(field.value.trim());
    toast(accMsg,'Nomor ditambahkan'); 
    field.value=''; 
  } catch(e){ toast(accMsg, e.message, false) }
});

if(state.user) loadNumbers();