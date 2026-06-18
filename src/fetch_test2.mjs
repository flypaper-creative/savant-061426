import http from 'http';

http.get('http://localhost:3000/assets/bkgs/ORION_NEBULA.png', (res) => {
  console.log('ORION_NEBULA.png:', res.statusCode, res.headers['content-type']);
  process.exit(0);
});
