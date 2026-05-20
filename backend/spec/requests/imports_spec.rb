require 'rails_helper'

RSpec.describe 'POST /api/v1/imports', type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it 'accepts a valid CSV and enqueues a job' do
    csv = Rack::Test::UploadedFile.new(
      Rails.root.join('spec/fixtures/files/valid_transactions.csv'),
      'text/csv'
    )

    expect {
      post '/api/v1/imports', params: { file: csv }
    }.to have_enqueued_job(CsvImportJob)

    expect(response).to have_http_status(:accepted)
    expect(json_body['import_id']).to be_present
  end

  it 'rejects non-CSV files' do
    # Create a temp PDF-like file
    file = Rack::Test::UploadedFile.new(
      StringIO.new('%PDF-1.4 fake pdf'),
      'application/pdf',
      true,
      original_filename: 'document.pdf'
    )

    post '/api/v1/imports', params: { file: file }
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it 'rejects request without file' do
    post '/api/v1/imports', params: {}
    expect(response).to have_http_status(:unprocessable_entity)
  end
end
