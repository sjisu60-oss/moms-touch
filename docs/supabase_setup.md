# Supabase 연결 가이드 (팀원용)

머신메이트의 회원 데이터 · 마이 데이터 · 기본 데이터를 Supabase 데이터베이스에 저장하기 위한 순서입니다.
처음 한 번만 하면 됩니다. (★ = 팀 대표 1명만, ● = 팀원 모두)

---

## 1. ★ 프로젝트 만들기
1. supabase.com 에 로그인합니다.
2. **New project** 를 누릅니다.
   - Name: `machinemate`
   - Database Password: 자동 생성 → **따로 안전한 곳에 저장**
   - Region: Seoul(Northeast Asia) 등 가까운 지역
   - Plan: **Free**
3. 프로젝트가 만들어질 때까지 1~2분 기다립니다.
4. 팀원을 조직(Organization)에 초대합니다.

## 2. ★ 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. `server/supabase/schema.sql` 파일 내용을 **전부** 복사해서 붙여 넣고 **Run**
3. 왼쪽 메뉴 **Table Editor** 에서 테이블 7개가 생겼는지 확인
   `users` · `plans` · `share_settings` · `likes` · `saves` · `exercises` · `shared_samples`

> **0.11 이전에 이미 테이블을 만들었다면** (0.12 업데이트)
> schema.sql을 다시 실행하지 말고, SQL Editor에서 `server/supabase/migration_0.12.sql` 내용만 붙여 넣고 **Run** 하세요.
> 그다음 `python server/scripts/upload_data.py` 를 한 번 실행하면 예시 계획표의 저장 수가 올라갑니다.

## 3. ★ 키 확인
**Project Settings → API Keys** 화면에서 두 가지를 확인합니다.

| 값 | 모양 | 어디에 |
| --- | --- | --- |
| Project URL | `https://xxxx.supabase.co` | `.env`의 `SUPABASE_URL` |
| Secret key | `sb_secret_...` (없으면 새로 만들기) | `.env`의 `SUPABASE_SECRET_KEY` |

> ⚠ **publishable 키(`sb_publishable_`)가 아니라 secret 키**를 써야 합니다.
> ⚠ secret 키는 모든 데이터에 접근할 수 있습니다. 채팅방 · GitHub · 노션 · 캡처 화면에 올리지 마세요. 팀원에게는 개인 메시지로만 전달합니다.

## 4. ● .env 파일 만들기 (팀원 컴퓨터마다)
1. 프로젝트 폴더의 `.env.example` 을 복사해서 이름을 `.env` 로 바꿉니다.
2. `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 를 채우고 `STORAGE_MODE=supabase` 로 둡니다.
3. 패키지 설치
   ```
   pip install -r server/requirements.txt
   ```

## 5. ● 연결 확인
```
python server/scripts/check_supabase.py
```
- 모든 테이블에 ✓ 가 나오면 성공입니다.
- ✗ 가 나오면 화면의 안내 문구를 따라 고칩니다. (키 값은 화면에 나오지 않습니다)

## 6. ★ 기본 데이터 올리기 (처음 한 번)
```
python server/scripts/upload_data.py
```
- 기구 18개(`exercises`), 공유 예시 4개(`shared_samples`)가 올라갑니다.
- JSON 방식으로 쓰던 회원 · 계획표도 옮기려면: `python server/scripts/upload_data.py --with-db`

## 7. ● 서버 실행 · 동작 확인
```
python server/app.py
```
브라우저에서 `http://localhost:5000` 접속 후 아래를 확인합니다.

- [ ] 서버 시작 문구에 `저장 방식: supabase` 가 보임
- [ ] 회원가입 → Table Editor `users` 에 한 줄 생김 (비밀번호는 `scrypt:...` 해시)
- [ ] 계획표에 기구 추가 → `plans` 에 반영
- [ ] 마이페이지에서 공유 켜기 → `share_settings` 에 반영
- [ ] 다른 계획표에 좋아요 → `likes` 에 반영
- [ ] **다른 팀원 컴퓨터에서 같은 계정으로 로그인 → 같은 계획표가 보임**
- [ ] `.env` 를 `STORAGE_MODE=json` 으로 바꿔도 서비스가 돌아감 (예비 방식)

오류가 나면 서버 창의 `[오류]` 문구를 복사해서 공유합니다. **키가 보이는 부분은 지우고** 공유하세요.

---

## 운영할 때 기억할 것
- **무료 플랜은 1주일 동안 사용이 거의 없으면 일시 정지**됩니다. 데이터는 그대로 남아 있지만, 대시보드에서 다시 켜야(Restore) 쓸 수 있습니다. **발표 전날 꼭 접속해서 확인**하세요.
- Supabase가 멈춰 있어도 홈 · 추천 화면은 `data/` 폴더 파일로 보입니다. 로그인 · 계획표는 "데이터 저장소에 연결하지 못했어요" 안내가 나옵니다. 급할 때는 `STORAGE_MODE=json` 으로 바꿔 시연합니다.
- secret 키가 유출되면 **API Keys 화면에서 그 키를 삭제하고 새로 만든 뒤** 모든 팀원의 `.env` 를 바꿉니다.
