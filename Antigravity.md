# Antigravity - Guia de Criação de Workflows n8n

## Visão Geral

Este documento serve como referência para a criação de fluxos de trabalho de alta qualidade no n8n. O Antigravity utilizará as seguintes ferramentas:

### Ferramentas Disponíveis

| Ferramenta | Descrição | Status |
|------------|-----------|--------|
| **n8n MCP Server** | Servidor MCP para interação direta com instância n8n | 🔜 Pendente |
| **n8n Skills** | Conjunto de skills especializadas para criação de workflows | 🔜 Pendente |

---

## Como Solicitar um Workflow

Ao pedir para criar um workflow, forneça as seguintes informações:

1. **Objetivo do Workflow**: O que o fluxo deve fazer?
2. **Trigger/Gatilho**: O que inicia o workflow? (webhook, agendamento, evento, etc.)
3. **Integrações**: Quais serviços/APIs serão usados?
4. **Transformações de Dados**: Que manipulações de dados são necessárias?
5. **Saída Esperada**: Qual o resultado final desejado?

---

## Configuração das Ferramentas

### n8n MCP Server

> [!NOTE]
> Repositório: https://github.com/czlonkowski/n8n-mcp

**Para configurar:**
1. Configure o servidor MCP com as credenciais da sua instância n8n
2. Forneça acesso ao Antigravity via configuração MCP

### n8n Skills

> [!NOTE]
> Repositório: https://github.com/czlonkowski/n8n-skills

**Para usar:**
1. Clone ou baixe as skills do repositório
2. Configure o caminho das skills no ambiente

---

## Padrões de Workflow

### Estrutura Recomendada

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│   Validar   │────▶│  Processar  │────▶│   Output    │
│   (Start)   │     │    Input    │     │    Dados    │     │   (End)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Boas Práticas

- ✅ Sempre adicione tratamento de erros
- ✅ Use nomes descritivos para os nós
- ✅ Documente o propósito de cada workflow
- ✅ Teste com dados reais ou mock antes de produção
- ✅ Configure retry policies para operações externas
- ✅ Use variáveis de ambiente para credenciais sensíveis

---

## Workflows Criados

| # | Nome | Descrição | Data | Status |
|---|------|-----------|------|--------|
| - | - | Nenhum workflow criado ainda | - | - |

---

## Próximos Passos

1. **Configurar o n8n MCP Server** - Conectar o Antigravity à sua instância n8n
2. **Adicionar n8n Skills** - Importar as skills para uso nas criações
3. **Primeiro Workflow** - Criar o primeiro fluxo de teste

---

## Histórico de Atualizações

| Data | Descrição |
|------|-----------|
| 2026-01-31 | Criação inicial do documento |
