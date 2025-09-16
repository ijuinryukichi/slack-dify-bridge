import { validateConfig } from './config';
import { SlackHandler } from './slack-handler';

async function main() {
  console.log('🚀 Starting Slack-Dify Bridge...');
  
  validateConfig();
  
  const slackHandler = new SlackHandler();
  
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await slackHandler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await slackHandler.stop();
    process.exit(0);
  });

  try {
    await slackHandler.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});