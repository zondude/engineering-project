import { useForm } from 'react-hook-form'
import { createRule, updateRule } from '../api/client'
import type { Rule } from '../types'

interface Props {
  rule?: Rule | null
  onSave: () => void
  onCancel: () => void
}

interface FormData {
  name: string
  conditionField: string
  conditionOperator: string
  conditionValue: string
  actionType: string
  actionValue: string
  priority: number
  continue_processing: boolean
}

const OPERATORS: Record<string, { label: string; value: string }[]> = {
  description: [
    { label: 'contains', value: 'contains' },
    { label: 'matches (regex)', value: 'matches' },
  ],
  amount: [
    { label: 'greater than', value: 'gt' },
    { label: 'less than', value: 'lt' },
    { label: 'equals', value: 'eq' },
  ],
  category: [
    { label: 'is', value: 'is' },
  ],
}

const CATEGORIES = ['Shopping', 'Food & Dining', 'Entertainment', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Travel', 'Education', 'Subscriptions']

export default function RuleBuilder({ rule, onSave, onCancel }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: rule?.name || '',
      conditionField: rule?.condition?.field || 'description',
      conditionOperator: rule?.condition?.operator || 'contains',
      conditionValue: rule?.condition?.value || '',
      actionType: rule?.action?.type || 'set_category',
      actionValue: rule?.action?.value || '',
      priority: rule?.priority || 0,
      continue_processing: rule?.continue_processing || false,
    },
  })

  const field = watch('conditionField')
  const actionType = watch('actionType')

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      condition: { field: data.conditionField, operator: data.conditionOperator, value: data.conditionValue },
      action: { type: data.actionType, ...(data.actionValue ? { value: data.actionValue } : {}) },
      priority: data.priority,
      continue_processing: data.continue_processing,
    }

    if (rule) {
      await updateRule(rule.id, payload)
    } else {
      await createRule(payload)
    }
    onSave()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label htmlFor="ruleName">Rule Name</label>
        <input id="ruleName" {...register('name', { required: true })} placeholder="e.g. Amazon → Shopping" />
        {errors.name && <p className="error-text">Name is required</p>}
      </div>

      <div className="form-group">
        <label htmlFor="field">Field</label>
        <select id="field" {...register('conditionField')}>
          <option value="description">Description</option>
          <option value="amount">Amount</option>
          <option value="category">Category</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="operator">Operator</label>
        <select id="operator" {...register('conditionOperator')}>
          {(OPERATORS[field] || []).map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="conditionValue">Value</label>
        <input id="conditionValue" {...register('conditionValue', { required: true })} placeholder="Value" />
      </div>

      <div className="form-group">
        <label htmlFor="actionType">Action Type</label>
        <select id="actionType" {...register('actionType')}>
          <option value="set_category">Set Category</option>
          <option value="flag_high_value">Flag High Value</option>
          <option value="add_tag">Add Tag</option>
        </select>
      </div>

      {(actionType === 'set_category') && (
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" {...register('actionValue')}>
            <option value="">Select...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {actionType === 'add_tag' && (
        <div className="form-group">
          <label htmlFor="tagValue">Tag</label>
          <input id="tagValue" {...register('actionValue')} placeholder="e.g. recurring" />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <input id="priority" type="number" {...register('priority', { valueAsNumber: true })} />
      </div>

      <div className="form-group checkbox-row">
        <input type="checkbox" id="continue" {...register('continue_processing')} />
        <label htmlFor="continue">
          Continue evaluating lower-priority rules after this one matches
          <span className="form-help">By default the first matching rule fires and stops. Enable this to chain multiple rules on the same transaction.</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="submit" className="btn btn-primary">Save Rule</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
