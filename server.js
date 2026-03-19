const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos (index.html, imagens, etc) da pasta atual
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("ERRO FATAL: GEMINI_API_KEY não está definida no arquivo .env");
    process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const fs = require('fs');
const multer = require('multer');
const OpenAI = require('openai');

const upload = multer({ dest: 'uploads/' });

if (!process.env.OPENAI_API_KEY) {
    console.error("AVISO: OPENAI_API_KEY não está definida no arquivo .env");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { systemInstruction, contents, generationConfig } = req.body;

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction,
                contents,
                generationConfig
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro da API Gemini:", response.status, errorText);
            return res.status(response.status).json({ error: 'Erro ao se comunicar com a API do Gemini', details: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Erro Interno do Servidor:", error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/simulate', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]), async (req, res) => {
    try {
        const procedure = req.body.procedure;
        const promptInfo = req.body.prompt;
        
        if (!req.files || !req.files['image']) {
            return res.status(400).json({ error: 'Imagem não fornecida' });
        }

        const imageFile = req.files['image'][0];
        const maskFile = req.files['mask'] ? req.files['mask'][0] : null;

        // OpenAI exige que o arquivo termine em .png para inferir o mimetype corretamente (multer não adiciona extensão)
        const imagePathPng = imageFile.path + '.png';
        fs.renameSync(imageFile.path, imagePathPng);
        
        let maskPathPng = null;
        if (maskFile) {
            maskPathPng = maskFile.path + '.png';
            fs.renameSync(maskFile.path, maskPathPng);
        }

        // 1. Chamar OpenAI DALL-E 2 para editar a imagem
        // A API exige que a imagem seja um PNG quadrado.
        // O Frontend deve enviar a imagem e a máscara já no formato correto (512x512 PNG).
        let imageUrl = "";
        try {
            const { toFile } = require('openai');
            const openaiArgs = {
                image: await toFile(fs.createReadStream(imagePathPng), 'image.png', { type: 'image/png' }),
                prompt: `Subtle, highly realistic, and professional cosmetic procedure: ${procedure}. ${promptInfo}. The aesthetic enhancement must be extremely discrete, delicate, and anatomically safe. Preserve the exact original facial structure, lighting, and skin texture without distortions or exaggerations. Flawless, photorealistic, 4k photography.`,
                n: 1,
                size: "512x512",
                model: "dall-e-2"
            };

            if (maskPathPng) {
                openaiArgs.mask = await toFile(fs.createReadStream(maskPathPng), 'mask.png', { type: 'image/png' });
            }

            const imageParams = await openai.images.edit(openaiArgs);
            imageUrl = imageParams.data[0].url;
        } catch (imgError) {
            console.error("Erro na OpenAI:", imgError);
            return res.status(500).json({ error: 'Erro ao gerar imagem na OpenAI', details: imgError.message });
        } finally {
            // Limpar arquivos temporários
            if (fs.existsSync(imagePathPng)) fs.unlinkSync(imagePathPng);
            if (maskPathPng && fs.existsSync(maskPathPng)) fs.unlinkSync(maskPathPng);
        }

        // 2. Chamar Gemini para o texto de elogio
        let praiseText = "";
        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: "Você é Lana, uma assistente de estética de alto padrão luxuosa. A cliente acabou de receber uma simulação visual de um procedimento estético." }]
                    },
                    contents: [{
                        parts: [{ text: `A cliente fez uma simulação do procedimento: ${procedure}. As preferências dela foram: ${promptInfo}. Faça um elogio vibrante, exalte como esse procedimento destacou a beleza natural dela, deixando-a deslumbrante. Seja humana, calorosa e curta (máximo 3 frases). Traga foco para a autoestima. Termine incentivando o agendamento real com a equipe Layana!` }]
                    }]
                })
            });
            const data = await response.json();
            praiseText = data.candidates[0].content.parts[0].text;
        } catch (textError) {
            console.error("Erro no Gemini (elogio):", textError);
            praiseText = "Uau, ficou incrível! Essa simulação te deixou ainda mais linda. Vamos agendar para transformar isso em realidade?";
        }

        res.json({ imageUrl, text: praiseText });

    } catch (error) {
        console.error("Erro no Simulador:", error);
        res.status(500).json({ error: 'Erro interno ao processar a simulação.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Você agora pode acessar a página abrindo o index.html no navegador.`);
});
