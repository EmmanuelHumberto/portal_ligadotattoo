# ADR-0001 — Taxonomia do catálogo e separação de fontes

Status: Aceito
Data: 2026-08-14

## Contexto

O portal coleta produtos de duas naturezas de fonte: sites de fabricantes e
sites de revenda/representantes. A mistura das duas gerava ambiguidade (o preço
podia aparecer tanto na "ficha técnica" quanto nas "ofertas") e a classificação
de tipos ficava inconsistente.

## Decisão

1. **Fonte dos dados**
   - Fabricante (`ingestion.source kind=MANUFACTURER`) → **ficha técnica do
     equipamento**: a lista oficial de produtos para consulta de dados, valor,
     manual e especificações. Essa base fica como está; novas funcionalidades
     evoluem sobre ela.
   - Revenda/representante (`RETAILER`) → **ofertas** (`commerce.price_observation`),
     exibidas na seção "Ofertas" da página do produto com link externo.

2. **Taxonomia de tipos (`product_type_key`)**
   - Equipamento: `PEN` (máquina pen), `ROTARY` (rotativa), `COIL` (bobina),
     `POWER_SUPPLY` (fonte), `BATTERY` (bateria).
   - Insumos: `INK` (tinta), `CARTRIDGE` (cartucho).
   - `ACCESSORY`: **todo o resto** — o que não é equipamento, tinta ou cartucho.

3. **Reclassificação pontual**
   - Correções de tipo são feitas no admin (`PATCH /admin/products/:id/type`),
     com auditoria (fact `product_type` `CURATOR_MANUAL`) e re-sincronização da busca.
   - Não exige re-rodar a descoberta (que não re-classifica produtos já existentes).

## Consequências

- A seção "Ofertas" de um produto oficial lista o link do fabricante mesmo sem
  preço (offer com `amount` nulo); revendedores adicionam preços quando coletados.
- `classifyProductType` deve seguir a taxonomia acima; violações pontuais são
  corrigidas pela ferramenta de reclassificação, nunca por re-descoberta.
