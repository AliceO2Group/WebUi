#!/usr/bin/env sh
set -euo pipefail

export VAULT_ADDR="${VAULT_ADDR:-https://vault.local:9300}"
export VAULT_CACERT=${VAULT_CACERT:-/vault/config/ca.crt}
export VAULT_TLS_SERVER_NAME=${VAULT_TLS_SERVER_NAME:-vault.local}

echo "[vault-setup] VAULT_ADDR=$VAULT_ADDR"
echo "[vault-setup] VAULT_CACERT=$VAULT_CACERT"
echo "[vault-setup] VAULT_TLS_SERVER_NAME=$VAULT_TLS_SERVER_NAME"

echo "[vault-setup] Waiting for Vault to respond..."
for i in $(seq 1 60); do
  if vault status >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

status_json=$(vault status -format=json || true)
initialized=$(echo "$status_json" | sed -n 's/.*"initialized":[[:space:]]*\(true\|false\).*/\1/p')
sealed=$(echo "$status_json" | sed -n 's/.*"sealed":[[:space:]]*\(true\|false\).*/\1/p')

echo "[vault-setup] current status: initialized=$initialized, sealed=$sealed"

UNSEAL_KEY=""
ROOT_TOKEN=""

if [ "$initialized" = "false" ]; then
  echo "[vault-setup] Vault NOT initialized. Running operator init (text output)..."

  init_output=$(vault operator init -key-shares=1 -key-threshold=1)

  UNSEAL_KEY=$(printf '%s\n' "$init_output" | awk '/Unseal Key 1:/ {print $NF}')
  ROOT_TOKEN=$(printf '%s\n' "$init_output" | awk '/Initial Root Token:/ {print $NF}')

  if [ -z "$UNSEAL_KEY" ] || [ -z "$ROOT_TOKEN" ]; then
    echo "[vault-setup] ERROR: Failed to parse UNSEAL_KEY or ROOT_TOKEN from vault operator init output."
    exit 1
  fi

  mkdir -p /vault/data
  echo "$UNSEAL_KEY" > /vault/data/unseal_key
  echo "$ROOT_TOKEN" > /vault/data/root_token

  export VAULT_TOKEN="$ROOT_TOKEN"
else
  echo "[vault-setup] Vault already initialized."

  if [ -f /vault/data/root_token ]; then
    ROOT_TOKEN=$(cat /vault/data/root_token)
    export VAULT_TOKEN="$ROOT_TOKEN"
    echo "[vault-setup] Loaded ROOT_TOKEN from /vault/data/root_token"
  else
    echo "[vault-setup] WARNING: /vault/data/root_token missing. Some config may fail."
  fi

  if [ -f /vault/data/unseal_key ]; then
    UNSEAL_KEY=$(cat /vault/data/unseal_key)
    echo "[vault-setup] Loaded UNSEAL_KEY from /vault/data/unseal_key"
  else
    echo "[vault-setup] WARNING: /vault/data/unseal_key missing. Cannot auto-unseal if sealed."
  fi
fi


status_json=$(vault status -format=json || true)
sealed=$(echo "$status_json" | sed -n 's/.*"sealed":[[:space:]]*\(true\|false\).*/\1/p')
echo "[vault-setup] status after init: sealed=$sealed"

if [ "$sealed" = "true" ]; then
  if [ -z "${UNSEAL_KEY:-}" ]; then
    echo "[vault-setup] ERROR: Vault is sealed and UNSEAL_KEY is not available."
    exit 1
  fi

  echo "[vault-setup] Unsealing Vault..."
  vault operator unseal "$UNSEAL_KEY"
else
  echo "[vault-setup] Vault already unsealed."
fi

echo "[vault-setup] Ensuring Vault is reachable with token..."
if [ -n "${VAULT_TOKEN:-}" ]; then
  vault token lookup >/dev/null 2>&1 || echo "[vault-setup] WARNING: VAULT_TOKEN may be invalid."
else
  echo "[vault-setup] WARNING: VAULT_TOKEN not set – policy/config steps may fail."
fi

####################################
# VAULT CONFIGURATION STEPS
####################################

if [ -n "${VAULT_TOKEN:-}" ]; then
  echo "[vault-setup] Enabling secrets engines..."
  vault secrets enable transit 2>/dev/null || echo "[vault-setup] transit already enabled"
  vault secrets enable -path=tokenization kv-v2 2>/dev/null || echo "[vault-setup] tokenization kv-v2 already enabled"

  echo "[vault-setup] Creating transit key for tokenization..."
  vault write transit/keys/tokenization-signing type="ed25519" 2>/dev/null || echo "[vault-setup] transit key already exists"

  echo "[vault-setup] Writing smoke KV seed..."
  vault kv put tokenization/smoke/seed ok=true source="vault-setup" 2>/dev/null || echo "[vault-setup] smoke seed already present / write failed"


  echo "[vault-setup] Seeding clients into KV + Transit..."

  CLIENTS_DIR="/vault/config/generated-clients"

  if [ ! -d "$CLIENTS_DIR" ]; then
    echo "[vault-setup] WARN: $CLIENTS_DIR not found, skipping client seeding"
  else
    for serial_file in "$CLIENTS_DIR"/*.serial; do
      [ -e "$serial_file" ] || { echo "[vault-setup] No *.serial files found, skipping"; break; }

      base_name="$(basename "$serial_file" .serial)" 
      serial_hex="$(cat "$serial_file" | tr -d '\r\n[:space:]')" 
      serial_id="${serial_hex}" 

      crt_file="$CLIENTS_DIR/${base_name}.crt"
      pub_file="$CLIENTS_DIR/${base_name}.pub.pem"

      if [ ! -f "$crt_file" ]; then
        echo "[vault-setup] WARN: Missing cert for $base_name ($crt_file), skipping"
        continue
      fi
      if [ ! -f "$pub_file" ]; then
        echo "[vault-setup] WARN: Missing public key for $base_name ($pub_file), skipping"
        continue
      fi

      echo "[vault-setup] -> client=$base_name serial=$serial_id"

      vault kv put "tokenization/${serial_id}" \
        certificate="$(cat "$crt_file")" \
        2>/dev/null || echo "[vault-setup] WARN: KV write failed for ${serial_id}"

      vault write "transit/keys/${serial_id}-public-key" type="rsa-2048" \
        2>/dev/null || echo "[vault-setup] transit key already exists: ${serial_id}-public-key"
    done
    
    echo "[vault-setup] Verifying seeded KV..."
    vault kv get tokenization/0x01 >/dev/null
    vault kv get tokenization/0x0A >/dev/null
    echo "[vault-setup] KV seed verified OK."
  fi


  echo "[vault-setup] Creating central-system policy..."
  vault policy write central-system - <<EOF
path "transit/encrypt/*" {
  capabilities = ["update"]
}

path "transit/decrypt/*" {
  capabilities = ["update"]
}

path "tokenization/data/*" {
  capabilities = ["create", "update", "read", "delete", "list"]
}

path "transit/keys/*" {
  capabilities = ["create", "read", "update", "delete"]
}

path "transit/sign/tokenization-signing" {
  capabilities = ["update"]
}

path "tokenization/metadata/*" {
  capabilities = ["read", "list"]
}
EOF

  echo "[vault-setup] Enabling cert auth for central-system..."
  vault auth enable cert 2>/dev/null || echo "[vault-setup] cert auth already enabled"

  vault write auth/cert/certs/central-system \
    display_name="central-system" \
    policies="central-system" \
    certificate=@/vault/config/central-system-client.crt \
    ttl=24h 2>/dev/null || echo "[vault-setup] central-system cert role already exists"
else
  echo "[vault-setup] Skipping policy / auth config – no VAULT_TOKEN."
fi

echo "[vault-setup] Initialization + unseal + config finished OK."
exit 0
