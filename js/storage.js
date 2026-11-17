/* =========================================================
   브라우저 저장소(localStorage) 도우미
   - 회원 데이터 · 마이 데이터는 서버에 저장합니다 (js/server.js).
   - 이 파일은 로그인하기 전(비회원)에 담아 둔 계획표만 브라우저에 잠시 저장합니다.
     로그인하거나 가입하면 내 계정 계획표로 옮겨지고 여기서는 지워집니다.
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
