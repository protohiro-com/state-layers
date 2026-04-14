# Protohiro State Layers

Protohiro State Layers is a small React library for visual state layers on existing elements. It focuses on the narrow problem of rendering states like focus, invalid, and loading without wrapper components or runtime geometry work.

Supported React versions: `18.x` and `19.x`.

This library is for design systems and product surfaces that already have real elements, existing class names, forwarded refs, and their own business state. It is not a component kit, not a validation engine, and not another state-management abstraction.

## Principles

- Hooks only. No wrapper JSX.
- Single existing element per state layer.
- CSS-first and variables-driven.
- Hydration-safe hook behavior.
- Runtime mutates only classes, attributes, and CSS custom properties.
- Global stylesheet injected once per app lifetime.
- Multiple layers can target the same element within the supported layer set.

## Workspace

- [`packages/react`](./packages/react) publishes `@protohiro/state-layers`

## Included first-pass hooks

- `useFocusRingLayer`
- `useInvalidStateLayer`
- `useLoadingSheenLayer`

Each hook returns a ref callback. Compose multiple hooks with `mergeRefs` when several layers target the same element.
`useFocusRingLayer` is specifically a focus-visible treatment for existing focusable elements, not a hover or click effect.

## Hook contracts

### `useFocusRingLayer(options)`

Options:
- `color?: string`
- `inset?: string`
- `offset?: string`
- `visible?: boolean`
- `width?: string`
- `ref?: React.Ref<T>`

CSS variables:
- `--psl-focus-ring-color`
- `--psl-focus-ring-inset`
- `--psl-focus-ring-offset`
- `--psl-focus-ring-width`

Class namespace:
- `psl-focus-ring`

Notes:
- Uses `:focus-visible` when supported.
- Falls back to active-focus detection when selector support is missing.
- Renders on `::before`.

### `useInvalidStateLayer(options)`

Options:
- `active?: boolean`
- `color?: string`
- `inset?: string`
- `opacity?: number`
- `width?: string`
- `ref?: React.Ref<T>`

CSS variables:
- `--psl-invalid-color`
- `--psl-invalid-inset`
- `--psl-invalid-opacity`
- `--psl-invalid-width`

Class namespace:
- `psl-invalid`

Notes:
- Controlled entirely by external state.
- Uses `outline` on native form controls and `::after` on other supported hosts.

### `useLoadingSheenLayer(options)`

Options:
- `active?: boolean`
- `angle?: string`
- `duration?: string`
- `intensity?: number`
- `sheenColor?: string`
- `ref?: React.Ref<T>`

CSS variables:
- `--psl-loading-angle`
- `--psl-loading-duration`
- `--psl-loading-intensity`
- `--psl-loading-sheen-color`

Class namespace:
- `psl-loading`

Notes:
- Animated entirely in CSS.
- Uses `::after`.
- Fallback styling preserves `intensity` through opacity when advanced color blending is unavailable.

## Development

```bash
npm install
npm run test
npm run build
```

## Tradeoffs in this first pass

- The library injects one shared stylesheet at runtime rather than shipping a separate required CSS import. Hook markup is hydration-safe, but server HTML is intentionally unstyled until hydration.
- Focus, invalid, and loading layers share the same host element within the current runtime model: focus renders on `::before`, invalid and loading compose on `::after`, and the runtime reference-counts its anchor utility.
- Focus ring follows the browser's `:focus-visible` signal when it is available and falls back to active-focus detection when selector support is missing.
- The CSS targets modern browsers first. Advanced color blending uses `@supports` fallbacks rather than universal parity across every engine.

## Testing scope

The package test suite covers single-element layer composition, CSS variable updates without teardown churn, cleanup of classes, attributes, anchor ownership, and variables when layers go inactive, focus-visible fallback behavior, flex/grid smoke coverage, preservation of existing class/style/ref behavior, Strict Mode smoke coverage, and SSR render plus hydration smoke checks.
