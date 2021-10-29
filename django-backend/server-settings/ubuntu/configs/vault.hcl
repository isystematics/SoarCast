disable_cache = true
disable_mlock = true
ui = true
listener "tcp" {
    address = "127.0.0.1:8200"
    tls_disable = 1
}
storage "file" {
  path = "/app/vault"
}

api_addr = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"
ui = true