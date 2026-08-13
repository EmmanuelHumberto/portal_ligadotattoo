# Configuração OIDC da API

A API valida access tokens JWT assinados usando o JWKS remoto do provedor.
Rotas públicas continuam acessíveis sem OIDC; rotas protegidas respondem `401`
quando a configuração está ausente.

## Variáveis obrigatórias

```dotenv
OIDC_ISSUER=https://identity.example.com/
OIDC_AUDIENCE=portal-api
OIDC_JWKS_URI=https://identity.example.com/.well-known/jwks.json
```

Configurações opcionais:

```dotenv
OIDC_ALLOWED_ALGORITHMS=RS256
OIDC_ACTOR_ID_CLAIM=sub
OIDC_CAPABILITIES_CLAIM=capabilities
OIDC_CLOCK_TOLERANCE_SECONDS=5
```

`OIDC_AUDIENCE` e `OIDC_ALLOWED_ALGORITHMS` aceitam valores separados por
vírgula. O algoritmo deve ser assimétrico e estar na lista permitida pelo
adaptador. Em ambientes não locais, issuer e JWKS devem usar HTTPS.

O token deve conter:

- `sub` válido;
- audience compatível;
- issuer idêntico ao configurado;
- `exp` ainda válido;
- claim de ator configurada;
- claim de capacidades como array de strings ou string separada por espaços.

O guard converte falhas de assinatura, rotação de chave, claims ou expiração em
`401 Invalid or expired bearer token`, sem enviar detalhes criptográficos ao
cliente. Configuração parcial é tratada como erro de inicialização.
