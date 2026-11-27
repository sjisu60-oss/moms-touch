/* =========================================================
   기본 데이터 불러오기 (기구 · 스케줄 공유 예시)
   1순위: 서버 → 데이터베이스(Supabase) 또는 data 폴더
          GET /api/exercises, GET /api/shared-samples
   2순위: 서버가 없을 때(Live Server 등) data 폴더의 JSON 파일을 직접 읽음
          data/exercises.json, data/shared_plans.json
   ※ index.html을 더블클릭해서 열면(file://) 둘 다 읽을 수 없습니다.
   ========================================================= */
let EXAMPLE_RESULTS = {};   // { 가슴: [기구, ...], 등: [...], ... }
let SHARED_SAMPLES = [];    // [{ id, author, title, desc, likes, days }, ...]

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`${path} (${res.status})`);
  return res.json();
}

/* 서버에서 먼저 받아 보고, 안 되면 파일에서 */
async function loadFirst(apiPath, filePath){
  try{ return await loadJSON(apiPath); }
  catch(e){ return loadJSON(filePath); }
}

async function loadData(){
  const [exercises, shared] = await Promise.all([
    loadFirst("/api/exercises", "data/exercises.json"),
    loadFirst("/api/shared-samples", "data/shared_plans.json")
  ]);
  EXAMPLE_RESULTS = exercises.parts;
  SHARED_SAMPLES = shared.plans;
}
