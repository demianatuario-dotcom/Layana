Você é um desenvolvedor Frontend Full-Stack sênior especializado em UX/UI para e-commerce e sites de alta conversão.

### OBJETIVO DO PROJETO
Reestruturar a arquitetura e o design do site "Lana Wolf Art" (lanawolfart.cloud) para transformá-lo em uma plataforma híbrida (B2C + B2B) sem criar um domínio separado. O site deve atender com excelência a dois públicos distintos:
1. Clientes Finais (B2C): Mulheres interessadas em agendar serviços estéticos (Extensão de Cílios, Micropigmentação, Unhas, Piercing, etc.).
2. Profissionais & Alunas (B2B): Lash designers e micropigmentadoras que buscam comprar insumos profissionais (adesivos Booble, fios, pigmentos RBKollors/Diamond, descartáveis e kits para alunas).

---

### 1. ARQUITETURA DE ROTAS E NAVEGAÇÃO
Mantenha a base no mesmo domínio, estruturando a navegação da seguinte forma:
- Rota `/` (Home): Vitrine principal elegante com identificação e segmentação imediata de público.
- Rota `/pro` ou `/loja` (Lana Supply Pro): Catálogo e vitrine B2B de insumos para profissionais.
- Rota `/studio` ou âncoras na Home: Seção completa de procedimentos e agendamentos.

#### Modificações no Menu Superior (Navbar / Header):
- Logotipo: Alinhado à esquerda mantendo a identidade visual refinada (Lana Wolf Art).
- Links Centrais: "Studio & Procedimentos", "Sobre Nós", "Loja Pro (Insumos)", "Cursos", "Localização".
- Botões de Ação Rápida (CTA Dual):
  - Botão Secundário / Contorno: "Área da Profissional (Loja)" -> Redireciona para `/loja`.
  - Botão Primário / Destaque: "Agendar Procedimento" -> Rola para o widget ou abre WhatsApp com mensagem pré-definida de agendamento.

---

### 2. ALTERAÇÕES ESPECÍFICAS NAS SEÇÕES EXISTENTES

#### A. Hero Section (Topo da Página Inicial)
- Adicione um banner moderno com proposta de valor dupla:
  - Título: "Arte, Beleza e Formação Profissional em Luziânia"
  - Subtítulo: "Studio especializado em realce do olhar e estética avançada, além de revenda autorizada dos melhores insumos profissionais para lash designers e micropigmentadoras."
  - Duplo CTA no banner:
    1. "Quero Agendar um Horário" (Foco Cliente Final)
    2. "Comprar Insumos a Pronta Entrega" (Foco Aluna / Profissional)

#### B. Seção "Procedimentos" (B2C)
- Mantenha os cards bem formatados com fotos e descrições dos serviços atuais:
  - Design de Sobrancelhas, Micro de Sobrancelhas, Extensão de Cílios, Micro Labial, Tatuagem / Fine Line, Alongamento de Unhas, Pedicure Premium e Body Piercing.
- Em cada card de procedimento, inclua um botão de ação direto: "Saber mais e Agendar".

#### C. Transformação da Seção "Técnicas e Produtos" em Vitrine de Insumos (B2B)
- A seção atual, que apenas lista marcas (Booble, RBKollors, Diamond), deve ser remodelada para se tornar uma vitrine comercial ativa ("Lana Supply Pro - Insumos Utilizados em Bancada").
- Adicione filtros por categoria:
  1. "Extensão de Cílios (Booble, Fios & Adesivos)"
  2. "Micropigmentação (Pigmentos RBKollors & Diamond)"
  3. "Biossegurança & Descartáveis"
  4. "Kits Prontos para Alunas"
- Estrutura de cada Card de Produto:
  - Imagem do produto.
  - Título e Especificação (Ex: Adesivo Booble Rubi 3ml, Caixa Fio Y Nagaraku Mix, Pigmento RBKollors Red Rose).
  - Badge de destaque: "Pronta Entrega Luziânia/Entorno" ou "Aprovado por Layana Wolf".
  - Valor / Preço de revenda.
  - Botão de Compra Expressa via WhatsApp:
    `Link: https://wa.me/55619XXXXXXXX?text=Olá!%20Gostaria%20de%20comprar%20o%20produto%20[NomeDoProduto]%20a%20pronta%20entrega.`

#### D. Seção do Chatbot / Especialista de Beleza Virtual
- Manter o widget da Lana, ajustando a interface para oferecer opções rápidas no primeiro clique:
  - [Opção 1] "Quero agendar um procedimento no Studio"
  - [Opção 2] "Quero comprar materiais e insumos profissionais"
  - [Opção 3] "Informações sobre cursos"

---

### 3. DIRETRIZES DE DESIGN E UX/UI
- Paleta de Cores: Mantenha os tons nude, rosé, preto e dourado característicos do segmento de estética de alto padrão.
- Responsividade: Otimização total para dispositivos móveis (foco no carregamento rápido e botões táteis no WhatsApp).
- SEO & Performance: Inserir meta tags para busca local (Ex: "Insumos para extensão de cílios em Luziânia", "Pigmentos RBKollors Jardim Ingá", "Estúdio de beleza Lana Wolf").

---

### RESULTADO ESPERADO
Gere o código estruturado (HTML, CSS/Tailwind e JavaScript/React, conforme a stack do projeto) implementando:
1. O novo Header com a navegação segmentada (Studio vs. Loja Pro).
2. O componente remodelado da vitrine de produtos/insumos com botão dinâmico de pedido via WhatsApp.
3. O componente Hero com o duplo CTA.