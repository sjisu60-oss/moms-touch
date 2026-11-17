-- =========================================================
-- 머신메이트 Supabase 테이블 만들기
-- 사용법: Supabase 대시보드 → SQL Editor → New query →
--         이 파일 내용을 전부 붙여 넣고 Run
-- 여러 번 실행해도 괜찮습니다 (이미 있는 테이블은 건너뜀).
-- =========================================================

-- 1) 회원 데이터
create table if not exists public.users (
  email          text primary key,
  name           text not null,
  password_hash  text not null,              -- 비밀번호는 해시로만 저장
  joined         timestamptz not null default now()
);

-- 2) 마이 데이터: 요일별 계획표 (회원 1명당 1줄)
create table if not exists public.plans (
  email       text primary key references public.users(email) on delete cascade,
  plan        jsonb not null,                -- { "월": [ {id, sets, reps, done} ], ... }
  updated_at  timestamptz not null default now()
);

-- 3) 계획표 공유 설정
create table if not exists public.share_settings (
  email        text primary key references public.users(email) on delete cascade,
  is_on        boolean not null default false,
  title        text,
  description  text,
  updated_at   date
);

-- 4) 좋아요 (계획표 id + 누른 회원)
create table if not exists public.likes (
  plan_id     text not null,                 -- 예시 계획표 id 또는 user-xxxx
  email       text not null references public.users(email) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (plan_id, email)
);

-- 5) 기구 데이터 (data/exercises.json → upload_data.py로 올림)
create table if not exists public.exercises (
  id               text primary key,
  part             text not null,            -- 가슴 · 등 · 어깨 · 하체 · 팔 · 유산소
  sort_order       int  not null default 0,
  name             text not null,
  primary_muscles  jsonb not null,           -- ["대흉근(가슴)", ...]
  purpose          text,
  level            text,
  setup            text,
  step             text,
  caution          text,
  image            text                      -- assets/images/파일이름.jpg
);

-- 6) 스케줄 공유 예시 데이터 (data/shared_plans.json → upload_data.py로 올림)
create table if not exists public.shared_samples (
  id           text primary key,
  sort_order   int  not null default 0,
  author       text not null,
  title        text not null,
  description  text,
  likes        int  not null default 0,      -- 예시로 정해 둔 기본 좋아요 수
  created_at   date,
  days         jsonb not null               -- { "월": [ {id, sets, reps} ], ... }
);

-- 보안: 모든 테이블에 RLS(행 수준 보안)를 켭니다.
-- 정책(policy)을 만들지 않았으므로 publishable 키(브라우저용)로는 아무것도 읽거나 쓸 수 없고,
-- 서버의 secret 키로만 접근할 수 있습니다.
alter table public.users          enable row level security;
alter table public.plans          enable row level security;
alter table public.share_settings enable row level security;
alter table public.likes          enable row level security;
alter table public.exercises      enable row level security;
alter table public.shared_samples enable row level security;
