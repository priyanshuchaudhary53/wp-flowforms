import domReady from "@wordpress/dom-ready";
import { createRoot } from "@wordpress/element";

import App from "./App";
import "./style.css";
import * as extensionRegistry from "./extensionRegistry";
import * as dndCore from "@dnd-kit/core";
import * as dndSortable from "@dnd-kit/sortable";
import * as dndModifiers from "@dnd-kit/modifiers";
import * as dndUtilities from "@dnd-kit/utilities";
import { GripVertical, PlusIcon, XIcon, ImageIcon } from "lucide-react";

// Expose the extension API globally so Pro can register
// field settings, feature panels, and other UI extensions.
window.flowformsBuilder = {
  registerFieldSettings: extensionRegistry.registerFieldSettings,
  registerFieldDefinition: extensionRegistry.registerFieldDefinition,
  registerFeaturePanel: extensionRegistry.registerFeaturePanel,
  registerSettingsTab: extensionRegistry.registerSettingsTab,
  registerToolbarItem: extensionRegistry.registerToolbarItem,
  registerStoreExtension: extensionRegistry.registerStoreExtension,
  registerSettingsFieldType: extensionRegistry.registerSettingsFieldType,
  getStore: () => {
    const { default: useFormStore } = require("./store/useFormStore");
    return useFormStore;
  },
  libs: {
    dndCore,
    dndSortable,
    dndModifiers,
    dndUtilities,
    lucideReact: { GripVertical, PlusIcon, XIcon, ImageIcon },
  },
};

document.dispatchEvent(new CustomEvent("flowforms-builder-ready"));

domReady(() => {
  const rootElm = document.getElementById("wpff-builder");
  const root = createRoot(rootElm);

  root.render(<App />);
});
