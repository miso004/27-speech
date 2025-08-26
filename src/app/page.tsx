"use client";
import { useState, useRef } from "react";
import { FiUpload, FiFileText, FiYoutube, FiEdit2, FiZap } from "react-icons/fi";

const TABS = [
  { key: "file", label: "파일 업로드", icon: <FiUpload /> },
  { key: "youtube", label: "유튜브 링크", icon: <FiYoutube /> },
  { key: "text", label: "텍스트 입력", icon: <FiEdit2 /> },
];

export default function Home() {
  const [tab, setTab] = useState("file");
  const [fileName, setFileName] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [convertResult, setConvertResult] = useState("");
  const [summaryResult, setSummaryResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // 변환 버튼 클릭
  const handleConvert = async () => {
    setError("");
    setConvertResult("");
    setSummaryResult("");
    setLoading(true);
    try {
      let text = "";
      if (tab === "file") {
        if (!fileObj) {
          setError("파일을 업로드해주세요.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", fileObj);
        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        console.log('CLOVA 응답:', JSON.stringify(data, null, 2));
        text = data.text || '';
        console.log('추출된 텍스트:', text);
        if (!res.ok) throw new Error(data.error || "변환 실패");
      } else if (tab === "youtube") {
        if (!youtubeUrl) {
          setError("유튜브 링크를 입력해주세요.");
          setLoading(false);
          return;
        }
        // 실제 서비스에서는 서버에서 youtube-dl 등으로 음성 추출 후 변환 필요
        setError("유튜브 링크 변환은 데모에서 지원하지 않습니다.");
        setLoading(false);
        return;
      } else if (tab === "text") {
        if (!inputText.trim()) {
          setError("텍스트를 입력해주세요.");
          setLoading(false);
          return;
        }
        text = inputText;
      }
      setConvertResult(text || "");
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 요약 버튼 클릭
  const handleSummary = async () => {
    setError("");
    setSummaryResult("");
    setLoading(true);
    try {
      const text = convertResult;
      if (!text) {
        setError("변환된 텍스트가 없습니다.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요약 실패");
      setSummaryResult(data.summary || "");
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // 지원되는 파일 타입 검증
      const supportedTypes = [
        'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a',
        'audio/wav', 'audio/wave', 'audio/x-wav',
        'text/plain', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!supportedTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|wav|m4a|txt|pdf|doc|docx)$/i)) {
        setError("지원되지 않는 파일 형식입니다. MP3, MP4, WAV, M4A, TXT, PDF, DOC 파일만 업로드 가능합니다.");
        return;
      }
      
      setFileName(file.name);
      setFileObj(file);
      setError(""); // 에러 메시지 초기화
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden dark-gradient-bg">
      {/* 애니메이션 배경 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark-gradient-bg-alt opacity-30"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 사이드바 */}
      <aside className="fixed left-0 top-0 h-full w-80 glass-strong border-r border-white/20 p-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
            <FiZap className="text-white text-2xl" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gradient">SmartNote</div>
            <div className="text-sm text-white/80">AI 변환 & 요약</div>
          </div>
        </div>
        
        <nav className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-xl glass-card text-white font-medium hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
              대시보드
            </div>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl glass-card text-white/80 font-medium hover-lift hover:text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              변환 기록
            </div>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl glass-card text-white/80 font-medium hover-lift hover:text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              설정
            </div>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl glass-card text-white/80 font-medium hover-lift hover:text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"></div>
              도움말
            </div>
          </button>
        </nav>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="ml-80 p-12">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gradient mb-4">AI 변환 & 요약 도구</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              음성, 영상, 텍스트를 스마트하게 변환하고 요약해보세요
            </p>
          </div>

          {/* 콘텐츠 변환 & 요약 섹션 */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <FiZap className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white">콘텐츠 변환 & 요약</h2>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-2 mb-8">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    tab === t.key 
                      ? "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg scale-105" 
                      : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {t.key === "file" ? <FiEdit2 /> : t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* 업로드/입력 영역 */}
            <div
              className={`border-2 border-dashed border-gray-300/50 rounded-2xl bg-gray-50/10 flex flex-col items-center justify-center py-12 transition-all duration-300 ${
                dragActive ? "scale-105 border-blue-400/70 bg-blue-50/20" : ""
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {tab === "file" && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">파일을 선택하거나 드래그해서 업로드하세요</h3>
                  <p className="text-gray-300 mb-6 text-sm">지원 형식: MP3, MP4, WAV, TXT, PDF, DOC</p>
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    ref={fileInputRef}
                    accept=".mp3,.mp4,.wav,.m4a,.txt,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // 지원되는 파일 타입 검증
                        const supportedTypes = [
                          'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a',
                          'audio/wav', 'audio/wave', 'audio/x-wav',
                          'text/plain', 'application/pdf',
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ];
                        
                        if (!supportedTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|wav|m4a|txt|pdf|doc|docx)$/i)) {
                          setError("지원되지 않는 파일 형식입니다. MP3, MP4, WAV, M4A, TXT, PDF, DOC 파일만 업로드 가능합니다.");
                          return;
                        }
                        
                        setFileName(file.name);
                        setFileObj(file);
                        setError(""); // 에러 메시지 초기화
                      }
                    }}
                  />
                  <label htmlFor="file-upload" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold cursor-pointer hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg">
                    파일 선택
                  </label>
                  {fileName && (
                    <div className="mt-4 px-4 py-2 bg-white/10 rounded-lg inline-block border border-white/20">
                      <span className="text-white/90 font-medium text-sm">{fileName}</span>
                    </div>
                  )}
                </div>
              )}
              
              {tab === "youtube" && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">유튜브 영상 링크를 입력하세요</h3>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full max-w-lg px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                  />
                </div>
              )}
              
              {tab === "text" && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">텍스트를 입력하세요</h3>
                  <textarea
                    placeholder="변환하고 싶은 텍스트를 입력하세요..."
                    className="w-full max-w-lg px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[100px] resize-none"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 텍스트로 변환하기 버튼 */}
            <div className="text-center">
              <button
                className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                onClick={handleConvert}
                disabled={loading}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                텍스트로 변환하기
              </button>
            </div>
          </div>

          {/* 에러/로딩 메시지 */}
          {error && (
            <div className="mb-8 px-6 py-4 bg-red-900/30 border border-red-500/30 rounded-2xl">
              <div className="text-red-300 font-semibold text-center">{error}</div>
            </div>
          )}
          
          {loading && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-white font-semibold">잠시만 기다려주세요...</span>
              </div>
            </div>
          )}

          {/* 결과 박스 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                  <FiFileText className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">변환 결과</h3>
              </div>
              <div className="min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white/90">
                {convertResult.split('\n\n').map((speakerText, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    {speakerText.split(': ').map((part, partIndex) => (
                      partIndex === 0 ? (
                        <span key={partIndex} className="font-semibold text-blue-300">{part}: </span>
                      ) : (
                        <span key={partIndex} className="whitespace-pre-wrap">{part}</span>
                      )
                    ))}
                  </div>
                ))}
                {!convertResult && (
                  <div className="text-center text-gray-400 py-12">
                    <FiFileText className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>변환 결과가 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="w-6 h-6 text-white">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">요약 결과</h3>
                </div>
                <button
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={handleSummary}
                  disabled={loading || !convertResult}
                >
                  <FiFileText className="w-4 h-4" />
                  요약하기
                </button>
              </div>
              <div className="min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white/90">
                {summaryResult ? (
                  <div className="whitespace-pre-wrap">{summaryResult}</div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="text-4xl mx-auto mb-3 opacity-50">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                    <p>요약 결과가 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}