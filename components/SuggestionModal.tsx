import React, { useState, useMemo } from 'react';
import type { Restaurant, OrderType } from '../types';
import { FoodAndDrinkIcon, DrinkIcon } from './icons';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onSuggest: (restaurant: Restaurant) => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, restaurants, onSuggest }) => {
  const [orderType, setOrderType] = useState<OrderType | null>(null);

  const filteredRestaurants = useMemo(() => {
    if (!orderType) return [];
    return restaurants.filter(r => r.type === orderType);
  }, [orderType, restaurants]);

  if (!isOpen) return null;

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    onSuggest(restaurant);
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const renderTypeButton = (type: OrderType, text: string, Icon: React.ElementType) => {
    const iconClassName = "text-5xl text-stone-500";
    return (
      <button
        onClick={() => setOrderType(type)}
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 border-stone-200 bg-white transition-all duration-300 transform hover:scale-105 hover:bg-stone-50 hover:border-stone-300 hover:shadow-sm"
      >
        <Icon className={iconClassName} />
        <span className="text-stone-700 text-xl font-semibold">{text}</span>
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 id="suggestion-modal-title" className="text-2xl font-bold text-stone-800">提出您的美食建議</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-3xl font-light" aria-label="關閉">&times;</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto text-center">
          {!orderType ? (
            <>
              <h3 className="text-2xl font-bold tracking-wide text-stone-800">想吃哪一類？</h3>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
                {renderTypeButton('餐廳', '選餐廳', FoodAndDrinkIcon)}
                {renderTypeButton('飲料店', '選飲料', DrinkIcon)}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center items-center gap-4 mb-6">
                <button 
                  onClick={() => setOrderType(null)} 
                  className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
                >
                  ← 返回類型
                </button>
                <h3 className="text-2xl font-bold tracking-wide text-stone-800">
                  選擇一間 <span className="text-stone-700 font-semibold">{orderType}</span>
                </h3>
              </div>
              <div className="mt-4 max-w-lg mx-auto flex flex-col gap-3">
                {filteredRestaurants.map(restaurant => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full text-left p-4 bg-white rounded-lg border cursor-pointer transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md hover:border-stone-300 hover:bg-stone-50/80 border-stone-200"
                  >
                    <h4 className="text-lg font-bold text-stone-800">{restaurant.name}</h4>
                    <p className="text-sm text-stone-500">{restaurant.cuisine}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionModal;
