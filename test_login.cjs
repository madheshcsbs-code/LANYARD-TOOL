// Login connectivity test script
const http = require('http');

const BASE_URL = 'http://127.0.0.1:5001';

const accounts = [
  { email: 'admin@gotek.com',   password: 'admin123',  role: 'super-admin' },
  { email: 'admin1@gmail.com',  password: 'admin123',  role: 'super-admin' },
  { email: 'sub1@gmail.com',    password: 'sub11234',  role: 'admin' },
  { email: 'user1@gmail.com',   password: 'user123',   role: 'user' },
  { email: 'user2@gmail.com',   password: 'user123',   role: 'user' },
  { email: 'admin@gotek.com',   password: 'WRONGPASS', role: 'SHOULD FAIL' },
];

function postLogin(email, password) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email, password });
    const options = {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 'ERROR', body: err.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 'TIMEOUT', body: 'Request timed out' }); });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(65));
  console.log('  LOGIN CONNECTIVITY TEST — http://127.0.0.1:5001');
  console.log('='.repeat(65));

  let passed = 0, failed = 0;

  for (const acc of accounts) {
    const shouldFail = acc.role === 'SHOULD FAIL';
    const result = await postLogin(acc.email, acc.password);
    const success = result.status === 200;
    const statusIcon = shouldFail ? (success ? '❌ UNEXPECTED PASS' : '✅ Correctly Rejected') : (success ? '✅ SUCCESS' : '❌ FAILED');

    if (shouldFail) {
      if (!success) passed++; else failed++;
    } else {
      if (success) passed++; else failed++;
    }

    console.log('');
    console.log(`  ${statusIcon}`);
    console.log(`  Email   : ${acc.email}`);
    console.log(`  Password: ${acc.password}`);
    console.log(`  Role    : ${acc.role}`);
    console.log(`  HTTP    : ${result.status}`);
    if (success && result.body.token) {
      console.log(`  Token   : ${result.body.token.substring(0, 40)}...`);
      console.log(`  Name    : ${result.body.name} (${result.body.role})`);
    } else if (result.body.message) {
      console.log(`  Message : ${result.body.message}`);
    }
    console.log('  ' + '-'.repeat(60));
  }

  console.log('');
  console.log('='.repeat(65));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${accounts.length} tests`);
  console.log('='.repeat(65));
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
