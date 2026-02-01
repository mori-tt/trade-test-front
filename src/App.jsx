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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
      <div className="max-w-6xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
            🤖 金融取引分析 AIエージェント
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            日経平均指数、ドル円、その他の指数・株価の取引戦略分析AIエージェント
          </p>
        </header>

        {/* ナビゲーション */}
        {user && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActivePage("analysis")}
                  className={`px-4 py-2 rounded ${
                    activePage === "analysis"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  取引分析
                </button>
                <button
                  onClick={() => setActivePage("comparison")}
                  className={`px-4 py-2 rounded ${
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
                    className={`px-4 py-2 rounded ${
                      activePage === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    管理画面
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-700">
                  {user.name || user.email} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
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
