openssl genrsa -des3 -passout pass:localhost -out server.pass.key 2048
openssl rsa -passin pass:localhost -in server.pass.key -out server.key
rm server.pass.key
openssl req -new -key server.key -out server.csr
openssl x509 -req -sha256 -extfile v3.ext -days 365 -in server.csr -signkey server.key -out server.crt
rm server.csr