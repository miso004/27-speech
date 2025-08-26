# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 프로젝트 개요

CLOVA Speech API를 활용한 음성/영상 텍스트 변환과 CLOVA Text Summary API를 활용한 텍스트 요약 기능을 제공하는 Next.js 15 애플리케이션 "SmartNote"입니다. 한국어를 지원하며 모던한 글라스모피즘 UI 디자인을 적용했습니다.

## 핵심 아키텍처

- **프레임워크**: Next.js 15 with App Router
- **프론트엔드**: React 19 with TypeScript
- **스타일링**: Tailwind CSS v4 + 커스텀 글라스모피즘 디자인 시스템
- **API 연동**: CLOVA Speech-to-Text 및 Text Summary API
- **런타임**: API 라우트용 Node.js 백엔드

## 주요 기능

- 다중 입력 지원: 파일 업로드(음성/영상/텍스트), 유튜브 URL, 직접 텍스트 입력
- 화자 구분 기능이 포함된 음성-텍스트 변환
- AI 기반 텍스트 요약
- 드래그 앤 드롭 파일 업로드
- 애니메이션 배경이 적용된 모던 글라스모피즘 UI
\
## 개발 명령어

```bash
# Turbopack을 사용한 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 코드 린트
npm run lint
```

## 파일 구조

- `src/app/page.tsx` - 탭 인터페이스와 파일 처리가 포함된 메인 애플리케이션 UI
- `src/app/api/convert/route.ts` - 음성-텍스트 변환용 CLOVA Speech API 연동
- `src/app/api/summary/route.ts` - CLOVA Text Summary API 연동
- `src/app/globals.css` - 글라스모피즘 디자인 시스템과 애니메이션이 포함된 커스텀 CSS
- `tailwind.config.js` - 커스텀 컬러, 그림자, 애니메이션이 확장된 Tailwind 설정

## API 연동

### CLOVA Speech-to-Text (/api/convert)
- 엔드포인트: `https://clovaspeech-gw.ncloud.com/external/v1/.../recognizer/upload`
- 지원 기능: 화자 구분 기능이 포함된 오디오/비디오 파일 업로드
- 응답: 화자 라벨이 포함된 포맷된 텍스트
- 설정: 한국어, 동기 완료, 단어 정렬, 노이즈 필터링

### CLOVA Text Summary (/api/summary)
- 엔드포인트: `https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize`
- 입력: 변환 결과의 텍스트 내용
- 출력: 톤과 개수 설정이 가능한 AI 생성 요약

## 2025 트렌드 디자인 시스템

최신 디자인 트렌드를 적용한 정교한 글라스모피즘과 뉴모피즘 하이브리드:
- **모던 컬러 팔레트**: Primary/Accent 색상 시스템 (50-950 단계)
- **고급 글라스 효과**: 다층 백드롭 블러와 하이라이트 효과
- **마이크로 인터랙션**: 호버 시 scale, translate, glow 효과
- **반응형 레이아웃**: 모바일 우선 설계 (xs ~ 3xl 브레이크포인트)
- **접근성 지원**: 고대비 모드, 모션 감소 옵션
- **애니메이션**: pulse-glow, shimmer, scale-in, slide-up 등
- **타이포그래피**: Inter Variable 폰트, 정교한 크기 체계

## 지원 파일 형식

- 오디오: MP3, MP4, WAV, M4A
- 문서: TXT, PDF, DOC, DOCX
- URL: 유튜브 링크 (향후 구현 예정)

## 현재 구현 상태

### ✅ 완료된 기능
- 보라색 그라데이션 배경의 모던 UI 디자인
- 파일 업로드 (드래그앤드롭 포함)
- CLOVA Speech-to-Text 변환 기능
- 화자 구분 텍스트 출력
- 텍스트 요약 기능
- 기본적인 에러 핸들링

### 🚧 향후 개발 작업 목록

#### 1. 핵심 기능 확장
- **유튜브 링크 변환 기능 구현**: youtube-dl/yt-dlp를 활용한 음성 추출 후 변환
- **파일 업로드 결과 표시 개선**: 변환 진행률, 실시간 피드백
- **요약 기능 테스트 및 개선**: 다양한 텍스트 길이와 형식 테스트
- **결과 다운로드/내보내기 기능**: TXT, PDF, JSON 형식 지원

#### 2. 사용자 경험 개선
- **변환 기록 페이지 구현**: 과거 변환 결과 저장 및 관리
- **설정 페이지 구현**: API 설정, 요약 옵션, UI 테마 설정
- **도움말 페이지 구현**: 사용 가이드, FAQ, 지원 파일 형식 안내
- **로딩 상태 및 프로그레스 바 개선**: 더 직관적인 진행률 표시

#### 3. 기술적 개선
- **API 키 환경변수 분리**: 보안 강화를 위한 환경변수 관리
- **에러 핸들링 강화**: 네트워크 오류, API 한도 초과 등 다양한 상황 대응
- **파일 크기 제한 및 검증 강화**: 대용량 파일 처리 최적화
- **성능 최적화 및 캐싱**: 결과 캐싱, 이미지 최적화

#### 4. UI/UX 완성
- **모바일 반응형 최적화**: 터치 인터페이스, 작은 화면 최적화
- **접근성 개선**: 키보드 네비게이션, 스크린 리더 지원
- **다크/라이트 모드**: 사용자 선호도에 따른 테마 전환

#### 5. 품질 보증
- **테스트 코드 작성**: Unit, Integration, E2E 테스트
- **배포 준비**: Docker 컨테이너화, CI/CD 파이프라인
- **문서화 완성**: API 문서, 사용자 매뉴얼

## 중요 사항

- API 키가 현재 라우트 파일에 하드코딩되어 있음 - 보안을 위해 환경변수로 이동 필요
- 유튜브 URL 처리는 현재 구현되지 않음 (에러 메시지만 반환)
- 파일 업로드는 FormData, 텍스트 기반 API 호출은 JSON 사용
- 현재 CLOVA API 무료 사용량 제한 고려 필요