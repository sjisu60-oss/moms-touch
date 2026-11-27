"""
화면 파일 보내기
- index.html과 css · js · data · assets · page 폴더만 브라우저에 보냅니다.
- server, db 폴더는 보내지 않습니다 (회원 정보 보호).
"""
from flask import Blueprint, abort, send_from_directory

from config import PUBLIC_DIRS, ROOT_DIR

bp = Blueprint("pages", __name__)


@bp.get("/")
def index():
    return send_from_directory(ROOT_DIR, "index.html")


@bp.get("/<path:path>")
def static_files(path):
    if path.split("/")[0] not in PUBLIC_DIRS:
        abort(404)
    return send_from_directory(ROOT_DIR, path)
