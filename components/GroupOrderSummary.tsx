import React from 'react';
import type { Order, User, SessionData } from '../types';

// 定義 GroupOrderSummary 組件的 props 類型
interface GroupOrderSummaryProps {
  orders: Order[]; // 所有已提交的訂單列表
  isAdmin: boolean; // 判斷當前使用者是否為本次訂單的管理員
  onEndOrdering: () => void; // 新增：結束點餐並進入結帳階段
  sessionStatus: SessionData['status']; // 新增：傳入當前 session 狀態
  currentUser?: User; // 當前登入的用戶，用於過濾非管理員可見的訂單
  onTogglePaymentStatus?: (userId: string) => void; // 用戶自行確認付款狀態
}

// 團購訂單摘要組件
const GroupOrderSummary: React.FC<GroupOrderSummaryProps> = ({ orders = [], isAdmin, onEndOrdering, sessionStatus, currentUser, onTogglePaymentStatus }) => {
  // 根據用戶權限過濾訂單：管理員可以看到所有訂單，非管理員只能看到自己的訂單
  const visibleOrders = isAdmin ? orders : orders.filter(order => currentUser && order.userId === currentUser.id);
  // 計算總金額 - 使用可見訂單計算，非管理員只能看到自己的訂單總額
  const totalAmount = visibleOrders.reduce((total, order) => {
    const userTotal = order.items.reduce((subTotal, orderItem) => {
      return subTotal + orderItem.item.price * orderItem.quantity;
    }, 0);
    return total + userTotal;
  }, 0);

  // 根據訂單狀態返回對應的狀態標籤
  const getOrderStatusChip = (status: Order['status']) => {
    switch (status) {
      case 'submitted':
      case 'confirmed':
        return <span className="text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full">已確認</span>;
      case 'locked':
        return <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded-full">已鎖定</span>;
      default:
        // Fallback for orders created before status was introduced
        return <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-full">處理中</span>;
    }
  };

  // 處理用戶自行確認付款
  const handleUserPaymentConfirm = () => {
    if (currentUser && onTogglePaymentStatus) {
      onTogglePaymentStatus(currentUser.id);
    }
  };

  return (
    // 側邊欄容器，使用 sticky 定位使其在滾動時保持在原位
    <aside className="w-full bg-white p-6 rounded-lg border border-stone-200 shadow-sm sticky top-24">
      <h3 className="text-2xl font-bold text-stone-800 mb-6 border-b pb-3">
        訂單總覽
      </h3>
      
      {/* 訂單列表 */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* 如果沒有訂單，顯示提示訊息 */}
        {visibleOrders.length === 0 ? (
          <p className="text-stone-500 text-center py-8">{isAdmin ? "目前還沒有人點餐喔！" : "您還沒有點餐喔！"}</p>
        ) : (
          // 遍歷可見訂單
          visibleOrders.map((order, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              {/* 訂購人姓名和狀態 */}
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-stone-800">{order.userName}</h4>
                {getOrderStatusChip(order.status)}
              </div>

              <ul className="space-y-2 text-sm text-stone-600">
                {/* 遍歷該訂單的所有項目 */}
                {order.items.map((orderItem, itemIndex) => (
                  <li key={itemIndex} className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <p>
                        {orderItem.item.name}
                        <strong className="ml-2 text-stone-800">x {orderItem.quantity}</strong>
                      </p>
                      {orderItem.notes && (
                        <p className="text-xs text-stone-500 pl-2 mt-1">↳ {orderItem.notes}</p>
                      )}
                    </div>
                    <span className="font-medium text-stone-800">${orderItem.item.price * orderItem.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Admin End Ordering Button */}
      {isAdmin && sessionStatus === 'ORDERING' && orders.length > 0 && (
        <div className="mt-6">
          <button 
            onClick={onEndOrdering}
            className="w-full bg-stone-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-stone-700 transition-colors shadow-md"
          >
            停止點餐，進入結帳
          </button>
        </div>
      )}

      {/* 用戶付款確認按鈕 */}
      {!isAdmin && sessionStatus === 'SUMMARY' && currentUser && (
        <div className="mt-6">
          <button 
            onClick={handleUserPaymentConfirm}
            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
          >
            我已完成付款
          </button>
          <p className="text-xs text-stone-500 mt-2 text-center">點擊按鈕確認您已完成付款</p>
        </div>
      )}

      {/* 總計金額 */}
      {visibleOrders.length > 0 && (
        <div className="mt-8 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-stone-800">總計金額</span>
            <span className="text-emerald-700">${totalAmount}</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default GroupOrderSummary;