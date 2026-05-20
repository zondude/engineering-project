class Api::V1::ImportsController < Api::V1::BaseController
  def create
    file = params[:file]

    unless file.present? && file.content_type.in?(%w[text/csv application/csv application/vnd.ms-excel])
      return render_error('Please upload a valid CSV file', status: :unprocessable_entity)
    end

    import_id = SecureRandom.uuid
    CsvImportJob.perform_later(current_user.id, file.path, import_id)

    render json: { message: 'Import started', import_id: import_id }, status: :accepted
  end
end
