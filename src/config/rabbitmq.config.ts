export const rabbitMQConfig = () => ({
  exchanges: {
    consumer: {
      document: 'dobby_requests',
    },
    publisher: {},
  },
  queues: {
    documentRequest: 'document.request.queue',
  },
  routingKeys: {
    documentRequest: 'document.request',
  },
});
