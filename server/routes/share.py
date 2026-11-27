"""
스케줄 공유 (저장: share_settings, likes)
  GET  /api/share-setting        내 공유 설정 불러오기
  PUT  /api/share-setting        내 공유 설정 저장 (공개 여부 · 제목 · 소개)
  GET  /api/shared-plans         회원이 공개한 계획표 목록 + 좋아요 수
  POST /api/likes/<계획표 id>     좋아요 누르기 / 취소
  POST /api/saves/<계획표 id>     내 계획표에 저장한 기록 남기기 (회원마다 한 번만 셈)
"""
import sys
from datetime import date

from flask import Blueprint, jsonify, request

from session_utils import current_email, login_required, public_plan_id
from stores import get_store
from validators import SAMPLE_PLAN_IDS, InvalidInput, check_share_setting

bp = Blueprint("share", __name__, url_prefix="/api")


def default_setting(name):
    return {"on": False, "title": f"{name}님의 운동 계획표", "desc": ""}


@bp.get("/share-setting")
@login_required
def get_setting():
    store, email = get_store(), current_email()
    return jsonify(setting=store.get_share_setting(email) or default_setting(store.get_user(email)["name"]))


@bp.put("/share-setting")
@login_required
def put_setting():
    store, email = get_store(), current_email()
    current = store.get_share_setting(email) or default_setting(store.get_user(email)["name"])
    try:
        setting = check_share_setting(request.get_json(silent=True) or {}, current)
    except InvalidInput as e:
        return jsonify(error=e.message, field=e.field), 400
    setting["updatedAt"] = date.today().isoformat()
    store.save_share_setting(email, setting)
    return jsonify(setting=setting)


def user_shared_plans(me):
    """공유를 켠 회원의 계획표 (비어 있는 요일 · 빈 계획표는 빼고)"""
    result = []
    for e in get_store().shared_entries():
        days = {d: items for d, items in e["plan"].items() if items}
        if not days:
            continue
        s = e["setting"]
        result.append({"id": public_plan_id(e["email"]), "author": e["name"],
                       "title": s.get("title", ""), "desc": s.get("desc", ""),
                       "days": days, "likes": 0, "createdAt": s.get("updatedAt", ""),
                       "mine": e["email"] == me})
    return result


def count_map(rows, me):
    return {pid: {"count": len(emails), "mine": bool(me) and me in emails} for pid, emails in rows.items()}


def all_saves_safe():
    """저장 기록 (saves 테이블이 아직 없으면 빈 기록으로 → 공유 목록은 그대로 보임)"""
    try:
        return get_store().all_saves()
    except Exception as e:
        print("[안내] 저장 수를 불러오지 못했어요. migration_0.12.sql을 실행했는지 확인해 주세요.", e, file=sys.stderr)
        return {}


@bp.get("/shared-plans")
def shared_plans():
    me = current_email()
    return jsonify(
        userPlans=user_shared_plans(me),
        likes=count_map(get_store().all_likes(), me),
        saves=count_map(all_saves_safe(), me),
    )


def valid_plan(plan_id, me):
    return plan_id in SAMPLE_PLAN_IDS or any(p["id"] == plan_id for p in user_shared_plans(me))


@bp.post("/saves/<plan_id>")
@login_required
def add_save(plan_id):
    me = current_email()
    if plan_id == public_plan_id(me):
        return jsonify(error="내 계획표는 저장 수에 넣지 않아요."), 400
    if not valid_plan(plan_id, me):
        return jsonify(error="계획표를 찾을 수 없어요."), 404
    return jsonify(get_store().add_save(plan_id, me))


@bp.post("/likes/<plan_id>")
@login_required
def toggle_like(plan_id):
    me = current_email()
    if plan_id == public_plan_id(me):
        return jsonify(error="내 계획표에는 좋아요를 누를 수 없어요."), 400
    if not valid_plan(plan_id, me):
        return jsonify(error="계획표를 찾을 수 없어요."), 404
    return jsonify(get_store().toggle_like(plan_id, me))
