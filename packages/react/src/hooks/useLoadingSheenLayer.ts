import { useMemo } from "react";
import { mergeRefs, useStateLayer } from "../runtime";

export type LoadingSheenLayerOptions<T extends HTMLElement> = {
  active?: boolean;
  angle?: string;
  duration?: string;
  intensity?: number;
  ref?: React.Ref<T>;
  sheenColor?: string;
};

export function useLoadingSheenLayer<T extends HTMLElement = HTMLElement>(
  options: LoadingSheenLayerOptions<T> = {}
): React.RefCallback<T> {
  const { active = false, angle, duration, intensity, ref, sheenColor } = options;

  const layerRef = useStateLayer<T>({
    active,
    className: "psl-loading",
    variables: {
      "--psl-loading-angle": angle,
      "--psl-loading-duration": duration,
      "--psl-loading-intensity": intensity == null ? undefined : String(intensity),
      "--psl-loading-sheen-color": sheenColor
    }
  });

  return useMemo(() => mergeRefs(layerRef, ref), [layerRef, ref]);
}
