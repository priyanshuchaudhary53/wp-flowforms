import { TextAlignCenter, TextAlignStart } from "lucide-react";

const DESIGN_SETTINGS = [
  {
    section: "Colours",
    fields: [
      {
        key: "bg_color",
        label: "Background",
        type: "color",
        default: "#ffffff",
      },
      { key: "title_color", label: "Title", type: "color", default: "#111827" },
      {
        key: "description_color",
        label: "Description",
        type: "color",
        default: "#6b7280",
      },
      {
        key: "answer_color",
        label: "Answer",
        type: "color",
        default: "#111827",
      },
      {
        key: "button_color",
        label: "Button",
        type: "color",
        default: "#111827",
      },
      {
        key: "button_hover_color",
        label: "Button hover",
        type: "color",
        default: "#374151",
      },
      {
        key: "button_text_color",
        label: "Button text",
        type: "color",
        default: "#ffffff",
      },
      { key: "hint_color", label: "Hint", type: "color", default: "#9ca3af" },
      {
        key: "star_color",
        label: "Star rating",
        type: "color",
        default: "#f59e0b",
      },
    ],
  },
  {
    section: "Layout",
    fields: [
      {
        key: "alignment",
        label: "Alignment",
        type: "select",
        default: "center",
        options: [
          { label: "Left", value: "left", icon: TextAlignStart },
          { label: "Center", value: "center", icon: TextAlignCenter },
        ],
      },
      {
        key: "border_radius",
        label: "Corner style",
        type: "select",
        default: "rounded",
        options: [
          {
            label: "Angular", value: "angular",
            icon: () => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H1V15H16V16H0V0H16V1Z" fill="currentColor"/>
              </svg>
            ),
          },
          {
            label: "Rounded", value: "rounded",
            icon: () => (
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4C2.34315 1 1 2.34315 1 4V12C1 13.6569 2.34315 15 4 15V16C1.79086 16 0 14.2091 0 12V4C0 1.79086 1.79086 0 4 0H16V1ZM16 16H4V15H16V16Z" fill="currentColor"/>
              </svg>
            ),
          },
          {
            label: "Full", value: "full",
            icon: () => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H8C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15V16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0H16V1ZM16 16H8V15H16V16Z" fill="currentColor"/>
              </svg>
            ),
          },
        ],
      },
    ],
  },
  {
    section: "Typography",
    fields: [
      {
        key: "google_font",
        label: "Font family",
        type: "google_font",
        default: "",
      },
      {
        key: "font_size",
        label: "Font size",
        type: "select",
        default: "regular",
        options: [
          { label: "Small", value: "small" },
          { label: "Regular", value: "regular" },
          { label: "Large", value: "large" },
        ],
      },
    ],
  },
];

export default DESIGN_SETTINGS;
