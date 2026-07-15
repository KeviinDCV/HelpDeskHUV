---
format: 1920x1080
message: "En el HUV ya puedes reportar cualquier problema por chat con IA — en segundos y sin esperar en el teléfono."
arc: PAS — Dolor (llamar y esperar) → Solución (Evarisbot) → Demo (chat → IA → caso radicado) → Beneficios → CTA
audience: Trabajadores del HUV — personal asistencial y administrativo, perfil no técnico
mode: collaborative
---

# Reporte Sistemas HUV — video de lanzamiento

**Verdad del producto**

- **Dolor:** cuando algo falla, había que llamar a soporte, esperar en la línea, repetir el problema y quedarse sin saber en qué quedó el caso.
- **Promesa:** ahora se le cuenta a Evarisbot por chat, y el reporte queda hecho.
- **Rol del producto:** Evarisbot, el asistente con IA que guía paso a paso y arma el reporte por ti.
- **Prueba:** la página real — el chat que pregunta, el panel RESUMEN que se llena solo, el botón que radica el caso.
- **CTA:** entrar a Reporte Sistemas HUV y hablarle a Evarisbot.

Duración total: **61.6s** (7 frames, sincronizados a la voz real). El audio ya está generado y **no cambia**.

---

## Video direction — v2 «CLARO, PERO CON FUERZA»

> **Esta versión SUSTITUYE la dirección anterior.** La v1 era correcta pero visualmente muda: fondos blancos planos, todo en 2D, tipografía pequeña, dos capas de profundidad. El registro institucional se mantiene (nada de publicidad chillona ante una E.S.E. pública), pero la **presencia** sube varios escalones.

**Paleta — sin cambios (de `frame.md`).** Acento ÚNICO `primary` `#2D3E5E` (navy HUV). Display en `text` `#0A0A0A`; cuerpo en `text-muted` `#2C4370`; pendientes en `text-light` `#9A9A9A`. Instrument Sans en todo el ramp. Verde `#05DF72` y naranja `#FF8904` existen SOLO dentro de la UI reconstruida.

**1 · El suelo NUNCA es blanco plano.** Cada frame se apoya en un **campo de luz por capas**: base `#FFFFFF` + un **sustrato geométrico** (rejilla navy de 1px al 3–4% de alfa, o anillos concéntricos) + un **bloom radial navy suave** (`rgba(45,62,94,0.05–0.10)`) anclado fuera de centro. El sustrato **parallaxea** contra el primer plano (se mueve más lento). Esto es lo que mata la sensación de vacío.

**2 · La elevación reemplaza a «sin sombras».** Las **sombras duras siguen prohibidas**. La profundidad se construye con: **glow ambiental navy difuso** bajo las superficies flotantes (un halo suave tipo `0 40px 90px rgba(45,62,94,0.10)`, nunca un borde nítido), escala, desenfoque y solapamiento.

**3 · Escala tipográfica — DUPLICADA.** Display héroe **140–220px** (antes 84px: ese era el error). h2 **64–90px**. El héroe debe **dominar** el cuadro. Prueba del entrecerrar los ojos: al desenfocar, un elemento gana claramente.

**4 · Profundidad obligatoria — mínimo 4 capas.** (1) base · (2) sustrato geométrico con parallax · (3) bloom · (4) contenido · (5) acento en primer plano opcional. **Capas distintas se mueven a ritmos distintos.**

**5 · 3D real.** La ventana reconstruida vive en una **escena 3D**: `perspective: 1600px` en el envoltorio-mundo, la ventana reposa con una inclinación sutil (`rotateY(-7deg) rotateX(3deg)`), y la cámara se mueve **en Z** (`translateZ`), no solo escalando. El contenido puede hacer `translateZ` para saltar hacia el espectador.

**6 · Motion blur.** Entradas rápidas y empujes de cámara llevan **desenfoque direccional que resuelve a 0** (`motion-blur-streak`). Jamás sobre un elemento ya asentado.

**7 · Profundidad de campo activa.** Se usa para dirigir la mirada (`depth-of-field-blur`), no como adorno.

**8 · Bloom en los reveals clave.** Florece **una vez** y reposa (`ambient-glow-bloom`, **finito**).

**Gramática de movimiento — intacta.** `power3` de cola larga por defecto. **NADA de rebote/overshoot.** Revelado **pautado a la voz**: en t=0 solo entra lo que la voz dice; cada pieza se revela cuando la voz la nombra. Sostenidos = quietud (+ *subtle jitter* como mucho). Cortes internos **velocity-matched**.

**Ritmo.** Frames 3–4 = la demo densa (22s, la energía alta). **Frame 5 = el respiro deliberado**: aterriza y se detiene por completo. Frame 7 resuelve como un afiche.

**Lista negativa.** Sombras **duras**. Easings bouncy (`back.out`/`bounce.out`/`elastic.out`). `repeat`/`yoyo`/movimiento infinito. `Math.random`/`Date.now`. Degradados morados/azules «de IA» y bokeh flotante. Chrome de navegador fuera de la reconstrucción intencional. **La IP local `192.168.2.172:8002` NUNCA en pantalla.** Los dos modos de fallo: *slideshow* (volcar todo y congelar) y *screensaver* (todo flotando por su cuenta).

**Banda de subtítulos.** El ~17% inferior libre: todo el contenido en el ~83% superior (y ≤ y=900px).

---

## Nota de reconstrucción de UI (frames 3–5)

Reconstruida en HTML, ahora **en perspectiva 3D**. Referencia: `capture/screenshots/scroll-000.png` (ignorar el tour de bienvenida que la tapa).

- Lienzo de la ventana `#F8FAFC`; tarjetas blancas, radio ~12px. **Glow de elevación navy suave debajo** (no sombra dura).
- **Tarjeta izquierda = chat.** Cabecera navy `#2D3E5E`: avatar circular (`assets/Evaris.png`), «Evarisbot» + «EN LÍNEA» con punto verde `#05DF72`. Burbuja del bot gris muy claro `#F8FAFC`; burbuja del usuario navy, a la derecha. Input píldora: «Escribe tu mensaje…» + avión de papel.
- **Tarjeta derecha = «RESUMEN».** «QUIEN REPORTA» (Nombre / Cargo / Servicio) y «EL PROBLEMA» (Descripción). Campos arrancan en «Pendiente…» / «…». Punto naranja `#FF8904` = activo; resueltos en navy sólido.
- **Botón** «Completa la conversación»: deshabilitado (gris) → navy sólido al completar. Único elemento sólido del video.

---

## Frame 1 — Antes: llamar y esperar

- scene: Tres fallas cotidianas se turnan en tipografía gigante que se ensambla desde la profundidad; cierra en una barra de espera que nunca se llena.
- voiceover: "¿El computador no enciende? ¿La impresora no responde? ¿Se cayó el sistema? Antes, para reportarlo, tocaba llamar a soporte. Y esperar en la línea."
- duration: 8.32s
- transition_in: cut
- status: animated
- src: compositions/frames/01-antes-llamar-esperar.html
- type: hook
- persuasion: Pain validation
- beat: frustration
- blueprint: kinetic-type-beats (Adapt)
- asset_candidates:

narrativeRole: Valida el dolor que todo trabajador del HUV reconoce en tres segundos, y lo cierra con la fricción real.
keyMessage: Reportar un problema costaba tiempo que no tienes.

**Adapt:** se conserva la firma del *hard-cut swap* — pero ahora cada intercambio tiene **dimensión**: los glifos salientes se dispersan hacia atrás en el eje Z y los entrantes se ensamblan desde la profundidad.

Scene 1 (0.0–1.7s): el suelo se arma — sustrato de rejilla navy (3% alfa) sube y **parallaxea lento**; un bloom radial navy reposa bajo el centro. `¿El computador no enciende?` se **ensambla desde la profundidad 3D** (`depth-scatter-assemble`): los glifos llegan desde Z con **motion blur que resuelve a nítido** (`motion-blur-streak`), en stagger por palabra. **h1 a ~150px**, ink, centrado, ocupando ~80% del ancho.
Scene 2 (1.7–3.2s): **hard-cut swap** → `¿La impresora no responde?`. Los glifos salientes se **dispersan hacia atrás en Z** con blur; los entrantes se ensamblan hacia delante. El corte SIGUE siendo el beat.
Scene 3 (3.2–4.7s): swap → `¿Se cayó el sistema?`. Un `?` navy **gigante (~1200px, 5% alfa)** sangra por la esquina superior derecha y parallaxea **más lento** que el texto.
Scene 4 (4.7–6.5s): **cut-the-curve** (→ `cut-catalog.md`): las preguntas salen hacia arriba a velocidad con motion blur; `Antes, tocaba llamar a soporte.` llega sobre la curva emparejada, **~130px**.
Scene 5 (6.5–8.32s): «Y esperar en la línea.» — una barra navy **de ancho completo** con un **glow navy difuso debajo** aparece baja en el cuadro y **avanza lentísima: sigue sin llenarse cuando el frame acaba** (`stat-bars-and-fills`). El sustrato mantiene su parallax. Todo lo demás, quieto.

## Frame 2 — Ya no. Evarisbot.

- scene: «Ya no.» domina el cuadro; Evarisbot empuja hacia el espectador desde la profundidad y la luz llega con él.
- voiceover: "Ya no. Ahora se lo cuentas a Evarisbot: el asistente con inteligencia artificial del Hospital Universitario del Valle. Disponible para todo el personal."
- duration: 8.917s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-evarisbot.html
- type: product_intro
- persuasion: Negative contrast (antes → ahora)
- beat: relief + curiosity
- blueprint: kinetic-type-beats (Adapt)
- focal: assets/Evaris.png
- roles: Evaris.png = cutout (sujeto en primer plano; nombre y píldora debajo)
- sfx:
- asset_candidates: assets/Evaris.png — mascota Evarisbot, médico caricaturizado con diadema y halo de IA

narrativeRole: Aterriza la promesa del video en el beat 2 y le pone cara y nombre a la solución.
keyMessage: Hay un asistente con IA que ahora hace el reporte contigo.

**Adapt:** el *name-drop que resuelve sobre la marca* — la «marca» es la mascota. **La luz llega con él**: un bloom radial se expande hacia afuera desde su centro. Es el giro del video hecho imagen.

Scene 1 (0.0–1.6s): campo de luz. `Ya no.` aterriza dead-center **a ~200px**, ink, 700, en corte duro, asentado con `spring-pop-entrance` en registro **suave — sin overshoot**. Sola, dominando el cuadro.
Scene 2 (1.6–3.8s): `Ya no.` se encoge y sube a eyebrow. Evarisbot **empuja hacia delante desde Z profundo** (`scale-swap-transition` + `motion-blur-streak` que resuelve a nítido). Desde su centro se **expande hacia afuera un bloom radial navy** (`ambient-glow-bloom`, **finito**) y **dos anillos concéntricos barren hacia afuera una sola vez** y se disuelven. 5 capas: rejilla / bloom / anillos / mascota / texto.
Scene 3 (3.8–5.8s): el nombre `Evarisbot` se escribe debajo con caret (`discrete-text-sequence` + `context-sensitive-cursor`), **~90px**, ink. **Cuatro nodos navy pequeños entran volteando desde 3D** (`orbit-3d-entry`) y **se asientan en reposo** alrededor de la mascota — llegan y **SE DETIENEN** (nada de órbita infinita).
Scene 4 (5.8–7.4s): `tag-pill` «Asistente con IA · HUV» entra con pop suave (`accent-light` / `primary`, radio 100px).
Scene 5 (7.4–8.917s): «Disponible para todo el personal.» se asienta como línea de cuerpo. Todo **SOSTIENE quieto**; solo *subtle jitter*.

## Frame 3 — Él te pregunta

- scene: La ventana del sistema flota en perspectiva 3D; Evarisbot saluda y las preguntas se encienden una a una.
- voiceover: "Entras al chat, y él empieza la conversación. Te saluda, y te va preguntando lo necesario, paso a paso: tu nombre, tu cargo, y el servicio donde trabajas. No hay formularios."
- duration: 10.133s
- transition_in: crossfade
- status: animated
- src: compositions/frames/03-el-te-pregunta.html
- type: feature_showcase
- persuasion: Friction reduction (no hay formulario — te preguntan)
- beat: ease
- blueprint: device-surface-showcase (Adapt)
- focal: assets/Evaris.png
- roles: Evaris.png = supporting (avatar en la cabecera del chat)
- sfx:
- asset_candidates: assets/Evaris.png — avatar del bot en la cabecera del chat

narrativeRole: Primer contacto con la superficie real: no hay que aprender nada, solo responder.
keyMessage: No llenas un formulario; sostienes una conversación.

**Adapt:** la *ventana-como-héroe cuyos contenidos avanzan*, ahora **en una escena 3D real** — `perspective: 1600px`, la ventana reposa inclinada y la cámara se mueve **en Z**, no solo escalando.

Scene 1 (0.0–2.0s): la ventana **llega desde Z profundo** con motion blur que resuelve, **inclinada en 3D** (`rotateY(-7deg) rotateX(3deg)`), y se asienta en su pose de reposo — ocupando **~78% del cuadro**. Bajo ella florece un **glow de elevación navy difuso**. Detrás, el sustrato de rejilla parallaxea. Solo el chrome está poblado; **el cuerpo del chat está vacío**.
Scene 2 (2.0–4.0s): al decir «Te saluda», la burbuja de saludo **se escribe** (`discrete-text-sequence`, type-on con caret). La **cámara empuja en Z** hacia la tarjeta de chat y la ventana **rota levemente hacia plano** al acercarse. RESUMEN se **desenfoca** (`depth-of-field-blur`).
Scene 3 (4.0–5.6s): al nombrar «tu nombre», la fila «Nombre» se **enciende**: su punto pasa de gris a **naranja `#FF8904`** con un pulso de glow. Entra la burbuja del usuario, navy, con un pequeño **salto en Z** hacia el espectador.
Scene 4 (5.6–7.0s): «tu cargo» — igual; el punto de «Nombre» se asienta resuelto en navy. **Uno por señal hablada, nunca simultáneos.**
Scene 5 (7.0–8.6s): «y el servicio donde trabajas» — la tercera fila se enciende.
Scene 6 (8.6–10.133s): `No hay formularios.` aterriza **grande (~80px)** bajo la ventana con un **keyword glow** (`asr-keyword-glow`). La ventana **SOSTIENE quieta**. **Sin push de segunda mitad.**

## Frame 4 — La IA arma el reporte sola

- scene: Escribes con tus palabras y un rastro de luz viaja desde tu mensaje hasta el panel, encendiendo cada campo del reporte.
- voiceover: "Después le cuentas qué pasó, con tus propias palabras, como se lo dirías a un compañero. La inteligencia artificial lo entiende, lo clasifica, y va armando el resumen del reporte ella sola, mientras tú conversas."
- duration: 12.011s
- transition_in: crossfade
- status: animated
- src: compositions/frames/04-ia-arma-resumen.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: clarity + control
- blueprint: cursor-ui-demo (Reproduce)
- focal: assets/Evaris.png
- roles: Evaris.png = supporting (avatar en cabecera + indicador de escritura)
- sfx: click-soft
- asset_candidates: assets/Evaris.png — avatar del bot en la cabecera del chat

narrativeRole: El corazón de la demo — prueba visible de que la IA hace el trabajo, no el usuario.
keyMessage: Hablas normal; la IA traduce eso en un reporte estructurado.

**Reproduce + el beat nuevo:** además del `cursor-ui-demo`, este frame estrena **EL RASTRO DE LUZ** — cuando la IA «entiende», un hilo luminoso navy viaja desde la burbuja del usuario, cruza hasta el panel RESUMEN, y **cada campo se enciende cuando el rastro lo alcanza**. Eso ES «la IA lo entendió», hecho imagen. Determinista (derivado del índice, nunca de `Math.random`).

Scene 1 (0.0–2.2s): la ventana en 3D (misma pose que el frame 3). El cursor se desliza hasta el input y hace clic — compresión + ripple (`cursor-click-ripple` + `press-release-spring`). El input toma foco con un **anillo navy con glow**.
Scene 2 (2.2–5.2s): al decir «con tus propias palabras, como se lo dirías a un compañero», el mensaje **se teclea en vivo** tras el caret; la cámara **sigue al caret en Z** (`camera-cursor-tracking`). El texto: `El computador de facturación no enciende desde esta mañana.` — palabras llanas, humanas. **Esa llaneza ES el argumento.**
Scene 3 (5.2–7.0s): el cursor pulsa enviar; el mensaje sube al hilo como burbuja navy (**cut-the-curve**, con motion blur). Bajo el avatar aparece el indicador de tres puntos (`svg-icon-enrichment`, **finito**).
Scene 4 (7.0–9.2s): **EL RASTRO.** Un hilo de luz navy **emana de la burbuja del usuario y arquea hasta la tarjeta RESUMEN**; al llegar, el campo «EL PROBLEMA · Descripción» **se enciende** y se resuelve de `Título pendiente…` a `Equipo no enciende — Facturación`, con **keyword glow** justo al cuajar (`asr-keyword-glow`). La cámara panea y **orbita levemente en 3D** hacia RESUMEN; el chat **se desenfoca** (`depth-of-field-blur`).
Scene 5 (9.2–12.011s): el rastro **se ramifica** y las filas restantes se completan en **cascada escalonada**, cada una **encendiéndose con un pulso de glow** cuando la luz la alcanza (`stat-bars-and-fills`). El panel se arma **a sí mismo**. Este es el pago del video. Cierra quieto.

## Frame 5 — Caso radicado

- scene: El botón se enciende en navy, y una tarjeta de confirmación florece desde la profundidad con el número del caso.
- voiceover: "Y cuando terminan, tu caso queda radicado automáticamente. Con su número, y con seguimiento. Nada se pierde: puedes consultarlo cuando quieras."
- duration: 8.341s
- transition_in: crossfade
- status: animated
- src: compositions/frames/05-caso-radicado.html
- type: benefit_highlight
- persuasion: Risk reversal (queda con número y trazabilidad)
- beat: peace of mind
- blueprint: titlecard-reveal (Adapt)
- sfx: click-soft, chime
- asset_candidates:

narrativeRole: Respiro tras la demo y cierre del bucle de ansiedad: el reporte no se pierde en una llamada.
keyMessage: Tu reporte queda registrado y puedes seguirlo.

**Adapt:** *UN solo movimiento contenido + sostenido quieto*. **Es el respiro deliberado del video** — su quietud lee CONTRA la demo. El pago **florece**, no golpea.

Scene 1 (0.0–2.0s): el botón «Completa la conversación» pasa de gris deshabilitado a **navy sólido con un glow navy suave**, y el cursor aterriza **una** pulsación (`press-release-spring`). Es el **único elemento sólido del video**, gastado una vez.
Scene 2 (2.0–4.0s): **wipe-away-to-reveal** — la UI se retira y la tarjeta de confirmación **llega desde Z** con motion blur que resuelve; detrás, un **bloom radial se expande una vez**. El check **se autodibuja** (`svg-path-draw`) y remata con un **destello suave** al cerrar el trazo. `Caso radicado` a **~80px**, ink.
Scene 3 (4.0–5.6s): «Con su número» — el número `#2026-0847` cuaja debajo **a ~120px**, navy, con count-up (`counting-dynamic-scale`), numerales tabulares.
Scene 4 (5.6–7.0s): «y con seguimiento» — `tag-pill` «En seguimiento» (texto `positive` `#059669`) entra con pop suave.
Scene 5 (7.0–8.341s): «Nada se pierde: puedes consultarlo cuando quieras.» se asienta. Y entonces **TODO SE DETIENE**. Quietud completa. **Sin deriva, sin push.**

## Frame 6 — Sin llamadas. Sin filas.

- scene: Cuatro tarjetas se ensamblan desde la profundidad 3D en una rejilla 2×2.
- voiceover: "Sin llamadas. Sin filas. Sin repetir tres veces lo mismo. A cualquier hora, desde cualquier equipo del hospital. Reportar toma menos de un minuto."
- duration: 8.107s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/06-beneficios.html
- type: benefit_highlight
- persuasion: Value stacking
- beat: confidence
- blueprint: grid-card-assemble (Adapt)
- asset_candidates:

narrativeRole: Convierte la demo en las cuatro razones para cambiar de hábito.
keyMessage: Es más rápido y más cómodo que el canal viejo.

**Adapt:** la *cascada escalonada que se autoensambla*, ahora **llegando desde la profundidad 3D** en vez de aparecer en plano. Rejilla 2×2 (cuatro negaciones cortas leen mejor equilibradas que apiladas).

Scene 1 (0.0–1.9s): suelo con rejilla + bloom. Eyebrow `REPORTAR AHORA ES` (**~28px**, 600, versalitas tracked, `primary`). Al decir «Sin llamadas.», la PRIMERA tarjeta **llega desde Z profundo con perspectiva** y motion blur que resuelve (`spring-pop-entrance` en registro **suave**), a su ranura superior izquierda. Icono grande que **se autodibuja** (teléfono tachado). Texto en **h3 ~54px**.
Scene 2 (1.9–3.2s): «Sin filas.» — segunda tarjeta, superior derecha. **Escalonadas, nunca simultáneas.**
Scene 3 (3.2–4.8s): «Sin repetir tres veces lo mismo.» — tercera, inferior izquierda.
Scene 4 (4.8–6.5s): «A cualquier hora, desde cualquier equipo del hospital.» — cuarta, inferior derecha; reloj que se autodibuja y cuyas manecillas **barren** (`svg-icon-enrichment`, **finito**). Rejilla completa.
Scene 5 (6.5–8.107s): «Reportar toma menos de un minuto.» aterriza como línea de cierre (**~54px**, `primary`). La rejilla **SOSTIENE**. El zoom-out de segunda mitad sigue **prohibido**: quietud + *subtle jitter*.

Densidad: las tarjetas ocupan ~70% del lienzo. El numeral de papel tapiz («4») va **al 6% de alfa, DETRÁS de tarjetas opacas, sangrando fuera de cuadro** y parallaxeando — nunca por delante.

## Frame 7 — Reporta con Evarisbot

- scene: El logo del HUV se dibuja a sí mismo trazo a trazo; debajo, el nombre y la dirección del sistema.
- url_on_screen: helpdesk.huv.gov.co/reportar — dominio de producción. NUNCA la IP local 192.168.2.172:8002.
- voiceover: "Entra a Reporte Sistemas HUV, y cuéntale tu caso a Evarisbot. Es más rápido de lo que crees."
- duration: 5.781s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-cta.html
- type: cta
- persuasion: Rule of three (entra · cuenta · listo)
- beat: motivation + urgency-to-act
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/huv-h.png
- roles: huv-h.png = cutout (la marca héroe); Evaris.png = supporting (personaje al lado)
- sfx:
- asset_candidates: assets/huv-h.png — logo oficial HUV, lockup horizontal; assets/Evaris.png — mascota Evarisbot

narrativeRole: Cierra con la marca institucional y la única acción que el trabajador debe recordar.
keyMessage: Entra a Reporte Sistemas HUV y háblale a Evarisbot.

**Adapt — EL PLANO ESTRELLA:** el logo del HUV es **line-art puro**. Se revela con un **barrido de máscara de izquierda a derecha** (`clip-path` / `mask` tweened) sobre el PNG, de modo que **el edificio y el wordmark parecen dibujarse solos, trazo a trazo**. Es la firma `logo-assemble-lockup` instanciada sobre una imagen ráster — y es el momento de marca del video. El logo **jamás se recolorea, recorta ni redibuja**: solo se revela.

Scene 1 (0.0–1.3s): las cuatro tarjetas de beneficio **despejan hacia los cuatro bordes** (`center-outward-expansion` en sentido de salida). Al ser el frame final, aquí SÍ se permite salida real. El campo de luz permanece.
Scene 2 (1.3–3.0s): **el logo del HUV se DIBUJA SOLO** — un barrido de máscara izquierda→derecha lo revela progresivamente (edificio primero, luego el wordmark), asentándose a **~50% de ancho**. Debajo, `Reporte Sistemas HUV` compone por **per-word staggered reveal** (`dynamic-content-sequencing`) a **~72px**, ink. Enseguida la dirección `helpdesk.huv.gov.co/reportar` aterriza como `tag-pill` (**~32px**, `accent-light` / `primary`). **La dirección de producción — jamás la IP.**
Scene 3 (3.0–4.5s): la mascota (`assets/Evaris.png`, recorte circular) se desliza junto al lockup; un **bloom radial se expande una vez** detrás (`ambient-glow-bloom`, finito) y reposa.
Scene 4 (4.5–5.781s): `Es más rápido de lo que crees.` se asienta. **Sostenido final — quietud completa.** El frame lee como un afiche: marca, nombre, dirección, personaje.
