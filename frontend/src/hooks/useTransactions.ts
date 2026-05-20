import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTransactions, updateTransaction, deleteTransaction, bulkAction, createTransaction } from '../api/client'
import type { Transaction } from '../types'

interface TransactionsPage {
  transactions: Transaction[]
  next_cursor: number | null
}

export function useTransactions(filters: Record<string, string> = {}) {
  return useInfiniteQuery<TransactionsPage>({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }) =>
      fetchTransactions({ ...filters, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialPageParam: undefined as number | undefined,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTransaction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useBulkAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, actionType, value }: { ids: number[]; actionType: string; value?: string }) =>
      bulkAction(ids, actionType, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
