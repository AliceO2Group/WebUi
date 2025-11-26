#!/usr/bin/env bash
set -euo pipefail

VAULT_DIR="./Tokenization/docker/vault"

echo "[Vault CI] Generating test CA..."
openssl genrsa -out "$VAULT_DIR/ca.key" 4096
openssl req -x509 -new -nodes -key "$VAULT_DIR/ca.key" -sha256 -days 3650 \
  -out "$VAULT_DIR/ca.crt" \
  -subj "/CN=TestVaultCA"

echo "[Vault CI] Generating Vault server key/cert..."
openssl genrsa -out "$VAULT_DIR/vault.key" 2048
openssl req -new -key "$VAULT_DIR/vault.key" -out "$VAULT_DIR/vault.csr" \
  -subj "/CN=vault.local"

cat > "$VAULT_DIR/vault.ext" <<EOF
subjectAltName = @alt_names
[alt_names]
DNS.1 = vault.local
DNS.2 = localhost
IP.1  = 127.0.0.1
EOF

openssl x509 -req -in "$VAULT_DIR/vault.csr" -CA "$VAULT_DIR/ca.crt" -CAkey "$VAULT_DIR/ca.key" \
  -CAcreateserial -out "$VAULT_DIR/vault.crt" -days 365 \
  -extfile "$VAULT_DIR/vault.ext"

echo "[Vault CI] Generating Central System client key/cert..."
openssl genrsa -out "$VAULT_DIR/central-system.key" 2048
openssl req -new -key "$VAULT_DIR/central-system.key" -out "$VAULT_DIR/central-system.csr" \
  -subj "/CN=central-system"

openssl x509 -req -in "$VAULT_DIR/central-system.csr" -CA "$VAULT_DIR/ca.crt" -CAkey "$VAULT_DIR/ca.key" \
  -CAcreateserial -out "$VAULT_DIR/central-system.crt" -days 365

echo "[Vault CI] Generated files:"
ls -l "$VAULT_DIR"
