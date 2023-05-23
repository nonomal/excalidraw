import { isTransparent, isWritableElement } from "../../utils";
import { ExcalidrawElement } from "../../element/types";
import { AppState } from "../../types";
import { TopPicks } from "./TopPicks";
import { Picker } from "./Picker";
import * as Popover from "@radix-ui/react-popover";
import { useAtom } from "jotai";
import {
  activeColorPickerSectionAtom,
  ColorPickerType,
} from "./colorPickerUtils";
import { useDevice, useExcalidrawContainer } from "../App";
import { ColorTuple, COLOR_PALETTE, ColorPaletteCustom } from "../../colors";
import PickerHeading from "./PickerHeading";
import { t } from "../../i18n";
import clsx from "clsx";
import { jotaiScope } from "../../jotai";
import { eyeDropperStateAtom, ColorInput } from "./ColorInput";
import { useRef } from "react";

import "./ColorPicker.scss";

const isValidColor = (color: string) => {
  const style = new Option().style;
  style.color = color;
  return !!style.color;
};

export const getColor = (color: string): string | null => {
  if (isTransparent(color)) {
    return color;
  }

  // testing for `#` first fixes a bug on Electron (more specfically, an
  // Obsidian popout window), where a hex color without `#` is (incorrectly)
  // considered valid
  return isValidColor(`#${color}`)
    ? `#${color}`
    : isValidColor(color)
    ? color
    : null;
};

export interface ColorPickerProps {
  type: ColorPickerType;
  color: string | null;
  onChange: (color: string) => void;
  label: string;
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  palette?: ColorPaletteCustom | null;
  topPicks?: ColorTuple;
  updateData: (formData?: any) => void;
}

const ColorPickerPopupContent = ({
  type,
  color,
  onChange,
  label,
  elements,
  palette = COLOR_PALETTE,
  updateData,
}: Pick<
  ColorPickerProps,
  | "type"
  | "color"
  | "onChange"
  | "label"
  | "label"
  | "elements"
  | "palette"
  | "updateData"
>) => {
  const [, setActiveColorPickerSection] = useAtom(activeColorPickerSectionAtom);

  const [eyeDropperState, setEyeDropperState] = useAtom(
    eyeDropperStateAtom,
    jotaiScope,
  );

  const { container } = useExcalidrawContainer();
  const { isMobile, isLandscape } = useDevice();

  const colorInputJSX = (
    <div>
      <PickerHeading>{t("colorPicker.hexCode")}</PickerHeading>
      <ColorInput
        color={color}
        label={label}
        onChange={(color) => {
          onChange(color);
        }}
      />
    </div>
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  return (
    <Popover.Portal container={container}>
      <Popover.Content
        ref={popoverRef}
        className="focus-visible-none"
        data-prevent-outside-click
        onFocusOutside={(event) => {
          // console.log(">>>>>>>>>>>>>>>>>>>>>>>", popoverRef.current);

          // console.log(
          //   "FOCUS OUTSIDE",
          //   eyeDropperState,
          //   event.target,
          //   event.currentTarget,
          // );
          // if (eyeDropperState) {
          // popoverRef.current?.focus();
          (
            document.querySelector(".color-picker-content") as HTMLDivElement
          )?.focus();
          // }
          event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (eyeDropperState) {
            // prevent from closing if we click outside the popover
            // while eyedropping (e.g. click when clicking the sidebar;
            // the eye-dropper-backdrop is prevented downstream)
            event.preventDefault();
          }
        }}
        // onEscapeKeyDown={(event) => {
        //   console.log("esc colorpicker", eyeDropperState);
        //   if (eyeDropperState) {
        //     // event.preventDefault();
        //   }
        // }}
        onCloseAutoFocus={(e) => {
          // return focus to excalidraw container
          if (container) {
            container.focus();
          }

          e.preventDefault();
          e.stopPropagation();

          setActiveColorPickerSection(null);
        }}
        side={isMobile && !isLandscape ? "bottom" : "right"}
        align={isMobile && !isLandscape ? "center" : "start"}
        alignOffset={-16}
        sideOffset={20}
        style={{
          zIndex: 9999,
          backgroundColor: "var(--popup-bg-color)",
          maxWidth: "208px",
          maxHeight: window.innerHeight,
          padding: "12px",
          borderRadius: "8px",
          boxSizing: "border-box",
          overflowY: "auto",
          boxShadow:
            "0px 7px 14px rgba(0, 0, 0, 0.05), 0px 0px 3.12708px rgba(0, 0, 0, 0.0798), 0px 0px 0.931014px rgba(0, 0, 0, 0.1702)",
        }}
      >
        {palette ? (
          <Picker
            palette={palette}
            color={color || null}
            onChange={(changedColor) => {
              onChange(changedColor);
            }}
            onEyeDropperToggle={(force) => {
              // console.log("ON EYER DROPPER TOGGLE", force);
              setEyeDropperState((s) => {
                const next =
                  force != null
                    ? force
                      ? s && s.keepOpen
                        ? s
                        : { keepOpen: true }
                      : null
                    : s
                    ? null
                    : { keepOpen: false };

                // console.log(force, { next }, next === s);

                return next;
                // return s;
              });
            }}
            onEscape={(event) => {
              if (eyeDropperState) {
                setEyeDropperState(null);
              } else if (isWritableElement(event.target)) {
                (
                  popoverRef.current?.querySelector(
                    ".color-picker-content",
                  ) as HTMLDivElement
                )?.focus();
              } else {
                updateData({ openPopup: null });
              }
            }}
            label={label}
            type={type}
            elements={elements}
            updateData={updateData}
          >
            {colorInputJSX}
          </Picker>
        ) : (
          colorInputJSX
        )}
        <Popover.Arrow
          width={20}
          height={10}
          style={{
            fill: "var(--popup-bg-color)",
            filter: "drop-shadow(rgba(0, 0, 0, 0.05) 0px 3px 2px)",
          }}
        />
      </Popover.Content>
    </Popover.Portal>
  );
};

const ColorPickerTrigger = ({
  label,
  color,
  type,
}: {
  color: string | null;
  label: string;
  type: ColorPickerType;
}) => {
  return (
    <Popover.Trigger
      type="button"
      className={clsx("color-picker__button active-color", {
        "is-transparent": color === "transparent" || !color,
      })}
      aria-label={label}
      style={color ? { "--swatch-color": color } : undefined}
      title={
        type === "elementStroke"
          ? t("labels.showStroke")
          : t("labels.showBackground")
      }
    >
      <div className="color-picker__button-outline" />
    </Popover.Trigger>
  );
};

export const ColorPicker = ({
  type,
  color,
  onChange,
  label,
  elements,
  palette = COLOR_PALETTE,
  topPicks,
  updateData,
  appState,
}: ColorPickerProps) => {
  return (
    <div>
      <div role="dialog" aria-modal="true" className="color-picker-container">
        <TopPicks
          activeColor={color}
          onChange={onChange}
          type={type}
          topPicks={topPicks}
        />
        <div
          style={{
            width: 1,
            height: "100%",
            backgroundColor: "var(--default-border-color)",
            margin: "0 auto",
          }}
        />
        <Popover.Root
          open={appState.openPopup === type}
          onOpenChange={(open) => {
            updateData({ openPopup: open ? type : null });
          }}
        >
          <ColorPickerTrigger color={color} label={label} type={type} />
          {/* popup content */}
          {appState.openPopup === type && (
            <ColorPickerPopupContent
              type={type}
              color={color}
              onChange={onChange}
              label={label}
              elements={elements}
              palette={palette}
              updateData={updateData}
            />
          )}
        </Popover.Root>
      </div>
    </div>
  );
};
