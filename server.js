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

// Inicialização do Banco de Dados PostgreSQL (db_Layana)
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

            CREATE TABLE IF NOT EXISTS produtos_pro (
                id SERIAL PRIMARY KEY,
                tipo VARCHAR(120) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT NOT NULL,
                preco NUMERIC(10, 2) NOT NULL,
                estoque INTEGER NOT NULL DEFAULT 10,
                categoria_filtro VARCHAR(50) NOT NULL,
                imagem_url VARCHAR(255) NOT NULL,
                badge VARCHAR(80),
                ativo BOOLEAN DEFAULT TRUE,
                criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS pedidos_pro (
                id SERIAL PRIMARY KEY,
                cliente_nome VARCHAR(255),
                cliente_whatsapp VARCHAR(50),
                tipo_entrega VARCHAR(50) NOT NULL,
                endereco TEXT,
                distancia_km NUMERIC(6, 2) DEFAULT 0,
                frete NUMERIC(10, 2) DEFAULT 0,
                subtotal NUMERIC(10, 2) NOT NULL,
                total NUMERIC(10, 2) NOT NULL,
                forma_pagamento VARCHAR(50) NOT NULL,
                parcelas INTEGER DEFAULT 1,
                itens JSONB NOT NULL,
                status VARCHAR(50) DEFAULT 'pendente',
                criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admin_config (
                chave VARCHAR(100) PRIMARY KEY,
                valor TEXT NOT NULL,
                atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tabelas 'comentarios', 'produtos_pro', 'pedidos_pro' e 'admin_config' verificadas/criadas com sucesso no PostgreSQL.");

        // Carga e sincronização do Catálogo Oficial Lana Supply Pro (14 produtos)
        const catalogoOficial = [
            {
                tipo: 'Cílios e Extensões • Decemars',
                nome: 'Cílios Decemars YY U D (7mm a 13mm)',
                descricao: 'Fios tecnológicos em formato YY de alta maciez - Curvatura D - Leveza incomparável, efeito volumoso e retenção duradoura para o dia a dia.',
                preco: 32.00,
                estoque: 2, // Pedido: 2 caixas (7mm, D)
                categoria_filtro: 'cilios',
                imagem_url: '/assets/pro/cilios_decemars_yy.jpg',
                badge: 'Volume Brasileiro'
            },
            {
                tipo: 'Cílios e Extensões • Fadvan',
                nome: 'Cílios Fadvan YV Vol. Brasileiro D Preto (8-14mm)',
                descricao: 'Fios Precisão - Curvatura D (8-14mm) - Alta retenção, facilidade de acoplagem e acabamento marcante para o clássico Volume Brasileiro.',
                preco: 25.00,
                estoque: 1, // Pedido: 1 caixa (D, 8-14mm)
                categoria_filtro: 'cilios',
                imagem_url: '/assets/pro/cilios_fadvan_yv.jpg',
                badge: 'Mais Vendido'
            },
            {
                tipo: 'Cílios e Extensões • Decemars',
                nome: 'Cílios Decemars 4D W D (7mm a 13mm)',
                descricao: 'Fios tecnológicos 4D em W com acabamento acetinado - Curvatura D - Proporciona volume expressivo, preenchimento uniforme e rápida aplicação.',
                preco: 38.00,
                estoque: 15, // Pedido: 3x 13mm + 3x 12mm + 3x 11mm + 3x 8mm + 3x 7mm = 15 caixas
                categoria_filtro: 'cilios',
                imagem_url: '/assets/pro/cilios_decemars_4d_w.jpg',
                badge: 'Volume Expressivo'
            },
            {
                tipo: 'Cílios e Extensões • Nagaraku',
                nome: 'Pinça Profissional Nagaraku N-04 Dourada',
                descricao: 'Aço cirúrgico de alta precisão com acabamento dourado luxo - ponta fina e fechamento 100% calibrado, perfeita para isolamento e acoplagem.',
                preco: 59.90,
                estoque: 4, // Pedido: 4 unidades
                categoria_filtro: 'cilios',
                imagem_url: '/assets/pro/pinca_nagaraku_n04.jpg',
                badge: 'Aço Cirúrgico Luxo'
            },
            {
                tipo: 'Cílios e Extensões • Nagaraku',
                nome: 'Pinça Profissional Nagaraku N-02 Dourada',
                descricao: 'Ergonomia avançada e fechamento suave em aço dourado - Ideal para montagem de fans, manuseio de fios tecnológicos e alta produtividade.',
                preco: 59.90,
                estoque: 0, // Não consta nas imagens de compras
                categoria_filtro: 'cilios',
                imagem_url: '/assets/pro/pinca_nagaraku_n02.jpg',
                badge: 'Alta Precisão'
            },
            {
                tipo: 'Ferramentas de Precisão & Acessórios',
                nome: 'Fita Micropore Rosa 3cm (Unidade avulsa)',
                descricao: 'Adesão suave e respirável em tom rosé - Excelente fixação de pálpebras e isolamento de fios inferiores sem agredir a pele sensível da cliente.',
                preco: 8.00,
                estoque: 72, // Pedido: 6 pacotes com 12 fitas = 72 fitas avulsas
                categoria_filtro: 'acessorios',
                imagem_url: '/assets/pro/fita_micropore_rosa.jpg',
                badge: 'Pronta Entrega'
            },
            {
                tipo: 'Ferramentas de Precisão & Acessórios',
                nome: 'Escovinha Descartável Dourada (Unidade avulsa)',
                descricao: 'Cerdas macias com cabo glitter dourado premium - Essencial para pentear e alinhar extensões no atendimento ou entregar como mimo pós-procedimento.',
                preco: 0.50,
                estoque: 3600, // Pedido: 6 lotes de 12 pacotes de 50 un = 3.600 escovinhas avulsas
                categoria_filtro: 'acessorios',
                imagem_url: '/assets/pro/escovinha_descartavel_dourada.jpg',
                badge: 'Mimo para Cliente'
            },
            {
                tipo: 'Ferramentas de Precisão & Acessórios',
                nome: 'Placa de Mão para Cílios com Alça Removível',
                descricao: 'Acrílico ergonômico com marcação consciente (fita a fita) e alça elástica ajustável - Otimiza a velocidade e a ergonomia de trabalho na maca.',
                preco: 16.00,
                estoque: 0, // Não consta nas imagens de compras
                categoria_filtro: 'acessorios',
                imagem_url: '/assets/pro/placa_mao_cilios.jpg',
                badge: 'Ergonomia na Maca'
            },
            {
                tipo: 'Soluções e Removedores • Beautify',
                nome: 'Cola Adesivo Free Beautify Pro',
                descricao: 'Fórmula hipoalergênica de secagem rápida (0,5s a 1s) - Baixíssimo odor e sem ardor - Acompanha Magic Pack hermético protetor de umidade.',
                preco: 65.00,
                estoque: 0, // Não consta nas imagens de compras
                categoria_filtro: 'solucoes',
                imagem_url: '/assets/pro/cola_adesivo_free_beautify.jpg',
                badge: 'Hipoalergênica Magic Pack'
            },
            {
                tipo: 'Soluções e Removedores • Excellent',
                nome: 'Removedor em Creme Cola Cílios 5g Excellent',
                descricao: 'Consistência cremosa e suave que não escorre nos olhos - Ação rápida em minutos para remoção segura, confortável e sem danos aos fios naturais.',
                preco: 45.00,
                estoque: 0, // Não consta nas imagens de compras
                categoria_filtro: 'solucoes',
                imagem_url: '/assets/pro/removedor_creme_excellent.jpg',
                badge: 'Não Escorre nos Olhos'
            },
            {
                tipo: 'Essenciais de Design • Soluções',
                nome: 'Adesivo de Cílios Fadvan 1 Seg (Exovan)',
                descricao: 'Secagem ultrarrápida de 1 segundo - Alta retenção (até 7 semanas) com baixa dispersão de vapores - Ideal para lash designers com ritmo ágil.',
                preco: 49.90,
                estoque: 5, // Pedido: 5 unidades
                categoria_filtro: 'solucoes',
                imagem_url: '/assets/pro/adesivo_exovan_7seg.jpg',
                badge: 'Retenção até 7 Semanas'
            },
            {
                tipo: 'Essenciais de Design & Acabamento',
                nome: 'Tesourinha de Sobrancelha Prata (Unidade avulsa)',
                descricao: 'Formato anatômico com lâminas retas e afiadas - Ergonômica para corte preciso e acabamento impecável no design de sobrancelhas.',
                preco: 15.00,
                estoque: 15, // Pedido: 3 pacotes com 5 unidades = 15 unidades avulsas
                categoria_filtro: 'design',
                imagem_url: '/assets/pro/tesourinha_sobrancelha.jpg',
                badge: 'Corte de Precisão'
            },
            {
                tipo: 'Essenciais de Design & Acabamento',
                nome: 'Pinça de Sobrancelha Chanfrada (Unidade avulsa)',
                descricao: 'Ponta chanfrada anatômica com fechamento rente - Remove pelos curtos e médios pela raiz com máxima precisão e sem agredir a pele.',
                preco: 7.00,
                estoque: 50, // Pedido: 5 pacotes + 5 pacotes = 10 pacotes com 5 unidades = 50 unidades avulsas
                categoria_filtro: 'design',
                imagem_url: '/assets/pro/pinca_sobrancelha_chanfrada.jpg',
                badge: 'Fechamento Rente'
            },
            {
                tipo: 'Essenciais de Design & Pequenos Toques',
                nome: 'Flor de Anel para Cola (Unidade avulsa)',
                descricao: 'Design inteligente com ranhuras em formato de pétalas - Economiza adesivo, previne desperdício e mantém a gota fresca durante o atendimento.',
                preco: 0.50,
                estoque: 1500, // Pedido: 1 lote de 1.200 un (12 pct x 100) + 3 pct de 100 un = 1.500 unidades avulsas
                categoria_filtro: 'acessorios',
                imagem_url: '/assets/pro/flor_anel_cola.jpg',
                badge: 'Zero Desperdício'
            }
        ];

        // Sincronização automática do Catálogo Oficial Lana Supply Pro e Atualização de Estoque
        console.log("Sincronizando produtos e estoques oficiais Lana Supply Pro...");
        for (const p of catalogoOficial) {
            const updateRes = await pool.query(`
                UPDATE produtos_pro
                SET estoque = $1, preco = $2, tipo = $3, nome = $4, descricao = $5, categoria_filtro = $6, badge = $7, atualizado_em = CURRENT_TIMESTAMP
                WHERE imagem_url = $8
            `, [p.estoque, p.preco, p.tipo, p.nome, p.descricao, p.categoria_filtro, p.badge, p.imagem_url]);

            if (updateRes.rowCount === 0) {
                await pool.query(`
                    INSERT INTO produtos_pro (tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                `, [p.tipo, p.nome, p.descricao, p.preco, p.estoque, p.categoria_filtro, p.imagem_url, p.badge]);
            }
        }
        console.log("14 produtos oficiais e estoques sincronizados com sucesso no PostgreSQL.");
    } catch (err) {
        console.error("Erro ao inicializar o banco de dados (produtos_pro/pedidos_pro):", err.message);
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

// Servir arquivos estáticos das subpastas dedicadas
app.use('/procedimentos', express.static(path.join(__dirname, 'procedimentos')));
app.use('/cursos', express.static(path.join(__dirname, 'cursos')));
app.use('/pro', express.static(path.join(__dirname, 'pro')));
app.use('/ControleEstoque', express.static(path.join(__dirname, 'ControleEstoque')));
app.use('/controleestoque', express.static(path.join(__dirname, 'ControleEstoque')));

// Rotas explícitas da plataforma modular (B2C & B2B)
app.get(['/procedimentos', '/procedimentos/', '/studio', '/studio/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'procedimentos', 'index.html'));
});

app.get(['/cursos', '/cursos/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'cursos', 'index.html'));
});

app.get(['/pro', '/pro/', '/loja', '/loja/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'pro', 'index.html'));
});

app.get(['/ControleEstoque', '/ControleEstoque/', '/controleestoque', '/controleestoque/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'ControleEstoque', 'index.html'));
});

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

// ==========================================
// APIS - LANA SUPPLY PRO & CONTROLE DE ESTOQUE
// ==========================================

// GET /api/produtos - Lista todos os produtos ativos do catálogo
app.get('/api/produtos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo, criado_em, atualizado_em
            FROM produtos_pro
            WHERE ativo = true
            ORDER BY id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar produtos_pro:", error);
        res.status(500).json({ error: 'Erro ao buscar catálogo de produtos' });
    }
});

// ==========================================
// SEGURANÇA & CONTROLE DE ACESSO: PIN MASTER
// ==========================================
const PIN_KEY = 'admin_pin_hash';
const DEFAULT_PIN = process.env.ADMIN_PIN || '3008';

function hashPin(pin, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(String(pin), salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

let cachedPinData = null;

async function getAdminPinData() {
    if (cachedPinData) return cachedPinData;
    try {
        const res = await pool.query('SELECT valor FROM admin_config WHERE chave = $1', [PIN_KEY]);
        if (res.rows.length > 0) {
            cachedPinData = res.rows[0].valor;
            return cachedPinData;
        }
        // Inicializar com PIN padrão (3008)
        const initialHash = hashPin(DEFAULT_PIN);
        await pool.query(
            `INSERT INTO admin_config (chave, valor)
             VALUES ($1, $2)
             ON CONFLICT (chave) DO NOTHING`,
            [PIN_KEY, initialHash]
        );
        cachedPinData = initialHash;
        return cachedPinData;
    } catch (err) {
        console.error("Aviso: Falha ao consultar admin_config no PostgreSQL, usando fallback em memória:", err.message);
        if (!cachedPinData) {
            cachedPinData = hashPin(DEFAULT_PIN);
        }
        return cachedPinData;
    }
}

async function verifyPin(inputPin) {
    if (!inputPin) return false;
    const stored = await getAdminPinData();
    if (!stored || !stored.includes(':')) {
        return String(inputPin) === String(DEFAULT_PIN);
    }
    const [salt, originalHash] = stored.split(':');
    const inputHash = crypto.pbkdf2Sync(String(inputPin), salt, 10000, 64, 'sha512').toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch (e) {
        return false;
    }
}

async function updateAdminPin(newPin) {
    const newHash = hashPin(newPin);
    await pool.query(
        `INSERT INTO admin_config (chave, valor, atualizado_em)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = CURRENT_TIMESTAMP`,
        [PIN_KEY, newHash]
    );
    cachedPinData = newHash;
    return true;
}

// Anti Brute-Force Rate Limiter em memória para proteção do PIN
const pinRateLimitMap = new Map();

function getClientIp(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0].trim()) || req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkPinRateLimit(ip) {
    const record = pinRateLimitMap.get(ip);
    if (!record) return { allowed: true };
    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
        const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
        return { allowed: false, remainingSec };
    }
    if (record.lockedUntil && record.lockedUntil <= now) {
        pinRateLimitMap.delete(ip);
        return { allowed: true };
    }
    return { allowed: true };
}

function recordPinAttempt(ip, success) {
    const now = Date.now();
    let record = pinRateLimitMap.get(ip) || { attempts: 0, lockedUntil: null };
    if (success) {
        pinRateLimitMap.delete(ip);
        return;
    }
    record.attempts += 1;
    if (record.attempts >= 5) {
        record.lockedUntil = now + (3 * 60 * 1000); // 3 minutos de lockout
    }
    pinRateLimitMap.set(ip, record);
}

// POST /api/admin/verify-pin - Autenticação da senha Master
app.post('/api/admin/verify-pin', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const rateCheck = checkPinRateLimit(clientIp);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: `Muitas tentativas incorretas. Acesso bloqueado por mais ${rateCheck.remainingSec} segundos.`
            });
        }

        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ error: 'PIN não fornecido.' });
        }

        const isValid = await verifyPin(pin);
        if (!isValid) {
            recordPinAttempt(clientIp, false);
            return res.status(401).json({ error: 'PIN Master incorreto.' });
        }

        recordPinAttempt(clientIp, true);
        res.json({ success: true, message: 'Autenticação Master concedida com sucesso.' });
    } catch (err) {
        console.error('Erro em verify-pin:', err);
        res.status(500).json({ error: 'Erro interno ao validar PIN.' });
    }
});

// POST /api/admin/change-pin - Permite alteração apenas se o usuário digitar a senha atual corretamente
app.post('/api/admin/change-pin', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const rateCheck = checkPinRateLimit(clientIp);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: `Muitas tentativas incorretas. Acesso bloqueado por mais ${rateCheck.remainingSec} segundos.`
            });
        }

        const { currentPin, newPin } = req.body;
        if (!currentPin || !newPin) {
            return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
        }

        // Validação obrigatória da senha atual
        const isCurrentValid = await verifyPin(currentPin);
        if (!isCurrentValid) {
            recordPinAttempt(clientIp, false);
            return res.status(401).json({ error: 'PIN atual incorreto. A alteração de senha só é autorizada com a senha correta.' });
        }

        // Validação do novo PIN
        const cleanNewPin = String(newPin).trim();
        if (cleanNewPin.length < 4 || cleanNewPin.length > 20) {
            return res.status(400).json({ error: 'A nova senha deve possuir entre 4 e 20 caracteres.' });
        }

        await updateAdminPin(cleanNewPin);
        recordPinAttempt(clientIp, true);
        res.json({ success: true, message: 'Senha PIN Master atualizada com sucesso!' });
    } catch (err) {
        console.error('Erro em change-pin:', err);
        res.status(500).json({ error: 'Erro interno ao alterar a senha Master.' });
    }
});

// PATCH /api/produtos/:id/estoque - Atualiza o estoque (exige obrigatoriamente PIN correto)
app.patch('/api/produtos/:id/estoque', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const rateCheck = checkPinRateLimit(clientIp);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: `Muitas tentativas incorretas de PIN. Bloqueado por mais ${rateCheck.remainingSec} segundos.`
            });
        }

        const { id } = req.params;
        const { estoque, pin } = req.body;

        if (!pin) {
            return res.status(401).json({ error: 'PIN de segurança obrigatório para alterar estoque.' });
        }

        const isAuthorized = await verifyPin(pin);
        if (!isAuthorized) {
            recordPinAttempt(clientIp, false);
            return res.status(401).json({ error: 'PIN de segurança incorreto.' });
        }

        recordPinAttempt(clientIp, true);

        const parsedEstoque = parseInt(estoque, 10);
        if (isNaN(parsedEstoque) || parsedEstoque < 0) {
            return res.status(400).json({ error: 'Quantidade de estoque inválida.' });
        }

        const result = await pool.query(
            `UPDATE produtos_pro
             SET estoque = $1, atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, tipo, nome, estoque, atualizado_em`,
            [parsedEstoque, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        res.json({ success: true, produto: result.rows[0] });
    } catch (error) {
        console.error("Erro ao atualizar estoque:", error);
        res.status(500).json({ error: 'Erro ao atualizar estoque no banco de dados' });
    }
});

// Coordenadas do Studio Lana Wolf: Rua 23, quadra 61, lote 3, Parque 9, Luziânia - GO
const STUDIO_COORDS = { lat: -16.156250, lng: -47.946417 };

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Fator de rota urbana estimada em Luziânia (~1.25x)
    return (R * c) * 1.25;
}

function calculateFreteByDistance(distKm) {
    if (distKm <= 0) return 0;
    // Até 5km: R$ 10; 5 a 10km: R$ 20; 10 a 15km: R$ 30; sucessivamente:
    const faixas = Math.ceil(distKm / 5);
    return Math.max(10, faixas * 10);
}

// POST /api/frete/calcular-distancia - Calcula distância e valor do frete
app.post('/api/frete/calcular-distancia', async (req, res) => {
    try {
        const { endereco, lat, lng } = req.body;

        let destLat = lat ? parseFloat(lat) : null;
        let destLng = lng ? parseFloat(lng) : null;

        if ((destLat === null || destLng === null) && endereco) {
            try {
                const query = encodeURIComponent(`${endereco}, Luziânia, Goiás, Brasil`);
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                    headers: { 'User-Agent': 'LanaSupplyPro/1.0 (contato@lanawolfart.cloud)' }
                });
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        destLat = parseFloat(geoData[0].lat);
                        destLng = parseFloat(geoData[0].lon);
                    }
                }
            } catch (geoErr) {
                console.warn("Aviso na geocodificação Nominatim:", geoErr.message);
            }
        }

        if (destLat === null || destLng === null) {
            // Fallback: estimativa média para Luziânia caso Nominatim não ache o número exato
            return res.json({
                distancia_km: 6.5,
                valor_frete: 20.00,
                origem: "Studio Lana Wolf (Parque 9, Luziânia)",
                faixa_frete: "Estimativa Luziânia (5 a 10km): R$ 20,00",
                observacao: "Endereço registrado. Distância aproximada de referência."
            });
        }

        const distKm = parseFloat(calculateHaversineKm(STUDIO_COORDS.lat, STUDIO_COORDS.lng, destLat, destLng).toFixed(1));
        const valorFrete = calculateFreteByDistance(distKm);

        res.json({
            distancia_km: distKm,
            valor_frete: valorFrete,
            origem: "Studio Lana Wolf (Parque 9, Luziânia)",
            faixa_frete: `Até ${Math.ceil(distKm / 5) * 5}km: R$ ${valorFrete.toFixed(2)}`
        });
    } catch (error) {
        console.error("Erro ao calcular frete:", error);
        res.status(500).json({ error: 'Erro ao calcular frete' });
    }
});

// POST /api/pedidos - Registra o pedido no banco e atualiza o estoque
app.post('/api/pedidos', async (req, res) => {
    try {
        const { cliente_nome, cliente_whatsapp, tipo_entrega, endereco, distancia_km, frete, subtotal, total, forma_pagamento, parcelas, itens } = req.body;

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ error: 'O carrinho está vazio.' });
        }

        // Criar registro na tabela pedidos_pro
        const result = await pool.query(`
            INSERT INTO pedidos_pro (cliente_nome, cliente_whatsapp, tipo_entrega, endereco, distancia_km, frete, subtotal, total, forma_pagamento, parcelas, itens)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, criado_em
        `, [
            cliente_nome || 'Cliente Lana Supply Pro',
            cliente_whatsapp || '',
            tipo_entrega || 'retirada',
            endereco || '',
            distancia_km || 0,
            frete || 0,
            subtotal || 0,
            total || 0,
            forma_pagamento || 'pix',
            parcelas || 1,
            JSON.stringify(itens)
        ]);

        // Decrementar estoque de cada item comprado
        for (const item of itens) {
            if (item.id && item.quantidade) {
                await pool.query(`
                    UPDATE produtos_pro
                    SET estoque = GREATEST(0, estoque - $1), atualizado_em = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [item.quantidade, item.id]);
            }
        }

        res.status(201).json({
            success: true,
            pedido_id: result.rows[0].id,
            criado_em: result.rows[0].criado_em
        });
    } catch (error) {
        console.error("Erro ao salvar pedido:", error);
        res.status(500).json({ error: 'Erro ao registrar pedido' });
    }
});

// POST /api/duvidas-produto - Atendimento com IA (Gemini) sobre produtos do catálogo
app.post('/api/duvidas-produto', async (req, res) => {
    try {
        const { produto, pergunta, historico } = req.body;
        if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
            return res.status(400).json({ error: 'Pergunta não informada.' });
        }

        const nomeProd = produto?.nome || 'Insumo Profissional';
        const tipoProd = produto?.tipo || 'Estética & Beleza';
        const descProd = produto?.descricao || '';
        const precoProd = produto?.preco ? `R$ ${parseFloat(produto.preco).toFixed(2)}` : '';
        const estoqueProd = produto?.estoque !== undefined ? `${produto.estoque} unidades` : '';

        const systemInstruction = `Você é Lana IA, a consultora técnica oficial de insumos de beleza do Studio Layana Wolf (Lana Supply Pro).
Você atende lash designers, micropigmentadoras, esteticistas e clientes tirando dúvidas com altíssima precisão técnica, acolhimento e profissionalismo.
Informações do produto em consulta:
- Nome: ${nomeProd}
- Categoria/Tipo: ${tipoProd}
- Descrição/Especificações: ${descProd}
- Preço: ${precoProd}
- Situação de estoque: ${estoqueProd}

Diretrizes de atendimento:
1. Responda em Português do Brasil com linguagem elegante, profissional e empática.
2. Foque na dúvida exata da cliente (modo de uso, tempo de secagem/retenção, técnicas recomendadas, espessura, curvatura, higienização, cuidados e biossegurança).
3. Seja concisa e prática (máximo de 2 a 4 parágrafos curtos ou tópicos objetivos), facilitando a leitura no celular.
4. Se perguntarem sobre disponibilidade ou entrega, informe que temos pronta entrega em Luziânia e Jardim Ingá, retirada sem custo no Parque 9 ou envio rápido no mesmo dia (Uber Flash / Motoboy).
5. Finalize de forma cordial e natural, convidando para adicionar ao carrinho ou entrar em contato no WhatsApp caso prefira suporte humano direto.`;

        let contents = [];
        if (Array.isArray(historico) && historico.length > 0) {
            contents = historico
                .filter(h => h && h.text)
                .map(h => ({
                    role: h.role === 'model' ? 'model' : 'user',
                    parts: [{ text: String(h.text) }]
                }));
        }
        contents.push({
            role: 'user',
            parts: [{ text: pergunta.trim() }]
        });

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents,
                generationConfig: {
                    temperature: 0.65,
                    maxOutputTokens: 900
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Erro Gemini na rota de dúvidas de produtos:", response.status, errText);
            return res.status(response.status).json({ error: 'Erro ao consultar IA', details: errText });
        }

        const data = await response.json();
        const respostaTexto = data?.candidates?.[0]?.content?.parts?.[0]?.text 
            || "Desculpe, não consegui processar a resposta neste instante. Por favor, fale diretamente com nossa equipe pelo WhatsApp!";

        res.json({ resposta: respostaTexto });
    } catch (error) {
        console.error("Erro interno ao processar dúvida de produto:", error);
        res.status(500).json({ error: 'Erro interno ao consultar IA.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Você agora pode acessar a página abrindo o index.html no navegador.`);
});
