import { useMemo } from "react";
import { mergeRefs, useStateLayer } from "../runtime";

export type InvalidStateLayerOptions<T extends HTMLElement> = {
  active?: boolean;
  color?: string;
  inset?: string;
  opacity?: number;
  ref?: React.Ref<T>;
  width?: string;
};

export function useInvalidStateLayer<T extends HTMLElement = HTMLElement>(
  options: InvalidStateLayerOptions<T> = {}
): React.RefCallback<T> {
  const { active = false, color, inset, opacity, ref, width } = options;

  const layerRef = useStateLayer<T>({
    active,
    className: "psl-invalid",
    variables: {
      "--psl-invalid-color": color,
      "--psl-invalid-inset": inset,
      "--psl-invalid-opacity": opacity == null ? undefined : String(opacity),
      "--psl-invalid-width": width
    }
  });

  return useMemo(() => mergeRefs(layerRef, ref), [layerRef, ref]);
}
