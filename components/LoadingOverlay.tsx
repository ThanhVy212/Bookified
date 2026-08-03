'use client';

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  progress?: {
    current: number;
    total: number;
    currentStep: string;
  };
}

export default function LoadingOverlay({ 
  isVisible, 
  title = "Processing your book...",
  progress 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper bg-white">
        <div className="loading-shadow">
          <div className="loading-animation">
            <svg 
              className="w-12 h-12 text-[#663820]" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="loading-title">{title}</h3>
          
          {progress && (
            <div className="loading-progress">
              <div className="loading-progress-item">
                <span className="loading-progress-status" />
                <span className="text-[var(--text-secondary)]">
                  {progress.currentStep} ({progress.current}/{progress.total})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}