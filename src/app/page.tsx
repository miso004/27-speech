"use client";
import { useState, useRef } from "react";
import { FiUpload, FiYoutube } from "react-icons/fi";
import Link from "next/link";

const TABS = [
  { key: "file", label: "파일 업로드", icon: <FiUpload /> },
  { key: "youtube", label: "유튜브 링크", icon: <FiYoutube /> },
];

export default function Home() {
  const [tab, setTab] = useState("file");
  const [fileName, setFileName] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [convertResult, setConvertResult] = useState("");
  const [summaryResult, setSummaryResult] = useState("");
  const [summaryMetadata, setSummaryMetadata] = useState<{
    originalLength?: number;
    cleanedLength?: number;
    summaryLength?: number;
    compressionRatio?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // 현재 진행 단계
  const [progress, setProgress] = useState(0); // 진행률 (0-100)
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // 결과 관련 상태
  const [uploadResult, setUploadResult] = useState<{
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    processingTime?: number;
    speakers?: any[];
    segments?: any[];
    confidence?: number;
  } | null>(null);
  const [expandedSpeakers, setExpandedSpeakers] = useState<Set<string>>(new Set());
  
  // 히스토리 저장 함수
  const saveToHistory = (type: 'file' | 'youtube' | 'text', originalText: string, summaryText?: string) => {
    const historyItem = {
      type,
      originalText,
      summaryText,
      processingTime: uploadResult?.processingTime,
      fileSize: uploadResult?.fileSize,
      fileName: uploadResult?.fileName,
    };
    
    const savedHistory = localStorage.getItem('smartnote-history');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    const newItem = {
      ...historyItem,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 100); // 최대 100개
    localStorage.setItem('smartnote-history', JSON.stringify(updatedHistory));
  };

  // 유튜브 URL 유효성 검사
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&\S*)?$/;
    return youtubeRegex.test(url);
  };

  // 결과 다운로드 함수들
  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsJson = (convertResult: string, summaryResult: string, filename: string) => {
    const data = {
      timestamp: new Date().toISOString(),
      originalText: convertResult,
      summary: summaryResult,
      metadata: {
        tool: "SmartNote",
        version: "1.0"
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 임시 성공 메시지 (나중에 toast로 개선 가능)
      const originalError = error;
      setError("클립보드에 복사되었습니다!");
      setTimeout(() => setError(originalError), 2000);
    } catch (err) {
      setError("클립보드 복사에 실패했습니다.");
    }
  };

  // 파일 크기 포맷 함수
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 처리 시간 포맷 함수
  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 1) return '< 1초';
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  // 화자 토글 함수
  const toggleSpeaker = (speakerName: string) => {
    const newExpanded = new Set(expandedSpeakers);
    if (newExpanded.has(speakerName)) {
      newExpanded.delete(speakerName);
    } else {
      newExpanded.add(speakerName);
    }
    setExpandedSpeakers(newExpanded);
  };

  // 변환 버튼 클릭
  const handleConvert = async () => {
    setError("");
    setConvertResult("");
    setSummaryResult("");
    setUploadResult(null);
    setLoading(true);
    setProgress(0);
    const startTime = Date.now();
    
    try {
      let text = "";
      if (tab === "file") {
        if (!fileObj) {
          setError("파일을 업로드해주세요.");
          setLoading(false);
          return;
        }
        
        setLoadingStep("파일 업로드 중...");
        setProgress(20);
        
        const formData = new FormData();
        formData.append("file", fileObj);
        
        setLoadingStep("음성 변환 중...");
        setProgress(50);
        
        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });
        
        setProgress(80);
        const data = await res.json();
        console.log('CLOVA 응답:', JSON.stringify(data, null, 2));
        text = data.text || '';
        console.log('추출된 텍스트:', text);
        
        if (!res.ok) throw new Error(data.error || "변환 실패");
        
        // 결과 메타데이터 저장
        const processingTime = (Date.now() - startTime) / 1000;
        setUploadResult({
          fileName: fileObj.name,
          fileSize: fileObj.size,
          fileType: fileObj.type || '알 수 없음',
          processingTime,
          speakers: data.speakers || [],
          segments: data.segments || [],
          confidence: data.segments ? 
            Math.round(data.segments.reduce((acc: number, seg: any) => acc + (seg.confidence || 0), 0) / data.segments.length * 100) / 100 
            : undefined
        });
        
        setLoadingStep("변환 완료!");
        setProgress(100);
        
        // 히스토리에 저장
        saveToHistory('file', text);
        
      } else if (tab === "youtube") {
        if (!youtubeUrl.trim()) {
          setError("유튜브 링크를 입력해주세요.");
          setLoading(false);
          return;
        }
        
        if (!isValidYouTubeUrl(youtubeUrl.trim())) {
          setError("올바른 유튜브 URL을 입력해주세요. (예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/...)");
          setLoading(false);
          return;
        }
        
        setLoadingStep("유튜브 비디오 정보 확인 중...");
        setProgress(20);
        
        const res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: youtubeUrl }),
        });
        
        setLoadingStep("오디오 추출 중...");
        setProgress(60);
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "유튜브 변환 실패");
        
        text = data.text || '';
        
        setLoadingStep("변환 완료!");
        setProgress(100);
        
        // 히스토리에 저장
        saveToHistory('youtube', text);
      } else if (tab === "text") {
        if (!inputText.trim()) {
          setError("텍스트를 입력해주세요.");
          setLoading(false);
          return;
        }
        
        setLoadingStep("텍스트 처리 중...");
        setProgress(50);
        
        // 텍스트 탭은 즉시 완료
        text = inputText;
        
        setLoadingStep("완료!");
        setProgress(100);
        
        // 히스토리에 저장
        saveToHistory('text', text);
      }
      
      setConvertResult(text || "");
      
      // 완료 후 잠깐 보여주고 숨기기
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setLoadingStep("");
      }, 500);
      
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
      setLoading(false);
      setProgress(0);
      setLoadingStep("");
    }
  };

  // 요약 버튼 클릭
  const handleSummary = async () => {
    setError("");
    setSummaryResult("");
    setSummaryMetadata(null);
    setLoading(true);
    setProgress(0);
    
    try {
      const text = convertResult;
      if (!text) {
        setError("변환된 텍스트가 없습니다.");
        setLoading(false);
        return;
      }
      
      // 텍스트 길이 검증
      if (text.length < 100) {
        setError("텍스트가 너무 짧습니다. 최소 100자 이상의 텍스트가 필요합니다.");
        setLoading(false);
        return;
      }
      
      if (text.length > 10000) {
        setError("텍스트가 너무 깁니다. 최대 10,000자까지 지원됩니다.");
        setLoading(false);
        return;
      }
      
      setLoadingStep("텍스트 분석 중...");
      setProgress(30);
      
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      setLoadingStep("요약 생성 중...");
      setProgress(70);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요약 실패");
      
      setLoadingStep("요약 완료!");
      setProgress(100);
      
      setSummaryResult(data.summary || "");
      setSummaryMetadata(data.metadata || null);
      
      // 히스토리 업데이트 (요약 결과 추가)
      const savedHistory = localStorage.getItem('smartnote-history');
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          if (history.length > 0 && history[0].originalText === convertResult) {
            // 최근 항목에 요약 추가
            history[0].summaryText = data.summary;
            localStorage.setItem('smartnote-history', JSON.stringify(history));
          }
        } catch (error) {
          console.error('History 업데이트 실패:', error);
        }
      }
      
      // 완료 후 잠깐 보여주고 숨기기
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setLoadingStep("");
      }, 500);
      
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
      setLoading(false);
      setProgress(0);
      setLoadingStep("");
    }
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
      
      // 성공 메시지 임시 표시
      const originalError = error;
      setError(`✅ ${file.name} 파일이 성공적으로 업로드되었습니다!`);
      setTimeout(() => setError(originalError), 3000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden justify-center flex" style={{
      background: 'radial-gradient(circle at 0% 20%, rgba(148, 157, 214, 1) 30%, rgba(210, 218, 226, 1) 90%)'
    }}>
        <div className="w-[1400px] flex">
 {/* 사이드바 */}
     <aside className="w-20 p-4 fundflow-card ml-4 mt-4 mb-4 rounded-3xl shadow-lg"
             style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-2 ">
            <span className="text-gray-800 text-lg font-bold">WID</span>
          </div>
        </div>
        
        <nav className="flex flex-col items-center space-y-4">
          <button className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white hover:from-sky-600 hover:to-purple-700 transition-all shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </button>
          <Link href="/history">
            <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
          </Link>
          <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.61L12.75,4H11.25Z"/>
            </svg>
          </button>
          <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11,18H13V16H11V18M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3Z"/>
            </svg>
          </button>
        </nav>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className=" w-full p-8 flex items-center justify-center min-h-screen">
        <div className="w-full px-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">AI 변환 & 요약 도구</h1>
            <p className="text-lg text-gray-800/80">
              음성, 영상, 텍스트를 스마트하게 변환하고 요약해보세요
            </p>
          </div>

          {/* 중앙 FundFlow 스타일 카드 */}
          <div className="fundflow-card p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              
              <h2 className="text-xl font-bold text-gray-800">콘텐츠 변환 & 요약</h2>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-1 mb-6 border border-gray-400/30 rounded-4xl p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    // 탭 변경 시 모든 결과 및 상태 초기화
                    setConvertResult("");
                    setSummaryResult("");
                    setSummaryMetadata(null);
                    setUploadResult(null);
                    setError("");
                    setFileName("");
                    setFileObj(null);
                    setYoutubeUrl("");
                    setExpandedSpeakers(new Set());
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                    tab === t.key 
                      ? "bg-gray-800 text-white shadow-lg rounded-4xl" 
                      : "text-gray-800 hover:text-white hover:bg-white/10"
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
              className={`border-2  border-dashed border-white/30 fundflow-card flex flex-col items-center justify-center py-12 transition-all duration-300 ${
                dragActive ? "border-purple-400 shadow-lg" : ""
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {tab === "file" && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-600 mb-1">파일을 선택하거나 드래그해서 업로드하세요</h3>
                  <p className="text-gray-500/50 mb-6 text-sm">지원 형식: MP3, MP4, WAV, TXT, PDF, DOC</p>
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
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-green-700">파일 업로드 완료</div>
                          <div className="text-xs text-green-600">{fileName}</div>
                        </div>
                      </div>
                      {fileObj && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-600">
                          <div><span className="font-medium">크기:</span> {formatFileSize(fileObj.size)}</div>
                          <div><span className="font-medium">형식:</span> {fileObj.type || '알 수 없음'}</div>
                        </div>
                      )}
                    </div>
                  )}
                  <label htmlFor="file-upload" className="mt-4 inline-block px-5 py-2 rounded-3xl bg-gray-600 text-white font-medium cursor-pointer hover:bg-gray-800 transition-all">
                    {fileName ? '다른 파일 선택' : '파일 선택'}
                  </label>
                 
                </div>
              )}
              
              {tab === "youtube" && (
                <div className="text-center">
                  <div className="w-40 h-12 mx-auto mb-4 text-white/40">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">유튜브 영상 링크를 입력하세요</h3>
                  <p className="text-white/70 mb-6 text-sm">최대 30분까지 지원 • 한국어 음성 권장</p>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                    className={`w-[550px] max-w-lg px-4 py-3 fundflow-card border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all ${
                      youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl.trim()) 
                        ? "border-red-400 focus:ring-red-400" 
                        : "border-white/30 focus:ring-purple-400 focus:border-purple-400"
                    }`}
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                  />
                  {youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl.trim()) && (
                    <p className="mt-2 text-sm text-red-600">올바른 유튜브 URL 형식이 아닙니다.</p>
                  )}
                </div>
              )}
              
              {tab === "text" && (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 text-white/40">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,7.87 17.26,7.87H15.11L13.5,14.25C13.5,14.25 13.5,14.25 13.5,14.25C13.39,14.83 13.41,14.83 13.92,14.83H14.95L14.67,16.04C14.22,15.98 13.78,15.96 13.33,15.96C11.1,15.96 10.55,15.08 11.04,12.95L12.75,6.65C12.75,6.65 12.75,6.65 12.75,6.65C12.86,6.07 12.84,6.07 12.33,6.07H11.3L11.58,4.83C12.03,4.89 12.47,4.91 12.92,4.91C15.15,4.91 15.7,5.79 15.21,7.92L13.5,14.25H15.11L16.72,7.87H14.57C14.04,7.87 13.58,7.74 13.13,8.61L12.17,8.35L13.33,4H18.5M5.5,4L6.66,8.35L5.7,8.61C5.25,7.74 4.79,7.87 4.26,7.87H2.11L0.5,14.25C0.5,14.25 0.5,14.25 0.5,14.25C0.39,14.83 0.41,14.83 0.92,14.83H1.95L1.67,16.04C1.22,15.98 0.78,15.96 0.33,15.96C-1.9,15.96 -2.45,15.08 -1.96,12.95L-0.25,6.65C-0.25,6.65 -0.25,6.65 -0.25,6.65C-0.14,6.07 -0.16,6.07 -0.67,6.07H-1.7L-1.42,4.83C-0.97,4.89 -0.53,4.91 -0.08,4.91C2.15,4.91 2.7,5.79 2.21,7.92L0.5,14.25H2.11L3.72,7.87H1.57C1.04,7.87 0.58,7.74 0.13,8.61L-0.83,8.35L0.33,4H5.5Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-white mb-4">텍스트를 입력하세요</h3>
                  <textarea
                    placeholder="변환하고 싶은 텍스트를 입력하세요..."
                    className="w-full max-w-lg px-4 py-3 fundflow-card border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 min-h-[100px] resize-none"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 변환 버튼 */}
            <div className="flex justify-between items-center mt-8">
              <button
                className="px-6 py-3 rounded-3xl bg-gradient-to-br from-sky-500 to-purple-600 hover:from-sky-600 hover:to-purple-700 cursor-pointer text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                onClick={handleConvert}
                disabled={loading || (tab === "youtube" && youtubeUrl.trim() !== "" && !isValidYouTubeUrl(youtubeUrl.trim()))}
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
              <div className="inline-block px-8 py-6 bg-blue-50 border border-blue-200 rounded-2xl max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium">
                    {loadingStep || "처리 중..."}
                  </span>
                </div>
                
                {/* 프로그레스 바 */}
                <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-blue-600 font-medium">
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {/* 결과 박스 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="fundflow-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">변환 결과</h3>
                </div>
                
                {convertResult && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(convertResult)}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                      title="클립보드에 복사"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => downloadAsText(convertResult, `conversion-${Date.now()}`)}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                      title="텍스트 파일로 다운로드"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M12 15.5l4-4H8l4 4zM5 20v-2h14v2H5zm7-18L5 9h5v6h2V9h5l-7-7z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {/* 파일 정보 표시 */}
              {uploadResult && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                    <span className="text-sm font-medium text-blue-700">처리 정보</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-600">
                    <div><span className="font-medium">파일명:</span> {uploadResult.fileName}</div>
                    <div><span className="font-medium">크기:</span> {uploadResult.fileSize ? formatFileSize(uploadResult.fileSize) : '알 수 없음'}</div>
                    <div><span className="font-medium">처리시간:</span> {uploadResult.processingTime ? formatProcessingTime(uploadResult.processingTime) : '알 수 없음'}</div>
                    <div><span className="font-medium">화자수:</span> {uploadResult.speakers?.length || 0}명</div>
                    {uploadResult.confidence && (
                      <div className="col-span-2"><span className="font-medium">평균 신뢰도:</span> {(uploadResult.confidence * 100).toFixed(1)}%</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="min-h-[180px] fundflow-card border border-white/20 p-4">
                {convertResult ? (
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {convertResult.split('\n\n').map((speakerText, index) => {
                      const [speakerName, ...textParts] = speakerText.split(': ');
                      const text = textParts.join(': ');
                      const isExpanded = expandedSpeakers.has(speakerName);
                      const shouldTruncate = text.length > 150;
                      
                      // 화자별 색상 지정
                      const getSpeakerColor = (name: string) => {
                        if (name === 'A') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' };
                        if (name === 'B') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' };
                        if (name === 'C') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' };
                        if (name === 'D') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' };
                        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' };
                      };
                      
                      const colors = getSpeakerColor(speakerName);
                      
                      return (
                        <div key={index} className={`mb-3 last:mb-0 border ${colors.border} rounded-lg p-3 ${colors.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold ${colors.text} flex items-center gap-2`}>
                              <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                              {speakerName}
                            </span>
                            {shouldTruncate && (
                              <button
                                onClick={() => toggleSpeaker(speakerName)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                {isExpanded ? '접기' : '더보기'}
                                <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {shouldTruncate && !isExpanded ? `${text.substring(0, 150)}...` : text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-12 h-12 mx-auto mb-3 text-gray-300 text-base">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <p className="text-sm">변환 결과가 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="fundflow-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  
                  <h3 className="text-lg font-semibold text-gray-800">요약 결과</h3>
                </div>
                
                <div className="flex items-center gap-2">
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
                  
                  {summaryResult && (
                    <>
                      <button
                        onClick={() => copyToClipboard(summaryResult)}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                        title="클립보드에 복사"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => downloadAsText(summaryResult, `summary-${Date.now()}`)}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                        title="텍스트 파일로 다운로드"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M12 15.5l4-4H8l4 4zM5 20v-2h14v2H5zm7-18L5 9h5v6h2V9h5l-7-7z"/>
                        </svg>
                      </button>
                      {convertResult && (
                        <button
                          onClick={() => downloadAsJson(convertResult, summaryResult, `smartnote-${Date.now()}`)}
                          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                          title="JSON 파일로 전체 결과 다운로드"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M12 15.5l4-4H8l4 4zM5 20v-2h14v2H5zm7-18L5 9h5v6h2V9h5l-7-7z"/>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="min-h-[180px] bg-gray-50 border border-gray-400 rounded-xl p-4">
                {summaryResult ? (
                  <div className="space-y-4">
                    {/* 요약 정보 헤더 */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                      <span className="text-sm font-medium text-green-700">요약 완료</span>
                      <div className="ml-auto text-xs text-gray-500">
                        {summaryResult.split('\n').filter(p => p.trim()).length}개 문단 • {summaryResult.length}자
                        {summaryMetadata?.compressionRatio && (
                          <span className="ml-2 text-blue-600 font-medium">
                            압축률 {summaryMetadata.compressionRatio}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 요약 내용 */}
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {summaryResult.split('\n')
                        .filter(paragraph => paragraph.trim().length > 0)
                        .map((paragraph, index) => (
                        <div key={index} className="mb-3 last:mb-0 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 whitespace-pre-wrap">{paragraph.trim()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 요약 품질 정보 */}
                    {summaryMetadata && (
                      <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
                            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">요약 정보</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <div><span className="font-medium">원본:</span> {summaryMetadata.originalLength?.toLocaleString()}자</div>
                          <div><span className="font-medium">정리본:</span> {summaryMetadata.cleanedLength?.toLocaleString()}자</div>
                          <div><span className="font-medium">요약:</span> {summaryMetadata.summaryLength?.toLocaleString()}자</div>
                          <div><span className="font-medium">압축률:</span> {summaryMetadata.compressionRatio}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                      </svg>
                    </div>
                    <p className="text-sm">요약 결과가 여기에 표시됩니다</p>
                    {convertResult ? (
                      <button
                        onClick={handleSummary}
                        disabled={loading}
                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 text-sm font-medium"
                      >
                        지금 요약하기
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConvertResult("안녕하세요. 오늘은 인공지능과 자연어 처리에 대해 설명드리겠습니다. 자연어 처리는 컴퓨터가 인간의 언어를 이해하고 처리할 수 있도록 하는 기술입니다. 이 기술은 음성 인식, 기계 번역, 감정 분석 등 다양한 분야에서 활용되고 있습니다. 특히 최근에는 ChatGPT와 같은 대화형 AI 모델이 등장하면서 자연어 처리 기술이 더욱 주목받고 있습니다. 이러한 기술들은 우리의 일상생활을 더욱 편리하게 만들어주고 있으며, 앞으로도 계속 발전할 것으로 예상됩니다. 감사합니다.");
                          setUploadResult({
                            fileName: "test_sample.txt",
                            fileSize: 1024,
                            fileType: "text/plain",
                            processingTime: 2.5,
                            speakers: [],
                            segments: [],
                          });
                        }}
                        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all text-sm font-medium"
                      >
                        🧪 테스트 텍스트로 시험해보기
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
        </div>

     
    </div>
  );
}