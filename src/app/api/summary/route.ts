import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: '요약할 텍스트가 없습니다.' }, { status: 400 });
  }

  const CLOVA_URL = 'https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize';
  const API_KEY = '08rrxysx5w';
  const API_SECRET = '6UDkPTSxIFI7gYBXAD94O3x5lZuhbfS079sTM6TL';

  const body = {
    document: {
      content: text,
    },
    option: {
      language: 'ko',
      model: 'general',
      tone: 2,
      summaryCount: 3,
    },
  };

  const response = await fetch(CLOVA_URL, {
    method: 'POST',
    headers: {
      'X-NCP-APIGW-API-KEY-ID': API_KEY,
      'X-NCP-APIGW-API-KEY': API_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  const data = await response.json();
  const summary = data?.summary || '';
  return NextResponse.json({ summary });
} 