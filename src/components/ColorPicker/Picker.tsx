import React, { useEffect, useState } from "react";
import { t } from "../../i18n";

import { ExcalidrawElement } from "../../element/types";
import { ShadeList } from "./ShadeList";

import PickerColorList from "./PickerColorList";
import { useAtom } from "jotai";
import { CustomColorList } from "./CustomColorList";
import { colorPickerKeyNavHandler } from "./keyboardNavHandlers";
import PickerHeading from "./PickerHeading";
import {
  ColorPickerType,
  activeColorPickerSectionAtom,
  getColorNameAndShadeFromHex,
  getMostUsedCustomColors,
  isCustomColor,
} from "./colorPickerUtils";
import {
  ColorPaletteCustom,
  DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX,
  DEFAULT_ELEMENT_STROKE_COLOR_INDEX,
} from "../../colors";
import { KEYS } from "../../keys";
import { isWritableElement } from "../../utils";

interface PickerProps {
  color: string | null;
  onChange: (color: string) => void;
  label: string;
  type: ColorPickerType;
  elements: readonly ExcalidrawElement[];
  palette: ColorPaletteCustom;
  updateData: (formData?: any) => void;
  children?: React.ReactNode;
  onEyeDropperToggle: (force?: boolean) => void;
  onEscape: (event: React.KeyboardEvent | KeyboardEvent) => void;
}

export const Picker = ({
  color,
  onChange,
  label,
  type,
  elements,
  palette,
  updateData,
  children,
  onEyeDropperToggle,
  onEscape,
}: PickerProps) => {
  const [customColors] = React.useState(() => {
    if (type === "canvasBackground") {
      return [];
    }
    return getMostUsedCustomColors(elements, type, palette);
  });

  const [activeColorPickerSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom,
  );

  const colorObj = getColorNameAndShadeFromHex({
    hex: color || "transparent",
    palette,
  });

  useEffect(() => {
    if (!activeColorPickerSection) {
      const isCustom = isCustomColor({ color, palette });
      const isCustomButNotInList =
        isCustom && !customColors.includes(color || "");

      setActiveColorPickerSection(
        isCustomButNotInList
          ? "hex"
          : isCustom
          ? "custom"
          : colorObj?.shade != null
          ? "shades"
          : "baseColors",
      );
    }
  }, [
    activeColorPickerSection,
    color,
    palette,
    setActiveColorPickerSection,
    colorObj,
    customColors,
  ]);

  const [activeShade, setActiveShade] = useState(
    colorObj?.shade ??
      (type === "elementBackground"
        ? DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX
        : DEFAULT_ELEMENT_STROKE_COLOR_INDEX),
  );

  useEffect(() => {
    if (colorObj?.shade != null) {
      setActiveShade(colorObj.shade);
    }

    const keydown = (e: KeyboardEvent) => {
      if (e.key === KEYS.ALT) {
        console.log("~~~~ KEYDOWN", e.key);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === KEYS.ALT) {
        console.log("~~~~ KEYUP", event.key);
        onEyeDropperToggle(false);
      }
      if (event.key === KEYS.ESCAPE) {
        onEscape(event);
      }
    };
    // document.addEventListener("keydown", keydown, { capture: true });
    document.addEventListener("keyup", keyup, { capture: true });
    return () => {
      // document.removeEventListener("keydown", keydown, { capture: true });
      document.removeEventListener("keyup", keyup, { capture: true });
    };
  }, [colorObj, onEyeDropperToggle]);

  const pickerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div role="dialog" aria-modal="true" aria-label={t("labels.colorPicker")}>
      <div
        ref={pickerRef}
        onKeyDown={(event) => {
          event.preventDefault();
          event.stopPropagation();

          if (event.key === KEYS.ALT) {
            onEyeDropperToggle(true);
            return;
          }

          // if (e.alt && e)
          colorPickerKeyNavHandler({
            event,
            activeColorPickerSection,
            palette,
            hex: color,
            onChange,
            onEyeDropperToggle,
            customColors,
            setActiveColorPickerSection,
            updateData,
            activeShade,
            onEscape,
          });
        }}
        onKeyUp={(event) => {
          if (event.key === KEYS.ALT) {
            // onEyeDropperToggle(false);
            return;
          }
        }}
        className="color-picker-content"
        // to allow focusing by clicking but not by tabbing
        tabIndex={-1}
      >
        {!!customColors.length && (
          <div>
            <PickerHeading>
              {t("colorPicker.mostUsedCustomColors")}
            </PickerHeading>
            <CustomColorList
              colors={customColors}
              color={color}
              label={t("colorPicker.mostUsedCustomColors")}
              onChange={onChange}
            />
          </div>
        )}

        <div>
          <PickerHeading>{t("colorPicker.colors")}</PickerHeading>
          <PickerColorList
            color={color}
            label={label}
            palette={palette}
            onChange={onChange}
            activeShade={activeShade}
          />
        </div>

        <div>
          <PickerHeading>{t("colorPicker.shades")}</PickerHeading>
          <ShadeList hex={color} onChange={onChange} palette={palette} />
        </div>
        {children}
      </div>
    </div>
  );
};
