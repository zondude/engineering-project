require 'rails_helper'

RSpec.describe CsvImporter do
  let(:user) { create(:user) }

  before do
    allow(AnomalyExplanationJob).to receive(:perform_later)
  end

  def import(csv_string)
    CsvImporter.new(user: user, csv_content: csv_string).import
  end

  it 'imports valid rows' do
    result = import("date,description,amount\n2024-01-15,Starbucks,6.75")
    expect(result.imported_count).to eq(1)
    expect(result.error_count).to eq(0)
  end

  it 'skips rows with unparseable amount and records the error' do
    result = import("date,description,amount\n2024-01-15,Starbucks,not_a_number")
    expect(result.imported_count).to eq(0)
    expect(result.errors.first).to match(/amount/)
  end

  it 'skips rows with malformed date and continues processing' do
    csv = "date,description,amount\nnot-a-date,Starbucks,6.75\n2024-01-16,Netflix,15.99"
    result = import(csv)
    expect(result.imported_count).to eq(1)
    expect(result.error_count).to eq(1)
  end

  it 'handles completely empty CSV gracefully' do
    result = import("date,description,amount\n")
    expect(result.imported_count).to eq(0)
    expect(result.errors).to be_empty
  end

  it 'imports rows with category' do
    result = import("date,description,amount,category\n2024-01-15,Starbucks,6.75,Food")
    expect(result.imported_count).to eq(1)
    expect(Transaction.last.category).to eq('Food')
  end
end
