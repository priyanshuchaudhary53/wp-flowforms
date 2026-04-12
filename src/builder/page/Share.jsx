import { useState } from "react";
import { __, sprintf } from "@wordpress/i18n";
import { Check, Copy, ExternalLink, Puzzle } from "lucide-react";
import { useFormStore } from "../store/useFormStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../components/ui/input-group";

// Default shortcode attribute values — match PHP shortcode_atts defaults.
const DEFAULT_HEIGHT        = "520px";
const DEFAULT_BORDER_RADIUS = "16px";

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  };
  return [copied, copy];
}

function CopyInputRow({ label, value }) {
  const [copied, copy] = useCopy();

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <InputGroup className="bg-gray-50!">
        <InputGroupInput readOnly value={value} className="font-mono text-xs text-muted-foreground" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={() => copy(value)} aria-label={ sprintf( /* translators: %s: field label (e.g. "Embed Code") */ __( "Copy %s", "flowforms" ), label ) }>
            {copied ? <Check className="text-green-500" /> : <Copy />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

export default function Share({ className }) {
  const formId  = useFormStore((state) => state.formId);

  const publicUrl = flowformsBuilderData.publicUrl ?? "";

  // Shortcode customisation state
  const [height,        setHeight]        = useState(DEFAULT_HEIGHT);
  const [borderRadius,  setBorderRadius]  = useState(DEFAULT_BORDER_RADIUS);

  // Build the live shortcode string
  const shortcodeAttrs = [
    `id="${formId}"`,
    height        !== DEFAULT_HEIGHT        ? `height="${height}"`               : null,
    borderRadius  !== DEFAULT_BORDER_RADIUS ? `border_radius="${borderRadius}"`  : null,
  ].filter(Boolean).join(" ");
  const shortcode = `[flowform ${shortcodeAttrs}]`;

  return (
    <div className={`overflow-y-auto px-3 py-10 bg-ff-background ${className}`}>
      <div className="bg-white rounded-2xl mx-auto max-w-2xl px-6 py-10 space-y-8">

        {/* ── Direct link ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{ __( "Direct link", "flowforms" ) }</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              { __( "Share this URL so anyone can fill in your form directly.", "flowforms" ) }
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <CopyInputRow label={ __( "Form URL", "flowforms" ) } value={publicUrl} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 mb-0.5"
              asChild
            >
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                { __( "Open", "flowforms" ) }
              </a>
            </Button>
          </div>
        </section>

        <hr className="border-border" />

        {/* ── Shortcode ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{ __( "Shortcode", "flowforms" ) }</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              { __( "Paste this shortcode into any WordPress page or post to embed the form.", "flowforms" ) }
            </p>
          </div>

          {/* Live preview + copy */}
          <CopyInputRow label={ __( "Shortcode", "flowforms" ) } value={shortcode} />

          {/* Attribute customisation */}
          <div className="rounded-lg border border-border bg-gray-50 p-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              { __( "Customize embed", "flowforms" ) }
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sc-height" className="text-sm font-medium text-foreground">
                  { __( "Height", "flowforms" ) }
                </label>
                <Input
                  id="sc-height"
                  value={height}
                  className="bg-white!"
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={DEFAULT_HEIGHT}
                />
                <p className="text-xs text-muted-foreground">
                  { __( "e.g.", "flowforms" ) } <code>520px</code>, <code>80vh</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sc-radius" className="text-sm font-medium text-foreground">
                  { __( "Border radius", "flowforms" ) }
                </label>
                <Input
                  id="sc-radius"
                  value={borderRadius}
                  className="bg-white!"
                  onChange={(e) => setBorderRadius(e.target.value)}
                  placeholder={DEFAULT_BORDER_RADIUS}
                />
                <p className="text-xs text-muted-foreground">
                  { __( "e.g.", "flowforms" ) } <code>16px</code>, <code>0</code>, <code>1rem</code>
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-border" />

        {/* ── Gutenberg block ───────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{ __( "Gutenberg block", "flowforms" ) }</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              { __( "The", "flowforms" ) } <strong className="text-foreground font-medium">FlowForm</strong> { __( "block is available in the WordPress block editor — no shortcode needed.", "flowforms" ) }
            </p>
          </div>

          <ol className="space-y-3 text-sm text-muted-foreground list-none">
            {[
              <>{ __( "Open the page or post where you want to embed the form in the", "flowforms" ) } <strong className="text-foreground font-medium">{ __( "Block Editor", "flowforms" ) }</strong>.</>,
              <>{ __( "Click the", "flowforms" ) } <strong className="text-foreground font-medium">+</strong> { __( "inserter and search for", "flowforms" ) } <strong className="text-foreground font-medium">FlowForm</strong>, { __( "then select the block.", "flowforms" ) }</>,
              <>{ __( "Choose this form from the dropdown in the block toolbar or sidebar.", "flowforms" ) }</>,
              <>{ __( "In the block sidebar, set", "flowforms" ) } <strong className="text-foreground font-medium">{ __( "Height", "flowforms" ) }</strong> { __( "and", "flowforms" ) } <strong className="text-foreground font-medium">{ __( "Border Radius", "flowforms" ) }</strong> { __( "to match your design.", "flowforms" ) }</>,
              <>{ __( "Publish or update the page — the form is live.", "flowforms" ) }</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ff-secondary-100 text-ff-secondary-700 text-xs font-semibold mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

      </div>
    </div>
  );
}
