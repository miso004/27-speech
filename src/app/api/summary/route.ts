import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '요약할 텍스트가 없습니다.' }, { status: 400 });
    }
    
    if (text.length < 100) {
      return NextResponse.json({ error: '텍스트가 너무 짧습니다. 최소 100자 이상이어야 합니다.' }, { status: 400 });
    }
    
    if (text.length > 10000) {
      return NextResponse.json({ error: '텍스트가 너무 깁니다. 최대 10,000자까지 지원됩니다.' }, { status: 413 });
    }

  const CLOVA_URL = process.env.CLOVA_SUMMARY_URL;
  const API_KEY = process.env.CLOVA_SUMMARY_API_KEY_ID;
  const API_SECRET = process.env.CLOVA_SUMMARY_API_SECRET;

  if (!CLOVA_URL || !API_KEY || !API_SECRET) {
    console.error('CLOVA Summary API 환경변수가 설정되지 않았습니다.');
    return NextResponse.json(
      { error: 'API 설정이 올바르지 않습니다.' },
      { status: 500 }
    );
  }

  // 텍스트 전처리: 화자 정보 제거 및 정리
  const cleanedText = text
    .replace(/^.*?:\s*/gm, '') // 화자 정보 제거 (예: "Speaker 1: " 제거)
    .replace(/\n{2,}/g, '\n') // 연속된 개행 정리
    .trim();

  const body = {
    document: {
      content: cleanedText,
    },
    option: {
      language: 'ko',
      model: 'general',
      tone: 2, // 0: 단문체, 1: 구어체, 2: 문어체
      summaryCount: 3, // 요약 문장 수
    },
  };

  const response = await fetch(CLOVA_URL, {
    method: 'POST',
    headers: {
      'X-NCP-APIGW-API-KEY-ID': API_KEY,
      'X-NCP-APIGW-API-KEY': API_SECRET,
      'X-NCP-CLOVASTUDIO-API-KEY': API_KEY,
      'X-NCP-CLOVASTUDIO-REQUEST-ID': Date.now().toString(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CLOVA Summary API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      let errorMessage = '텍스트 요약 중 오류가 발생했습니다.';
      
      switch (response.status) {
        case 400:
          errorMessage = '텍스트 형식이 올바르지 않습니다.';
          break;
        case 401:
          errorMessage = 'API 인증에 실패했습니다. 관리자에게 문의하세요.';
          break;
        case 403:
          errorMessage = 'API 사용 권한이 없습니다.';
          break;
        case 413:
          errorMessage = '텍스트가 너무 깁니다.';
          break;
        case 429:
          errorMessage = 'API 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
          break;
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    console.log('CLOVA Summary 응답:', JSON.stringify(data, null, 2));
    
    const summary = data?.summary || '';
    
    if (!summary) {
      console.error('빈 요약 결과:', data);
      return NextResponse.json({ 
        error: '요약 결과가 비어있습니다. 텍스트 내용을 확인해주세요.' 
      }, { status: 422 });
    }
    
    // 요약 품질 검사
    if (summary.length < 10) {
      console.warn('짧은 요약 결과:', summary);
    }
    
    return NextResponse.json({ 
      summary,
      metadata: {
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((summary.length / cleanedText.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('Error in summary API:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 