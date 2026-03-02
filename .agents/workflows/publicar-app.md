---
description: Deploy automático de app Node.js na VPS via Coolify com configuração de DNS na Hostinger
---

# Workflow de Publicação: Coolify + Hostinger
Este workflow orienta o passo a passo seguro para o deploy de um aplicativo Node.js (Ex: Express + Frontend) na VPS via Coolify, focando em evitar os temidos erros `502 Bad Gateway` e `Cannot GET /`.
## 1. Preparação do Código Fonte (GitHub)
- **Frontend Estático exposto no Express:** Garanta que o arquivo principal do servidor (ex: `server.js`) possui o middleware para servir o HTML. Sem isso, a página carrega em branco com erro `Cannot GET /`.
  ```javascript
  const path = require('path');
  app.use(express.static(path.join(__dirname)));
  ```
- Com o código pronto, faça o `git commit` e envie (`git push`) para a branch `main` do repositório.

## 2. Criação do App no Coolify
- Crie uma nova aplicação conectando ao repositório do GitHub (se for repositório privado, autorize o acesso nas configurações do Coolify).

## 3. ⭐️ Checklist de Ouro (CRÍTICO ANTES DO DEPLOY) ⭐️
*Para evitar travamentos e erro 502, configure RIGOROSAMENTE as três regras abaixo antes de clicar em Deploy:*

1. **Variáveis de Ambiente Obrigatórias:** Vá em *Environment Variables* e cadastre todas as chaves (ex: `GEMINI_API_KEY`). Se o código exigir uma variável de ambiente ausente, o Node sofre um crash invisível e o Coolify retorna **Erro 502**.
2. **Desmarcar "Static Site":** Em *Configuration > General*, garanta que a opção "Is it a static site?" está **DESMARCADA**, pois o Coolify deve usar o Nixpacks para construir o container dinâmico do Node.
3. **Exposed Port (Porta de Exposição):** Verifique no código fonte em qual porta o servidor escuta (ex: `app.listen(3000)`). O campo **Ports Exposes** (*General*) **DEVE** ter esse exato número. Se o roteador interno bater na porta errada, o resultado também será **Erro 502**. 
   - *Opcional recomendado:* Defina explicitamente o "Start Command" como `node server.js`.

## 4. Deploy e Monitoramento
- Clique em **Deploy**.
- Em caso de falha contínua, verifique o Console Logs pela tela de Deployments ou use os comandos do docker (`docker logs <uuid-container>`).
- Aguarde o status mudar para **Running**.

## 5. Domínio Final e DNS (Hostinger)
- Realize o teste de sanidade acessando a aplicação pelo link provisório `.sslip.io` fornecido pelo Coolify.
- Se a página carregar corretamente, altere o campo **Domains** para o endereço de produção (ex: `https://www.meusite.com.br`).
- Vá ao painel DNS na **Hostinger** e aponte um registro tipo **A** para o endereço IP do servidor Coolify. O Traefik cuidará do roteamento e do certificado SSL/HTTPS automaticamente.