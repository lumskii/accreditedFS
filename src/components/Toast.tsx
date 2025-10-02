import React from 'react'

type ToastProps = {
  message: string | null
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="bg-gray-900 text-white px-4 py-2 rounded shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="text-sm">{message}</div>
          {onClose && <button className="ml-3 text-xs underline" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>
  )
}

export default Toast
