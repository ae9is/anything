// prettier-ignore
'use client'

import logger from 'logger'
import { invalidate, queries, requestQuery, useMutation } from '../../data'
import { ModalButton } from '../button/ModalButton'
import { LoadingSelect } from './LoadingSelect'
import { useState } from 'react'

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

  const { error: delError, trigger: delTrigger, isMutating: isDeleting } = useMutation(queries.deleteCollection, {
    id: value,
  })

  async function handleDelete() {
    if (value) {
      logger.debug('Deleting collection: ', value)
      try {
        await delTrigger()
        if (delError) {
          throw new Error(delError)
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

  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate(newValue?: string) {
    setIsCreating(true)
    if (newValue) {
      logger.debug('Creating new collection: ', newValue)
      try {
        const newCollectionProps = {
          ctype: type,
          itemIds: [],
        }
        const res = await requestQuery(queries.putCollection, {
          id: newValue,
          body: newCollectionProps,
        })
        if (!res) {
          throw new Error()
        }
        handleChange(newValue)
      } catch (e) {
        logger.error('Error creating collection')
        logger.error(e)
      }
    }
    setIsCreating(false)
  }

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-end">
      <LoadingSelect
        query={queries.listCollections}
        queryOptions={{ id: type }}
        queryResultMapper={queryResultMapper}
        value={value}
        onChange={handleChange}
        newOptionsAllowed={true}
        isCreatingNewOption={isDeleting || isCreating}
        onCreateOption={handleCreate}
      />
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-neutral" type="submit" onClick={handleReset}>
        Reset
      </button>
      <button className="mt-4 lg:mt-0 lg:ml-4 btn btn-primary" type="submit" onClick={handleLoad}>
        Load
      </button>
      <ModalButton
        disabled={isDeleting}
        buttonText="Delete"
        modalTitle="Delete Collection"
        modalText="Are you sure you want to delete this collection? (The items in it won't be touched.)"
        onConfirm={handleDelete}
      />
    </div>
  )
}
