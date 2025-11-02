import React from 'react';
import type { Restaurant, User } from '../types';

// 定義 Header 組件的 props 類型
interface HeaderProps {
  currentUser: User | null; // 當前登入的使用者
  selectedRestaurant: Restaurant | null; // 當前選擇的餐廳
  deadline: string | null; // 新增：訂單截止時間
  onBack: () => void; // 返回餐廳選擇頁面的回調
  onSwitchUser: () => void; // 切換使用者的回調
  onHardReset: () => void; // 新增：強制重置功能
  isAdmin: boolean; // 新增：判斷是否為管理員
  viewMode: 'current' | 'history'; // 新增：當前顯示模式
  onSetViewMode: (mode: 'current' | 'history') => void; // 新增：設定顯示模式的回調
}

// Header 組件
const Header: React.FC<HeaderProps> = ({ currentUser, selectedRestaurant, deadline, onBack, onSwitchUser, onHardReset, isAdmin, viewMode, onSetViewMode }) => {
  
  const handleResetClick = () => {
    if (window.confirm('您確定要清空今日所有訂單並登出所有人員嗎？此操作無法復原。')) {
      onHardReset();
    }
  };


  return (
    // 頁首容器，使用 sticky 定位使其保持在頁面頂部，並增加 padding
    <header className="sticky top-0 bg-stone-50/80 backdrop-blur-md border-b border-stone-200 p-4 z-20">
      <div className="container mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-4">
        
        {/* 左側標題與管理員按鈕群組 */}
        <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold text-stone-800 tracking-wide">丁二烯訂飯飯</h1>
          {isAdmin && (
            <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-2 rounded-full whitespace-nowrap">👑 今天我是管理員</span>
          )}
          {isAdmin && (
            <button onClick={handleResetClick} className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors p-2">(強制重置)</button>
          )}
          {selectedRestaurant && isAdmin && viewMode === 'current' && (
            <button
              onClick={onBack}
              className="text-sm border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200 whitespace-nowrap min-h-[44px] flex items-center"
            >
              ← 重選餐廳
            </button>
          )}
        </div>
        
        {/* 右側顯示當前使用者或餐廳資訊 */}
        <div className="flex items-center flex-wrap justify-center gap-4">
          {deadline && viewMode === 'current' && (
            <div className="text-center sm:text-right">
              <span className="text-sm text-stone-500">截止時間</span>
              <p className="font-semibold text-lg text-red-600 animate-pulse">{deadline}</p>
            </div>
          )}
          {currentUser && (
             <button 
                onClick={() => onSetViewMode(viewMode === 'current' ? 'history' : 'current')}
                className="text-sm border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200 min-h-[44px] flex items-center"
            >
                {viewMode === 'current' ? '歷史訂單' : '返回訂餐'}
            </button>
          )}
          {currentUser ? (
            <div className="text-center sm:text-right">
              <span className="text-sm text-stone-500">目前使用者</span>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                 <p className="font-semibold text-lg text-stone-700">{currentUser.name}</p>
                 <button 
                    onClick={onSwitchUser} 
                    className="text-sm bg-stone-200 text-stone-700 font-semibold py-2 px-3 rounded-full hover:bg-stone-300 transition-colors duration-200 min-h-[44px] flex items-center"
                  >
                    登出
                  </button>
              </div>
            </div>
          ) : (
            <p className="text-stone-500">請先選擇使用者</p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
