// src/config.js
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const getApiUrl = (endpoint) => {
  // 開発モード（npm run dev）の場合は常にローカルAPIサーバーを使用
  // Vite開発サーバーのプロキシ設定により、相対パスが http://localhost:8000 に転送される
  if (import.meta.env.DEV) {
    console.log(`[config] Development mode - Using local API via proxy, endpoint: ${endpoint}`);
    return endpoint;
  }
  
  // 本番環境（ビルド後）: VITE_API_URLが設定されている場合
  if (API_BASE_URL) {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}${path}`;
    console.log(`[config] Production mode - API URL: ${fullUrl}`);
    return fullUrl;
  }
  
  // VITE_API_URLが設定されていない場合（フォールバック）
  console.log(`[config] No API URL configured - Using relative path: ${endpoint}`);
  return endpoint;
};
