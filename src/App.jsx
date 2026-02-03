import React, { useState, useEffect } from "react";
import TradingAnalysis from "./components/TradingAnalysis";
import Auth from "./components/Auth";
import AdminPanel from "./components/AdminPanel";
import SymbolComparison from "./components/SymbolComparison";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activePage, setActivePage] = useState("analysis"); // 'analysis', 'comparison', 'admin'

  useEffect(() => {
    // ローカルストレージからユーザー情報とトークンを読み込む
    const savedToken = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-3 sm:p-5 overflow-x-hidden">
      <div className="max-w-6xl mx-auto min-w-0">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
            🤖 金融取引分析 AIエージェント
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            日経平均指数、ドル円、その他の指数・株価の取引戦略分析AIエージェント
          </p>
        </header>

        {/* ナビゲーション（モバイル対応） */}
        {user && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActivePage("analysis")}
                  className={`min-h-[44px] px-3 py-2.5 sm:px-4 rounded text-sm sm:text-base font-medium ${
                    activePage === "analysis"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  取引分析
                </button>
                <button
                  onClick={() => setActivePage("comparison")}
                  className={`min-h-[44px] px-3 py-2.5 sm:px-4 rounded text-sm sm:text-base font-medium ${
                    activePage === "comparison"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  銘柄毎比較
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => setActivePage("admin")}
                    className={`min-h-[44px] px-3 py-2.5 sm:px-4 rounded text-sm sm:text-base font-medium ${
                      activePage === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    管理画面
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <span className="text-gray-700 text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                  {user.name || user.email} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="min-h-[44px] bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 認証画面 */}
        {!user && <Auth onLogin={handleLogin} />}

        {/* メインコンテンツ */}
        {user && (
          <>
            {activePage === "analysis" && (
              <TradingAnalysis user={user} token={token} />
            )}
            {activePage === "comparison" && (
              <SymbolComparison user={user} token={token} />
            )}
            {activePage === "admin" && <AdminPanel user={user} token={token} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
