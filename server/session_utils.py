"""
로그인 상태 도우미
- 로그인하면 Flask 세션(암호화된 쿠키)에 이메일을 기억합니다.
"""
import hashlib
from functools import wraps

from flask import jsonify, session

from stores import get_store


def current_email():
    """지금 로그인한 사람의 이메일. 탈퇴했거나 로그인 안 했으면 None."""
    email = session.get("email")
    if email and get_store().get_user(email):
        return email
    session.pop("email", None)
    return None


def login_required(view):
    """로그인해야 쓸 수 있는 기능에 붙입니다."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not current_email():
            return jsonify(error="로그인이 필요해요."), 401
        return view(*args, **kwargs)
    return wrapper


def public_plan_id(email):
    """공유 목록에 이메일을 그대로 보이지 않도록 바꾼 계획표 id"""
    return "user-" + hashlib.sha256(email.encode("utf-8")).hexdigest()[:12]
