-- ==============================================================================
-- LANA SUPPLY PRO - SCRIPT DE ATUALIZAÇÃO DO CATÁLOGO OFICIAL (14 PRODUTOS)
-- Banco de Dados: PostgreSQL (db_Layana)
-- Execução: Pode ser executado via pgAdmin, DBeaver, psql ou interface do Coolify
-- ==============================================================================

BEGIN;

-- 1. Garante que a tabela de produtos existe
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

-- 2. Limpeza de produtos anteriores de teste (preservando consistência)
DELETE FROM produtos_pro;

-- 3. Reinicia a sequência de IDs
ALTER SEQUENCE IF EXISTS produtos_pro_id_seq RESTART WITH 1;

-- 4. Inserção dos 14 produtos oficiais do catálogo de Lash Designers
INSERT INTO produtos_pro (tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo)
VALUES
-- --- SEÇÃO 1: CÍLIOS E EXTENSÕES ---
(
    'Cílios e Extensões • Decemars',
    'Cílios Decemars YY U D (7mm a 13mm)',
    'Fios tecnológicos em formato YY de alta maciez - Curvatura D - Leveza incomparável, efeito volumoso e retenção duradoura para o dia a dia.',
    32.00,
    25,
    'cilios',
    '/assets/pro/cilios_decemars_yy.jpg',
    'Volume Brasileiro',
    TRUE
),
(
    'Cílios e Extensões • Fadvan',
    'Cílios Fadvan YV Vol. Brasileiro D Preto (8-14mm)',
    'Fios Precisão - Curvatura D (8-14mm) - Alta retenção, facilidade de acoplagem e acabamento marcante para o clássico Volume Brasileiro.',
    25.00,
    30,
    'cilios',
    '/assets/pro/cilios_fadvan_yv.jpg',
    'Mais Vendido',
    TRUE
),
(
    'Cílios e Extensões • Decemars',
    'Cílios Decemars 4D W D (7mm a 13mm)',
    'Fios tecnológicos 4D em W com acabamento acetinado - Curvatura D - Proporciona volume expressivo, preenchimento uniforme e rápida aplicação.',
    38.00,
    20,
    'cilios',
    '/assets/pro/cilios_decemars_4d_w.jpg',
    'Volume Expressivo',
    TRUE
),
(
    'Cílios e Extensões • Nagaraku',
    'Pinça Profissional Nagaraku N-04 Dourada',
    'Aço cirúrgico de alta precisão com acabamento dourado luxo - ponta fina e fechamento 100% calibrado, perfeita para isolamento e acoplagem.',
    59.90,
    15,
    'cilios',
    '/assets/pro/pinca_nagaraku_n04.jpg',
    'Aço Cirúrgico Luxo',
    TRUE
),
(
    'Cílios e Extensões • Nagaraku',
    'Pinça Profissional Nagaraku N-02 Dourada',
    'Ergonomia avançada e fechamento suave em aço dourado - Ideal para montagem de fans, manuseio de fios tecnológicos e alta produtividade.',
    59.90,
    15,
    'cilios',
    '/assets/pro/pinca_nagaraku_n02.jpg',
    'Alta Precisão',
    TRUE
),

-- --- SEÇÃO 2: FERRAMENTAS DE PRECISÃO E ACESSÓRIOS ---
(
    'Ferramentas de Precisão & Acessórios',
    'Fita Micropore Rosa 3cm (Unidade avulsa)',
    'Adesão suave e respirável em tom rosé - Excelente fixação de pálpebras e isolamento de fios inferiores sem agredir a pele sensível da cliente.',
    8.00,
    40,
    'acessorios',
    '/assets/pro/fita_micropore_rosa.jpg',
    'Pronta Entrega',
    TRUE
),
(
    'Ferramentas de Precisão & Acessórios',
    'Escovinha Descartável Dourada (Unidade avulsa)',
    'Cerdas macias com cabo glitter dourado premium - Essencial para pentear e alinhar extensões no atendimento ou entregar como mimo pós-procedimento.',
    0.50,
    150,
    'acessorios',
    '/assets/pro/escovinha_descartavel_dourada.jpg',
    'Mimo para Cliente',
    TRUE
),
(
    'Ferramentas de Precisão & Acessórios',
    'Placa de Mão para Cílios com Alça Removível',
    'Acrílico ergonômico com marcação consciente (fita a fita) e alça elástica ajustável - Otimiza a velocidade e a ergonomia de trabalho na maca.',
    16.00,
    20,
    'acessorios',
    '/assets/pro/placa_mao_cilios.jpg',
    'Ergonomia na Maca',
    TRUE
),

-- --- SEÇÃO 3: SOLUÇÕES E REMOVEDORES ---
(
    'Soluções e Removedores • Beautify',
    'Cola Adesivo Free Beautify Pro',
    'Fórmula hipoalergênica de secagem rápida (0,5s a 1s) - Baixíssimo odor e sem ardor - Acompanha Magic Pack hermético protetor de umidade.',
    65.00,
    18,
    'solucoes',
    '/assets/pro/cola_adesivo_free_beautify.jpg',
    'Hipoalergênica Magic Pack',
    TRUE
),
(
    'Soluções e Removedores • Excellent',
    'Removedor em Creme Cola Cílios 5g Excellent',
    'Consistência cremosa e suave que não escorre nos olhos - Ação rápida em minutos para remoção segura, confortável e sem danos aos fios naturais.',
    45.00,
    15,
    'solucoes',
    '/assets/pro/removedor_creme_excellent.jpg',
    'Não Escorre nos Olhos',
    TRUE
),

-- --- SEÇÃO 4: ESSENCIAIS DE DESIGN E PEQUENOS TOQUES ---
(
    'Essenciais de Design • Soluções',
    'Adesivo de Cílios Exovan 7 Seg',
    'Secagem ultrarrápida de 1 segundo - Alta retenção (até 7 semanas) com baixa dispersão de vapores - Ideal para lash designers com ritmo ágil.',
    49.90,
    16,
    'solucoes',
    '/assets/pro/adesivo_exovan_7seg.jpg',
    'Retenção até 7 Semanas',
    TRUE
),
(
    'Essenciais de Design & Acabamento',
    'Tesourinha de Sobrancelha Prata (Unidade avulsa)',
    'Formato anatômico com lâminas retas e afiadas - Ergonômica para corte preciso e acabamento impecável no design de sobrancelhas.',
    15.00,
    25,
    'design',
    '/assets/pro/tesourinha_sobrancelha.jpg',
    'Corte de Precisão',
    TRUE
),
(
    'Essenciais de Design & Acabamento',
    'Pinça de Sobrancelha Chanfrada (Unidade avulsa)',
    'Ponta chanfrada anatômica com fechamento rente - Remove pelos curtos e médios pela raiz com máxima precisão e sem agredir a pele.',
    7.00,
    35,
    'design',
    '/assets/pro/pinca_sobrancelha_chanfrada.jpg',
    'Fechamento Rente',
    TRUE
),
(
    'Essenciais de Design & Pequenos Toques',
    'Flor de Anel para Cola (Unidade avulsa)',
    'Design inteligente com ranhuras em formato de pétalas - Economiza adesivo, previne desperdício e mantém a gota fresca durante o atendimento.',
    0.50,
    100,
    'acessorios',
    '/assets/pro/flor_anel_cola.jpg',
    'Zero Desperdício',
    TRUE
);

COMMIT;

-- Verificação dos dados inseridos
SELECT id, nome, preco, estoque, categoria_filtro, badge, ativo 
FROM produtos_pro 
ORDER BY id ASC;
