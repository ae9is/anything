import { HttpMethod } from '../lib/request'

export interface Query {
  path: (id: string) => string
  method: HttpMethod
}

export const queries: Record<string, Query> = {
  listTypes: {
    path: () => 'types',
    method: 'GET',
  },
  listCollections: {
    path: (id: string) => `types/${id}/collections`,
    method: 'GET',
  },
  getCollection: {
    path: (id: string) => `collections/${id}`,
    method: 'GET',
  },
  putCollection: {
    path: (id: string) => `collections/${id}`,
    method: 'PUT',
  },
  deleteCollection: {
    path: (id: string) => `collections/${id}`,
    method: 'DELETE',
  },
  listItemsByTypeAndFilter: {
    path: (id: string) => `types/${id}/items`,
    method: 'GET',
  },
  listItemsByCollection: {
    path: (id: string) => `collections/${id}/items`,
    method: 'GET',
  },
  getItem: {
    path: (id: string) => `items/${id}`,
    method: 'GET',
  },
  postItem: {
    path: (id: string) => `items/${id}`,
    method: 'POST',
  },
  postBatchItems: {
    path: () => `items`,
    method: 'POST',
  },
  deleteItem: {
    path: (id: string) => `items/${id}`,
    method: 'DELETE',
  },
}
