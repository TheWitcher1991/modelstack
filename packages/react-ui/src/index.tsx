import type { PropsWithChildren, ReactNode } from 'react'

export interface DataLoaderProps extends PropsWithChildren {
	isLoading: boolean
	hasError?: boolean
	countData?: number | string
	loadingFallback?: ReactNode
	errorFallback?: ReactNode
	emptyFallback?: ReactNode
}

export function DataLoader({
	isLoading,
	hasError = false,
	countData,
	children,
	loadingFallback = 'Loading...',
	errorFallback = 'Failed to load data',
	emptyFallback = 'No data',
}: DataLoaderProps) {
	if (isLoading) return loadingFallback
	if (hasError) return errorFallback
	if (countData === 0) return emptyFallback
	return children
}
