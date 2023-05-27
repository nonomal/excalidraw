import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { KEYS } from "../keys";
import { isInputLike, isInteractive } from "../utils";
import { useExcalidrawCanvas, useExcalidrawContainer } from "./App";
// import { useDevice } from "./App";

import "./EyeDropper.scss";

const padding = 20;

const useBodyRoot = (/* theme: AppState["theme"] */) => {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  const { container: excalidrawContainer } = useExcalidrawContainer();

  useLayoutEffect(() => {
    const eyeDropperContainer = excalidrawContainer?.querySelector(
      ".excalidraw-eye-dropper-container",
    );

    if (!eyeDropperContainer) {
      return;
    }

    const div = document.createElement("div");

    div.tabIndex = -1;

    div.classList.add(
      "excalidraw-eye-dropper-backdrop",
      "excalidraw",
      "excalidraw-modal-container",
    );
    eyeDropperContainer.appendChild(div);

    setDiv(div);

    return () => {
      eyeDropperContainer.removeChild(div);
    };
  }, [excalidrawContainer]);

  return div;
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

export const EyeDropper = ({
  onCancel,
  onSelect,
}: {
  onCancel: () => void;
  onSelect: (color: string, event: PointerEvent) => void;
}) => {
  const canvas = useExcalidrawCanvas();
  const bodyRoot = useBodyRoot();

  useEffect(() => {
    const colorDiv = ref.current;
    // console.log(colorDiv, canvas);
    const container = bodyRoot;
    if (!colorDiv || !canvas || !container) {
      return;
    }

    let currentColor = "black";

    const ctx = canvas.getContext("2d")!;

    const mouseMoveListener = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      colorDiv.style.top = `${clientY + padding}px`;
      colorDiv.style.left = `${clientX + padding}px`;

      const pixel = ctx.getImageData(
        clientX * window.devicePixelRatio,
        clientY * window.devicePixelRatio,
        1,
        1,
      ).data;
      currentColor = rgbToHex(pixel[0], pixel[1], pixel[2]);

      colorDiv.style.background = currentColor;
    };

    // listen on pointerdown event
    const pointerDownListener = (event: PointerEvent) => {
      event.stopImmediatePropagation();
      // to prevent switching focus from current element
      event.preventDefault();
      setTimeout(() => {
        document.querySelector("input")?.focus();
      }, 500);
      onSelect(currentColor, event);
    };
    // const keyDownListener = (event: KeyboardEvent) => {
    //   console.log("eyeDropper keydown", event.key);
    //   if (event.key === KEYS.ESCAPE) {
    //     event.preventDefault();
    //     event.stopImmediatePropagation();
    //     onCancel();
    //   }
    // };
    // container.addEventListener("keydown", keyDownListener);
    container.addEventListener("pointerdown", pointerDownListener);

    document.addEventListener("mousemove", mouseMoveListener, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousemove", mouseMoveListener);
      // container.removeEventListener("keydown", keyDownListener);
      container.removeEventListener("pointerdown", pointerDownListener);
    };
  }, [canvas, bodyRoot, onCancel, onSelect]);

  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(
    ref,
    () => {
      onCancel();
    },
    (event) => {
      if (
        event.target.closest(
          ".excalidraw-eye-dropper-trigger, .excalidraw-eye-dropper-backdrop",
        )
      ) {
        return true;
      }
      if (!isInteractive(event.target)) {
        // don't switch focus if target isn't clickable (thus likely shouldn't
        // close the color picker)
        // event.preventDefault();
      }
      // consider all other clicks as outside
      return false;
    },
  );

  if (!bodyRoot) {
    return null;
  }

  return createPortal(
    <div ref={ref} className="excalidraw-eye-dropper-preview" />,
    bodyRoot,
  );
};
