# Simulador — Leis de Newton e Aplicações (ADO II)

Simulação interativa de três sistemas mecânicos regidos pela 2ª Lei de Newton (ΣF = m·a),
com backend TypeScript (API REST) e frontend Angular:

1. **Plano inclinado com atrito e tração** — bloco m₁ no plano ligado por polia a uma massa m₂ pendurada.
2. **Força centrípeta** — objeto preso a um fio (MCU) ou carro numa curva plana (atrito estático, v_max = √(μgR)).
3. **Força de arrasto** — queda com arrasto linear (−bv) ou quadrático (−cv|v|), comparada à queda livre.

Não há integração numérica: todas as grandezas são calculadas por **fórmulas fechadas**
avaliadas sobre um vetor de tempo (equivalente ao `np.linspace`).

## Como rodar

### Usar Deploy Vercel:
Site ADO 2 - https://fisicaado2.vercel.app/
### Opção recomendada: Docker

```bash
cd ado_II
docker build -t ado-ii .
docker run -p 3001:3001 ado-ii
```

Abra `http://localhost:3001`: API e interface sobem juntas, na mesma porta.

### Alternativa: rodar localmente com Node.js

Pré-requisito: Node.js 20+.

```bash
cd ado_II
npm install
npm run dev
```

Isso sobe:

- Backend: http://localhost:3001
- Frontend: http://localhost:4200 (o proxy do Angular encaminha `/api` para o backend)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Compila `shared` e sobe backend + frontend juntos |
| `npm run build` | Build de produção de tudo |
| `npm test` | Testes das fórmulas (backend, Vitest) |
| `npm start` | Sobe o backend compilado |

## Estrutura

```
ado_II/
├── api/                         # funções serverless da Vercel (uma por sistema)
├── vercel.json                  # build, headers de segurança e rotas da Vercel
├── shared/src/types.ts          # contratos da API (request/response de cada sistema)
├── backend/src/
│   ├── server.ts                # Express (Docker / dev local)
│   ├── serverless.ts            # adaptador Request → Response usado por api/
│   ├── routes/                  # validação (zod) + rota por sistema
│   └── physics/
│       ├── PhysicalSystem.ts    # classe base abstrata
│       ├── InclinedPlaneSystem.ts
│       ├── CentripetalSystem.ts
│       ├── DragSystem.ts
│       └── *.test.ts            # testes de cada sistema
└── frontend/src/app/
    ├── app.*                    # topo + dropdown de escolha do sistema
    ├── core/                    # cliente da API, simulação reativa, relógio da animação
    ├── ui/                      # slider, gráfico (Chart.js), cena em canvas, controles
    └── systems/                 # um componente por sistema (+ cena animada e situações reais)
```

### Onde ficam as fórmulas

Cada classe em `backend/src/physics/` tem duas partes:

- **FÓRMULAS**: um método por equação, com a lei/equação usada no comentário.
  Enquanto não implementado, o método chama `todo("...")`, a API responde **HTTP 501** e a
  interface mostra qual método falta.
- **ORQUESTRAÇÃO** (`simulate`): já pronta. Chama as fórmulas, gera o vetor de tempo e monta a resposta.

Os testes em `*.test.ts` servem de gabarito: `npm test` passa quando as fórmulas estiverem corretas.

## API

Todas as rotas são `POST` com corpo JSON (unidades SI; ângulo em graus).

| Rota | Corpo | Principais saídas |
|------|-------|-------------------|
| `/api/inclined-plane` | `m1, m2, angleDeg, muK, muS` | `acceleration, tension, normalForce, drivingForce, state, points[t,x,v]` |
| `/api/centripetal` | `mode ("string" \| "car"), mass, radius, speed, muS?` | `centripetalForce, angularVelocity, period, maxSpeed, skidding, points[t,x,y]` |
| `/api/drag` | `model ("linear" \| "quadratic"), mass, coefficient` | `terminalVelocity, timeConstant, timeTo95, points[t,v,y,vFree,yFree]` |

Parâmetros opcionais: `gravity` (padrão 9,81), `samples` (padrão 200), `duration` (s).
