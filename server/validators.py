"""
입력 검사
- 브라우저에서 보낸 값이 올바른지 서버에서 한 번 더 확인합니다.
"""
import json
import re

from config import DAYS, EXERCISES_FILE, SHARED_SAMPLES_FILE

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

with open(EXERCISES_FILE, encoding="utf-8") as f:
    MACHINE_IDS = {m["id"] for items in json.load(f)["parts"].values() for m in items}
with open(SHARED_SAMPLES_FILE, encoding="utf-8") as f:
    SAMPLE_PLAN_IDS = {p["id"] for p in json.load(f)["plans"]}


class InvalidInput(Exception):
    """잘못된 입력. field는 화면에서 오류를 보여 줄 입력칸 이름입니다."""
    def __init__(self, message, field=None):
        super().__init__(message)
        self.message = message
        self.field = field


def check_signup(body):
    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    pw = str(body.get("password", ""))
    if not 2 <= len(name) <= 12:
        raise InvalidInput("이름은 2~12자로 입력해 주세요.", "name")
    if not EMAIL_RE.match(email):
        raise InvalidInput("올바른 이메일 형식이 아니에요.", "email")
    if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise InvalidInput("영문과 숫자를 섞어 8자 이상 입력해 주세요.", "password")
    return name, email, pw


def check_plan(body):
    """계획표: { 월: [ {id, sets, reps, done} ], ... } 형태만 받습니다."""
    if not isinstance(body, dict):
        raise InvalidInput("계획표 형식이 올바르지 않아요.")
    plan = {}
    for day in DAYS:
        items = body.get(day, [])
        if not isinstance(items, list) or len(items) > 30:
            raise InvalidInput(f"{day}요일 계획표 형식이 올바르지 않아요.")
        clean, seen = [], set()
        for it in items:
            if not isinstance(it, dict) or it.get("id") not in MACHINE_IDS or it["id"] in seen:
                raise InvalidInput("등록되지 않은 기구가 있어요.")
            seen.add(it["id"])
            sets, reps = it.get("sets"), it.get("reps")
            if not isinstance(sets, int) or not 1 <= sets <= 10 or not isinstance(reps, int) or not 1 <= reps <= 120:
                raise InvalidInput("세트 · 횟수 값이 올바르지 않아요.")
            clean.append({"id": it["id"], "sets": sets, "reps": reps, "done": bool(it.get("done"))})
        plan[day] = clean
    return plan


def check_share_setting(body, current):
    s = dict(current)
    if "on" in body:
        s["on"] = bool(body["on"])
    if "title" in body:
        title = str(body["title"]).strip()
        if not 1 <= len(title) <= 30:
            raise InvalidInput("제목은 1~30자로 입력해 주세요.", "title")
        s["title"] = title
    if "desc" in body:
        desc = str(body["desc"]).strip()
        if len(desc) > 60:
            raise InvalidInput("소개는 60자 이내로 입력해 주세요.", "desc")
        s["desc"] = desc
    return s
