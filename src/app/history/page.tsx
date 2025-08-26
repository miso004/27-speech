"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'file' | 'youtube' | 'text';
  fileName?: string;
  youtubeTitle?: string;
  originalText: string;
  summaryText?: string;
  processingTime?: number;
  fileSize?: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'file' | 'youtube' | 'text'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('smartnote-history');
    if (savedHistory) {
      try {
        const historyData = JSON.parse(savedHistory);
        setHistory(historyData);
      } catch (error) {
        console.error('History 로드 실패:', error);
      }
    }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 100); // 최대 100개 항목
    setHistory(updatedHistory);
    localStorage.setItem('smartnote-history', JSON.stringify(updatedHistory));
  };

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('smartnote-history', JSON.stringify(updatedHistory));
  };

  const deleteSelected = () => {
    const updatedHistory = history.filter(item => !selectedItems.has(item.id));
    setHistory(updatedHistory);
    setSelectedItems(new Set());
    localStorage.setItem('smartnote-history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    setSelectedItems(new Set());
    localStorage.removeItem('smartnote-history');
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartnote-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
          </svg>
        );
      case 'text':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,7.87 17.26,7.87H15.11L13.5,14.25C13.5,14.25 13.5,14.25 13.5,14.25C13.39,14.83 13.41,14.83 13.92,14.83H14.95L14.67,16.04C14.22,15.98 13.78,15.96 13.33,15.96C11.1,15.96 10.55,15.08 11.04,12.95L12.75,6.65C12.75,6.65 12.75,6.65 12.75,6.65C12.86,6.07 12.84,6.07 12.33,6.07H11.3L11.58,4.83C12.03,4.89 12.47,4.91 12.92,4.91C15.15,4.91 15.7,5.79 15.21,7.92L13.5,14.25H15.11L16.72,7.87H14.57C14.04,7.87 13.58,7.74 13.13,8.61L12.17,8.35L13.33,4H18.5M5.5,4L6.66,8.35L5.7,8.61C5.25,7.74 4.79,7.87 4.26,7.87H2.11L0.5,14.25C0.5,14.25 0.5,14.25 0.5,14.25C0.39,14.83 0.41,14.83 0.92,14.83H1.95L1.67,16.04C1.22,15.98 0.78,15.96 0.33,15.96C-1.9,15.96 -2.45,15.08 -1.96,12.95L-0.25,6.65C-0.25,6.65 -0.25,6.65 -0.25,6.65C-0.14,6.07 -0.16,6.07 -0.67,6.07H-1.7L-1.42,4.83C-0.97,4.89 -0.53,4.91 -0.08,4.91C2.15,4.91 2.7,5.79 2.21,7.92L0.5,14.25H2.11L3.72,7.87H1.57C1.04,7.87 0.58,7.74 0.13,8.61L-0.83,8.35L0.33,4H5.5Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredHistory = history
    .filter(item => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSearch = searchTerm === '' || 
        item.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.youtubeTitle && item.youtubeTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'name':
          const nameA = a.fileName || a.youtubeTitle || 'Text Input';
          const nameB = b.fileName || b.youtubeTitle || 'Text Input';
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.id)));
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
          <Link href="/">
            <button className="w-full text-left px-3 py-2 rounded-lg text-white/80 font-medium hover:bg-white/10 flex items-center gap-3">
              <div className="w-4 h-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
              </div>
              대시보드
            </button>
          </Link>
          <button className="w-full text-left px-3 py-2 rounded-lg bg-white/20 text-white font-medium flex items-center gap-3">
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
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">변환 기록</h1>
            <p className="text-lg text-white/80">과거 변환 및 요약 기록을 관리하세요</p>
          </div>

          {/* 컨트롤 패널 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* 검색 */}
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="검색어 입력..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                
                {/* 필터 */}
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="all">전체 타입</option>
                  <option value="file">파일 업로드</option>
                  <option value="youtube">유튜브</option>
                  <option value="text">텍스트 입력</option>
                </select>
                
                {/* 정렬 */}
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="name">이름순</option>
                </select>
              </div>
              
              {/* 액션 버튼 */}
              <div className="flex gap-2">
                {selectedItems.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                  >
                    선택 삭제 ({selectedItems.size})
                  </button>
                )}
                <button
                  onClick={exportHistory}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                  disabled={history.length === 0}
                >
                  내보내기
                </button>
                <button
                  onClick={clearHistory}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                  disabled={history.length === 0}
                >
                  전체 삭제
                </button>
              </div>
            </div>
            
            {/* 통계 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div>전체 기록: <span className="font-medium">{history.length}개</span></div>
                <div>필터링된 항목: <span className="font-medium">{filteredHistory.length}개</span></div>
                <div>선택된 항목: <span className="font-medium">{selectedItems.size}개</span></div>
              </div>
            </div>
          </div>

          {/* 기록 목록 */}
          <div className="bg-white rounded-2xl shadow-lg border">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">변환 기록이 없습니다</h3>
                <p className="text-gray-500 mb-4">파일 변환이나 텍스트 요약을 시작해보세요</p>
                <Link href="/">
                  <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all">
                    변환하러 가기
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredHistory.length && filteredHistory.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">전체 선택</span>
                    </label>
                  </div>
                </div>
                
                {/* 목록 */}
                <div className="divide-y divide-gray-200">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <label className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                            className="rounded border-gray-300"
                          />
                        </label>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              {getTypeIcon(item.type)}
                              <span className="text-sm font-medium capitalize">
                                {item.type === 'file' ? '파일 업로드' : 
                                 item.type === 'youtube' ? '유튜브' : '텍스트 입력'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                            {item.processingTime && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {item.processingTime.toFixed(1)}초
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-2">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {item.fileName || item.youtubeTitle || '텍스트 입력'}
                            </h3>
                            {item.fileSize && (
                              <p className="text-xs text-gray-500">
                                크기: {formatFileSize(item.fileSize)}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-700">
                            <div className="mb-2">
                              <span className="font-medium text-gray-900">변환 결과:</span>
                              <p className="mt-1 text-sm line-clamp-3">
                                {item.originalText.length > 200 
                                  ? `${item.originalText.substring(0, 200)}...` 
                                  : item.originalText}
                              </p>
                            </div>
                            
                            {item.summaryText && (
                              <div>
                                <span className="font-medium text-gray-900">요약:</span>
                                <p className="mt-1 text-sm line-clamp-2 text-green-700">
                                  {item.summaryText.length > 150 
                                    ? `${item.summaryText.substring(0, 150)}...` 
                                    : item.summaryText}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              const dataStr = JSON.stringify(item, null, 2);
                              const dataBlob = new Blob([dataStr], { type: 'application/json' });
                              const url = URL.createObjectURL(dataBlob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `smartnote-item-${item.timestamp.split('T')[0]}.json`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="항목 내보내기"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M12 15.5l4-4H8l4 4zM5 20v-2h14v2H5zm7-18L5 9h5v6h2V9h5l-7-7z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="항목 삭제"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}