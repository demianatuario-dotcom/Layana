-- ==============================================================================
-- LANA SUPPLY PRO - SCRIPT DE ATUALIZAÇÃO DO ESTOQUE E CATÁLOGO OFICIAL (14 PRODUTOS)
-- Banco de Dados: PostgreSQL (db_Layana)
-- Execução: Pode ser executado via pgAdmin, DBeaver, psql ou interface do Coolify
-- ==============================================================================
-- MEMÓRIA DE CÁLCULO DAS QUANTIDADES COMPRADAS (CONFORME PEDIDOS EM ANEXO):
-- ------------------------------------------------------------------------------
-- 1. Cílios Decemars YY U D (7mm a 13mm):
--    - Pedido: 2 caixas (7mm, D) -> ESTOQUE = 2
-- 2. Cílios Fadvan YV Vol. Brasileiro D Preto (8-14mm):
--    - Pedido: 1 caixa (D, 8-14mm) -> ESTOQUE = 1
-- 3. Cílios Decemars 4D W D (7mm a 13mm):
--    - Pedido: 3x 13mm + 3x 12mm + 3x 11mm + 3x 8mm + 3x 7mm = 15 caixas -> ESTOQUE = 15
-- 4. Pinça Profissional Nagaraku N-04 Dourada:
--    - Pedido: 4 unidades -> ESTOQUE = 4
-- 5. Pinça Profissional Nagaraku N-02 Dourada:
--    - Não consta nas imagens -> ESTOQUE = 0 (Esgotado)
-- 6. Fita Micropore Rosa 3cm (Unidade avulsa):
--    - Pedido: 6 pacotes com 12 fitas = 72 unidades avulsas -> ESTOQUE = 72
-- 7. Escovinha Descartável Dourada (Pacote com 12 un):
--    - Pedido: 6 lotes com 12 pacotes de 50 un = 3.600 unidades avulsas (300 pacotes de 12 un) -> ESTOQUE = 300 pacotes
-- 8. Placa de Mão para Cílios com Alça Removível:
--    - Não consta nas imagens -> ESTOQUE = 0 (Esgotado)
-- 9. Cola Adesivo Free Beautify Pro:
--    - Não consta nas imagens -> ESTOQUE = 0 (Esgotado)
-- 10. Removedor em Creme Cola Cílios 5g Excellent:
--    - Não consta nas imagens -> ESTOQUE = 0 (Esgotado)
-- 11. Adesivo de Cílios Fadvan 1 Seg (Exovan):
--    - Pedido: 5 unidades (Adesivo Fadvan 1 Seg) -> ESTOQUE = 5
-- 12. Tesourinha de Sobrancelha Prata (Unidade avulsa):
--    - Pedido: 3 pacotes com 5 unidades = 15 unidades avulsas -> ESTOQUE = 15
-- 13. Pinça de Sobrancelha Chanfrada (Unidade avulsa):
--    - Pedido: 5 pacotes + 5 pacotes = 10 pacotes com 5 unidades = 50 unidades avulsas -> ESTOQUE = 50
-- 14. Flor de Anel para Cola (Unidade avulsa):
--    - Pedido: 1 lote de 1.200 un (12 pct x 100) + 3 pacotes de 100 un = 1.500 unidades avulsas -> ESTOQUE = 1500
-- ==============================================================================

BEGIN;

-- 1. Garante que a tabela de produtos existe
CREATE TABLE IF NOT EXISTS produtos_pro (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(120) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    categoria_filtro VARCHAR(50) NOT NULL,
    imagem_url VARCHAR(255) NOT NULL,
    badge VARCHAR(80),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OPÇÃO 1: ATUALIZAÇÃO DIRETA DOS ESTOQUES (MANTÉM REGISTROS EXISTENTES)
UPDATE produtos_pro SET estoque = 2, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/cilios_decemars_yy.jpg';
UPDATE produtos_pro SET estoque = 1, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/cilios_fadvan_yv.jpg';
UPDATE produtos_pro SET estoque = 15, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/cilios_decemars_4d_w.jpg';
UPDATE produtos_pro SET estoque = 4, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/pinca_nagaraku_n04.jpg';
UPDATE produtos_pro SET estoque = 0, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/pinca_nagaraku_n02.jpg';
UPDATE produtos_pro SET estoque = 72, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/fita_micropore_rosa.jpg';
UPDATE produtos_pro SET nome = 'Escovinha Descartável Dourada (Pacote com 12 un)', preco = 6.00, estoque = 300, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/escovinha_descartavel_dourada.jpg';
UPDATE produtos_pro SET estoque = 0, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/placa_mao_cilios.jpg';
UPDATE produtos_pro SET estoque = 0, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/cola_adesivo_free_beautify.jpg';
UPDATE produtos_pro SET estoque = 0, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/removedor_creme_excellent.jpg';
UPDATE produtos_pro SET estoque = 5, nome = 'Adesivo de Cílios Fadvan 1 Seg (Exovan)', atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/adesivo_exovan_7seg.jpg';
UPDATE produtos_pro SET estoque = 15, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/tesourinha_sobrancelha.jpg';
UPDATE produtos_pro SET estoque = 50, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/pinca_sobrancelha_chanfrada.jpg';
UPDATE produtos_pro SET estoque = 1500, atualizado_em = CURRENT_TIMESTAMP WHERE imagem_url = '/assets/pro/flor_anel_cola.jpg';

-- Garante que produtos não listados fiquem com estoque 0
UPDATE produtos_pro 
SET estoque = 0 
WHERE imagem_url NOT IN (
    '/assets/pro/cilios_decemars_yy.jpg',
    '/assets/pro/cilios_fadvan_yv.jpg',
    '/assets/pro/cilios_decemars_4d_w.jpg',
    '/assets/pro/pinca_nagaraku_n04.jpg',
    '/assets/pro/fita_micropore_rosa.jpg',
    '/assets/pro/escovinha_descartavel_dourada.jpg',
    '/assets/pro/adesivo_exovan_7seg.jpg',
    '/assets/pro/tesourinha_sobrancelha.jpg',
    '/assets/pro/pinca_sobrancelha_chanfrada.jpg',
    '/assets/pro/flor_anel_cola.jpg'
);

COMMIT;

-- Verificação dos dados atualizados
SELECT id, nome, preco, estoque, categoria_filtro, badge, ativo 
FROM produtos_pro 
ORDER BY id ASC;
