import { KEYS } from "../../keys";
import {
  ColorPickerColor,
  ColorPalette,
  ColorPaletteCustom,
  COLORS_PER_ROW,
  COLOR_PALETTE,
} from "../../colors";
import { ValueOf } from "../../utility-types";
import {
  ActiveColorPickerSectionAtomType,
  colorPickerHotkeyBindings,
  getColorNameAndShadeFromHex,
} from "./colorPickerUtils";

const arrowHandler = (
  eventKey: string,
  currentIndex: number | null,
  length: number,
) => {
  const rows = Math.ceil(length / COLORS_PER_ROW);

  currentIndex = currentIndex ?? -1;

  switch (eventKey) {
    case "ArrowLeft": {
      const prevIndex = currentIndex - 1;
      return prevIndex < 0 ? length - 1 : prevIndex;
    }
    case "ArrowRight": {
      return (currentIndex + 1) % length;
    }
    case "ArrowDown": {
      const nextIndex = currentIndex + COLORS_PER_ROW;
      return nextIndex >= length ? currentIndex % COLORS_PER_ROW : nextIndex;
    }
    case "ArrowUp": {
      const prevIndex = currentIndex - COLORS_PER_ROW;
      const newIndex =
        prevIndex < 0 ? COLORS_PER_ROW * rows + prevIndex : prevIndex;
      return newIndex >= length ? undefined : newIndex;
    }
  }
};

interface HotkeyHandlerProps {
  e: React.KeyboardEvent;
  colorObj: { colorName: ColorPickerColor; shade: number | null } | null;
  onChange: (color: string) => void;
  palette: ColorPaletteCustom;
  customColors: string[];
  setActiveColorPickerSection: (
    update: React.SetStateAction<ActiveColorPickerSectionAtomType>,
  ) => void;
  activeShade: number;
}

const hotkeyHandler = ({
  e,
  colorObj,
  onChange,
  palette,
  customColors,
  setActiveColorPickerSection,
  activeShade,
}: HotkeyHandlerProps) => {
  if (colorObj?.shade != null) {
    // shift + numpad is extremely messed up on windows apparently
    if (
      ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code) &&
      e.shiftKey
    ) {
      const newShade = Number(e.code.slice(-1)) - 1;
      onChange(palette[colorObj.colorName][newShade]);
      setActiveColorPickerSection("shades");
    }
  }

  if (["1", "2", "3", "4", "5"].includes(e.key)) {
    const c = customColors[Number(e.key) - 1];
    if (c) {
      onChange(customColors[Number(e.key) - 1]);
      setActiveColorPickerSection("custom");
    }
  }

  if (colorPickerHotkeyBindings.includes(e.key)) {
    const index = colorPickerHotkeyBindings.indexOf(e.key);
    const paletteKey = Object.keys(palette)[index] as keyof ColorPalette;
    const paletteValue = palette[paletteKey];
    const r = Array.isArray(paletteValue)
      ? paletteValue[activeShade]
      : paletteValue;
    onChange(r);
    setActiveColorPickerSection("baseColors");
  }
};

interface ColorPickerKeyNavHandlerProps {
  event: React.KeyboardEvent;
  activeColorPickerSection: ActiveColorPickerSectionAtomType;
  palette: ColorPaletteCustom;
  hex: string | null;
  onChange: (color: string) => void;
  customColors: string[];
  setActiveColorPickerSection: (
    update: React.SetStateAction<ActiveColorPickerSectionAtomType>,
  ) => void;
  updateData: (formData?: any) => void;
  activeShade: number;
  onEyeDropperToggle: () => void;
  onEscape: (event: React.KeyboardEvent | KeyboardEvent) => void;
}

export const colorPickerKeyNavHandler = ({
  event,
  activeColorPickerSection,
  palette,
  hex,
  onChange,
  customColors,
  setActiveColorPickerSection,
  updateData,
  activeShade,
  onEyeDropperToggle,
  onEscape,
}: ColorPickerKeyNavHandlerProps) => {
  if (event.key === KEYS.ESCAPE) {
    onEscape(event);
    return;
  }

  if (!hex) {
    updateData({ openPopup: null });
    return;
  }

  if (event.key === KEYS.I) {
    onEyeDropperToggle();
  }

  const colorObj = getColorNameAndShadeFromHex({ hex, palette });

  if (event.key === KEYS.TAB) {
    const sectionsMap: Record<
      NonNullable<ActiveColorPickerSectionAtomType>,
      boolean
    > = {
      custom: !!customColors.length,
      baseColors: true,
      shades: colorObj?.shade != null,
      hex: true,
    };

    const sections = Object.entries(sectionsMap).reduce((acc, [key, value]) => {
      if (value) {
        acc.push(key as ActiveColorPickerSectionAtomType);
      }
      return acc;
    }, [] as ActiveColorPickerSectionAtomType[]);

    const activeSectionIndex = sections.indexOf(activeColorPickerSection);
    const indexOffset = event.shiftKey ? -1 : 1;
    const nextSectionIndex =
      activeSectionIndex + indexOffset > sections.length - 1
        ? 0
        : activeSectionIndex + indexOffset < 0
        ? sections.length - 1
        : activeSectionIndex + indexOffset;

    const nextSection = sections[nextSectionIndex];

    if (nextSection) {
      setActiveColorPickerSection(nextSection);
    }

    if (nextSection === "custom") {
      onChange(customColors[0]);
    } else if (nextSection === "baseColors") {
      const baseColorName = (
        Object.entries(palette) as [string, ValueOf<ColorPalette>][]
      ).find(([name, shades]) => {
        if (Array.isArray(shades)) {
          return shades.includes(hex);
        } else if (shades === hex) {
          return name;
        }
        return null;
      });

      if (!baseColorName) {
        onChange(COLOR_PALETTE.black);
      }
    }

    event.preventDefault();
    event.stopPropagation();

    return;
  }

  hotkeyHandler({
    e: event,
    colorObj,
    onChange,
    palette,
    customColors,
    setActiveColorPickerSection,
    activeShade,
  });

  if (activeColorPickerSection === "shades") {
    if (colorObj) {
      const { shade } = colorObj;
      const newShade = arrowHandler(event.key, shade, COLORS_PER_ROW);

      if (newShade !== undefined) {
        onChange(palette[colorObj.colorName][newShade]);
      }
    }
  }

  if (activeColorPickerSection === "baseColors") {
    if (colorObj) {
      const { colorName } = colorObj;
      const colorNames = Object.keys(palette) as (keyof ColorPalette)[];
      const indexOfColorName = colorNames.indexOf(colorName);

      const newColorIndex = arrowHandler(
        event.key,
        indexOfColorName,
        colorNames.length,
      );

      if (newColorIndex !== undefined) {
        const newColorName = colorNames[newColorIndex];
        const newColorNameValue = palette[newColorName];

        onChange(
          Array.isArray(newColorNameValue)
            ? newColorNameValue[activeShade]
            : newColorNameValue,
        );
      }
    }
  }

  if (activeColorPickerSection === "custom") {
    const indexOfColor = customColors.indexOf(hex);

    const newColorIndex = arrowHandler(
      event.key,
      indexOfColor,
      customColors.length,
    );

    if (newColorIndex !== undefined) {
      const newColor = customColors[newColorIndex];
      onChange(newColor);
    }
  }
};
