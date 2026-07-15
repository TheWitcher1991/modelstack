import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  EntityDefinition,
  EntityId,
  EntityQuery,
  EntityRead,
  EntityWrite,
} from '@modelstack/core'
import {
  createCrudRepository,
  type EntityRepository,
  type HttpClient,
} from '@modelstack/http'

export interface PaginationAdapter<TData, TItem> {
  getItems: (data: TData) => TItem[]
  getNextPageParam: (data: TData, lastPageParam: number) => number | undefined
}

export const drfPagination = <T>(): PaginationAdapter<
  { results?: T[]; count?: number },
  T
> => ({
  getItems: data => data.results ?? [],
  getNextPageParam: (data, lastPageParam) => {
    if (!data.count || lastPageParam >= Math.ceil(data.count / 25)) return undefined
    return lastPageParam + 1
  },
})

export const offsetPagination = <T>(
  pageSize: number,
): PaginationAdapter<{ data: T[]; total: number }, T> => ({
  getItems: data => data.data,
  getNextPageParam: (data, lastPageParam) => {
    if (lastPageParam * pageSize >= data.total) return undefined
    return lastPageParam + 1
  },
})

export const cursorPagination = <T>(): PaginationAdapter<
  { data: T[]; next_cursor: string | null },
  T
> => ({
  getItems: data => data.data,
  getNextPageParam: data => (data.next_cursor ? Number(data.next_cursor) : undefined),
})

export interface MutationCallbacks<
  TEntity extends EntityDefinition<string, string, any>,
> {
  onMutate?: (variables: EntityWrite<TEntity>) => Promise<unknown> | unknown
  onError?: (error: Error, variables: EntityWrite<TEntity>, context: unknown) => void
  onSettled?: () => void
}

export interface EntityQueryApi<TEntity extends EntityDefinition<string, string, any>> {
  repo: EntityRepository<TEntity>
  useList: (
    params?: EntityQuery<TEntity>,
  ) => ReturnType<typeof useQuery<EntityRead<TEntity>[]>>
  useDetail: (
    id: EntityId<TEntity> | null | undefined,
  ) => ReturnType<typeof useQuery<EntityRead<TEntity>>>
  useInfiniteList: (
    params?: EntityQuery<TEntity>,
  ) => ReturnType<typeof useInfiniteQuery<EntityRead<TEntity>[]>>
  useCreate: (
    callbacks?: MutationCallbacks<TEntity>,
  ) => ReturnType<typeof useMutation<EntityRead<TEntity>, Error, EntityWrite<TEntity>>>
  useUpdate: (
    id: EntityId<TEntity>,
    callbacks?: MutationCallbacks<TEntity>,
  ) => ReturnType<
    typeof useMutation<EntityRead<TEntity>, Error, Partial<EntityWrite<TEntity>>>
  >
  useDelete: (
    callbacks?: Pick<MutationCallbacks<TEntity>, 'onMutate' | 'onError' | 'onSettled'>,
  ) => ReturnType<typeof useMutation<unknown, Error, EntityId<TEntity>>>
}

export function createCrudQueries<TEntity extends EntityDefinition<string, string, any>>(
  entity: TEntity,
  http: HttpClient,
  repository: EntityRepository<TEntity> = createCrudRepository(entity, http),
  pagination?: PaginationAdapter<unknown, EntityRead<TEntity>>,
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

  const useInfiniteList: EntityQueryApi<TEntity>['useInfiniteList'] = params => {
    const adapter = pagination ?? drfPagination<EntityRead<TEntity>>()

    return useInfiniteQuery({
      queryKey: entity.keys.infinite(params),
      queryFn: ({ pageParam, signal }) =>
        repository.findAll(
          { ...params, page: Number(pageParam) } as EntityQuery<TEntity>,
          signal,
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        adapter.getNextPageParam(lastPage as never, Number(lastPageParam)),
      select: data => ({
        ...data,
        pages: data.pages.map(page => adapter.getItems(page as never)),
        pageParams: data.pageParams,
      }),
    })
  }

  const useCreate: EntityQueryApi<TEntity>['useCreate'] = (callbacks?) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: data => repository.create(data),
      onMutate: async variables => {
        const previousData = await callbacks?.onMutate?.(variables)
        return { previousData }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: entity.keys.all })
      },
      onError: (_err, variables, context) => {
        callbacks?.onError?.(_err, variables, context?.previousData)
      },
      onSettled: () => {
        callbacks?.onSettled?.()
      },
    })
  }

  const useUpdate: EntityQueryApi<TEntity>['useUpdate'] = (id, callbacks?) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: data => repository.update(id, data),
      onMutate: async variables => {
        const previousDetail = queryClient.getQueryData(entity.keys.detail(id))
        await queryClient.cancelQueries({ queryKey: entity.keys.detail(id) })
        queryClient.setQueryData(
          entity.keys.detail(id),
          (old: EntityRead<TEntity> | undefined) =>
            old ? { ...old, ...variables } : old,
        )
        const previousData = await callbacks?.onMutate?.(
          variables as EntityWrite<TEntity>,
        )
        return { previousDetail, previousData }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: entity.keys.all })
        await queryClient.invalidateQueries({ queryKey: entity.keys.detail(id) })
      },
      onError: (_err, variables, context) => {
        if (context?.previousDetail !== undefined) {
          queryClient.setQueryData(entity.keys.detail(id), context.previousDetail)
        }
        callbacks?.onError?.(
          _err,
          variables as EntityWrite<TEntity>,
          context?.previousData,
        )
      },
      onSettled: () => {
        callbacks?.onSettled?.()
      },
    })
  }

  const useDelete: EntityQueryApi<TEntity>['useDelete'] = callbacks => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: id => repository.delete(id),
      onMutate: async id => {
        const previousData = await callbacks?.onMutate?.(
          id as unknown as EntityWrite<TEntity>,
        )
        return { previousData }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: entity.keys.all })
      },
      onError: (_err, _id, context) => {
        callbacks?.onError?.(
          _err,
          _id as unknown as EntityWrite<TEntity>,
          context?.previousData,
        )
      },
      onSettled: () => {
        callbacks?.onSettled?.()
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
