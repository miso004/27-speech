import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// YouTube URL 유효성 검사
function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&\S*)?$/;
  return youtubeRegex.test(url);
}

// YouTube 비디오 ID 추출
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '유튜브 URL을 입력해주세요.' }, { status: 400 });
    }

    // URL 유효성 검사
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json({ 
        error: '올바른 유튜브 URL을 입력해주세요. (예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/...)' 
      }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: '유효하지 않은 유튜브 URL입니다.' }, { status: 400 });
    }

    // 임시로 유튜브 기능 비활성화 (ytdl-core 이슈로 인해)
    return NextResponse.json({ 
      error: '유튜브 변환 기능은 현재 YouTube 정책 변경으로 인해 일시적으로 사용할 수 없습니다. 대신 음성 파일을 직접 업로드하거나 텍스트를 입력해주세요.' 
    }, { status: 503 });

    // TODO: 추후 안정적인 YouTube 처리 방법 구현
    // 옵션 1: yt-dlp Python 패키지 사용하여 서버에서 처리
    // 옵션 2: YouTube API v3 + 외부 오디오 다운로드 서비스 연동
    // 옵션 3: 사용자가 직접 오디오 파일을 다운로드하여 업로드하도록 안내

  } catch (error) {
    console.error('YouTube API Error:', error);
    
    return NextResponse.json({ 
      error: '유튜브 처리 중 오류가 발생했습니다. 현재 YouTube 정책으로 인해 서비스가 제한됩니다.' 
    }, { status: 500 });
  }
}