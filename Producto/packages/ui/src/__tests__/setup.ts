import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Framer-motion renders plain HTML in tests to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_: unknown, tag: string) =>
      React.forwardRef(({ children, ...props }: any, ref: any) => {
        // Strip framer-motion-only props before passing to DOM element
        const {
          initial, animate, exit, variants, transition, layout,
          whileHover, whileTap, whileInView, drag, dragConstraints,
          ...domProps
        } = props
        return React.createElement(tag, { ...domProps, ref }, children)
      }),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
  useInView: () => true,
}))

// @menu-bites/auth is not available in the UI package — provide minimal stubs
vi.mock('@menu-bites/auth', () => ({
  getPublicImageUrl: vi.fn((path: string | null) => path || '/placeholder-food.jpg'),
  formatCLP: vi.fn((n: number) => `$${n.toLocaleString()}`),
  timeAgo: vi.fn(() => 'hace un momento'),
  formatPrice: vi.fn((n: number) => `$${n.toLocaleString()}`),
}))
