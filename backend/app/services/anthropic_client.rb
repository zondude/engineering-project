class AnthropicClient
  API_URL = 'https://api.anthropic.com/v1/messages'.freeze
  MODEL   = 'claude-sonnet-4-5'.freeze

  def self.explain_anomaly(context)
    prompt = build_prompt(context)
    api_key = Rails.application.credentials.anthropic_api_key || ENV['ANTHROPIC_API_KEY']

    response = HTTP.headers(
      'x-api-key'         => api_key,
      'anthropic-version' => '2023-06-01',
      'content-type'      => 'application/json'
    ).timeout(30).post(API_URL, json: {
      model:      MODEL,
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }]
    })

    body = JSON.parse(response.body.to_s)
    body.dig('content', 0, 'text')&.strip
  rescue => e
    Rails.logger.error("AnthropicClient error: #{e.message}")
    nil
  end

  def self.build_prompt(ctx)
    <<~PROMPT
      You are a bookkeeping assistant. A transaction has been flagged as suspicious.
      Write 1-2 sentences in plain English explaining why this transaction looks unusual
      and what a bookkeeper should verify. Be specific, not generic.

      Transaction details:
      - Date: #{ctx[:transaction_date]}
      - Description: #{ctx[:transaction_desc]}
      - Amount: $#{ctx[:transaction_amount]}
      - Flag type: #{ctx[:anomaly_type]}
      - Severity: #{ctx[:severity]}
      - Statistical context: #{ctx[:details].to_json}

      Respond with the explanation only. No preamble, no bullet points.
    PROMPT
  end
end
