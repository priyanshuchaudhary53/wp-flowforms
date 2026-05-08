import domReady from "@wordpress/dom-ready";
import { createRoot } from "@wordpress/element";

import App from "./App";
import "./style.css";
import * as extensionRegistry from "./extensionRegistry";

// Expose the extension API globally so Pro can register
// field settings, feature panels, and other UI extensions.
window.flowformsBuilder = {
  registerFieldSettings: extensionRegistry.registerFieldSettings,
  registerFieldDefinition: extensionRegistry.registerFieldDefinition,
  registerFeaturePanel: extensionRegistry.registerFeaturePanel,
  registerSettingsTab: extensionRegistry.registerSettingsTab,
  registerToolbarItem: extensionRegistry.registerToolbarItem,
  registerStoreExtension: extensionRegistry.registerStoreExtension,
  getStore: () => {
    const { default: useFormStore } = require("./store/useFormStore");
    return useFormStore;
  },
};

document.dispatchEvent(new CustomEvent("flowforms-builder-ready"));

domReady(() => {
  const rootElm = document.getElementById("wpff-builder");
  const root = createRoot(rootElm);

  root.render(<App />);
});
