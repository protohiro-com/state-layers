# Protohiro State Layers – AGENTS.md

## Mission

Protohiro State Layers builds React hooks for visual component states like focus, invalid, loading, success, attention, and pressed.

Core rules:
- no extra DOM nodes
- no layout shifts
- no runtime layout measurements unless strictly required
- CSS-first, variables-driven
- works on existing elements
- composable with design systems

Every state layer MUST:
- work on a single existing element
- preserve forwarded refs
- support SSR + hydration
- mutate only `classList`, attributes, and CSS custom properties
- clean up classes, variables, and listeners on unmount

## Architecture Rules

1. State layers are hooks, never wrapper components.
2. Hook output is a `ref` or ref-merger helper, never JSX.
3. Global CSS is injected once per app lifetime.
4. Runtime options map to CSS variables or state classes only.
5. No JS animation loops unless explicitly approved.
6. No `ResizeObserver` unless the effect is impossible without geometry tracking.
7. Avoid forced sync layout in render and update paths.
8. Do not break existing `className`, `style`, refs, or `data-*`.

## Product Scope

This library is for visual state styling, not state management.

Examples:
- focus ring
- invalid ring
- loading sheen
- success flash
- attention pulse
- pressed inset

Non-goals:
- component primitives
- form validation logic
- animation engine
- accessibility or event-system replacement
- business state orchestration

## Hook Contract

Each hook must define:
- a unique class namespace: `psl-<state>`
- documented CSS variables: `--psl-*`
- visible but safe defaults
- cleanup for removed variables and classes
- graceful fallback behavior

Canonical flow:

`useXStateLayer(options)`:
1. create or receive target ref
2. ensure global CSS
3. attach state class
4. set CSS variables from options
5. attach minimal listeners only if required
6. cleanup on unmount or option change
7. return ref

## CSS Constraints

- respect `border-radius: inherit`
- work in light and dark themes
- must not require wrappers
- use at most one pseudo-element per state layer unless justified
- prefer `@supports` for advanced features
- fail gracefully without hiding content

## API Guidelines

- semantic option names only: `active`, `tone`, `intensity`, `duration`, `inset`
- safe defaults
- stable, additive hook signatures
- compatible with React Aria, but never dependent on it
- accept external booleans and state signals instead of owning business logic

## Testing Minimum

Each state layer must verify:
- class attach and remove behavior
- CSS variable updates on option change
- no hydration mismatch warnings
- no console errors in Strict Mode
- works on `button`, `input`, `div`, and card surfaces
- works inside flex and grid
- preserves existing class names, inline styles, and refs

## Performance Budget

- one global style injection per package load
- no layout recalculation loops
- no per-frame JS work unless explicitly approved
- tiny runtime footprint
- each new state layer must justify its bundle cost

## Repo Shape

- `packages/react` publishes `@protohiro/state-layers`
- `apps/demo` exists to prove the hooks on real elements, not to justify API experiments
- shared runtime logic should stay small and live in the React package until duplication demands otherwise

## Current Foundation Expectations

- shared runtime handles one-time style injection, CSS variable writes, class application, cleanup, and ref merging
- initial hooks are `useFocusRingLayer`, `useInvalidStateLayer`, and `useLoadingSheenLayer`
- new hooks should reuse the runtime only where it removes real duplication across at least two hooks
- if a layer requires `position: relative` for a pseudo-element anchor, restore the prior inline `position` state on cleanup
- tests must remain green across hook behavior, Strict Mode, and SSR hydration smoke coverage before adding more layers
