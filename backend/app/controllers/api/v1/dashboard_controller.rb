class Api::V1::DashboardController < Api::V1::BaseController
  def index
    transactions = current_user_transactions

    uncategorized_count = transactions.uncategorized.count
    flagged_count = transactions.flagged.count
    reviewed_today = transactions.reviewed.where('updated_at >= ?', Time.current.beginning_of_day).count
    total_count = transactions.count

    user_anomalies = Anomaly.joins(:bookkeeping_transaction)
                            .where(transactions: { user_id: current_user.id })

    unresolved_count = user_anomalies.unresolved.count
    resolved_count = user_anomalies.where(resolved: true).count

    view = params[:view] == 'resolved' ? :resolved : :unresolved
    scope = view == :resolved ? user_anomalies.where(resolved: true) : user_anomalies.unresolved

    recent_anomalies = scope.includes(:bookkeeping_transaction)
                            .order(created_at: :desc)
                            .limit(10)

    uncategorized_sample = transactions.uncategorized.pending.order(date: :desc).limit(10)

    render json: {
      uncategorized_count: uncategorized_count,
      flagged_anomalies_count: flagged_count,
      reviewed_today: reviewed_today,
      total_transactions: total_count,
      unresolved_anomalies_count: unresolved_count,
      resolved_anomalies_count: resolved_count,
      recent_anomalies: AnomalySerializer.render_as_json(recent_anomalies),
      uncategorized_sample: TransactionSerializer.render_as_json(uncategorized_sample)
    }
  end
end
