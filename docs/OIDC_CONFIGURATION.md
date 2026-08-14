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

## Modo de sessão do Admin

O login é delegado ao adaptador OIDC da implantação (ex.: gateway/edge com
Authorization Code + PKCE). O adaptador é responsável por emitir a sessão e
pode:

- gravar o access token em cookie HttpOnly (`pt_session`, renomeável via
  `ADMIN_SESSION_COOKIE`); ou
- encaminhar o header `Authorization` para o Web.

O Web (Next.js, server-side) lê o cookie/header e encaminha `Authorization:
Bearer` à API; o token nunca é exposto ao navegador. A API valida o Bearer via
JWKS (`OidcAccessTokenVerifier`) e popula o ator.

`GET /admin/me` (`MeController`) devolve o perfil do ator autenticado
(`actorId`, `externalSubject`, `capabilities`, `authenticationLevel`) para o
shell administrativo. `ADMIN_LOGIN_URL` e `ADMIN_LOGOUT_URL` controlam os links
de entrada/saída do provedor.

### Fronteira CSRF

Mutações administrativas trafegam server-side com Bearer, portanto **não**
dependem de cookie CSRF (`OriginCsrfGuard` retorna `true` para Bearer). O guard
CSRF aplica-se apenas a mutações de navegador sem Bearer. Hoje a única mutação
pública é `POST /analytics/events`; protegê-la por CSRF (emissão de `pt_csrf` +
header `X-CSRF-Token`) é pendência explícita, não bloqueio do caminho admin.
