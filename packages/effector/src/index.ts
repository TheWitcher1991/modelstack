import { createEvent, createStore, sample } from 'effector'
import { useEffect } from 'react'
import type { ChangeEvent } from 'react'

import type {
  Dictionary,
  EntityDefinition,
  EntityQuery,
  EntityRead,
} from '@modelstack/core'

export interface EntityListState<TItem, TFilter extends Dictionary = Dictionary> {
  count: number
  list: TItem[]
  checked: number[]
  filter: Partial<TFilter>
  loading: boolean
  fetching: boolean
  error: boolean
}

export function createEntityListStore<
  TEntity extends EntityDefinition<string, string, any>,
>(
  _entity: TEntity,
  initialState: EntityListState<EntityRead<TEntity>, EntityQuery<TEntity>>,
) {
  const setCount = createEvent<number>()
  const setList = createEvent<EntityRead<TEntity>[]>()
  const setFilter = createEvent<Partial<EntityQuery<TEntity>>>()
  const setLoading = createEvent<boolean>()
  const setFetching = createEvent<boolean>()
  const setError = createEvent<boolean>()
  const setChecked = createEvent<number[]>()
  const setQuery = createEvent<string>()
  const changeQueryFromInput = createEvent<ChangeEvent<HTMLInputElement>>()
  const reset = createEvent<void>()

  const $store = createStore(initialState)
    .on(setCount, (state, count) => ({ ...state, count }))
    .on(setList, (state, list) => ({ ...state, list }))
    .on(setChecked, (state, checked) => ({ ...state, checked }))
    .on(setLoading, (state, loading) => ({ ...state, loading }))
    .on(setFetching, (state, fetching) => ({ ...state, fetching }))
    .on(setError, (state, error) => ({ ...state, error }))
    .on(setFilter, (state, filter) => ({
      ...state,
      filter: { ...state.filter, ...filter },
    }))
    .on(setQuery, (state, query) => ({ ...state, filter: { ...state.filter, query } }))
    .on(reset, state => ({
      ...state,
      filter: {
        ...initialState.filter,
        page: state.filter.page,
        page_size: state.filter.page_size,
        limit: state.filter.limit,
      },
    }))

  sample({
    clock: changeQueryFromInput,
    fn: event => event.target.value,
    target: setQuery,
  })

  return {
    $store,
    setCount,
    setList,
    setFilter,
    setLoading,
    setFetching,
    setError,
    setChecked,
    setQuery,
    changeQueryFromInput,
    reset,
  }
}

export interface QueryResult<TData> {
  data?: TData
  isLoading: boolean
  isFetching: boolean
  isError: boolean
}

export interface QueryBridgeEvents<
  TEntity extends EntityDefinition<string, string, any>,
> {
  setLoading: ReturnType<typeof createEvent<boolean>>
  setFetching: ReturnType<typeof createEvent<boolean>>
  setError: ReturnType<typeof createEvent<boolean>>
  setList: ReturnType<typeof createEvent<EntityRead<TEntity>[]>>
  setCount: ReturnType<typeof createEvent<number>>
}

export function createQueryBridge<TEntity extends EntityDefinition<string, string, any>>(
  events: QueryBridgeEvents<TEntity>,
  query: QueryResult<EntityRead<TEntity>[]>,
) {
  useEffect(() => {
    events.setLoading(query.isLoading)
  }, [query.isLoading])

  useEffect(() => {
    events.setFetching(query.isFetching)
  }, [query.isFetching])

  useEffect(() => {
    events.setError(query.isError)
  }, [query.isError])

  useEffect(() => {
    if (!query.data) return
    events.setList(query.data)
    events.setCount(query.data.length)
  }, [query.data])
}
