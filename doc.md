# Plataforma de Mockup Dinâmico - Documentação Completa

## Visão Geral

Sistema para geração de mockups personalizados de produtos como:

* camisetas
* canecas
* bonés
* chinelos
* futuros produtos dinâmicos

---

## Objetivo

Permitir que usuários:

1. escolham um produto
2. personalizem com imagem/texto
3. visualizem em tempo real
4. gerem mockup final

---

## Arquitetura

Frontend (Next.js)
Backend (Node.js)
Banco (PostgreSQL)
Storage (local/S3)

---

## Estrutura de Projetos

### Frontend

* editor visual
* seleção de produtos
* preview em tempo real

### Backend

* produtos
* variantes
* upload
* geração de mockups

---

## UX Editor

### Layout

* sidebar com ferramentas
* preview central
* botão gerar mockup

### Funcionalidades

* upload imagem
* arrastar e redimensionar
* adicionar texto
* trocar cor do produto
* gerar imagem final

---

## Render Engine

### Input

* imagem base
* imagem do usuário
* transformações

### Processo

1. carregar imagens
2. aplicar transformações
3. compor
4. gerar PNG

### Output

* imagem final pronta

---

## API

POST /upload
POST /mockup/generate
GET /products

---

## Banco

### products

* id
* name
* base_image

### variants

* atributos (cor, tamanho)

### mockup_areas

* área de renderização

---

## Deploy

Render (free):

* backend
* banco

Frontend:

* Vercel ou Render

---

## Evolução futura

* fila com Redis
* worker separado
* pagamentos
* e-commerce completo

---

## Custos

Inicial:

* praticamente zero

---

## Conclusão

Sistema enxuto, escalável e validável rapidamente.
