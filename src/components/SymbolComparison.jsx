import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config";
import Loading from "./Loading";
import { TradingResults } from "./Results";

// AI戦略生成で使用されるシンボル一覧
const AVAILABLE_SYMBOLS = [
  { value: "", label: "日経平均指数 (デフォルト)" },
  { value: "usdjpy", label: "ドル円" },
  { value: "1570", label: "日経平均レバレッジ(1570)" },
  { value: "9984", label: "ソフトバンクG(9984)" },
  { value: "6857", label: "アドバンテスト(6857)" },
  { value: "8035", label: "東京エレクトロン(8035)" },
  { value: "7203", label: "トヨタ(7203)" },
  { value: "8306", label: "三菱UFJ(8306)" },
  { value: "7974", label: "任天堂(7974)" },
  { value: "6758", label: "ソニーG(6758)" },
  { value: "9983", label: "ファーストリテイリング(9983)" },
  { value: "6752", label: "パナソニック(6752)" },
  { value: "4063", label: "信越化学(4063)" },
  { value: "4503", label: "アステラス(4503)" },
  { value: "6098", label: "リクルート(6098)" },
  { value: "7267", label: "ホンダ(7267)" },
  { value: "4502", label: "武田薬品(4502)" },
  { value: "6367", label: "ダイキン(6367)" },
  { value: "6861", label: "キーエンス(6861)" },
];

function SymbolComparison({ user, token }) {
  const [selectedSymbols, setSelectedSymbols] = useState([]); // チェックボックスで選択された銘柄
  const [customSymbols, setCustomSymbols] = useState([""]); // 手動入力の銘柄
  const [existingStrategyIds, setExistingStrategyIds] = useState([]); // 既存戦略ID
  const [savedStrategyIds, setSavedStrategyIds] = useState([]); // 保存された戦略ID
  const [period, setPeriod] = useState(3);
  const [fixedInvestment, setFixedInvestment] = useState("1000000");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [existingStrategies, setExistingStrategies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [comparisonName, setComparisonName] = useState("");
  const [savedComparisons, setSavedComparisons] = useState([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);

  useEffect(() => {
    loadSavedStrategies();
    loadExistingStrategies();
    if (user || localStorage.getItem("access_token")) {
      loadSavedComparisons();
    }
  }, [user, token]);

  const loadSavedStrategies = async () => {
    try {
      const tokenToUse = token || localStorage.getItem("access_token");
      const headers = {};
      if (tokenToUse) {
        headers.Authorization = `Bearer ${tokenToUse}`;
      }

      const response = await fetch(getApiUrl("/api/strategy/list"), {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setSavedStrategies(data.strategies);
      }
    } catch (error) {
      console.error("戦略読み込みエラー:", error);
    }
  };

  const loadExistingStrategies = async () => {
    try {
      const response = await fetch(
        getApiUrl("/api/trading/available-strategies")
      );
      const data = await response.json();
      if (data.success) {
        setExistingStrategies(data.strategies);
      }
    } catch (error) {
      console.error("既存戦略読み込みエラー:", error);
    }
  };

  const loadSavedComparisons = async () => {
    const tokenToUse = token || localStorage.getItem("access_token");
    if (!tokenToUse) return;
    setLoadingComparisons(true);
    try {
      const response = await fetch(getApiUrl("/api/trading/comparisons"), {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.comparisons)) {
        setSavedComparisons(data.comparisons);
      } else {
        setSavedComparisons([]);
      }
    } catch (error) {
      console.error("保存比較一覧読み込みエラー:", error);
      setSavedComparisons([]);
    } finally {
      setLoadingComparisons(false);
    }
  };

  const handleViewSavedComparison = async (comparisonId) => {
    const tokenToUse = token || localStorage.getItem("access_token");
    if (!tokenToUse) return;
    try {
      const response = await fetch(
        getApiUrl(`/api/trading/comparisons/${comparisonId}`),
        { headers: { Authorization: `Bearer ${tokenToUse}` } }
      );
      const data = await response.json();
      if (!data.success || !data.comparison) {
        alert("比較結果の取得に失敗しました");
        return;
      }
      const c = data.comparison;
      const topStrategies = c.top_strategies || [];
      const comparison = topStrategies.map((t) => ({
        strategy_name: t.strategy_name || t.name || "不明な戦略",
        total_trades: t.total_trades ?? t.results?.total_trades ?? 0,
        win_rate: t.win_rate ?? t.results?.win_rate ?? null,
        expected_value: t.expected_value ?? t.results?.expected_value ?? null,
        total_return: t.total_return ?? t.results?.total_return ?? null,
        sharpe_ratio: t.sharpe_ratio ?? t.results?.sharpe_ratio ?? null,
      }));
      setResults({
        success: true,
        best_symbol: c.best_symbol,
        period_years: c.period_years ?? 3,
        comparison,
        best_strategy: null,
      });
    } catch (error) {
      alert("比較結果の取得に失敗しました: " + error.message);
    }
  };

  const handleDeleteSavedComparison = async (comparisonId) => {
    if (!confirm("この比較結果を削除しますか？")) return;
    const tokenToUse = token || localStorage.getItem("access_token");
    if (!tokenToUse) return;
    try {
      const response = await fetch(
        getApiUrl(`/api/trading/comparisons/${comparisonId}`),
        { method: "DELETE", headers: { Authorization: `Bearer ${tokenToUse}` } }
      );
      const data = await response.json();
      if (data.success) {
        loadSavedComparisons();
      } else {
        alert("削除に失敗しました: " + (data.detail || ""));
      }
    } catch (error) {
      alert("削除に失敗しました: " + error.message);
    }
  };

  const handleSymbolToggle = (symbolValue) => {
    if (selectedSymbols.includes(symbolValue)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbolValue));
    } else {
      setSelectedSymbols([...selectedSymbols, symbolValue]);
    }
  };

  const handleExistingStrategyToggle = (strategyId) => {
    if (existingStrategyIds.includes(strategyId)) {
      setExistingStrategyIds(
        existingStrategyIds.filter((id) => id !== strategyId)
      );
    } else {
      setExistingStrategyIds([...existingStrategyIds, strategyId]);
    }
  };

  const handleSavedStrategyToggle = (strategyId) => {
    if (savedStrategyIds.includes(strategyId)) {
      setSavedStrategyIds(savedStrategyIds.filter((id) => id !== strategyId));
    } else {
      setSavedStrategyIds([...savedStrategyIds, strategyId]);
    }
  };

  const handleAddCustomSymbol = () => {
    setCustomSymbols([...customSymbols, ""]);
  };

  const handleRemoveCustomSymbol = (index) => {
    setCustomSymbols(customSymbols.filter((_, i) => i !== index));
  };

  const handleCustomSymbolChange = (index, value) => {
    const newSymbols = [...customSymbols];
    newSymbols[index] = value;
    setCustomSymbols(newSymbols);
  };

  const handleAddSymbolsFromSavedStrategies = () => {
    const strategySymbols = savedStrategies
      .filter((s) => savedStrategyIds.includes(s.id) && s.symbol)
      .map((s) => s.symbol)
      .filter((symbol, index, self) => self.indexOf(symbol) === index); // 重複を削除

    const newSelectedSymbols = [...selectedSymbols];
    strategySymbols.forEach((symbol) => {
      if (!newSelectedSymbols.includes(symbol)) {
        newSelectedSymbols.push(symbol);
      }
    });
    setSelectedSymbols(newSelectedSymbols);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 選択された銘柄とカスタム銘柄を結合
    const validSelectedSymbols = selectedSymbols.filter((s) => s.trim() !== "");
    const validCustomSymbols = customSymbols.filter((s) => s.trim() !== "");
    const allSymbols = [...validSelectedSymbols, ...validCustomSymbols];

    if (allSymbols.length === 0) {
      alert("少なくとも1つの銘柄を選択または入力してください");
      return;
    }

    if (existingStrategyIds.length === 0 && savedStrategyIds.length === 0) {
      alert("少なくとも1つの戦略を選択してください");
      return;
    }

    setLoading(true);
    setResults(null);
    setComparisonName(""); // リセット

    try {
      const tokenToUse = token || localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(tokenToUse && { Authorization: `Bearer ${tokenToUse}` }),
      };

      const requestBody = {
        symbols: allSymbols,
        period: parseInt(period),
        fixed_investment_amount: parseFloat(fixedInvestment) || undefined,
      };

      // 既存戦略と保存戦略の両方を送信
      if (existingStrategyIds.length > 0) {
        requestBody.existing_strategy_ids = existingStrategyIds;
      }
      if (savedStrategyIds.length > 0) {
        requestBody.strategy_ids = savedStrategyIds;
      }

      const response = await fetch(getApiUrl("/api/trading/compare-symbols"), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        alert("エラー: " + (data.detail || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComparison = async () => {
    if (!comparisonName.trim()) {
      alert("比較結果の名前を入力してください");
      return;
    }

    // トークンは props と localStorage の両方から取得（本番で state が遅延する場合に備える）
    const tokenToUse = token || localStorage.getItem("access_token");
    if (!user || !tokenToUse) {
      alert("ログインが必要です");
      return;
    }

    setSaving(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      };

      const requestBody = {
        name: comparisonName.trim(),
        best_symbol: results.best_symbol,
        top_strategies: results.top_strategies || [],
        period_years: results.period_years,
        fixed_investment_amount: parseFloat(fixedInvestment) || undefined,
      };

      const response = await fetch(getApiUrl("/api/trading/save-comparison"), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (data.success) {
        alert("比較結果を保存しました");
        setComparisonName(""); // リセット
        loadSavedComparisons();
      } else if (response.status === 401) {
        // 認証エラー時はトークンを破棄して再ログインを促す
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        alert(
          "ログインの有効期限が切れたか、認証に失敗しました。再度ログインしてください。\n" +
            (data.detail ? `\n詳細: ${data.detail}` : "")
        );
        window.location.reload();
      } else {
        alert("エラー: " + (data.detail || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">銘柄毎比較</h2>
      <p className="text-gray-600 mb-6">複数の戦略を複数の銘柄で比較します</p>

      {/* 保存した銘柄比較一覧（ログイン時のみ） */}
      {user && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            保存した銘柄比較
          </h3>
          {loadingComparisons ? (
            <p className="text-gray-500 text-sm">読み込み中...</p>
          ) : savedComparisons.length === 0 ? (
            <p className="text-gray-500 text-sm">保存した比較はありません</p>
          ) : (
            <ul className="space-y-2">
              {savedComparisons.map((comp) => (
                <li
                  key={comp.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">
                    {comp.name || "（名前なし）"}
                  </span>
                  <span className="text-gray-600 text-sm">
                    最適銘柄: {comp.best_symbol || "—"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {comp.created_at
                      ? new Date(comp.created_at).toLocaleString("ja-JP")
                      : ""}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewSavedComparison(comp.id)}
                      className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      表示
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedComparison(comp.id)}
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      削除
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 戦略選択 */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            比較する戦略（複数選択可能）
          </label>

          {/* 既存戦略 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              既存戦略（取引分析の既存戦略）
            </h3>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {existingStrategies.length === 0 ? (
                <p className="text-gray-500 text-sm">読み込み中...</p>
              ) : (
                existingStrategies.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={existingStrategyIds.includes(s.id)}
                      onChange={() => handleExistingStrategyToggle(s.id)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">{s.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              選択中: {existingStrategyIds.length}個の既存戦略
            </p>
          </div>

          {/* 保存された戦略 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              保存された戦略
            </h3>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {savedStrategies.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  保存された戦略がありません
                </p>
              ) : (
                savedStrategies.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={savedStrategyIds.includes(s.id)}
                      onChange={() => handleSavedStrategyToggle(s.id)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">
                      {s.name} {s.symbol ? `(${s.symbol})` : ""}
                    </span>
                  </label>
                ))
              )}
            </div>
            {savedStrategyIds.length > 0 && (
              <button
                type="button"
                onClick={handleAddSymbolsFromSavedStrategies}
                className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                選択した戦略の銘柄を追加
              </button>
            )}
            <p className="text-sm text-gray-600 mt-1">
              選択中: {savedStrategyIds.length}個の保存戦略
            </p>
          </div>
        </div>

        {/* 銘柄選択 */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            比較する銘柄（複数選択可能）
          </label>

          {/* シンボル一覧から選択 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              AI戦略生成のシンボルから選択
            </h3>
            <div className="max-h-60 overflow-y-auto border rounded p-2 grid grid-cols-2 gap-2">
              {AVAILABLE_SYMBOLS.map((symbol) => (
                <label
                  key={symbol.value}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSymbols.includes(symbol.value)}
                    onChange={() => handleSymbolToggle(symbol.value)}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm">{symbol.label}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              選択中: {selectedSymbols.length}個の銘柄
            </p>
          </div>

          {/* カスタム銘柄入力 */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              カスタム銘柄（手動入力）
            </h3>
            {customSymbols.map((symbol, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) =>
                    handleCustomSymbolChange(index, e.target.value)
                  }
                  placeholder="例: ^GSPC, AAPL, 7203.T"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {customSymbols.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSymbol(index)}
                    className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCustomSymbol}
              className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              カスタム銘柄を追加
            </button>
          </div>
        </div>

        {/* 検証期間 */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            検証期間（年）
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>

        {/* 固定投資額 */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            固定投資額（円）
          </label>
          <input
            type="number"
            value={fixedInvestment}
            onChange={(e) => setFixedInvestment(e.target.value)}
            placeholder="1000000"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
        >
          {loading ? "比較中..." : "比較を実行"}
        </button>
      </form>

      {loading && <Loading />}

      {results && results.success && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">比較結果</h3>

          {/* 全銘柄の結果を表示 */}
          {results.all_results && results.all_results.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4">全銘柄の分析結果</h4>

              {/* 銘柄毎に結果をグループ化 */}
              {(() => {
                // 銘柄でグループ化
                const groupedBySymbol = {};
                results.all_results.forEach((r) => {
                  if (!groupedBySymbol[r.symbol]) {
                    groupedBySymbol[r.symbol] = [];
                  }
                  groupedBySymbol[r.symbol].push(r);
                });

                return Object.entries(groupedBySymbol).map(
                  ([symbol, symbolResults]) => {
                    // 成功した結果のみをフィルタ
                    const successfulResults = symbolResults.filter(
                      (r) => r.success
                    );
                    const errorResults = symbolResults.filter(
                      (r) => !r.success
                    );

                    if (successfulResults.length === 0) {
                      return (
                        <div key={symbol} className="mb-8">
                          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                            <h5 className="text-lg font-semibold mb-2">
                              {symbol}
                            </h5>
                            <p>すべての戦略でエラーが発生しました:</p>
                            <ul className="list-disc list-inside mt-2">
                              {errorResults.map((r, idx) => (
                                <li key={idx}>
                                  {r.strategy_name || "不明な戦略"}: {r.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    }

                    // 比較結果の形式に変換
                    const comparison = successfulResults.map((r) => ({
                      strategy_name: r.strategy_name || "不明な戦略",
                      total_trades: r.results?.total_trades || 0,
                      win_rate: r.results?.win_rate || null,
                      expected_value: r.results?.expected_value || null,
                      total_return: r.results?.total_return || null,
                      sharpe_ratio: r.results?.sharpe_ratio || null,
                    }));

                    return (
                      <div key={symbol} className="mb-8">
                        <h5 className="text-2xl font-bold text-indigo-600 mb-4">
                          {symbol} の戦略比較結果
                        </h5>

                        {/* エラーがある場合は表示 */}
                        {errorResults.length > 0 && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                            <p className="font-semibold text-yellow-800 mb-2">
                              エラーが発生した戦略:
                            </p>
                            <ul className="list-disc list-inside text-yellow-700">
                              {errorResults.map((r, idx) => (
                                <li key={idx}>
                                  {r.strategy_name || "不明な戦略"}: {r.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 比較テーブルのみ表示（最適な戦略の詳細は表示しない） */}
                        <TradingResults
                          data={{
                            success: true,
                            period_years: results.period_years,
                            comparison: comparison,
                            best_strategy: null, // 最適な戦略は表示しない
                          }}
                        />
                      </div>
                    );
                  }
                );
              })()}
            </div>
          )}

          {/* 最適な銘柄と上位2戦略を表示 */}
          {results.best_symbol && (
            <div className="mb-8 border-t-4 border-green-500 pt-8">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                <h4 className="text-2xl font-bold text-green-700 mb-2">
                  最適な銘柄: {results.best_symbol}
                </h4>
                <p className="text-green-700">
                  この銘柄で最も良い2つの戦略を比較します
                </p>
              </div>

              {/* 既存戦略のバックテストと同じUI */}
              <TradingResults
                data={{
                  success: true,
                  period_years: results.period_years,
                  comparison: results.comparison || [],
                  best_strategy: results.best_strategy || null,
                }}
              />

              {/* 保存機能 */}
              {user && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-lg font-semibold mb-2">結果を保存</h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comparisonName}
                      onChange={(e) => setComparisonName(e.target.value)}
                      placeholder="比較結果の名前を入力（例: 2024年1月の比較）"
                      className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    <button
                      onClick={handleSaveComparison}
                      disabled={saving || !comparisonName.trim()}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {results && !results.success && (
        <div className="mt-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
            <h4 className="text-lg font-semibold mb-2">エラー</h4>
            <p>{results.detail || "比較に失敗しました"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SymbolComparison;
