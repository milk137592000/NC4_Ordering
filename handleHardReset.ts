
const handleHardReset = useCallback(async () => {
    console.log("Initiating partial reset: clearing orders and logging out users...");
    if (!sessionData) {
      alert("沒有進行中的訂餐，無法重置。");
      return;
    }

    // 检查当前用户是否为管理员
    if (!isAdmin) {
      alert("只有管理员可以执行强制重置操作。");
      return;
    }

    // 询问管理员是否要继续担任管理员
    const keepAdmin = window.confirm("重置后是否要继续担任管理员？\n\n点击「确定」继续担任管理员\n点击「取消」不担任管理员");

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

        // 如果选择继续担任管理员，创建新的会话并设置为管理员
        if (keepAdmin && currentUser) {
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
            alert('已清空所有訂單並登出所有人員，您已繼續擔任管理員。');
        } else {
            alert('已清空所有訂單並登出所有人員。');
        }
    } catch (error) {
        console.error("Reset failed:", error);
        alert("重置失败，请检查控制台错误。");
    }
  }, [today, sessionData, db, isAdmin, currentUser]);
