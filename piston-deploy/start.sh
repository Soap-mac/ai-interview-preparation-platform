#!/bin/sh
/piston_api/src/docker-entrypoint.sh &
PISTON_PID=$!

echo "Waiting for Piston to be ready..."
until node -e "require('http').get('http://localhost:2000/api/v2/runtimes', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))" 2>/dev/null; do
  sleep 1
done
echo "Piston is up. Installing languages..."

node -e "const http=require('http');function install(lang,ver){return new Promise((res)=>{const data=JSON.stringify({language:lang,version:ver});const req=http.request({hostname:'localhost',port:2000,path:'/api/v2/packages',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{console.log(lang,ver,b);res();});});req.on('error',()=>res());req.write(data);req.end();});}(async()=>{await install('python','3.12.0');await install('java','15.0.2');await install('gcc','10.2.0');await install('node','18.15.0');console.log('All languages installed.');})();"

wait $PISTON_PID