import React from 'react';

interface ErrorAlertProps {
  error: string | string[] | null;
  className?: string;
  onClose?: () => void;
}

export function ErrorAlert({ error, className = '', onClose }: ErrorAlertProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {errors.length === 1 ? (
            <p className="text-sm">{errors[0]}</p>
          ) : (
            <ul className="list-disc list-inside text-sm space-y-1">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 inline-flex text-red-400 hover:text-red-600 focus:outline-none"
          >
            <span className="sr-only">Tutup</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface SuccessAlertProps {
  message: string | null;
  className?: string;
  onClose?: () => void;
}

export function SuccessAlert({ message, className = '', onClose }: SuccessAlertProps) {
  if (!message) return null;

  return (
    <div className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
          >
            <span className="sr-only">Tutup</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface WarningAlertProps {
  message: string | null;
  className?: string;
  onClose?: () => void;
}

export function WarningAlert({ message, className = '', onClose }: WarningAlertProps) {
  if (!message) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg relative ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
          >
            <span className="sr-only">Tutup</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface InfoAlertProps {
  message: string | null;
  className?: string;
  onClose?: () => void;
}

export function InfoAlert({ message, className = '', onClose }: InfoAlertProps) {
  if (!message) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg relative ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
          >
            <span className="sr-only">Tutup</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface RateLimitAlertProps {
  retryAfter?: string;
  className?: string;
}

export function RateLimitAlert({ retryAfter = '15 menit', className = '' }: RateLimitAlertProps) {
  return (
    <WarningAlert
      message={`Terlalu banyak permintaan. Silakan coba lagi setelah ${retryAfter}.`}
      className={className}
    />
  );
}
