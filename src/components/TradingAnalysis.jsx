import React, { useState, useEffect } from "react";
import SavedStrategies from "./SavedStrategies";
import Loading from "./Loading";
import { TradingResults, StrategyDetails } from "./Results";

import { getApiUrl } from "../config";

function TradingAnalysis() {
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResults, setNlResults] = useState(null);
  const [currentStrategyData, setCurrentStrategyData] = useState(null);
  const [nlSymbolType, setNlSymbolType] = useState("");
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationData, setClarificationData] = useState(null);
  const [clarifiedDescription, setClarifiedDescription] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeConfirmationPending, setCodeConfirmationPending] = useState(false);
  const [qaHistory, setQaHistory] = useState([]); // Q&Aの履歴を保持

  // 既存戦略のバックテスト用のstate
  const [tradingLoading, setTradingLoading] = useState(false);
  const [tradingResults, setTradingResults] = useState(null);
  const [tradingSymbolType, setTradingSymbolType] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [selectedSavedStrategies, setSelectedSavedStrategies] = useState([]);
  
  // タブの状態管理
  const [activeTab, setActiveTab] = useState("ai"); // "ai" または "existing"

  const handleLoadStrategy = async (strategyId) => {
    setNlLoading(true);
    setNlResults(null);
    try {
      const response = await fetch(getApiUrl("/api/strategy/load-and-test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_id: strategyId }),
      });
      const data = await response.json();
      if (data.success) {
        setNlResults({
          strategy_name: data.strategy_name,
          results: data.backtest_results,
        });
      } else {
        alert("エラー: " + (data.error || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    } finally {
      setNlLoading(false);
    }
  };

  const handleShowCode = async (strategyId) => {
    try {
      const response = await fetch(getApiUrl(`/api/strategy/${strategyId}`));
      const data = await response.json();
      if (data.success) {
        const strategy = data.strategy;
        setNlResults({
          strategy_name: strategy.name,
          generated_code: strategy.code,
          description: strategy.description,
        });
      } else {
        alert("エラー: " + (data.error || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    }
  };

  const handleNLStrategySubmit = async (e) => {
    e.preventDefault();
    console.log("フォーム送信開始");
    
    const formData = new FormData(e.target);
    const symbolSelect = formData.get("symbol");
    let symbol =
      symbolSelect === "custom"
        ? formData.get("custom_symbol")?.trim()
        : symbolSelect || null;

    const fixedInvestment =
      formData.get("fixed_investment")?.trim() || "1000000";
    const periodValue = formData.get("period");
    const period = periodValue ? parseInt(periodValue) : 3;
    
    console.log("取得した値:", {
      symbol,
      fixedInvestment,
      period,
      periodValue
    });
    
    if (isNaN(period) || period < 1 || period > 10) {
      alert("検証期間を正しく選択してください（1-10年）");
      return;
    }

    // 個別入力項目から自然言語記述を生成
    const buyCondition = formData.get("buy_condition")?.trim() || "";
    const buyOrderType = formData.get("buy_order_type") || "";
    const buyPrice = formData.get("buy_price") || "";
    const buyExecutionDay = formData.get("buy_execution_day") || "";
    const buyLimitCondition = formData.get("buy_limit_condition")?.trim() || "";
    const buyLimitNotFilledAction =
      formData.get("buy_limit_not_filled_action") || "";
    const buyLimitNotFilledPrice =
      formData.get("buy_limit_not_filled_price") || "";
    const buyLimitNotFilledDay = formData.get("buy_limit_not_filled_day") || "";

    const sellCondition = formData.get("sell_condition")?.trim() || "";
    const sellOrderType = formData.get("sell_order_type") || "";
    const sellPrice = formData.get("sell_price") || "";
    const sellExecutionDay = formData.get("sell_execution_day") || "";
    const sellLimitCondition =
      formData.get("sell_limit_condition")?.trim() || "";
    const sellLimitNotFilledAction =
      formData.get("sell_limit_not_filled_action") || "";
    const sellLimitNotFilledPrice =
      formData.get("sell_limit_not_filled_price") || "";
    const sellLimitNotFilledDay =
      formData.get("sell_limit_not_filled_day") || "";

    // 自然言語記述を組み立て
    // 買い条件が空でも、成行価格と実行日があれば「毎日（または指定日）に成行買い」として解釈可能
    let description = "";
    let buyDescription = "";
    let sellDescription = "";

    // 買いの記述を組み立て
    // 注文タイプが指定されていない場合でも、成行価格や実行日が指定されていれば成行とみなす
    const effectiveBuyOrderType =
      buyOrderType || (buyPrice ? "成行" : buyLimitCondition ? "指値" : "");

    if (
      buyCondition ||
      effectiveBuyOrderType ||
      buyPrice ||
      buyExecutionDay ||
      buyLimitCondition ||
      buyLimitNotFilledAction
    ) {
      if (
        effectiveBuyOrderType === "成行" ||
        (!effectiveBuyOrderType && buyPrice)
      ) {
        // 成行の場合（注文タイプが指定されていないが、成行価格が指定されている場合も含む）
        if (!buyPrice) {
          alert("買いの成行のタイミングを選択してください");
          return;
        }
        if (buyCondition) {
          buyDescription = `${buyCondition}で${buyPrice}で成行買い`;
          if (buyExecutionDay && buyExecutionDay !== "当日") {
            buyDescription += `（${buyExecutionDay}）`;
          }
        } else {
          // 条件が空でも、成行価格と実行日があれば「毎日（または指定日）に成行買い」として解釈
          if (buyExecutionDay && buyExecutionDay !== "当日") {
            buyDescription = `${buyExecutionDay}に${buyPrice}で成行買い`;
          } else {
            buyDescription = `毎日${buyPrice}で成行買い`;
          }
        }
      } else if (
        effectiveBuyOrderType === "指値" ||
        (!effectiveBuyOrderType && buyLimitCondition)
      ) {
        // 指値の場合（注文タイプが指定されていないが、指値条件が指定されている場合も含む）
        if (!buyLimitCondition) {
          alert("買いの指値条件を入力してください");
          return;
        }
        if (buyCondition) {
          buyDescription = `${buyCondition}で${buyLimitCondition}の指値で買い`;
        } else {
          buyDescription = `${buyLimitCondition}の指値で買い`;
        }
        if (buyExecutionDay && buyExecutionDay !== "当日") {
          buyDescription += `（${buyExecutionDay}）`;
        }
        // 指値が成立しない場合の処理
        if (buyLimitNotFilledAction === "成行") {
          if (!buyLimitNotFilledPrice) {
            alert("買いの指値が成立しない場合の成行のタイミングを選択してください");
            return;
          }
          if (!buyLimitNotFilledDay) {
            alert("買いの指値が成立しない場合の実行日を選択してください");
            return;
          }
          if (buyLimitNotFilledDay === "当日") {
            buyDescription += `、成立しない場合は当日${buyLimitNotFilledPrice}で成行買い`;
          } else {
            buyDescription += `、成立しない場合は${buyLimitNotFilledDay}に${buyLimitNotFilledPrice}で成行買い`;
          }
        } else if (buyLimitNotFilledAction === "キャンセル") {
          buyDescription += `、成立しない場合は注文をキャンセル`;
        }
      } else if (buyCondition) {
        // 注文タイプも価格も指定されていないが、条件がある場合
        // デフォルトで成行とみなす（価格が指定されていればそれを使用、なければ終値）
        const price = buyPrice || "終値";
        buyDescription = `${buyCondition}で${price}で成行買い`;
        if (buyExecutionDay && buyExecutionDay !== "当日") {
          buyDescription += `（${buyExecutionDay}）`;
        }
      } else if (buyLimitNotFilledAction && !buyLimitCondition) {
        // 指値が成立しない場合の処理だけが選択されているが、指値条件が選択されていない場合
        alert("指値が成立しない場合の処理を指定するには、まず指値注文を選択し、指値条件を入力してください。");
        return;
      }
    }

    // 売りの記述を組み立て
    // 注文タイプが指定されていない場合でも、成行価格や実行日が指定されていれば成行とみなす
    const effectiveSellOrderType =
      sellOrderType || (sellPrice ? "成行" : sellLimitCondition ? "指値" : "");

    if (
      sellCondition ||
      effectiveSellOrderType ||
      sellPrice ||
      sellExecutionDay ||
      sellLimitCondition ||
      sellLimitNotFilledAction
    ) {
      if (
        effectiveSellOrderType === "成行" ||
        (!effectiveSellOrderType && sellPrice)
      ) {
        // 成行の場合（注文タイプが指定されていないが、成行価格が指定されている場合も含む）
        if (!sellPrice) {
          alert("売りの成行のタイミングを選択してください");
          return;
        }
        if (sellCondition) {
          sellDescription = `${sellCondition}で${sellPrice}で成行売り`;
          if (sellExecutionDay && sellExecutionDay !== "当日") {
            sellDescription += `（${sellExecutionDay}）`;
          }
        } else {
          // 条件が空でも、成行価格と実行日があれば「毎日（または指定日）に成行売り」として解釈
          if (sellExecutionDay && sellExecutionDay !== "当日") {
            sellDescription = `${sellExecutionDay}に${sellPrice}で成行売り`;
          } else {
            sellDescription = `毎日${sellPrice}で成行売り`;
          }
        }
      } else if (
        effectiveSellOrderType === "指値" ||
        (!effectiveSellOrderType && sellLimitCondition)
      ) {
        // 指値の場合（注文タイプが指定されていないが、指値条件が指定されている場合も含む）
        if (!sellLimitCondition) {
          alert("売りの指値条件を入力してください");
          return;
        }
        if (sellCondition) {
          sellDescription = `${sellCondition}で${sellLimitCondition}の指値で売り`;
        } else {
          sellDescription = `${sellLimitCondition}の指値で売り`;
        }
        if (sellExecutionDay && sellExecutionDay !== "当日") {
          sellDescription += `（${sellExecutionDay}）`;
        }
        // 指値が成立しない場合の処理
        if (sellLimitNotFilledAction === "成行") {
          if (!sellLimitNotFilledPrice) {
            alert("売りの指値が成立しない場合の成行のタイミングを選択してください");
            return;
          }
          if (!sellLimitNotFilledDay) {
            alert("売りの指値が成立しない場合の実行日を選択してください");
            return;
          }
          if (sellLimitNotFilledDay === "当日") {
            sellDescription += `、成立しない場合は当日${sellLimitNotFilledPrice}で成行売り`;
          } else {
            sellDescription += `、成立しない場合は${sellLimitNotFilledDay}に${sellLimitNotFilledPrice}で成行売り`;
          }
        } else if (sellLimitNotFilledAction === "キャンセル") {
          sellDescription += `、成立しない場合は注文をキャンセル`;
        }
      } else if (sellCondition) {
        // 注文タイプも価格も指定されていないが、条件がある場合
        // デフォルトで成行とみなす（価格が指定されていればそれを使用、なければ終値）
        const price = sellPrice || "終値";
        sellDescription = `${sellCondition}で${price}で成行売り`;
        if (sellExecutionDay && sellExecutionDay !== "当日") {
          sellDescription += `（${sellExecutionDay}）`;
        }
      } else if (sellLimitNotFilledAction && !sellLimitCondition) {
        // 指値が成立しない場合の処理だけが選択されているが、指値条件が選択されていない場合
        alert("指値が成立しない場合の処理を指定するには、まず指値注文を選択し、指値条件を入力してください。");
        return;
      }
    }

    // 買いと売りの記述を結合
    if (buyDescription && sellDescription) {
      description = `${buyDescription}、${sellDescription}`;
    } else if (buyDescription) {
      description = buyDescription;
    } else if (sellDescription) {
      description = sellDescription;
    }

    // 記述が空の場合はエラー
    if (!description) {
      console.log("記述が空です。買い記述:", buyDescription, "売り記述:", sellDescription);
      console.log("入力値:", {
        buyCondition,
        buyOrderType,
        buyPrice,
        buyExecutionDay,
        buyLimitCondition,
        buyLimitNotFilledAction,
        sellCondition,
        sellOrderType,
        sellPrice,
        sellExecutionDay,
        sellLimitCondition,
        sellLimitNotFilledAction
      });
      alert("買いまたは売りのタイミングを指定してください。\n注文タイプ、成行のタイミング、実行日などを指定してください。");
      return;
    }
    
    // デバッグ用（開発時のみ）
    console.log("生成された記述:", description);
    console.log("買い記述:", buyDescription);
    console.log("売り記述:", sellDescription);
    console.log("APIリクエストを送信します...");

    const requestData = {
      description: clarifiedDescription || description,
      period: period,
      symbol: symbol || null,
      fixed_investment_amount: fixedInvestment
        ? parseFloat(fixedInvestment)
        : null,
      clarified_description: clarifiedDescription || null,
      qa_history: qaHistory.length > 0 ? qaHistory : null, // Q&A履歴を送信
      run_backtest: false, // 最初はコード生成のみ
    };

    setNlLoading(true);
    setNlResults(null);
    setCodeConfirmationPending(false);

    try {
      const response = await fetch(getApiUrl("/api/strategy/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();

      if (data.needs_clarification) {
        // タイミングが不明確な場合、または推測内容の確認が必要な場合
        setNeedsClarification(true);

        // Q&A履歴に追加（質問のみ、回答はまだ）
        const newQa = {
          question: data.timing_confirmation,
          answer: null, // 回答はまだ
          has_inference: data.has_inference || false,
        };
        setQaHistory([...qaHistory, newQa]);

        setClarificationData({
          timing_confirmation: data.timing_confirmation,
          original_description: data.description,
          has_inference: data.has_inference || false,
        });
        setNlResults(null);
      } else       if (data.success) {
        if (data.code_only) {
          // コード生成のみの場合 - ユーザーに確認を求める
          setGeneratedCode({
            code: data.generated_code,
            strategy_name: data.strategy_name || "生成された戦略",
            description: data.description,
            symbol: data.symbol,
            period: data.period,
            timing_confirmation: data.timing_confirmation,
            requestData: requestData,
          });
          setCodeConfirmationPending(true);
          setNlResults(null);
          // Q&A履歴をリセット（成功した場合）
          setQaHistory([]);
        } else {
          // バックテスト結果も含まれている場合
          setNlResults(data);
          setCurrentStrategyData(data);
          // 戦略名のデフォルト値を設定
          setTimeout(() => {
            const nameInput = document.getElementById("save-strategy-name");
            if (nameInput && data.strategy_name) {
              nameInput.value = data.strategy_name;
            }
          }, 100);
          // Q&A履歴をリセット（成功した場合）
          setQaHistory([]);
        }
      } else {
        setNlResults({
          error: data.error || "不明なエラー",
          generated_code: data.generated_code,
        });
      }
    } catch (error) {
      setNlResults({ error: error.message });
    } finally {
      setNlLoading(false);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarifiedDescription.trim()) {
      alert("明確化された記述を入力してください");
      return;
    }

    // Q&A履歴の最後のエントリを更新（回答を追加）
    if (qaHistory.length > 0) {
      const updatedHistory = [...qaHistory];
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        answer: clarifiedDescription,
      };
      setQaHistory(updatedHistory);
    }

    // フォームを再送信
    const form = document.querySelector("form");
    if (form) {
      const event = new Event("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  };

  const handleCodeConfirmation = async (confirmed) => {
    if (!confirmed) {
      // キャンセル
      setCodeConfirmationPending(false);
      setGeneratedCode(null);
      return;
    }

    // バックテストを実行
    setNlLoading(true);
    setCodeConfirmationPending(false);

    try {
      const response = await fetch(getApiUrl("/api/strategy/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...generatedCode.requestData,
          run_backtest: true, // バックテスト実行フラグ
        }),
      });
      const data = await response.json();

      if (data.success) {
        setNlResults(data);
        setCurrentStrategyData(data);
        setGeneratedCode(null);
        // 戦略名のデフォルト値を設定
        setTimeout(() => {
          const nameInput = document.getElementById("save-strategy-name");
          if (nameInput && data.strategy_name) {
            nameInput.value = data.strategy_name;
          }
        }, 100);
      } else {
        setNlResults({
          error: data.error || "不明なエラー",
          generated_code: data.generated_code,
        });
      }
    } catch (error) {
      setNlResults({ error: error.message });
    } finally {
      setNlLoading(false);
    }
  };

  const handleSaveStrategy = async () => {
    const nameInput = document.getElementById("save-strategy-name");
    const name = nameInput?.value.trim();

    if (!name) {
      alert("戦略名を入力してください");
      return;
    }

    if (!currentStrategyData) {
      alert("保存する戦略データが見つかりません");
      return;
    }

    try {
      // フォームから現在選択されているシンボルを取得
      const symbolSelect = document.querySelector('select[name="symbol"]');
      let symbol = currentStrategyData.symbol || null;
      if (symbolSelect) {
        const selectedSymbol = symbolSelect.value;
        if (selectedSymbol === "custom") {
          const customSymbol = document.querySelector('input[name="custom_symbol"]')?.value?.trim();
          symbol = customSymbol || null;
        } else if (selectedSymbol) {
          symbol = selectedSymbol;
        }
      }

      const response = await fetch(getApiUrl("/api/strategy/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          code: currentStrategyData.generated_code,
          description: currentStrategyData.description,
          symbol: symbol,
          period: currentStrategyData.period || null,
          results: currentStrategyData.backtest_results || null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert("戦略を保存しました！");
        if (nameInput) nameInput.value = "";
      } else {
        alert("エラー: " + (result.error || "不明なエラー"));
      }
    } catch (error) {
      alert("エラー: " + error.message);
    }
  };

  // 成行/指値の切り替え処理
  useEffect(() => {
    const buyOrderType = document.getElementById("buy_order_type");
    const sellOrderType = document.getElementById("sell_order_type");
    const buyMarketOrder = document.getElementById("buy_market_order");
    const buyLimitOrder = document.getElementById("buy_limit_order");
    const sellMarketOrder = document.getElementById("sell_market_order");
    const sellLimitOrder = document.getElementById("sell_limit_order");
    const buyLimitNotFilledAction = document.getElementById(
      "buy_limit_not_filled_action"
    );
    const sellLimitNotFilledAction = document.getElementById(
      "sell_limit_not_filled_action"
    );
    const buyLimitNotFilledMarket = document.getElementById(
      "buy_limit_not_filled_market"
    );
    const sellLimitNotFilledMarket = document.getElementById(
      "sell_limit_not_filled_market"
    );

    const handleBuyOrderTypeChange = () => {
      if (buyOrderType.value === "成行") {
        buyMarketOrder?.classList.remove("hidden");
        buyLimitOrder?.classList.add("hidden");
      } else {
        buyMarketOrder?.classList.add("hidden");
        buyLimitOrder?.classList.remove("hidden");
      }
    };

    const handleSellOrderTypeChange = () => {
      if (sellOrderType.value === "成行") {
        sellMarketOrder?.classList.remove("hidden");
        sellLimitOrder?.classList.add("hidden");
      } else {
        sellMarketOrder?.classList.add("hidden");
        sellLimitOrder?.classList.remove("hidden");
      }
    };

    const handleBuyLimitNotFilledActionChange = () => {
      const buyLimitNotFilledPrice = document.querySelector('select[name="buy_limit_not_filled_price"]');
      const buyLimitNotFilledDay = document.querySelector('select[name="buy_limit_not_filled_day"]');
      
      if (buyLimitNotFilledAction.value === "成行") {
        buyLimitNotFilledMarket?.classList.remove("hidden");
        // 表示する際にrequired属性を追加
        if (buyLimitNotFilledPrice) buyLimitNotFilledPrice.setAttribute("required", "required");
        if (buyLimitNotFilledDay) buyLimitNotFilledDay.setAttribute("required", "required");
      } else {
        buyLimitNotFilledMarket?.classList.add("hidden");
        // 非表示にする際にrequired属性を削除
        if (buyLimitNotFilledPrice) buyLimitNotFilledPrice.removeAttribute("required");
        if (buyLimitNotFilledDay) buyLimitNotFilledDay.removeAttribute("required");
      }
    };

    const handleSellLimitNotFilledActionChange = () => {
      const sellLimitNotFilledPrice = document.querySelector('select[name="sell_limit_not_filled_price"]');
      const sellLimitNotFilledDay = document.querySelector('select[name="sell_limit_not_filled_day"]');
      
      if (sellLimitNotFilledAction.value === "成行") {
        sellLimitNotFilledMarket?.classList.remove("hidden");
        // 表示する際にrequired属性を追加
        if (sellLimitNotFilledPrice) sellLimitNotFilledPrice.setAttribute("required", "required");
        if (sellLimitNotFilledDay) sellLimitNotFilledDay.setAttribute("required", "required");
      } else {
        sellLimitNotFilledMarket?.classList.add("hidden");
        // 非表示にする際にrequired属性を削除
        if (sellLimitNotFilledPrice) sellLimitNotFilledPrice.removeAttribute("required");
        if (sellLimitNotFilledDay) sellLimitNotFilledDay.removeAttribute("required");
      }
    };

    buyOrderType?.addEventListener("change", handleBuyOrderTypeChange);
    sellOrderType?.addEventListener("change", handleSellOrderTypeChange);
    buyLimitNotFilledAction?.addEventListener(
      "change",
      handleBuyLimitNotFilledActionChange
    );
    sellLimitNotFilledAction?.addEventListener(
      "change",
      handleSellLimitNotFilledActionChange
    );

    // 初期状態を設定
    handleBuyOrderTypeChange();
    handleSellOrderTypeChange();
    handleBuyLimitNotFilledActionChange();
    handleSellLimitNotFilledActionChange();

    return () => {
      buyOrderType?.removeEventListener("change", handleBuyOrderTypeChange);
      sellOrderType?.removeEventListener("change", handleSellOrderTypeChange);
      buyLimitNotFilledAction?.removeEventListener(
        "change",
        handleBuyLimitNotFilledActionChange
      );
      sellLimitNotFilledAction?.removeEventListener(
        "change",
        handleSellLimitNotFilledActionChange
      );
    };
  }, []);

  // 保存された戦略を取得
  useEffect(() => {
    const loadSavedStrategies = async () => {
      try {
        const response = await fetch(getApiUrl("/api/strategy/list"));
        const data = await response.json();
        if (data.success) {
          setSavedStrategies(data.strategies || []);
        }
      } catch (error) {
        console.error("保存された戦略の取得に失敗しました:", error);
      }
    };
    loadSavedStrategies();
  }, []);

  const handleTradingSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const symbolSelect = formData.get("trading_symbol");
    let symbol =
      symbolSelect === "custom"
        ? formData.get("trading_custom_symbol")?.trim()
        : symbolSelect || null;

    const fixedInvestment =
      formData.get("trading_fixed_investment")?.trim() || "1000000";
    const period = parseInt(formData.get("trading_period"));

    if (
      selectedStrategies.length === 0 &&
      selectedSavedStrategies.length === 0
    ) {
      alert("少なくとも1つの戦略を選択してください");
      return;
    }

    setTradingLoading(true);
    setTradingResults(null);

    try {
      const results = [];
      const errors = [];

      // 既存戦略のバックテスト
      if (selectedStrategies.length > 0) {
        const requestData = {
          period: period,
          strategies: selectedStrategies,
          symbol: symbol || null,
          fixed_investment_amount: fixedInvestment
            ? parseFloat(fixedInvestment)
            : null,
        };

        try {
          const response = await fetch(getApiUrl("/api/trading/analyze"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
          });
          const data = await response.json();
          if (data.success) {
            results.push(data);
          } else {
            errors.push(`既存戦略のエラー: ${data.detail || "不明なエラー"}`);
          }
        } catch (error) {
          errors.push(`既存戦略のエラー: ${error.message}`);
        }
      }

      // 保存された戦略のバックテスト
      for (const strategyId of selectedSavedStrategies) {
        try {
          const response = await fetch(
            getApiUrl("/api/strategy/load-and-test"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                strategy_id: strategyId,
                symbol: symbol || null,
                period: period,
                fixed_investment_amount: fixedInvestment
                  ? parseFloat(fixedInvestment)
                  : null,
              }),
            }
          );
          const data = await response.json();
          if (data.success) {
            // 保存された戦略の結果を既存戦略と同じ形式に変換
            results.push({
              success: true,
              period_years: period,
              strategy_name: data.strategy_name,
              results: data.backtest_results,
            });
          } else {
            const strategy = savedStrategies.find((s) => s.id === strategyId);
            errors.push(
              `保存戦略「${strategy?.name || strategyId}」のエラー: ${
                data.detail || "不明なエラー"
              }`
            );
          }
        } catch (error) {
          const strategy = savedStrategies.find((s) => s.id === strategyId);
          errors.push(
            `保存戦略「${strategy?.name || strategyId}」のエラー: ${
              error.message
            }`
          );
        }
      }

      // 結果を統合
      if (errors.length > 0 && results.length === 0) {
        setTradingResults({ error: errors.join("\n") });
      } else if (results.length === 1) {
        // 単一戦略の場合はそのまま表示
        setTradingResults(results[0]);
      } else if (results.length > 1) {
        // 複数戦略の場合は比較結果として表示
        // 既存戦略の比較結果と保存戦略の結果を統合
        const comparison = [];
        const bestResults = [];

        results.forEach((result) => {
          if (result.comparison) {
            // 既存戦略の比較結果
            comparison.push(...result.comparison);
            if (result.best_strategy) {
              bestResults.push({
                name: result.best_strategy.name,
                results: result.best_strategy.results,
              });
            }
          } else {
            // 保存戦略の結果
            comparison.push({
              strategy_name: result.strategy_name,
              total_trades: result.results?.total_trades || 0,
              win_rate: result.results?.win_rate || null,
              expected_value: result.results?.expected_value || null,
              total_return: result.results?.total_return || null,
              sharpe_ratio: result.results?.sharpe_ratio || null,
            });
            bestResults.push({
              name: result.strategy_name,
              results: result.results,
            });
          }
        });

        // 最適な戦略を特定
        const bestStrategy = bestResults.reduce((best, current) => {
          const bestValue = best.results?.expected_value ?? -Infinity;
          const currentValue = current.results?.expected_value ?? -Infinity;
          return currentValue > bestValue ? current : best;
        }, bestResults[0]);

        setTradingResults({
          success: true,
          period_years: period,
          comparison: comparison,
          best_strategy: bestStrategy,
        });
      } else {
        setTradingResults({ error: "結果が取得できませんでした" });
      }
    } catch (error) {
      setTradingResults({ error: error.message });
    } finally {
      setTradingLoading(false);
    }
  };

  const handleStrategyCheckboxChange = (strategyId) => {
    setSelectedStrategies((prev) => {
      if (prev.includes(strategyId)) {
        return prev.filter((id) => id !== strategyId);
      } else {
        return [...prev, strategyId];
      }
    });
  };

  const handleSavedStrategyCheckboxChange = (strategyId) => {
    setSelectedSavedStrategies((prev) => {
      if (prev.includes(strategyId)) {
        return prev.filter((id) => id !== strategyId);
      } else {
        return [...prev, strategyId];
      }
    });
  };

  const strategyDescriptions = {
    ma: "移動平均クロスオーバー: 短期移動平均が長期移動平均を上抜けしたら買い、下抜けしたら売り",
    rsi: "RSI戦略: RSIが売られ過ぎ（30以下）で買い、買われ過ぎ（70以上）で売り",
    bb: "ボリンジャーバンド: 価格が下バンドを下回ったら買い、上バンドを上回ったら売り",
    macd: "MACD戦略: MACDがシグナルラインを上抜けしたら買い、下抜けしたら売り",
    combined: "組み合わせ戦略: 移動平均クロスオーバーとRSIを組み合わせた戦略",
    winhold: "ホールド戦略: 期間の最初に買って、最後までホールド",
    daily:
      "毎営業日始値で買い当日の終値で売: 毎営業日、始値で買い、当日の終値で売る日次完結型",
  };

  return (
    <div className="space-y-6">
      <SavedStrategies
        onLoadStrategy={handleLoadStrategy}
        onShowCode={handleShowCode}
      />

      {/* タブUI */}
      <div className="bg-white rounded-xl p-8 shadow-xl">
        <div className="flex border-b-2 border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "ai"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🤖 AI戦略生成
          </button>
          <button
            onClick={() => setActiveTab("existing")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "existing"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 既存戦略のバックテスト
          </button>
        </div>

        {/* AI戦略生成タブ */}
        {activeTab === "ai" && (
          <div>
            <h2 className="text-2xl font-bold text-indigo-600 mb-6">
              🤖 AI戦略生成（自然言語からコード生成）
            </h2>
        <form onSubmit={handleNLStrategySubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              シンボル:
            </label>
            <select
              name="symbol"
              id="nl-symbol"
              value={nlSymbolType}
              onChange={(e) => setNlSymbolType(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            >
              <option value="">日経平均指数 (デフォルト)</option>
              <option value="usdjpy">ドル円</option>
              <optgroup label="日本株">
                <option value="1570">日経平均レバレッジ(1570)</option>
                <option value="9984">ソフトバンクG(9984)</option>
                <option value="6857">アドバンテスト(6857)</option>
                <option value="8035">東京エレクトロン(8035)</option>
                <option value="7203">トヨタ(7203)</option>
                <option value="8306">三菱UFJ(8306)</option>
                <option value="7974">任天堂(7974)</option>
                <option value="6758">ソニーG(6758)</option>
                <option value="9983">ファーストリテイリング(9983)</option>
                <option value="6752">パナソニック(6752)</option>
                <option value="4063">信越化学(4063)</option>
                <option value="4503">アステラス(4503)</option>
                <option value="6098">リクルート(6098)</option>
                <option value="7267">ホンダ(7267)</option>
                <option value="4502">武田薬品(4502)</option>
                <option value="6367">ダイキン(6367)</option>
                <option value="6861">キーエンス(6861)</option>
              </optgroup>
              <option value="custom">カスタム（コード入力）</option>
            </select>
            {nlSymbolType === "custom" && (
              <input
                type="text"
                name="custom_symbol"
                id="nl-custom-symbol"
                placeholder="例: ^GSPC, AAPL"
                className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-indigo-600"
              />
            )}
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-gray-700 mb-3">
              📈 買いのタイミング
            </h3>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                買い条件:{" "}
                <span className="text-gray-500 text-sm font-normal">
                  （任意）
                </span>
              </label>
              <input
                type="text"
                name="buy_condition"
                placeholder="例: 5日移動平均が20日移動平均を上抜け、RSIが30以下（条件なしの場合は空欄）"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              />
              <small className="text-gray-500 block mt-1">
                例:
                「5日移動平均が20日移動平均を上抜け」「前日比300円以上の下落」「RSIが30以下」（条件なしの場合は空欄で、毎日または指定日に成行買い）
              </small>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                注文タイプ:{" "}
                <span className="text-gray-500 text-sm font-normal">
                  （任意）
                </span>
              </label>
              <select
                name="buy_order_type"
                id="buy_order_type"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="">選択してください</option>
                <option value="成行">成行注文</option>
                <option value="指値">指値注文</option>
              </select>
            </div>

            <div id="buy_market_order" className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  成行のタイミング:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="buy_price"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="終値">終値</option>
                  <option value="始値">始値</option>
                </select>
                <small className="text-gray-500 block mt-1">
                  成行注文は始値または終値で約定します
                </small>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  買い実行日:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="buy_execution_day"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="当日">当日</option>
                  <option value="翌日">翌日</option>
                  <option value="2日後">2日後</option>
                  <option value="3日後">3日後</option>
                </select>
              </div>
            </div>

            <div id="buy_limit_order" className="hidden space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  指値条件:
                </label>
                <input
                  type="text"
                  name="buy_limit_condition"
                  placeholder="例: 10円下、5%下、前日の終値より10円下"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                />
                <small className="text-gray-500 block mt-1">
                  例:
                  「10円下」「5%下」「前日の終値より10円下」「エントリー価格の5%上」
                </small>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  指値実行日:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="buy_execution_day"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="当日">当日</option>
                  <option value="翌日">翌日</option>
                  <option value="2日後">2日後</option>
                  <option value="3日後">3日後</option>
                </select>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <label className="block font-semibold text-gray-700 mb-2">
                  指値が成立しない場合:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="buy_limit_not_filled_action"
                  id="buy_limit_not_filled_action"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 mb-3"
                >
                  <option value="">選択してください</option>
                  <option value="成行">成行注文に変更</option>
                  <option value="キャンセル">注文をキャンセル</option>
                </select>
                <div id="buy_limit_not_filled_market" className="hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        成行のタイミング:{" "}
                        <span className="text-red-500 text-sm font-normal">
                          （必須）
                        </span>
                      </label>
                      <select
                        name="buy_limit_not_filled_price"
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                      >
                        <option value="">選択してください</option>
                        <option value="終値">終値</option>
                        <option value="始値">始値</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        実行日:{" "}
                        <span className="text-red-500 text-sm font-normal">
                          （必須）
                        </span>
                      </label>
                      <select
                        name="buy_limit_not_filled_day"
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                      >
                        <option value="">選択してください</option>
                        <option value="当日">当日</option>
                        <option value="翌日">翌日</option>
                        <option value="2日後">2日後</option>
                        <option value="3日後">3日後</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-gray-700 mb-3">
              📉 売りのタイミング
            </h3>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                売り条件:{" "}
                <span className="text-gray-500 text-sm font-normal">
                  （任意）
                </span>
              </label>
              <input
                type="text"
                name="sell_condition"
                placeholder="例: 5日移動平均が20日移動平均を下抜け、RSIが70以上（条件なしの場合は空欄）"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              />
              <small className="text-gray-500 block mt-1">
                例:
                「5日移動平均が20日移動平均を下抜け」「RSIが70以上」「買い日の翌日」（条件なしの場合は空欄で、毎日または指定日に成行売り）
              </small>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                注文タイプ:{" "}
                <span className="text-gray-500 text-sm font-normal">
                  （任意）
                </span>
              </label>
              <select
                name="sell_order_type"
                id="sell_order_type"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
              >
                <option value="">選択してください</option>
                <option value="成行">成行注文</option>
                <option value="指値">指値注文</option>
              </select>
            </div>

            <div id="sell_market_order" className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  成行のタイミング:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="sell_price"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="終値">終値</option>
                  <option value="始値">始値</option>
                </select>
                <small className="text-gray-500 block mt-1">
                  成行注文は始値または終値で約定します
                </small>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  売り実行日:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="sell_execution_day"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="当日">当日</option>
                  <option value="翌日">翌日</option>
                  <option value="2日後">2日後</option>
                  <option value="3日後">3日後</option>
                </select>
              </div>
            </div>

            <div id="sell_limit_order" className="hidden space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  指値条件:
                </label>
                <input
                  type="text"
                  name="sell_limit_condition"
                  placeholder="例: 10円上、5%上、エントリー価格の10%上"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                />
                <small className="text-gray-500 block mt-1">
                  例:
                  「10円上」「5%上」「エントリー価格の10%上」「前日の終値より10円上」
                </small>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  指値実行日:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="sell_execution_day"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                >
                  <option value="">選択してください</option>
                  <option value="当日">当日</option>
                  <option value="翌日">翌日</option>
                  <option value="2日後">2日後</option>
                  <option value="3日後">3日後</option>
                </select>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <label className="block font-semibold text-gray-700 mb-2">
                  指値が成立しない場合:{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    （任意）
                  </span>
                </label>
                <select
                  name="sell_limit_not_filled_action"
                  id="sell_limit_not_filled_action"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 mb-3"
                >
                  <option value="">選択してください</option>
                  <option value="成行">成行注文に変更</option>
                  <option value="キャンセル">注文をキャンセル</option>
                </select>
                <div id="sell_limit_not_filled_market" className="hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        成行のタイミング:{" "}
                        <span className="text-red-500 text-sm font-normal">
                          （必須）
                        </span>
                      </label>
                      <select
                        name="sell_limit_not_filled_price"
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                      >
                        <option value="">選択してください</option>
                        <option value="終値">終値</option>
                        <option value="始値">始値</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        実行日:{" "}
                        <span className="text-red-500 text-sm font-normal">
                          （必須）
                        </span>
                      </label>
                      <select
                        name="sell_limit_not_filled_day"
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                      >
                        <option value="">選択してください</option>
                        <option value="当日">当日</option>
                        <option value="翌日">翌日</option>
                        <option value="2日後">2日後</option>
                        <option value="3日後">3日後</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              検証期間（年）:
            </label>
            <select
              name="period"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            >
              <option value="1">1年</option>
              <option value="2">2年</option>
              <option value="3" defaultValue>
                3年
              </option>
              <option value="4">4年</option>
              <option value="5">5年</option>
              <option value="6">6年</option>
              <option value="7">7年</option>
              <option value="8">8年</option>
              <option value="9">9年</option>
              <option value="10">10年</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              固定投資額（円）:
            </label>
            <input
              type="number"
              name="fixed_investment"
              defaultValue="1000000"
              placeholder="1000000（デフォルト: 100万円）"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            />
            <small className="text-gray-500 block mt-1">
              毎回この金額を投資します（デフォルト: 1,000,000円）
            </small>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            onClick={(e) => {
              // 初回送信時はQ&A履歴をリセット
              if (!clarifiedDescription && qaHistory.length === 0) {
                setQaHistory([]);
                setClarifiedDescription("");
              }
            }}
          >
            AIがコードを生成して分析
          </button>
        </form>

        {nlLoading && <Loading message="AIが戦略コードを生成中..." />}

        {/* Q&A履歴の表示 */}
        {qaHistory.length > 0 && (
          <div className="mt-6 bg-gray-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-800 mb-4">
              📝 Q&A履歴（これまでのやり取り）
            </h3>
            <div className="space-y-4">
              {qaHistory.map((qa, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <div className="mb-3">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                        Q{idx + 1}
                      </span>
                      AIからの質問
                      {qa.has_inference && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          （推測内容を含む）
                        </span>
                      )}
                    </h4>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-300">
                      {qa.question}
                    </pre>
                  </div>
                  {qa.answer && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2 flex items-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                          A{idx + 1}
                        </span>
                        あなたの回答
                      </h4>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-green-50 p-3 rounded border-l-4 border-green-300">
                        {qa.answer}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* タイミング確認が必要な場合 */}
        {needsClarification && clarificationData && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-yellow-800 mb-4">
              {clarificationData.has_inference
                ? "🤔 AIが推測した売買タイミングを確認してください"
                : "⚠️ 買いと売りのタイミングを明確化してください"}
            </h3>
            {clarificationData.has_inference && (
              <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 注意:</strong>{" "}
                  AIが買いの内容から売りのタイミングを推測しました。推測内容を確認し、必要に応じて修正してください。
                </p>
              </div>
            )}
            <div className="mb-4 bg-white p-4 rounded-lg">
              <h4 className="font-bold text-gray-700 mb-2">
                {clarificationData.has_inference
                  ? "AIが推測した売買タイミング:"
                  : "AIからの質問:"}
              </h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {clarificationData.timing_confirmation}
              </pre>
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-gray-700 mb-2">
                {clarificationData.has_inference
                  ? "推測内容を確認し、必要に応じて修正してください（そのままでもOK）:"
                  : "明確化された取引戦略を記述してください:"}
              </label>
              <textarea
                value={clarifiedDescription}
                onChange={(e) => setClarifiedDescription(e.target.value)}
                rows="5"
                placeholder={
                  clarificationData.has_inference
                    ? "例: 推測内容で問題ありません。または: 翌日始値で売りに変更してください"
                    : "例: 前日比300円以上の下落で終値で買い、翌日openで売り"
                }
                className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono focus:border-yellow-600"
              />
              <small className="text-gray-500 block mt-1">
                元の記述: {clarificationData.original_description}
              </small>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClarificationSubmit}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                {clarificationData.has_inference
                  ? "確認して再生成"
                  : "明確化して再生成"}
              </button>
              <button
                onClick={() => {
                  setNeedsClarification(false);
                  setClarificationData(null);
                  setClarifiedDescription("");
                  // キャンセル時はQ&A履歴もリセット
                  setQaHistory([]);
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* コード生成後の確認 */}
        {codeConfirmationPending && generatedCode && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-800 mb-4">
              ✨ 戦略コードが生成されました
            </h3>
            <div className="mb-4">
              <p className="font-semibold text-gray-700 mb-2">
                戦略名: {generatedCode.strategy_name}
              </p>
              <p className="text-gray-700 mb-2">
                記述: {generatedCode.description}
              </p>
              {generatedCode.symbol && (
                <p className="text-gray-700 mb-2">
                  シンボル: {generatedCode.symbol}
                </p>
              )}
              {generatedCode.timing_confirmation && (
                <div className="mb-4 bg-white p-4 rounded-lg">
                  <h4 className="font-bold text-gray-700 mb-2">
                    確認されたタイミング:
                  </h4>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {generatedCode.timing_confirmation}
                  </pre>
                </div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2">
                生成されたコード:
              </h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {generatedCode.code}
              </pre>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCodeConfirmation(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                ✓ このコードでバックテストを実行
              </button>
              <button
                onClick={() => handleCodeConfirmation(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {nlResults && (
          <div className="mt-6">
            {nlResults.error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                エラー: {nlResults.error}
                {nlResults.generated_code && (
                  <div className="mt-4">
                    <h4 className="font-bold">生成されたコード</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
                      {nlResults.generated_code}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border-l-4 border-indigo-600 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-indigo-600 mb-4">
                  ✨ 生成された戦略: {nlResults.strategy_name}
                </h3>
                <p className="mb-2">
                  <strong>記述:</strong> {nlResults.description}
                </p>
                {nlResults.symbol && (
                  <p className="mb-4">
                    <strong>シンボル:</strong> {nlResults.symbol}
                  </p>
                )}

                <h4 className="font-bold text-lg mb-2">生成されたコード:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
                  {nlResults.generated_code}
                </pre>

                {nlResults.backtest_results && (
                  <>
                    <h4 className="font-bold text-lg mb-2">
                      バックテスト結果:
                    </h4>
                    <StrategyDetails results={nlResults.backtest_results} />

                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <h4 className="font-bold text-lg mb-4">💾 戦略を保存</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="save-strategy-name"
                          key={`save-strategy-name-${nlResults.strategy_name || 'default'}`}
                          defaultValue={nlResults.strategy_name || ""}
                          placeholder="戦略名を入力"
                          className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
                        />
                        <button
                          onClick={handleSaveStrategy}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          戦略を保存
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
          </div>
        )}

        {/* 既存戦略のバックテストタブ */}
        {activeTab === "existing" && (
          <div>
            <h2 className="text-2xl font-bold text-indigo-600 mb-6">
              📊 既存戦略のバックテスト
            </h2>

        {/* 戦略の説明 */}
        <div className="mb-6 bg-gray-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-3">各戦略の説明:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {Object.entries(strategyDescriptions).map(([id, desc]) => (
              <li key={id}>
                <span className="font-semibold text-gray-700">
                  {id === "ma" && "移動平均クロスオーバー"}
                  {id === "rsi" && "RSI戦略"}
                  {id === "bb" && "ボリンジャーバンド"}
                  {id === "macd" && "MACD戦略"}
                  {id === "combined" && "組み合わせ戦略"}
                  {id === "winhold" && "ホールド戦略"}
                  {id === "daily" && "毎営業日始値で買い当日の終値で売"}
                </span>
                : {desc}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleTradingSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              シンボル:
            </label>
            <select
              name="trading_symbol"
              id="trading-symbol"
              value={tradingSymbolType}
              onChange={(e) => setTradingSymbolType(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            >
              <option value="">日経平均指数 (デフォルト)</option>
              <option value="usdjpy">ドル円</option>
              <optgroup label="日本株">
                <option value="1570">日経平均レバレッジ(1570)</option>
                <option value="9984">ソフトバンクG(9984)</option>
                <option value="6857">アドバンテスト(6857)</option>
                <option value="8035">東京エレクトロン(8035)</option>
                <option value="7203">トヨタ(7203)</option>
                <option value="8306">三菱UFJ(8306)</option>
                <option value="7974">任天堂(7974)</option>
                <option value="6758">ソニーG(6758)</option>
                <option value="9983">ファーストリテイリング(9983)</option>
                <option value="6752">パナソニック(6752)</option>
                <option value="4063">信越化学(4063)</option>
                <option value="4503">アステラス(4503)</option>
                <option value="6098">リクルート(6098)</option>
                <option value="7267">ホンダ(7267)</option>
                <option value="4502">武田薬品(4502)</option>
                <option value="6367">ダイキン(6367)</option>
                <option value="6861">キーエンス(6861)</option>
              </optgroup>
              <option value="custom">カスタム（コード入力）</option>
            </select>
            {tradingSymbolType === "custom" && (
              <input
                type="text"
                name="trading_custom_symbol"
                id="trading-custom-symbol"
                placeholder="例: ^GSPC, AAPL"
                className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-indigo-600"
              />
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              検証期間（年）:
            </label>
            <select
              name="trading_period"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            >
              <option value="1">1年</option>
              <option value="2">2年</option>
              <option value="3" defaultValue>
                3年
              </option>
              <option value="4">4年</option>
              <option value="5">5年</option>
              <option value="6">6年</option>
              <option value="7">7年</option>
              <option value="8">8年</option>
              <option value="9">9年</option>
              <option value="10">10年</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              固定投資額（円）:
            </label>
            <input
              type="number"
              name="trading_fixed_investment"
              defaultValue="1000000"
              placeholder="1000000（デフォルト: 100万円）"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600"
            />
            <small className="text-gray-500 block mt-1">
              毎回この金額を投資します（デフォルト: 1,000,000円）
            </small>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-3">
              既存戦略を選択（複数選択可）:
            </label>
            <div className="space-y-2 border-2 border-gray-200 rounded-lg p-4">
              {Object.keys(strategyDescriptions).map((strategyId) => (
                <label
                  key={strategyId}
                  className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedStrategies.includes(strategyId)}
                    onChange={() => handleStrategyCheckboxChange(strategyId)}
                    className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-700">
                      {strategyId === "ma" && "移動平均クロスオーバー"}
                      {strategyId === "rsi" && "RSI戦略"}
                      {strategyId === "bb" && "ボリンジャーバンド"}
                      {strategyId === "macd" && "MACD戦略"}
                      {strategyId === "combined" && "組み合わせ戦略"}
                      {strategyId === "winhold" && "ホールド戦略"}
                      {strategyId === "daily" &&
                        "毎営業日始値で買い当日の終値で売"}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {strategyDescriptions[strategyId]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {savedStrategies.length > 0 && (
            <div>
              <label className="block font-semibold text-gray-700 mb-3">
                保存された戦略を選択（複数選択可）:
              </label>
              <div className="space-y-2 border-2 border-gray-200 rounded-lg p-4">
                {savedStrategies.map((strategy) => (
                  <label
                    key={strategy.id}
                    className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSavedStrategies.includes(strategy.id)}
                      onChange={() =>
                        handleSavedStrategyCheckboxChange(strategy.id)
                      }
                      className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">
                        {strategy.name}
                      </span>
                      {strategy.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {strategy.description}
                        </p>
                      )}
                      {strategy.symbol && (
                        <p className="text-xs text-gray-500 mt-1">
                          シンボル: {strategy.symbol}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            バックテストを実行
          </button>
        </form>

            {tradingLoading && <Loading message="バックテストを実行中..." />}

            {tradingResults && (
              <div className="mt-6">
                {tradingResults.error ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
                    エラー: {tradingResults.error}
                  </div>
                ) : (
                  <TradingResults data={tradingResults} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TradingAnalysis;
