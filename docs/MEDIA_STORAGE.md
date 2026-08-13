# Storage e upload de mídia

A API armazena originais em um bucket S3 compatível. MinIO é usado no ambiente
local; AWS S3 ou outro endpoint compatível pode ser configurado em staging.

## Configuração local

```dotenv
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_BUCKET=portal-media
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY=portal_dev
OBJECT_STORAGE_SECRET_KEY=portal_dev_secret
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_AUTO_CREATE_BUCKET=true
```

`OBJECT_STORAGE_AUTO_CREATE_BUCKET` deve permanecer `false` em produção. Sem
endpoint explícito, o SDK utiliza a resolução padrão da AWS. As credenciais
podem ser omitidas em produção para usar a cadeia de credenciais do runtime;
quando fornecidas, access key e secret devem existir juntas.

## Endpoint

`POST /admin/media/upload` aceita `multipart/form-data`, campo `file`, e exige a
capacidade `media.review`.

```bash
curl -X POST http://localhost:3001/admin/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@imagem.png;type=image/png"
```

Formatos permitidos: JPEG, PNG, WebP, AVIF e PDF. O limite é 20 MiB para imagens
e 25 MiB para PDF. MIME, tamanho e magic bytes são verificados antes do envio.

O nome original não compõe a chave. A API gera uma chave UUID particionada por
ano/mês, calcula SHA-256, grava o objeto privado e confirma os mesmos metadados
no PostgreSQL. Se a transação falhar, o objeto é excluído por compensação.

Novos assets começam com direitos `UNKNOWN`; portanto, não aparecem nos DTOs
públicos até que direitos `PERMITTED` sejam registrados. O bucket de originais
não deve possuir política pública. `MEDIA_PUBLIC_BASE_URL` deve apontar para a
camada de entrega/CDN destinada apenas a objetos publicáveis.

## Variantes

O evento `media.asset_uploaded` cria um job idempotente
`media.create_variants`. O Worker lê o original privado e produz WebP sem
ampliação artificial:

- `thumb`: largura máxima de 320 px;
- `card`: largura máxima de 640 px;
- `hero`: largura máxima de 1280 px.

Orientação EXIF é aplicada e metadados do original não são copiados. As chaves
derivadas são determinísticas, portanto retries sobrescrevem os mesmos objetos.
O decoder rejeita originais acima de 25 MiB ou 40 milhões de pixels.
