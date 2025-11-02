import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

interface LoginScreenProps {
  onLogin: () => void;
  onMockLogin: (user: FirebaseUser) => void;
}

// 直接將 IS_DEV 設為 true，以在預覽環境中顯示測試按鈕
const IS_DEV = true;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onMockLogin }) => {

  const handleMockLogin = (userId: 'A' | 'B' | 'C') => {
    const mockUser = {
      uid: `mock-user-${userId.toLowerCase()}`,
      displayName: `測試使用者${userId}`,
    };
    // 使用類型斷言將簡化的模擬對象視為完整的 firebase.User
    onMockLogin(mockUser as FirebaseUser);
  };

  const MockLoginButton: React.FC<{ user: 'A' | 'B' | 'C' }> = ({ user }) => (
      <button
        onClick={() => handleMockLogin(user)}
        className="w-full bg-stone-600 hover:bg-stone-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        登入 測試使用者{user}
      </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-stone-800 tracking-wider">丁二烯訂飯飯</h1>
        <p className="mt-4 text-lg text-stone-600">一個團隊午餐訂購系統</p>
        
        {IS_DEV ? (
          // 在測試環境中，只顯示模擬登入按鈕
          <div className="mt-16 w-full">
            <h3 className="text-md font-semibold text-stone-600 mb-6">測試環境登入</h3>
            <div className="space-y-4">
              <MockLoginButton user="A" />
              <MockLoginButton user="B" />
              <MockLoginButton user="C" />
            </div>
          </div>
        ) : (
          // 在正式環境中，顯示 LINE 登入按鈕
          <>
            <div className="mt-16">
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                使用 LINE 登入
              </button>
            </div>
            <p className="mt-8 text-sm text-stone-500">
              點擊按鈕以您的 LINE 帳號登入，並開始今天的訂餐流程。
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
