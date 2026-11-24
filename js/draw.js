/* =========================================================
   홈: 오늘의 랜덤 기구 (부위별 랜덤 뽑기)
   - 부위(전체 · 가슴 · 등 · 어깨 · 하체 · 팔 · 유산소)를 고르고
     '랜덤 뽑기'를 누르면 그 부위의 기구 하나를 무작위로 골라 보여 줌
   - 바로 전에 뽑은 기구는 다시 나오지 않게 함 (고를 기구가 2개 이상일 때)
   - 결과 카드에서 '사용법 보기'(추천 결과 화면) · '계획표에 추가'로 이어짐
   - 기구 데이터: EXAMPLE_RESULTS (js/data.js에서 불러온 기구 18종)
   ========================================================= */
let drawPart = "전체";
let drawLastId = null;
let drawRolling = false;

/* 부위 칩 */
function renderDrawParts(){
  const names = ["전체", ...PARTS.map(p => p.name)];
  document.getElementById("drawParts").innerHTML = names.map(n => `
    <button class="draw-chip${n === drawPart ? " on" : ""}" role="radio" aria-checked="${n === drawPart}"
      onclick="setDrawPart('${n}')">${n}</button>`).join("");
}
function setDrawPart(name){ drawPart = name; renderDrawParts(); }

/* 고른 부위의 기구 목록 */
function drawPool(){
  if(drawPart === "전체") return Object.entries(EXAMPLE_RESULTS).flatMap(([part, list]) => list.map(m => ({ ...m, part })));
  return (EXAMPLE_RESULTS[drawPart] || []).map(m => ({ ...m, part: drawPart }));
}
const pickOne = list => list[Math.floor(Math.random() * list.length)];

/* 뽑기: 이름이 몇 번 바뀌다가 하나에 멈춤 */
function drawRandom(){
  if(drawRolling) return;
  const pool = drawPool();
  if(!pool.length){ showToast("기구 데이터를 불러오지 못했어요."); return; }
  const candidates = pool.length > 1 ? pool.filter(m => m.id !== drawLastId) : pool;
  const result = pickOne(candidates);
  drawLastId = result.id;

  const card = document.getElementById("drawCard");
  const btn = document.getElementById("drawBtn");
  drawRolling = true; btn.disabled = true; card.classList.add("rolling");
  let tick = 0;
  const total = 9;
  const step = () => {
    if(tick < total){
      const m = pickOne(pool);
      card.innerHTML = `<div class="draw-roll"><span>${esc(m.part)}</span><b>${esc(m.name)}</b></div>`;
      tick++;
      setTimeout(step, 60 + tick * 12);     // 점점 느려짐
    }else{
      drawRolling = false; btn.disabled = false; card.classList.remove("rolling");
      renderDrawResult(result);
    }
  };
  step();
}

function renderDrawResult(m){
  const card = document.getElementById("drawCard");
  card.innerHTML = `
    <div class="draw-result">
      <img src="${m.image}" alt="${esc(m.name)} 사진">
      <div class="draw-info">
        <div class="chips"><span class="match">${esc(m.part)}</span><span>${esc(m.level)}</span></div>
        <b>${esc(m.name)}</b>
        <small>${esc(m.primary.join(", "))}</small>
        <p>${esc(m.purpose)}</p>
      </div>
    </div>
    <div class="draw-actions">
      <button class="btn btn-line" onclick="openDrawnMachine('${m.part}','${m.id}')">사용법 보기</button>
      <button class="btn btn-primary" onclick="openAddSheet('${m.id}')">계획표에 추가</button>
    </div>`;
  card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop");
}

/* 사용법 보기: 그 부위의 추천 결과 화면에서 뽑은 기구를 펼쳐 보여 줌 */
function openDrawnMachine(part, id){
  setPart(part);
  renderResult(part, id);
  go("s3");
  const el = document.querySelector(`#resultList .item[data-id="${id}"]`);
  if(el) setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
}

renderDrawParts();
