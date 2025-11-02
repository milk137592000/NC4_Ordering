
import React from 'react';
import ReactDOM from 'react-dom/client'; // 引入 React 18 的客戶端渲染庫
import App from './App'; // 引入主應用組件

// 獲取 HTML 中的根元素
const rootElement = document.getElementById('root');
// 如果找不到根元素，拋出錯誤
if (!rootElement) {
  throw new Error("找不到根元素掛載 React 應用");
}

// 使用 createRoot 創建 React 根
const root = ReactDOM.createRoot(rootElement);

// 在嚴格模式下渲染主應用組件
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
