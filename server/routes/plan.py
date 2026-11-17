"""
내 계획표 (저장: plans)
  GET /api/plan   내 계획표 불러오기
  PUT /api/plan   내 계획표 저장하기 (계획표 전체를 보냄)
"""
from flask import Blueprint, jsonify, request

from config import DAYS
from session_utils import current_email, login_required
from stores import get_store
from validators import InvalidInput, check_plan

bp = Blueprint("plan", __name__, url_prefix="/api")


@bp.get("/plan")
@login_required
def get_plan():
    plan = get_store().get_plan(current_email()) or {d: [] for d in DAYS}
    return jsonify(plan=plan)


@bp.put("/plan")
@login_required
def put_plan():
    try:
        plan = check_plan(request.get_json(silent=True))
    except InvalidInput as e:
        return jsonify(error=e.message), 400
    get_store().save_plan(current_email(), plan)
    return jsonify(plan=plan)
