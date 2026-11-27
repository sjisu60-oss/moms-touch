"""
서비스 기본 데이터 (저장: exercises, shared_samples)
  GET /api/exercises        운동 부위별 기구 데이터
  GET /api/shared-samples   스케줄 공유 예시 계획표
- 데이터베이스가 비어 있거나 연결이 안 되면 data 폴더의 JSON 파일을 대신 보냅니다.
"""
import json

from flask import Blueprint, jsonify

from config import EXERCISES_FILE, SHARED_SAMPLES_FILE
from stores import get_store

bp = Blueprint("data", __name__, url_prefix="/api")


def _file(path, key):
    with open(path, encoding="utf-8") as f:
        return json.load(f)[key]


def _from_store(method):
    try:
        return method()
    except Exception as e:          # 저장소 연결 실패 → 파일로 대신
        print("[기본 데이터] 저장소 대신 파일 사용:", e)
        return None


@bp.get("/exercises")
def exercises():
    parts = _from_store(get_store().exercises)
    source = get_store().name if parts else "file"
    return jsonify(parts=parts or _file(EXERCISES_FILE, "parts"), source=source)


@bp.get("/shared-samples")
def shared_samples():
    plans = _from_store(get_store().shared_samples)
    return jsonify(plans=plans or _file(SHARED_SAMPLES_FILE, "plans"))
