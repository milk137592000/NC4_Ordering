import React from 'react';

interface ConfirmAdminModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmAdminModal: React.FC<ConfirmAdminModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-admin-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 id="confirm-admin-modal-title" className="text-2xl font-bold text-stone-800 mb-4">
            繼續擔任管理員？
          </h2>
          <p className="text-stone-600 mb-6">
            您確定要重新選擇餐廳嗎？您可以選擇：
          </p>
          
          <div className="space-y-4">
            <button
              onClick={onConfirm}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
            >
              是，我要繼續擔任管理員
            </button>
            
            <button
              onClick={onCancel}
              className="w-full border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              否，讓其他人擔任管理員
            </button>
          </div>
          
          <p className="text-xs text-stone-500 mt-4 text-center">
            注意：如果您選擇繼續擔任管理員，系統將保留您的管理員身份。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAdminModal;