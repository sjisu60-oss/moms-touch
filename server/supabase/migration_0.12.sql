-- =========================================================
-- 0.12 업데이트용 SQL (이미 schema.sql을 실행한 Supabase 프로젝트에서 한 번만 실행)
-- Supabase → SQL Editor → 새 쿼리 → 아래 전체 붙여넣기 → Run
-- 여러 번 실행해도 문제없습니다.
-- =========================================================

-- 1) 저장 기록 테이블: 다른 사람 계획표를 내 계획표에 저장한 회원 (같은 회원은 한 번만 셈)
create table if not exists public.saves (
  plan_id     text not null,
  email       text not null references public.users(email) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (plan_id, email)
);
alter table public.saves enable row level security;

-- 2) 공유 예시 계획표에 기본 저장 수 칸 추가
alter table public.shared_samples add column if not exists saves int not null default 0;

-- 다 실행했으면 터미널에서:  python server/scripts/upload_data.py   (예시 데이터의 저장 수를 다시 올림)
