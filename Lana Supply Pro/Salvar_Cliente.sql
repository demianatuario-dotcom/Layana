INSERT INTO clientes (whatsapp, nome, data_nascimento, estado_atendimento) 
VALUES ($1, $2, $3, $4) 
ON CONFLICT (whatsapp) 
DO UPDATE SET 
nome = COALESCE(NULLIF($2,''), clientes.nome),
data_nascimento = COALESCE(NULLIF($3,''), clientes.data_nascimento),
estado_atendimento = COALESCE(NULLIF($4,''), clientes.estado_atendimento);