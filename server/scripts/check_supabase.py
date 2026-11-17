"""
Supabase 연결 확인
사용법 (프로젝트 폴더에서):  python server/scripts/check_supabase.py

- .env 설정, 연결, 테이블 6개가 있는지, 각 테이블에 데이터가 몇 줄인지 확인합니다.
- 키 값은 화면에 출력하지 않습니다.
"""
import _path  # noqa: F401

from config import STORAGE_MODE, SUPABASE_SECRET_KEY, SUPABASE_URL
from stores.supabase_store import SupabaseError, SupabaseStore

TABLES = ["users", "plans", "share_settings", "likes", "exercises", "shared_samples"]


def main():
    print("1) .env 설정 확인")
    print(f"   STORAGE_MODE        = {STORAGE_MODE}" + ("" if STORAGE_MODE == "supabase" else "   ← supabase로 바꿔야 서버가 Supabase를 씁니다"))
    print(f"   SUPABASE_URL        = {SUPABASE_URL or '(비어 있음)'}")
    key_kind = ("secret 키 (sb_secret_)" if SUPABASE_SECRET_KEY.startswith("sb_secret_")
                else "예전 service_role 키" if SUPABASE_SECRET_KEY.startswith("eyJ")
                else "publishable 키 ← 서버에는 secret 키를 넣어야 해요" if SUPABASE_SECRET_KEY.startswith("sb_publishable_")
                else "(비어 있음)" if not SUPABASE_SECRET_KEY else "알 수 없는 형식")
    print(f"   SUPABASE_SECRET_KEY = {key_kind}")
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        print("\n→ .env 파일에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 넣어 주세요.")
        return

    print("\n2) 테이블 확인")
    store = SupabaseStore(SUPABASE_URL, SUPABASE_SECRET_KEY)
    missing = []
    for t in TABLES:
        try:
            store.ping(t)
            count = len(store._get(t))
            print(f"   ✓ {t:<15} {count}줄")
        except SupabaseError as e:
            missing.append(t)
            print(f"   ✗ {t:<15} {e}")
    if missing:
        print("\n→ 없는 테이블이 있어요. Supabase SQL Editor에서 server/supabase/schema.sql을 실행해 주세요.")
    else:
        print("\n모두 정상이에요. 기구 · 예시 데이터가 0줄이면 upload_data.py를 실행해 주세요.")


if __name__ == "__main__":
    main()
