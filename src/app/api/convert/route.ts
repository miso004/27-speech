import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface Speaker {
  label: string;
  name: string;
  edited: boolean;
}

interface Segment {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: {
    label: string;
    name: string;
    edited: boolean;
  };
}

interface ClovaSpeechResponse {
  text?: string;
  segments?: Segment[];
  speakers?: Speaker[];
  error?: {
    errorCode: string;
    message: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // 요청 크기 검증
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB 제한
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.' },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // 파일 크기 검증
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.' },
        { status: 413 }
      );
    }

    // 파일 형식 검증 강화
    const supportedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a',
      'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/webm'
    ];
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const supportedExtensions = ['mp3', 'mp4', 'wav', 'm4a', 'webm'];
    
    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { error: `지원되지 않는 파일 형식입니다. 지원 형식: ${supportedExtensions.join(', ').toUpperCase()}` },
        { status: 415 }
      );
    }

    // 파일을 ArrayBuffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // CLOVA Speech-to-Text API 호출
    const CLOVA_URL = process.env.CLOVA_SPEECH_URL;
    const API_KEY = process.env.CLOVA_SPEECH_API_KEY;

    if (!CLOVA_URL || !API_KEY) {
      console.error('CLOVA Speech API 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'API 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    // 요청 본문 및 헤더 구성
    const requestBody = {
      language: 'ko-KR',
      completion: 'sync',
      wordAlignment: true,
      fullText: true,
      noiseFiltering: true
    };

    // 웹 API의 FormData 사용
    const apiFormData = new FormData();
    apiFormData.append('media', new Blob([buffer], { type: file.type || 'audio/mp3' }), file.name);
    apiFormData.append('params', JSON.stringify(requestBody));

    console.log('API 요청 시작:', {
      url: CLOVA_URL,
      fileName: file.name,
      fileType: file.type,
      fileSize: buffer.length,
      params: requestBody
    });

    const response = await fetch(CLOVA_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json', 
        'X-CLOVASPEECH-API-KEY': API_KEY
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CLOVA API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText
      });

      let errorMessage = '음성 변환 중 오류가 발생했습니다.';
      
      // 상세한 에러 메시지 제공
      switch (response.status) {
        case 400:
          errorMessage = '잘못된 파일 형식이거나 파일이 손상되었습니다.';
          break;
        case 401:
          errorMessage = 'API 인증에 실패했습니다. 관리자에게 문의하세요.';
          break;
        case 403:
          errorMessage = 'API 사용 권한이 없습니다.';
          break;
        case 413:
          errorMessage = '파일 크기가 너무 큽니다.';
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

    const data = await response.json() as ClovaSpeechResponse;
    console.log('CLOVA 응답:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('CLOVA API 에러 응답:', data.error);
      return NextResponse.json(
        { error: data.error.message || '음성 변환 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 시간 순서대로 대화 형태로 포맷팅 (화자별 그룹화 없이)
    const formattedText = data.segments
      ?.map(segment => {
        if (segment.speaker) {
          const speakerName = segment.speaker.name || `Speaker ${segment.speaker.label}`;
          return `${speakerName}: ${segment.text}`;
        }
        return segment.text;
      })
      .join('\n\n') || '';

    console.log('추출된 텍스트:', formattedText);
    return NextResponse.json({ 
      text: formattedText,
      speakers: data.speakers,
      segments: data.segments
    });
  } catch (error) {
    console.error('Error in convert API:', error);
    
    let errorMessage = '서버 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 파일이 너무 크거나 서버가 바쁜 상태입니다.';
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 