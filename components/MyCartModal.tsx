import React, { useState } from 'react';
import type { OrderItem } from '../types';
import { TrashIcon, PlusIcon, MinusIcon, CartIcon } from './icons';

// 定義 MyCartModal 組件的 props 類型
interface MyCartModalProps {
  isOpen: boolean; // 彈窗是否開啟
  onClose: () => void; // 關閉彈窗的回調函數
  cartItems: OrderItem[]; // 購物車中的項目
  onUpdateQuantity: (itemId: string, newQuantity: number) => void; // 更新項目數量的回調
  onUpdateNotes: (itemId: string, notes: string) => void; // 新增：更新備註的回調
  onSubmitOrder: () => void; // 提交訂單的回調 (不再需要傳入姓名)
  isLocked: boolean; // 新增：訂單是否已被管理員鎖定
}

// 我的購物車彈窗組件
const MyCartModal: React.FC<MyCartModalProps> = ({ isOpen, onClose, cartItems, onUpdateQuantity, onUpdateNotes, onSubmitOrder, isLocked }) => {
  // 提交時的錯誤訊息
  const [error, setError] = useState('');
  // 確認點餐狀態
  const [isConfirmed, setIsConfirmed] = useState(false);

  // 如果彈窗未開啟，則不渲染任何內容
  if (!isOpen) return null;

  // 計算購物車總金額
  const totalAmount = cartItems.reduce((total, item) => total + item.item.price * item.quantity, 0);

  // 處理提交訂單
  const handleSubmit = () => {
    if (isLocked) return; // 如果鎖定則不執行任何操作
    
    // 如果還未確認，則顯示確認按鈕
    if (!isConfirmed && cartItems.length > 0) {
      setIsConfirmed(true);
      return;
    }
    
    // 驗證購物車是否為空
    if (cartItems.length === 0) {
      setError('您的購物車是空的！');
      return;
    }
    
    setError(''); // 清除錯誤訊息
    onSubmitOrder(); // 呼叫提交訂單的回調
  };
  
  // 處理點擊背景遮罩關閉彈窗
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // 關閉時重置確認狀態
      setIsConfirmed(false);
      onClose();
    }
  };

  return (
    // 最外層容器，用於定位和背景遮罩
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* 彈窗主體 */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* 彈窗標題 */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-800 flex items-center">
            <CartIcon className="mr-3 flex-shrink-0" />
            <span className="whitespace-nowrap">我的購物車</span>
          </h2>
          <button 
            onClick={() => {
              setIsConfirmed(false);
              onClose();
            }} 
            className="text-stone-400 hover:text-stone-600"
          >
            &times;
          </button>
        </div>
        
        {/* 鎖定提示 */}
        {isLocked && (
          <div className="p-4 bg-yellow-100 border-b border-yellow-200 text-center">
            <p className="font-semibold text-yellow-800">🔒 您的訂單已由管理員鎖定，無法修改。</p>
          </div>
        )}
        
        {/* 購物車項目列表 */}
        <div className="p-6 flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-stone-500 text-center py-10">您的購物車是空的，快去點餐吧！</p>
          ) : (
            <div className="space-y-2">
              {cartItems.map(({ item, quantity, notes }) => (
                <div key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b last:border-b-0 py-4">
                  {/* Item Info */}
                  <div className="flex-grow min-w-[150px]">
                    <p className="font-semibold text-stone-800">{item.name}</p>
                    <p className="text-sm text-stone-600">${item.price}</p>
                  </div>
                  
                  {/* Notes */}
                  <div className="flex-grow-[3] min-w-[200px] basis-full sm:basis-auto">
                    <input
                      type="text"
                      placeholder="需要加辣、去冰等備註嗎？"
                      value={notes || ''}
                      onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-stone-500 focus:border-stone-500 disabled:bg-stone-100"
                      aria-label={`${item.name} 的備註`}
                      disabled={isLocked}
                    />
                  </div>
                  
                  {/* Quantity Controls & Delete */}
                  <div className="flex items-center ml-auto">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, quantity - 1)} 
                        className="p-1 rounded-full bg-stone-200 hover:bg-stone-300 transition-colors disabled:bg-stone-100 disabled:cursor-not-allowed"
                        disabled={isLocked}
                      >
                        <MinusIcon className="w-5 h-5 text-stone-700" />
                      </button>
                      <span className="w-10 text-center font-bold text-lg text-stone-800" aria-live="polite">{quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, quantity + 1)} 
                        className="p-1 rounded-full bg-stone-200 hover:bg-stone-300 transition-colors disabled:bg-stone-100 disabled:cursor-not-allowed"
                        disabled={isLocked}
                      >
                        <PlusIcon className="w-5 h-5 text-stone-700" />
                      </button>
                    </div>
                  
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 0)} 
                      className="ml-4 text-red-500 hover:text-red-700 transition-colors disabled:text-red-300 disabled:cursor-not-allowed" 
                      aria-label={`從購物車移除 ${item.name}`}
                      disabled={isLocked}
                    >
                      <TrashIcon className="w-6 h-6"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 彈窗底部 */}
        <div className="p-6 border-t bg-stone-50 rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">小計</span>
            <span className="text-xl font-bold text-stone-800">${totalAmount}</span>
          </div>
          {/* 錯誤訊息顯示 */}
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          {/* 確認提示 */}
          {isConfirmed && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded text-center">
              <p className="font-semibold">請再次確認您的訂單無誤</p>
              <p className="text-sm">確認後管理員才會看到您的完整訂單</p>
            </div>
          )}
          {/* 提交按鈕 */}
          <button
            onClick={handleSubmit}
            className="w-full bg-stone-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-stone-700 transition-colors duration-200 disabled:bg-stone-400 disabled:cursor-not-allowed"
            disabled={cartItems.length === 0 || isLocked}
          >
            {isLocked ? '訂單已鎖定' : isConfirmed ? '確認送出訂單' : '確認點餐'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyCartModal;