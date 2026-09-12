# Simulador de lançamento de projéteis (ADO I)

Simulador visual de trajetórias de projéteis **sem resistência do ar**, com backend TypeScript (REST) e frontend React.

## Arquitetura

```
ado_I/
  shared/     # Tipos do contrato API
  backend/    # Express + fórmulas de física
  frontend/   # React + Vite + Canvas
```

- **REST API** (`POST /api/trajectory`): o front envia parâmetros e recebe pontos da trajetória + métricas.
- Sem WebSocket e sem webhook — o problema é request/response determinístico.
- Atualização “em tempo real”: o front chama a API com debounce ao mover os sliders; a animação roda no cliente com `requestAnimationFrame`.

## Fórmulas (sem resistência do ar)

Com velocidade inicial \(v_0\), ângulo \(\theta\), altura inicial \(y_0\) e gravidade \(g\):

\[
v_{0x} = v_0\cos\theta,\quad v_{0y} = v_0\sin\theta
\]

\[
x(t) = v_{0x}\,t,\quad y(t) = y_0 + v_{0y}\,t - \tfrac{1}{2}gt^2
\]

- **Tempo de voo** \(T\): raiz positiva de \(y(t) = 0\)
- **Altura máxima**: \(y_{\max} = y_0 + \dfrac{v_{0y}^2}{2g}\) (se \(v_{0y} > 0\); senão \(y_0\))
- **Alcance**: \(R = v_{0x}\,T\)
- **Trajetória**: amostragem de \(t \in [0, T]\)

## Como rodar

Pré-requisito: Node.js 20+.

```bash
cd ado_I
npm install
npm run build -w shared
npm run dev
```

Isso sobe:

- Backend: http://localhost:3001  
- Frontend: http://localhost:5173  

Scripts úteis:

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Backend + frontend juntos |
| `npm run dev:backend` | Só API |
| `npm run dev:frontend` | Só UI (proxy `/api` → `:3001`) |
| `npm test` | Testes unitários das fórmulas |
| `npm run build` | Build de shared, backend e frontend |

## API

### `GET /api/health`

```bash
curl http://localhost:3001/api/health
```

### `POST /api/trajectory`

**Request**

```json
{
  "initialSpeed": 25,
  "angleDeg": 45,
  "initialHeight": 0,
  "gravity": 9.81,
  "samples": 100
}
```

| Campo | Tipo | Regra |
|-------|------|--------|
| `initialSpeed` | number | > 0 (m/s) |
| `angleDeg` | number | 0–90 (graus) |
| `initialHeight` | number | ≥ 0 (m) |
| `gravity` | number | > 0 (m/s²) |
| `samples` | number? | 2–1000 (default 100) |

O front não expõe `gravity` como número livre: ele oferece um seletor de
planeta, que só manda um destes valores:

| Planeta | Gravidade (m/s²) |
|---------|-------------------|
| Terra | 9.81 |
| Lua | 1.62 |
| Marte | 3.71 |
| Júpiter | 24.79 |

**Response**

```json
{
  "flightTime": 3.60,
  "maxHeight": 15.92,
  "range": 63.71,
  "points": [{ "t": 0, "x": 0, "y": 0 }, ...]
}
```

**Exemplo curl**

```bash
curl -s http://localhost:3001/api/trajectory \
  -H 'Content-Type: application/json' \
  -d '{"initialSpeed":20,"angleDeg":45,"initialHeight":0,"gravity":9.81}'
```

## Interface

- Controles: velocidade inicial, ângulo, altura inicial, e um **seletor de planeta**
  (Terra / Lua / Marte / Júpiter) que define a gravidade
- Métricas: alcance, altura máxima, tempo de voo
- Canvas: curva da trajetória com eixos, unidades e escala consistente entre x e y
  (a proporção real da trajetória é preservada, sem distorção)
- **Ambientação por planeta**: trocar o planeta muda o tema inteiro da página
  (céu, chão, cores dos painéis) — a Lua tem céu escuro com estrelas, por exemplo
- Botão **Animar lançamento**: projétil percorre a trajetória calculada, com um
  efeito sonoro de lançamento sintetizado via Web Audio API (sem arquivo de áudio)

## Docker

Existe um `dockerfile` na raiz de `ado_I/` que builda os três workspaces
(`shared`, `backend`, `frontend`) e sobe **um único container** servindo a API
e a interface (o Express do backend também serve os arquivos estáticos do
build do frontend).

```bash
cd ado_I
docker build -t ado-i .
docker run -p 3001:3001 ado-i
```

Depois é só abrir `http://localhost:3001` — API e UI na mesma porta.

Sempre que houver mudança em `backend/`, `frontend/` ou `shared/`, é preciso
**reconstruir a imagem** antes de rodar de novo:

```bash
docker rm -f ado-i-run 2>/dev/null   # se já tiver um container rodando com esse nome
docker build -t ado-i .
docker run -d --name ado-i-run -p 3001:3001 ado-i
```

(`docker build` não faz cache incremental "inteligente" entre commits — ele
reconstrói a partir da camada que mudou, então builds subsequentes tendem a
ser rápidos.)
