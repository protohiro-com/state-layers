import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { STATE_LAYER_CSS, STYLE_ELEMENT_ID } from "./styles";

let hasInjectedStyles = false;
const anchorConsumers = new WeakMap<HTMLElement, { count: number; hadClass: boolean }>();

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const MISSING_ATTRIBUTE = "__psl_missing_attribute__";

export function ensureGlobalStyles(): void {
  if (hasInjectedStyles || typeof document === "undefined") {
    return;
  }

  const existing = document.getElementById(STYLE_ELEMENT_ID);
  if (existing) {
    hasInjectedStyles = true;
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = STATE_LAYER_CSS;
  document.head.appendChild(style);
  hasInjectedStyles = true;
}

export function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === "function") {
        ref(value);
        continue;
      }

      (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

export function useMergedNodeRef<T>(...refs: Array<React.Ref<T> | undefined>): [T | null, React.RefCallback<T>] {
  const [node, setNode] = useState<T | null>(null);
  const mergedRef = useMemo(() => mergeRefs<T>(setNode, ...refs), refs);
  return [node, mergedRef];
}

function addAnchorConsumer(element: HTMLElement): void {
  const current = anchorConsumers.get(element);
  if (!current) {
    anchorConsumers.set(element, {
      count: 1,
      hadClass: element.classList.contains("psl-anchor")
    });

    element.classList.add("psl-anchor");
    return;
  }

  anchorConsumers.set(element, {
    ...current,
    count: current.count + 1
  });
}

function removeAnchorConsumer(element: HTMLElement): void {
  const currentCount = anchorConsumers.get(element);
  if (!currentCount) {
    return;
  }

  if (currentCount.count === 1) {
    anchorConsumers.delete(element);
    if (!currentCount.hadClass) {
      element.classList.remove("psl-anchor");
    }
    return;
  }

  anchorConsumers.set(element, {
    ...currentCount,
    count: currentCount.count - 1
  });
}

type AppliedLayer = {
  update(nextVariables: Record<string, string | undefined>, active: boolean, attributes?: Record<string, string | undefined>): void;
  cleanup(): void;
};

export function applyStateLayer(
  element: HTMLElement,
  className: string,
  requireAnchor = true
): AppliedLayer {
  const touchedVariables = new Set<string>();
  const baselineAttributes = new Map<string, string>();
  let currentAttributes: Record<string, string | undefined> = {};
  let anchorApplied = false;
  let isActive = false;

  const sync = (
    nextVariables: Record<string, string | undefined>,
    nextActive: boolean,
    nextAttributes?: Record<string, string | undefined>
  ) => {
    if (nextActive) {
      element.classList.add(className);

      if (requireAnchor && !anchorApplied && !element.style.position) {
        addAnchorConsumer(element);
        anchorApplied = true;
      }
    } else {
      element.classList.remove(className);
      if (anchorApplied) {
        removeAnchorConsumer(element);
        anchorApplied = false;
      }
    }

    const nextVariableEntries = nextActive ? nextVariables : {};
    for (const variable of Array.from(touchedVariables)) {
      if (!(variable in nextVariableEntries) || nextVariableEntries[variable] == null) {
        element.style.removeProperty(variable);
        touchedVariables.delete(variable);
      }
    }

    for (const [variable, value] of Object.entries(nextVariableEntries)) {
      if (value == null) {
        element.style.removeProperty(variable);
        touchedVariables.delete(variable);
      } else {
        element.style.setProperty(variable, value);
        touchedVariables.add(variable);
      }
    }

    const nextAttributeEntries = nextActive ? nextAttributes ?? {} : {};
    for (const name of Object.keys(currentAttributes)) {
      if (!(name in nextAttributeEntries) || nextAttributeEntries[name] == null) {
        const baselineValue = baselineAttributes.get(name);
        if (baselineValue == null || baselineValue === MISSING_ATTRIBUTE) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, baselineValue);
        }
      }
    }

    for (const [name, value] of Object.entries(nextAttributeEntries)) {
      if (!baselineAttributes.has(name)) {
        baselineAttributes.set(name, element.getAttribute(name) ?? MISSING_ATTRIBUTE);
      }

      if (value == null) {
        const baselineValue = baselineAttributes.get(name);
        if (baselineValue == null || baselineValue === MISSING_ATTRIBUTE) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, baselineValue);
        }
      } else {
        element.setAttribute(name, value);
      }
    }

    currentAttributes = { ...nextAttributeEntries };
    isActive = nextActive;
  };

  return {
    update(nextVariables, nextActive, nextAttributes) {
      sync(nextVariables, nextActive, nextAttributes);
    },
    cleanup() {
      if (isActive) {
        element.classList.remove(className);
      }

      if (anchorApplied) {
        removeAnchorConsumer(element);
      }

      for (const variable of touchedVariables) {
        element.style.removeProperty(variable);
      }

      for (const name of Object.keys(currentAttributes)) {
        const baselineValue = baselineAttributes.get(name);
        if (baselineValue == null || baselineValue === MISSING_ATTRIBUTE) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, baselineValue);
        }
      }

      currentAttributes = {};
      isActive = false;
      anchorApplied = false;
    }
  };
}

type LayerHookArgs = {
  active?: boolean;
  className: string;
  variables?: Record<string, string | undefined>;
  attributes?: Record<string, string | undefined>;
  requireAnchor?: boolean;
};

export function useStateLayer<T extends HTMLElement>({
  active = true,
  className,
  variables = {},
  attributes,
  requireAnchor = true
}: LayerHookArgs): React.RefCallback<T> {
  const [node, ref] = useMergedNodeRef<T>();
  const layerRef = useRef<AppliedLayer | null>(null);

  useIsomorphicLayoutEffect(() => {
    ensureGlobalStyles();
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!node) {
      return;
    }

    const layer = applyStateLayer(node, className, requireAnchor);
    layerRef.current = layer;
    layer.update(variables, active, attributes);

    return () => {
      layer.cleanup();
      layerRef.current = null;
    };
  }, [className, node, requireAnchor]);

  useIsomorphicLayoutEffect(() => {
    layerRef.current?.update(variables, active, attributes);
  }, [active, attributes, variables]);

  return useCallback((nextNode: T | null) => {
    ref(nextNode);
  }, [ref]);
}
