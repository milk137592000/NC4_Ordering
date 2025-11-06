import React, { useState } from 'react';
import type { User, Restaurant, Votes, Vote } from '../types';
import ConfirmAdminModal from './ConfirmAdminModal';

interface ProposalVoteScreenProps {
  currentUser: User;
  proposedRestaurant: Restaurant;
  adminName: string;
  users: User[];
  votes: Votes;
  onVote: (vote: 'agree' | 'disagree') => void;
  onCancelProposal: (keepAdmin: boolean) => void;
}

const ProposalVoteScreen: React.FC<ProposalVoteScreenProps> = ({
  currentUser,
  proposedRestaurant,
  adminName,
  users,
  votes,
  onVote,
  onCancelProposal,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const colleagues = users.filter(u => u.role === 'colleague');
  const currentUserVote = votes[currentUser.id];
  const disagreeCount = Object.values(votes).filter((v: Vote) => v.vote === 'disagree').length;
  const agreeCount = Object.values(votes).filter((v: Vote) => v.vote === 'agree').length;
  const waitingCount = colleagues.length - disagreeCount - agreeCount;

  // 檢查是否達到決策條件
  const isAgreed = agreeCount >= 2;
  const isDisagreed = disagreeCount >= 2;

  const handleCancelProposalClick = () => {
    if (currentUser.role === 'admin') {
      setIsConfirmModalOpen(true);
    } else {
      onCancelProposal(false);
    }
  };

  const handleConfirmContinueAdmin = () => {
    setIsConfirmModalOpen(false);
    onCancelProposal(true);
  };

  const handleCancelContinueAdmin = () => {
    setIsConfirmModalOpen(false);
    onCancelProposal(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-stone-200 shadow-lg p-8">
        
        {/* Restaurant Info */}
        <div className="text-center">
          <p className="text-stone-600">管理員 {adminName} 提議訂這家：</p>
          <h2 className="text-3xl font-bold text-stone-800 my-2">{proposedRestaurant.name}</h2>
          <p className="text-lg text-stone-500">{proposedRestaurant.cuisine}</p>
        </div>
        
        {/* 決策結果提示 */}
        {isAgreed && (
          <div className="my-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            <p className="font-bold">提案通過</p>
            <p>已有 {agreeCount} 人同意此提案，無需繼續投票。</p>
          </div>
        )}
        
        {isDisagreed && (
          <div className="my-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-bold">提案被否決</p>
            <p>已有 {disagreeCount} 人反對此提案，請管理員重新選擇餐廳。</p>
          </div>
        )}
        
        <div className="my-8 border-t border-dashed"></div>

        {/* Voting Area for Colleagues */}
        {currentUser.role === 'colleague' && !isAgreed && !isDisagreed && (
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-stone-700 mb-4">您的決定是？</h3>
            {currentUserVote ? (
              <p className="text-lg font-medium p-4 bg-stone-100 rounded-lg">
                您已投票：{currentUserVote.vote === 'agree' ? '好喔' : '不要'}。您現在可以開始點餐了！
              </p>
            ) : (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => onVote('agree')}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  好喔
                </button>
                <button
                  onClick={() => onVote('disagree')}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  不要
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vote Status */}
        <div>
          <h3 className="text-xl font-bold text-stone-700 mb-4 text-center">目前投票狀態</h3>
          <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
            <div className="flex justify-around text-center mb-4 pb-4 border-b">
                <div><p className="text-2xl font-bold text-green-600">{agreeCount}</p><p className="text-sm text-stone-500">參加</p></div>
                <div><p className="text-2xl font-bold text-red-600">{disagreeCount}</p><p className="text-sm text-stone-500">不參加</p></div>
                <div><p className="text-2xl font-bold text-stone-500">{waitingCount}</p><p className="text-sm text-stone-500">等待中</p></div>
            </div>
            <p className="text-center text-sm text-stone-500 mt-4">
              投票為不記名，只會顯示總人數。
            </p>
             {/* Admin instruction */}
             {currentUser.role === 'admin' && (
                <p className="text-xs text-stone-500 mt-4 text-center">
                    如果反對人數超過兩人，提案將自動取消。
                </p>
             )}
          </div>
        </div>

        {/* Admin Actions */}
        {currentUser.role === 'admin' && (
           <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={handleCancelProposalClick}
              className="w-full sm:w-auto border border-stone-400 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-6 rounded-full transition-colors duration-200"
            >
              重選餐廳
            </button>
          </div>
        )}
      </div>
      
      <ConfirmAdminModal 
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirmContinueAdmin}
        onCancel={handleCancelContinueAdmin}
      />
    </div>
  );
};

export default ProposalVoteScreen;
