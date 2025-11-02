import React, { useState } from 'react';
import type { Restaurant } from '../types';

interface NotificationPanelProps {
  restaurant: Restaurant;
  deadline: string;
  onSendNotification: () => void;
  isSending: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  restaurant, 
  deadline, 
  onSendNotification,
  isSending
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendNotification = () => {
    // 在實際應用中，這裡會調用 Line API 發送通知
    // 現在我們只是模擬這個過程
    onSendNotification();
  };

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-semibold text-blue-800">發送點餐通知</h3>
        <span className="ml-2 transform transition-transform duration-200 text-blue-600">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4">
          <p className="text-blue-700 mb-4">
            點擊下方按鈕將發送 Line 通知給所有成員，提醒大家點餐。
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">通知預覽</h4>
            <p className="text-sm text-blue-600">
              🍽️ 點餐通知<br/>
              餐廳：{restaurant.name}<br/>
              截止時間：{deadline}<br/>
              請儘快完成點餐！
            </p>
          </div>
          
          <button
            onClick={handleSendNotification}
            disabled={isSending}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isSending 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSending ? '發送中...' : '發送 Line 通知給所有成員'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;