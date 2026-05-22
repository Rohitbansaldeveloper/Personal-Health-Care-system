const net = require('net');
const server = net.createServer((c) => {
  const client = net.createConnection({ port: 8080, host: '::1' }, () => {
    c.pipe(client);
    client.pipe(c);
  });
  client.on('error', () => c.end());
  c.on('error', () => client.end());
});
server.listen(8080, '127.0.0.1', () => console.log('Successfully proxying IPv4 localhost:8080 to WSL Jenkins!'));
