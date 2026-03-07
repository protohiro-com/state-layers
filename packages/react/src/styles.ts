export const STYLE_ELEMENT_ID = "protohiro-state-layers-styles";

// Shared stylesheet architecture:
// - `.psl-anchor` is the minimal positioning utility used only when a layer needs an anchored pseudo-element.
// - `.psl-focus-ring` variables: --psl-focus-ring-color, --psl-focus-ring-inset, --psl-focus-ring-offset, --psl-focus-ring-width
// - `.psl-invalid` variables: --psl-invalid-color, --psl-invalid-inset, --psl-invalid-width, --psl-invalid-opacity
// - `.psl-loading` variables: --psl-loading-angle, --psl-loading-duration, --psl-loading-intensity, --psl-loading-sheen-color
export const STATE_LAYER_CSS = `
.psl-anchor {
  position: relative;
}

.psl-focus-ring,
.psl-invalid,
.psl-loading {
  isolation: isolate;
}

.psl-focus-ring {
  --psl-focus-ring-color: rgba(59, 130, 246, 0.9);
  --psl-focus-ring-inset: 0px;
  --psl-focus-ring-offset: 0px;
  --psl-focus-ring-width: 2px;
}

.psl-focus-ring::before {
  border-radius: inherit;
  box-shadow: 0 0 0 var(--psl-focus-ring-width) var(--psl-focus-ring-color);
  content: "";
  inset: calc(var(--psl-focus-ring-inset) - var(--psl-focus-ring-offset));
  opacity: 1;
  pointer-events: none;
  position: absolute;
  transition: opacity 140ms ease, transform 140ms ease;
  transform: scale(1);
}

.psl-invalid,
.psl-loading {
  --psl-invalid-color: rgba(239, 68, 68, 0.92);
  --psl-invalid-inset: 0px;
  --psl-invalid-shadow-width: 0px;
  --psl-invalid-width: 0px;
  --psl-invalid-opacity: 0;
  --psl-invalid-visible-color: var(--psl-invalid-color);
  --psl-loading-angle: 110deg;
  --psl-loading-duration: 1400ms;
  --psl-loading-intensity: 0;
  --psl-loading-sheen-color: rgba(255, 255, 255, 0.9);
}

.psl-invalid::after,
.psl-loading::after {
  border-radius: inherit;
  box-shadow: 0 0 0 var(--psl-invalid-shadow-width) var(--psl-invalid-visible-color);
  content: "";
  inset: var(--psl-invalid-inset);
  opacity: var(--psl-invalid-opacity);
  pointer-events: none;
  position: absolute;
}

.psl-loading::after,
.psl-invalid.psl-loading::after {
  background-image: linear-gradient(
    var(--psl-loading-angle),
    transparent 0%,
    transparent 45%,
    var(--psl-loading-sheen-color) 50%,
    transparent 100%
  );
  background-position: 200% 50%;
  background-repeat: no-repeat;
  background-size: 220% 100%;
}

.psl-loading:not(.psl-invalid)::after {
  opacity: var(--psl-loading-intensity);
}

.psl-invalid.psl-loading::after {
  opacity: var(--psl-invalid-opacity);
}

.psl-invalid:is(input, textarea, select) {
  --psl-invalid-shadow-width: 0px;
}

.psl-invalid:is(input, textarea, select) {
  outline: var(--psl-invalid-width-input, 0px) solid var(--psl-invalid-visible-color);
  outline-offset: var(--psl-invalid-inset);
}

.psl-invalid {
  --psl-invalid-shadow-width: var(--psl-invalid-width);
  --psl-invalid-width-input: var(--psl-invalid-width);
}

.psl-loading::after {
  animation: psl-loading-sheen var(--psl-loading-duration) linear infinite;
}

@keyframes psl-loading-sheen {
  from {
    background-position: 200% 50%;
  }

  to {
    background-position: -120% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .psl-loading::after {
    animation-duration: calc(var(--psl-loading-duration) * 2);
  }
}

@supports (color: color-mix(in srgb, black 50%, white 50%)) {
  .psl-focus-ring {
    --psl-focus-ring-color: color-mix(in srgb, #3b82f6 78%, white 22%);
  }

  .psl-invalid,
  .psl-loading {
    --psl-invalid-color: color-mix(in srgb, #ef4444 82%, white 18%);
    --psl-invalid-visible-color: color-mix(
      in srgb,
      var(--psl-invalid-color) calc(var(--psl-invalid-opacity) * 100%),
      transparent
    );
  }

  .psl-invalid:not(.psl-loading)::after {
    opacity: 1;
  }

  .psl-loading::after,
  .psl-invalid.psl-loading::after {
    background-image: linear-gradient(
      var(--psl-loading-angle),
      transparent 0%,
      color-mix(in srgb, var(--psl-loading-sheen-color) calc(var(--psl-loading-intensity) * 100%), transparent) 45%,
      color-mix(in srgb, var(--psl-loading-sheen-color) calc(var(--psl-loading-intensity) * 100%), transparent) 55%,
      transparent 100%
    );
    opacity: 1;
  }
}
`;
