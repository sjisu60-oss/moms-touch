"""
JSON 파일 저장소 (STORAGE_MODE=json)
- 이 컴퓨터의 db 폴더에 저장합니다. 키 없이 바로 시연할 때 씁니다.

  db/users.json           { 이메일: user }
  db/plans.json           { 이메일: plan }
  db/share_settings.json  { 이메일: setting }
  db/likes.json           { 계획표id: [ 이메일, ... ] }
"""
import json
import os
import tempfile
import threading

from config import DB_DIR, EXERCISES_FILE, SHARED_SAMPLES_FILE
from stores.base import Store

USERS, PLANS, SHARES, LIKES = "users", "plans", "share_settings", "likes"


class JsonStore(Store):
    name = "json"

    def __init__(self):
        self._lock = threading.Lock()           # 동시에 같은 파일을 쓰지 않도록
        DB_DIR.mkdir(exist_ok=True)
        for f in (USERS, PLANS, SHARES, LIKES):
            if not self._path(f).exists():
                self._write(f, {})

    # ---------- 파일 읽기 · 쓰기 ----------
    def _path(self, name):
        return DB_DIR / f"{name}.json"

    def _read(self, name):
        with open(self._path(name), encoding="utf-8") as f:
            return json.load(f)

    def _write(self, name, data):
        # 임시 파일에 먼저 쓰고 바꿔치기 → 저장 중에 꺼져도 파일이 깨지지 않음
        fd, tmp = tempfile.mkstemp(dir=DB_DIR, suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self._path(name))

    def _update(self, name, change):
        with self._lock:
            data = self._read(name)
            result = change(data)
            self._write(name, data)
            return result

    # ---------- 회원 ----------
    def get_user(self, email):
        return self._read(USERS).get(email)

    def create_user(self, user):
        def add(users):
            if user["email"] in users:
                return False
            users[user["email"]] = user
            return True
        return self._update(USERS, add)

    def delete_user(self, email, own_plan_id):
        for name in (USERS, PLANS, SHARES):
            self._update(name, lambda d: d.pop(email, None))

        def remove_likes(likes):
            likes.pop(own_plan_id, None)                       # 내 계획표가 받은 좋아요
            for pid in likes:
                likes[pid] = [e for e in likes[pid] if e != email]   # 내가 누른 좋아요
        self._update(LIKES, remove_likes)

    # ---------- 계획표 ----------
    def get_plan(self, email):
        return self._read(PLANS).get(email)

    def save_plan(self, email, plan):
        self._update(PLANS, lambda d: d.__setitem__(email, plan))

    # ---------- 공유 설정 ----------
    def get_share_setting(self, email):
        return self._read(SHARES).get(email)

    def save_share_setting(self, email, setting):
        self._update(SHARES, lambda d: d.__setitem__(email, setting))

    def shared_entries(self):
        users, plans = self._read(USERS), self._read(PLANS)
        return [{"email": e, "name": users[e]["name"], "setting": s, "plan": plans.get(e) or {}}
                for e, s in self._read(SHARES).items() if s.get("on") and e in users]

    # ---------- 좋아요 ----------
    def all_likes(self):
        return self._read(LIKES)

    def toggle_like(self, plan_id, email):
        def toggle(likes):
            emails = likes.get(plan_id, [])
            likes[plan_id] = [e for e in emails if e != email] if email in emails else emails + [email]
            return {"count": len(likes[plan_id]), "mine": email in likes[plan_id]}
        return self._update(LIKES, toggle)

    # ---------- 기본 데이터 ----------
    def exercises(self):
        with open(EXERCISES_FILE, encoding="utf-8") as f:
            return json.load(f)["parts"]

    def shared_samples(self):
        with open(SHARED_SAMPLES_FILE, encoding="utf-8") as f:
            return json.load(f)["plans"]
