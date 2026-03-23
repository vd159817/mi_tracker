
---

# mi tracker personal

Una aplicación web personal construida en HTML puro, sin frameworks ni suscripciones. Diseñada para registrar la vida cotidiana en 5 minutos antes de dormir — flexible, ligera y completamente privada.

---

## filosofía del proyecto

Este tracker nació como alternativa al bullet journal en papel y a apps como Notion que se traban en teléfono. La idea central es:

- **Mínima fricción** — si estás cansada, solo registra lo que puedas. No todos los campos son obligatorios.
- **Datos propios** — todo se guarda localmente en tu dispositivo, nadie más puede verlo.
- **Análisis con IA** — los datos estructurados permiten exportarlos y pedirle a una IA análisis de patrones, correlaciones y tendencias a lo largo del tiempo.
- **Sin internet** — funciona completamente offline, no requiere conexión para nada.
- **Temas visuales** — 7 paletas de color aplicables desde el dashboard, con modo oscuro independiente en cada tema.
- **Tipografía ajustable** — botones A− y A+ en cada página para subir o bajar el tamaño de letra, con memoria entre sesiones.

---

## estructura de archivos

```
mi_tracker/
├── index.html              ← dashboard principal (punto de entrada)
├── hoy.html                ← hábitos, rutinas, sueño y ejercicio
├── higiene.html            ← rutinas de higiene (mañana, noche, semanal, mensual)
├── alimentacion.html       ← dieta base + extras del día + macros
├── estudio.html            ← sesiones de estudio + timer + cronómetro + pomodoro
├── registros.html          ← hábitos anuales (heatmap) + ajedrez
├── finanzas.html           ← presupuesto anual + movimientos + proyección
├── periodo.html            ← ciclo menstrual + fases + síntomas + calculadora
├── listas.html             ← listas flexibles (temas, tareas, películas, podcasts)
├── tracker.css             ← estilos responsive compartidos (tablet y desktop)
├── historial.js            ← modal de historial reutilizable
├── alimentos.json          ← base de datos de 144 alimentos mexicanos con macros
└── README.md               ← este archivo
```

---

## almacenamiento

Todos los datos se guardan en el `localStorage` del navegador del dispositivo. No hay servidor, no hay cuenta, no hay sincronización en la nube. Los datos viven en tu dispositivo y solo en él.

Esto significa:

- **Privacidad total** — ningún tercero puede acceder a tus datos
- **Sin internet** — funciona igual con o sin conexión
- **Por dispositivo** — los datos del teléfono y los de la laptop son independientes
- **Exportar es la copia de seguridad** — usa los botones de exportar CSV o JSON regularmente si quieres respaldar tus datos o moverlos a otro dispositivo

---

## páginas y qué registran

### `index.html` — dashboard

Punto de entrada diario. Registra el estado emocional y energético del día con tres sliders:

- **Ánimo** (depresión → enojo)
- **Energía** (agotado → flujo)
- **Reactividad** (calmada → reactiva)

También incluye:

- Frase diaria / journaling con etiqueta temática
- Gráfica del último mes con las tres variables
- Contador de racha de días con frase escrita
- Lista de pendientes del día con tres niveles de prioridad (urgente / importante / normal)
- Botón **◈ temas** — selector de paleta de color global (se aplica a todas las páginas)
- Botón **◐** — alternancia entre modo claro y oscuro
- Botones **A− / A+** — control del tamaño de letra, guardado entre sesiones
- Botones de exportar CSV y JSON
- Navegación a todas las secciones

---

### `hoy.html` — registro diario completo

La página más densa. Tiene cuatro secciones principales:

#### hábitos del día
Checklist configurable filtrado por día de la semana. Los hábitos se agrupan por categoría y solo aparecen los que aplican hoy (ej. un hábito configurado para "LMX" no aparece en fin de semana). Incluye:

- Barra de progreso del día
- Editor de hábitos: nombre, categoría, días de la semana
- **📋 historial de hábitos** — modal con tabla de calor estilo GitHub para los últimos 7 / 30 / 90 días o el año completo. Muestra porcentaje de cumplimiento por hábito, racha actual de días, mejor hábito del período y hábito con más margen de mejora. Los días que un hábito no aplica se muestran en gris.

#### rutinas de trabajo
Pasos editables en formato visual paso 1 › paso 2 › paso 3. Se pueden agregar, reordenar y eliminar pasos desde un editor integrado.

#### descanso y sueños
- Sliders de hora de dormir y hora de despertar (6am–2am del día siguiente)
- Cálculo automático de horas totales
- Siesta en minutos
- Métricas: calidad, conciliación, número de despertares, sensación al despertar
- Tipo de sueño: pesadilla / estresante / normal / bueno
- Campo de texto libre para describir el sueño
- Observaciones
- Gráfica mensual de horas y calidad
- **📋 historial de sueño** — tabla con filtros: buenas noches (≥7.5h y calidad alta) y malas noches (<6h o calidad baja)

#### ejercicio
- Número de semana del año
- Tren muscular: superior / inferior / full body / cardio
- Tabla de ejercicios con nombre, series y repeticiones
- Disciplinas con tiempo en minutos (cardio, yoga, etc.)
- RIR (reps in reserve)
- Peso corporal
- Checks rápidos: buena técnica, comió bien, durmió bien, usó peso adicional
- Observaciones
- Gráfica mensual
- **📋 historial de ejercicio** — tabla con filtros por tren muscular

---

### `higiene.html` — rutinas de higiene

Checklists organizados por frecuencia con seis tabs:

| tab | contenido |
|-----|-----------|
| mañana | rutina de mañana paso a paso |
| noche | rutina nocturna |
| semanal | tareas semanales (lavar ropa, limpiar espacio, etc.) |
| mensual | mantenimiento mensual |
| armario | inventario de ropa y cuidado de prendas |
| historial | registro de días completados por tab |

Cada tab tiene barra de progreso. Todo es editable: renombrar secciones, agregar pasos, cambiar prioridades y reordenar.

---

### `alimentacion.html` — nutrición

#### dieta base
Lista de alimentos habituales organizada por sección. Al marcar cada alimento se suman automáticamente sus macros:

- Barras de progreso vs metas: 1500 kcal · 80g proteína · 188g carbs · 50g grasa
- Resumen de macros en tiempo real
- Editor de dieta base: agregar, editar y eliminar alimentos con sus valores nutricionales

#### extras del día
Campo de búsqueda con **autocompletado** sobre una base de datos de 144 alimentos mexicanos. Al seleccionar un alimento se autollenan automáticamente las calorías y macros. La base de datos incluye:

- Coca-Cola en distintos tamaños, churritos y botanas
- Frutas y verduras mexicanas (tuna, guayaba, jícama, nopal, chiles...)
- Proteínas (atún, pollo, huevo, tripitas, sardinas, quesos)
- Comida mexicana (tacos, quesadillas, tamales, pozole, sopes, tortas, elote, esquite...)
- Hamburguesas caseras y de cadenas (McDonald's, Burger King)
- Comida china, sushi, pan, cereales, lácteos y postres

Gráficas semanales de calorías y macronutrientes. **📋 historial** con filtros por rango calórico (en rango / bajo / exceso).

---

### `estudio.html` — sesiones de estudio

#### herramientas de tiempo real

Las tres herramientas viven en su propia sección, separadas del contexto de estudio, y persisten aunque se cierre la app (el estado se guarda en localStorage con timestamps absolutos):

**⏱ cronómetro (stopwatch)**
- Registra tiempo real de estudio desde que se inicia hasta que se termina
- Selector de contexto: autodidacta / universidad
- Botones: iniciar · pausar/reanudar · terminar
- Al terminar agrega el segmento automáticamente a la línea de tiempo
- Notificación al iniciar (compatible con pantalla bloqueada en Android si se activa el permiso)

**⏰ timer (cuenta regresiva)**
- Configurable en horas, minutos y segundos
- Persiste aunque se cierre la app; al terminar suena un tono y envía notificación
- Botones: iniciar · pausar/reanudar · detener

**🍅 pomodoro**
- Configurable: minutos de trabajo y descanso (por defecto 25 / 5)
- Anillo SVG animado que se vacía con el tiempo
- 4 ciclos por serie con puntos indicadores de progreso
- Al terminar cada fase: tono de audio + notificación del navegador
- Agrega el bloque al timeline automáticamente al terminar
- Botones: iniciar · pausar · reiniciar · saltar fase

#### línea del tiempo — registro manual

Visualización de 6am a 2am con segmentos de color por contexto (azul = autodidacta, morado = universidad). Para agregar un segmento se seleccionan hora de inicio, hora de fin y contexto. Para borrar un segmento se mantiene presionado ~700ms (protección contra borrado accidental).

#### contexto de estudio — llenar al finalizar la sesión

Sección separada, bloqueada por defecto, que se desbloquea con el botón **✏ editar**. Se diseñó para llenarse al final porque una sesión puede incluir varias materias o contextos:

- Contexto: autodidacta / universidad (seleccionables ambos)
- Materia o libro — con **autocompletado** de materias ingresadas anteriormente
- Tipo de sesión combinable: lectura, notas, audiolibro, anki, clase, tareas
- Métricas: calidad, dificultad, concentración, interrupciones (escala baja / media / alta)
- Slider de páginas (0–120)
- Observaciones y notas de la sesión
- Botón **+ guardar sesión** — crea una entrada nueva sin sobrescribir las anteriores

Cada sesión guardada es independiente: se pueden registrar varias el mismo día. El formulario se limpia automáticamente tras guardar.

#### historial de sesiones
Colapsable. Muestra todas las sesiones con fecha, horas totales, contexto, tipos, materia, observaciones, métricas y rango horario. Cada entrada se puede eliminar individualmente.

#### estadísticas
- Horas: hoy / esta semana / este mes / total histórico
- Horas por materia o libro
- Desglose autodidacta vs universidad
- Franja horaria en la que más estudias
- Gráfica del mes con horas, calidad, dificultad y concentración

---

### `registros.html` — hábitos anuales y ajedrez

#### hábitos anuales
Heatmap tipo GitHub para todo el año, un renglón por hábito. Botón "hoy" para marcar sin buscar el cuadrito. Para hábitos a eliminar (ej. Coca-Cola): ciclo de 3 estados — sin registrar / no lo hice ✓ / lo hice ✗.

#### ajedrez
- Resultado, color, modalidad, apertura jugada
- Elo antes y después con cálculo automático de delta
- Blunders, errores e imprecisiones
- Plataforma (Chess.com, Lichess, OTB)
- Campo PGN para notación algebraica completa
- Gráfica de progreso de Elo con meta en 1500

---

### `finanzas.html` — presupuesto

- **Resumen del mes** — ingresos, gastos, balance y ahorro acumulado
- **Presupuesto por categorías** — barras de alerta (verde / naranja / rojo)
- **Proyección de ingresos** — semanas trabajadas → estimación del año completo
- **Registro de movimientos** — tipo, descripción, monto, categoría y fecha. Filtros por mes, tipo y categoría
- **Gráficas** — ingresos vs gastos y distribución por categoría

---

### `periodo.html` — ciclo menstrual

#### estado actual del ciclo
Anillo SVG con cuatro arcos de colores y punto animado en el día actual. Se configura con fecha del último período, duración del ciclo (21–45 días) y duración del período (2–10 días).

| fase | días aprox | descripción |
|------|------------|-------------|
| menstrual | 1–5 | estrógeno y progesterona bajos, más fatiga |
| folicular | 6–13 | estrógeno sube, más energía y concentración |
| ovulación | 14–16 | pico de estrógeno y LH, energía máxima |
| lútea | 17–28 | progesterona sube, puede aparecer SPM |

#### registro del día
- 4 botones de fase percibida
- Selector de flujo (solo en fase menstrual)
- 19 síntomas seleccionables
- 5 métricas: energía, dolor, ánimo, hinchazón, ansiedad
- Notas libres

#### calculadora y calendario
Predicciones de próximo período, ventana fértil, ovulación e inicio de cada fase. Calendario navegable mes a mes con días coloreados por fase.

---

### `listas.html` — listas flexibles

- Crear, renombrar, reordenar y eliminar listas
- Entrada rápida con Enter
- Edición inline de cualquier elemento
- Opción "sin acción por ahora" para tareas en espera

Listas por defecto: temas para investigar · tareas por hacer · películas · podcasts.

---

## personalización visual

### temas de color

Desde **◈ temas** en el dashboard se cambia la paleta de toda la app. Se guarda en localStorage y se aplica en todas las páginas al cargar.

| tema | descripción |
|------|-------------|
| Crema | cálido, por defecto |
| B & N | minimalista, sin color |
| Rosa | suave, femenino |
| Salvia | verde natural |
| Noche | azul elegante |
| Tierra | ocre otoñal |
| Lavanda | lila sereno |

Cada tema tiene variante oscura — **◐** alterna entre claro y oscuro dentro del tema activo.

### tipografía
- Principal: **IBM Plex Sans** — seria, formal, legible en pantallas pequeñas
- Acento: **Cormorant Garamond** en itálica — fechas, números grandes y títulos decorativos
- Tamaño ajustable con **A− / A+** (rango 12px–26px, guardado en localStorage)

---

## exportar datos

Desde el dashboard hay dos botones:

- **↓ exportar CSV** — todos los registros en formato tabular, ideal para pegar en una conversación con IA
- **↓ exportar JSON** — estructura completa, para análisis más profundos o para hacer un respaldo manual

**Ejemplos de análisis posibles con los datos exportados:**

- ¿En qué días de la semana tengo más energía?
- ¿Cuándo estudio mejor — mañana o noche?
- ¿Hay correlación entre mi calidad de sueño y mi concentración?
- ¿En qué fase del ciclo tengo más energía para ejercitarme?
- ¿Qué hábitos tienen mejor racha este mes?
- ¿En qué meses gasto más?
- ¿Cuánto progresé en Elo este año?

---

## uso diario sugerido (5 min antes de dormir)

No es necesario llenar todo. Con solo esto ya tienes datos valiosos:

1. **index.html** — mueve los sliders de ánimo y energía, escribe una frase corta
2. **hoy.html** — marca los hábitos que hiciste hoy
3. Si hubo algo especial — estudio, ejercicio, un gasto — registrarlo en su página

El tracker está diseñado para los días cansados: si solo mueves los sliders y escribes una palabra, ya es un dato útil.

---

*Construido en HTML, CSS y JavaScript puro. Sin frameworks, sin suscripciones, sin anuncios.*