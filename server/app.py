"""
머신메이트 서버 (Flask)
- 화면 파일을 브라우저에 보내고, 회원 데이터와 마이 데이터를 저장합니다.
- 저장 방식은 .env의 STORAGE_MODE로 고릅니다. (json / supabase)

실행 방법 (프로젝트 폴더에서)
  pip install -r server/requirements.txt
  python server/app.py
  → 브라우저에서 http://localhost:5000 접속
"""
import secrets
import sys

from flask import Flask, jsonify

from config import DB_DIR, FLASK_SECRET_KEY, HOST, PORT, STORAGE_MODE
from routes import auth, data, pages, plan, share
from stores import get_store


def secret_key():
    """로그인 상태를 암호화하는 키: .env의 FLASK_SECRET_KEY, 없으면 db/secret_key.txt를 만들어 사용"""
    if FLASK_SECRET_KEY:
        return FLASK_SECRET_KEY
    DB_DIR.mkdir(exist_ok=True)
    path = DB_DIR / "secret_key.txt"
    if not path.exists():
        path.write_text(secrets.token_hex(32), encoding="utf-8")
    return path.read_text(encoding="utf-8").strip()


def create_app():
    app = Flask(__name__, static_folder=None)
    app.secret_key = secret_key()
    app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")
    get_store()                          # 저장소 준비 (설정이 잘못됐으면 여기서 알려 줌)

    app.register_blueprint(auth.bp)      # 회원
    app.register_blueprint(plan.bp)      # 내 계획표
    app.register_blueprint(share.bp)     # 스케줄 공유
    app.register_blueprint(data.bp)      # 기구 · 공유 예시 데이터
    app.register_blueprint(pages.bp)     # 화면 파일 (맨 마지막에 등록)

    @app.errorhandler(Exception)
    def storage_error(e):
        """저장소(Supabase 등) 오류를 화면에 알기 쉬운 문장으로 보냄"""
        if getattr(e, "code", None):     # 404 같은 일반 HTTP 오류는 그대로
            return e
        print("[오류]", e, file=sys.stderr)
        return jsonify(error="데이터 저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."), 503

    return app


if __name__ == "__main__":
    try:
        application = create_app()
    except Exception as e:
        print(f"[서버 시작 실패] {e}")
        sys.exit(1)
    print(f"머신메이트 서버 실행 중 → http://localhost:{PORT}  (저장 방식: {STORAGE_MODE}, 끄려면 Ctrl + C)")
    application.run(host=HOST, port=PORT, debug=False)
