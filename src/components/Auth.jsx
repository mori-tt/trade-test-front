import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config";

function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Google Sign-In APIを読み込む
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleSignIn,
        });
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    setError("");

    try {
      const apiResponse = await fetch(getApiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user, data.access_token);
      } else {
        setError(data.detail || "エラーが発生しました");
      }
    } catch (err) {
      setError("エラーが発生しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // グローバルコールバック関数を設定
  useEffect(() => {
    window.handleGoogleSignIn = handleGoogleSignIn;
    return () => {
      delete window.handleGoogleSignIn;
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        ログイン
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Googleアカウントでログインしてください
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center">
        {loading ? (
          <div className="text-gray-600">処理中...</div>
        ) : (
          <div
            id="g_id_onload"
            data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}
            data-callback="handleGoogleSignIn"
            data-auto_prompt="false"
          ></div>
        )}
        
        <div
          className="g_id_signin"
          data-type="standard"
          data-size="large"
          data-theme="outline"
          data-text="sign_in_with"
          data-shape="rectangular"
          data-logo_alignment="left"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        ></div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
      </p>
    </div>
  );
}

export default Auth;
