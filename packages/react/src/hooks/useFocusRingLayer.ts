import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useMergedNodeRef, useStateLayer } from "../runtime";

export type FocusRingLayerOptions<T extends HTMLElement> = {
  color?: string;
  inset?: string;
  offset?: string;
  visible?: boolean;
  width?: string;
  ref?: React.Ref<T>;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readFocusVisible(node: HTMLElement): boolean {
  if (typeof node.matches === "function") {
    try {
      return node.matches(":focus-visible");
    } catch {
      return document.activeElement === node;
    }
  }

  return document.activeElement === node;
}

export function useFocusRingLayer<T extends HTMLElement = HTMLElement>(
  options: FocusRingLayerOptions<T> = {}
): React.RefCallback<T> {
  const { color, inset, offset, ref, visible, width } = options;
  const [focusVisible, setFocusVisible] = useState(Boolean(visible));
  const [node, mergedRef] = useMergedNodeRef<T>(ref);

  useIsomorphicLayoutEffect(() => {
    if (visible != null) {
      setFocusVisible(visible);
      return;
    }

    if (!node) {
      return;
    }

    setFocusVisible(readFocusVisible(node));
  }, [node, visible]);

  useEffect(() => {
    if (!node || visible != null) {
      return;
    }

    const onFocus = () => {
      setFocusVisible(readFocusVisible(node));
    };
    const onBlur = () => setFocusVisible(false);

    node.addEventListener("focus", onFocus);
    node.addEventListener("blur", onBlur);

    return () => {
      node.removeEventListener("focus", onFocus);
      node.removeEventListener("blur", onBlur);
    };
  }, [node, visible]);

  const layerRef = useStateLayer<T>({
    active: focusVisible,
    className: "psl-focus-ring",
    variables: {
      "--psl-focus-ring-color": color,
      "--psl-focus-ring-inset": inset,
      "--psl-focus-ring-offset": offset,
      "--psl-focus-ring-width": width
    }
  });

  return useMemo(() => {
    return (nextNode: T | null) => {
      mergedRef(nextNode);
      layerRef(nextNode);
    };
  }, [layerRef, mergedRef]);
}
