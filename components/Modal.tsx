'use client'

import { useEffect, type ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'max-w-[90vw]',
}

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Called when closing (overlay click, Escape, or close button) */
  onClose: () => void
  /** Optional title in the header */
  title?: ReactNode
  /** Optional description/subtitle below the title */
  description?: ReactNode
  /** Main content (forms, lists, etc.) */
  children: ReactNode
  /** Optional footer (e.g. Cancel / Submit buttons) */
  footer?: ReactNode
  /** Modal width */
  size?: ModalSize
  /** Whether to show the close (X) button in the header */
  showCloseButton?: boolean
  /** Close when clicking the overlay */
  closeOnOverlayClick?: boolean
  /** Extra class for the content box */
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={closeOnOverlayClick ? onClose : undefined}
        onKeyDown={closeOnOverlayClick ? (e) => e.key === 'Enter' && onClose() : undefined}
        aria-hidden
      />

      {/* Content */}
      <div
        className={`relative w-full max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col text-gray-900 ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (only when title or close button) */}
        {(title ?? description ?? showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3 shrink-0">
            <div className="min-w-0">
              {title != null && (
                <h2 id="modal-title" className="text-lg font-bold text-gray-900">
                  {title}
                </h2>
              )}
              {description != null && (
                <p className="text-sm text-gray-600 mt-0.5">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-4">{children}</div>

        {/* Footer (optional) */}
        {footer != null && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-3 shrink-0 bg-gray-50/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
