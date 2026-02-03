import React from "react";

export function TradingResults({ data }) {
  if (!data) return null;

  if (
    data.comparison &&
    Array.isArray(data.comparison) &&
    data.comparison.length > 0
  ) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gray-50 border-l-4 border-indigo-600 p-3 sm:p-6 rounded-lg overflow-hidden">
          <h3 className="text-lg sm:text-xl font-bold text-indigo-600 mb-3 sm:mb-4">
            戦略比較結果
          </h3>
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full border-collapse min-w-[600px] text-sm sm:text-base">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    戦略名
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    取引数
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    勝率
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    期待値
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    総リターン
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left whitespace-nowrap">
                    シャープ
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((strategy, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      {strategy.strategy_name}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      {strategy.total_trades || 0}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      {strategy.win_rate != null
                        ? strategy.win_rate.toFixed(2)
                        : "N/A"}
                      %
                    </td>
                    <td
                      className={`px-2 py-2 sm:px-4 sm:py-3 font-semibold whitespace-nowrap ${
                        strategy.expected_value != null &&
                        strategy.expected_value >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {strategy.expected_value != null
                        ? `¥${strategy.expected_value.toLocaleString()}`
                        : "N/A"}
                    </td>
                    <td
                      className={`px-2 py-2 sm:px-4 sm:py-3 font-semibold whitespace-nowrap ${
                        strategy.total_return != null &&
                        strategy.total_return >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {strategy.total_return != null
                        ? `${strategy.total_return.toFixed(2)}%`
                        : "N/A"}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                      {strategy.sharpe_ratio != null
                        ? strategy.sharpe_ratio.toFixed(2)
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.best_strategy && (
          <div className="bg-gray-50 border-l-4 border-yellow-500 p-3 sm:p-6 rounded-lg">
            <h3 className="text-lg sm:text-xl font-bold text-indigo-600 mb-3 sm:mb-4">
              🏆 最適な戦略: {data.best_strategy.name}
            </h3>
            <StrategyDetails results={data.best_strategy.results} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-l-4 border-indigo-600 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-indigo-600 mb-4">
        {data.strategy_name}
      </h3>
      <StrategyDetails results={data.results} />
    </div>
  );
}

export function StrategyDetails({ results }) {
  if (!results) return null;

  const formatValue = (value, formatter) => {
    if (
      value == null ||
      (typeof value === "number" && (isNaN(value) || !isFinite(value)))
    ) {
      return "N/A";
    }
    return formatter(value);
  };

  const metrics = [
    {
      label: "総取引数",
      value: `${results.total_trades || 0}回`,
      positive: null,
    },
    {
      label: "勝率",
      value: formatValue(results.win_rate, (v) => `${v.toFixed(2)}%`),
      positive: null,
    },
    {
      label: "最終資金",
      value: formatValue(
        results.final_capital,
        (v) => `¥${v.toLocaleString()}`
      ),
      positive: null,
    },
    {
      label: "総リターン",
      value: formatValue(results.total_return, (v) => `${v.toFixed(2)}%`),
      positive: results.total_return != null && results.total_return >= 0,
    },
    {
      label: "総損益",
      value: formatValue(results.total_pnl, (v) => `¥${v.toLocaleString()}`),
      positive: results.total_pnl != null && results.total_pnl >= 0,
    },
    {
      label: "期待値（1取引あたり）",
      value: formatValue(
        results.expected_value,
        (v) => `¥${v.toLocaleString()}`
      ),
      positive: results.expected_value != null && results.expected_value >= 0,
    },
    {
      label: "期待損益",
      value: formatValue(results.expected_pnl, (v) => `¥${v.toLocaleString()}`),
      positive: results.expected_pnl != null && results.expected_pnl >= 0,
    },
    {
      label: "平均利益",
      value: formatValue(results.average_win, (v) => `¥${v.toLocaleString()}`),
      positive: true,
    },
    {
      label: "平均損失",
      value: formatValue(results.average_loss, (v) => `¥${v.toLocaleString()}`),
      positive: false,
    },
    {
      label: "プロフィットファクター",
      value: formatValue(results.profit_factor, (v) => v.toFixed(2)),
      positive: null,
    },
    {
      label: "最大ドローダウン",
      value: formatValue(results.max_drawdown, (v) => `${v.toFixed(2)}%`),
      positive: false,
    },
    {
      label: "シャープレシオ",
      value: formatValue(results.sharpe_ratio, (v) => v.toFixed(2)),
      positive: null,
    },
  ];

  return (
    <div className="space-y-1 sm:space-y-2">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="flex justify-between py-1.5 sm:py-2 border-b last:border-0 text-sm sm:text-base gap-2"
        >
          <span className="font-semibold text-gray-700 shrink-0">
            {metric.label}
          </span>
          <span
            className={`font-semibold text-right break-all ${
              metric.positive === true
                ? "text-green-600"
                : metric.positive === false
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CodeResults({ data }) {
  if (!data) return null;

  const renderResult = () => {
    if (data.result) {
      const result = data.result;
      return (
        <div className="space-y-4">
          {result.summary && (
            <div>
              <h3 className="text-lg font-bold text-indigo-600 mb-2">
                分析概要
              </h3>
              <p className="text-gray-700">{result.summary}</p>
            </div>
          )}

          {result.quality_score !== undefined && (
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold text-gray-700">品質スコア</span>
              <span className="font-semibold text-gray-900">
                {result.quality_score}/100
              </span>
            </div>
          )}

          {result.strengths && result.strengths.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-indigo-600 mb-2">強み</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {result.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {result.weaknesses && result.weaknesses.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-indigo-600 mb-2">改善点</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {result.weaknesses.map((weakness, idx) => (
                  <li key={idx}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-indigo-600 mb-2">
                推奨事項
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {result.improved_code && (
            <div>
              <h3 className="text-lg font-bold text-indigo-600 mb-2">
                改善されたコード
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {result.improved_code}
              </pre>
            </div>
          )}
        </div>
      );
    }

    if (data.explanation) {
      return (
        <div>
          <h3 className="text-lg font-bold text-indigo-600 mb-2">
            コードの説明
          </h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {data.explanation}
          </pre>
        </div>
      );
    }

    if (data.suggestions) {
      return (
        <div>
          <h3 className="text-lg font-bold text-indigo-600 mb-2">改善提案</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {data.suggestions}
          </pre>
        </div>
      );
    }

    if (data.comparison) {
      return (
        <div>
          <h3 className="text-lg font-bold text-indigo-600 mb-2">比較結果</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {data.comparison}
          </pre>
        </div>
      );
    }

    if (data.raw_response) {
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
          {data.raw_response}
        </pre>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-50 border-l-4 border-indigo-600 p-6 rounded-lg">
      {renderResult()}
    </div>
  );
}
