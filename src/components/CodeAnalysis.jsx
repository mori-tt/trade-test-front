import React, { useState, useEffect } from "react";
import Loading from "./Loading";
import { CodeResults } from "./Results";

function CodeAnalysis() {
  const [activePanel, setActivePanel] = useState("analyze");
  const [loading, setLoading] = useState({
    analyze: false,
    explain: false,
    improve: false,
    compare: false,
  });
  const [results, setResults] = useState({
    analyze: null,
    explain: null,
    improve: null,
    compare: null,
  });

  const handleSubmit = async (e, endpoint, panelName) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    let requestData = {};
    if (panelName === "compare") {
      requestData = {
        code1: formData.get("code1"),
        code2: formData.get("code2"),
        language: formData.get("language"),
      };
    } else {
      requestData = {
        code: formData.get("code"),
        language: formData.get("language"),
      };
      if (panelName === "analyze") {
        requestData.analysis_type = formData.get("analysis_type");
      }
    }

    setLoading((prev) => ({ ...prev, [panelName]: true }));
    setResults((prev) => ({ ...prev, [panelName]: null }));

    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [panelName]: data }));
      } else {
        setResults((prev) => ({
          ...prev,
          [panelName]: { error: data.error || "不明なエラー" },
        }));
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [panelName]: { error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [panelName]: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6">コード分析</h2>

      <div className="flex gap-3 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActivePanel("analyze")}
          className={`px-5 py-2 font-semibold transition-all border-b-3 ${
            activePanel === "analyze"
              ? "text-indigo-600 border-b-indigo-600"
              : "text-gray-600 border-b-transparent hover:text-indigo-600"
          }`}
        >
          分析
        </button>
        <button
          onClick={() => setActivePanel("explain")}
          className={`px-5 py-2 font-semibold transition-all border-b-3 ${
            activePanel === "explain"
              ? "text-indigo-600 border-b-indigo-600"
              : "text-gray-600 border-b-transparent hover:text-indigo-600"
          }`}
        >
          説明
        </button>
        <button
          onClick={() => setActivePanel("improve")}
          className={`px-5 py-2 font-semibold transition-all border-b-3 ${
            activePanel === "improve"
              ? "text-indigo-600 border-b-indigo-600"
              : "text-gray-600 border-b-transparent hover:text-indigo-600"
          }`}
        >
          改善提案
        </button>
        <button
          onClick={() => setActivePanel("compare")}
          className={`px-5 py-2 font-semibold transition-all border-b-3 ${
            activePanel === "compare"
              ? "text-indigo-600 border-b-indigo-600"
              : "text-gray-600 border-b-transparent hover:text-indigo-600"
          }`}
        >
          比較
        </button>
      </div>

      {/* 分析パネル */}
      {activePanel === "analyze" && (
        <div>
          <form
            onSubmit={(e) => handleSubmit(e, "/api/code/analyze", "analyze")}
            className="space-y-4"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                プログラミング言語:
              </label>
              <select
                name="language"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="python" defaultValue>
                  Python
                </option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                分析タイプ:
              </label>
              <select
                name="analysis_type"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="comprehensive" defaultValue>
                  包括的分析
                </option>
                <option value="performance">パフォーマンス</option>
                <option value="security">セキュリティ</option>
                <option value="best_practices">ベストプラクティス</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                コード:
              </label>
              <textarea
                name="code"
                rows="15"
                placeholder="分析するコードを入力してください..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-indigo-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              分析を実行
            </button>
          </form>

          {loading.analyze && <Loading message="AIがコードを分析中..." />}

          {results.analyze && (
            <div className="mt-6">
              {results.analyze.error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                  エラー: {results.analyze.error}
                </div>
              ) : (
                <CodeResults data={results.analyze} />
              )}
            </div>
          )}
        </div>
      )}

      {/* 説明パネル */}
      {activePanel === "explain" && (
        <div>
          <form
            onSubmit={(e) => handleSubmit(e, "/api/code/explain", "explain")}
            className="space-y-4"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                プログラミング言語:
              </label>
              <select
                name="language"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="python" defaultValue>
                  Python
                </option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                コード:
              </label>
              <textarea
                name="code"
                rows="15"
                placeholder="説明するコードを入力してください..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-indigo-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              説明を生成
            </button>
          </form>

          {loading.explain && <Loading message="AIがコードを説明中..." />}

          {results.explain && (
            <div className="mt-6">
              {results.explain.error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                  エラー: {results.explain.error}
                </div>
              ) : (
                <CodeResults data={results.explain} />
              )}
            </div>
          )}
        </div>
      )}

      {/* 改善提案パネル */}
      {activePanel === "improve" && (
        <div>
          <form
            onSubmit={(e) => handleSubmit(e, "/api/code/improve", "improve")}
            className="space-y-4"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                プログラミング言語:
              </label>
              <select
                name="language"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="python" defaultValue>
                  Python
                </option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                コード:
              </label>
              <textarea
                name="code"
                rows="15"
                placeholder="改善するコードを入力してください..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-indigo-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              改善提案を生成
            </button>
          </form>

          {loading.improve && <Loading message="AIが改善提案を生成中..." />}

          {results.improve && (
            <div className="mt-6">
              {results.improve.error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                  エラー: {results.improve.error}
                </div>
              ) : (
                <CodeResults data={results.improve} />
              )}
            </div>
          )}
        </div>
      )}

      {/* 比較パネル */}
      {activePanel === "compare" && (
        <div>
          <form
            onSubmit={(e) => handleSubmit(e, "/api/code/compare", "compare")}
            className="space-y-4"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                プログラミング言語:
              </label>
              <select
                name="language"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="python" defaultValue>
                  Python
                </option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                コード1:
              </label>
              <textarea
                name="code1"
                rows="10"
                placeholder="比較する最初のコードを入力してください..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                コード2:
              </label>
              <textarea
                name="code2"
                rows="10"
                placeholder="比較する2番目のコードを入力してください..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-indigo-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              比較を実行
            </button>
          </form>

          {loading.compare && <Loading message="AIがコードを比較中..." />}

          {results.compare && (
            <div className="mt-6">
              {results.compare.error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                  エラー: {results.compare.error}
                </div>
              ) : (
                <CodeResults data={results.compare} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CodeAnalysis;
