"""
Supabase 저장소 (STORAGE_MODE=supabase)
- Supabase 데이터베이스의 테이블에 저장합니다. 팀원 모두 같은 데이터를 봅니다.
- Supabase가 제공하는 REST API(PostgREST)를 secret 키로 부릅니다.
  secret 키는 서버(.env)에만 두고, 브라우저에는 절대 보내지 않습니다.

  테이블 (server/supabase/schema.sql 참고)
    users           회원          email, name, password_hash, joined
    plans           계획표        email, plan(jsonb), updated_at
    share_settings  공유 설정     email, is_on, title, description, updated_at
    likes           좋아요        plan_id, email, created_at
    exercises       기구 데이터   id, part, sort_order, name, primary_muscles, purpose, level, setup, step, caution, image
    shared_samples  공유 예시     id, sort_order, author, title, description, likes, created_at, days(jsonb)
"""
from datetime import datetime, timezone

import requests

from stores.base import Store


class SupabaseError(Exception):
    pass


def _in_list(values):
    """PostgREST의 in.( ) 필터 값 만들기"""
    quoted = ['"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"' for v in values]
    return "in.(" + ",".join(quoted) + ")"


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SupabaseStore(Store):
    name = "supabase"

    def __init__(self, url, secret_key):
        if not url or not secret_key:
            raise SupabaseError(".env 파일에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 넣어 주세요.")
        self.base = f"{url}/rest/v1"
        self.http = requests.Session()
        self.http.headers.update({"apikey": secret_key, "Content-Type": "application/json"})
        if secret_key.startswith("eyJ"):            # 예전 형식(service_role) 키일 때만 필요
            self.http.headers["Authorization"] = f"Bearer {secret_key}"

    # ---------- 요청 보내기 ----------
    def _call(self, method, table, params=None, body=None, prefer=None, ok_conflict=False):
        headers = {"Prefer": prefer} if prefer else {}
        try:
            r = self.http.request(method, f"{self.base}/{table}", params=params, json=body,
                                  headers=headers, timeout=10)
        except requests.RequestException as e:
            raise SupabaseError(f"Supabase에 연결할 수 없어요: {e}") from e
        if ok_conflict and r.status_code == 409:
            return "conflict"
        if r.status_code >= 400:
            raise SupabaseError(f"Supabase 오류 {r.status_code} ({table}): {r.text[:300]}")
        return r.json() if r.content else None

    def _get(self, table, **filters):
        return self._call("GET", table, params={"select": "*", **filters}) or []

    def _upsert(self, table, row, key):
        self._call("POST", table, params={"on_conflict": key}, body=row,
                   prefer="resolution=merge-duplicates,return=minimal")

    def ping(self, table):
        """연결 확인용: 테이블에서 한 줄만 읽어 봄"""
        return self._call("GET", table, params={"select": "*", "limit": "1"})

    # ---------- 회원 ----------
    def get_user(self, email):
        rows = self._get("users", email=f"eq.{email}")
        return rows[0] if rows else None

    def create_user(self, user):
        res = self._call("POST", "users", body=user, prefer="return=minimal", ok_conflict=True)
        return res != "conflict"

    def delete_user(self, email, own_plan_id):
        self._call("DELETE", "likes", params={"plan_id": f"eq.{own_plan_id}"})   # 내 계획표가 받은 좋아요
        for table in ("likes", "plans", "share_settings", "users"):             # 내가 누른 좋아요 · 계획표 · 설정 · 회원
            self._call("DELETE", table, params={"email": f"eq.{email}"})

    # ---------- 계획표 ----------
    def get_plan(self, email):
        rows = self._get("plans", email=f"eq.{email}")
        return rows[0]["plan"] if rows else None

    def save_plan(self, email, plan):
        self._upsert("plans", {"email": email, "plan": plan, "updated_at": _now()}, "email")

    # ---------- 공유 설정 ----------
    @staticmethod
    def _to_setting(row):
        return {"on": bool(row.get("is_on")), "title": row.get("title") or "",
                "desc": row.get("description") or "", "updatedAt": row.get("updated_at") or ""}

    def get_share_setting(self, email):
        rows = self._get("share_settings", email=f"eq.{email}")
        return self._to_setting(rows[0]) if rows else None

    def save_share_setting(self, email, s):
        self._upsert("share_settings", {"email": email, "is_on": s.get("on", False), "title": s.get("title", ""),
                                        "description": s.get("desc", ""), "updated_at": s.get("updatedAt") or None},
                     "email")

    def shared_entries(self):
        settings = self._get("share_settings", is_on="eq.true")
        if not settings:
            return []
        emails = [s["email"] for s in settings]
        users = {u["email"]: u for u in self._get("users", email=_in_list(emails))}
        plans = {p["email"]: p["plan"] for p in self._get("plans", email=_in_list(emails))}
        return [{"email": s["email"], "name": users[s["email"]]["name"], "setting": self._to_setting(s),
                 "plan": plans.get(s["email"]) or {}} for s in settings if s["email"] in users]

    # ---------- 좋아요 ----------
    def all_likes(self):
        result = {}
        for row in self._get("likes"):
            result.setdefault(row["plan_id"], []).append(row["email"])
        return result

    def toggle_like(self, plan_id, email):
        where = {"plan_id": f"eq.{plan_id}", "email": f"eq.{email}"}
        if self._get("likes", **where):
            self._call("DELETE", "likes", params=where)
        else:
            self._call("POST", "likes", body={"plan_id": plan_id, "email": email}, prefer="return=minimal")
        emails = [r["email"] for r in self._get("likes", plan_id=f"eq.{plan_id}")]
        return {"count": len(emails), "mine": email in emails}

    # ---------- 기본 데이터 ----------
    def exercises(self):
        parts = {}
        for r in self._get("exercises", order="sort_order.asc"):
            parts.setdefault(r["part"], []).append({
                "id": r["id"], "name": r["name"], "primary": r["primary_muscles"], "purpose": r["purpose"],
                "level": r["level"], "setup": r["setup"], "step": r["step"], "caution": r["caution"] or "",
                "image": r["image"]})
        return parts

    def shared_samples(self):
        return [{"id": r["id"], "author": r["author"], "title": r["title"], "desc": r["description"] or "",
                 "likes": r["likes"] or 0, "createdAt": r["created_at"] or "", "days": r["days"]}
                for r in self._get("shared_samples", order="sort_order.asc")]
