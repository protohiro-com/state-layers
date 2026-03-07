import { useMemo, useState, type ReactNode } from "react";
import {
  useFocusRingLayer,
  useInvalidStateLayer,
  useLoadingSheenLayer
} from "@protohiro/state-layers";

type DemoOption = string | number | boolean;
type DemoOptions = Record<string, DemoOption>;
type ControlType = "text" | "number" | "range" | "checkbox" | "color";

type DemoControl = {
  key: string;
  label: string;
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
};

type StoryPreviewProps = {
  options: DemoOptions;
  onOptionChange: (key: string, value: DemoOption) => void;
};

type Story = {
  id: string;
  title: string;
  description: string;
  hookName: string;
  componentName: string;
  defaults: DemoOptions;
  controls: DemoControl[];
  preview: (props: StoryPreviewProps) => ReactNode;
};

function formatOptionValue(value: DemoOption): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return String(value);
}

function createSnippet(story: Story, options: DemoOptions): string {
  const optionLines = Object.entries(options)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `    ${key}: ${formatOptionValue(value)},`);

  const optionsCode = optionLines.length > 0 ? `{\n${optionLines.join("\n")}\n  }` : "{}";
  const tagName =
    story.id === "focus-ring" ? "button" : story.id === "invalid-state" ? "input" : "div";
  const elementProps =
    story.id === "invalid-state"
      ? ' className="field" defaultValue="team@protohiro.dev"'
      : story.id === "loading-sheen"
        ? ' className="surface" tabIndex={0}'
        : ' className="button"';
  const content = story.id === "loading-sheen" ? "Syncing design tokens" : story.id === "focus-ring" ? "Continue" : undefined;

  if (tagName === "input") {
    return `import { ${story.hookName} } from "@protohiro/state-layers";

export function ${story.componentName}() {
  const ref = ${story.hookName}(${optionsCode});

  return <input ref={ref}${elementProps} />;
}`;
  }

  return `import { ${story.hookName} } from "@protohiro/state-layers";

export function ${story.componentName}() {
  const ref = ${story.hookName}(${optionsCode});

  return <${tagName} ref={ref}${elementProps}>${content}</${tagName}>;
}`;
}

function readString(options: DemoOptions, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function readNumber(options: DemoOptions, key: string): number | undefined {
  const value = options[key];
  return typeof value === "number" ? value : undefined;
}

function readBoolean(options: DemoOptions, key: string): boolean | undefined {
  const value = options[key];
  return typeof value === "boolean" ? value : undefined;
}

function FocusRingPreview({ options }: StoryPreviewProps) {
  const ref = useFocusRingLayer<HTMLButtonElement>({
    color: readString(options, "color"),
    inset: readString(options, "inset"),
    offset: readString(options, "offset"),
    visible: readBoolean(options, "visible"),
    width: readString(options, "width")
  });

  return (
    <div className="preview-frame preview-frame-button">
      <button ref={ref} className="preview-button">
        Keyboard focus target
      </button>
      <p className="preview-note">Use `Tab` to see the focus-visible ring, or toggle `visible` to inspect the layer without changing host markup.</p>
    </div>
  );
}

function InvalidStatePreview({ options, onOptionChange }: StoryPreviewProps) {
  const active = readBoolean(options, "active") ?? false;
  const ref = useInvalidStateLayer<HTMLInputElement>({
    active,
    color: readString(options, "color"),
    inset: readString(options, "inset"),
    opacity: readNumber(options, "opacity"),
    width: readString(options, "width")
  });

  return (
    <div className="preview-frame">
      <div className="preview-toolbar">
        <span className={`state-pill ${active ? "state-pill-active" : ""}`}>{active ? "Invalid on" : "Invalid off"}</span>
        <label className="mini-switch">
          <input
            checked={active}
            onChange={(event) => onOptionChange("active", event.target.checked)}
            type="checkbox"
          />
          Toggle invalid
        </label>
      </div>
      <label className="preview-field">
        <span>Workspace slug</span>
        <input ref={ref} className="preview-input" defaultValue="protohiro-state-layers" />
      </label>
      <p className="preview-note">This hook is externally controlled. The preview toggle updates the same `active` option as the controls panel.</p>
    </div>
  );
}

function LoadingSheenPreview({ options }: StoryPreviewProps) {
  const ref = useLoadingSheenLayer<HTMLDivElement>({
    active: readBoolean(options, "active"),
    angle: readString(options, "angle"),
    duration: readString(options, "duration"),
    intensity: readNumber(options, "intensity"),
    sheenColor: readString(options, "sheenColor")
  });

  return (
    <div className="preview-frame">
      <div ref={ref} className="preview-surface" tabIndex={0}>
        <p className="surface-kicker">Build pipeline</p>
        <h3>Publishing tokens to the registry</h3>
        <p>Sheen runs on the existing surface with CSS only. No wrappers, no measurement, no JS animation loop.</p>
      </div>
    </div>
  );
}

const STORIES: Story[] = [
  {
    id: "focus-ring",
    title: "Focus Ring",
    description: "Focus-visible outline layer for existing focusable elements and interactive surfaces without wrapper markup.",
    hookName: "useFocusRingLayer",
    componentName: "FocusButton",
    defaults: {
      color: "#f0ab29",
      width: "3px",
      offset: "2px",
      inset: "0px",
      visible: true
    },
    controls: [
      { key: "color", label: "Color", type: "color" },
      { key: "width", label: "Width", type: "text" },
      { key: "offset", label: "Offset", type: "text" },
      { key: "inset", label: "Inset", type: "text" },
      { key: "visible", label: "Visible", type: "checkbox" }
    ],
    preview: FocusRingPreview
  },
  {
    id: "invalid-state",
    title: "Invalid State",
    description: "Error ring layer controlled by external boolean state and mapped to host classes and CSS variables.",
    hookName: "useInvalidStateLayer",
    componentName: "InvalidInput",
    defaults: {
      active: true,
      color: "#ff3b5c",
      width: "2px",
      inset: "-1px",
      opacity: 1
    },
    controls: [
      { key: "active", label: "Active", type: "checkbox" },
      { key: "color", label: "Color", type: "color" },
      { key: "width", label: "Width", type: "text" },
      { key: "inset", label: "Inset", type: "text" },
      { key: "opacity", label: "Opacity", type: "range", min: 0, max: 1, step: 0.01 }
    ],
    preview: InvalidStatePreview
  },
  {
    id: "loading-sheen",
    title: "Loading Sheen",
    description: "Animated loading layer driven by a single pseudo-element and CSS variables instead of runtime loops.",
    hookName: "useLoadingSheenLayer",
    componentName: "LoadingSurface",
    defaults: {
      active: true,
      sheenColor: "#7dd3fc",
      duration: "1600ms",
      angle: "110deg",
      intensity: 0.42
    },
    controls: [
      { key: "active", label: "Active", type: "checkbox" },
      { key: "sheenColor", label: "Sheen", type: "color" },
      { key: "duration", label: "Duration", type: "text" },
      { key: "angle", label: "Angle", type: "text" },
      { key: "intensity", label: "Intensity", type: "range", min: 0, max: 1, step: 0.01 }
    ],
    preview: LoadingSheenPreview
  }
];

function ControlField({
  control,
  value,
  onChange
}: {
  control: DemoControl;
  value: DemoOption;
  onChange: (nextValue: DemoOption) => void;
}) {
  if (control.type === "checkbox") {
    return (
      <label className="control control-checkbox">
        <span>{control.label}</span>
        <input checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      </label>
    );
  }

  return (
    <label className="control">
      <span>{control.label}</span>
      <input
        max={control.max}
        min={control.min}
        onChange={(event) =>
          onChange(
            control.type === "number" || control.type === "range"
              ? Number(event.target.value)
              : event.target.value
          )
        }
        step={control.step}
        type={control.type}
        value={String(value)}
      />
    </label>
  );
}

function StoryPanel({ story }: { story: Story }) {
  const [options, setOptions] = useState<DemoOptions>(story.defaults);
  const snippet = useMemo(() => createSnippet(story, options), [options, story]);

  return (
    <section className="playground-row">
      <div className="preview-pane">
        <div className="panel-head">
          <div>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          <code>{story.hookName}</code>
        </div>
        <story.preview
          options={options}
          onOptionChange={(key, value) =>
            setOptions((current) => ({
              ...current,
              [key]: value
            }))
          }
        />
      </div>
      <div className="controls-pane">
        <div className="controls-card">
          <h3>Controls</h3>
          <div className="controls-grid">
            {story.controls.map((control) => (
              <ControlField
                key={control.key}
                control={control}
                value={options[control.key]}
                onChange={(nextValue) =>
                  setOptions((current) => ({
                    ...current,
                    [control.key]: nextValue
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className="code-card">
          <h3>Usage</h3>
          <pre>
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <main className="demo-page">
      <header className="demo-hero">
        <span className="demo-eyebrow">Protohiro State Layers</span>
        <h1>Playground for visual state hooks on existing elements.</h1>
        <p>
          The demo should behave like our `effects` repo: live preview, editable controls, and real hook usage. Each
          state layer targets one existing element and maps runtime options only to classes and CSS
          variables.
        </p>
        <div className="demo-badges">
          <span className="demo-badge">Hooks only</span>
          <span className="demo-badge">No wrapper JSX</span>
          <span className="demo-badge">Hydration-safe hooks</span>
          <span className="demo-badge">CSS-first runtime</span>
        </div>
      </header>
      <section className="demo-usage">
        <h2>How to read this playground</h2>
        <ol>
          <li>Preview pane shows the hook attached to an existing button, input, or surface.</li>
          <li>Controls mutate only hook options, so you can verify CSS variable and state-class behavior directly.</li>
          <li>Usage snippet stays close to production code instead of hiding the ref contract behind demo-only helpers.</li>
        </ol>
      </section>
      <div className="playground-grid">
        {STORIES.map((story) => (
          <StoryPanel key={story.id} story={story} />
        ))}
      </div>
    </main>
  );
}
