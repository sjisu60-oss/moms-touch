/* =========================================================
   로그인 · 회원가입 · 마이페이지
   - 회원 데이터는 서버의 db/users.json에 저장됩니다.
   - 비밀번호는 서버에서 해시로 바꿔 저장합니다.
   - 로그인 상태는 서버 세션(쿠키)으로 유지됩니다.
   ========================================================= */
const Auth = {
  user: null,                     // { name, email, joined } 또는 null
  current(){ return this.user; }
};
let afterLogin = "my";            // 로그인 후 이동할 탭 (my, share 등)

/* 시작할 때: 서버가 켜져 있는지, 로그인되어 있는지 확인 */
async function initAuth(){
  try{
    const r = await Server.get("/api/me");
    Server.online = true;
    Auth.user = r.user;
    if(Auth.user) await loadMyData();
  }catch(e){
    Server.online = false;
    Auth.user = null;
  }
}

/* 입력칸 도우미 */
const val = id => document.getElementById(id).value.trim();
function setErr(id, msg){
  const box = document.getElementById(id).closest(".field");
  box.classList.toggle("invalid", !!msg);
  box.querySelector(".err").textContent = msg || "";
  return !msg;
}
function resetForm(formId){
  const f = document.getElementById(formId);
  f.reset();
  f.querySelectorAll(".field").forEach(b => { b.classList.remove("invalid"); b.querySelector(".err").textContent = ""; });
  f.querySelectorAll(".pw-toggle").forEach(b => b.textContent = "보기");
  f.querySelectorAll(".pw-wrap input").forEach(i => i.type = "password");
  const e = document.getElementById("loginErr"); if(e) e.textContent = "";
}
function togglePw(id, btn){
  const input = document.getElementById(id);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.textContent = show ? "숨기기" : "보기";
}
function shakeEl(el){ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
function setBusy(form, busy){ form.querySelector("button[type=submit]").disabled = busy; }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVER_FIELD = { name: "suName", email: "suEmail", password: "suPw" };

/* 서버가 꺼져 있으면 로그인 · 회원가입 화면에 안내 */
function renderServerNote(){
  document.querySelectorAll(".server-note").forEach(n => { n.hidden = Server.online; });
}

/* 회원가입 */
async function submitSignup(e){
  e.preventDefault();
  const form = document.getElementById("signupForm");
  const name = val("suName"), email = val("suEmail").toLowerCase();
  const pw = document.getElementById("suPw").value, pw2 = document.getElementById("suPw2").value;
  const agree = document.getElementById("suAgree").checked;

  /* 1차 검사: 브라우저 */
  const checks = [
    setErr("suName", name.length < 2 || name.length > 12 ? "이름은 2~12자로 입력해 주세요." : ""),
    setErr("suEmail", !EMAIL_RE.test(email) ? "올바른 이메일 형식이 아니에요." : ""),
    setErr("suPw", pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "영문과 숫자를 섞어 8자 이상 입력해 주세요." : ""),
    setErr("suPw2", !pw2 ? "비밀번호를 한 번 더 입력해 주세요." : pw !== pw2 ? "비밀번호가 일치하지 않아요." : ""),
    setErr("suAgree", agree ? "" : "약관에 동의해 주세요.")
  ];
  if(checks.includes(false)){
    shakeEl(form);
    document.querySelector("#signupForm .invalid input")?.focus();
    return;
  }

  /* 2차 검사 · 저장: 서버 */
  setBusy(form, true);
  try{
    const r = await Server.post("/api/signup", { name, email, password: pw });
    Auth.user = r.user;
    await loadMyData();
    await mergeGuestPlan();
    resetForm("signupForm");
    showToast(`${name}님, 가입을 환영해요!`);
    goAfterLogin();
  }catch(err){
    if(err.field && SERVER_FIELD[err.field]) setErr(SERVER_FIELD[err.field], err.message);
    else showToast(err.message);
    shakeEl(form);
  }finally{
    setBusy(form, false);
  }
}

/* 로그인 */
async function submitLogin(e){
  e.preventDefault();
  const form = document.getElementById("loginForm");
  const email = val("liEmail").toLowerCase(), pw = document.getElementById("liPw").value;
  const errBox = document.getElementById("loginErr");
  errBox.textContent = "";
  const ok = [
    setErr("liEmail", !email ? "이메일을 입력해 주세요." : !EMAIL_RE.test(email) ? "올바른 이메일 형식이 아니에요." : ""),
    setErr("liPw", !pw ? "비밀번호를 입력해 주세요." : "")
  ];
  if(ok.includes(false)){ shakeEl(form); return; }

  setBusy(form, true);
  try{
    const r = await Server.post("/api/login", { email, password: pw });
    Auth.user = r.user;
    await loadMyData();
    await mergeGuestPlan();
    resetForm("loginForm");
    showToast(`${Auth.user.name}님, 반가워요!`);
    goAfterLogin();
  }catch(err){
    errBox.textContent = err.message;
    shakeEl(form);
  }finally{
    setBusy(form, false);
  }
}
function openLogin(next){ afterLogin = next || "my"; go("login"); }
function goAfterLogin(){ const next = afterLogin; afterLogin = "my"; refreshShared().then(() => goTab(next)); }

/* 로그인 화면: 로그인 없이 담아 둔 기구가 있으면 알려 주기 */
function renderLoginGuestNote(){
  const guest = getGuestPlan();
  const n = DAYS.reduce((sum, d) => sum + guest[d].length, 0);
  const box = document.getElementById("loginGuestNote");
  box.hidden = !n;
  box.innerHTML = `<span>로그인 없이 담아 둔 기구가 <b>${n}개</b> 있어요. 로그인하거나 가입하면 내 계획표로 옮겨져요.</span>`;
  renderServerNote();
}

/* 로그아웃 · 탈퇴 */
async function logout(){
  try{ await Server.post("/api/logout"); }catch(e){ /* 서버가 꺼져 있어도 화면에서는 로그아웃 */ }
  Auth.user = null;
  clearMyData();
  showToast("로그아웃했어요.");
  goTab("my");
}
let deleteArmed = false, deleteTimer;
async function deleteAccount(){
  const btn = document.getElementById("deleteBtn");
  if(!deleteArmed){            // 실수 방지: 한 번 더 눌러야 탈퇴
    deleteArmed = true;
    btn.firstChild.textContent = "정말 탈퇴할까요? 한 번 더 누르면 탈퇴돼요";
    clearTimeout(deleteTimer);
    deleteTimer = setTimeout(resetDeleteBtn, 4000);
    return;
  }
  try{
    await Server.del("/api/me");
  }catch(err){
    showToast(err.message); resetDeleteBtn(); return;
  }
  Auth.user = null;
  clearMyData();
  resetDeleteBtn();
  showToast("탈퇴가 완료됐어요.");
  goTab("my");
}
function resetDeleteBtn(){
  deleteArmed = false;
  const btn = document.getElementById("deleteBtn");
  if(btn) btn.firstChild.textContent = "회원 탈퇴";
}

/* 마이데이터(계획표 · 공유 설정) 서버에서 불러오기 / 비우기 */
async function loadMyData(){
  const [plan, share] = await Promise.all([Server.get("/api/plan"), Server.get("/api/share-setting")]);
  setMyPlan(plan.plan);
  setShareSetting(share.setting);
}
function clearMyData(){ setMyPlan(null); setShareSetting(null); }

/* 마이페이지 그리기 (프로필 · 통계 · 계획표 · 공유 설정) */
function renderMy(){
  const user = Auth.current();
  if(!user) return;
  const joined = new Date(user.joined);
  document.getElementById("profile").innerHTML = `
    <div class="avatar">${esc(user.name.slice(0, 1))}</div>
    <div><b>${esc(user.name)}님</b><span>${esc(user.email)}</span>
      <small>${joined.getFullYear()}.${joined.getMonth() + 1}.${joined.getDate()} 가입</small></div>`;

  const s = planStats();
  document.getElementById("myStats").innerHTML = `
    <div><b>${s.total}</b><span>계획한 기구</span></div>
    <div><b>${s.done}</b><span>완료한 기구</span></div>
    <div><b>${s.topPart || "-"}</b><span>가장 많은 부위</span></div>`;

  renderPlan();                                   // 마이페이지 안의 계획표
  const share = getShareSetting();                // 계획표 공유 설정
  document.getElementById("shareMine").checked = !!share.on;
  document.getElementById("shareTitle").value = share.title;
  document.getElementById("shareDesc").value = share.desc || "";
  document.getElementById("shareTitleWrap").hidden = !share.on;
  resetDeleteBtn();
}
