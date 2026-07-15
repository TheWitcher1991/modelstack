import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios'
import axios from 'axios'

import type {
  Dictionary,
  EntityDefinition,
  EntityId,
  EntityQuery,
  EntityRead,
  EntityWrite,
} from '@modelstack/core'

export class EntityError extends Error {
  readonly status: number | undefined
  readonly data: unknown
  readonly isCancelled: boolean

  constructor(message: string, status?: number, data?: unknown, isCancelled = false) {
    super(message)
    this.name = 'EntityError'
    this.status = status
    this.data = data
    this.isCancelled = isCancelled
  }

  static fromAxiosError(error: AxiosError): EntityError {
    if (axios.isCancel(error)) {
      return new EntityError('Request cancelled', undefined, undefined, true)
    }
    const status = error.response?.status
    const data = error.response?.data
    const message = error.message ?? 'Request failed'
    return new EntityError(message, status, data)
  }
}

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
  delete<T>(url: string, config?: RequestConfig): Promise<T>
}

export type RequestConfig = AxiosRequestConfig
export type HttpClientInstance = HttpClient

export class AxiosHttpClient implements HttpClient {
  readonly instance: AxiosInstance

  constructor(config?: CreateAxiosDefaults) {
    this.instance = axios.create(config)
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<T, AxiosResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw EntityError.fromAxiosError(error as AxiosError)
    }
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.instance.post<T, AxiosResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw EntityError.fromAxiosError(error as AxiosError)
    }
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.instance.patch<T, AxiosResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw EntityError.fromAxiosError(error as AxiosError)
    }
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.instance.put<T, AxiosResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw EntityError.fromAxiosError(error as AxiosError)
    }
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T, AxiosResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw EntityError.fromAxiosError(error as AxiosError)
    }
  }
}

export interface CrudRepositoryOptions {
  jsonContentType?: string
  formDataContentType?: string
}

export class CrudRepository<
  TRead,
  TWrite,
  TQuery extends Dictionary = Dictionary,
  TId extends string | number = number,
> {
  constructor(
    readonly http: HttpClient,
    readonly endpoint: string,
    readonly options: CrudRepositoryOptions = {},
  ) {}

  findAll(params?: Partial<TQuery>, signal?: AbortSignal): Promise<TRead[]> {
    return this.http.get<TRead[]>(`${this.endpoint}/`, { params, signal })
  }

  findById(id: TId, signal?: AbortSignal): Promise<TRead> {
    return this.http.get<TRead>(`${this.endpoint}/${id}/`, { signal })
  }

  create(data: TWrite, signal?: AbortSignal): Promise<TRead> {
    return this.http.post<TRead>(`${this.endpoint}/`, data, { signal })
  }

  createFormData(data: FormData, signal?: AbortSignal): Promise<TRead> {
    return this.http.post<TRead>(`${this.endpoint}/`, data, {
      headers: {
        'Content-Type': this.options.formDataContentType ?? 'multipart/form-data',
      },
      signal,
    })
  }

  update(id: TId, data: Partial<TWrite>, signal?: AbortSignal): Promise<TRead> {
    return this.http.patch<TRead>(`${this.endpoint}/${id}/`, data, { signal })
  }

  updateFormData(id: TId, data: FormData, signal?: AbortSignal): Promise<TRead> {
    return this.http.patch<TRead>(`${this.endpoint}/${id}/`, data, {
      headers: {
        'Content-Type': this.options.formDataContentType ?? 'multipart/form-data',
      },
      signal,
    })
  }

  delete(id: TId, signal?: AbortSignal): Promise<unknown> {
    return this.http.delete(`${this.endpoint}/${id}/`, { signal })
  }
}

export type EntityRepository<TEntity extends EntityDefinition<string, string, any>> =
  CrudRepository<
    EntityRead<TEntity>,
    EntityWrite<TEntity>,
    EntityQuery<TEntity>,
    EntityId<TEntity>
  >

export function createCrudRepository<
  TEntity extends EntityDefinition<string, string, any>,
>(
  entity: TEntity,
  http: HttpClient,
  options?: CrudRepositoryOptions,
): EntityRepository<TEntity> {
  return new CrudRepository(http, entity.endpoint, options)
}
