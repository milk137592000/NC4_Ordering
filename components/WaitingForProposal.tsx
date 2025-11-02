import React from 'react';
import type { User, Suggestion } from '../types';

interface WaitingForProposalProps {
  adminName: string;
  deadline: string | null; // 新增：接收截止時間
  suggestions: Suggestion[];
  currentUser: User;
  onOpenSuggestionModal: () => void;
}

const WaitingForProposal: React.FC<WaitingForProposalProps> = ({ adminName, deadline, suggestions, currentUser, onOpenSuggestionModal }) => {
  const currentUserSuggestion = suggestions.find(s => s.userId === currentUser.id);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center max-w-4xl mx-auto mt-12">
        <div className="animate-pulse text-6xl mb-6">🍽️</div>
        <h2 className="text-3xl font-bold tracking-wide text-stone-800 sm:text-4xl">等待餐廳提案中...</h2>
        <p className="mt-4 text-lg text-stone-600">
          今日管理員是 <strong className="font-semibold text-stone-700">{adminName}</strong>，正在為大家選擇午餐地點。
        </p>
        {deadline && (
           <p className="mt-2 text-lg text-red-600">
              訂單將於 <strong className="font-semibold">{deadline}</strong> 截止
           </p>
        )}

        <div className="mt-8">
            <button
                onClick={onOpenSuggestionModal}
                className="bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
                {currentUserSuggestion ? '我想換個建議' : '我有想吃的！'}
            </button>
        </div>

        {suggestions.length > 0 && (
            <div className="mt-12 text-left max-w-md mx-auto">
                <h3 className="text-xl font-bold text-stone-700 mb-4 text-center">大家的建議</h3>
                <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3 shadow-sm">
                    {suggestions.map(suggestion => (
                        <div key={suggestion.userId} className="flex items-center p-2 rounded-md bg-stone-50">
                            <span className="font-semibold text-stone-800">{suggestion.userName}</span>
                            <span className="text-stone-600 mx-2">建議吃：</span>
                            <span className="font-bold text-stone-800 flex-1 text-right">{suggestion.restaurantName}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        <p className="mt-12 text-md text-stone-500">
          提案出現後，您可以在這裡進行投票。
        </p>
      </div>
    </div>
  );
};

export default WaitingForProposal;