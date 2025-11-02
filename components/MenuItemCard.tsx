import React, { forwardRef } from 'react';
import type { MenuItem } from '../types';
import { PlusIcon } from './icons'; // 引入加號圖標

// 定義 MenuItemCard 組件的 props 類型
interface MenuItemCardProps {
  item: MenuItem; // 菜單項目數據
  onAddToCart: (item: MenuItem) => void; // 添加到購物車的回調函數
  isHighlighted: boolean; // 是否被 AI 推薦高亮
}

// 使用 forwardRef 包裹組件，使其可以接收 ref
const MenuItemCard = forwardRef<HTMLDivElement, MenuItemCardProps>(
  ({ item, onAddToCart, isHighlighted }, ref) => {
    return (
      // 將傳入的 ref 附加到卡片的根 div 元素上
      <div
        ref={ref}
        className={`
          flex items-center bg-white p-4 rounded-lg border border-transparent transition-all duration-300
          ${isHighlighted ? 'ring-2 ring-stone-400 bg-stone-50 shadow-md' : 'shadow-sm hover:shadow-md hover:bg-stone-50/50'}
        `}
      >
        {/* 菜單項目資訊，flex-1 使其佔用盡可能多的空間 */}
        <div className="flex-1">
          <h4 className="text-lg font-bold text-stone-800">{item.name}</h4>
          <p className="text-sm text-stone-500 mb-2">{item.description}</p>
          <p className="text-lg font-semibold text-stone-700">${item.price}</p>
        </div>

        {/* 添加到購物車按鈕，ml-4 提供左邊距 */}
        <button
          onClick={() => onAddToCart(item)}
          className="bg-stone-800 text-white rounded-full p-3 hover:bg-stone-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 ml-4 flex-shrink-0"
          aria-label={`將 ${item.name} 加入購物車`}
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }
);

export default MenuItemCard;