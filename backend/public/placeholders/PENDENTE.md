# ⚠️ PLACEHOLDERS — Imagens Pendentes do Cliente

Esta pasta contém imagens **placeholder** provisórias para o funcionamento inicial do sistema.

## 🔴 AÇÃO NECESSÁRIA DO CLIENTE

As imagens abaixo precisam ser substituídas pelas imagens reais dos produtos:

| Arquivo                    | Status        | Observação                                     |
|----------------------------|---------------|------------------------------------------------|
| `camiseta-branca.png`      | ⚠️ Placeholder | PNG com fundo transparente, 500x500px ou mais |
| `caneca-branca.png`        | ⚠️ Placeholder | PNG com fundo transparente, 500x500px ou mais |
| `bone-preto.png`           | ⚠️ Placeholder | PNG com fundo transparente, 500x500px ou mais |
| `chinelo-natural.png`      | ⚠️ Placeholder | PNG com fundo transparente, 500x500px ou mais |

## 📐 Especificações das imagens reais

- **Formato:** PNG com fundo transparente (canal alpha)
- **Tamanho recomendado:** mínimo 500x500px, ideal 800x800px
- **Resolução:** 72dpi para web, 150dpi+ para impressão
- **Proporção:** quadrada (1:1) ou conforme o produto

## 📍 Coordenadas da área de personalização

Junto com as imagens, precisamos que o cliente informe (ou que mediremos juntos):

- Posição X e Y onde a arte começa no produto
- Largura e altura da área de personalização

Esses valores ficam no banco de dados (tabela `product_mockup_areas`) e podem ser ajustados pelo admin sem precisar de deploy.

---

> Atualizado em: 2026-05-04
> Responsável: Tech Lead / Agent 04
