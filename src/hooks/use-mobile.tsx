import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT;
      // Phone in landscape mode: width is 640-932px, but height is only 320-500px
      const isShortLandscape = window.innerHeight <= 520 && window.innerWidth <= 1024;
      const isTouchDevice = isTouch && (window.innerWidth <= 1024 || window.innerHeight <= 600);

      setIsMobile(isNarrow || isShortLandscape || isTouchDevice);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isMobile;
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerHeight <= 520);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isLandscape;
}
