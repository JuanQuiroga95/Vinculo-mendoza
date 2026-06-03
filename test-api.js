import https from 'https';

const options = {
  hostname: 'vinculo-mendoza-qzfc0gr19-juanpabloquiroga95-1031s-projects.vercel.app',
  port: 443,
  path: '/api/teachers/visits',
  method: 'GET',
  headers: {
    // Assuming no token needed just to see if it 500s or 401s
    // If it 401s, then the 500 is fixed!
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
