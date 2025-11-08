#!/bin/sh
set -euo pipefail

: "${VAULT_ADDR:?VAULT_ADDR is required}"
: "${VAULT_UNSEAL_KEY:?VAULT_UNSEAL_KEY is required}"

echo "[unseal] CA at /ca.crt, Vault at $VAULT_ADDR"

echo "[unseal] wait for HTTPS socket..."
# /v1/sys/seal-status returns 200 even when sealed -> good readiness
until curl -sS --cacert /ca.crt "$VAULT_ADDR/v1/sys/seal-status" >/dev/null; do
  sleep 1
done

echo "[unseal] posting unseal key..."
curl -sS --cacert /ca.crt -X POST \
  -H 'Content-Type: application/json' \
  -d "{\"key\":\"$VAULT_UNSEAL_KEY\"}" \
  "$VAULT_ADDR/v1/sys/unseal" | sed -n '1,200p'

echo "[unseal] verifying sealed=false..."
until curl -sS --cacert /ca.crt "$VAULT_ADDR/v1/sys/seal-status" | grep -q '"sealed":false'; do
  sleep 1
done

echo "[unseal] Vault is unsealed."
