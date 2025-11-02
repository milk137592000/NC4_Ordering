import React from 'react';
import type { User, Suggestion } from '../types';

interface VolunteerAdminScreenProps {
  currentUser: User;
  onVolunteer: () => void;
  suggestions: Suggestion[]; // 新增：接收建議列表
  onOpenSuggestionModal: () => void; // 新增：打開建議彈窗的處理函數
}

const VolunteerAdminScreen: React.FC<VolunteerAdminScreenProps> = ({ currentUser, onVolunteer, suggestions, onOpenSuggestionModal }) => {
  const currentUserSuggestion = suggestions.find(s => s.userId === currentUser.id);
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl border border-stone-200 shadow-sm text-center">
        
        {/* Status Section */}
        <div className="text-5xl mb-4">👑</div>
        <h2 className="text-3xl font-bold text-stone-800">
          正在等待今日管理員...
        </h2>
        <p className="mt-4 text-lg text-stone-600 max-w-md mx-auto">
          今天的訂餐還沒開始，我們需要一位管理員來為大家選擇餐廳並發起訂單。
        </p>

        {/* Suggestions Display */}
        {suggestions.length > 0 && (
            <div className="mt-8 text-left max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-stone-700 mb-3 text-center">大家的許願池</h3>
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-4 space-y-3">
                    {suggestions.map(suggestion => (
                        <div key={suggestion.userId} className="flex items-center p-2 rounded-md bg-white">
                            <span className="font-semibold text-stone-800">{suggestion.userName}</span>
                            <span className="text-stone-500 mx-2">想吃</span>
                            <span className="font-bold text-stone-800 flex-1 text-right">{suggestion.restaurantName}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Divider */}
        <div className="my-8 border-t border-stone-200"></div>

        {/* Action Section */}
        <div className="text-center">
            <h3 className="font-semibold text-xl text-stone-700">您可以...</h3>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={onVolunteer}
                className="w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                我來當管理員
              </button>
              <button
                onClick={onOpenSuggestionModal}
                className="w-full sm:w-auto border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                {currentUserSuggestion ? '我想換個建議' : '我有想吃的！'}
              </button>
            </div>
        </div>
      </div>

      <p className="text-center mt-8 text-stone-500">
        您可以自願成為管理員、提出建議，或稍後再回來查看狀態。
      </p>
    </div>
  );
};

export default VolunteerAdminScreen;
