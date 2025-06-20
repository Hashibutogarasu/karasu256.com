import React, { useState, useCallback } from "react";
import Overlay from "../components/Overlay";

interface OverlayProps {
  opacity?: number;
  zIndex?: number;
  onClick?: () => void;
}

interface UseOverlayReturn {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  OverlayComponent: React.FC;
  renderOverlay: () => React.ReactNode;
}

export function useOverlay(
  initialState = false,
  props: OverlayProps = {},
): UseOverlayReturn {
  const [isVisible, setIsVisible] = useState<boolean>(initialState);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible((prev) => !prev), []);
  const renderOverlay = useCallback(() => {
    return isVisible ? (
      <Overlay
        isVisible={true}
        opacity={props.opacity}
        zIndex={props.zIndex}
        onClick={props.onClick || hide}
      />
    ) : null;
  }, [isVisible, props.opacity, props.zIndex, props.onClick, hide]);

  const OverlayComponent: React.FC = () => {
    return renderOverlay();
  };

  return {
    isVisible,
    show,
    hide,
    toggle,
    OverlayComponent,
    renderOverlay,
  };
}

export default useOverlay;
