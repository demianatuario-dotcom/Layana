const fs = require('fs');
const filePath = 'C:/Users/Demian/OneDrive/Desktop/N8N/Layana/Lana_Flow.json';

let rawdata = fs.readFileSync(filePath);
let flow = JSON.parse(rawdata);

const evoNode = {
  "parameters": {
    "method": "POST",
    "url": "http://evo-n8ks88g0c0gk4848o8occs44.76.13.234.225.sslip.io:8080/message/sendText/Layana",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "apikey",
          "value": "LanaWolfArt2026"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "{\n  \"number\": \"5561981171564\",\n  \"text\": \"Oi Layana! A Lana_AI acabou de instalar a Evolution API com sucesso e agora mandaremos mensagens via QR Code no seu proprio celular. Bem-vinda a nuvem livre!\"\n}",
    "options": {}
  },
  "id": "evo_api_1",
  "name": "Evo API Teste Envio",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [
    800,
    0
  ]
};

let replaced = false;
flow.nodes = flow.nodes.map(n => {
  if (n.type === 'n8n-nodes-base.whatsApp') {
    replaced = true;
    return evoNode;
  }
  return n;
});

if (replaced) {
   fs.writeFileSync(filePath, JSON.stringify(flow, null, 2));
   console.log('Fluxo atualizado para Evolution API com sucesso!');
} else {
   console.log('No WhatsApp nao encontrado.');
}
