import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from matplotlib.patches import Rectangle
from matplotlib.widgets import Button, RadioButtons, Slider


CASOS = {
    "Caso 1: m1 = m2": (1.0, 1.0, 4.0),
    "Caso 2: m1 < m2": (1.0, 4.0, 5.0),
    "Caso 3: m1 > m2": (4.0, 1.0, 5.0),
}

X1_0 = -5.0  
X2_0 = 0.0  
PASSO = 0.03  

def colisao_elastica(m1, m2, v1, v2):
    u1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2 )
    u2 = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
    return u1, u2;


def momento(m1, m2, v1, v2):
    return m1 * v1 + m2 * v2;


def cinetica(m1, m2, v1, v2):
    return 0.5 * m1 * v1**2 + 0.5 * m2 * v2**2;


def impulsos(m1, m2, v1, v2, u1, u2):
    return m1 * (u1 - v1), m2 * (u2 - v2)


def largura(m):
    return 0.8 * m ** (1 / 3)


def instante_choque(v1, v2, L1, L2):
    return (X2_0 - X1_0 - (L1 + L2) / 2) / (v1 - v2)


def posicao(x0, v, u, tc, t):
    if t < tc:
        return x0 + v * t
    return x0 + v * tc + u * (t - tc)


def simular(m1, m2, v1, v2, dt_ms):
    L1, L2 = largura(m1), largura(m2)
    colide = v1 > v2

    if colide:
        u1, u2 = colisao_elastica(m1, m2, v1, v2)
        tc = instante_choque(v1, v2, L1, L2)
        t_fim = 2 * tc
    else:
        u1, u2 = v1, v2
        tc = float("inf")
        t_fim = 4.0

    J1, J2 = impulsos(m1, m2, v1, v2, u1, u2)
    K_antes = cinetica(m1, m2, v1, v2)
    K_depois = cinetica(m1, m2, u1, u2)

    return {
        "m1": m1, "m2": m2, "v1": v1, "v2": v2, "u1": u1, "u2": u2,
        "L1": L1, "L2": L2, "colide": colide, "tc": tc, "t_fim": t_fim,
        "p_antes": momento(m1, m2, v1, v2),
        "p_depois": momento(m1, m2, u1, u2),
        "K_antes": K_antes,
        "K_depois": K_depois,
        "dK": round(K_depois - K_antes, 9) + 0.0,  
        "J1": J1, "J2": J2,
        "dt_ms": dt_ms,
        "Fmed": abs(J1) / (dt_ms / 1000),
    }


fig = plt.figure(figsize=(13, 8))
fig.canvas.manager.set_window_title("ADO-3 - Colisões elásticas")

ax_anim = fig.add_axes([0.05, 0.62, 0.62, 0.33])
ax_p = fig.add_axes([0.07, 0.36, 0.26, 0.19])
ax_k = fig.add_axes([0.41, 0.36, 0.26, 0.19])

ax_anim.set_xlim(-7, 12)
ax_anim.set_ylim(-0.3, 2.6)
ax_anim.set_yticks([])
ax_anim.set_xlabel("x (m)")
ax_anim.axhline(0, color="#333", lw=1.5)
ax_anim.set_title("Colisão frontal elástica")

bloco1 = Rectangle((0, 0), 1, 1, fc="#6b8cba", ec="#222")
bloco2 = Rectangle((0, 0), 1, 1, fc="#c47a4a", ec="#222")
ax_anim.add_patch(bloco1)
ax_anim.add_patch(bloco2)
rotulo1 = ax_anim.text(0, 0, "m1", ha="center", va="center", color="white", weight="bold")
rotulo2 = ax_anim.text(0, 0, "m2", ha="center", va="center", color="white", weight="bold")
texto_tempo = ax_anim.text(0.01, 0.92, "", transform=ax_anim.transAxes, family="monospace")
texto_aviso = ax_anim.text(0.5, 0.75, "", transform=ax_anim.transAxes, ha="center", color="#c00", weight="bold")

barras_p = ax_p.bar(["antes", "depois"], [0, 0], color=["#888", "#222"])
barras_k = ax_k.bar(["antes", "depois"], [0, 0], color=["#888", "#222"])
ax_p.set_title("Momento total p (kg.m/s)")
ax_k.set_title("Energia cinética total K (J)")

painel = fig.text(0.72, 0.95, "", va="top", family="monospace", fontsize=10)

ax_radio = fig.add_axes([0.72, 0.28, 0.22, 0.14])
ax_radio.set_title("Casos (v2 = 0)", fontsize=10)
radio = RadioButtons(ax_radio, list(CASOS))

s_m1 = Slider(fig.add_axes([0.12, 0.23, 0.5, 0.03]), "m1 (kg)", 0.1, 10, valinit=1.0)
s_m2 = Slider(fig.add_axes([0.12, 0.185, 0.5, 0.03]), "m2 (kg)", 0.1, 10, valinit=1.0)
s_v1 = Slider(fig.add_axes([0.12, 0.14, 0.5, 0.03]), "v1 (m/s)", -10, 10, valinit=4.0)
s_v2 = Slider(fig.add_axes([0.12, 0.095, 0.5, 0.03]), "v2 (m/s)", -10, 10, valinit=0.0)
s_dt = Slider(fig.add_axes([0.12, 0.05, 0.5, 0.03]), "Delta(t) (ms)", 1, 100, valinit=10, valstep=1)

b_pausar = Button(fig.add_axes([0.72, 0.12, 0.1, 0.05]), "Pausar")
b_reiniciar = Button(fig.add_axes([0.84, 0.12, 0.1, 0.05]), "Reiniciar")

estado = {"t": 0.0, "pausado": False, "sim": None}


def texto_painel(s):
    if not s["colide"]:
        choque = "Sem colisão (v1 <= v2)"
    else:
        choque = f"Choque em tc = {s['tc']:.2f} s"
    return (
        f"{choque}\n\n"
        "Velocidades (m/s)\n"
        f"  antes:   v1 = {s['v1']:6.2f}   v2 = {s['v2']:6.2f}\n"
        f"  depois:  u1 = {s['u1']:6.2f}   u2 = {s['u2']:6.2f}\n\n"
        "Momento linear (kg.m/s)\n"
        f"  p antes  = {s['p_antes']:7.2f}\n"
        f"  p depois = {s['p_depois']:7.2f}\n\n"
        "Energia cinética (J)\n"
        f"  K antes  = {s['K_antes']:7.2f}\n"
        f"  K depois = {s['K_depois']:7.2f}\n"
        f"  Delta(K)          = {s['dK']:7.2f}\n\n"
        "Impulso (N.s)\n"
        f"  J1 = m1(u1 - v1) = {s['J1']:7.2f}\n"
        f"  J2 = m2(u2 - v2) = {s['J2']:7.2f}\n\n"
        f"Força média (Delta(t) = {s['dt_ms']:.0f} ms)\n"
        f"  F_med = |J|/Delta(t) = {s['Fmed']:.1f} N"
    );


def ajustar_barras(barras, ax, antes, depois):
    for barra, valor in zip(barras, (antes, depois)):
        barra.set_height(valor)
    topo = max(abs(antes), abs(depois), 1) * 1.25
    ax.set_ylim(-topo if min(antes, depois) < 0 else 0, topo)
    for txt in ax.texts:
        txt.remove()
    for barra, valor in zip(barras, (antes, depois) ):
        ax.text(barra.get_x() + barra.get_width() / 2, valor, f"{valor:.2f}", ha="center", va="bottom" if valor >= 0 else "top")


def reiniciar(_=None ):
    s = simular(s_m1.val, s_m2.val, s_v1.val, s_v2.val, s_dt.val)
    estado["sim"] = s
    estado["t"] = 0.0

    bloco1.set_width(s["L1"])
    bloco1.set_height(s["L1"])
    bloco2.set_width(s["L2"])
    bloco2.set_height(s["L2"])

    painel.set_text(texto_painel(s))
    texto_aviso.set_text("" if s["colide"] else "Sem colisão: v1 <= v2, o bloco 1 não alcança o bloco 2")
    ajustar_barras(barras_p, ax_p, s["p_antes"], s["p_depois"])
    ajustar_barras(barras_k, ax_k, s["K_antes"], s["K_depois"])
    desenhar()


def desenhar():
    s, t = estado["sim"], estado["t"]
    x1 = posicao(X1_0, s["v1"], s["u1"], s["tc"], t)
    x2 = posicao(X2_0, s["v2"], s["u2"], s["tc"], t)

    bloco1.set_x(x1 - s["L1"] / 2)
    bloco2.set_x(x2 - s["L2"] / 2)
    rotulo1.set_position((x1, s["L1"] / 2))
    rotulo2.set_position((x2, s["L2"] / 2))

    if not s["colide"]:
        fase = "sem colisão"
    elif t < s["tc"]:
        fase = "antes do choque"
    else:
        fase = "depois do choque"
    texto_tempo.set_text(f"t = {t:5.2f} s   ({fase})")


def quadro(_):
    if not estado["pausado"]:
        estado["t"] += PASSO
        if estado["t"] > estado["sim"]["t_fim"]:
            estado["t"] = 0.0
    desenhar()


def escolher_caso(nome):
    m1, m2, v1 = CASOS[nome]
    s_m1.set_val(m1)
    s_m2.set_val(m2)
    s_v1.set_val(v1)
    s_v2.set_val(0.0)


def pausar(_):
    estado["pausado"] = not estado["pausado"]
    b_pausar.label.set_text("Continuar" if estado["pausado"] else "Pausar")


def reiniciar_botao(_):
    estado["pausado"] = False
    b_pausar.label.set_text("Pausar")
    reiniciar()


for slider in (s_m1, s_m2, s_v1, s_v2, s_dt):
    slider.on_changed(reiniciar)
radio.on_clicked(escolher_caso)
b_pausar.on_clicked(pausar)
b_reiniciar.on_clicked(reiniciar_botao)

reiniciar()
anim = FuncAnimation(fig, quadro, interval=PASSO * 1000, cache_frame_data=False)
plt.show()
