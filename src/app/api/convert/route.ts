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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // 파일을 ArrayBuffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // CLOVA Speech-to-Text API 호출
    // const CLOVA_URL = 'https://clovaspeech-gw.ncloud.com/v1/recognizer/upload';
    const CLOVA_URL = 'https://clovaspeech-gw.ncloud.com/external/v1/11685/d3a6f1ef48abba27bf857f15438d9c40f516f73dca06c9b23cabcbd4e6bfa190/recognizer/upload';
    // const API_KEY = '08rrxysx5w';
    // const API_SECRET = '6UDkPTSxIFI7gYBXAD94O3x5lZuhbfS079sTM6TL';

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
        // 'X-CLOVASPEECH-API-KEY': API_KEY,
        // 'X-CLOVASPEECH-API-SECRET': API_SECRET,
        'Accept': 'application/json', 
        'X-CLOVASPEECH-API-KEY': 'b62c91334c54498ab81bda8fe5f39930'
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
      return NextResponse.json(
        { error: '음성 변환 중 오류가 발생했습니다.' }, 
        { status: response.status }
      );
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

    // 화자별로 텍스트 그룹화
    const speakerTexts: { [key: string]: string[] } = {};
    data.segments?.forEach(segment => {
      if (segment.speaker) {
        const speakerName = segment.speaker.name || `Speaker ${segment.speaker.label}`;
        if (!speakerTexts[speakerName]) {
          speakerTexts[speakerName] = [];
        }
        speakerTexts[speakerName].push(segment.text);
      }
    });

    // 화자별 텍스트를 포맷팅
    const formattedText = Object.entries(speakerTexts)
      .map(([speaker, texts]) => `${speaker}: ${texts.join(' ')}`)
      .join('\n\n');

    console.log('추출된 텍스트:', formattedText);
    return NextResponse.json({ 
      text: formattedText,
      speakers: data.speakers,
      segments: data.segments
    });
  } catch (error) {
    console.error('Error in convert API:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 