/* =========================================================
   서버와 데이터 주고받기
   - 회원 데이터 · 마이 데이터는 서버(server/app.py)가 db 폴더의 JSON 파일에 저장합니다.
   - 이 파일은 브라우저에서 서버로 요청을 보내고 결과를 받아 오는 일만 합니다.
   ========================================================= */
class ServerError extends Error {
  constructor(message, status, field){
    super(message);
    this.status = status;   // 0 = 서버에 연결 못 함
    this.field = field;     // 오류를 표시할 입력칸 (예: "email")
  }
}

const Server = {
  online: false,            // 서버가 켜져 있는지 (시작할 때 확인)

  async request(method, url, body){
    let res;
    try{
      res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: "same-origin"
      });
    }catch(e){
      throw new ServerError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.", 0);
    }
    let data = {};
    try{ data = await res.json(); }catch(e){ /* JSON이 아닌 응답 */ }
    if(!res.ok){
      const offline = res.status === 404 || res.status === 405 || res.status === 501;
      throw new ServerError(offline && !data.error ? "서버가 꺼져 있어요. python server/app.py로 실행해 주세요."
                                                   : data.error || `요청에 실패했어요. (${res.status})`,
                            offline && !data.error ? 0 : res.status, data.field);
    }
    return data;
  },
  get(url){ return this.request("GET", url); },
  post(url, body){ return this.request("POST", url, body || {}); },
  put(url, body){ return this.request("PUT", url, body); },
  del(url){ return this.request("DELETE", url); }
};
