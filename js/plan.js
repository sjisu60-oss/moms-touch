/* =========================================================
   계획표
   - 추천 결과에서 고른 기구를 요일별 계획표에 추가합니다.
   - 저장 위치
       회원   : 서버 db/plans.json (PUT /api/plan)
       비회원 : 브라우저 localStorage "plan.guest" → 로그인하면 내 계획표로 옮김
   - 저장 형태: { 월: [{ id, sets, reps, done }], 화: [...], ... }
     기구 이름·사진 같은 정보는 data/exercises.json에서 id로 찾아옵니다.
   ========================================================= */
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const todayDay = () => DAYS[(new Date().getDay() + 6) % 7];
let planDay = todayDay();
let myPlan = null;                // 로그인한 회원의 계획표 (서버에서 불러온 것)

const emptyPlan = () => Object.fromEntries(DAYS.map(d => [d, []]));
function normalize(p){ const out = emptyPlan(); DAYS.forEach(d => { out[d] = (p && p[d]) ? p[d].map(x => ({ ...x })) : []; }); return out; }

function setMyPlan(p){ myPlan = p ? normalize(p) : null; }
function getGuestPlan(){ return normalize(Store.get("plan.guest", null)); }
function getPlan(){ return Auth.current() && myPlan ? normalize(myPlan) : getGuestPlan(); }

/* 저장: 회원은 서버, 비회원은 브라우저 */
async function savePlan(p){
  if(Auth.current()){
    const before = myPlan;
    myPlan = normalize(p);               // 화면은 바로 바뀌고
    try{
      const r = await Server.put("/api/plan", myPlan);    // 서버에 저장
      myPlan = normalize(r.plan);
      return true;
    }catch(err){
      myPlan = before;                   // 실패하면 되돌리기
      showToast("저장하지 못했어요. " + err.message);
      if(current === "my") renderMy();
      return false;
    }
  }
  Store.set("plan.guest", normalize(p));
  return true;
}

/* id로 기구 정보 찾기 */
function findMachine(id){
  for(const part in EXAMPLE_RESULTS){
    const m = EXAMPLE_RESULTS[part].find(x => x.id === id);
    if(m) return { ...m, part };
  }
  return null;
}
const isCardio = m => m.part === "유산소";
const amountText = (m, it) => isCardio(m) ? `${it.reps}분` : `${it.sets}세트 × ${it.reps}회`;

/* 로그인하기 전에 담아 둔 계획표를 내 계정으로 옮기기 */
async function mergeGuestPlan(){
  const guest = getGuestPlan();
  if(!DAYS.some(d => guest[d].length)) return;
  const mine = getPlan();
  DAYS.forEach(d => guest[d].forEach(it => { if(!mine[d].some(x => x.id === it.id)) mine[d].push(it); }));
  if(await savePlan(mine)) Store.remove("plan.guest");
}

/* 마이페이지용 통계 */
function planStats(){
  const p = getPlan(), count = {};
  let total = 0, done = 0;
  DAYS.forEach(d => p[d].forEach(it => {
    const m = findMachine(it.id); if(!m) return;
    total++; if(it.done) done++;
    count[m.part] = (count[m.part] || 0) + 1;
  }));
  const topPart = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  return { total, done, topPart };
}

/* ---------- 계획표에 추가 (아래에서 올라오는 창) ---------- */
const sheet = { id: null, day: "월", sets: 3, reps: 12 };

function openAddSheet(id){
  const m = findMachine(id); if(!m) return;
  Object.assign(sheet, { id, day: todayDay(), sets: 3, reps: isCardio(m) ? 20 : 12 });
  document.getElementById("sheetThumb").src = m.image;
  document.getElementById("sheetName").textContent = m.name;
  document.getElementById("setsRow").hidden = isCardio(m);
  document.getElementById("repsLabel").textContent = isCardio(m) ? "운동 시간" : "반복 횟수";
  renderSheet();
  document.getElementById("sheetDim").classList.add("show");
  document.getElementById("sheet").classList.add("show");
}
function closeAddSheet(){
  document.getElementById("sheetDim").classList.remove("show");
  document.getElementById("sheet").classList.remove("show");
}
function renderSheet(){
  const m = findMachine(sheet.id), plan = getPlan();
  document.getElementById("sheetDays").innerHTML = DAYS.map(d => {
    const has = plan[d].some(x => x.id === sheet.id);
    return `<button class="${d === sheet.day ? "on" : ""}${has ? " has" : ""}" onclick="sheet.day='${d}';renderSheet()"
      aria-pressed="${d === sheet.day}">${d}${d === todayDay() ? "<small>오늘</small>" : ""}</button>`;
  }).join("");
  document.getElementById("setsVal").textContent = `${sheet.sets}세트`;
  document.getElementById("repsVal").textContent = isCardio(m) ? `${sheet.reps}분` : `${sheet.reps}회`;
}
function stepVal(field, dir){
  const m = findMachine(sheet.id);
  const rule = field === "sets" ? { min: 1, max: 10, step: 1 }
    : isCardio(m) ? { min: 5, max: 120, step: 5 } : { min: 1, max: 50, step: 1 };
  sheet[field] = Math.min(rule.max, Math.max(rule.min, sheet[field] + dir * rule.step));
  renderSheet();
}
async function confirmAdd(){
  const plan = getPlan();
  if(plan[sheet.day].some(x => x.id === sheet.id)){
    showToast(`이미 ${sheet.day}요일 계획표에 있어요.`);
    return;
  }
  plan[sheet.day].push({ id: sheet.id, sets: sheet.sets, reps: sheet.reps, done: false });
  const day = sheet.day;
  closeAddSheet();
  if(!(await savePlan(plan))) return;
  planDay = day;
  showToast(Auth.current() ? `${day}요일 계획표에 추가했어요.`
                           : `${day}요일에 담았어요. 로그인하면 마이페이지에서 볼 수 있어요.`);
}

/* ---------- 계획표 (마이페이지 안) ---------- */
function renderPlan(){
  const plan = getPlan();
  document.getElementById("weekStrip").innerHTML = DAYS.map(d => `
    <button class="${d === planDay ? "on" : ""}" onclick="planDay='${d}';renderPlan()" aria-pressed="${d === planDay}">
      <span>${d}</span><b>${plan[d].length || ""}</b>${d === todayDay() ? "<small>오늘</small>" : ""}</button>`).join("");

  const items = plan[planDay].map((it, i) => ({ it, i, m: findMachine(it.id) })).filter(x => x.m);
  const done = items.filter(x => x.it.done).length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  document.getElementById("planSummary").innerHTML = `
    <div><b>${planDay}요일 운동</b><span>${items.length ? `기구 ${items.length}개 · 완료 ${done}/${items.length}` : "아직 계획이 없어요"}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>`;

  document.getElementById("planList").innerHTML = items.length ? items.map(({ it, i, m }) => `
    <div class="plan-item${it.done ? " done" : ""}">
      <label class="done-check" aria-label="${esc(m.name)} 완료">
        <input type="checkbox" ${it.done ? "checked" : ""} onchange="toggleDone(${i})"><span></span></label>
      <img src="${m.image}" alt="">
      <div class="plan-info"><b>${esc(m.name)}</b>
        <div class="chips"><span class="match">${m.part}</span><span>${amountText(m, it)}</span></div></div>
      <button class="del" onclick="removeItem(${i})" aria-label="${esc(m.name)} 삭제">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>`).join("")
    : `<div class="plan-empty">
        <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>
        <b>${planDay}요일에 계획한 기구가 없어요</b>
        <p>운동 부위를 고르고 추천받은 기구를<br>계획표에 추가해 보세요.</p>
        <button class="btn btn-primary" onclick="goTab('nav')">기구 추천받으러 가기</button></div>`;
}
async function toggleDone(i){
  const plan = getPlan();
  plan[planDay][i].done = !plan[planDay][i].done;
  const p = savePlan(plan); renderMy(); await p;
}
async function removeItem(i){
  const plan = getPlan();
  const m = findMachine(plan[planDay][i].id);
  plan[planDay].splice(i, 1);
  const p = savePlan(plan); renderMy();
  if(await p) showToast(`계획표에서 뺐어요: ${m ? m.name : "기구"}`);
}
