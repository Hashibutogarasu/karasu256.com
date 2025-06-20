import React, { useState, useCallback } from "react";
import CircularProgressIndicator from "../components/CircularProgressIndicator";

interface CircularProgressProps {
  zIndex?: number;
}

interface UseCircularProgressReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  toggleLoading: () => void;
  ProgressComponent: React.FC;
  renderProgress: () => React.ReactNode;
}

export function useCircularProgress(
  initialState = false,
  props: CircularProgressProps = {},
): UseCircularProgressReturn {
  const [isLoading, setIsLoading] = useState<boolean>(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  const toggleLoading = useCallback(() => setIsLoading((prev) => !prev), []);

  const renderProgress = useCallback(() => {
    if (!isLoading) return null;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30"
        style={{ zIndex: props.zIndex || 100 }}
      >
        <CircularProgressIndicator />
      </div>
    );
  }, [isLoading, props.zIndex]);

  const ProgressComponent: React.FC = () => {
    return renderProgress();
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    ProgressComponent,
    renderProgress,
  };
}

export default useCircularProgress;
