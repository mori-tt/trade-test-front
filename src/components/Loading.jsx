import React from 'react'

function Loading({ message = '処理中...' }) {
  return (
    <div className="text-center py-10">
      <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

export default Loading
