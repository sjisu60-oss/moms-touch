/* =========================================================
   데이터 불러오기 (data 폴더의 JSON 파일)
   - data/exercises.json    : 운동 부위별 추천 예시 데이터
   - data/shared_plans.json : 스케줄 공유 예시 데이터
   ※ 브라우저 보안 규칙 때문에 JSON 파일은 index.html을 더블클릭해서
     열면(file://) 불러올 수 없습니다. VS Code Live Server 같은
     로컬 서버로 실행해야 합니다.
   ========================================================= */
let EXAMPLE_RESULTS = {};   // { 가슴: [기구, ...], 등: [...], ... }
let SHARED_SAMPLES = [];    // [{ id, author, title, desc, likes, days }, ...]

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`${path} (${res.status})`);
  return res.json();
}

async function loadData(){
  const [exercises, shared] = await Promise.all([
    loadJSON("data/exercises.json"),
    loadJSON("data/shared_plans.json")
  ]);
  EXAMPLE_RESULTS = exercises.parts;
  SHARED_SAMPLES = shared.plans;
}
