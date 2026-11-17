"""
기본 데이터를 Supabase에 올리기
사용법 (프로젝트 폴더에서):
  python server/scripts/upload_data.py              기구 데이터 + 공유 예시 올리기
  python server/scripts/upload_data.py --with-db    + db 폴더(JSON 방식)에 저장된 회원 · 계획표 · 공유 설정 · 좋아요도 옮기기

- 같은 id가 이미 있으면 덮어씁니다. 여러 번 실행해도 괜찮습니다.
"""
import json
import sys

import _path  # noqa: F401

from config import DB_DIR, EXERCISES_FILE, SHARED_SAMPLES_FILE, SUPABASE_SECRET_KEY, SUPABASE_URL
from stores.supabase_store import SupabaseError, SupabaseStore


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def upload_exercises(store):
    order = 0
    for part, items in load(EXERCISES_FILE)["parts"].items():
        for m in items:
            store._upsert("exercises", {
                "id": m["id"], "part": part, "sort_order": order, "name": m["name"],
                "primary_muscles": m["primary"], "purpose": m["purpose"], "level": m["level"],
                "setup": m["setup"], "step": m["step"], "caution": m.get("caution", ""), "image": m["image"]}, "id")
            order += 1
    print(f"   ✓ exercises      {order}개")


def upload_samples(store):
    plans = load(SHARED_SAMPLES_FILE)["plans"]
    for i, p in enumerate(plans):
        store._upsert("shared_samples", {
            "id": p["id"], "sort_order": i, "author": p["author"], "title": p["title"],
            "description": p.get("desc", ""), "likes": p.get("likes", 0),
            "created_at": p.get("createdAt") or None, "days": p["days"]}, "id")
    print(f"   ✓ shared_samples {len(plans)}개")


def upload_db_folder(store):
    """JSON 방식으로 쓰던 데이터를 Supabase로 옮김 (회원 → 계획표 → 공유 설정 → 좋아요 순서)"""
    def read(name):
        path = DB_DIR / f"{name}.json"
        return load(path) if path.exists() else {}
    users = read("users")
    for u in users.values():
        store._upsert("users", u, "email")
    for email, plan in read("plans").items():
        if email in users:
            store.save_plan(email, plan)
    for email, s in read("share_settings").items():
        if email in users:
            store.save_share_setting(email, s)
    n = 0
    for pid, emails in read("likes").items():
        for e in emails:
            if e in users:
                store._upsert("likes", {"plan_id": pid, "email": e}, "plan_id,email"); n += 1
    print(f"   ✓ db 폴더        회원 {len(users)}명, 좋아요 {n}개")


def main():
    print("Supabase에 데이터 올리는 중...")
    try:
        store = SupabaseStore(SUPABASE_URL, SUPABASE_SECRET_KEY)
        upload_exercises(store)
        upload_samples(store)
        if "--with-db" in sys.argv:
            upload_db_folder(store)
    except SupabaseError as e:
        print(f"\n[실패] {e}")
        print("→ check_supabase.py로 설정과 테이블을 먼저 확인해 주세요.")
        sys.exit(1)
    print("완료! Supabase 대시보드 Table Editor에서 확인해 보세요.")


if __name__ == "__main__":
    main()
