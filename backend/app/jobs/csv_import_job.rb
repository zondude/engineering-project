class CsvImportJob < ApplicationJob
  queue_as :default

  def perform(user_id, file_path, import_id)
    user = User.find(user_id)
    result = CsvImporter.new(user: user, file_path: file_path, import_id: import_id).import

    ActionCable.server.broadcast(
      "import_status_#{import_id}",
      {
        status: 'complete',
        imported: result.imported_count,
        errors: result.error_count,
        flagged: result.flagged_count,
        error_details: result.errors.first(50)
      }
    )
  end
end
