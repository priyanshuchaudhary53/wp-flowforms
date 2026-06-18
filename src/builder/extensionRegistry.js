/**
 * Builder Extension Registry.
 *
 * Pro registers field settings panels, feature panels, settings tabs,
 * and other UI extensions into this registry. The free builder reads
 * from it to render Pro components without knowing about them at build time.
 */

const registry = {
  fieldSettings: {},
  fieldRenderers: {},
  settingsFieldTypes: {},
  featurePanels: [],
  settingsTabs: [],
  toolbarItems: [],
  storeExtensions: {},
};

export function registerFieldSettings(fieldType, config) {
  registry.fieldSettings[fieldType] = config;
}

export function registerFieldDefinition(fieldType, definition) {
  registry.fieldRenderers[fieldType] = definition;
}

export function registerFeaturePanel(config) {
  registry.featurePanels.push(config);
}

export function registerSettingsTab(config) {
  registry.settingsTabs.push(config);
}

export function registerToolbarItem(config) {
  registry.toolbarItems.push(config);
}

export function registerSettingsFieldType(type, component) {
  registry.settingsFieldTypes[type] = component;
}

export function getSettingsFieldType(type) {
  return registry.settingsFieldTypes[type] ?? null;
}

export function registerStoreExtension(key, initialState) {
  registry.storeExtensions[key] = initialState;
}

export function getFieldSettings(fieldType) {
  return registry.fieldSettings[fieldType] ?? null;
}

export function getFieldDefinition(fieldType) {
  return registry.fieldRenderers[fieldType] ?? null;
}

export function getFeaturePanels() {
  return [...registry.featurePanels];
}

export function getSettingsTabs() {
  return [...registry.settingsTabs];
}

export function getToolbarItems() {
  return [...registry.toolbarItems];
}

export function getStoreExtensions() {
  return { ...registry.storeExtensions };
}

export function isFieldRegistered(fieldType) {
  return fieldType in registry.fieldSettings;
}
