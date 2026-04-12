import "@testing-library/jest-dom";

// ── Mock wpffBuilderData (WordPress-injected global) ─────────────────────────────
globalThis.wpffBuilderData = {
  apiUrl: "http://localhost/wp-json/wpff/v1",
  adminFormsUrl: "http://localhost/wp-admin/admin.php?page=wpff_forms",
  nonce: "test-nonce",
  formId: "1",
};

// ── Mock crypto.randomUUID ────────────────────────────────────────────────────
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  get() {
    return { randomUUID: () => `test-uuid-${++uuidCounter}` };
  },
});

// ── Mock wp.media (WordPress media frame) ────────────────────────────────────
function createMockFrame(overrides = {}) {
  return {
    on: vi.fn(),
    open: vi.fn(),
    state: vi.fn(() => ({
      get: vi.fn(() => ({
        first: vi.fn(() => ({
          toJSON: vi.fn(() => ({ id: 99, url: "http://example.com/image.jpg" })),
        })),
      })),
    })),
    ...overrides,
  };
}

globalThis.wp = { media: vi.fn(() => createMockFrame()) };


// ── Mock ResizeObserver (used by cmdk / Radix) ───────────────────────────────
globalThis.ResizeObserver = class ResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};
// ── Mock fetch ────────────────────────────────────────────────────────────────
globalThis.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
);


// ── jsdom polyfills for cmdk / Radix ─────────────────────────────────────────
// cmdk calls scrollIntoView on list items
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}

// Radix Dialog / cmdk use PointerEvent
if (typeof globalThis.PointerEvent === "undefined") {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
    }
  };
}

// Radix uses hasPointerCapture / releasePointerCapture
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
}
// ── Reset everything between tests ───────────────────────────────────────────
beforeEach(() => {
  uuidCounter = 0;
  vi.clearAllMocks();
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  );
  globalThis.wp = { media: vi.fn(() => createMockFrame()) };
});
