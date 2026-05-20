import { useQuery } from '@tanstack/react-query'
import { fetchDashboard, resolveAnomaly, updateTransaction } from '../api/client'
import type { DashboardData } from '../types'
import AnomalyBadge from '../components/AnomalyBadge'

export default function Dashboard() {
  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

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
        <h2 className="section-title">Needs Attention</h2>
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
                  <td>ID #{anomaly.transaction_id}</td>
                  <td className="amount">${Number(anomaly.details?.transaction_amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'amber' : 'gray'}`}>
                      {anomaly.severity}
                    </span>
                  </td>
                  <td>
                    {anomaly.explanation ? (
                      <p className="anomaly-explanation">{anomaly.explanation}</p>
                    ) : (
                      <p className="anomaly-explanation generating">Generating explanation...</p>
                    )}
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => handleResolve(anomaly.id)}>Resolve</button>
                    <button className="btn btn-sm btn-primary" onClick={() => handleApprove(anomaly.transaction_id)}>Approve</button>
                  </td>
                </tr>
              ))}
              {data.recent_anomalies.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No anomalies to review</td></tr>
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
