const OpenAI = require('openai');
const MatchingProvider = require('./MatchingProvider');

class AzureOpenAIMatchingProvider extends MatchingProvider {
  constructor({ endpoint, apiKey, deployment, fallback }) {
    super();
    if (!endpoint || !apiKey || !deployment) throw new Error('Thiếu cấu hình Azure OpenAI');
    this.client = new OpenAI({ apiKey, baseURL: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}`, defaultQuery: { 'api-version': '2025-01-01-preview' }, defaultHeaders: { 'api-key': apiKey } });
    this.deployment = deployment;
    this.fallback = fallback;
  }

  async calculate(profile, candidate) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Bạn chấm tương thích ở ghép. Trả JSON với totalScore, breakdown, similarities, conflicts, explanation. Tuân thủ đúng trọng số đã cung cấp.' },
          { role: 'user', content: JSON.stringify({ weights: { sleepWake: 20, cleanliness: 15, noise: 10, smoking: 10, pets: 5, budget: 10, area: 10, gender: 5, school: 5, keywords: 10 }, profile, candidate }) },
        ],
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (_error) {
      return this.fallback.calculate(profile, candidate);
    }
  }
}

module.exports = AzureOpenAIMatchingProvider;

