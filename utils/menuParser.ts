import type { Restaurant, MenuItem } from '../types';

// 解析 Markdown 菜單文件的函數
export const parseMenuMarkdown = (markdown: string): Restaurant[] => {
  // 使用正則表達式將文件內容按餐廳分割
  // `^## ` 表示以 `## ` 開頭的行，`m` flag 表示多行模式
  const restaurantBlocks = markdown.trim().split(/^##\s+/m).slice(1);
  const restaurants: Restaurant[] = [];

  restaurantBlocks.forEach((block, index) => {
    try {
      // 提取餐廳名稱
      const nameMatch = block.match(/(.*?)\n/);
      const name = nameMatch ? nameMatch[1].trim() : `未命名餐廳 ${index + 1}`;

      // 提取餐廳屬性 (類型, 菜系, 圖片URL)
      const typeMatch = block.match(/- \*\*類型\*\*:\s*(餐廳|飲料店)/);
      const cuisineMatch = block.match(/- \*\*菜系\*\*:\s*(.*)/);
      const imageMatch = block.match(/- \*\*圖片URL\*\*:\s*(.*)/);
      
      const type = typeMatch ? (typeMatch[1] as '餐廳' | '飲料店') : '餐廳';
      const cuisine = cuisineMatch ? cuisineMatch[1].trim() : '未知菜系';
      const imageUrl = imageMatch ? imageMatch[1].trim() : '';

      const menu: MenuItem[] = [];
      // 提取菜單表格部分 - 使用 `([\s\S]+)` 確保至少有一個字元的內容被捕獲，增強對文件末尾表格的處理能力
      const menuTableMatch = block.match(/### 菜單\s*\|.*?\|\s*\|-.*?-\|\s*([\s\S]+)/);
      
      if (menuTableMatch && menuTableMatch[1]) {
        const tableRows = menuTableMatch[1].trim().split('\n');
        tableRows.forEach((row, rowIndex) => {
          // 解析每一行菜單項目
          const columns = row.split('|').map(col => col.trim()).slice(1, -1);
          if (columns.length === 5) {
            const [itemName, description, priceStr, category, itemImage] = columns;
            const price = parseInt(priceStr, 10);

            // 確保價格是有效的，並且分類不是空的
            if (!isNaN(price) && category.trim()) {
              menu.push({
                id: `${name.replace(/\s/g, '-')}-${rowIndex}`, // 根據餐廳名稱和行索引創建唯一ID
                name: itemName,
                description,
                price,
                category,
                image: itemImage,
              });
            }
          }
        });
      }
      
      restaurants.push({
        id: `rest-${index + 1}`, // 創建唯一的餐廳ID
        name,
        type,
        cuisine,
        image: imageUrl,
        menu,
      });
    } catch (e) {
      console.error("解析餐廳區塊時發生錯誤:", block, e);
    }
  });

  return restaurants;
};

// 從伺服器獲取並解析菜單
export const fetchAndParseMenu = async (): Promise<Restaurant[]> => {
  try {
    // 獲取位於根目錄的 menu.md 文件
    const response = await fetch('/menu.md');
    if (!response.ok) {
      throw new Error(`無法獲取 menu.md: ${response.statusText}`);
    }
    const markdown = await response.text();
    return parseMenuMarkdown(markdown);
  } catch (error) {
    console.error("獲取或解析菜單失敗:", error);
    // 在出錯時返回一個空陣列，避免應用崩潰
    return [];
  }
};
