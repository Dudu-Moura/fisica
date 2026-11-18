# ADO I - Lançamento de projéteis

Simulador de lançamento oblíquo sem resistência do ar. Frontend em React e API em TypeScript.

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173 (a API fica na porta 3001).

Testes: `npm test`

## Deploy na Vercel

Importar o repositório na Vercel com esta pasta (`ado_I`) como Root Directory. Não precisa mudar nenhuma configuração: o `vercel.json` já define o build, e a pasta `api/` vira a função serverless.

## Estrutura

```
api/trajectory.ts   POST /api/trajectory
lib/projectile.ts   fórmulas
src/                interface
dev-api.ts          servidor local da API
```

## Fórmulas

- v0x = v0 cos θ, v0y = v0 sen θ
- x(t) = v0x t
- y(t) = y0 + v0y t - g t²/2
- Tempo de voo: raiz positiva de y(t) = 0
- Altura máxima: y0 + v0y² / 2g
- Alcance: v0x · t_voo
