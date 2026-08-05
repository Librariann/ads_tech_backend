# Notion Database Architecture 구성안

## 권장 페이지 구조

```text
Architecture
└─ Database Architecture
   ├─ 1. Overview & Design Principles
   ├─ 2. ERD
   ├─ 3. Database Schema Dictionary
   ├─ 4. Data Lifecycle & Security
   ├─ 5. Architecture Decision Records
   └─ 6. Migration Log
```

`Database Architecture` 본문에는 전체 구조를 설명하는 원칙과 ERD를 둔다. 모든 컬럼 목록을 ERD 아래에 길게 나열하지 않고, 하위의 `Database Schema Dictionary`를 Notion 데이터베이스로 만들어 테이블 단위로 관리한다.

## Schema Dictionary 속성

| 속성 | Notion 유형 | 설명 |
|---|---|---|
| Table | 제목 | 실제 PostgreSQL 테이블명 |
| Domain | 선택 | Identity, Workspace, Billing, Advertising, Campaign, Publishing, Performance, AI, Reporting, Audit |
| Purpose | 텍스트 | 테이블의 단일 책임 |
| Primary Key | 텍스트 | id 또는 복합키 |
| Main Relations | 텍스트 | 주요 FK 관계 |
| Sensitive Data | 선택 | None, PII, Token, Payment, Customer Data |
| Retention | 선택 | Active only, Soft delete, Contract policy, Legal policy, Append only |
| Entity File | URL 또는 텍스트 | 백엔드 엔티티 위치 |
| Migration | 텍스트 | 최초 생성 migration |
| Status | 상태 | Draft, Implemented, Deprecated |
| Last Reviewed | 날짜 | 마지막 설계 검토일 |

각 테이블 페이지 안에는 다음 순서로 기록한다.

1. 목적과 데이터 grain
2. 컬럼 목록: Column, Type, Nullable, Default, Description
3. PK·FK·UNIQUE·CHECK 제약
4. 조회 인덱스
5. 삭제·보존 정책
6. 관련 API 또는 배치 작업
7. 변경 이력과 결정 사항

## 테이블 목록

| Table | Domain | Purpose | Sensitive Data | Retention |
|---|---|---|---|---|
| users | Identity | 로그인 사용자와 계정 상태 | PII | Soft delete |
| oauth_accounts | Identity | 로그인 OAuth 제공자 계정 매핑 | PII | Active only |
| workspaces | Workspace | 모든 사업 데이터의 최상위 소유자 | Customer Data | Soft delete |
| workspace_members | Workspace | 사용자와 워크스페이스 권한 | PII | Contract policy |
| business_profiles | Workspace | 사업·상품·광고 목표와 KPI | Customer Data | Contract policy |
| plans | Billing | 판매 플랜과 가격 버전 | None | Append only |
| plan_entitlements | Billing | 플랜별 기능·사용량 제한 | None | Append only |
| subscriptions | Billing | 워크스페이스 구독 상태 | Payment | Legal policy |
| billing_transactions | Billing | SaaS 결제·취소·환불 원장 | Payment | Legal policy |
| billing_webhook_events | Billing | 결제 웹훅 수신·처리 이력 | Payment | Legal policy |
| usage_events | Billing | AI 요청·토큰 사용량 원장 | Customer Data | Contract policy |
| ad_platform_connections | Advertising | 광고 플랫폼 인증 연결 | Token | Contract policy |
| ad_accounts | Advertising | 연결된 외부 광고계정 | Customer Data | Contract policy |
| sync_jobs | Advertising | 광고 데이터 수집 작업과 실패 상태 | Customer Data | Contract policy |
| campaigns | Campaign | 공통 캠페인의 식별자와 현재 상태 | Customer Data | Contract policy |
| campaign_versions | Campaign | 캠페인 설정의 불변 버전 | Customer Data | Append only |
| campaign_budget_allocations | Campaign | 버전·광고계정별 예산과 입찰 설정 | Customer Data | Append only |
| campaign_target_rules | Campaign | 공통·플랫폼별 타기팅 조건 | Customer Data | Append only |
| campaign_destinations | Campaign | 캠페인과 게시 대상 광고계정 관계 | Customer Data | Contract policy |
| creatives | Campaign | 버전별 광고 문구와 소재 구성 | Customer Data | Contract policy |
| creative_assets | Campaign | 이미지·영상 파일 메타데이터 | Customer Data | Contract policy |
| publish_jobs | Publishing | 사용자 승인 단위의 게시 작업 | Customer Data | Append only |
| publish_tasks | Publishing | 플랫폼·광고계정별 게시 결과 | Customer Data | Append only |
| publish_task_steps | Publishing | 캠페인·그룹·소재·광고 단계별 결과 | Customer Data | Append only |
| platform_operation_attempts | Publishing | 플랫폼 API 실행·재시도별 요청과 결과 | Customer Data | Append only |
| platform_campaign_bindings | Publishing | 공통 캠페인과 외부 캠페인 ID 매핑 | Customer Data | Contract policy |
| daily_performance | Performance | 광고계정·캠페인·일자별 원시 성과 | Customer Data | Contract policy |
| ai_analyses | AI | 분석 입력·근거·모델·결과 스냅샷 | Customer Data | Contract policy |
| recommendations | AI | 근거 기반 추천 행동 | Customer Data | Contract policy |
| recommendation_events | AI | 추천 상태와 메모 변경 이력 | Customer Data | Append only |
| reports | Reporting | 기간별 성과 리포트 스냅샷 | Customer Data | Contract policy |
| report_deliveries | Reporting | 이메일 발송·실패 이력 | PII | Contract policy |
| audit_logs | Audit | 결제·게시·관리 작업의 변경 이력 | PII | Append only |

## ERD 운영 기준

- 전체 ERD에는 테이블명, PK, 핵심 FK만 표시한다.
- 모든 컬럼을 표시한 상세 ERD는 도메인별로 나눈다.
- 추천 도메인 ERD: Identity & Workspace, Billing, Advertising & Campaign, Performance & AI.
- 외래키 방향과 cascade·restrict 정책은 Schema Dictionary에 기록한다.
- 실제 구현의 기준은 TypeORM 엔티티와 migration이며 Notion은 이를 설명하는 문서로 사용한다.

## Migration Log 속성

| 속성 | 유형 | 설명 |
|---|---|---|
| Migration | 제목 | migration 클래스 또는 파일명 |
| Applied Date | 날짜 | 적용일 |
| Environment | 다중 선택 | Local, Staging, Production |
| Change Type | 선택 | Create, Alter, Data, Index, Constraint |
| Summary | 텍스트 | 변경 내용 |
| Rollback Tested | 체크박스 | down migration 검증 여부 |
| Related Decision | 관계형 | 관련 ADR |
| Release | 텍스트 | 포함된 릴리스 |
