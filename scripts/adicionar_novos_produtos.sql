-- Script de sincronização dos novos produtos para o banco PostgreSQL (db_Layana)
-- Adiciona Máscaras Talge, Luvas Nitrílicas Rosa Medix e Toucas Descarpack

DO $$
BEGIN
    -- 1. Máscara Talge
    IF EXISTS (SELECT 1 FROM produtos_pro WHERE imagem_url = '/assets/pro/mascara_tripla_talge.jpg') THEN
        UPDATE produtos_pro
        SET tipo = 'Biossegurança & Descartáveis • Talge',
            nome = 'Máscara Descartável Tripla Branca Talge (Caixa c/ 50 un)',
            descricao = 'Máscara cirúrgica descartável com elástico e clipe nasal maleável (Caixa com 50 unidades) - Alta eficiência de filtração bacteriana (EFB > 95%), hipoalergênica e atóxica para máxima segurança nos atendimentos.',
            preco = 23.00,
            estoque = 10,
            categoria_filtro = 'descartaveis',
            badge = 'EFB > 95%',
            ativo = TRUE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE imagem_url = '/assets/pro/mascara_tripla_talge.jpg';
    ELSE
        INSERT INTO produtos_pro (tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo)
        VALUES (
            'Biossegurança & Descartáveis • Talge',
            'Máscara Descartável Tripla Branca Talge (Caixa c/ 50 un)',
            'Máscara cirúrgica descartável com elástico e clipe nasal maleável (Caixa com 50 unidades) - Alta eficiência de filtração bacteriana (EFB > 95%), hipoalergênica e atóxica para máxima segurança nos atendimentos.',
            23.00,
            10,
            'descartaveis',
            '/assets/pro/mascara_tripla_talge.jpg',
            'EFB > 95%',
            TRUE
        );
    END IF;

    -- 2. Luva Nitrílica Rosa Medix
    IF EXISTS (SELECT 1 FROM produtos_pro WHERE imagem_url = '/assets/pro/luva_nitrilo_rosa_medix.jpg') THEN
        UPDATE produtos_pro
        SET tipo = 'Biossegurança & Descartáveis • Medix',
            nome = 'Luva de Nitrilo Rosa sem Pó Medix - Tam. P (Caixa c/ 100 un)',
            descricao = 'Luvas cirúrgicas de nitrilo pink sem pó (Caixa com 100 unidades / 50 pares) - Tamanho P - Alta sensibilidade tátil, barreira biológica superior e sem látex para máximo conforto e sofisticação na maca.',
            preco = 45.00,
            estoque = 4,
            categoria_filtro = 'descartaveis',
            badge = '100% Nitrilo Sem Pó',
            ativo = TRUE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE imagem_url = '/assets/pro/luva_nitrilo_rosa_medix.jpg';
    ELSE
        INSERT INTO produtos_pro (tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo)
        VALUES (
            'Biossegurança & Descartáveis • Medix',
            'Luva de Nitrilo Rosa sem Pó Medix - Tam. P (Caixa c/ 100 un)',
            'Luvas cirúrgicas de nitrilo pink sem pó (Caixa com 100 unidades / 50 pares) - Tamanho P - Alta sensibilidade tátil, barreira biológica superior e sem látex para máximo conforto e sofisticação na maca.',
            45.00,
            4,
            'descartaveis',
            '/assets/pro/luva_nitrilo_rosa_medix.jpg',
            '100% Nitrilo Sem Pó',
            TRUE
        );
    END IF;

    -- 3. Touca Descartável Descarpack
    IF EXISTS (SELECT 1 FROM produtos_pro WHERE imagem_url = '/assets/pro/touca_descartavel_descarpack.jpg') THEN
        UPDATE produtos_pro
        SET tipo = 'Biossegurança & Descartáveis • Descarpack',
            nome = 'Touca Descartável Sanfonada Branca Descarpack (Pacote c/ 100 un)',
            descricao = 'Touca sanfonada descartável em TNT 100% polipropileno com elástico duplo (Pacote com 100 unidades) - Confortável, leve, respirável e com barreira bacteriana para total higiene no estúdio.',
            preco = 19.00,
            estoque = 4,
            categoria_filtro = 'descartaveis',
            badge = 'Elástico Duplo',
            ativo = TRUE,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE imagem_url = '/assets/pro/touca_descartavel_descarpack.jpg';
    ELSE
        INSERT INTO produtos_pro (tipo, nome, descricao, preco, estoque, categoria_filtro, imagem_url, badge, ativo)
        VALUES (
            'Biossegurança & Descartáveis • Descarpack',
            'Touca Descartável Sanfonada Branca Descarpack (Pacote c/ 100 un)',
            'Touca sanfonada descartável em TNT 100% polipropileno com elástico duplo (Pacote com 100 unidades) - Confortável, leve, respirável e com barreira bacteriana para total higiene no estúdio.',
            19.00,
            4,
            'descartaveis',
            '/assets/pro/touca_descartavel_descarpack.jpg',
            'Elástico Duplo',
            TRUE
        );
    END IF;
END $$;
