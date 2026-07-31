const { app } = require('@azure/functions');

app.http('health-check', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Azure Function health-check triggered');
    return {
      status: 200,
      jsonBody: {
        service: 'smart-roommate-function',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'azure-functions-v4',
      },
    };
  },
});
