import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import type { SessionData } from '../types';
import { db } from '../firebase';

interface HistoryScreenProps {
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    // 主容器
    <div className="min-h-screen bg-stone-50">
      {/* 頁首 */}
      <header className="sticky top-0 bg-stone-50/80 backdrop-blur-md border-b border-stone-200 p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
          {/* 返回按鈕 */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            返回
          </button>
          <h1 className="text-xl font-bold text-stone-800">歷史記錄</h1>
          <div className="w-24"></div> {/* 佔位元素，使標題居中 */}
        </div>
      </header>

      {/* 主內容區域 */}
      <main className="container mx-auto p-4 pb-20">
        {loading ? (
          // 加載指示器
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
          </div>
        ) : (
          // 歷史記錄列表
          <div className="space-y-4">
            {history.map((session) => (
              // 每個歷史會話的卡片
              <div key={session.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                {/* 卡片頭部：日期和餐廳資訊 */}
                <div className="bg-stone-800 text-white p-4">
                  <h2 className="font-bold text-lg">{formatDate(session.date)}</h2>
                  <p className="text-stone-300">{session.restaurant?.name}</p>
                </div>
                
                {/* 卡片主體：訂單摘要 */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* 總訂單數量 */}
                    <div className="bg-stone-100 rounded-lg p-3 text-center">
                      <p className="text-sm text-stone-600">總訂單數</p>
                      <p className="text-2xl font-bold text-stone-800">{session.summary?.totalOrders || 0}</p>
                    </div>
                    
                    {/* 總人數 */}
                    <div className="bg-stone-100 rounded-lg p-3 text-center">
                      <p className="text-sm text-stone-600">參與人數</p>
                      <p className="text-2xl font-bold text-stone-800">{session.summary?.participantCount || 0}</p>
                    </div>
                  </div>
                  
                  {/* 最受歡迎的菜品 */}
                  {session.summary?.popularItems && session.summary.popularItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-stone-800 mb-2">熱門菜品</h3>
                      <ul className="space-y-1">
                        {session.summary.popularItems.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span className="text-stone-600 truncate mr-2">{item.name}</span>
                            <span className="font-medium text-stone-800">×{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              // 無歷史記錄時的提示
              <div className="text-center py-12">
                <div className="text-stone-400 mb-4">
                  <span className="material-symbols-outlined text-6xl">history</span>
                </div>
                <h3 className="text-lg font-medium text-stone-600 mb-2">暫無歷史記錄</h3>
                <p className="text-stone-500">還沒有完成的訂單記錄</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;