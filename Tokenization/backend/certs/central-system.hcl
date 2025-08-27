# allow signing with issuer-jws key
path "transit/sign/issuer-jws" {
  capabilities = ["update"]
}

# allow reading issuer-jws public key
path "transit/keys/issuer-jws" {
  capabilities = ["read"]
}

# allow reading client metadata and keys
path "kv/data/clients/*" {
  capabilities = ["read"]
}
