import type { PropsWithChildren, ReactNode } from 'react'

export interface DataLoaderProps<TData = unknown> extends PropsWithChildren {
  isLoading: boolean
  hasError?: boolean
  data?: TData | null
  countData?: number | string
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
  emptyFallback?: ReactNode
  render?: (data: TData) => ReactNode
}

export function DataLoader<TData = unknown>({
  isLoading,
  hasError = false,
  data,
  countData,
  children,
  loadingFallback = 'Loading...',
  errorFallback = 'Failed to load data',
  emptyFallback = 'No data',
  render,
}: DataLoaderProps<TData>) {
  if (isLoading) return loadingFallback
  if (hasError) return errorFallback
  if (countData === 0) return emptyFallback
  if (render && data != null) return render(data)
  return children
}
