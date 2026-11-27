"""
설정 · 경로
- 프로젝트 폴더 위치, 저장 방식, Supabase 연결 정보를 한곳에 모아 둡니다.
- 비밀 값(키)은 코드에 적지 않고 프로젝트 폴더의 .env 파일에서 읽습니다.
"""
import os
from pathlib import Path

# 프로젝트 맨 위 폴더 (index.html이 있는 곳)
ROOT_DIR = Path(__file__).resolve().parent.parent

# .env 파일 읽기 (없으면 그냥 넘어감)
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
except ImportError:
    pass

# ---------- 저장 방식 ----------
#   json     : 이 컴퓨터의 db 폴더 JSON 파일에 저장 (키 없이 바로 시연 가능)
#   supabase : Supabase 데이터베이스에 저장 (팀원 모두 같은 데이터 사용)
STORAGE_MODE = os.getenv("STORAGE_MODE", "json").strip().lower()

# ---------- Supabase 연결 정보 (.env) ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "").strip()

# ---------- 로그인 상태 암호화 키 (.env, 없으면 db/secret_key.txt 자동 생성) ----------
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "").strip()

# ---------- 경로 ----------
DB_DIR = ROOT_DIR / "db"                                      # json 방식 저장 폴더
EXERCISES_FILE = ROOT_DIR / "data" / "exercises.json"        # 기구 기본 데이터
SHARED_SAMPLES_FILE = ROOT_DIR / "data" / "shared_plans.json"  # 공유 예시 기본 데이터

# 브라우저에 보여 줘도 되는 폴더 (server, db, .env는 절대 공개하지 않음)
PUBLIC_DIRS = {"css", "js", "data", "assets", "archive"}

# 서버 실행 주소 (기본: 내 컴퓨터 127.0.0.1:5000, 필요하면 .env의 HOST · PORT로 바꿀 수 있음)
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))

DAYS = ["월", "화", "수", "목", "금", "토", "일"]
