'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { uploadPhotoWithProgress } from '@/lib/api'

export type UploadTaskStatus = 'pending' | 'uploading' | 'completed' | 'failed'

export interface UploadTask {
  id: string
  file: File
  fileName: string
  fileSize: number
  preview: string | null
  status: UploadTaskStatus
  progress: number
  error: string | null
  // Upload params
  title: string
  categories: string[]
  storageProvider?: string
  storagePath?: string
  storyId?: string
  // Result
  photoId?: string
}

interface UploadQueueContextType {
  tasks: UploadTask[]
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
  addTasks: (params: {
    files: { id: string; file: File }[]
    title: string
    categories: string[]
    storageProvider?: string
    storagePath?: string
    storyId?: string
    token: string
  }) => void
  retryTask: (taskId: string, token: string) => void
  removeTask: (taskId: string) => void
  clearCompleted: () => void
  clearAll: () => void
}

const UploadQueueContext = createContext<UploadQueueContextType | null>(null)

export function useUploadQueue() {
  const context = useContext(UploadQueueContext)
  if (!context) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider')
  }
  return context
}

const CONCURRENCY = 4

export function UploadQueueProvider({
  children,
  onUploadComplete,
}: {
  children: React.ReactNode
  onUploadComplete?: (photoIds: string[], storyId?: string) => void
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const activeUploadsRef = useRef(0)
  const tokenRef = useRef<string>('')
  const onUploadCompleteRef = useRef(onUploadComplete)
  const completedBatchesRef = useRef<Set<string>>(new Set())

  // Keep the ref updated
  useEffect(() => {
    onUploadCompleteRef.current = onUploadComplete
  }, [onUploadComplete])

  const createPreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, progress } : t
      )
    )
  }, [])

  const checkBatchComplete = useCallback((storyId: string | undefined) => {
    // Use a unique key for the batch
    const batchKey = storyId || 'no-story'

    setTasks((currentTasks) => {
      const batchTasks = currentTasks.filter((t) => (t.storyId || 'no-story') === batchKey)
      const completedTasks = batchTasks.filter((t) => t.status === 'completed')
      const pendingOrUploading = batchTasks.filter(
        (t) => t.status === 'pending' || t.status === 'uploading'
      )

      // Check if batch is complete and hasn't been processed yet
      if (pendingOrUploading.length === 0 && completedTasks.length > 0) {
        if (!completedBatchesRef.current.has(batchKey)) {
          completedBatchesRef.current.add(batchKey)

          const photoIds = completedTasks
            .map((t) => t.photoId)
            .filter((id): id is string => !!id)

          if (photoIds.length > 0 && onUploadCompleteRef.current) {
            // Schedule callback outside of render
            setTimeout(() => {
              onUploadCompleteRef.current?.(photoIds, storyId)
            }, 0)
          }
        }
      }

      return currentTasks
    })
  }, [])

  const processQueue = useCallback(() => {
    setTasks((currentTasks) => {
      const pendingTasks = currentTasks.filter((t) => t.status === 'pending')
      const availableSlots = CONCURRENCY - activeUploadsRef.current

      if (availableSlots <= 0 || pendingTasks.length === 0) {
        return currentTasks
      }

      const tasksToStart = pendingTasks.slice(0, availableSlots)
      activeUploadsRef.current += tasksToStart.length

      // Start uploads for selected tasks
      tasksToStart.forEach((task) => {
        uploadSingleFile(task)
      })

      return currentTasks.map((t) =>
        tasksToStart.some((ts) => ts.id === t.id)
          ? { ...t, status: 'uploading' as UploadTaskStatus, progress: 0 }
          : t
      )
    })
  }, [])

  const uploadSingleFile = async (task: UploadTask) => {
    try {
      const photo = await uploadPhotoWithProgress({
        token: tokenRef.current,
        file: task.file,
        title: task.title,
        category: task.categories,
        storage_provider: task.storageProvider,
        storage_path: task.storagePath,
        onProgress: (progress) => {
          updateTaskProgress(task.id, progress)
        },
      })

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'completed' as UploadTaskStatus, progress: 100, photoId: photo.id }
            : t
        )
      )

      // Check if batch is complete after a short delay
      setTimeout(() => {
        checkBatchComplete(task.storyId)
      }, 100)
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'failed' as UploadTaskStatus,
                error: err instanceof Error ? err.message : 'Upload failed',
              }
            : t
        )
      )
    } finally {
      activeUploadsRef.current--
      // Process next in queue
      setTimeout(processQueue, 50)
    }
  }

  const addTasks = useCallback(
    async (params: {
      files: { id: string; file: File }[]
      title: string
      categories: string[]
      storageProvider?: string
      storagePath?: string
      storyId?: string
      token: string
    }) => {
      tokenRef.current = params.token

      // Reset batch tracking for this story
      const batchKey = params.storyId || 'no-story'
      completedBatchesRef.current.delete(batchKey)

      const newTasks: UploadTask[] = await Promise.all(
        params.files.map(async (item) => {
          const preview = await createPreview(item.file)
          return {
            id: item.id,
            file: item.file,
            fileName: item.file.name,
            fileSize: item.file.size,
            preview,
            status: 'pending' as UploadTaskStatus,
            progress: 0,
            error: null,
            title:
              params.files.length === 1
                ? params.title
                : item.file.name.replace(/\.[^/.]+$/, ''),
            categories: params.categories,
            storageProvider: params.storageProvider,
            storagePath: params.storagePath,
            storyId: params.storyId,
          }
        })
      )

      setTasks((prev) => [...prev, ...newTasks])
      setIsMinimized(false)

      // Start processing queue
      setTimeout(processQueue, 50)
    },
    [processQueue]
  )

  const retryTask = useCallback(
    (taskId: string, token: string) => {
      tokenRef.current = token

      // Get the task's storyId and reset batch tracking
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId)
        if (task) {
          const batchKey = task.storyId || 'no-story'
          completedBatchesRef.current.delete(batchKey)
        }
        return prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'pending' as UploadTaskStatus, error: null, progress: 0 }
            : t
        )
      })
      setTimeout(processQueue, 50)
    },
    [processQueue]
  )

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      if (task?.preview) {
        URL.revokeObjectURL(task.preview)
      }
      return prev.filter((t) => t.id !== taskId)
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => {
      prev
        .filter((t) => t.status === 'completed')
        .forEach((t) => {
          if (t.preview) URL.revokeObjectURL(t.preview)
        })
      return prev.filter((t) => t.status !== 'completed')
    })
  }, [])

  const clearAll = useCallback(() => {
    setTasks((prev) => {
      prev.forEach((t) => {
        if (t.preview) URL.revokeObjectURL(t.preview)
      })
      return []
    })
    completedBatchesRef.current.clear()
  }, [])

  return (
    <UploadQueueContext.Provider
      value={{
        tasks,
        isMinimized,
        setIsMinimized,
        addTasks,
        retryTask,
        removeTask,
        clearCompleted,
        clearAll,
      }}
    >
      {children}
    </UploadQueueContext.Provider>
  )
}
