# 🌱 두레

**다로리인 x 큰글씨 | 한양대 테크포임팩트 2026**

경북 청도군 다로리 마을 방과후 돌봄 프로그램의 아이들이
AI와 직접 대화하며 오늘의 경험을 기록하고,
이 과정이 자연스러운 AI 리터러시 교육이 되는 시스템입니다.

---

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. API 키 설정 (선택)

**API 키 없이 (데모 모드):** 그냥 바로 실행 가능. AI 응답은 미리 정의된 답변으로 동작.

**실제 AI 연동:** Anthropic API 키 설정
```bash
# 방법 A: 환경변수로 직접 실행
ANTHROPIC_API_KEY=sk-ant-xxxx node server.js

# 방법 B: .env 파일 생성
cp .env.example .env
# .env 파일에 실제 API 키 입력 후
node server.js
```

### 3. 서버 실행
```bash
node server.js
```

브라우저에서 → http://localhost:3000

---

## 📱 주요 기능

| 페이지 | 경로 | 대상 |
|--------|------|------|
| 메인 홈 | `/` | 역할 선택 |
| 아이 채팅 | `/child.html` | 아이 → AI 마루와 대화 |
| 선생님 기록 | `/teacher.html` | 활동 기록 입력 |
| 부모 리포트 | `/parent.html` | 성장 기록 + AI 리포트 |
| 운영자 대시보드 | `/dashboard.html` | 다로리인 전체 현황 |

---

## 🔧 API 엔드포인트

| Method | Route | 설명 |
|--------|-------|------|
| GET | `/api/children` | 아이 목록 |
| GET | `/api/activities` | 활동 종류 |
| GET | `/api/villages` | 마을 목록 |
| POST | `/api/chat/start` | AI 첫 메시지 생성 |
| POST | `/api/chat` | AI 대화 이어가기 |
| POST | `/api/conversations/save` | 대화 저장 |
| GET | `/api/conversations/:childId` | 아이별 대화 목록 |
| POST | `/api/records` | 활동 기록 저장 |
| GET | `/api/records` | 활동 기록 조회 |
| POST | `/api/report/generate` | AI 역량 리포트 생성 |
| GET | `/api/report/:childId` | 리포트 조회 |
| GET | `/api/dashboard` | 대시보드 통계 |

---

## 🎯 핵심 차별점

기존 에듀테크: **AI가 아이를 분석** (선생님 관찰 → AI → 부모 리포트)

우리 시스템: **아이가 AI를 도구로 사용** (아이 경험 → AI 대화 → 기록 → 리포트)

이 과정에서 아이는 자연스럽게 AI 리터러시를 습득합니다.
- 어떻게 말해야 AI가 이해하는지 (프롬프팅)
- AI 답변을 그대로 수용하지 않고 직접 수정 (비판적 사고)

---

## 🌱 Tech Stack

- **Backend**: Node.js + Express
- **AI**: Claude claude-sonnet-4-20250514 (Anthropic)
- **Frontend**: Vanilla HTML/CSS/JS (빠른 실행, 별도 빌드 불필요)
- **Data**: In-memory (프로토타입) → 실서비스 시 PostgreSQL/MongoDB 연동

---

*큰글씨: 정병국(PM) · 박수현(UX) · 김준한(AI) · 노종현(FE) · 김경원(BE)*
