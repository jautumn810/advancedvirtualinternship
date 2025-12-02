import { FiAlertCircle } from "react-icons/fi";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="mt-0.5 flex-shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

