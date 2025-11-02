import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut, OAuthProvider, signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
// FIX: Using namespace import for Firestore to resolve modular SDK usage errors.
import * as firestore from 'firebase/firestore';
import { auth, db } from './firebase';
import type {
  Restaurant,
  User,
  SessionData,
  Order,
  OrderItem,
  MenuItem,
  Votes,
  Suggestion,
  UserMappings,
  OrderType,
  Vote
} from './types';
import { fetchAndParseMenu } from './utils/menuParser';

import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import VolunteerAdminScreen from './components/VolunteerAdminScreen';
import RestaurantSelector from './components/RestaurantSelector';
import WaitingForProposal from './components/WaitingForProposal';
import ProposalVoteScreen from './components/ProposalVoteScreen';
import Menu from './components/Menu';
import GroupOrderSummary from './components/GroupOrderSummary';
import MyCartModal from './components/MyCartModal';
import FinalSummary from './components/FinalSummary';
import SuggestionModal from './components/SuggestionModal';
import HistoryScreen from './components/HistoryScreen';
import { CartIcon } from './components/icons';

const App: React.FC = () => {
  // Authentication & User state
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMappings, setUserMappings] = useState<UserMappings>({});

  // App data state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  
  // Session state for today
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [votes, setVotes] = useState<Votes>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');

  // Constants / Derived state
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const myOrder = useMemo<Order | undefined>(() => {
    if (!currentUser) return undefined;
    return orders.find(o => o.userId === currentUser.id);
  }, [orders, currentUser]);
  
  const isMyOrderLocked = useMemo(() => myOrder?.status === 'locked', [myOrder]);

  const isAdmin = useMemo(() => !!(currentUser && sessionData && currentUser.id === sessionData.admin.id), [currentUser, sessionData]);

  const todayParticipants = useMemo<User[]>(() => {
    if (!userMappings) return [];
    return Object.entries(userMappings).map(([uid, data]) => ({
        id: uid,
        uid,
        name: (data as { name: string }).name,
        role: 'colleague',
    }));
  }, [userMappings]);

  // Initial data load and cleanup
  useEffect(() => {
    const cleanupOldSessions = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();
      
      // FIX: Use modular Firestore functions
      const oldSessionsQuery = firestore.query(firestore.collection(db, 'session_history'));
  
      try {
          // FIX: Use modular Firestore functions
          const oldSessionsSnapshot = await firestore.getDocs(oldSessionsQuery);
  
          if (oldSessionsSnapshot.empty) {
              return;
          }
  
          // FIX: Use modular Firestore functions
          const batch = firestore.writeBatch(db);
  
          for (const sessionDoc of oldSessionsSnapshot.docs) {
              const sessionData = sessionDoc.data();
              if (sessionData.completedAt && sessionData.completedAt < sevenDaysAgoISO) {
                  const sessionRef = sessionDoc.ref;
                  
                  const subcollections = ['orders', 'votes', 'suggestions'];
                  for (const sub of subcollections) {
                      // FIX: Use modular Firestore functions
                      const subcollectionSnapshot = await firestore.getDocs(firestore.collection(sessionRef, sub));
                      subcollectionSnapshot.forEach(doc => {
                          batch.delete(doc.ref);
                      });
                  }
      
                  batch.delete(sessionRef);
              }
          }
  
          await batch.commit();
          
      } catch (error) {
          console.error("清理舊 session 歷史紀錄時發生錯誤:", error);
      }
    };
    
    const initializeApp = async () => {
      setIsLoading(true);
      await cleanupOldSessions(); // Run cleanup on app start
      const fetchedRestaurants = await fetchAndParseMenu();
      setRestaurants(fetchedRestaurants);
    };
    initializeApp();
  }, [db]);
  
  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      if (!user) {
        setCurrentUser(null);
        setViewMode('current');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to user mappings for today
  useEffect(() => {
    // FIX: Use modular Firestore functions
    const unsub = firestore.onSnapshot(firestore.doc(db, 'userMappings', today), (doc) => {
      setUserMappings(doc.data() as UserMappings || {});
    });
    return () => unsub();
  }, [today, db]);

  // Set current user from Firebase auth user and update daily participants
  useEffect(() => {
    if (fbUser) {
      const user: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || 'LINE 使用者',
        role: 'colleague',
      };
      setCurrentUser(user);

      // FIX: Use modular Firestore functions
      const userMappingDocRef = firestore.doc(db, 'userMappings', today);
      // FIX: Use modular Firestore functions
      firestore.setDoc(userMappingDocRef, {
        [fbUser.uid]: { name: user.name }
      }, { merge: true });

    } else {
      setCurrentUser(null);
    }
  }, [fbUser, today, db]);

  // Listen to today's session data
  useEffect(() => {
    if (!today) return;

    // FIX: Use modular Firestore functions
    const sessionDocRef = firestore.doc(db, 'sessions', today);
    // FIX: Use modular Firestore functions
    const unsubSession = firestore.onSnapshot(sessionDocRef, (doc) => {
      setSessionData(doc.exists() ? { id: doc.id, ...doc.data() } as SessionData : null);
    });

    // FIX: Use modular Firestore functions
    const unsubOrders = firestore.onSnapshot(firestore.collection(sessionDocRef, 'orders'), (snapshot) => {
      const allOrders: Order[] = snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as Order));
      setOrders(allOrders);
    });

    // FIX: Use modular Firestore functions
    const unsubVotes = firestore.onSnapshot(firestore.collection(sessionDocRef, 'votes'), (snapshot) => {
      const allVotes: Votes = {};
      snapshot.forEach(doc => {
        allVotes[doc.id] = doc.data() as Vote;
      });
      setVotes(allVotes);
    });
    
    // FIX: Use modular Firestore functions
    const unsubSuggestions = firestore.onSnapshot(firestore.collection(sessionDocRef, 'suggestions'), (snapshot) => {
        const allSuggestions: Suggestion[] = snapshot.docs.map(doc => doc.data() as Suggestion);
        setSuggestions(allSuggestions);
    });

    return () => {
      unsubSession();
      unsubOrders();
      unsubVotes();
      unsubSuggestions();
    };
  }, [today, db]);

  const clearSessionData = useCallback(async () => {
    // FIX: Use modular Firestore functions
    const sessionDocRef = firestore.doc(db, 'sessions', today);
    // FIX: Use modular Firestore functions
    const batch = firestore.writeBatch(db);

    const collectionsToDelete = ['orders', 'votes', 'suggestions'];
    for (const coll of collectionsToDelete) {
        try {
            // FIX: Use modular Firestore functions
            const snapshot = await firestore.getDocs(firestore.collection(sessionDocRef, coll));
            snapshot.forEach(doc => batch.delete(doc.ref));
        } catch (error) {
            console.error(`Error deleting subcollection ${coll}:`, error);
        }
    }
    
    batch.delete(sessionDocRef);

    try {
        await batch.commit();
        console.log(`Session ${today} cleared.`);
    } catch (error) {
        console.error(`Error committing session clearing batch for ${today}:`, error);
    }
  }, [today, db]);

  // Check for expired session
  useEffect(() => {
    if (sessionData && sessionData.status === 'ORDERING' && sessionData.createdAt) {
      const EXPIRATION_HOURS = 3;
      const createdAt = new Date(sessionData.createdAt);
      const expirationTime = createdAt.getTime() + EXPIRATION_HOURS * 60 * 60 * 1000;
      
      if (Date.now() > expirationTime) {
        console.log('Session has expired. Cancelling...');
        clearSessionData().then(() => {
          alert('本次訂單已超過3小時未完成，系統已自動取消。');
        });
      }
    }
  }, [sessionData, clearSessionData]);
  
  const handleProposalRejection = useCallback(async () => {
      // FIX: Use modular Firestore functions
      const batch = firestore.writeBatch(db);
      // FIX: Use modular Firestore functions
      const sessionDocRef = firestore.doc(db, 'sessions', today);

      batch.update(sessionDocRef, {
          isProposalRejected: true,
          proposedRestaurant: null,
      });

      // FIX: Use modular Firestore functions
      const votesSnapshot = await firestore.getDocs(firestore.collection(sessionDocRef, 'votes'));
      votesSnapshot.forEach(voteDoc => batch.delete(voteDoc.ref));
      
      // FIX: Use modular Firestore functions
      const ordersSnapshot = await firestore.getDocs(firestore.collection(sessionDocRef, 'orders'));
      ordersSnapshot.forEach(orderDoc => batch.delete(orderDoc.ref));

      await batch.commit();
  }, [today, db]);

  useEffect(() => {
    if (sessionData?.proposedRestaurant && !sessionData.isProposalRejected) {
      const disagreeCount = Object.values(votes).filter((v: Vote) => v.vote === 'disagree').length;
      const agreeCount = Object.values(votes).filter((v: Vote) => v.vote === 'agree').length;
      
      // 檢查是否達到決策條件
      if (disagreeCount >= 2) {
          handleProposalRejection();
      } else if (agreeCount >= 3) {
          // 3人以上同意，自動進入點餐階段
          // 不需要特別處理，因為使用者已經可以開始點餐
      }
    }
  }, [votes, sessionData, today, handleProposalRejection]);

  const handleLogin = useCallback(async () => {
    const provider = new OAuthProvider('line.me');
    provider.addScope('profile');
    provider.addScope('openid');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("LINE login failed:", error);
      alert("LINE 登入失敗，請檢查您的網路連線或稍後再試。");
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (!fbUser) return;

    if (fbUser.uid.startsWith('mock-user-')) {
      setFbUser(null);
      setCurrentUser(null);
      return;
    }

    // FIX: Use modular Firestore functions
    const userMappingDocRef = firestore.doc(db, 'userMappings', today);
    // FIX: Use modular Firestore functions
    firestore.runTransaction(db, async (transaction) => {
        const docSnapshot = await transaction.get(userMappingDocRef);
        if (docSnapshot.exists()) {
            const currentMappings = docSnapshot.data() as UserMappings;
            const newMappings = { ...currentMappings };
            if (newMappings[fbUser.uid]) {
                delete newMappings[fbUser.uid];
                transaction.set(userMappingDocRef, newMappings);
            }
        }
    }).then(() => {
        signOut(auth);
    }).catch(e => {
        console.error("Error during logout transaction: ", e);
        signOut(auth); // Sign out anyway
    });
  }, [fbUser, today, db]);

  const handleHardReset = useCallback(async () => {
    console.log("Initiating partial reset: clearing orders and logging out users...");
    if (!sessionData) {
      alert("沒有進行中的訂餐，無法重置。");
      return;
    }
    
    try {
        // FIX: Use modular Firestore functions
        const batch = firestore.writeBatch(db);
        // FIX: Use modular Firestore functions
        const sessionDocRef = firestore.doc(db, 'sessions', today);
        // FIX: Use modular Firestore functions
        const userMappingsDocRef = firestore.doc(db, 'userMappings', today);

        // FIX: Use modular Firestore functions
        const ordersSnapshot = await firestore.getDocs(firestore.collection(sessionDocRef, 'orders'));
        if (!ordersSnapshot.empty) {
            ordersSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        batch.delete(userMappingsDocRef);
        
        await batch.commit();
        console.log("Orders and user mappings cleared for today.");
        
        await signOut(auth);
        
        alert('已清空所有訂單並登出所有人員。');
    } catch (error) {
        console.error("Reset failed:", error);
        alert("重置失败，请检查控制台错误。");
    }
  }, [today, sessionData, db]);

  const handleVolunteer = useCallback(async () => {
    if (!currentUser) return;
    // FIX: Use modular Firestore functions
    await firestore.setDoc(firestore.doc(db, 'sessions', today), {
      status: 'ORDERING',
      admin: { id: currentUser.id, name: currentUser.name, role: 'admin' },
      orderType: null,
      deadline: '',
      proposedRestaurant: null,
      isProposalRejected: false,
      createdAt: new Date().toISOString(),
    });
  }, [currentUser, today, db]);

  const handleSetOrderType = useCallback(async (type: OrderType | null) => {
    // FIX: Use modular Firestore functions
    await firestore.updateDoc(firestore.doc(db, 'sessions', today), { orderType: type });
  }, [today, db]);
  
  const handleSetDeadline = useCallback(async (time: string) => {
      // FIX: Use modular Firestore functions
      await firestore.updateDoc(firestore.doc(db, 'sessions', today), { deadline: time });
  }, [today, db]);

  const handleSelectRestaurant = useCallback(async (restaurant: Restaurant) => {
    // FIX: Use modular Firestore functions
    await firestore.updateDoc(firestore.doc(db, 'sessions', today), {
      proposedRestaurant: restaurant,
      isProposalRejected: false,
    });
  }, [today, db]);
  
  const handleCancelProposal = useCallback(async () => {
    // FIX: Use modular Firestore functions
    const batch = firestore.writeBatch(db);
    // FIX: Use modular Firestore functions
    const sessionRef = firestore.doc(db, 'sessions', today);

    // FIX: Use modular Firestore functions
    const ordersSnapshot = await firestore.getDocs(firestore.collection(sessionRef, 'orders'));
    ordersSnapshot.forEach(orderDoc => batch.delete(orderDoc.ref));
    
    // FIX: Use modular Firestore functions
    const votesSnapshot = await firestore.getDocs(firestore.collection(sessionRef, 'votes'));
    votesSnapshot.forEach(voteDoc => batch.delete(voteDoc.ref));

    batch.update(sessionRef, { proposedRestaurant: null, isProposalRejected: false });
    await batch.commit();
  }, [today, db]);
  
  const handleBackToRestaurantSelection = useCallback(() => handleCancelProposal(), [handleCancelProposal]);

  const handleVote = useCallback(async (vote: 'agree' | 'disagree') => {
    if (!currentUser) return;
    // FIX: Use modular Firestore functions
    await firestore.setDoc(firestore.doc(db, 'sessions', today, 'votes', currentUser.id), { vote });
  }, [currentUser, today, db]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    if (!currentUser) return;
    if (isMyOrderLocked) {
      alert('訂單已確認，無法修改。');
      return;
    }
      
    // FIX: Use modular Firestore functions
    const orderDocRef = firestore.doc(db, 'sessions', today, 'orders', currentUser.id);

    // FIX: Use modular Firestore functions
    firestore.runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderDocRef);
        const currentOrder = orderDoc.exists() ? orderDoc.data() as Order : { userName: currentUser.name, items: [], status: 'submitted', userId: currentUser.id };
        
        const newItems = [...currentOrder.items];
        const existingItemIndex = newItems.findIndex(i => i.item.id === item.id && !i.notes);
        
        if (existingItemIndex > -1) {
            newItems[existingItemIndex].quantity += 1;
        } else {
            newItems.push({ item, quantity: 1, notes: '' });
        }

        transaction.set(orderDocRef, { ...currentOrder, items: newItems, status: 'submitted', isPaid: false });
    }).catch(e => console.error("Add to cart transaction failed: ", e));
  }, [currentUser, today, isMyOrderLocked, db]);
  
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (!currentUser || !myOrder || isMyOrderLocked) return;
    let newItems: OrderItem[] = newQuantity <= 0 
        ? myOrder.items.filter(i => i.item.id !== itemId)
        : myOrder.items.map(i => i.item.id === itemId ? { ...i, quantity: newQuantity } : i);
    // FIX: Use modular Firestore functions
    firestore.updateDoc(firestore.doc(db, 'sessions', today, 'orders', currentUser.id), { items: newItems });
  }, [currentUser, myOrder, today, isMyOrderLocked, db]);

  const handleUpdateNotes = useCallback((itemId: string, notes: string) => {
      if (!currentUser || !myOrder || isMyOrderLocked) return;
      const newItems = myOrder.items.map(i => i.item.id === itemId ? { ...i, notes: notes } : i);
      // FIX: Use modular Firestore functions
      firestore.updateDoc(firestore.doc(db, 'sessions', today, 'orders', currentUser.id), { items: newItems });
  }, [currentUser, myOrder, today, isMyOrderLocked, db]);

  const handleSubmitOrder = useCallback(() => {
      if (!currentUser || !myOrder || myOrder.items.length === 0 || isMyOrderLocked) {
          console.warn("无法提交订单：条件不满足");
          return;
      }

      try {
          // FIX: Use modular Firestore functions
          firestore.updateDoc(firestore.doc(db, 'sessions', today, 'orders', currentUser.id), { 
              status: 'confirmed', // 修改状态为 confirmed
              userId: currentUser.id,
              confirmedAt: new Date().toISOString(), // 添加确认时间
          });
          setIsCartOpen(false);
          alert("您的订单已成功确认！");
      } catch (error) {
          console.error("提交订单时发生错误:", error);
          alert("提交订单时发生错误，请稍后再试。");
      }
  }, [myOrder, isMyOrderLocked, currentUser, today, db]);
  
  const handleEndOrdering = async () => {
    // 添加調試日誌
    console.log("handleEndOrdering called");
    console.log("sessionData:", sessionData);
    console.log("currentUser:", currentUser);
    
    // 檢查是否有權限執行此操作
    if (!sessionData) {
      console.error("沒有 sessionData");
      alert("沒有進行中的訂餐會話");
      return;
    }
    
    if (!currentUser) {
      console.error("沒有 currentUser");
      alert("請先登入");
      return;
    }
    
    // 檢查是否為管理員
    if (!sessionData.admin || currentUser.id !== sessionData.admin.id) {
      console.error("不是管理員");
      alert("只有管理員可以停止點餐");
      return;
    }
    
    if (!window.confirm('確定要停止點餐並鎖定所有訂單嗎？此操作後將無法再修改訂單。')) {
        return;
    }

    try {
      const batch = firestore.writeBatch(db);
      const sessionDocRef = firestore.doc(db, 'sessions', today);

      // 鎖定所有訂單
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          // BUG FIX: Correctly reference the document in the 'orders' subcollection.
          const orderDocRef = firestore.doc(db, 'sessions', today, 'orders', order.userId);
          batch.update(orderDocRef, { status: 'locked' });
        });
      }

      // 更新會話狀態為 SUMMARY
      batch.update(sessionDocRef, { status: 'SUMMARY' });

      // 提交批量操作
      await batch.commit();
      alert('已停止點餐，所有訂單皆已鎖定。');
    } catch(e) {
      console.error("Error ending ordering phase:", e);
      alert("結束點餐時發生錯誤: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleTogglePaymentStatus = useCallback(async (userId: string) => {
    if (!sessionData) return;
    if (sessionData.status !== 'SUMMARY') {
        alert('只能在「結帳」階段更改付款狀態。');
        return;
    }

    const orderToUpdate = orders.find(o => o.userId === userId);
    if (!orderToUpdate) {
        console.error(`在訂單列表中找不到 ID 為 ${userId} 的使用者`);
        return;
    }
    
    if (!isAdmin && currentUser?.id !== userId) {
        alert('您只能更改自己的付款狀態。');
        return;
    }
    
    const newPaidStatus = !Boolean(orderToUpdate.isPaid);
    
    try {
      // FIX: Use modular Firestore functions
      await firestore.updateDoc(firestore.doc(db, 'sessions', today, 'orders', userId), { isPaid: newPaidStatus });
    } catch (error) {
      console.error("更新付款狀態失敗:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`更新付款狀態時發生錯誤，請稍後再試。\n錯誤詳情: ${errorMessage}`);
      throw error;
    }
  }, [isAdmin, today, sessionData, currentUser, orders, db]);

  const handleCompleteOrder = useCallback(async () => {
    if (!isAdmin || !sessionData) return;
    
    if (sessionData.status === 'SUMMARY') {
        try {
            // FIX: Use modular Firestore functions
            await firestore.updateDoc(firestore.doc(db, 'sessions', today), {
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
            });
            alert('訂單已完成收款並鎖定！');
        } catch (error) {
            console.error("Error marking order as completed:", error);
            alert("將訂單標示為完成時發生錯誤。");
            throw error;
        }
        return;
    }

    if (sessionData.status === 'COMPLETED') {
        try {
            // FIX: Use modular Firestore functions
            const sourceSessionRef = firestore.doc(db, 'sessions', today);
            
            // FIX: Use modular Firestore functions
            const sessionDoc = await firestore.getDoc(sourceSessionRef);
            if (!sessionDoc.exists()) {
                console.error("Session to archive does not exist.");
                return;
            }
            
            const sessionToArchive = sessionDoc.data() as SessionData;

            // FIX: Use modular Firestore functions
            const ordersSnapshot = await firestore.getDocs(firestore.collection(sourceSessionRef, 'orders'));
            // FIX: Use modular Firestore functions
            const votesSnapshot = await firestore.getDocs(firestore.collection(sourceSessionRef, 'votes'));
            // FIX: Use modular Firestore functions
            const suggestionsSnapshot = await firestore.getDocs(firestore.collection(sourceSessionRef, 'suggestions'));

            // FIX: Use modular Firestore functions
            const batch = firestore.writeBatch(db);
            // FIX: Use modular Firestore functions
            const historySessionRef = firestore.doc(db, 'session_history', today);
            
            batch.set(historySessionRef, sessionToArchive);
            // FIX: Use modular Firestore functions
            ordersSnapshot.forEach(docInst => batch.set(firestore.doc(firestore.collection(historySessionRef, 'orders'), docInst.id), docInst.data()));
            // FIX: Use modular Firestore functions
            votesSnapshot.forEach(docInst => batch.set(firestore.doc(firestore.collection(historySessionRef, 'votes'), docInst.id), docInst.data()));
            // FIX: Use modular Firestore functions
            suggestionsSnapshot.forEach(docInst => batch.set(firestore.doc(firestore.collection(historySessionRef, 'suggestions'), docInst.id), docInst.data()));

            ordersSnapshot.forEach(doc => batch.delete(doc.ref));
            votesSnapshot.forEach(doc => batch.delete(doc.ref));
            suggestionsSnapshot.forEach(doc => batch.delete(doc.ref));
            batch.delete(sourceSessionRef);
            
            await batch.commit();

            alert('訂單已成功歸檔，系統即將重置。');
            console.log(`Session ${today} has been completed and archived.`);
        } catch (error) {
            console.error("Error archiving and resetting order:", error);
            alert("結束訂單時發生錯誤，請稍後再試。");
            throw error;
        }
    }
  }, [isAdmin, today, sessionData, db]);

  const handleSuggest = useCallback(async (restaurant: Restaurant) => {
      if (!currentUser) return;
      const suggestion: Suggestion = {
          userId: currentUser.id,
          userName: currentUser.name,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
      };
      // FIX: Use modular Firestore functions
      await firestore.setDoc(firestore.doc(db, 'sessions', today, 'suggestions', currentUser.id), suggestion);
      setIsSuggestionModalOpen(false);
  }, [currentUser, today, db]);
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><p>正在載入...</p></div>;
    }

    if (viewMode === 'history' && currentUser) {
      return <HistoryScreen currentUser={currentUser} onBack={() => setViewMode('current')} />;
    }

    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} onMockLogin={(user) => setFbUser(user)} />;
    }
    
    if (!sessionData) {
      return <VolunteerAdminScreen 
        currentUser={currentUser} 
        onVolunteer={handleVolunteer} 
        suggestions={suggestions}
        onOpenSuggestionModal={() => setIsSuggestionModalOpen(true)}
      />;
    }

    if (sessionData.status === 'SUMMARY' || sessionData.status === 'COMPLETED') {
        return <FinalSummary
            orders={orders}
            restaurantName={sessionData.proposedRestaurant?.name || '未知餐廳'}
            onCompleteOrder={handleCompleteOrder}
            currentUser={currentUser}
            isAdmin={isAdmin}
            sessionStatus={sessionData.status}
            onTogglePaymentStatus={handleTogglePaymentStatus}
        />;
    }


    // ORDERING status
    if (!sessionData.orderType && isAdmin) {
      return <RestaurantSelector
        restaurants={restaurants}
        orderType={sessionData.orderType}
        onSetOrderType={handleSetOrderType}
        onSelectRestaurant={handleSelectRestaurant} // Prop is expected, even if not used in this specific path
        suggestions={suggestions}
        deadline={sessionData.deadline}
        onSetDeadline={handleSetDeadline}
      />;
    }

    if (!sessionData.proposedRestaurant) {
      if (isAdmin) {
        return <RestaurantSelector
          restaurants={restaurants}
          orderType={sessionData.orderType}
          onSetOrderType={handleSetOrderType}
          onSelectRestaurant={handleSelectRestaurant}
          isProposalRejected={sessionData.isProposalRejected}
          suggestions={suggestions}
          deadline={sessionData.deadline}
          onSetDeadline={handleSetDeadline}
        />;
      } else {
        return <WaitingForProposal 
          adminName={sessionData.admin.name} 
          deadline={sessionData.deadline}
          suggestions={suggestions}
          currentUser={currentUser}
          onOpenSuggestionModal={() => setIsSuggestionModalOpen(true)}
        />;
      }
    }
    
    const hasVotedAgree = votes[currentUser.id]?.vote === 'agree';

    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <ProposalVoteScreen 
          currentUser={currentUser}
          proposedRestaurant={sessionData.proposedRestaurant}
          adminName={sessionData.admin.name}
          users={todayParticipants}
          votes={votes}
          onVote={handleVote}
          onCancelProposal={handleCancelProposal}
        />
        {(hasVotedAgree || isAdmin) && sessionData.proposedRestaurant.menu && (
           <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-2">
                <Menu 
                  menu={sessionData.proposedRestaurant.menu}
                  onAddToCart={handleAddToCart}
                />
             </div>
             <div className="lg:col-span-1">
                <GroupOrderSummary 
                  orders={orders}
                  isAdmin={isAdmin}
                  onEndOrdering={handleEndOrdering}
                  sessionStatus={sessionData.status}
                  currentUser={currentUser}
                  onTogglePaymentStatus={handleTogglePaymentStatus}
                />
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-stone-50 min-h-screen font-sans">
      <Header
        currentUser={currentUser}
        selectedRestaurant={sessionData?.proposedRestaurant || null}
        deadline={sessionData?.deadline || null}
        onBack={handleBackToRestaurantSelection}
        onSwitchUser={handleLogout}
        onHardReset={handleHardReset}
        isAdmin={isAdmin}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
      />
      <main>
        {renderContent()}
      </main>
      
      {currentUser && myOrder && myOrder.items.length > 0 && !isCartOpen && sessionData?.status === 'ORDERING' && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-stone-800 text-white rounded-full p-4 shadow-lg hover:bg-stone-700 transition-transform transform hover:scale-110 z-30"
          aria-label="打開購物車"
        >
          <CartIcon className="w-8 h-8"/>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {myOrder.items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </button>
      )}

      {isCartOpen && myOrder && (
        <MyCartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={myOrder.items}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={handleUpdateNotes}
          onSubmitOrder={handleSubmitOrder}
          isLocked={isMyOrderLocked}
        />
      )}

      {isSuggestionModalOpen && (
        <SuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => setIsSuggestionModalOpen(false)}
          restaurants={restaurants}
          onSuggest={handleSuggest}
        />
      )}
    </div>
  );
};

export default App;
