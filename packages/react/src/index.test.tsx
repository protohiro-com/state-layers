import { StrictMode, act, createRef, useEffect } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  mergeRefs,
  useFocusRingLayer,
  useInvalidStateLayer,
  useLoadingSheenLayer
} from "./index";
import { applyStateLayer } from "./runtime";
import { STATE_LAYER_CSS } from "./styles";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function FocusHarness(props: Parameters<typeof useFocusRingLayer<HTMLButtonElement>>[0]) {
  const ref = useFocusRingLayer<HTMLButtonElement>(props);
  return (
    <button ref={ref} className="existing-class" style={{ color: "red" }} data-surface="button">
      Focus
    </button>
  );
}

function CombinedHarness({
  loading,
  invalid,
  visible
}: {
  loading: boolean;
  invalid: boolean;
  visible: boolean;
}) {
  const focusRef = useFocusRingLayer<HTMLDivElement>({
    color: "rgb(59 130 246 / 0.9)",
    visible
  });
  const invalidRef = useInvalidStateLayer<HTMLDivElement>({ active: invalid, width: "2px" });
  const loadingRef = useLoadingSheenLayer<HTMLDivElement>({ active: loading, duration: "1800ms" });

  return (
    <div
      ref={mergeRefs(focusRef, invalidRef, loadingRef)}
      className="card"
      style={{ borderRadius: "20px" }}
      data-kind="card"
    >
      Card
    </div>
  );
}

it("composes active layers on a single element and keeps the shared anchor until the last layer unmounts", () => {
  const { rerender, unmount, container } = render(<CombinedHarness loading invalid visible />);
  const card = container.firstElementChild as HTMLDivElement;

  expect(card.classList.contains("psl-focus-ring")).toBe(true);
  expect(card.classList.contains("psl-invalid")).toBe(true);
  expect(card.classList.contains("psl-loading")).toBe(true);
  expect(card.classList.contains("psl-anchor")).toBe(true);

  rerender(<CombinedHarness loading={false} invalid visible={false} />);

  expect(card.classList.contains("psl-focus-ring")).toBe(false);
  expect(card.classList.contains("psl-loading")).toBe(false);
  expect(card.classList.contains("psl-invalid")).toBe(true);
  expect(card.classList.contains("psl-anchor")).toBe(true);

  rerender(<CombinedHarness loading={false} invalid={false} visible={false} />);

  expect(card.classList.contains("psl-invalid")).toBe(false);
  expect(card.classList.contains("psl-anchor")).toBe(false);

  unmount();
  expect(card.classList.contains("psl-focus-ring")).toBe(false);
  expect(card.classList.contains("psl-invalid")).toBe(false);
  expect(card.classList.contains("psl-loading")).toBe(false);
});

it("updates CSS custom properties without tearing classes down on routine rerenders", () => {
  let classMutationCount = 0;

  function Harness({ color, width }: { color: string; width: string }) {
    const ref = useInvalidStateLayer<HTMLDivElement>({
      active: true,
      color,
      width
    });

    useEffect(() => {
      const node = document.querySelector("[data-testid='surface']");
      if (!(node instanceof HTMLDivElement)) {
        return;
      }

      const observer = new MutationObserver((mutations) => {
        classMutationCount += mutations.filter((mutation) => mutation.attributeName === "class").length;
      });

      observer.observe(node, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }, []);

    return (
      <div data-testid="surface" ref={ref}>
        stable
      </div>
    );
  }

  const { rerender, container } = render(<Harness color="#ef4444" width="2px" />);
  const surface = container.firstElementChild as HTMLDivElement;

  expect(surface.classList.contains("psl-invalid")).toBe(true);
  expect(surface.style.getPropertyValue("--psl-invalid-color")).toBe("#ef4444");
  expect(surface.style.getPropertyValue("--psl-invalid-width")).toBe("2px");

  rerender(<Harness color="#b91c1c" width="4px" />);

  expect(surface.classList.contains("psl-invalid")).toBe(true);
  expect(surface.style.getPropertyValue("--psl-invalid-color")).toBe("#b91c1c");
  expect(surface.style.getPropertyValue("--psl-invalid-width")).toBe("4px");
  expect(classMutationCount).toBe(0);
});

it("does not leave classes, attributes, anchor utilities, or variables behind when inactive", () => {
  const externalRef = createRef<HTMLInputElement>();

  function Harness({ active }: { active: boolean }) {
    const ref = useInvalidStateLayer<HTMLInputElement>({
      active,
      color: "#dc2626",
      ref: externalRef,
      width: "2px"
    });

    return <input ref={ref} className="field" style={{ background: "white" }} data-role="field" />;
  }

  const { rerender, container, unmount } = render(<Harness active />);
  const input = container.firstElementChild as HTMLInputElement;

  expect(externalRef.current).toBe(input);
  expect(input.classList.contains("field")).toBe(true);
  expect(input.classList.contains("psl-invalid")).toBe(true);
  expect(input.style.getPropertyValue("--psl-invalid-width")).toBe("2px");

  rerender(<Harness active={false} />);

  expect(input.classList.contains("field")).toBe(true);
  expect(input.classList.contains("psl-invalid")).toBe(false);
  expect(input.classList.contains("psl-anchor")).toBe(false);
  expect(input.style.getPropertyValue("--psl-invalid-width")).toBe("");
  expect(input.style.background).toBe("white");
  expect(input.getAttribute("data-role")).toBe("field");

  unmount();
  expect(input.classList.contains("field")).toBe(true);
  expect(input.style.background).toBe("white");
  expect(input.getAttribute("data-role")).toBe("field");
});

it("uses focus-visible semantics when the browser exposes them", () => {
  const originalMatches = HTMLElement.prototype.matches;
  const matchesSpy = vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (this: HTMLElement, selector: string) {
    if (selector === ":focus-visible") {
      return this.dataset.focusVisible === "true";
    }

    return originalMatches.call(this, selector);
  });

  const { container, rerender } = render(<FocusHarness color="#0f172a" />);
  const button = container.firstElementChild as HTMLButtonElement;

  button.dataset.focusVisible = "false";
  fireEvent.focus(button);
  expect(button.classList.contains("psl-focus-ring")).toBe(false);

  button.dataset.focusVisible = "true";
  fireEvent.blur(button);
  fireEvent.focus(button);
  expect(button.classList.contains("psl-focus-ring")).toBe(true);

  rerender(<FocusHarness color="#0f172a" visible={false} />);
  expect(button.classList.contains("psl-focus-ring")).toBe(false);

  matchesSpy.mockRestore();
});

it("falls back without throwing when :focus-visible is unsupported", () => {
  const originalMatches = HTMLElement.prototype.matches;
  const matchesSpy = vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (this: HTMLElement, selector: string) {
    if (selector === ":focus-visible") {
      throw new DOMException("Unsupported selector", "SyntaxError");
    }

    return originalMatches.call(this, selector);
  });

  const { container } = render(<FocusHarness color="#0f172a" />);
  const button = container.firstElementChild as HTMLButtonElement;

  act(() => {
    button.focus();
    fireEvent.focus(button);
  });
  expect(button.classList.contains("psl-focus-ring")).toBe(true);

  matchesSpy.mockRestore();
});

it("syncs focus state when the element is already focused on mount", () => {
  const originalMatches = HTMLElement.prototype.matches;
  const autoFocusSpy = vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (this: HTMLElement, selector: string) {
    if (selector === ":focus-visible") {
      return document.activeElement === this;
    }

    return originalMatches.call(this, selector);
  });

  function AutoFocusHarness() {
    const ref = useFocusRingLayer<HTMLButtonElement>();
    return (
      <button ref={ref} autoFocus>
        Auto focus
      </button>
    );
  }

  const { container } = render(<AutoFocusHarness />);
  const button = container.firstElementChild as HTMLButtonElement;

  expect(document.activeElement).toBe(button);
  expect(button.classList.contains("psl-focus-ring")).toBe(true);

  autoFocusSpy.mockRestore();
});

it("keeps layer classes attached inside flex and grid containers", () => {
  function Harness() {
    const invalidRef = useInvalidStateLayer<HTMLDivElement>({ active: true, width: "2px" });
    const loadingRef = useLoadingSheenLayer<HTMLDivElement>({ active: true, intensity: 0.2 });

    return (
      <div style={{ display: "grid" }}>
        <div style={{ display: "flex" }}>
          <div data-testid="surface" ref={mergeRefs(invalidRef, loadingRef)}>
            surface
          </div>
        </div>
      </div>
    );
  }

  const { container } = render(<Harness />);
  const node = container.querySelector("[data-testid='surface']") as HTMLDivElement;

  expect(node.classList.contains("psl-invalid")).toBe(true);
  expect(node.classList.contains("psl-loading")).toBe(true);
  expect(node.classList.contains("psl-anchor")).toBe(true);
});

it("maps loading intensity to a real fallback opacity path", () => {
  expect(STATE_LAYER_CSS).toContain("opacity: var(--psl-loading-intensity);");

  function Harness() {
    const ref = useLoadingSheenLayer<HTMLDivElement>({ active: true, intensity: 0.35 });
    return <div ref={ref}>loading</div>;
  }

  const { container } = render(<Harness />);
  const node = container.firstElementChild as HTMLDivElement;

  expect(node.style.getPropertyValue("--psl-loading-intensity")).toBe("0.35");
  expect(node.classList.contains("psl-loading")).toBe(true);
});

it("restores pre-existing anchor class ownership on cleanup", () => {
  function Harness({ active }: { active: boolean }) {
    const ref = useInvalidStateLayer<HTMLDivElement>({ active, width: "2px" });
    return (
      <div ref={ref} className="psl-anchor user-class">
        anchored
      </div>
    );
  }

  const { container, rerender, unmount } = render(<Harness active />);
  const node = container.firstElementChild as HTMLDivElement;

  expect(node.classList.contains("psl-anchor")).toBe(true);
  expect(node.classList.contains("psl-invalid")).toBe(true);

  rerender(<Harness active={false} />);
  expect(node.className).toContain("psl-anchor");
  expect(node.classList.contains("psl-invalid")).toBe(false);

  unmount();
  expect(node.className).toContain("psl-anchor");
});

it("restores previous attribute values when runtime-managed attributes are removed", () => {
  const element = document.createElement("div");
  element.setAttribute("data-state", "existing");

  const layer = applyStateLayer(element, "psl-invalid", false);
  layer.update({}, true, {
    "data-state": "invalid",
    "data-owned": "true"
  });

  expect(element.getAttribute("data-state")).toBe("invalid");
  expect(element.getAttribute("data-owned")).toBe("true");

  layer.update({}, false);

  expect(element.getAttribute("data-state")).toBe("existing");
  expect(element.hasAttribute("data-owned")).toBe(false);
});

it("does not revert host inline position changes made after mount", () => {
  const element = document.createElement("div");
  const layer = applyStateLayer(element, "psl-invalid", true);

  layer.update({}, true);
  expect(element.classList.contains("psl-anchor")).toBe(true);

  element.style.position = "sticky";
  layer.cleanup();

  expect(element.classList.contains("psl-anchor")).toBe(false);
  expect(element.style.position).toBe("sticky");
});

it("preserves invalid opacity in the shared fallback selector", () => {
  expect(STATE_LAYER_CSS).toContain(".psl-loading:not(.psl-invalid)::after");
  expect(STATE_LAYER_CSS).toContain(".psl-invalid.psl-loading::after {\n  opacity: var(--psl-invalid-opacity);");
});

it("runs in Strict Mode without console errors", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  render(
    <StrictMode>
      <CombinedHarness loading invalid visible />
    </StrictMode>
  );

  expect(consoleError).not.toHaveBeenCalled();
});

it("renders on the server and hydrates without mismatch warnings", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const html = renderToString(<FocusHarness color="#2563eb" />);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  await act(async () => {
    hydrateRoot(container, <FocusHarness color="#2563eb" />);
  });

  const button = container.querySelector("button") as HTMLButtonElement;
  button.dataset.focusVisible = "true";
  fireEvent.focus(button);

  const unexpectedErrors = consoleError.mock.calls.filter(([message]) => {
    if (typeof message !== "string") {
      return true;
    }

    return !message.includes("useLayoutEffect does nothing on the server");
  });

  expect(unexpectedErrors).toHaveLength(0);
});
