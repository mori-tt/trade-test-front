import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config";

function AdminPanel({ user, token }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userStrategies, setUserStrategies] = useState([]);
  const [allStrategies, setAllStrategies] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "strategies"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === "admin") {
      loadUsers();
      loadAllStrategies();
    }
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/admin/users"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("ユーザー読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStrategies = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/admin/users/${userId}/strategies`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUserStrategies(data.strategies);
        setSelectedUserId(userId);
      }
    } catch (error) {
      console.error("戦略読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStrategies = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/admin/strategies"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAllStrategies(data.strategies);
      }
    } catch (error) {
      console.error("戦略読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("このユーザーを削除しますか？関連する戦略も削除されます。")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert("ユーザーを削除しました");
        loadUsers();
        if (selectedUserId === userId) {
          setSelectedUserId(null);
          setUserStrategies([]);
        }
      } else {
        alert("エラー: " + (data.detail || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600">管理者権限が必要です。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">管理画面</h2>

      {/* タブ */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => {
            setActiveTab("users");
            setSelectedUserId(null);
            setUserStrategies([]);
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          ユーザー管理
        </button>
        <button
          onClick={() => {
            setActiveTab("strategies");
            loadAllStrategies();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === "strategies"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          全戦略一覧
        </button>
      </div>

      {loading && <p className="text-gray-600">読み込み中...</p>}

      {/* ユーザー管理タブ */}
      {activeTab === "users" && (
        <div>
          <h3 className="text-xl font-semibold mb-4">ユーザー一覧</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadUserStrategies(u.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        戦略を見る
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 選択されたユーザーの戦略 */}
          {selectedUserId && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                ユーザーの戦略（{users.find((u) => u.id === selectedUserId)?.email}）
              </h3>
              {userStrategies.length === 0 ? (
                <p className="text-gray-600">戦略がありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          戦略名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          銘柄
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          期間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作成日時
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userStrategies.map((s) => (
                        <tr key={s.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.symbol || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.period ? `${s.period}年` : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(s.created_at).toLocaleString("ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 全戦略一覧タブ */}
      {activeTab === "strategies" && (
        <div>
          <h3 className="text-xl font-semibold mb-4">全戦略一覧</h3>
          {allStrategies.length === 0 ? (
            <p className="text-gray-600">戦略がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      戦略名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      銘柄
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日時
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allStrategies.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.user_email || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.symbol || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.period ? `${s.period}年` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(s.created_at).toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
