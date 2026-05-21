const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const app = express();
app.set('trust proxy', 1);

const { Pool } = require('pg');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin (only if service account key is provided)
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== '{}') {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log("Firebase Admin inicializado com conta de serviço.");
    } else {
        console.log("Firebase Admin não inicializado (chave de conta de serviço ausente). Usando verificação JWT nativa.");
    }
} catch (error) {
    console.error("Aviso: Falha ao inicializar Firebase Admin:", error.message);
}

// Determinar se precisa de SSL baseado na URL e ambiente
const useSSL = process.env.DATABASE_URL && 
               !process.env.DATABASE_URL.includes('localhost') && 
               !process.env.DATABASE_URL.includes('127.0.0.1') &&
               !process.env.DATABASE_URL.includes('owkkgow4ww040ks400444c4g'); // Host do banco interno no Coolify

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Inicialização da Tabela de Comentários
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comentarios (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER REFERENCES comentarios(id) ON DELETE CASCADE,
                usuario_nome VARCHAR(255) NOT NULL,
                usuario_avatar TEXT,
                usuario_social_id VARCHAR(255) NOT NULL,
                conteudo TEXT NOT NULL,
                criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tabela 'comentarios' verificada/criada com sucesso no PostgreSQL.");
    } catch (err) {
        console.error("Erro ao inicializar o banco de dados (ignorando para modo estático):", err.message);
    }
}
initDB();


const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // max 100 requests per 15 min
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
});

if (typeof fetch === "undefined") {
    global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://lanawolfart.com.br', 'https://www.lanawolfart.com.br', 'https://lanawolfart.cloud', 'https://www.lanawolfart.cloud']
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', apiLimiter);

// Serve arquivos estáticos (index.html, imagens, etc) da pasta atual
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 8080;
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
        if (JSON.stringify(req.body || {}).length > 10000) {
            return res.status(413).json({ error: 'Payload muito grande' });
        }

        const { systemInstruction, contents, generationConfig } = req.body;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: 'Formato inválido' });
        }

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
    // variáveis usadas em diferentes escopos
    let finalPrompt = "";
    let imageUrl = "";

    try {
        const procedure = req.body.procedure;
        const promptInfo = req.body.prompt;
        const intensity = req.body.intensity || "natural e sutil";
        
        if (!req.files || !req.files['image']) {
            return res.status(400).json({ error: 'Imagem não fornecida' });
        }

        const imageFile = req.files['image'][0];
        const maskFile = req.files['mask'] ? req.files['mask'][0] : null;

        // Utilizar buffer direto para evitar falhas de renameSync em ambientes serverless
        const imageBuffer = fs.readFileSync(imageFile.path);
        
        let maskBuffer = null;
        if (maskFile) {
            maskBuffer = fs.readFileSync(maskFile.path);
        }

        // 1. Chamar Stability AI - Inpaint com máscara
        try {
            const procLower = (procedure || "").toLowerCase();
            const infoLower = (promptInfo || "").toLowerCase();

            // --- Prompts Técnicos Fotorrealistas por Procedimento ---
            let specificAction = "";
            let negativePrompt = "blurry, clumps, plastic texture, cartoon, extra eyes, double face, distorted features, skin smoothing, paint effect, fake look, different person, wrong orientation";
            let imageStrength = '0.40';

            if (procLower.includes("cílios") || procLower.includes("cilios")) {
                // Extrair curvatura e estilo das opções do usuário
                let curl = "C";
                if (infoLower.includes("acentuada") || infoLower.includes("(d)")) curl = "D";
                else if (infoLower.includes("extrema") || infoLower.includes("(l)")) curl = "L";

                let lengths = "8mm to 12mm";
                if (infoLower.includes("longo") || infoLower.includes("glamour")) lengths = "10mm to 14mm";
                else if (infoLower.includes("curto") || infoLower.includes("natural")) lengths = "6mm to 10mm";

                let style = "hybrid volume";
                if (infoLower.includes("fio a fio")) style = "classic individual";
                else if (infoLower.includes("volume russo")) style = "russian volume";
                else if (infoLower.includes("volume brasileiro")) style = "brazilian volume";
                else if (infoLower.includes("fox")) style = "fox eyes elongated";
                else if (infoLower.includes("rímel") || infoLower.includes("rimel")) style = "mascara effect natural";
                else if (infoLower.includes("mega")) style = "mega volume dramatic";

                specificAction = `Apply professional '${style}' eyelash extension simulation. Matte black synthetic fibers with a ${curl}-curl, lengths varying from ${lengths}. Ensure perfect lash separation and a realistic hair-like texture without clumps. The eyelashes must look like individual fibers, NOT a solid block of paint.`;
                negativePrompt += ", solid black block on eyes, painted eyelashes, ink blob, mascara smear, changed eye color, missing iris";
                imageStrength = '0.35';

            } else if (procLower.includes("labial") || procLower.includes("lábio") || procLower.includes("boca")) {
                let effect = "Lip Blush";
                if (infoLower.includes("aquarelle")) effect = "Aquarelle Lips";
                else if (infoLower.includes("full lips") || infoLower.includes("sólida")) effect = "Full Lips";

                let finish = "velvet-matte finish";
                if (infoLower.includes("glossy") || infoLower.includes("molhado")) finish = "glossy hydrated finish";
                else if (infoLower.includes("sheer") || infoLower.includes("translúcido")) finish = "sheer translucent finish";

                let border = "defined yet natural-looking border";
                if (infoLower.includes("esfumadas") || infoLower.includes("blurred")) border = "soft blurred borders";
                else if (infoLower.includes("nítido") || infoLower.includes("defined")) border = "crisp defined vermilion border";

                specificAction = `Apply professional '${effect}' micropigmentation simulation. The lips should have a soft, translucent peach-rose tint with ${border}. Ensure realistic skin texture, showing subtle lip hydration and a ${finish} without artificial gloss.`;
                negativePrompt += ", lipstick smear, clown lips, unnatural color, over-saturated";
                imageStrength = '0.42';

            } else if (procLower.includes("sobrancelha")) {
                let technique = "microblading";
                if (infoLower.includes("powder") || infoLower.includes("ombré") || infoLower.includes("pixelado")) technique = "powder brows ombré";
                else if (infoLower.includes("nanoblading")) technique = "nanoblading";

                let style = "natural arch";
                if (infoLower.includes("high arch") || infoLower.includes("arqueada")) style = "high arch";
                else if (infoLower.includes("straight") || infoLower.includes("reta")) style = "straight Korean-style";
                else if (infoLower.includes("thick") || infoLower.includes("grossa")) style = "thick bushy natural";

                let color = "matching the original hair color";
                if (infoLower.includes("ash") || infoLower.includes("frio")) color = "ash brown cool tone";
                else if (infoLower.includes("warm") || infoLower.includes("quente")) color = "warm brown tone";
                else if (infoLower.includes("taupe")) color = "taupe neutral tone";

                specificAction = `High-definition ${technique} simulation, ${style} shape, individual hair-stroke detail, natural flow, ${color}. Maintain skin pores and natural brow bone texture visible through the strokes.`;
                negativePrompt += ", drawn-on brows, marker effect, unibrow, asymmetric brows";
                imageStrength = '0.40';

            } else if (procLower.includes("piercing")) {
                let material = "titanium";
                if (infoLower.includes("gold") || infoLower.includes("ouro")) material = "14k gold";
                else if (infoLower.includes("surgical") || infoLower.includes("aço")) material = "surgical steel";

                let jewelryType = "stud";
                if (infoLower.includes("hoop") || infoLower.includes("argola")) jewelryType = "hoop ring";
                else if (infoLower.includes("barbell")) jewelryType = "barbell";
                else if (infoLower.includes("clicker") || infoLower.includes("zircon")) jewelryType = "clicker with crystal";

                specificAction = `Add a realistic ${material} ${jewelryType} body piercing, subtle metallic shine, accurate anatomical placement, natural shadow integration with skin.`;
                negativePrompt += ", floating jewelry, unrealistic shine, embedded in skin";
                imageStrength = '0.35';

            } else if (procLower.includes("tattoo") || procLower.includes("tatuagem")) {
                let lineStyle = "fine line";
                if (infoLower.includes("bold")) lineStyle = "bold line";
                else if (infoLower.includes("dotwork") || infoLower.includes("pontilhismo")) lineStyle = "dotwork stipple";

                let artStyle = "minimalist";
                if (infoLower.includes("micro-realism")) artStyle = "micro-realism";
                else if (infoLower.includes("geometric")) artStyle = "geometric";
                else if (infoLower.includes("floral") || infoLower.includes("botanical")) artStyle = "floral botanical";

                specificAction = `${artStyle} ${lineStyle} tattoo, crisp dark ink fully integrated with skin texture, natural shadow and highlights following skin contour.`;
                negativePrompt += ", sticker effect, floating tattoo, blurry ink, smeared lines";
                imageStrength = '0.48';

            } else {
                specificAction = `realistic ${procedure || 'aesthetic procedure'}, natural finish, professional studio result`;
                imageStrength = '0.42';
            }

            // --- Construção do Prompt de Alta Fidelidade ---
            const userDetails = infoLower ? `\nUser preferences: ${infoLower}.` : '';
            finalPrompt = `Extreme photorealism, macro photography style, 8k resolution, soft studio lighting.
Procedure: ${specificAction}${userDetails}
CRITICAL: Maintain identical facial features, skin texture, bone structure, eye color, and lighting. Edit ONLY the masked area. Preserve all surrounding skin pores and natural texture.`.trim();

            const FormData = require('form-data');
            const axios = require('axios');
            const formData = new FormData();
            formData.append('image', fs.createReadStream(imageFile.path), { filename: 'image.png', contentType: 'image/png' });
            if (maskFile) {
                formData.append('mask', fs.createReadStream(maskFile.path), { filename: 'mask.png', contentType: 'image/png' });
            }
            formData.append('prompt', finalPrompt);
            formData.append('negative_prompt', negativePrompt);
            formData.append('image_strength', imageStrength);
            formData.append('cfg_scale', '6');
            formData.append('output_format', 'png');

            const response = await axios.post(
                'https://api.stability.ai/v2beta/stable-image/edit/inpaint',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                        Accept: 'application/json',
                        ...formData.getHeaders()
                    },
                    timeout: 60000,
                    responseType: 'json'
                }
            );

            const imageBase64 = response.data?.image;
            if (!imageBase64) {
                throw new Error("Stability não retornou imagem");
            }
            imageUrl = `data:image/png;base64,${imageBase64}`;

        } catch (imgError) {
            const errorDetails = imgError.response && imgError.response.data
                ? JSON.stringify(imgError.response.data)
                : imgError.message;

            console.error("STABILITY_ERROR", {
                message: imgError.message,
                status: imgError.response?.status,
                data: imgError.response?.data,
                details: errorDetails,
                stack: imgError.stack
            });
            return res.status(500).json({ error: 'Erro ao gerar imagem na Stability', details: errorDetails || imgError.response?.statusText });
        } finally {
            // Limpar arquivos temporários do multer silenciosamente (async)
            try {
                if (fs.existsSync(imageFile.path)) await fs.promises.unlink(imageFile.path).catch(() => {});
                if (maskFile && fs.existsSync(maskFile.path)) await fs.promises.unlink(maskFile.path).catch(() => {});
            } catch (cleanupError) { console.error("Aviso: erro ao limpar multer files:", cleanupError); }
        }

        // 2. Chamar Gemini para o texto de elogio
        let praiseText = "";
        try {
            const procSafe = (procedure || "").toLowerCase();
            const isPiercing = procSafe.includes("piercing");
            
            const geminiSystemPrompt = isPiercing
                ? "Você é Lana, uma assistente de estética e body piercing de alto padrão. Você deve se comunicar de forma 100% NEUTRA quanto a gênero gramatical (NÃO USE palavras como 'querida', 'linda', 'amiga', ou 'deslumbrante' focada ao gênero feminino, pois o cliente pode ser um homem)."
                : "Você é Lana, uma assistente de estética de alto padrão luxuosa. A cliente acabou de receber uma simulação visual de um procedimento estético.";
            
            const geminiUserPrompt = isPiercing
                ? `O usuário fez uma simulação do procedimento: ${procedure}. Preferência: ${promptInfo}. Faça um elogio vibrante destacando como o procedimento realçou o estilo e a fisionomia, garantindo um visual incrível. Seja calorosa e curta (máximo 3 frases). USE LINGUAGEM ESTRITAMENTE NEUTRA, evitando completamente flexão de gênero feminino. Termine incentivando o agendamento real com a equipe Layana!`
                : `A cliente fez uma simulação do procedimento: ${procedure}. As preferências dela foram: ${promptInfo}. Faça um elogio vibrante, exalte como esse procedimento destacou a beleza natural dela, deixando-a deslumbrante. Seja humana, calorosa e curta (máximo 3 frases). Traga foco para a autoestima. Termine incentivando o agendamento real com a equipe Layana!`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: geminiSystemPrompt }]
                    },
                    contents: [{
                        parts: [{ text: geminiUserPrompt }]
                    }]
                })
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            praiseText = data?.candidates?.[0]?.content?.parts?.[0]?.text 
                || "Uau, ficou incrível! Essa simulação te deixou ainda mais bonita. Vamos agendar para transformar isso em realidade?";
        } catch (textError) {
            console.error("Erro no Gemini (elogio/timeout):", textError.message);
            praiseText = "Uau, ficou incrível! Essa simulação te deixou ainda mais bonita. Vamos agendar para transformar isso em realidade?";
        }

        res.json({ imageUrl, text: praiseText, promptUsed: finalPrompt });

    } catch (error) {
        console.error("Erro no Simulador:", error);
        res.status(500).json({ error: 'Erro interno ao processar a simulação.' });
    }
});

// --- Rotas de Comentários ---

// GET /api/comentarios - Retorna a lista de comentários formatada
app.get('/api/comentarios', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, parent_id, usuario_nome, usuario_avatar, conteudo, criado_em 
            FROM comentarios 
            ORDER BY criado_em ASC
        `);
        
        // Formatar em árvore (agrupando respostas)
        const comentariosMap = {};
        const comentariosList = [];

        // Inicializar mapa e converter para objetos
        result.rows.forEach(row => {
            comentariosMap[row.id] = { ...row, respostas: [] };
        });

        // Construir árvore
        result.rows.forEach(row => {
            if (row.parent_id) {
                if (comentariosMap[row.parent_id]) {
                    comentariosMap[row.parent_id].respostas.push(comentariosMap[row.id]);
                }
            } else {
                comentariosList.push(comentariosMap[row.id]);
            }
        });

        // Ordenar a lista principal do mais recente para o mais antigo
        comentariosList.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

        res.json(comentariosList);
    } catch (error) {
        console.error("Erro ao buscar comentários:", error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

// Cache das chaves públicas do Google
let googlePublicKeysCache = {
    keys: null,
    expiresAt: 0
};

async function getGooglePublicKeys() {
    const now = Date.now();
    if (googlePublicKeysCache.keys && googlePublicKeysCache.expiresAt > now) {
        return googlePublicKeysCache.keys;
    }
    
    try {
        const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
        if (!response.ok) {
            throw new Error(`Falha ao buscar chaves públicas do Google: ${response.statusText}`);
        }
        const keys = await response.json();
        
        // Cache por 6 horas
        googlePublicKeysCache = {
            keys,
            expiresAt: now + 6 * 60 * 60 * 1000
        };
        return keys;
    } catch (error) {
        console.error("Erro ao buscar chaves públicas do Google:", error);
        if (googlePublicKeysCache.keys) {
            return googlePublicKeysCache.keys; // Fallback para cache expirado em caso de falha de rede
        }
        throw error;
    }
}

async function verifyGoogleIdToken(idToken, projectId) {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
        throw new Error('Token JWT malformado (não contém 3 partes).');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Decodifica header
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg !== 'RS256') {
        throw new Error(`Algoritmo não suportado: ${header.alg}. Esperado RS256.`);
    }
    
    const kid = header.kid;
    if (!kid) {
        throw new Error('Nenhum campo "kid" encontrado no header do token.');
    }
    
    // Decodifica payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    
    // Validações de Claims
    const now = Math.floor(Date.now() / 1000);
    
    // 1. Expiração
    if (payload.exp <= now) {
        throw new Error('Token expirado.');
    }
    
    // 2. Issuer (emissor)
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
        throw new Error(`Emissor (iss) inválido: ${payload.iss}`);
    }
    
    // 3. Audience (audiência)
    if (payload.aud !== projectId) {
        throw new Error(`Audiência (aud) inválida: ${payload.aud}`);
    }
    
    // 4. Subject (sub / ID de usuário)
    if (!payload.sub) {
        throw new Error('Nenhum campo "sub" (UID do usuário) no token.');
    }
    
    // Busca chaves públicas do Google
    const publicKeys = await getGooglePublicKeys();
    const cert = publicKeys[kid];
    if (!cert) {
        throw new Error(`Chave pública não encontrada para o kid: ${kid}`);
    }
    
    // Verifica a assinatura criptográfica
    const data = Buffer.from(`${headerB64}.${payloadB64}`);
    const signature = Buffer.from(signatureB64, 'base64url');
    const isValid = crypto.verify('sha256', data, cert, signature);
    
    if (!isValid) {
        throw new Error('Verificação da assinatura criptográfica falhou.');
    }
    
    return payload;
}

// Middleware para verificar token Firebase (Option B: usando chaves públicas se Admin não estiver ativo)
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autorizado. Token ausente.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        if (admin.apps.length > 0) {
            // Tenta verificar com Firebase Admin se inicializado
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken;
        } else {
            // Validação local e segura usando chaves públicas do Google (Option B)
            const projectId = process.env.FIREBASE_PROJECT_ID || 'lanawolfart-4c922';
            const decodedToken = await verifyGoogleIdToken(idToken, projectId);
            
            // Normaliza as chaves do payload para compatibilidade com o formato do Firebase Admin
            req.user = {
                uid: decodedToken.sub,
                name: decodedToken.name || decodedToken.display_name,
                picture: decodedToken.picture,
                email: decodedToken.email,
                ...decodedToken
            };
        }
        next();
    } catch (error) {
        console.error("Erro na verificação do token Firebase:", error.message);
        return res.status(401).json({ error: 'Não autorizado. Token inválido.' });
    }
};

// POST /api/comentarios - Adiciona um novo comentário
app.post('/api/comentarios', verifyAuth, async (req, res) => {
    try {
        const { conteudo, parent_id } = req.body;
        const usuario_social_id = req.user.uid || req.user.sub || "unknown_id";
        const usuario_nome = req.user.name || "Usuário";
        const usuario_avatar = req.user.picture || req.user.avatar || "";

        if (!conteudo || conteudo.trim() === '') {
            return res.status(400).json({ error: 'O conteúdo do comentário é obrigatório.' });
        }

        const result = await pool.query(
            `INSERT INTO comentarios (parent_id, usuario_nome, usuario_avatar, usuario_social_id, conteudo)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, parent_id, usuario_nome, usuario_avatar, conteudo, criado_em`,
            [parent_id || null, usuario_nome, usuario_avatar, usuario_social_id, conteudo]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao inserir comentário:", error);
        res.status(500).json({ error: 'Erro ao salvar o comentário' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Você agora pode acessar a página abrindo o index.html no navegador.`);
});
