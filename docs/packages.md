# Packages

## `@modelstack/core`

Core entity primitives:

- `defineEntity`
- entity schema inference
- query key factories
- endpoint path factories

This package should not depend on React, Axios, Effector, or UI libraries.

## `@modelstack/http`

HTTP and repository primitives:

- `HttpClient`
- `AxiosHttpClient`
- `CrudRepository`
- `createCrudRepository`

The repository uses the entity contract but does not know about React.

## `@modelstack/react-query`

React Query adapter:

- `createCrudQueries`
- `useList`
- `useDetail`
- `useInfiniteList`
- `useCreate`
- `useUpdate`
- `useDelete`

It owns cache invalidation for entity query keys.

## `@modelstack/react-form`

React Hook Form adapter:

- `createEntityForm`
- Zod resolver binding
- typed default values
- typed submit handler
- mutation binding

It does not own visual inputs or layout.

## `@modelstack/effector`

Effector adapter:

- `createEntityListStore`
- list state
- filters
- checked rows
- loading/fetching/error flags

## `@modelstack/react-ui`

Optional React helpers.

This package should stay thin. App-specific UI kits should wrap ModelStack
logic instead of being forced into the core.
