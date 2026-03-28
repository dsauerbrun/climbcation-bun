running locally with ssl

openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes

set DATABASE_URL in env vars. Run `bun run codegen`
