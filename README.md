# 머신메이트 (헬스 기구 사용법 안내 AI)

운동 부위를 고르면 맞는 헬스 기구를 추천하고, 기구 사용법을 안내하는 모바일 웹 서비스입니다.
'생성형 AI 활용' 수업 팀 프로젝트 — 맘스터치 (신지수, 최준영)

- **실행 방법**: 내 컴퓨터에서 `python server/app.py` → `http://localhost:5000` (아래 ‘실행 방법’)
- GitHub Pages 주소(`sjisu60-oss.github.io/moms-touch/`)는 화면만 보이고 로그인 · 계획표 저장은 안 됩니다.

| 구분 | 현재 버전 | 변경일자 |
| --- | --- | --- |
| 서비스 (화면 · 코드) | **0.13** | 2026-11-24 |
| PRD | **0.3** | 2026-11-17 |

---

## 변경 이력

최신 버전이 맨 위에 있습니다. 변경일자가 같은 버전은 한 줄로 묶었고, 변경 내역은 바로 이전 날짜의 버전과 비교한 내용입니다.

| 버전 | 변경일자 | 변경 내역 (이전 버전 대비) |
| --- | --- | --- |
| **0.13**<br>(0.11 ~ 0.13) | 2026-11-24 | **홈 화면 개편** (팀 피드백)<br>• 히어로 영역에 운동 모션 추가: 바벨 스쿼트 애니메이션 (0.13: 윈도우 ‘애니메이션 효과’ 설정과 상관없이 항상 움직이도록 수정)<br>• ‘지금 인기 스케줄’: ‘더 보기’ 삭제, **저장 많은 순 상위 3개를 한 장씩 롤링** (3.5초마다 넘어감, 점 · 밀어서 넘기기, 올려 두면 멈춤)<br>• CSS · JS 주소에 버전(?v=0.13)을 붙여 브라우저가 예전 파일을 쓰지 않게 함<br>• 인기 스케줄 카드: 작성자(회원 정보) 숨김, 좋아요 삭제, 오른쪽에 저장 버튼 + 저장 수<br>• ‘이렇게 사용해요’ 삭제 → **오늘의 랜덤 기구**(부위별 랜덤 뽑기) 추가: 뽑은 기구의 사용법 보기 · 계획표에 추가 (`js/draw.js`)<br>**저장 수 기록**<br>• Supabase 테이블 추가: 저장 기록 `saves` (회원마다 한 번만 셈), 공유 예시에 기본 저장 수 `saves` 칸 추가<br>• API 추가: `POST /api/saves/<계획표 id>`, 공유 목록에 저장 수 포함<br>• 기존 프로젝트용 `server/supabase/migration_0.12.sql` 추가 (saves 테이블이 없어도 공유 목록은 그대로 보임)<br>**실행 방식 · 문구 (0.11)**<br>• 실행 방식 결정: 내 컴퓨터에서 서버 실행 (Render 배포 설정은 검토 후 삭제)<br>• 화면 문구 수정: 저장 위치 안내 ‘db 폴더(JSON 파일)’ → ‘Supabase 데이터베이스’, 서버가 꺼져 있을 때 실행 방법 안내 |
| 0.10<br>(0.9 ~ 0.10) | 2026-11-17 | **데이터 저장 위치 결정 · Supabase 연동** (교수님 피드백)<br>**서버**<br>• Flask 서버 추가 (`server/`): 화면 파일 제공 + 데이터 저장 + 입력값 검사<br>• 저장 위치 변경: 브라우저 localStorage → **Supabase 데이터베이스** (예비: 서버 `db/` 폴더 JSON 파일)<br>• `.env`의 `STORAGE_MODE`로 저장 방식 선택 (`supabase` / `json`)<br>• Supabase 테이블 6개: 회원 `users` · 계획표 `plans` · 공유 설정 `share_settings` · 좋아요 `likes` · 기구 `exercises` · 공유 예시 `shared_samples`<br>• 기구 · 공유 예시 데이터도 서버(DB)에서 읽음 (연결 안 되면 `data/` 파일 사용)<br>**계정 · 보안**<br>• 비밀번호 해시를 서버에서 처리 (브라우저 SHA-256 → 서버 werkzeug)<br>• 로그인 상태를 서버 세션(쿠키)으로 유지 → 다른 기기 · 브라우저에서도 같은 계정 · 계획표 사용<br>• Supabase secret 키는 서버 `.env`에만 저장, 테이블에 RLS를 켜서 브라우저용 키로는 접근 불가<br>• `.gitignore` 추가: `.env`, JSON 방식 회원 데이터는 GitHub에 올리지 않음<br>**도구 · 문서**<br>• `server/supabase/schema.sql`(테이블 생성), `check_supabase.py`(연결 확인), `upload_data.py`(데이터 올리기 · JSON 데이터 옮기기)<br>• `docs/supabase_setup.md` 팀원용 연결 가이드, `.env.example` 설정 견본<br>**화면**<br>• JS 파일 추가: `server.js`(서버와 데이터 주고받기)<br>• 비회원이 담은 계획표만 브라우저에 임시 저장 → 로그인하면 서버로 옮김<br>• 서버가 꺼져 있으면 로그인 · 회원가입 화면에 실행 방법 안내<br>**GitHub 정리**<br>• PRD 0.1 ~ 0.3 문서를 `docs/prd/`에 보관<br>• 이전 버전 화면 폴더 이름 변경: `page/` → `archive/`<br>• `.gitignore` 보강 (`.env`, 회원 데이터, 파이썬 · 편집기 파일)<br>• `docs/github_upload.md` GitHub 올리는 방법 추가 |
| 0.8<br>(0.5 ~ 0.8) | 2026-11-10 | **파일 구조** (교수님 요청: 파일 구분)<br>• HTML 한 파일 → `index.html` / `css` / `js` / `data` / `assets` 폴더로 분리<br>• JS를 기능별 6개 파일로 분리 (`data` · `storage` · `auth` · `plan` · `share` · `app`)<br>• 데이터를 JSON 파일로 변경 (`data/exercises.json`, `data/shared_plans.json`)<br>• 사진(base64)을 jpg 파일 18장으로 분리 → `assets/images/`<br>• README 추가<br>**이름 · 화면** (11주차 교수님 피드백 포함)<br>• 앱 이름 변경: FIT GUIDE AI → 머신메이트<br>• 하단 탭 변경: 계획표 / 홈 / 마이페이지 → 홈 / 부위별 추천 / 스케줄 공유 / 마이페이지<br>• 홈: '운동 부위 고르기' 버튼을 초록 박스 안으로 이동, '바로 고르기' 삭제, '이렇게 사용해요' 4단계로 수정, '지금 인기 스케줄'(좋아요 1위) 추가<br>• 상단 헤더 고정<br>**새 기능**<br>• 계획표: 요일 · 세트 · 횟수 선택, 완료 체크, 삭제 (마이페이지 안)<br>• 회원가입 · 로그인 · 로그아웃 · 회원 탈퇴<br>• 스케줄 공유: 목록 · 상세 · 좋아요 · 내 계획표에 저장 · 내 계획표 공개<br>• 부위별 추천 탭: 부위를 누르면 바로 추천 결과로 이동 |
| 0.4<br>(0.2 ~ 0.4) | 2026-11-03 | **와이어프레임 → 프로토타입**<br>• PRD 0.1의 화면 구성으로 그레이톤 와이어프레임을 만들고 프로토타입으로 발전 (`archive/` 폴더의 파일 3개)<br>• 화면 해상도: 아이폰 16 기준 (393×852)<br>• 화면을 메인 · 운동 부위 선택 · AI 추천 결과 3개로 정리 (화면 ID · 설계 메모 · 모델 평가 화면 삭제)<br>• 운동 부위에 '유산소' 추가 (5개 → 6개), 부위별 인체 그림 추가<br>• 기구 데이터 18종 연결 (free-exercise-db 한국어 번역)<br>• 추천 결과는 고정 예시 데이터, 화면에 '예시 데이터' 표시<br>• 예외 처리: 부위를 고르지 않고 추천을 누르면 경고<br>• 하단 탭: 계획표 / 홈 / 마이페이지 (계획표 · 마이페이지는 '준비 중' 안내)<br>• 초록 강조색, 기구 사진 컬러 |
| 0.1 | 2026-10-27 | • 프로젝트 기획서 ver.0.1 작성 (노션 9주차)<br>• 유저 스토리, 기능 우선순위, IA, PRD 0.1 작성 |

> 묶은 버전 안의 세부 단계: 0.9 = Flask 서버 · JSON 파일 저장, 0.10 = Supabase 연동 / 0.2 = `archive/wireframe_ver0.2.html`, 0.3 = `archive/wireframe_ver0.3.html`, 0.4 = `archive/prototype_ver01.html` / 0.5 = 파일 구분, 0.6 = 머신메이트 · 계획표 · 로그인, 0.7 = 11주차 피드백 · 스케줄 공유, 0.8 = 헤더 고정 · 인기 스케줄

---

## PRD 버전 관리

노션(맘스터치 › 팀 산출물)을 기준으로 관리하고, 같은 내용을 [`docs/prd/`](docs/prd/)에 보관합니다. 최신 버전이 맨 위에 있습니다.

| PRD 버전 | 작성일 | 노션 위치 · 파일 | 변경 내역 (이전 버전 대비) |
| --- | --- | --- | --- |
| **0.3** | 2026-11-17 | 노션 등록 필요<br>[prd_v0.3.md](docs/prd/prd_v0.3.md) | • 데이터 저장 위치 결정: **Supabase 데이터베이스** (예비: 서버 JSON 파일)<br>• Flask 서버 구현 반영 (화면 · 서버 · 데이터베이스 역할 정리)<br>• API 연동 · 보안 항목 추가: Supabase REST API, secret 키는 서버 `.env`에만, RLS<br>• 로그인: 서버에서 비밀번호 해시 · 세션 유지, 다른 기기에서도 같은 계정<br>• 기록할 데이터에 저장 위치(테이블 · 파일) 표 추가<br>• 예외 상황 추가: 서버 꺼짐, 데이터베이스 연결 실패<br>• 테스트 추가: 저장소 테스트 (자동 · 실제 Supabase)<br>• 문제 대응 추가: Supabase 일시 정지, 키 유출, 개발용 서버<br>• 기능 우선순위는 그대로: Must 5 / Should 1 / Could 4 / 제외 2 |
| 0.2 | 2026-11-10 | 팀 산출물 › 11주차<br>[prd_v0.2.md](docs/prd/prd_v0.2.md) | • 서비스 이름: 머신메이트<br>• 운동 부위 5개 → 6개 (유산소 추가)<br>• 기구 데이터 약 10종 → 18종 (예시 데이터)<br>• 개발 기간: 약 4주<br>• Could Have 추가: 요일별 계획표, 회원가입 · 로그인, 스케줄 공유, 홈 인기 스케줄<br>• 화면 구성을 프로토타입 기준으로 수정 (하단 탭: 홈 / 부위별 추천 / 스케줄 공유 / 마이페이지)<br>• 성능 평가 기준: K = 3, 정답 = 팀원이 출처를 보고 만든 부위별 정답 기구 목록<br>• 확인한 사실과 가설을 구분해 표시<br>• 기능 우선순위: Must 5 / Should 1 / Could 4 / 제외 2 |
| 0.1 | 2026-10-27 | 팀 산출물 › 9주차 (프로젝트 기획서 ver.0.1)<br>[prd_v0.1.md](docs/prd/prd_v0.1.md) | • 최초 작성<br>• 프로젝트 기획서 + 실습 1 유저 스토리, 실습 2 기능 우선순위, 실습 3 IA, 실습 4 PRD<br>• 운동 부위 5개, 기구 약 10종, 화면 SCR-001 ~ SCR-009<br>• 기능 우선순위: Must 5 / Should 1 / 제외 2 (사진 인식, 생성형 AI 대화형 상담) |

> PRD를 고치면 노션에 새 버전을 먼저 올리고, `docs/prd/`에 파일을 추가한 뒤, 이 표 맨 위에 한 줄을 추가합니다.

---

## 실행 방법

회원가입 · 로그인 · 계획표 저장은 **Flask 서버**가 처리하고, 데이터는 **Supabase**에 저장합니다.

**발표 · 시연은 발표 노트북에서 서버를 켜고 `http://localhost:5000`으로 접속합니다.**
처음 설정은 [`docs/supabase_setup.md`](docs/supabase_setup.md), GitHub에 올리는 방법은 [`docs/github_upload.md`](docs/github_upload.md)를 참고해 주세요.

1. 파이썬(3.10 이상)을 설치하고, 프로젝트 폴더에서 패키지를 설치합니다.
   ```
   pip install -r server/requirements.txt
   ```
2. `.env.example`을 복사해 `.env`를 만들고 Supabase 주소와 secret 키를 넣습니다.
   (Supabase 없이 시연하려면 `STORAGE_MODE=json`)
3. 서버를 실행합니다.
   ```
   python server/app.py
   ```
4. 브라우저에서 `http://localhost:5000` 에 접속합니다. (서버를 끄려면 `Ctrl + C`)

| 실행 방법 | 홈 · 추천 화면 | 로그인 · 계획표 저장 |
| --- | --- | --- |
| `python server/app.py` (STORAGE_MODE=supabase) | ✅ | ✅ Supabase에 저장 |
| `python server/app.py` (STORAGE_MODE=json) | ✅ | ✅ 이 컴퓨터 `db/` 폴더에 저장 |
| GitHub Pages · VS Code Live Server | ✅ | ❌ (서버 없음 안내) |
| index.html 더블클릭 | ❌ | ❌ |

---

## 폴더 구조

```
moms-touch/
├── README.md                 프로젝트 설명 · 변경 이력 · PRD 버전 관리
├── .env.example              설정 견본 (복사해서 .env로 사용, .env는 GitHub에 안 올림)
├── .gitignore                GitHub에 올리지 않을 파일 (.env, 회원 데이터)
├── index.html                화면 구조 (HTML)
├── css/
│   └── style.css             디자인
├── js/                       ── 브라우저에서 실행되는 코드 ──
│   ├── data.js               기구 · 공유 예시 데이터 불러오기 (서버 → 안 되면 data 폴더)
│   ├── storage.js            비회원 계획표 임시 저장 (브라우저)
│   ├── server.js             서버와 데이터 주고받기
│   ├── auth.js               로그인 · 회원가입 · 마이페이지
│   ├── plan.js               내 계획표 (추가 · 완료 체크 · 삭제)
│   ├── share.js              스케줄 공유 (목록 · 좋아요 · 저장 · 공유 설정)
│   ├── app.js                화면 이동 · 하단 탭 · 부위 선택 · 추천 결과 · 홈 운동 모션
│   └── draw.js               홈 ‘오늘의 랜덤 기구’ (부위별 랜덤 뽑기)
├── server/                   ── 서버 코드 (Flask) ──
│   ├── app.py                서버 실행 파일 (기능별 주소 등록 · 오류 처리)
│   ├── config.py             경로 · 저장 방식 · .env 설정 읽기
│   ├── validators.py         입력값 검사
│   ├── session_utils.py      로그인 상태 확인
│   ├── requirements.txt      필요한 파이썬 패키지
│   ├── routes/               기능별 주소(URL)
│   │   ├── auth.py           회원가입 · 로그인 · 로그아웃 · 탈퇴
│   │   ├── plan.py           내 계획표 불러오기 · 저장
│   │   ├── share.py          공유 설정 · 공유 목록 · 좋아요
│   │   ├── data.py           기구 · 공유 예시 데이터
│   │   └── pages.py          화면 파일 보내기
│   ├── stores/               저장 방식 (같은 함수 이름으로 바꿔 끼울 수 있음)
│   │   ├── base.py           저장소 공통 규칙
│   │   ├── supabase_store.py Supabase 저장 (기본)
│   │   └── json_store.py     db 폴더 JSON 파일 저장 (예비)
│   ├── supabase/
│   │   ├── schema.sql        Supabase 테이블 만들기 (SQL Editor에서 실행)
│   │   └── migration_0.12.sql 0.11 이전에 만든 프로젝트에 저장 기록 추가 (한 번만 실행)
│   └── scripts/              관리용 프로그램
│       ├── check_supabase.py 연결 · 테이블 확인
│       └── upload_data.py    기구 · 예시 데이터 올리기 (--with-db: JSON 데이터 옮기기)
├── docs/                     ── 문서 ──
│   ├── prd/                  PRD 버전별 문서 (prd_v0.1 · 0.2 · 0.3)
│   ├── supabase_setup.md     팀원용 Supabase 연결 가이드
│   └── github_upload.md      GitHub 올리는 방법
├── db/                       JSON 방식 데이터 (STORAGE_MODE=json일 때 자동 생성)
├── data/                     ── 서비스 기본 데이터 원본 (Supabase로 올리는 원본) ──
│   ├── exercises.json        기구 18개
│   └── shared_plans.json     스케줄 공유 예시 4개
├── assets/
│   └── images/               기구 사진 18장 (.jpg, 파일 이름 = 데이터의 id)
└── archive/                  이전 버전 화면 (보관용)
    ├── wireframe_ver0.2.html     버전 0.2
    ├── wireframe_ver0.3.html     버전 0.3
    └── prototype_ver01.html      버전 0.4
```

---

## 하단 탭과 화면

| 탭 | 화면 |
| --- | --- |
| 홈 | 서비스 소개 + 운동 모션, 운동 부위 고르기 → 부위 선택 → 추천 결과, 지금 인기 스케줄(저장 많은 순 3개 롤링), 오늘의 랜덤 기구 |
| 부위별 추천 | 운동 부위를 누르면 바로 AI 추천 결과로 이동 |
| 스케줄 공유 | 다른 사용자의 계획표 목록(인기순 · 최신순), 상세 보기, 좋아요, 내 계획표에 저장 |
| 마이페이지 | 로그인 · 회원가입, 프로필, 이번 주 통계, **내 계획표**, 내 계획표 공유 설정, 로그아웃, 회원 탈퇴 |

---

## 데이터 저장 위치

| 데이터 | Supabase (기본) | JSON 방식 (예비) | 비고 |
| --- | --- | --- | --- |
| 회원 데이터 | `users` | `db/users.json` | 비밀번호는 해시로 저장 |
| 마이 데이터 (계획표) | `plans` | `db/plans.json` | 회원별 요일 계획표 |
| 계획표 공유 설정 | `share_settings` | `db/share_settings.json` | 공개 여부 · 제목 · 소개 |
| 좋아요 | `likes` | `db/likes.json` | 계획표별 좋아요 누른 회원 |
| 기구 데이터 | `exercises` | `data/exercises.json` | 원본은 `data/` 폴더 |
| 공유 예시 | `shared_samples` | `data/shared_plans.json` | 원본은 `data/` 폴더 |
| 로그인 상태 | 서버 세션 (암호화된 쿠키) | 〃 | 키: `.env` 또는 `db/secret_key.txt` |
| 비회원 계획표 | 브라우저 localStorage | 〃 | 로그인하면 서버로 옮김 |

- **API 연동:** Supabase REST API를 secret 키로 연결합니다. 키는 서버 `.env`에만 두고 브라우저에는 보내지 않습니다.
- 모든 테이블에 RLS를 켜서, 브라우저용(publishable) 키로는 데이터를 읽거나 쓸 수 없습니다.
- 공유 목록에는 회원 이메일 대신 바꾼 id(`user-xxxx`)를 사용합니다.
- 무료 플랜은 1주일 동안 사용이 거의 없으면 일시 정지됩니다. 발표 전에 대시보드에서 확인하세요.

---

## 출처

- 기구 설명과 사진: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, 퍼블릭 도메인), 영문 설명을 한국어로 번역
- 추천 결과와 스케줄 공유 목록의 '예시 데이터'는 시연용 고정 데이터이며, 실제 AI 모델 결과나 실제 사용자가 아닙니다.
