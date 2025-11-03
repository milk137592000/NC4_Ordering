import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Restaurant, Suggestion } from '../types';
import { OrderType } from '../types'; // 從 types 引入 OrderType
import { FoodAndDrinkIcon, DrinkIcon, ShuffleIcon } from './icons'; // 引入圖標
import NotificationPanel from './NotificationPanel'; // 引入通知面板組件

// 組件的 props 介面
interface RestaurantSelectorProps {
  restaurants: Restaurant[];
  orderType: OrderType | null;
  onSetOrderType: (type: OrderType | null) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  isProposalRejected?: boolean;
  suggestions: Suggestion[];
  deadline: string | null; // 新增：接收截止時間
  onSetDeadline: (time: string) => void; // 新增：設定截止時間的回調
}

// 餐廳選擇器組件
const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
  restaurants,
  orderType,
  onSetOrderType,
  onSelectRestaurant,
  isProposalRejected,
  suggestions,
  deadline,
  onSetDeadline,
}) => {
  const [randomlySelectedId, setRandomlySelectedId] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null); // 新增：截止時間錯誤訊息狀態
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const restaurantButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const filteredRestaurants = useMemo(() => {
    if (!orderType) return [];
    return restaurants.filter(r => r.type === orderType);
  }, [orderType, restaurants]);

  const suggestionsByRestaurant = useMemo<Record<string, string[]>>(() => {
    return suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.restaurantId]) {
        acc[suggestion.restaurantId] = [];
      }
      acc[suggestion.restaurantId].push(suggestion.userName);
      return acc;
    }, {} as Record<string, string[]>);
  }, [suggestions]);
  
  useEffect(() => {
    setRandomlySelectedId(null);
    setSelectedRestaurant(null);
  }, [orderType]);

  // 新增：驗證截止時間的函數
  const validateDeadline = (time: string): boolean => {
    if (!time) {
      setDeadlineError(null);
      return true;
    }

    // 解析輸入的時間
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      setDeadlineError('時間格式無效');
      return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    
    // 獲取當前時間
    const now = new Date();
    const deadlineDate = new Date();
    deadlineDate.setHours(hours, minutes, 0, 0);
    
    // 檢查時間是否早於當前時間
    if (deadlineDate <= now) {
      setDeadlineError('截止時間不能早於或等於當前時間');
      return false;
    }
    
    // 檢查距離截止時間是否不足20分鐘
    const diffInMinutes = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);
    if (diffInMinutes < 20) {
      setDeadlineError('截止時間必須在20分鐘後');
      return false;
    }
    
    setDeadlineError(null);
    return true;
  };

  const renderTypeButton = (label: string, type: OrderType, IconComponent: React.FC<{ className?: string }>) => (
    <button
      key={type}
      onClick={() => onSetOrderType(type)}
      className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:border-stone-300 hover:bg-stone-50/80 border-stone-200"
    >
      <IconComponent className="w-16 h-16 text-stone-600 mb-4" />
      <span className="text-2xl font-bold text-stone-700">{label}</span>
    </button>
  );

  const [recommendedRestaurantId, setRecommendedRestaurantId] = useState<string | null>(null);

  const handleRandomSelect = () => {
    if (filteredRestaurants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const selected = filteredRestaurants[randomIndex];
    setRecommendedRestaurantId(selected.id);
    
    // Scroll to the recommended restaurant after a short delay
    setTimeout(() => {
      const element = restaurantButtonRefs.current[selected.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }, 100);
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    if (!deadlineError && deadline) {
      setSelectedRestaurant(restaurant);
      onSelectRestaurant(restaurant);
    }
  };

  const handleSendNotification = () => {
    if (!selectedRestaurant || !deadline) return;
    
    setIsSendingNotification(true);
    
    // 模擬發送通知的過程
    setTimeout(() => {
      alert(`已發送 Line 通知給所有成員！\n\n餐廳：${selectedRestaurant.name}\n截止時間：${deadline}`);
      setIsSendingNotification(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center max-w-4xl mx-auto">
        {!orderType && (
          <>
            <h2 className="text-3xl font-bold tracking-wide text-stone-800 sm:text-4xl">今天，想來點什麼？</h2>
            <p className="mt-4 text-lg text-stone-600">
              請選擇今日主題。決定後，全員將從同一家店訂購喔！
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {renderTypeButton('餐廳', '餐廳', FoodAndDrinkIcon)}
              {renderTypeButton('飲料店', '飲料店', DrinkIcon)}
            </div>
          </>
        )}

        {orderType && (
          <div>
            {isProposalRejected && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg text-left" role="alert">
                    <p className="font-bold">提案被否決</p>
                    <p>您先前的提案被超過兩位同事否決了，請重新選擇一家餐廳。</p>
                </div>
            )}
            
            <div className="max-w-md mx-auto mb-8 bg-stone-50 border border-stone-200 p-4 rounded-lg shadow-sm">
                <label htmlFor="deadline" className="block text-lg font-bold text-stone-700 mb-2">設定訂單截止時間（24 小時制）</label>
                <input
                    type="text"
                    id="deadline"
                    value={deadline || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 只允許數字和冒號
                      if (value === '' || /^[0-9:]*$/.test(value)) {
                        onSetDeadline(value);
                        // 即時驗證時間
                        if (value && value.length >= 4) {
                          validateDeadline(value);
                        } else {
                          setDeadlineError(null);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === '') return;
                      
                      // 驗證截止時間
                      if (!validateDeadline(value)) {
                        return; // 如果驗證失敗，不進行格式化
                      }

                      const parts = value.replace(/[^0-9]/g, '');
                      if (parts.length >= 3 && parts.length <= 4) {
                        const hours = parts.slice(0, -2);
                        const minutes = parts.slice(-2);
                        const h = Math.min(23, Math.max(0, parseInt(hours, 10)));
                        const m = Math.min(59, Math.max(0, parseInt(minutes, 10)));
                        const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        onSetDeadline(formatted);
                      } else if (parts.length === 1 || parts.length === 2) {
                        // 只輸入小時
                        const h = Math.min(23, Math.max(0, parseInt(parts, 10)));
                        const formatted = `${String(h).padStart(2, '0')}:00`;
                        onSetDeadline(formatted);
                      }
                    }}
                    placeholder="HH:MM （例如：14:30）"
                    pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                    maxLength={5}
                    className={`w-full px-4 py-2 text-lg border rounded-md shadow-sm focus:outline-none focus:ring-stone-500 focus:border-stone-500 font-mono ${
                      deadlineError ? 'border-red-500 bg-red-50' : 'border-stone-300'
                    }`}
                />
                {/* 顯示錯誤訊息 */}
                {deadlineError && (
                  <p className="mt-2 text-sm text-red-600">{deadlineError}</p>
                )}
                <p className="mt-2 text-sm text-stone-500">請輸入 24 小時制格式（例如：14:30 或 1430）</p>
            </div>

            {/* --- VALIDATION LOGIC --- */}
            {deadline && !deadlineError && (
              <>
                <h2 className="text-3xl font-bold tracking-wide text-stone-800 sm:text-4xl">
                  請選擇一間<span className="text-stone-700 font-semibold">{orderType}</span>
                </h2>

                {suggestions.length > 0 && (
                  <div className="my-8 max-w-2xl mx-auto bg-stone-50 border border-stone-200 p-4 rounded-lg text-left shadow-sm">
                    <h3 className="font-bold text-lg text-stone-700 mb-2">💡 同事們的建議：</h3>
                    <ul className="space-y-1">
                      {Object.keys(suggestionsByRestaurant).map((restaurantId) => {
                        const userNames = suggestionsByRestaurant[restaurantId];
                        const restaurant = restaurants.find(r => r.id === restaurantId);
                        return (
                          <li key={restaurantId} className="text-stone-600">
                            - <strong className="text-stone-800">{restaurant?.name}</strong> ({userNames.join(', ')})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="flex justify-center items-center gap-4 my-6">
                  <button 
                    onClick={() => onSetOrderType(null)} 
                    className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
                  >
                    ← 返回
                  </button>
                  {filteredRestaurants.length > 1 && (
                    <button
                      onClick={handleRandomSelect}
                      className="flex items-center border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
                      title="隨機推薦一家"
                    >
                      <ShuffleIcon className="mr-2 h-5 w-5" />
                      隨機推薦
                    </button>
                  )}
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {filteredRestaurants.map(restaurant => (
                    <button
                      key={restaurant.id}
                      ref={el => restaurantButtonRefs.current[restaurant.id] = el}
                      onClick={() => handleRestaurantSelect(restaurant)}
                      className={`text-left p-4 rounded-lg border transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md ${
                        !deadline || deadlineError 
                          ? 'cursor-not-allowed opacity-60 border-stone-200' 
                          : 'cursor-pointer border-stone-200 hover:border-stone-300 hover:bg-stone-50/80'
                      } ${
                        recommendedRestaurantId === restaurant.id 
                          ? 'border-2 border-green-500 bg-green-50 scale-[1.02] shadow-md' 
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/80'
                      }`}
                      disabled={!deadline || deadlineError}
                    >
                      <h3 className="text-xl font-bold text-stone-800">{restaurant.name}</h3>
                      <p className="text-stone-600">{restaurant.cuisine}</p>
                    </button>
                  ))}
                </div>
                
                {/* 通知面板 */}
                {selectedRestaurant && deadline && (
                  <NotificationPanel 
                    restaurant={selectedRestaurant}
                    deadline={deadline}
                    onSendNotification={handleSendNotification}
                    isSending={isSendingNotification}
                  />
                )}
              </>
            )}
            
            {/* 如果有錯誤訊息，顯示提示 */}
            {deadlineError && (
              <div className="max-w-md mx-auto mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-bold">時間設定錯誤</p>
                <p>請修正截止時間設定後再選擇餐廳。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSelector;