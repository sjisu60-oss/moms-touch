# GitHub에 올리는 방법 (윈도우 · GitHub Desktop)

이 폴더 그대로 GitHub 저장소(`moms-touch`)에 올리면 됩니다.
`.gitignore` 덕분에 **`.env`(Supabase 키)와 회원 데이터는 자동으로 빠집니다.**

---

## 처음 한 번: 준비
1. **GitHub Desktop**을 설치하고 GitHub 계정으로 로그인합니다. (desktop.github.com)
2. **File → Clone repository**에서 팀 저장소(`moms-touch`)를 골라 내 컴퓨터로 받습니다.
   - 받은 폴더 위치를 기억해 둡니다. (예: `문서\GitHub\moms-touch`)

## 파일 바꿔 넣기
1. 받은 저장소 폴더를 엽니다.
2. 안에 있던 파일 중 **`.git` 폴더만 남기고** 나머지를 지웁니다.
   - `.git` 폴더가 안 보이면 탐색기 **보기 → 숨긴 항목**을 체크합니다. `.git`은 절대 지우지 마세요.
3. 이 프로젝트 폴더 안의 **모든 파일 · 폴더**를 복사해서 붙여 넣습니다.
   - `.env`가 있어도 괜찮습니다. 올라가지 않습니다.

## 올리기 전 꼭 확인 (중요)
GitHub Desktop 왼쪽 **Changes** 목록을 보고 아래가 **없는지** 확인합니다.
- [ ] `.env` (키 파일)
- [ ] `db/users.json`, `db/plans.json` 등 `db` 폴더의 `.json` 파일
- [ ] `db/secret_key.txt`
- [ ] `__pycache__` 폴더

하나라도 보이면 **올리지 말고** `.gitignore` 파일이 함께 들어갔는지 확인합니다.
`.env.example`은 견본 글자만 들어 있으면 올려도 됩니다. (진짜 키가 들어 있으면 안 됨)

## 올리기
1. 왼쪽 아래 **Summary**에 무엇을 바꿨는지 적습니다. (예: `v0.10 Supabase 연동, PRD 0.3`)
2. **Commit to main** → 위쪽 **Push origin**을 누릅니다.
3. GitHub 웹사이트에서 파일이 올라갔는지 확인합니다.

---

## 만약 키를 실수로 올렸다면
1. 바로 Supabase **Project Settings → API Keys**에서 그 secret 키를 **삭제**하고 새로 만듭니다.
2. 팀원 모두 `.env`의 키를 새 키로 바꿉니다.
3. GitHub에서 파일만 지워도 기록(커밋)에는 남으므로, **키를 새로 만드는 것이 가장 중요**합니다.

## 팀원이 받아서 실행할 때
1. GitHub Desktop에서 **Fetch origin → Pull**로 최신 파일을 받습니다.
2. `.env`는 GitHub에 없으므로 각자 만듭니다. → [supabase_setup.md](supabase_setup.md) 4단계
3. `pip install -r server/requirements.txt` → `python server/app.py`
