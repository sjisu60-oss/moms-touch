/* =========================================================
   스케줄 공유
   - 다른 사용자의 운동 계획표 보기 · 좋아요 · 내 계획표에 저장
   - 공유 목록 = 예시 데이터(data/shared_plans.json)
               + 이 브라우저에서 "공유하기"를 켠 회원의 계획표
   - 저장 위치
       Store "shareSetting.<이메일>" → { on: true/false, title: "..." }
       Store "likes" → { 계획표id: [좋아요 누른 이메일, ...] }
   ========================================================= */
let shareDetailId = null;

/* 공유 목록 만들기 */
function sharedPlans(){
  const fromUsers = Auth.users()
    .map(u => ({ u, s: Store.get("shareSetting." + u.email, null) }))
    .filter(x => x.s && x.s.on)
    .map(({ u, s }) => {
      const days = getPlan("plan." + u.email);
      DAYS.forEach(d => { if(!days[d].length) delete days[d]; });
      return { id: "user:" + u.email, author: u.name, owner: u.email, title: s.title || `${u.name}님의 운동 계획표`,
               desc: s.desc || "", likes: 0, days, createdAt: s.updatedAt || "" };
    })
    .filter(p => Object.keys(p.days).length);
  return [...fromUsers, ...SHARED_SAMPLES.map(p => ({ ...p, sample: true }))];
}
function likeInfo(p){
  const all = Store.get("likes", {});
  const list = all[p.id] || [];
  const me = Auth.current();
  return { count: p.likes + list.length, mine: !!me && list.includes(me.email) };
}
function planParts(p){
  const set = new Set();
  Object.values(p.days).forEach(items => items.forEach(it => { const m = findMachine(it.id); if(m) set.add(m.part); }));
  return [...set];
}
const planCount = p => Object.values(p.days).reduce((n, items) => n + items.length, 0);
const isMine = p => { const me = Auth.current(); return !!me && p.owner === me.email; };

/* 로그인이 필요한 기능 */
function needLogin(next, msg){
  if(Auth.current()) return false;
  showToast(msg || "로그인이 필요해요.");
  openLogin(next);
  return true;
}

/* 좋아요 */
function toggleLike(id){
  if(needLogin("share", "좋아요를 누르려면 로그인해 주세요.")) return;
  const p = sharedPlans().find(x => x.id === id); if(!p) return;
  if(isMine(p)){ showToast("내 계획표에는 좋아요를 누를 수 없어요."); return; }
  const me = Auth.current().email, all = Store.get("likes", {});
  const list = all[id] || [];
  all[id] = list.includes(me) ? list.filter(e => e !== me) : [...list, me];
  Store.set("likes", all);
  renderShare();
  renderHomePopular();
  if(current === "shareDetail") renderShareDetail();
}

/* 다른 사람 계획표를 내 계획표에 저장 */
function saveSharedPlan(id){
  if(needLogin("share", "계획표를 저장하려면 로그인해 주세요.")) return;
  const p = sharedPlans().find(x => x.id === id); if(!p) return;
  if(isMine(p)){ showToast("이미 내 계획표예요."); return; }
  const mine = getPlan();
  let added = 0, skipped = 0;
  Object.entries(p.days).forEach(([d, items]) => items.forEach(it => {
    if(mine[d].some(x => x.id === it.id)){ skipped++; return; }
    mine[d].push({ id: it.id, sets: it.sets, reps: it.reps, done: false }); added++;
  }));
  savePlan(mine);
  showToast(added ? `내 계획표에 ${added}개 기구를 저장했어요.${skipped ? ` (겹치는 ${skipped}개 제외)` : ""}`
                  : "이미 모두 내 계획표에 있어요.");
}

/* 목록 화면 */
let shareSort = "likes";
function setShareSort(s){ shareSort = s; renderShare(); }
function renderShare(){
  const plans = sharedPlans().map(p => ({ p, l: likeInfo(p) }));
  plans.sort((a, b) => shareSort === "likes" ? b.l.count - a.l.count : String(b.p.createdAt).localeCompare(String(a.p.createdAt)));
  document.querySelectorAll("#shareSort button").forEach(b => b.classList.toggle("on", b.dataset.sort === shareSort));
  document.getElementById("shareList").innerHTML = plans.map(({ p, l }) => shareCardHTML(p, l)).join("");
}

/* 공유 계획표 카드 (스케줄 공유 목록 · 홈 인기 스케줄에서 함께 사용) */
function shareCardHTML(p, l, badge){
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
          <svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-4-6 4z"/></svg>내 계획표에 저장</button>
      </div>
    </article>`;
}

/* 홈: 좋아요가 가장 많은 스케줄 1개 */
function renderHomePopular(){
  const top = sharedPlans().map(p => ({ p, l: likeInfo(p) })).sort((a, b) => b.l.count - a.l.count)[0];
  document.getElementById("homePopular").innerHTML = top
    ? shareCardHTML(top.p, top.l, "★ 인기 1위")
    : `<div class="plan-empty"><b>아직 공유된 계획표가 없어요</b></div>`;
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

/* 마이페이지: 내 계획표 공유 설정 */
function getShareSetting(){
  const me = Auth.current();
  return Store.get("shareSetting." + me.email, { on: false, title: `${me.name}님의 운동 계획표`, desc: "" });
}
function updateShareSetting(patch){
  const me = Auth.current(); if(!me) return;
  const s = { ...getShareSetting(), ...patch, updatedAt: new Date().toISOString().slice(0, 10) };
  Store.set("shareSetting." + me.email, s);
  return s;
}
function toggleShareMine(on){
  const s = updateShareSetting({ on });
  if(on && !planStats().total){ showToast("계획표가 비어 있으면 공유 목록에 보이지 않아요."); }
  else showToast(on ? "스케줄 공유에 내 계획표를 올렸어요." : "내 계획표 공유를 껐어요.");
  document.getElementById("shareTitleWrap").hidden = !s.on;
}
