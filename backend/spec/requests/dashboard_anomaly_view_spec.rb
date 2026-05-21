require 'rails_helper'

RSpec.describe 'GET /api/v1/dashboard (anomaly view toggle)', type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it 'returns unresolved anomalies by default' do
    tx = create(:transaction, user: user)
    open_a = create(:anomaly, bookkeeping_transaction: tx, resolved: false)
    create(:anomaly, bookkeeping_transaction: tx, resolved: true)

    get '/api/v1/dashboard'

    body = JSON.parse(response.body)
    ids = body['recent_anomalies'].map { |a| a['id'] }
    expect(ids).to eq([open_a.id])
  end

  it 'returns resolved anomalies when view=resolved' do
    tx = create(:transaction, user: user)
    create(:anomaly, bookkeeping_transaction: tx, resolved: false)
    closed_a = create(:anomaly, bookkeeping_transaction: tx, resolved: true)

    get '/api/v1/dashboard', params: { view: 'resolved' }

    body = JSON.parse(response.body)
    ids = body['recent_anomalies'].map { |a| a['id'] }
    expect(ids).to eq([closed_a.id])
  end

  it 'always returns both unresolved and resolved counts regardless of view param' do
    tx = create(:transaction, user: user)
    create_list(:anomaly, 3, bookkeeping_transaction: tx, resolved: false)
    create_list(:anomaly, 5, bookkeeping_transaction: tx, resolved: true)

    get '/api/v1/dashboard'

    body = JSON.parse(response.body)
    expect(body['unresolved_anomalies_count']).to eq(3)
    expect(body['resolved_anomalies_count']).to eq(5)
  end

  it 'falls back to unresolved when view param is unknown' do
    tx = create(:transaction, user: user)
    open_a = create(:anomaly, bookkeeping_transaction: tx, resolved: false)
    create(:anomaly, bookkeeping_transaction: tx, resolved: true)

    get '/api/v1/dashboard', params: { view: 'gibberish' }

    body = JSON.parse(response.body)
    ids = body['recent_anomalies'].map { |a| a['id'] }
    expect(ids).to eq([open_a.id])
  end
end
