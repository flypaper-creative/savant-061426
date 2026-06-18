import http from 'http';

http.get('http://localhost:3000/assets/ast/ast.glb', (res) => {
  console.log('ast.glb:', res.statusCode, res.headers['content-type']);
  
  http.get('http://localhost:3000/assets/ship/ship.glb', (res) => {
    console.log('ship.glb:', res.statusCode, res.headers['content-type']);
    
    http.get('http://localhost:3000/assets/logo7/logo7.glb', (res) => {
        console.log('logo7.glb:', res.statusCode, res.headers['content-type']);
        process.exit(0);
    });
  });
});
