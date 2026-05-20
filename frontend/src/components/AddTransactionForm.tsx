import { useForm } from 'react-hook-form'
import { useCreateTransaction } from '../hooks/useTransactions'

interface Props {
  onClose: () => void
}

interface FormData {
  date: string
  description: string
  amount: string
  category: string
}

export default function AddTransactionForm({ onClose }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { date: new Date().toISOString().split('T')[0] }
  })
  const createMutation = useCreateTransaction()

  const onSubmit = (data: FormData) => {
    createMutation.mutate(
      { date: data.date, description: data.description, amount: parseFloat(data.amount), category: data.category || null },
      { onSuccess: onClose }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label>Date</label>
        <input type="date" {...register('date', { required: true })} />
        {errors.date && <p className="error-text">Date is required</p>}
      </div>
      <div className="form-group">
        <label>Description</label>
        <input {...register('description')} placeholder="e.g. Amazon Purchase" />
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input type="number" step="0.01" {...register('amount', { required: true })} placeholder="0.00" />
        {errors.amount && <p className="error-text">Amount is required</p>}
      </div>
      <div className="form-group">
        <label>Category</label>
        <select {...register('category')}>
          <option value="">None</option>
          {['Shopping', 'Food & Dining', 'Entertainment', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Travel', 'Education', 'Subscriptions'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
        </button>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}
