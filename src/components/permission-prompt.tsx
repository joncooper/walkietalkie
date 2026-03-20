"use client";

interface PermissionPromptProps {
  onAllow: () => void;
  onDismiss: () => void;
}

export function PermissionPrompt({ onAllow, onDismiss }: PermissionPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="bg-wt-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-wt-listening/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-wt-listening"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-wt-text">Microphone Access</h2>
        </div>
        <p className="text-sm text-wt-muted mb-6 leading-relaxed">
          Walkie Talkie needs your microphone to have a voice conversation with AI.
          Your browser will ask for permission next.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-wt-muted bg-wt-bg hover:bg-wt-idle/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAllow}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-wt-bg bg-wt-listening hover:bg-wt-listening/80 transition-colors"
          >
            Allow Microphone
          </button>
        </div>
      </div>
    </div>
  );
}
