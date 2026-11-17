# db 폴더 — JSON 저장 방식 데이터 (`STORAGE_MODE=json`)

Supabase를 쓰지 않을 때(예비 · 오프라인 시연) 서버가 이 폴더에 데이터를 저장합니다.
서버를 JSON 방식으로 처음 실행하면 아래 파일이 자동으로 만들어집니다.
개인정보가 들어 있으므로 GitHub에는 올리지 않습니다 (`.gitignore`).

| 파일 | 데이터 | Supabase 테이블 |
| --- | --- | --- |
| `users.json` | 회원 데이터 | `users` |
| `plans.json` | 마이 데이터 (요일별 계획표) | `plans` |
| `share_settings.json` | 계획표 공유 설정 | `share_settings` |
| `likes.json` | 좋아요 | `likes` |
| `secret_key.txt` | 로그인 상태 암호화 키 (`.env`의 FLASK_SECRET_KEY가 없을 때) | — |

- 여기 쌓인 데이터를 Supabase로 옮기려면: `python server/scripts/upload_data.py --with-db`
