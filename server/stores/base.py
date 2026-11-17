"""
저장소 공통 규칙
- json_store.py와 supabase_store.py는 아래 함수를 똑같이 갖고 있습니다.
- 그래서 routes(기능 코드)는 저장 방식이 무엇인지 몰라도 store.함수()만 부르면 됩니다.

데이터 모양
  user    : { "email", "name", "password_hash", "joined" }
  plan    : { "월": [ {"id", "sets", "reps", "done"} ], "화": [...], ... }
  setting : { "on", "title", "desc", "updatedAt" }
"""


class Store:
    name = "base"

    # ---------- 회원 ----------
    def get_user(self, email):                      # → user 또는 None
        raise NotImplementedError

    def create_user(self, user):                    # → True(성공) / False(이미 있음)
        raise NotImplementedError

    def delete_user(self, email, own_plan_id):      # 회원 + 계획표 + 공유 설정 + 좋아요 삭제
        raise NotImplementedError

    # ---------- 계획표 ----------
    def get_plan(self, email):                      # → plan 또는 None
        raise NotImplementedError

    def save_plan(self, email, plan):
        raise NotImplementedError

    # ---------- 공유 설정 ----------
    def get_share_setting(self, email):             # → setting 또는 None
        raise NotImplementedError

    def save_share_setting(self, email, setting):
        raise NotImplementedError

    def shared_entries(self):
        """공유를 켠 회원 목록 → [ { email, name, setting, plan } ]"""
        raise NotImplementedError

    # ---------- 좋아요 ----------
    def all_likes(self):                            # → { 계획표id: [이메일, ...] }
        raise NotImplementedError

    def toggle_like(self, plan_id, email):          # → { count, mine }
        raise NotImplementedError

    # ---------- 기본 데이터 (기구 · 공유 예시) ----------
    def exercises(self):                            # → { 부위: [기구, ...] }
        raise NotImplementedError

    def shared_samples(self):                       # → [ 예시 계획표, ... ]
        raise NotImplementedError
