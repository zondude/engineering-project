import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboard, resolveAnomaly, updateTransaction } from '../api/client'
import type { DashboardData } from '../types'
import AnomalyBadge from '../components/AnomalyBadge'

const TRUNCATE_AT = 150

type AnomalyView = 'unresolved' | 'resolved'

export default function Dashboard() {
  const [view, setView] = useState<AnomalyView>('unresolved')

  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', view],
    queryFn: () => fetchDashboard(view),
  })

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleApprove = async (id: number) => {
    await updateTransaction(id, { approve: true })
    refetch()
  }

  const handleResolve = async (id: number) => {
    await resolveAnomaly(id)
    refetch()
  }

  if (isLoading || !data) return <div className="empty-state">Loading...</div>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="cards-row">
        <div className="stat-card">
          <div className="label">Uncategorized</div>
          <div className="value amber">{data.uncategorized_count}</div>
        </div>
        <div className="stat-card">
          <div className="label">Flagged Anomalies</div>
          <div className="value red">{data.flagged_anomalies_count}</div>
        </div>
        <div className="stat-card">
          <div className="label">Reviewed Today</div>
          <div className="value green">{data.reviewed_today}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Transactions</div>
          <div className="value">{data.total_transactions.toLocaleString()}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">{view === 'resolved' ? 'Resolved Anomalies' : 'Needs Attention'}</h2>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${view === 'unresolved' ? 'active' : ''}`}
              onClick={() => setView('unresolved')}
            >
              Unresolved ({data.unresolved_anomalies_count})
            </button>
            <button
              className={`view-toggle-btn ${view === 'resolved' ? 'active' : ''}`}
              onClick={() => setView('resolved')}
            >
              Resolved ({data.resolved_anomalies_count})
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Severity</th>
                <th>Explanation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_anomalies.map(anomaly => (
                <tr key={anomaly.id}>
                  <td><AnomalyBadge type={anomaly.anomaly_type} /></td>
                  <td>
                    <Link to={`/transactions?id=${anomaly.transaction_id}`} className="tx-link">
                      ID #{anomaly.transaction_id}
                    </Link>
                  </td>
                  <td className="amount">${Number(anomaly.details?.transaction_amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'amber' : 'gray'}`}>
                      {anomaly.severity}
                    </span>
                  </td>
                  <td>
                    {anomaly.explanation ? (
                      <div className={`anomaly-explanation ${expandedIds.has(anomaly.id) ? 'expanded' : ''}`}>
                        <p>{anomaly.explanation}</p>
                        {anomaly.explanation.length > TRUNCATE_AT && (
                          <button className="show-more-btn" onClick={() => toggleExpanded(anomaly.id)}>
                            {expandedIds.has(anomaly.id) ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="anomaly-explanation generating">
                        <p>Generating explanation...</p>
                      </div>
                    )}
                  </td>
                  <td className="actions">
                    {view === 'unresolved' && (
                      <>
                        <button className="btn btn-sm" onClick={() => handleResolve(anomaly.id)}>Resolve</button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleApprove(anomaly.transaction_id)}>Approve</button>
                      </>
                    )}
                    {view === 'resolved' && (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.recent_anomalies.length === 0 && (
                <tr><td colSpan={6} className="empty-state">
                  {view === 'resolved' ? 'No resolved anomalies yet' : 'No anomalies to review'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Uncategorized Transactions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.uncategorized_sample.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>{tx.description || <span style={{ color: 'var(--text3)' }}>(no description)</span>}</td>
                  <td className="amount">${Number(tx.amount).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleApprove(tx.id)}>Approve</button>
                  </td>
                </tr>
              ))}
              {data.uncategorized_sample.length === 0 && (
                <tr><td colSpan={4} className="empty-state">All transactions categorized</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
