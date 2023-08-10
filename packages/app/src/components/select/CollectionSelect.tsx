// prettier-ignore
'use client'

import logger from 'logger'
import { invalidate, queries, useMutation } from '../../data'
import { ModalButton } from '../button/ModalButton'
import { LoadingSelect } from './LoadingSelect'
export interface CollectionSelectProps {
  type: string
  value?: string
  onChange?: (newValue?: string) => void
  onLoad?: () => void
}

export function CollectionSelect({ type, value, onChange, onLoad }: CollectionSelectProps) {
  function queryResultMapper(collectionInfo: any) {
    return collectionInfo?.id
  }

  function handleReset() {
    onChange?.(undefined)
  }

  function handleChange(newValue?: string) {
    onChange?.(newValue)
  }

  function handleLoad() {
    if (type && value) {
      onLoad?.()
    }
  }

  const { error, trigger, isMutating } = useMutation(queries.deleteCollection, {
    id: type,
  })

  async function handleDelete() {
    if (value) {
      logger.debug('Deleting collection: ', value)
      try {
        await trigger()
        if (error) {
          throw new Error(error)
        }
        handleReset()
        // Also need to refresh collections by type data, since a collection was just deleted
        invalidate(queries.listCollections, { id: type })
      } catch (e) {
        logger.error('Error deleting collection')
        logger.error(e)
      }
    }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-end">
      <LoadingSelect
        query={queries.listCollections}
        queryOptions={{ id: type }}
        queryResultMapper={queryResultMapper}
        value={value}
        onChange={handleChange}
      />
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-neutral" type="submit" onClick={handleReset}>
        Reset
      </button>
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit" onClick={handleLoad}>
        Load
      </button>
      <ModalButton
        disabled={isMutating}
        buttonText="Delete"
        modalTitle="Delete Collection"
        modalText="Are you sure you want to delete this collection? (The items in it won't be touched.)"
        onConfirm={handleDelete}
      />
    </div>
  )
}
