# Aquisição segura de fontes

O Worker possui uma única fronteira para aquisição de conteúdo externo:
`HttpAcquirer`. Crawlers e importadores não devem usar `fetch` diretamente.

Antes de abrir uma conexão, o acquirer exige:

- URL HTTPS na porta padrão 443;
- ausência de usuário e senha na URL;
- host exatamente registrado em `allowed_hosts`;
- todas as respostas DNS classificadas como públicas;
- DNS pinado na conexão HTTPS já validada, preservando hostname/SNI;
- revalidação completa de cada redirect;
- no máximo cinco redirects;
- limite de corpo configurável entre 1 byte e 10 MB, aplicado durante streaming e por
  `Content-Length` quando presente;
- deadline total entre 100 ms e 60 s para toda a cadeia;
- DNS incluído no deadline, corpo final vazio rejeitado e compressão desabilitada;
- ausência de cookies, autorização ou headers recebidos do usuário.

São rejeitados loopback, redes privadas, link-local, CGNAT, benchmark,
documentação, multicast/reservados, IPv6 local/link-local/multicast e IPv4
mapeado em IPv6. Se qualquer resposta DNS for não pública, a aquisição inteira
é rejeitada. Isso mantém uma postura conservadora diante de respostas mistas e
tentativas de DNS rebinding.

Falhas ficam limitadas ao diagnóstico persistido por `IngestionRunner`; conteúdo
adquirido continua gerando somente snapshots e candidatos, nunca fatos
canônicos diretamente.
