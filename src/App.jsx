import React from 'react'
import TradingAnalysis from './components/TradingAnalysis'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
      <div className="max-w-6xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
            🤖 取引分析 AIエージェント
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            日経平均指数、ドル円、その他の指数・株価の取引戦略分析AIエージェント
          </p>
        </header>

        <TradingAnalysis />
      </div>
    </div>
  )
}

export default App
