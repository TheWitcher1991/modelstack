import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { EntityDefinition, EntityId, EntityQuery, EntityRead, EntityWrite } from '@modelstack/core'
import { createCrudRepository, type EntityRepository, type HttpClient } from '@modelstack/http'

export interface Paginated<T> {
	results?: T[]
	count?: number
	next?: string | null
	previous?: string | null
}

export interface EntityQueryApi<TEntity extends EntityDefinition<string, string, any>> {
	repo: EntityRepository<TEntity>
	useList: (params?: EntityQuery<TEntity>) => ReturnType<typeof useQuery<EntityRead<TEntity>[]>>
	useDetail: (id: EntityId<TEntity> | null | undefined) => ReturnType<typeof useQuery<EntityRead<TEntity>>>
	useInfiniteList: (params?: EntityQuery<TEntity>) => ReturnType<typeof useInfiniteQuery<EntityRead<TEntity>[]>>
	useCreate: () => ReturnType<typeof useMutation<EntityRead<TEntity>, Error, EntityWrite<TEntity>>>
	useUpdate: (id: EntityId<TEntity>) => ReturnType<typeof useMutation<EntityRead<TEntity>, Error, Partial<EntityWrite<TEntity>>>>
	useDelete: () => ReturnType<typeof useMutation<unknown, Error, EntityId<TEntity>>>
}

export function createCrudQueries<TEntity extends EntityDefinition<string, string, any>>(
	entity: TEntity,
	http: HttpClient,
	repository: EntityRepository<TEntity> = createCrudRepository(entity, http),
): EntityQueryApi<TEntity> {
	const useList: EntityQueryApi<TEntity>['useList'] = params =>
		useQuery({
			queryKey: entity.keys.list(params),
			queryFn: ({ signal }) => repository.findAll(params, signal),
			placeholderData: keepPreviousData,
		})

	const useDetail: EntityQueryApi<TEntity>['useDetail'] = id =>
		useQuery({
			queryKey: id == null ? entity.keys.detail('__empty__') : entity.keys.detail(id),
			queryFn: ({ signal }) => repository.findById(id as EntityId<TEntity>, signal),
			enabled: id != null,
		})

	const useInfiniteList: EntityQueryApi<TEntity>['useInfiniteList'] = params =>
		useInfiniteQuery({
			queryKey: entity.keys.infinite(params),
			queryFn: ({ pageParam, signal }) =>
				repository.findAll({ ...params, page: Number(pageParam) } as EntityQuery<TEntity>, signal),
			initialPageParam: 1,
			getNextPageParam: (lastPage: unknown, _allPages, lastPageParam) => {
				const page = lastPage as Paginated<EntityRead<TEntity>>
				if (!page.count || Number(lastPageParam) >= page.count) return undefined
				return Number(lastPageParam) + 1
			},
		})

	const useCreate: EntityQueryApi<TEntity>['useCreate'] = () => {
		const queryClient = useQueryClient()
		return useMutation({
			mutationFn: data => repository.create(data),
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: entity.keys.all })
			},
		})
	}

	const useUpdate: EntityQueryApi<TEntity>['useUpdate'] = id => {
		const queryClient = useQueryClient()
		return useMutation({
			mutationFn: data => repository.update(id, data),
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: entity.keys.all })
				await queryClient.invalidateQueries({ queryKey: entity.keys.detail(id) })
			},
		})
	}

	const useDelete: EntityQueryApi<TEntity>['useDelete'] = () => {
		const queryClient = useQueryClient()
		return useMutation({
			mutationFn: id => repository.delete(id),
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: entity.keys.all })
			},
		})
	}

	return {
		repo: repository,
		useList,
		useDetail,
		useInfiniteList,
		useCreate,
		useUpdate,
		useDelete,
	}
}
