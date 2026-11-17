"""
회원 기능 (저장: users)
  GET    /api/me       로그인한 사람 정보
  POST   /api/signup   회원가입
  POST   /api/login    로그인
  POST   /api/logout   로그아웃
  DELETE /api/me       회원 탈퇴 (계획표 · 공유 설정 · 좋아요도 함께 삭제)
"""
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from session_utils import current_email, login_required, public_plan_id
from stores import get_store
from validators import InvalidInput, check_signup

bp = Blueprint("auth", __name__, url_prefix="/api")


def public_user(u):
    """비밀번호 해시는 빼고 보냅니다."""
    return {"name": u["name"], "email": u["email"], "joined": u["joined"]}


@bp.get("/me")
def me():
    email = current_email()
    return jsonify(user=public_user(get_store().get_user(email)) if email else None)


@bp.post("/signup")
def signup():
    try:
        name, email, pw = check_signup(request.get_json(silent=True) or {})
    except InvalidInput as e:
        return jsonify(error=e.message, field=e.field), 400

    user = {"email": email, "name": name, "password_hash": generate_password_hash(pw),
            "joined": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    if not get_store().create_user(user):
        return jsonify(error="이미 가입된 이메일이에요.", field="email"), 409
    session.clear()
    session["email"] = email
    return jsonify(user=public_user(user)), 201


@bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email", "")).strip().lower()
    pw = str(body.get("password", ""))
    user = get_store().get_user(email) if email else None
    if not user or not check_password_hash(user["password_hash"], pw):
        return jsonify(error="이메일 또는 비밀번호가 올바르지 않아요."), 401
    session.clear()
    session["email"] = email
    return jsonify(user=public_user(user))


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@bp.delete("/me")
@login_required
def delete_me():
    email = current_email()
    get_store().delete_user(email, public_plan_id(email))
    session.clear()
    return jsonify(ok=True)
