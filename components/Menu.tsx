

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { MenuItem } from '../types';
import MenuItemCard from './MenuItemCard';
import { ShuffleIcon, ChevronDownIcon } from './icons';

// 定義 Menu 組件的 props 類型
interface MenuProps {
  menu: MenuItem[]; // 餐廳菜單
  onAddToCart: (item: MenuItem) => void; // 添加到購物車的回調函數
}

// 菜單組件
const Menu: React.FC<MenuProps> = ({ menu, onAddToCart }) => {
  // 推薦相關的狀態
  const [suggestion, setSuggestion] = useState<{ mainCourse: string; drink: string; } | null>(null);
  // 新增狀態來管理可收合分類的開合狀態
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  // 創建一個 ref 來存儲每個菜單項目的 DOM 元素引用
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 尋找菜單項目 by name
  const findItemByName = (name: string) => menu.find(item => item.name === name);

  // 切換分類的收合狀態
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // 處理點擊推薦按鈕的事件
  const handleGetSuggestion = () => {
    // 定義哪些分類屬於主食
    const mainCourseCategories = ['主食', '麵(含冬粉)', '飯', '鍋燒', '粥', '藥膳', '乾麵', '湯麵'];
    
    // 篩選出主食和飲料
    const mainCourses = menu.filter(item => mainCourseCategories.includes(item.category));
    const drinks = menu.filter(item => item.category === '飲料');

    // 隨機選取
    const randomMain = mainCourses.length > 0 ? mainCourses[Math.floor(Math.random() * mainCourses.length)] : null;
    const randomDrink = drinks.length > 0 ? drinks[Math.floor(Math.random() * drinks.length)] : null;

    const newSuggestion = {
        mainCourse: randomMain?.name || '',
        drink: randomDrink?.name || '',
    };
    setSuggestion(newSuggestion);

    // 展開推薦項目的分類
    if (randomMain && collapsedCategories[randomMain.category]) {
        toggleCategory(randomMain.category);
    }
    if (randomDrink && collapsedCategories[randomDrink.category]) {
        toggleCategory(randomDrink.category);
    }
  };


  // 使用 useEffect 監聽 suggestion 變化，以觸發滾動
  useEffect(() => {
    if (suggestion?.mainCourse) {
      const mainCourseItem = findItemByName(suggestion.mainCourse);
      if (mainCourseItem) {
        const recommendedItemRef = itemRefs.current[mainCourseItem.id];
        const timer = setTimeout(() => {
          recommendedItemRef?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [suggestion]);


  // 使用 useMemo 來對菜單進行分類，避免每次渲染都重新計算
  const categorizedMenu = useMemo(() => {
    // 將菜單項目按照 category 分組
    return menu.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menu]);

  // 定義分類的理想顯示順序
  const categoryOrder = [
    '主食', '麵(含冬粉)', '飯', '鍋燒', '粥', 
    '點心', '湯', '其他', '飲料'
  ];

  // 過濾出當前菜單實際擁有的分類，並按照預定順序排列
  const availableCategories = useMemo(() => 
    categoryOrder.filter(category => categorizedMenu[category]),
    [categorizedMenu]
  );

  return (
    <div className="w-full">
      {/* 隨機推薦區域 */}
      <div className="bg-stone-50/80 backdrop-blur-sm border border-stone-200 p-4 rounded-lg mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-stone-800">隨機推薦</h3>
          <button
            onClick={handleGetSuggestion}
            className="flex items-center bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
          >
            <ShuffleIcon className="mr-2 h-5 w-5" />
            推薦一組
          </button>
        </div>
        {/* 顯示推薦結果 */}
        {suggestion && (suggestion.mainCourse || suggestion.drink) && (
          <div className="mt-4 p-3 bg-stone-100 rounded-lg border border-stone-200">
            <p className="text-stone-700">
              <strong className="font-semibold">為您推薦：</strong>
              {suggestion.mainCourse && suggestion.drink 
                ? `${suggestion.mainCourse} + ${suggestion.drink}`
                : suggestion.mainCourse || suggestion.drink
              }
            </p>
          </div>
        )}
      </div>

      {/* 菜單列表 */}
      <div className="space-y-8">
        {/* 按照定義的順序遍歷分類 */}
        {availableCategories.map(category => {
          // 將所有非「飲料」分類都設為可收合
          const isCollapsible = category !== '飲料';
          const isCollapsed = collapsedCategories[category];

          return (
            <div key={category}>
              {/* 分類標題，如果是可收合的，則添加點擊事件和無障礙屬性 */}
              <div
                className={`flex justify-between items-center mb-4 pb-2 border-b-2 border-stone-200 ${isCollapsible ? 'cursor-pointer' : ''}`}
                onClick={() => isCollapsible && toggleCategory(category)}
                role={isCollapsible ? 'button' : undefined}
                aria-expanded={isCollapsible ? !isCollapsed : undefined}
                tabIndex={isCollapsible ? 0 : -1}
                onKeyDown={(e) => {
                  if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleCategory(category);
                  }
                }}
              >
                <h3 className="text-2xl font-bold text-stone-700">{category}</h3>
                {isCollapsible && (
                  <ChevronDownIcon 
                    className={`w-6 h-6 text-stone-500 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} 
                  />
                )}
              </div>

              {/* 根據 isCollapsed 狀態決定是否渲染菜品列表 */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-4">
                  {categorizedMenu[category].map(item => (
                    <MenuItemCard
                      ref={el => { itemRefs.current[item.id] = el; }}
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                      isHighlighted={
                        !!suggestion &&
                        (item.name === suggestion.mainCourse || item.name === suggestion.drink)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;