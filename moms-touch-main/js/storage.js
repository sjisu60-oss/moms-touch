/* =========================================================
   브라우저 저장소(localStorage) 도우미
   - 이 프로토타입은 서버가 없어서 계정과 계획표를 브라우저에만 저장합니다.
   - 저장소를 쓸 수 없는 환경이면 메모리에 임시로 저장합니다(새로고침하면 사라짐).
   ========================================================= */
const Store = (() => {
  const PREFIX = "machinemate.";
  const memory = {};

  function get(key, fallback){
    try{
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    }catch(e){
      return key in memory ? memory[key] : fallback;
    }
  }
  function set(key, value){
    memory[key] = value;
    try{ localStorage.setItem(PREFIX + key, JSON.stringify(value)); }catch(e){}
  }
  function remove(key){
    delete memory[key];
    try{ localStorage.removeItem(PREFIX + key); }catch(e){}
  }
  return { get, set, remove };
})();
