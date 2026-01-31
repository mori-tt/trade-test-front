import React, { useState } from "react";
import { getApiUrl } from "../config";

function SavedStrategies({ onLoadStrategy, onShowCode }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/strategy/list"));
      const data = await response.json();
      if (data.success) {
        setStrategies(data.strategies);
      } else {
        alert("戦略の読み込みに失敗しました");
      }
    } catch (error) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStrategy = async (strategyId) => {
    if (!confirm("この戦略を削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/strategy/${strategyId}`), {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        alert("戦略を削除しました");
        loadStrategies();
      } else {
        alert("エラー: " + (data.error || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-xl mb-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">
        💾 保存された戦略
      </h2>
      <button
        onClick={loadStrategies}
        disabled={loading}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {loading ? "読み込み中..." : "保存された戦略を読み込む"}
      </button>

      {strategies.length > 0 && (
        <div className="mt-4 space-y-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h4 className="font-bold text-lg mb-2">{strategy.name}</h4>
              {strategy.description && (
                <p className="text-gray-600 mb-2">{strategy.description}</p>
              )}
              <p className="text-sm text-gray-500 mb-2">
                シンボル: {strategy.symbol || "^N225"} | 期間:{" "}
                {strategy.period || 3}年
              </p>
              {strategy.results && (
                <p className="text-sm mb-3">
                  勝率: {strategy.results.win_rate?.toFixed(2) || "N/A"}% |
                  期待値: ¥
                  {strategy.results.expected_value?.toLocaleString() || "N/A"}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadStrategy(strategy.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  バックテスト実行
                </button>
                <button
                  onClick={() => onShowCode(strategy.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  コード表示
                </button>
                <button
                  onClick={() => deleteStrategy(strategy.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {strategies.length === 0 && !loading && (
        <p className="mt-4 text-gray-600">保存された戦略がありません。</p>
      )}
    </div>
  );
}

export default SavedStrategies;
