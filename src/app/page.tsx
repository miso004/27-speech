"use client";
import { useState, useRef } from "react";
import { FiUpload, FiYoutube, FiEdit2 } from "react-icons/fi";

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
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #9333EA 50%, #7C3AED 75%, #6D28D9 100%)'}}>

      {/* 사이드바 */}
      <aside className="fixed left-0 top-0 h-full w-64 p-6" style={{background: 'rgba(109, 40, 217, 0.3)', backdropFilter: 'blur(10px)'}}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">SN</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white">SmartNote</div>
            <div className="text-xs text-white/70">AI 변환 & 요약</div>
          </div>
        </div>
        
        <nav className="space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-lg bg-white/20 text-white font-medium flex items-center gap-3">
            <div className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            대시보드
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 font-medium hover:bg-white/10 flex items-center gap-3">
            <div className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            변환 기록
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 font-medium hover:bg-white/10 flex items-center gap-3">
            <div className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
              </svg>
            </div>
            설정
          </button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 font-medium hover:bg-white/10 flex items-center gap-3">
            <div className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M11,18H13V16H11V18M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3Z"/>
              </svg>
            </div>
            도움말
          </button>
        </nav>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="ml-64 p-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">AI 변환 & 요약 도구</h1>
            <p className="text-lg text-white/80">
              음성, 영상, 텍스트를 스마트하게 변환하고 요약해보세요
            </p>
          </div>

          {/* 중앙 흰색 카드 */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">콘텐츠 변환 & 요약</h2>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                    tab === t.key 
                      ? "bg-white text-gray-800 shadow-sm" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <div className="w-4 h-4">
                    {t.key === "file" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    )}
                    {t.key === "youtube" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                      </svg>
                    )}
                    {t.key === "text" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,7.87 17.26,7.87H15.11L13.5,14.25C13.5,14.25 13.5,14.25 13.5,14.25C13.39,14.83 13.41,14.83 13.92,14.83H14.95L14.67,16.04C14.22,15.98 13.78,15.96 13.33,15.96C11.1,15.96 10.55,15.08 11.04,12.95L12.75,6.65C12.75,6.65 12.75,6.65 12.75,6.65C12.86,6.07 12.84,6.07 12.33,6.07H11.3L11.58,4.83C12.03,4.89 12.47,4.91 12.92,4.91C15.15,4.91 15.7,5.79 15.21,7.92L13.5,14.25H15.11L16.72,7.87H14.57C14.04,7.87 13.58,7.74 13.13,8.61L12.17,8.35L13.33,4H18.5M5.5,4L6.66,8.35L5.7,8.61C5.25,7.74 4.79,7.87 4.26,7.87H2.11L0.5,14.25C0.5,14.25 0.5,14.25 0.5,14.25C0.39,14.83 0.41,14.83 0.92,14.83H1.95L1.67,16.04C1.22,15.98 0.78,15.96 0.33,15.96C-1.9,15.96 -2.45,15.08 -1.96,12.95L-0.25,6.65C-0.25,6.65 -0.25,6.65 -0.25,6.65C-0.14,6.07 -0.16,6.07 -0.67,6.07H-1.7L-1.42,4.83C-0.97,4.89 -0.53,4.91 -0.08,4.91C2.15,4.91 2.7,5.79 2.21,7.92L0.5,14.25H2.11L3.72,7.87H1.57C1.04,7.87 0.58,7.74 0.13,8.61L-0.83,8.35L0.33,4H5.5Z"/>
                      </svg>
                    )}
                  </div>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 업로드/입력 영역 */}
            <div
              className={`border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center py-12 transition-all duration-300 ${
                dragActive ? "border-orange-400 bg-orange-50" : ""
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {tab === "file" && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-1">파일을 선택하거나 드래그해서 업로드하세요</h3>
                  <p className="text-gray-500 mb-6 text-sm">지원 형식: MP3, MP4, WAV, TXT, PDF, DOC</p>
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
                   {fileName && (
                    <div className=" px-4 py-2 bg-gray-100 rounded-lg inline-block border border-gray-300">
                      <span className="text-gray-700 font-medium text-sm">{fileName}</span>
                    </div>
                  )}
                  <p></p>
                  <label htmlFor="file-upload" className="mt-2 inline-block px-6 py-3 rounded-xl bg-gray-800 text-white font-medium cursor-pointer hover:bg-gray-600 transition-all">
                    파일 선택
                  </label>
                 
                </div>
              )}
              
              {tab === "youtube" && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-4">유튜브 영상 링크를 입력하세요</h3>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full max-w-lg px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                  />
                </div>
              )}
              
              {tab === "text" && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,7.87 17.26,7.87H15.11L13.5,14.25C13.5,14.25 13.5,14.25 13.5,14.25C13.39,14.83 13.41,14.83 13.92,14.83H14.95L14.67,16.04C14.22,15.98 13.78,15.96 13.33,15.96C11.1,15.96 10.55,15.08 11.04,12.95L12.75,6.65C12.75,6.65 12.75,6.65 12.75,6.65C12.86,6.07 12.84,6.07 12.33,6.07H11.3L11.58,4.83C12.03,4.89 12.47,4.91 12.92,4.91C15.15,4.91 15.7,5.79 15.21,7.92L13.5,14.25H15.11L16.72,7.87H14.57C14.04,7.87 13.58,7.74 13.13,8.61L12.17,8.35L13.33,4H18.5M5.5,4L6.66,8.35L5.7,8.61C5.25,7.74 4.79,7.87 4.26,7.87H2.11L0.5,14.25C0.5,14.25 0.5,14.25 0.5,14.25C0.39,14.83 0.41,14.83 0.92,14.83H1.95L1.67,16.04C1.22,15.98 0.78,15.96 0.33,15.96C-1.9,15.96 -2.45,15.08 -1.96,12.95L-0.25,6.65C-0.25,6.65 -0.25,6.65 -0.25,6.65C-0.14,6.07 -0.16,6.07 -0.67,6.07H-1.7L-1.42,4.83C-0.97,4.89 -0.53,4.91 -0.08,4.91C2.15,4.91 2.7,5.79 2.21,7.92L0.5,14.25H2.11L3.72,7.87H1.57C1.04,7.87 0.58,7.74 0.13,8.61L-0.83,8.35L0.33,4H5.5Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-4">텍스트를 입력하세요</h3>
                  <textarea
                    placeholder="변환하고 싶은 텍스트를 입력하세요..."
                    className="w-full max-w-lg px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[100px] resize-none"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 변환 버튼 */}
            <div className="flex justify-between items-center mt-8">
              <button
                className="px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleConvert}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
                텍스트로 변환하기
              </button>
              
            </div>
          </div>

          {/* 에러/로딩 메시지 */}
          {error && (
            <div className="mb-6 px-6 py-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="text-red-700 font-medium text-center">{error}</div>
            </div>
          )}
          
          {loading && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">잠시만 기다려주세요...</span>
              </div>
            </div>
          )}

          {/* 결과 박스 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">변환 결과</h3>
              </div>
              <div className="min-h-[180px] bg-gray-50 border border-gray-400 rounded-xl p-4">
                {convertResult ? (
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {convertResult.split('\n\n').map((speakerText, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        {speakerText.split(': ').map((part, partIndex) => (
                          partIndex === 0 ? (
                            <span key={partIndex} className="font-semibold text-blue-600">{part}: </span>
                          ) : (
                            <span key={partIndex} className="whitespace-pre-wrap">{part}</span>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <p className="text-sm">변환 결과가 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M3 3v18h18"/>
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                  </svg>
                </div>
                <div className="flex justify-between items-center w-full">
                    <h3 className="text-lg font-semibold text-gray-800">요약 결과</h3>
                <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleSummary}
                disabled={loading || !convertResult}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                요약하기
              </button>
                </div>
                
              </div>
              <div className="min-h-[180px] bg-gray-50 border border-gray-400 rounded-xl p-4">
                {summaryResult ? (
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{summaryResult}</div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                      </svg>
                    </div>
                    <p className="text-sm">요약 결과가 여기에 표시됩니다</p>
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