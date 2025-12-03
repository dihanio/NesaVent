// Test Redis Connection
require('dotenv').config();
const Redis = require('ioredis');

console.log('Testing Redis connection...');
console.log('Host:', process.env.REDIS_HOST);
console.log('Port:', process.env.REDIS_PORT);

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false
});

redis.on('connect', () => {
  console.log('✓ Redis: Connected successfully');
});

redis.on('ready', async () => {
  console.log('✓ Redis: Ready to accept commands');
  
  try {
    // Test PING
    const pingResult = await redis.ping();
    console.log('✓ PING:', pingResult);
    
    // Test SET
    await redis.set('test:connection', 'success', 'EX', 60);
    console.log('✓ SET: Key created');
    
    // Test GET
    const value = await redis.get('test:connection');
    console.log('✓ GET:', value);
    
    // Test cache stats
    const info = await redis.info('stats');
    console.log('✓ Redis Stats:', info.split('\n').slice(0, 5).join('\n'));
    
    console.log('\n✅ All Redis tests passed!');
    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    redis.disconnect();
    process.exit(1);
  }
});

redis.on('error', (err) => {
  console.error('✗ Redis error:', err.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('✗ Connection timeout after 15 seconds');
  redis.disconnect();
  process.exit(1);
}, 15000);
