import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void
  disabled?: boolean
  backgroundColor?: string
  penColor?: string
  width?: number
  height?: number
}

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({
  onSignatureChange,
  disabled = false,
  backgroundColor = '#ffffff',
  penColor = '#000000',
  width = 400,
  height = 200
}, ref) => {
  const sigCanvas = useRef<SignatureCanvas>(null)

  useImperativeHandle(ref, () => ({
    clear: () => {
      sigCanvas.current?.clear()
      onSignatureChange?.('')
    },
    isEmpty: () => {
      return sigCanvas.current?.isEmpty() ?? true
    },
    toDataURL: () => {
      return sigCanvas.current?.toDataURL() ?? ''
    }
  }))

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signature = sigCanvas.current.toDataURL()
      onSignatureChange?.(signature)
    }
  }

  return (
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{
          width,
          height,
          className: 'signature-canvas'
        }}
        backgroundColor={backgroundColor}
        penColor={penColor}
        onEnd={handleEnd}
        clearOnResize={false}
      />
      {disabled && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 cursor-not-allowed" />
      )}
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad