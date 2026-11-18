# ADO II - Leis de Newton

Simulador de três sistemas com a 2ª Lei de Newton. Frontend em React e API em TypeScript.

1. Plano inclinado com atrito e tração (bloco m₁ no plano ligado por polia a m₂ pendurada)
2. Força centrípeta (objeto preso a um fio ou carro numa curva plana)
3. Força de arrasto (linear -bv ou quadrático -cv|v|, comparado com a queda livre)

As grandezas são calculadas por fórmulas fechadas num vetor de tempo (como um `linspace`).

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173 (a API fica na porta 3001).

Testes: `npm test`

## Deploy na Vercel

Importar o repositório na Vercel com esta pasta (`ado_II`) como Root Directory. O `vercel.json` já define o build, e cada arquivo de `api/` vira uma função serverless.

## Estrutura

```
api/          uma rota por sistema
lib/          fórmulas (uma classe por sistema) e validação
src/          interface (um componente e uma cena por sistema)
dev-api.ts    servidor local da API
```

## API

Todas as rotas são `POST` com JSON, unidades do SI e ângulo em graus.

| Rota | Corpo | Saída |
|------|-------|-------|
| `/api/inclined-plane` | `m1, m2, angleDeg, muK, muS` | `acceleration, tension, normalForce, drivingForce, frictionForce, state, points[t,x,v]` |
| `/api/centripetal` | `mode ("string" \| "car"), mass, radius, speed, muS?` | `centripetalForce, angularVelocity, period, maxSpeed, skidding, points[t,x,y]` |
| `/api/drag` | `model ("linear" \| "quadratic"), mass, coefficient` | `terminalVelocity, timeConstant, timeTo95, points[t,v,y,vFree,yFree]` |

Opcionais: `gravity` (padrão 9,81), `samples` (padrão 200), `duration` (s).
