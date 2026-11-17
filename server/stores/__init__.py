"""
저장소 고르기
- .env의 STORAGE_MODE 값에 따라 JSON 파일 저장소 또는 Supabase 저장소를 씁니다.
"""
from config import STORAGE_MODE, SUPABASE_SECRET_KEY, SUPABASE_URL

_store = None


def get_store():
    global _store
    if _store is None:
        if STORAGE_MODE == "supabase":
            from stores.supabase_store import SupabaseStore
            _store = SupabaseStore(SUPABASE_URL, SUPABASE_SECRET_KEY)
        elif STORAGE_MODE == "json":
            from stores.json_store import JsonStore
            _store = JsonStore()
        else:
            raise ValueError(f".env의 STORAGE_MODE는 json 또는 supabase여야 해요. (지금 값: {STORAGE_MODE})")
    return _store
