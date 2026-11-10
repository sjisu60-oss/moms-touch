/* =========================================================
   로그인 · 회원가입 · 마이페이지
   - 회원 목록: Store "users" → [{ name, email, pw(암호화된 값), joined }]
   - 로그인 상태: Store "session" → 로그인한 사람의 이메일
   - 비밀번호는 그대로 저장하지 않고 SHA-256으로 바꿔서(해시) 저장합니다.
   ※ 시연용입니다. 실제 서비스는 서버에서 계정을 관리해야 합니다.
   ========================================================= */
const Auth = {
  users(){ return Store.get("users", []); },
  current(){
    const email = Store.get("session", null);
    return email ? this.users().find(u => u.email === email) || null : null;
  }
};
let afterLogin = "my";          // 로그인 후 이동할 탭 (my, share 등)

/* 비밀번호 해시 */
async function hashPassword(pw){
  const text = "machinemate:" + pw;
  if(window.crypto && crypto.subtle){
    try{
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }catch(e){ /* 아래 간단한 방식으로 대체 */ }
  }
  let h = 5381;
  for(const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return "djb2-" + (h >>> 0).toString(16);
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* 회원가입 */
async function submitSignup(e){
  e.preventDefault();
  const name = val("suName"), email = val("suEmail").toLowerCase();
  const pw = document.getElementById("suPw").value, pw2 = document.getElementById("suPw2").value;
  const agree = document.getElementById("suAgree").checked;

  const checks = [
    setErr("suName", name.length < 2 || name.length > 12 ? "이름은 2~12자로 입력해 주세요." : ""),
    setErr("suEmail", !EMAIL_RE.test(email) ? "올바른 이메일 형식이 아니에요."
      : Auth.users().some(u => u.email === email) ? "이미 가입된 이메일이에요." : ""),
    setErr("suPw", pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "영문과 숫자를 섞어 8자 이상 입력해 주세요." : ""),
    setErr("suPw2", !pw2 ? "비밀번호를 한 번 더 입력해 주세요." : pw !== pw2 ? "비밀번호가 일치하지 않아요." : ""),
    setErr("suAgree", agree ? "" : "약관에 동의해 주세요.")
  ];
  if(checks.includes(false)){
    shakeEl(document.getElementById("signupForm"));
    document.querySelector("#signupForm .invalid input")?.focus();
    return;
  }
  const users = Auth.users();
  users.push({ name, email, pw: await hashPassword(pw), joined: new Date().toISOString() });
  Store.set("users", users);
  Store.set("session", email);
  mergeGuestPlan(email);
  resetForm("signupForm");
  showToast(`${name}님, 가입을 환영해요!`);
  goAfterLogin();
}

/* 로그인 */
async function submitLogin(e){
  e.preventDefault();
  const email = val("liEmail").toLowerCase(), pw = document.getElementById("liPw").value;
  const errBox = document.getElementById("loginErr");
  errBox.textContent = "";
  const ok = [
    setErr("liEmail", !email ? "이메일을 입력해 주세요." : !EMAIL_RE.test(email) ? "올바른 이메일 형식이 아니에요." : ""),
    setErr("liPw", !pw ? "비밀번호를 입력해 주세요." : "")
  ];
  if(ok.includes(false)){ shakeEl(document.getElementById("loginForm")); return; }

  const user = Auth.users().find(u => u.email === email);
  if(!user || user.pw !== await hashPassword(pw)){
    errBox.textContent = "이메일 또는 비밀번호가 올바르지 않아요.";
    shakeEl(document.getElementById("loginForm"));
    return;
  }
  Store.set("session", email);
  mergeGuestPlan(email);
  resetForm("loginForm");
  showToast(`${user.name}님, 반가워요!`);
  goAfterLogin();
}
function openLogin(next){ afterLogin = next || "my"; go("login"); }
function goAfterLogin(){ const next = afterLogin; afterLogin = "my"; goTab(next); }

/* 로그인 화면: 로그인 없이 담아 둔 기구가 있으면 알려 주기 */
function renderLoginGuestNote(){
  const guest = getPlan("plan.guest");
  const n = DAYS.reduce((sum, d) => sum + guest[d].length, 0);
  const box = document.getElementById("loginGuestNote");
  box.hidden = !n;
  box.innerHTML = `<span>로그인 없이 담아 둔 기구가 <b>${n}개</b> 있어요. 로그인하거나 가입하면 내 계획표로 옮겨져요.</span>`;
}

/* 로그아웃 · 탈퇴 */
function logout(){
  Store.remove("session");
  showToast("로그아웃했어요.");
  goTab("my");
}
let deleteArmed = false, deleteTimer;
function deleteAccount(){
  const btn = document.getElementById("deleteBtn");
  if(!deleteArmed){            // 실수 방지: 한 번 더 눌러야 탈퇴
    deleteArmed = true;
    btn.firstChild.textContent = "정말 탈퇴할까요? 한 번 더 누르면 탈퇴돼요";
    clearTimeout(deleteTimer);
    deleteTimer = setTimeout(resetDeleteBtn, 4000);
    return;
  }
  const user = Auth.current();
  Store.set("users", Auth.users().filter(u => u.email !== user.email));
  Store.remove("plan." + user.email);
  Store.remove("shareSetting." + user.email);
  const likes = Store.get("likes", {});
  Object.keys(likes).forEach(k => { likes[k] = likes[k].filter(e => e !== user.email); });
  Store.set("likes", likes);
  Store.remove("session");
  resetDeleteBtn();
  showToast("탈퇴가 완료됐어요.");
  goTab("my");
}
function resetDeleteBtn(){
  deleteArmed = false;
  const btn = document.getElementById("deleteBtn");
  if(btn) btn.firstChild.textContent = "회원 탈퇴";
}

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
