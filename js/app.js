const PARTS = [
  {name:"가슴", muscle:"대흉근"}, {name:"등", muscle:"광배근 · 승모근"}, {name:"어깨", muscle:"삼각근"},
  {name:"하체", muscle:"대퇴사두근 · 햄스트링"}, {name:"팔", muscle:"이두근 · 삼두근"},
  {name:"유산소", muscle:"심폐 지구력 · 전신"}
];

/* 부위 인체 그림 */
function bodySVG(part){
  const back = part==="등";
  /* 유산소는 전신 운동이라 몸 전체를 강조 */
  const c = k => (part===k || part==="유산소" || (part==="전체" && k!=="등")) ? "hl" : "b";
  const arm=c("팔"), sh=c("어깨"), ch=c("가슴"), lg=c("하체");
  const torso = back
    ? `<path class="hl" d="M37 31 L63 31 L61 58 L56 72 L44 72 L39 58 Z"/><rect class="b" x="40" y="72" width="20" height="8" rx="3"/>`
    : `<rect class="${ch}" x="37" y="31" width="12.5" height="15" rx="5"/><rect class="${ch}" x="50.5" y="31" width="12.5" height="15" rx="5"/>
       <rect class="b" x="40" y="47" width="20" height="33" rx="5"/>`;
  return `<svg viewBox="0 0 100 172" role="img" aria-label="${part} 부위 그림">
    <circle class="b" cx="50" cy="13" r="9"/><rect class="b" x="45.5" y="21" width="9" height="8" rx="2"/>${torso}
    <ellipse class="${sh}" cx="32" cy="34" rx="7" ry="6.5"/><ellipse class="${sh}" cx="68" cy="34" rx="7" ry="6.5"/>
    <rect class="${arm}" x="24" y="40" width="9" height="24" rx="4.5"/><rect class="${arm}" x="67" y="40" width="9" height="24" rx="4.5"/>
    <rect class="b" x="21.5" y="65" width="8" height="23" rx="4"/><rect class="b" x="70.5" y="65" width="8" height="23" rx="4"/>
    <circle class="b" cx="25" cy="92" r="4"/><circle class="b" cx="75" cy="92" r="4"/>
    <rect class="b" x="38" y="80" width="24" height="10" rx="4"/>
    <rect class="${lg}" x="38" y="89" width="11" height="36" rx="5.5"/><rect class="${lg}" x="51" y="89" width="11" height="36" rx="5.5"/>
    <rect class="${lg}" x="39" y="127" width="9" height="30" rx="4.5"/><rect class="${lg}" x="52" y="127" width="9" height="30" rx="4.5"/>
    <text class="cap" x="50" y="169">${back?"뒷모습":"앞모습"}</text></svg>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* 화면 이동 */
let current="s1", navStack=[], selectedPart="";
/* 화면 → 켜질 하단 탭 (부위 선택 · 추천 결과는 들어온 탭을 그대로 유지) */
const TAB_OF = { s1:"home", nav:"nav", share:"share", shareDetail:"share", my:"my", login:"my", signup:"my" };
const TAB_ROOTS = ["s1", "nav", "share", "my", "login"];     // 탭의 첫 화면(뒤로 버튼 없음)

function go(id, isBack){
  if(id===current) return;
  if(!isBack) navStack.push(current);
  if(id==="s1") navStack=[];
  /* 화면에 들어갈 때 최신 내용으로 다시 그리기 */
  if(id==="my") renderMy();
  if(id==="share") renderShare();
  if(id==="shareDetail") renderShareDetail();
  if(id==="login"){ resetForm("loginForm"); renderLoginGuestNote(); }
  if(id==="signup") resetForm("signupForm");

  const from=document.getElementById(current), to=document.getElementById(id);
  from.classList.remove("active"); from.classList.add("leave");
  setTimeout(()=>from.classList.remove("leave"),250);
  to.classList.add("active"); to.scrollTop=0; window.scrollTo(0,0);
  current=id;
  const title=to.dataset.title;
  document.getElementById("brand").hidden=!!title;
  document.getElementById("hTitle").hidden=!title;
  document.getElementById("hTitle").textContent=title;
  document.getElementById("backBtn").hidden=TAB_ROOTS.includes(id);
  document.getElementById("homeBtn").hidden=TAB_ROOTS.includes(id);
  document.getElementById("header").classList.remove("scrolled");
  if(TAB_OF[id]) document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===TAB_OF[id]));
  if(id==="s2") hideAlert();
}
function goBack(){ go(navStack.pop()||"s1", true); }

/* 하단 탭: 마이페이지는 로그인 여부에 따라 로그인 화면 또는 내 정보 화면 */
function goTab(tab){
  const target = { home:"s1", nav:"nav", share:"share" }[tab] || (Auth.current() ? "my" : "login");
  navStack=[];
  if(target===current){
    if(target==="my") renderMy();
    if(target==="share") renderShare();
    return;
  }
  go(target, true);
}
let toastTimer;
function showToast(msg){
  const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2000);
}
document.querySelectorAll(".screen").forEach(s=>s.addEventListener("scroll",()=>
  document.getElementById("header").classList.toggle("scrolled", s.scrollTop>4)));

/* 네비게이션 탭: 부위를 누르면 바로 추천 결과로 */
function renderNav(){
  document.getElementById("navGrid").innerHTML = PARTS.map(p=>{
    const list = EXAMPLE_RESULTS[p.name] || [];
    return `<button class="nav-card" onclick="navPick('${p.name}')">
      <div class="fig">${bodySVG(p.name)}</div>
      <div class="nav-info"><b>${p.name}</b><small>${p.muscle}</small>
        <span>${list.map(m=>esc(m.name.replace(/\s*\(.*\)/,""))).join(" · ")}</span></div>
      <svg class="go" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`;
  }).join("");
}
function navPick(name){ setPart(name); requestRecommend(); }

/* S-02 부위 선택 */
document.getElementById("partGrid").innerHTML = PARTS.map(p=>`
  <button class="part" data-part="${p.name}" onclick="togglePart('${p.name}')" aria-pressed="false">
    <span class="check"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></span>
    <div class="fig">${bodySVG(p.name)}</div><div><b>${p.name}</b><small>${p.muscle}</small></div>
  </button>`).join("");
function togglePart(name){ setPart(selectedPart===name ? "" : name); }
function setPart(name){
  selectedPart=name;
  document.querySelectorAll(".part").forEach(b=>{
    const on=b.dataset.part===name; b.classList.toggle("selected",on); b.setAttribute("aria-pressed",on);
  });
  document.getElementById("selText").innerHTML = name ? `선택한 부위: <b>${name}</b>` : "아직 선택한 부위가 없어요.";
  document.getElementById("recBtn").classList.toggle("soft", !name);
  if(name) hideAlert();
}
function hideAlert(){ document.getElementById("alert").classList.remove("show"); }

/* 예외 흐름: 부위를 선택하지 않고 추천 요청 */
function requestRecommend(){
  if(!selectedPart){
    const a=document.getElementById("alert"), g=document.getElementById("partGrid");
    a.classList.remove("show"); void a.offsetWidth; a.classList.add("show");
    g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake");
    return;
  }
  const ld=document.getElementById("loading");
  document.getElementById("loadingText").textContent=`${selectedPart} 운동 기구를 고르고 있어요`;
  ld.classList.add("show");
  setTimeout(()=>{ renderResult(selectedPart); ld.classList.remove("show"); go("s3"); }, 800);
}

/* S-03 추천 결과 (고정 예시 데이터) */
function renderResult(part){
  const list = EXAMPLE_RESULTS[part] || [];
  document.getElementById("resultFig").innerHTML = bodySVG(part);
  document.getElementById("resultTitle").textContent = `${part} 운동 기구`;
  document.getElementById("resultDesc").textContent = `추천 기구 ${list.length}개 · 눌러서 사용법 보기`;
  document.getElementById("resultList").innerHTML = list.length ? list.map((m,i)=>`
    <div class="item${i===0?" open":""}">
      <button class="item-main" onclick="this.parentElement.classList.toggle('open')" aria-expanded="${i===0}">
        <div class="thumb"><img src="${m.image}" alt="${esc(m.name)} 사진"><span class="rank">${i+1}</span></div>
        <div class="item-info">
          <b>${esc(m.name)}</b>
          <div class="muscle">${esc(m.primary.join(", "))}</div>
          <div class="chips"><span class="match">${part} 운동</span><span>${esc(m.purpose)}</span><span>${esc(m.level)}</span></div>
        </div>
        <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="item-more"><div><div class="more-body">
        <h4>시작 자세</h4><p>${esc(m.setup)}</p>
        <h4>동작</h4><p>${esc(m.step)}</p>
        ${m.caution?`<h4>주의할 점</h4><p class="caution">⚠ ${esc(m.caution)}</p>`:""}
      </div></div></div>
      <div class="item-actions">
        <button class="add-btn" onclick="openAddSheet('${m.id}')">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>계획표에 추가</button>
      </div>
    </div>`).join("")
    : `<div class="empty">이 부위의 예시 데이터가 없어요.</div>`;
}

document.querySelectorAll("[data-fig]").forEach(el=>el.innerHTML=bodySVG(el.dataset.fig));

/* 시작: JSON 데이터를 불러온 뒤 화면 준비 */
loadData()
  .then(()=>{ renderNav(); })
  .catch(err=>{
    document.getElementById("loadError").hidden=false;
    document.getElementById("loadErrorDetail").textContent="오류 내용: "+err.message;
  });
