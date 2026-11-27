/* =========================================================
   스케줄 공유
   - 다른 사용자의 운동 계획표 보기 · 좋아요 · 내 계획표에 저장
   - 공유 목록 = 예시 데이터(data/shared_plans.json)
               + 서버에서 받은 "공유하기"를 켠 회원의 계획표
   - 저장 위치 (서버)
       db/share_settings.json → 내 공유 설정 { on, title, desc }
       likes                  → { 계획표id: [좋아요 누른 회원] }
       saves                  → { 계획표id: [내 계획표에 저장한 회원] }  (0.12, 홈 인기 스케줄 순위)
   ========================================================= */
let shareDetailId = null;
let shared = { userPlans: [], likes: {}, saves: {} };   // 서버에서 받은 공유 목록 · 좋아요 · 저장 수
let myShareSetting = null;                    // 내 공유 설정 (서버에서 받은 것)

/* 서버에서 공유 목록 · 좋아요 다시 받기 */
async function refreshShared(){
  if(!Server.online){ shared = { userPlans: [], likes: {}, saves: {} }; return; }
  try{ shared = { saves: {}, ...(await Server.get("/api/shared-plans")) }; }
  catch(e){ /* 실패하면 이전 목록 유지 */ }
}

/* 공유 목록 만들기 */
function sharedPlans(){
  return [...shared.userPlans.map(p => ({ ...p })), ...SHARED_SAMPLES.map(p => ({ ...p, sample: true }))];
}
function likeInfo(p){
  const l = shared.likes[p.id] || { count: 0, mine: false };
  return { count: (p.likes || 0) + l.count, mine: !!Auth.current() && l.mine };
}
/* 저장 수 = 예시로 정해 둔 기본 숫자 + 실제로 저장한 회원 수 */
function saveInfo(p){
  const s = (shared.saves || {})[p.id] || { count: 0, mine: false };
  return { count: (p.saves || 0) + s.count, mine: !!Auth.current() && s.mine };
}
function planParts(p){
  const set = new Set();
  Object.values(p.days).forEach(items => items.forEach(it => { const m = findMachine(it.id); if(m) set.add(m.part); }));
  return [...set];
}
const planCount = p => Object.values(p.days).reduce((n, items) => n + items.length, 0);
const isMine = p => !!Auth.current() && !!p.mine;

/* 로그인이 필요한 기능 */
function needLogin(next, msg){
  if(Auth.current()) return false;
  showToast(Server.online ? (msg || "로그인이 필요해요.") : "서버가 꺼져 있어 로그인할 수 없어요.");
  openLogin(next);
  return true;
}
function rerenderShareViews(){
  renderShare();
  renderHomePopular();
  if(current === "shareDetail") renderShareDetail();
}

/* 좋아요 */
async function toggleLike(id){
  if(needLogin("share", "좋아요를 누르려면 로그인해 주세요.")) return;
  const p = sharedPlans().find(x => x.id === id); if(!p) return;
  if(isMine(p)){ showToast("내 계획표에는 좋아요를 누를 수 없어요."); return; }
  try{
    shared.likes[id] = await Server.post(`/api/likes/${encodeURIComponent(id)}`);
  }catch(err){
    showToast(err.message); return;
  }
  rerenderShareViews();
}

/* 다른 사람 계획표를 내 계획표에 저장 */
async function saveSharedPlan(id){
  if(needLogin("share", "계획표를 저장하려면 로그인해 주세요.")) return;
  const p = sharedPlans().find(x => x.id === id); if(!p) return;
  if(isMine(p)){ showToast("이미 내 계획표예요."); return; }
  const mine = getPlan();
  let added = 0, skipped = 0;
  Object.entries(p.days).forEach(([d, items]) => items.forEach(it => {
    if(mine[d].some(x => x.id === it.id)){ skipped++; return; }
    mine[d].push({ id: it.id, sets: it.sets, reps: it.reps, done: false }); added++;
  }));
  if(!added){ showToast("이미 모두 내 계획표에 있어요."); return; }
  if(!(await savePlan(mine))) return;
  showToast(`내 계획표에 ${added}개 기구를 저장했어요.${skipped ? ` (겹치는 ${skipped}개 제외)` : ""}`);
  try{                                   // 저장 수 기록 (실패해도 계획표 저장은 이미 끝남)
    shared.saves = shared.saves || {};
    shared.saves[id] = await Server.post(`/api/saves/${encodeURIComponent(id)}`);
    rerenderShareViews();
  }catch(err){ /* 저장 수만 못 올린 경우: 조용히 넘어감 */ }
}

/* 목록 화면
   - 정렬: 인기순(좋아요) · 저장순 · 최신순
   - 처음에는 3개만 보여 주고 '더보기'를 누를 때마다 3개씩 더 보여 줌 (정렬을 바꾸면 다시 3개부터) */
const SHARE_PAGE = 3;
let shareSort = "likes";
let shareShown = SHARE_PAGE;
function setShareSort(s){ shareSort = s; shareShown = SHARE_PAGE; renderShare(); }
function showMoreShare(){ shareShown += SHARE_PAGE; renderShare(); }
function renderShare(){
  const plans = sharedPlans().map(p => ({ p, l: likeInfo(p), s: saveInfo(p) }));
  const byNew = (a, b) => String(b.p.createdAt).localeCompare(String(a.p.createdAt));
  plans.sort(shareSort === "likes" ? (a, b) => b.l.count - a.l.count
           : shareSort === "saves" ? (a, b) => b.s.count - a.s.count : byNew);
  document.querySelectorAll("#shareSort button").forEach(b => b.classList.toggle("on", b.dataset.sort === shareSort));
  document.getElementById("shareList").innerHTML = plans.slice(0, shareShown).map(({ p, l, s }) => shareCardHTML(p, l, "", s)).join("");
  const more = document.getElementById("shareMore");
  const left = plans.length - shareShown;
  more.hidden = left <= 0;
  if(left > 0) more.innerHTML = `더보기 <small>${left}개 더</small><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`;
}
/* 홈 '저장 많은 순 TOP 3 >' → 스케줄 공유를 저장순으로 */
function openShareBySaves(){
  shareSort = "saves"; shareShown = SHARE_PAGE;
  goTab("share");
}

/* 공유 계획표 카드 (스케줄 공유 목록 · 홈 인기 스케줄에서 함께 사용) */
function shareCardHTML(p, l, badge, s){
  s = s || saveInfo(p);
  return `
    <article class="share-card">
      <button class="share-main" onclick="openShareDetail('${p.id}')">
        <div class="share-top">
          <div class="mini-avatar">${esc(p.author.slice(0, 1))}</div>
          <div><b>${esc(p.author)}</b><small>${p.sample ? "예시 데이터" : isMine(p) ? "내가 공유한 계획표" : "회원 공유"}</small></div>
          ${badge ? `<span class="rank-badge">${badge}</span>` : ""}
        </div>
        <h3>${esc(p.title)}</h3>
        ${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
        <div class="week-mini">${DAYS.map(d => `<span class="${p.days[d] ? "on" : ""}">${d}</span>`).join("")}</div>
        <div class="chips">${planParts(p).map(x => `<span class="match">${x}</span>`).join("")}<span>기구 ${planCount(p)}개</span></div>
      </button>
      <div class="share-actions">
        <button class="like${l.mine ? " on" : ""}" onclick="toggleLike('${p.id}')" aria-pressed="${l.mine}" aria-label="좋아요">
          <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>${l.count}</button>
        <button class="save" onclick="saveSharedPlan('${p.id}')">
          <svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>내 계획표에 저장 <span class="save-n">${s.count}</span></button>
      </div>
    </article>`;
}

/* 홈: 저장 수가 가장 많은 스케줄 3개
   - 회원 정보(작성자)는 보여 주지 않고, 좋아요 대신 저장 버튼 + 저장 수만 오른쪽에 표시 */
function popCardHTML(p, s, rank){
  return `
    <article class="pop-card">
      <button class="pop-main" onclick="openShareDetail('${p.id}')">
        <span class="pop-rank r${rank}">${rank}</span>
        <div class="pop-body">
          <h3>${esc(p.title)}</h3>
          ${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
          <div class="week-mini">${DAYS.map(d => `<span class="${p.days[d] ? "on" : ""}">${d}</span>`).join("")}</div>
          <div class="chips">${planParts(p).slice(0, 3).map(x => `<span class="match">${x}</span>`).join("")}<span>기구 ${planCount(p)}개</span>${p.sample ? `<span class="ex">예시</span>` : ""}</div>
        </div>
      </button>
      <button class="pop-save${s.mine ? " on" : ""}" onclick="saveSharedPlan('${p.id}')" aria-label="내 계획표에 저장 (저장 ${s.count}회)">
        <svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>
        <b>${s.count}</b><small>저장</small>
      </button>
    </article>`;
}
/* 인기 스케줄 롤링: 3개를 한 장씩 3.5초마다 넘김
   - 점(●○○)을 누르거나 옆으로 밀어서 넘길 수도 있음
   - 손가락 · 마우스를 올려 두면 잠시 멈춤 */
const POP_INTERVAL = 3500;
let popIndex = 0, popCount = 0, popTimer = null, popHold = false;

function renderHomePopular(){
  const top = sharedPlans().filter(p => !isMine(p)).map(p => ({ p, s: saveInfo(p) }))
    .sort((a, b) => b.s.count - a.s.count).slice(0, 3);
  const box = document.getElementById("homePopular");
  popCount = top.length;
  if(!popCount){
    box.innerHTML = `<div class="plan-empty"><b>아직 공유된 계획표가 없어요</b></div>`;
    stopPopRoll(); return;
  }
  if(popIndex >= popCount) popIndex = 0;
  box.innerHTML = `
    <div class="pop-roll" aria-roledescription="carousel" aria-label="지금 인기 스케줄">
      <div class="pop-track" id="popTrack">
        ${top.map(({ p, s }, i) => `<div class="pop-slide" role="group" aria-label="${i + 1} / ${popCount}">${popCardHTML(p, s, i + 1)}</div>`).join("")}
      </div>
    </div>
    <div class="pop-dots">${top.map((_, i) => `<button class="${i === popIndex ? "on" : ""}" onclick="goPop(${i}, true)" aria-label="${i + 1}위 보기"></button>`).join("")}</div>`;
  showPop(false);
  bindPopGestures(box.querySelector(".pop-roll"));
  startPopRoll();
}
function showPop(animate = true){
  const track = document.getElementById("popTrack"); if(!track) return;
  track.style.transition = animate ? "" : "none";
  track.style.transform = `translateX(-${popIndex * 100}%)`;
  document.querySelectorAll(".pop-dots button").forEach((b, i) => b.classList.toggle("on", i === popIndex));
  document.querySelectorAll(".pop-slide").forEach((el, i) => el.setAttribute("aria-hidden", i !== popIndex));
}
function goPop(i, byUser){
  if(!popCount) return;
  popIndex = (i + popCount) % popCount;
  showPop(true);
  if(byUser) startPopRoll();          // 직접 넘기면 시간을 처음부터 다시 셈
}
function startPopRoll(){
  stopPopRoll();
  if(popCount > 1) popTimer = setInterval(() => { if(!popHold && !document.hidden) goPop(popIndex + 1); }, POP_INTERVAL);
}
function stopPopRoll(){ if(popTimer){ clearInterval(popTimer); popTimer = null; } }
function bindPopGestures(el){
  if(!el) return;
  let x0 = null;
  el.addEventListener("pointerenter", () => { popHold = true; });
  el.addEventListener("pointerleave", () => { popHold = false; });
  el.addEventListener("touchstart", e => { popHold = true; x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", e => {
    popHold = false;
    if(x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if(Math.abs(dx) > 40) goPop(popIndex + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
}

/* 상세 화면 */
function openShareDetail(id){ shareDetailId = id; go("shareDetail"); }
function renderShareDetail(){
  const p = sharedPlans().find(x => x.id === shareDetailId);
  const box = document.getElementById("shareDetailBody");
  if(!p){ box.innerHTML = `<div class="plan-empty"><b>계획표를 찾을 수 없어요</b></div>`; return; }
  const l = likeInfo(p);
  box.innerHTML = `
    <div class="share-top big">
      <div class="mini-avatar">${esc(p.author.slice(0, 1))}</div>
      <div><b>${esc(p.author)}</b><small>${p.sample ? "예시 데이터" : isMine(p) ? "내가 공유한 계획표" : "회원 공유"}</small></div>
      <button class="like${l.mine ? " on" : ""}" onclick="toggleLike('${p.id}')" aria-pressed="${l.mine}" aria-label="좋아요">
        <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>${l.count}</button>
    </div>
    <h1 class="share-title">${esc(p.title)}</h1>
    ${p.desc ? `<p class="lead">${esc(p.desc)}</p>` : ""}
    ${DAYS.filter(d => p.days[d]).map(d => `
      <div class="day-block">
        <div class="day-head"><b>${d}요일</b><span>기구 ${p.days[d].length}개</span></div>
        ${p.days[d].map(it => { const m = findMachine(it.id); return m ? `
          <div class="plan-item">
            <img src="${m.image}" alt="">
            <div class="plan-info"><b>${esc(m.name)}</b>
              <div class="chips"><span class="match">${m.part}</span><span>${amountText(m, it)}</span></div></div>
          </div>` : ""; }).join("")}
      </div>`).join("")}`;
  const saveBtn = document.getElementById("shareSaveBtn");
  saveBtn.hidden = isMine(p);
  saveBtn.onclick = () => saveSharedPlan(p.id);
}

/* ---------- 마이페이지: 내 계획표 공유 설정 ---------- */
function setShareSetting(s){ myShareSetting = s; }
function getShareSetting(){
  const me = Auth.current();
  return myShareSetting || { on: false, title: me ? `${me.name}님의 운동 계획표` : "", desc: "" };
}
async function updateShareSetting(patch){
  try{
    const r = await Server.put("/api/share-setting", patch);
    myShareSetting = r.setting;
    await refreshShared();
    return true;
  }catch(err){
    showToast(err.message);
    return false;
  }
}
async function toggleShareMine(on){
  const box = document.getElementById("shareMine");
  if(!(await updateShareSetting({ on }))){ box.checked = !on; return; }
  document.getElementById("shareTitleWrap").hidden = !on;
  showToast(on && !planStats().total ? "계획표가 비어 있으면 공유 목록에 보이지 않아요."
          : on ? "스케줄 공유에 내 계획표를 올렸어요." : "내 계획표 공유를 껐어요.");
}
async function saveShareText(field, value){
  if(await updateShareSetting({ [field]: value.trim() }))
    showToast(field === "title" ? "제목을 저장했어요." : "소개를 저장했어요.");
  else renderMy();
}
