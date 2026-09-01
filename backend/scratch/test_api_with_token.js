import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/notifications/birthdays/upcoming?days=30',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer admin_session_token'
  }
};

http.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('API Response Data:', JSON.stringify(parsed, null, 2));
  });
}).on('error', (err) => {
  console.error('HTTP Request Error:', err.message);
});
