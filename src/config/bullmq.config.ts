export const bullConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  defaultJobOptions: {
    attempts: Number(process.env.BULL_RETRY_ATTEMPTS) || 3,
    backoff: {
      type: 'exponential',
      delay: Number(process.env.BULL_BACKOFF_DELAY) || 5000,
    },
    removeOnComplete: process.env.BULL_REMOVE_ON_COMPLETE === 'true',
    removeOnFail: process.env.BULL_REMOVE_ON_FAIL === 'true',
  },
};
