# Descoberta pública

O frontend público oferece as rotas:

- `/buscar` para resultados projetados de produtos e conteúdo;
- `/marcas` e `/marcas/[slug]` para fabricantes e seus produtos;
- `/noticias`, `/blog` e `/eventos`, com páginas de detalhe;
- `/ofertas` para observações recentes dentro da janela de cada vendedor;
- `/sitemap.xml`, construído a partir dos endpoints públicos reais.

O autocomplete usa `/api/search/suggest` como boundary same-origin. A resposta
contém `id`, `type`, `title` e `url`; texto livre ou credenciais não são
serializados. Produtos são projetados para `/maquinas/[slug]` e conteúdo para a
rota compatível com seu tipo editorial.

A página de ofertas nunca expõe a URL externa armazenada. O navegador recebe
somente `/go/listing/<id>`, preservando validação, auditoria e política de
redirecionamento no backend. Ofertas antigas não entram no feed público.

As fixtures locais incluem dois produtos e uma publicação de cada tipo. Elas
são marcadas visualmente como sintéticas e continuam proibidas em produção.

A CSP gera nonce por requisição. O proxy repassa a política e `x-nonce` para o
renderizador do Next.js, que aplica o nonce aos scripts de hidratação. Como essa
estratégia exige renderização dinâmica, o layout raiz aguarda uma requisição
real por meio de `connection()`.
