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

## 중요 사항

- API 키가 현재 라우트 파일에 하드코딩되어 있음 - 프로덕션 환경에서는 환경변수로 이동 필요
- 유튜브 URL 처리는 구현되지 않음 (에러 메시지 반환)
- 포괄적인 파일 타입 검증 및 에러 핸들링 포함
- 파일 업로드는 FormData, 텍스트 기반 API 호출은 JSON 사용