const WORKER_URL = 'https://apisecure.lagcoder.workers.dev';

async function testConnection() {
  try {
    const response = await fetch(`${WORKER_URL}?q=Inception`);
    const data = await response.json();
    console.log('Worker is working securely:', data);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
