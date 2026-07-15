import type { z } from 'zod'

export type Id = string | number
export type Dictionary<T = unknown> = Record<string, T>

export type Brand<T, Name extends string> = T & { readonly __brand: Name }

export type InferSchema<TSchema extends z.ZodTypeAny> = z.infer<TSchema>

export interface EntitySchemas<
  TId extends z.ZodTypeAny,
  TRead extends z.ZodTypeAny,
  TWrite extends z.ZodTypeAny,
  TQuery extends z.ZodTypeAny | undefined = undefined,
> {
  id: TId
  read: TRead
  write: TWrite
  query?: TQuery
}

export interface EntityDefinition<
  TKey extends string,
  TEndpoint extends string,
  TSchemas extends EntitySchemas<
    z.ZodTypeAny,
    z.ZodTypeAny,
    z.ZodTypeAny,
    z.ZodTypeAny | undefined
  >,
> {
  key: TKey
  endpoint: TEndpoint
  schemas: TSchemas
  keys: EntityQueryKeys<TKey>
  paths: EntityPaths<TEndpoint>
}

export interface EntityQueryKeys<TKey extends string> {
  all: readonly [TKey]
  list: <TParams = undefined>(
    params?: TParams,
  ) => readonly [TKey, 'list', TParams | undefined]
  detail: <TId extends Id>(id: TId) => readonly [TKey, 'detail', TId]
  infinite: <TParams = undefined>(
    params?: TParams,
  ) => readonly [TKey, 'infinite', TParams | undefined]
}

export interface EntityPaths<TEndpoint extends string> {
  list: TEndpoint
  detail: <TId extends Id>(id: TId) => `${TEndpoint}/${TId}`
}

export type EntityRead<TEntity extends EntityDefinition<string, string, any>> =
  InferSchema<TEntity['schemas']['read']>

export type EntityWrite<TEntity extends EntityDefinition<string, string, any>> =
  InferSchema<TEntity['schemas']['write']>

export type EntityId<TEntity extends EntityDefinition<string, string, any>> = InferSchema<
  TEntity['schemas']['id']
>

export type EntityQuery<TEntity extends EntityDefinition<string, string, any>> =
  TEntity['schemas']['query'] extends z.ZodTypeAny
    ? Partial<InferSchema<TEntity['schemas']['query']>>
    : Dictionary

export function defineEntity<
  const TKey extends string,
  const TEndpoint extends string,
  const TSchemas extends EntitySchemas<
    z.ZodTypeAny,
    z.ZodTypeAny,
    z.ZodTypeAny,
    z.ZodTypeAny | undefined
  >,
>(config: {
  key: TKey
  endpoint: TEndpoint
  schemas: TSchemas
}): EntityDefinition<TKey, TEndpoint, TSchemas> {
  return {
    ...config,
    keys: createQueryKeys(config.key),
    paths: createEntityPaths(config.endpoint),
  }
}

export function createQueryKeys<const TKey extends string>(
  key: TKey,
): EntityQueryKeys<TKey> {
  return {
    all: [key],
    list: params => [key, 'list', params],
    detail: id => [key, 'detail', id],
    infinite: params => [key, 'infinite', params],
  }
}

export function createEntityPaths<const TEndpoint extends string>(
  endpoint: TEndpoint,
): EntityPaths<TEndpoint> {
  return {
    list: endpoint,
    detail: id => `${endpoint}/${id}` as `${TEndpoint}/${typeof id}`,
  }
}
