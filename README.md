<div align="center">
<<<<<<< HEAD
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19yMpJ0xpDVTIadMaQ1CGca94ycZqLViN

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

=======
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 丁二烯訂飯飯

這是一個基於 React 和 Firebase 的訂餐應用程式。

## 在本地運行

**先決條件:** Node.js

1. 安裝依賴:
   ```
   npm install
   ```

2. 在 `.env` 文件中設置您的 `GEMINI_API_KEY`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. 運行應用:
   ```
   npm run dev
   ```

## 部署到 Google AI Studio

此應用程式可以部署到 Google AI Studio:

1. 構建生產版本:
   ```
   npm run build
   ```

2. 將 `dist` 目錄中的內容上傳到 Google AI Studio

## 應用功能

- 餐廳選擇
- 菜單瀏覽
- 點餐與購物車管理
- 團隊訂單總結
- 歷史訂單查看
>>>>>>> 7c9b604 (Update README.md with deployment instructions)