import React, { useMemo, useState } from 'react';
import type { Order, User, SessionData } from '../types';

// 定義 FinalSummary 組件的 props 類型
interface FinalSummaryProps {
  orders: Order[]; // 所有已提交的訂單列表
  restaurantName: string; // 餐廳名稱
  onCompleteOrder: () => void | Promise<void>; // 完成訂單並結束流程的回調函數
  currentUser: User; // 當前登入的使用者
  isAdmin: boolean; // 當前使用者是否為管理員
  sessionStatus: SessionData['status']; // 當前訂單狀態
  onTogglePaymentStatus: (userId: string) => void | Promise<void>; // 新增：切換付款狀態的回調
}

// 最終摘要組件
const FinalSummary: React.FC<FinalSummaryProps> = ({ orders, restaurantName, onCompleteOrder, currentUser, isAdmin, sessionStatus, onTogglePaymentStatus }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // 計算匯總的訂單項目和總金額
  const { aggregatedItems, totalAmount } = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; price: number; notes: string }>();
    let total = 0;
    orders.forEach(order => {
      order.items.forEach(orderItem => {
        const { item, quantity, notes } = orderItem;
        total += item.price * quantity;
        const key = `${item.id}-${notes || ''}`;
        if (itemMap.has(key)) {
          itemMap.get(key)!.quantity += quantity;
        } else {
          itemMap.set(key, { name: item.name, quantity, price: item.price, notes: notes || '' });
        }
      });
    });
    const aggregatedItems = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
    return { aggregatedItems, totalAmount: total };
  }, [orders]);
  
  // 確認是否所有人都已付款
  const allPaid = useMemo(() => orders.length > 0 && orders.every(order => order.isPaid), [orders]);

  // 處理按鈕點擊事件
  const handleStateChange = async () => {
    if (isProcessing) return;

    const confirmationMessage = sessionStatus === 'SUMMARY'
      ? '您確定所有款項都已結清，要鎖定訂單嗎？'
      : '您確定要結束本次訂單嗎？結束後將歸檔並重置系統。';

    if (window.confirm(confirmationMessage)) {
      setIsProcessing(true);
      try {
        await onCompleteOrder();
      } catch (error) {
        console.error("在 FinalSummary 中捕獲到 onCompleteOrder 錯誤:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const usersToDisplay = isAdmin ? orders : orders.filter(o => o.userId === currentUser.id);

  const getOrderStatusChip = (status: Order['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded-full">已提交</span>;
      case 'confirmed':
        return <span className="text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full">已確認</span>;
      case 'locked':
        return <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded-full">已鎖定</span>;
      default:
        // Fallback for orders created before status was introduced
        return <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-full">處理中</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl border border-stone-200 shadow-lg p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-800">
            {sessionStatus === 'SUMMARY' ? '請開始收款' : '點餐完成'}
          </h2>
          <p className="text-lg text-stone-600 mt-2">
            本次團購「<strong className="text-stone-700 font-semibold">{restaurantName}</strong>」的訂單總結如下：
          </p>
        </div>

        {sessionStatus === 'COMPLETED' && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded p-4 mb-6">
            <p className="text-emerald-800 font-semibold">✓ 所有款項已結清，訂單已鎖定。</p>
          </div>
        )}

        {isAdmin && (
          <div className="bg-stone-50 rounded-lg p-6 mb-8 max-h-80 overflow-y-auto border border-stone-200">
            <h3 className="text-xl font-bold mb-4 text-stone-700">餐點總計 (給店家)</h3>
            <ul className="divide-y divide-stone-200">
              {aggregatedItems.map(item => (
                <li key={item.name + item.notes} className="py-3 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-stone-800">{item.name}</p>
                     {item.notes && (
                      <p className="text-sm text-amber-800 bg-amber-100 rounded px-2 py-1 inline-block mt-1">
                        備註: {item.notes}
                      </p>
                    )}
                    <p className="text-sm text-stone-500 mt-1">單價: ${item.price}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-lg text-stone-700">x {item.quantity}</p>
                    <p className="text-sm text-stone-500">小計: ${item.price * item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="bg-stone-50 rounded-lg p-6 mb-8 max-h-96 overflow-y-auto border border-stone-200">
          <h3 className="text-xl font-bold mb-4 text-stone-700">{isAdmin ? '客人訂單與付款狀態' : '我的訂單明細'}</h3>
          <div className="space-y-6">
            {usersToDisplay.length > 0 ? usersToDisplay.map((order) => {
              const userTotal = order.items.reduce((total, orderItem) => total + orderItem.item.price * orderItem.quantity, 0);
              const isActionable = sessionStatus === 'SUMMARY' && (isAdmin || currentUser.id === order.userId);
              
              return (
                <div key={order.userId} className="border-b border-stone-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-stone-800">{order.userName}</h4>
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-stone-800">應付: ${userTotal}</span>
                        
                        {/* --- REFACTORED PAYMENT STATUS BUTTON --- */}
                        <button
                          onClick={() => onTogglePaymentStatus(order.userId)}
                          disabled={!isActionable}
                          className={`w-28 text-center px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 
                              ${isActionable ? 'transform hover:scale-105' : 'cursor-not-allowed opacity-80'}
                              ${order.isPaid 
                                  ? (isActionable ? 'bg-green-200 text-green-900 hover:bg-amber-200 hover:text-amber-900' : 'bg-green-100 text-green-800')
                                  : (isActionable ? 'bg-stone-200 text-stone-800 hover:bg-sky-200 hover:text-sky-900' : 'bg-red-100 text-red-800')
                              }
                          `}
                          title={
                              isActionable
                                  ? (order.isPaid ? '點擊以標示為未付款' : '點擊以標示為已付款')
                                  : (order.isPaid ? '已付款 (狀態鎖定)' : '未付款 (狀態鎖定)')
                          }
                        >
                          {order.isPaid ? '✓ 已付款' : (isActionable ? '尚未付款' : '未付款')}
                        </button>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-stone-600 ml-2">
                    {order.items.map((orderItem, itemIndex) => (
                      <li key={itemIndex} className="flex justify-between items-start">
                        <div className="flex-1 mr-2">
                          <p>
                            {orderItem.item.name}
                            <strong className="ml-2 text-stone-800">x {orderItem.quantity}</strong>
                          </p>
                          {orderItem.notes && (
                              <p className="text-xs text-amber-800 bg-amber-100 rounded px-2 py-1 inline-block mt-1">
                                備註: {orderItem.notes}
                              </p>
                          )}
                        </div>
                        <span className="font-medium text-stone-700">${orderItem.item.price * orderItem.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }) : <p className="text-stone-500 text-center py-4">沒有您的訂單記錄。</p>}
          </div>
        </div>

        <div className="border-t-2 border-dashed pt-6 mb-8">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-stone-800">應付總額</span>
            <span className="text-4xl font-extrabold text-emerald-700">${totalAmount}</span>
          </div>
        </div>

        {isAdmin && sessionStatus === 'SUMMARY' && (
          <div className="text-center">
            <button
              onClick={handleStateChange}
              disabled={isProcessing || !allPaid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl disabled:bg-emerald-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? '處理中...' : '完成收款並鎖定訂單'}
            </button>
            <p className="text-sm text-stone-500 mt-4">
              {allPaid
                ? '所有款項皆已結清，可以鎖定訂單。'
                : `還有 ${orders.filter(o => !o.isPaid).length} 位未付款，全員付清後才能完成收款。`}
            </p>
          </div>
        )}

        {isAdmin && sessionStatus === 'COMPLETED' && (
          <div className="text-center">
            <button
              onClick={handleStateChange}
              disabled={isProcessing}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-red-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? '歸檔中...' : '結束訂單'}
            </button>
            <p className="text-sm text-stone-500 mt-4">訂單已完成並鎖定，按下此按鈕將封存本次紀錄並重置系統至初始畫面。</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default FinalSummary;