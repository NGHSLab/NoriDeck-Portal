const http=require('http'),fs=require('fs'),p=require('path');
const types={'.svg':'image/svg+xml','.html':'text/html; charset=utf-8','.png':'image/png','.css':'text/css','.js':'text/javascript'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const f=p.join(__dirname,u);
fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':types[p.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(8766);
