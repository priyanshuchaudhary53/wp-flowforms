/**
 * Settings field definitions for every block type.
 *
 * Each field has a `namespace` that tells the store and RightPanel
 * which sub-object of the block to read from / write to:
 *
 *   namespace: "content"   →  block.content[key]   (user-facing copy)
 *   namespace: "settings"  →  block.settings[key]  (behaviour / layout config)
 *
 * Field types:
 *   "text"     – single-line text input
 *   "textarea" – multi-line text input
 *   "toggle"   – boolean switch
 *   "select"   – dropdown with `options: [{ label, value }]`
 *   "number"   – numeric input with optional `min` / `max`
 */

// ── Shared content fields used by most question types ──────────────────────

const COMMON_CONTENT_FIELDS = [
  {
    namespace: "content",
    key: "title",
    label: "Question",
    type: "textarea",
    default: "",
  },
  {
    namespace: "content",
    key: "description",
    label: "Description",
    type: "textarea",
    default: "",
    hint: "Optional helper text shown below the question.",
  },
  {
    namespace: "content",
    key: "buttonLabel",
    label: "Button label",
    type: "text",
    default: "OK",
  },
];

// ── Shared settings fields used by most question types ─────────────────────

const COMMON_SETTING_FIELDS = [
  {
    namespace: "settings",
    key: "required",
    label: "Required",
    type: "toggle",
    default: false,
    hint: "Respondent must answer before proceeding.",
  },
  {
    namespace: "settings",
    key: "placeholder",
    label: "Placeholder text",
    type: "text",
    default: "",
    hint: "Shown inside the input when empty.",
  },
];

// ── Block definitions ──────────────────────────────────────────────────────

const BLOCK_SETTINGS = {

  // ── Welcome screen ─────────────────────────────────────────────────────

  welcome: {
    label: "Welcome screen",
    sections: [
      {
        title: "Content",
        fields: [
          {
            namespace: "content",
            key: "title",
            label: "Heading",
            type: "text",
            default: "Let's get started",
          },
          {
            namespace: "content",
            key: "description",
            label: "Description",
            type: "textarea",
            default: "",
            hint: "Introduce your form to respondents.",
          },
          {
            namespace: "content",
            key: "buttonLabel",
            label: "Start button label",
            type: "text",
            default: "Start",
          },
        ],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "layout",
            label: "Layout",
            type: "select",
            default: "default",
            options: [
              { label: "Default (Global setting)",  value: "default"      },
              { label: "Centered",                  value: "center"       },
              { label: "Left aligned",              value: "left"         },
            ],
            hint: "Default: Inherit the layout from global design settings instead of overriding it here.",
          },
          {
            namespace: "settings",
            key: "backgroundImage",
            label: "Background image URL",
            type: "text",
            default: "",
          },
        ],
      },
    ],
  },

  // ── Thank you screen ───────────────────────────────────────────────────

  thankYou: {
    label: "Thank you screen",
    sections: [
      {
        title: "Content",
        fields: [
          {
            namespace: "content",
            key: "title",
            label: "Heading",
            type: "text",
            default: "Thank you!",
          },
          {
            namespace: "content",
            key: "description",
            label: "Description",
            type: "textarea",
            default: "Your response has been recorded.",
          },
        ],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "layout",
            label: "Layout",
            type: "select",
            default: "default",
            options: [
              { label: "Default (Global setting)",  value: "default"      },
              { label: "Centered",                  value: "center"       },
              { label: "Left aligned",              value: "left"         },
            ],
            hint: "Default: Inherit the layout from global design settings instead of overriding it here.",
          },
          {
            namespace: "settings",
            key: "showSocialShare",
            label: "Show social share buttons",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "redirectUrl",
            label: "Redirect URL",
            type: "text",
            default: "",
            hint: "Leave empty to stay on the thank you screen.",
          },
          {
            namespace: "settings",
            key: "redirectDelay",
            label: "Redirect delay (seconds)",
            type: "number",
            default: 0,
            min: 0,
            max: 30,
          },
        ],
      },
    ],
  },

  // ── Short text ─────────────────────────────────────────────────────────

  short_text: {
    label: "Short text",
    sections: [
      {
        title: "Content",
        fields: [...COMMON_CONTENT_FIELDS],
      },
      {
        title: "Settings",
        fields: [
          ...COMMON_SETTING_FIELDS,
          {
            namespace: "settings",
            key: "maxLength",
            label: "Max characters",
            type: "number",
            default: 255,
            min: 1,
            max: 2000,
          },
        ],
      },
    ],
  },

  // ── Long text ──────────────────────────────────────────────────────────

  long_text: {
    label: "Long text / paragraph",
    sections: [
      {
        title: "Content",
        fields: [...COMMON_CONTENT_FIELDS],
      },
      {
        title: "Settings",
        fields: [
          ...COMMON_SETTING_FIELDS,
          {
            namespace: "settings",
            key: "maxLength",
            label: "Max characters",
            type: "number",
            default: 2000,
            min: 1,
            max: 10000,
          },
          {
            namespace: "settings",
            key: "rows",
            label: "Visible rows",
            type: "number",
            default: 4,
            min: 2,
            max: 20,
          },
        ],
      },
    ],
  },

  // ── Multiple choice ────────────────────────────────────────────────────

  multiple_choice: {
    label: "Multiple choice",
    sections: [
      {
        title: "Content",
        fields: [...COMMON_CONTENT_FIELDS],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "required",
            label: "Required",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "allowOther",
            label: "Allow \u201cOther\u201d option",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "randomize",
            label: "Randomize order",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "layout",
            label: "Option layout",
            type: "select",
            default: "vertical",
            options: [
              { label: "Vertical list", value: "vertical"  },
              { label: "Horizontal",    value: "horizontal" },
              { label: "2-column grid", value: "grid_2"    },
            ],
          },
        ],
      },
    ],
  },

  // ── Checkboxes ─────────────────────────────────────────────────────────

  checkboxes: {
    label: "Checkboxes",
    sections: [
      {
        title: "Content",
        fields: [...COMMON_CONTENT_FIELDS],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "required",
            label: "Required",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "minSelections",
            label: "Minimum selections",
            type: "number",
            default: 0,
            min: 0,
          },
          {
            namespace: "settings",
            key: "maxSelections",
            label: "Maximum selections",
            type: "number",
            default: 0,
            min: 0,
            hint: "Set to 0 for unlimited.",
          },
          {
            namespace: "settings",
            key: "allowOther",
            label: "Allow \u201cOther\u201d option",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "randomize",
            label: "Randomize order",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "layout",
            label: "Option layout",
            type: "select",
            default: "vertical",
            options: [
              { label: "Vertical list", value: "vertical"  },
              { label: "Horizontal",    value: "horizontal" },
              { label: "2-column grid", value: "grid_2"    },
            ],
          },
        ],
      },
    ],
  },

  // ── Star rating ────────────────────────────────────────────────────────

  rating: {
    label: "Star rating",
    sections: [
      {
        title: "Content",
        fields: [
          ...COMMON_CONTENT_FIELDS,
        ],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "required",
            label: "Required",
            type: "toggle",
            default: false,
          },
          {
            namespace: "settings",
            key: "steps",
            label: "Max rating",
            type: "number",
            default: 5,
            min: 3,
            max: 10,
          },
        ],
      },
    ],
  },

  // ── Yes / No ───────────────────────────────────────────────────────────

  yes_no: {
    label: "Yes / No",
    sections: [
      {
        title: "Content",
        fields: [
          ...COMMON_CONTENT_FIELDS,
          {
            namespace: "content",
            key: "yesLabel",
            label: "Yes label",
            type: "text",
            default: "👍 Yes",
          },
          {
            namespace: "content",
            key: "noLabel",
            label: "No label",
            type: "text",
            default: "👎 No",
          },
        ],
      },
      {
        title: "Settings",
        fields: [
          {
            namespace: "settings",
            key: "required",
            label: "Required",
            type: "toggle",
            default: false,
          },
        ],
      },
    ],
  },

  // ── Email ──────────────────────────────────────────────────────────────

  email: {
    label: "Email field",
    sections: [
      {
        title: "Content",
        fields: [...COMMON_CONTENT_FIELDS],
      },
      {
        title: "Settings",
        fields: [
          ...COMMON_SETTING_FIELDS,
          {
            namespace: "settings",
            key: "confirmEmail",
            label: "Ask to confirm email",
            type: "toggle",
            default: false,
            hint: "Show a second input to verify the address.",
          },
        ],
      },
    ],
  },

  // ── Number ─────────────────────────────────────────────────────────────

  number: {
    label: "Number field",
    sections: [
      {
        title: "Content",
        fields: [
          ...COMMON_CONTENT_FIELDS,
          {
            namespace: "content",
            key: "prefix",
            label: "Prefix",
            type: "text",
            default: "",
            hint: "e.g. \"$\" — shown before the input.",
          },
          {
            namespace: "content",
            key: "suffix",
            label: "Suffix",
            type: "text",
            default: "",
            hint: "e.g. \"kg\" — shown after the input.",
          },
        ],
      },
      {
        title: "Settings",
        fields: [
          ...COMMON_SETTING_FIELDS,
          {
            namespace: "settings",
            key: "min",
            label: "Minimum value",
            type: "number",
            default: "",
            hint: "Leave empty for no minimum.",
          },
          {
            namespace: "settings",
            key: "max",
            label: "Maximum value",
            type: "number",
            default: "",
            hint: "Leave empty for no maximum.",
          },
          {
            namespace: "settings",
            key: "step",
            label: "Step",
            type: "number",
            default: 1,
            min: 0,
            hint: "Increment amount.",
          },
        ],
      },
    ],
  },

};

export default BLOCK_SETTINGS;