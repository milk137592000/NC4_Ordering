import React from 'react';
import type { User, UserMappings } from '../types';

interface MemberMappingScreenProps {
  users: User[];
  onSelectUser: (user: User) => Promise<void>;
  userMappings: UserMappings;
}

const MemberMappingScreen: React.FC<MemberMappingScreenProps> = ({ users, onSelectUser, userMappings }) => {
  const [isSelecting, setIsSelecting] = React.useState<string | null>(null);

  const handleSelect = async (user: User) => {
    console.log('[MemberMapping] handleSelect called', { userId: user.id, userName: user.name });
    setIsSelecting(user.id);
    try {
      console.log('[MemberMapping] Calling onSelectUser...');
      await onSelectUser(user);
      console.log('[MemberMapping] onSelectUser succeeded');
    } catch (e) {
      // In case of an error (e.g., transaction fails), allow the user to try again.
      console.error('[MemberMapping] Error in handleSelect:', e);
      const errorMessage = e instanceof Error ? e.message : '選擇人員時發生未知錯誤';
      alert(`選擇失敗：${errorMessage}\n\n請重新選擇或聯繫管理員。`);
      setIsSelecting(null);
    }
    // On success, the component will unmount, so no need to reset state.
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center max-w-4xl mx-auto">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-3xl font-bold tracking-wide text-stone-800 sm:text-4xl">您是團隊中的哪一位？</h2>
        <p className="mt-4 text-lg text-stone-600">
          登入成功！請選擇您在團隊中的身份以繼續。
        </p>
        <div className="mt-12 max-w-md mx-auto flex flex-col gap-4">
          {users.map(user => {
            const isTaken = !!userMappings[user.id];
            const isProcessing = isSelecting !== null;
            const isThisOneProcessing = isSelecting === user.id;

            return (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                disabled={isTaken || isProcessing}
                className={`
                  w-full text-center p-4 rounded-lg border-2 transition-all duration-300 transform 
                  ${isTaken 
                      ? 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed' 
                      : 'bg-white border-stone-200 cursor-pointer hover:scale-105 hover:bg-stone-50 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500'
                  }
                  ${isProcessing && !isThisOneProcessing ? 'opacity-50' : ''}
                  ${isThisOneProcessing ? 'animate-pulse ring-2 ring-stone-500' : ''}
                `}
              >
                <span className="text-xl font-semibold text-stone-800">{user.name}</span>
                {isTaken && <span className="text-sm block text-stone-500">(已被選取)</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-stone-500">
          此選擇將會被記住。若要更換身份，請先登出。
        </p>
      </div>
    </div>
  );
};

export default MemberMappingScreen;