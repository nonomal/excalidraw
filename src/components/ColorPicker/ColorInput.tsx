import { useCallback, useEffect, useRef, useState } from "react";
import { getColor } from "./ColorPicker";
import { useAtom } from "jotai";
import { activeColorPickerSectionAtom } from "./colorPickerUtils";
import { eyeDropperIcon } from "../icons";
import { jotaiScope } from "../../jotai";
import { KEYS } from "../../keys";
import { eyeDropperStateAtom } from "../EyeDropper";

interface ColorInputProps {
  color: string | null;
  onChange: (color: string) => void;
  label: string;
}

export const ColorInput = ({ color, onChange, label }: ColorInputProps) => {
  const [innerValue, setInnerValue] = useState(color);
  const [activeSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom,
  );

  useEffect(() => {
    setInnerValue(color);
  }, [color]);

  const changeColor = useCallback(
    (inputValue: string) => {
      const value = inputValue.toLowerCase();
      const color = getColor(value);

      if (color) {
        onChange(color);
      }
      setInnerValue(value);
    },
    [onChange],
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const eyeDropperTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSection]);

  const [eyeDropperState, setEyeDropperState] = useAtom(
    eyeDropperStateAtom,
    jotaiScope,
  );

  useEffect(() => {
    return () => {
      setEyeDropperState(null);
    };
  }, [setEyeDropperState]);

  return (
    <div className="color-picker__input-label">
      <div className="color-picker__input-hash">#</div>
      <input
        ref={activeSection === "hex" ? inputRef : undefined}
        style={{ border: 0, padding: 0 }}
        spellCheck={false}
        className="color-picker-input"
        aria-label={label}
        onChange={(event) => {
          changeColor(event.target.value);
        }}
        value={(innerValue || "").replace(/^#/, "")}
        onBlur={() => {
          setInnerValue(color);
        }}
        tabIndex={-1}
        onFocus={() => setActiveColorPickerSection("hex")}
        onKeyDown={(event) => {
          if (event.key === KEYS.TAB) {
            return;
          } else if (event.key === KEYS.ESCAPE) {
            // eyeDropperTriggerRef.current?.focus();
          }
          event.stopPropagation();
        }}
        onKeyUp={(event) => {
          if (event.key === KEYS.ESCAPE) {
            // event.preventDefault();
            // event.stopPropagation();
          }
        }}
      />
      <div
        style={{
          width: "1px",
          height: "1.25rem",
          backgroundColor: "var(--default-border-color)",
        }}
      />
      <div
        style={{
          width: "1.2em",
          height: "1.2em",
          color: eyeDropperState ? "var(--color-primary)" : undefined,
          fill: eyeDropperState ? "var(--color-primary)" : undefined,
          cursor: "pointer",
        }}
        ref={eyeDropperTriggerRef}
        className="excalidraw-eye-dropper-trigger"
        onClick={() =>
          setEyeDropperState((s) =>
            s
              ? null
              : { keepOpen: false, onSelect: (color) => onChange(color) },
          )
        }
      >
        {eyeDropperIcon}
      </div>
    </div>
  );
};
