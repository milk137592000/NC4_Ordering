import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import type { User, SessionData, Order } from '../types';
// FIX: Switched from namespace to named imports for Firestore to align with Firebase v9+ modular SDK.
import * as firestore from 'firebase/firestore';


interface HistoryScreenProps {
  currentUser: User;
  onBack: () => void;
}

type HistoricalEntry = SessionData & { orders: Order[] };

const HistoryScreen: React.FC<HistoryScreenProps> = ({ currentUser, onBack }) => {
  const [history, setHistory] = useState<HistoricalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 查詢 sessions 集合中的已完成訂單
        // FIX: Use modular Firestore functions
        const sessionsQuery = firestore.query(
          firestore.collection(db, 'sessions'),
          firestore.where('status', '==', 'COMPLETED')
        );
        // FIX: Use modular Firestore functions
        const sessionsSnapshot = await firestore.getDocs(sessionsQuery);
        
        // 查詢 session_history 集合中的已完成訂單
        // FIX: Use modular Firestore functions
        const historySessionsQuery = firestore.query(
          firestore.collection(db, 'session_history')
        );
        // FIX: Use modular Firestore functions
        const historySessionsSnapshot = await firestore.getDocs(historySessionsQuery);

        const allCompletedSessions: SessionData[] = [];
        
        // 從 sessions 集合中獲取數據
        sessionsSnapshot.forEach(doc => {
          const data = doc.data() as SessionData;
          // 過濾最近7天的數據
          if (data.completedAt && new Date(data.completedAt) >= sevenDaysAgo) {
            allCompletedSessions.push({ ...data, id: doc.id });
          }
        });
        
        // 從 session_history 集合中獲取數據
        historySessionsSnapshot.forEach(doc => {
          const data = doc.data() as SessionData;
          // 過濾最近7天的數據
          if (data.completedAt && new Date(data.completedAt) >= sevenDaysAgo) {
            allCompletedSessions.push({ ...data, id: doc.id });
          }
        });

        // 在客戶端進行排序
        allCompletedSessions.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

        const historyPromises = allCompletedSessions.map(async (session) => {
          let orders: Order[] = [];
          
          try {
            // 嘗試從 session_history 集合中獲取訂單
            // FIX: Use modular Firestore functions
            const ordersSnapshot = await firestore.getDocs(firestore.collection(db, 'session_history', session.id, 'orders'));
            orders = ordersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as Order));
          } catch (error) {
            // 如果從 session_history 獲取失敗，則嘗試從 sessions 集合中獲取
            try {
              // FIX: Use modular Firestore functions
              const ordersSnapshot = await firestore.getDocs(firestore.collection(db, 'sessions', session.id, 'orders'));
              orders = ordersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as Order));
            } catch (innerError) {
              console.error("Error fetching orders for session", session.id, innerError);
            }
          }
          
          // 如果從兩個地方都獲取不到訂單，再嘗試從 sessions 集合獲取
          if (orders.length === 0) {
            try {
              // FIX: Use modular Firestore functions
              const ordersSnapshot = await firestore.getDocs(firestore.collection(db, 'sessions', session.id, 'orders'));
              orders = ordersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as Order));
            } catch (innerError) {
              console.error("Error fetching orders for session", session.id, innerError);
            }
          }
          
          return { ...session, orders };
        });

        const fullHistory = await Promise.all(historyPromises);

        const userHistory = fullHistory.filter(entry => {
            if (entry.admin.id === currentUser.id) {
                return true;
            }
            return entry.orders.some(order => order.userId === currentUser.id);
        });

        setHistory(userHistory);
      } catch (err: any) {
        console.error("Error fetching history:", err);
        setError('讀取歷史訂單時發生錯誤。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser.id, db]);

  const renderOrderDetails = (order: Order) => {
    const userTotal = order.items.reduce((total, item) => total + item.item.price * item.quantity, 0);
    return (
        <div key={order.userId} className="border-t border-stone-200 mt-4 pt-4">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold text-stone-700">{order.userName}</h5>
                <span className="font-bold text-stone-800">${userTotal}</span>
            </div>
            <ul className="space-y-1 text-sm text-stone-600 pl-2">
                {order.items.map((orderItem, index) => (
                    <li key={index} className="flex justify-between">
                        <div className="pr-4">
                            <span>{orderItem.item.name} x {orderItem.quantity}</span>
                            {orderItem.notes && <p className="text-xs text-stone-500">↳ {orderItem.notes}</p>}
                        </div>
                        <span>${orderItem.item.price * orderItem.quantity}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-stone-800">歷史訂單</h2>
            <button onClick={onBack} className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200">
              ← 返回今日訂餐
            </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-lg text-stone-600">正在載入歷史訂單...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="text-lg font-semibold">發生錯誤</p>
            <p className="mt-2">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-stone-200">
            <p className="text-lg text-stone-600">最近一週內沒有您的訂單記錄。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map(entry => {
              const wasAdmin = entry.admin.id === currentUser.id;
              const myOrder = entry.orders.find(o => o.userId === currentUser.id);
              const totalAmount = entry.orders.reduce((sum, order) => sum + order.items.reduce((subSum, item) => subSum + item.item.price * item.quantity, 0), 0);
              // FIX: Removed useMemo from inside the map loop to prevent React error #310.
              // This calculation is inexpensive and does not require memoization here.
              const myTotal = myOrder?.items.reduce((total, item) => total + item.item.price * item.quantity, 0) || 0;

              return (
                <div key={entry.id} className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-stone-500">{entry.id}</p>
                            <h3 className="text-xl font-bold text-stone-800">{entry.proposedRestaurant?.name}</h3>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                           <p className="text-sm text-stone-500">{wasAdmin ? '訂單總額' : '我的消費'}</p>
                           <p className="text-2xl font-bold text-emerald-700">
                             ${wasAdmin ? totalAmount : myTotal}
                           </p>
                        </div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-stone-700 mb-2">{wasAdmin ? '所有訂單明細' : '我的訂單明細'}</h4>
                  
                  <div className="space-y-4">
                    {wasAdmin ? (
                      entry.orders.length > 0 ? entry.orders.map(renderOrderDetails) : <p className="text-stone-500">無人點餐。</p>
                    ) : myOrder ? (
                      renderOrderDetails(myOrder)
                    ) : (
                      <p className="text-stone-500">您在這次訂餐中沒有點餐。</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;