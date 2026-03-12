---
description: Como instalar e configurar o N8N no Coolify e resolver erros de Inteligência Artificial (LangChain)
---

# Workflow de Instalação e Configuração: N8N + IA no Coolify
Este guia detalha o passo a passo para hospedar o N8N oficialmente via Coolify e, mais importante, como injetar as ferramentas nativas de I.A. (LangChain/Advanced AI) para evitar telas de erro em fluxos já existentes.

## 1. Instalação Básica no Coolify
- Acesse o painel do seu **Coolify**.
- Vá em **Projects** e crie ou selecione um projeto existente.
- Adicione um novo recurso: Escolha **Service** (Serviço) ao invés de App.
- Busque por **"N8N"** na lista oficial que já inclui o banco de dados PostgreSQL.
- O Coolify criará automaticamente o ambiente para a imagem `n8nio/n8n`.

## 2. ⭐️ O Segredo dos Pacotes Ocultos (Variáveis de Ambiente) ⭐️
*Pacotes da comunidade (como bibliotecas avançadas do LangChain) podem quebrar se instalados apenas pela tela do N8N na versão Free/Self-hosted.*

**ANTES** de fazer o Deploy inicial ou para arrumar erros de *Unrecognized Node*, você DEVE injetar suas extensões nativamente:
1. Dentro da configuração do serviço N8N no Coolify, acesse **Environment Variables**.
2. Clique para adicionar uma **Nova Variável**.
3. **Key:** Digite exatamente `N8N_COMMUNITY_PACKAGES`
4. **Value:** Digite o nome do pacote, por exemplo: `@n8n/n8n-nodes-langchain`
5. *(Recomendado para primeiro acesso sem SSL):* Adicione também a variável `N8N_SECURE_COOKIE` com o Value `false` (para conseguir logar no http provisório .sslip.io).
6. Salve tudo e clique no botão amarelo **Deploy** (ou Stop e Restart se ele já estiver rodando).

## 3. Substituição de Nós Quebrados (Upgrade de Versão)
*Se você importar um arquivo `.json` (Workflow) antigo e os nós de I.A. ficarem azuis com um símbolo de interrogação `? ` na frente, a estrutura interna do N8N da Hostinger não suporta mais aquele nome.*

1. **Jamais use "Community Nodes" para funções nativas:** A partir do N8N 1.x+, busque sempre pelas ferramentas na barra lateral (Advanced AI).
2. **Atualização do `Custom Code Tool`:** O antigo `.tool` agora tem um nome de sistema diferente (atualmente `toolCode` ou `toolCustomCode` dependendo da atualização da semana).
3. **Como reverter os fantasmas:**  
   - Apague os nós com `?` que vieram no seu arquivo importado.
   - Puxe os ícones equivalentes (pretos, engrenagens).
   - Opcionalmente (para desenvolvedores/programadores editando o Json): A troca manual em massa pode ser feita buscando e substituindo a tag `"type": "@n8n/n8n-nodes-langchain.XXX"` pela string validada gerada ao copiar o nó novo.

## 4. Configuração do WhatsApp - Avisos Rápidos
- **Token Vencido ("Session Expired"):** Códigos do painel **Meta for Developers** gerados para teste expiram estritamente a cada 24 horas. Para falhas em produção, troque esse token lá na Credencial salva (pelo ícone de lápis) ou configure o Token Permanente e o Aplicativo Oficial no painel da Meta.
- **Não Chega no Celular ("Regra de Ouro do Teste"):** O sandbox da Meta nunca envia texto livre para números não autorizados ou que não abriram diálogo. Aja como cliente real e mande você um simples "Oi" para a conta de teste primeiro. Depois tente o Execute Step de novo.
