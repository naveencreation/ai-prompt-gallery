import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = ResizeObserverMock as any

