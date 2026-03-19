# mi tracker personal

Una aplicación web personal construida en HTML puro, sin frameworks ni suscripciones. Diseñada para registrar la vida cotidiana en 5 minutos antes de dormir — flexible, ligera y completamente privada.

---

## filosofía del proyecto

Este tracker nació como alternativa al bullet journal en papel y a apps como Notion que se traban en teléfono. La idea central es:

- **Mínima fricción** — si estás cansada, solo registra lo que puedas. No todos los campos son obligatorios.
- **Datos propios** — todo se guarda en tu cuenta de GitHub, nadie más puede verlo.
- **Análisis con IA** — los datos estructurados permiten exportarlos y pedirle a una IA análisis de patrones, correlaciones y tendencias a lo largo del tiempo.
- **Sin internet obligatorio** — funciona offline con localStorage, y sincroniza automáticamente cuando hay conexión.
- **Cero botones de guardar** — el sistema detecta cada cambio y lo sube a GitHub solo, en segundo plano.

---

## estructura de archivos

```
mi_tracker/
├── index.html              ← dashboard principal (punto de entrada)
├── hoy.html                ← hábitos, rutinas, sueño y ejercicio
├── higiene.html            ← rutinas de higiene (mañana, noche, semanal, mensual)
├── alimentacion.html       ← dieta base + extras del día + macros
├── estudio.html            ← sesiones de estudio + pomodoro + cronómetro
├── registros.html          ← hábitos anuales (heatmap) + ajedrez
├── finanzas.html           ← presupuesto anual + movimientos + proyección
├── periodo.html            ← ciclo menstrual + fases + síntomas + calculadora
├── listas.html             ← listas flexibles (temas, tareas, películas, podcasts)
├── tracker.css             ← estilos responsive compartidos (tablet y desktop)
├── github-sync.js          ← sincronización automática con GitHub
├── historial.js            ← modal de historial reutilizable
├── alimentos.json          ← base de datos de 144 alimentos mexicanos con macros
└── README.md               ← este archivo
```

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
- Botones de exportar CSV y JSON — cargan primero desde GitHub para tener los datos más recientes de todos los dispositivos antes de generar el archivo
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

- Coca-Cola en distintos tamaños (355ml, 600ml, 1L, 2L), churritos y botanas
- Frutas y verduras mexicanas (tuna, guayaba, jícama, nopal, chiles...)
- Proteínas (atún, pollo, huevo, tripitas, sardinas, quesos)
- Comida mexicana (tacos, quesadillas, tamales, pozole, sopes, tortas, elote, esquite...)
- Hamburguesas (caseras y de cadenas: McDonald's, Burger King)
- Comida china (chow mein, arroz frito, pollo agridulce, wontons)
- Sushi (nigiris, rolls, sashimi, edamame, miso)
- Pan, cereales, lácteos y postres

Gráficas semanales de calorías y macronutrientes. **📋 historial** con filtros por rango calórico (en rango / bajo / exceso).

---

### `estudio.html` — sesiones de estudio

#### cronómetro de sesión
Registra el tiempo real de estudio:

- **▶ iniciar sesión** — registra la hora de inicio
- **⏸ pausar / ▶ reanudar** — acumula tiempo sin contar pausas
- **■ terminar sesión** — calcula duración y agrega automáticamente el segmento al timeline

#### pomodoro
Temporizador configurable (por defecto 25min trabajo / 5min descanso):

- Anillo SVG animado que se vacía con el tiempo — rojo en trabajo, verde en descanso
- 4 ciclos por serie con puntos indicadores de progreso
- Al terminar cada fase: beep de audio + notificación del navegador
- Botones: iniciar · pausar · reiniciar · saltar fase

#### registro manual
- Contexto: autodidacta (azul) / universidad (morado) / ambos
- Materia o libro
- Tipo de sesión combinable: lectura, notas, audiolibro, anki, clase, tareas
- Métricas: calidad, dificultad, concentración, interrupciones
- Slider de páginas (0–120)
- Línea de tiempo visual (6am–2am) con segmentos de color por contexto
- Observaciones

Gráfica del mes con 5 variables + estadísticas acumuladas. **📋 historial** con filtros por contexto (autodidacta / universidad).

---

### `registros.html` — hábitos anuales y ajedrez

#### hábitos anuales
Heatmap tipo GitHub para todo el año, un renglón por hábito. Botón "hoy" para marcar sin buscar el cuadrito. Para hábitos a eliminar (ej. Coca-Cola): ciclo de 3 estados — sin registrar / no lo hice ✓ / lo hice ✗.

#### ajedrez
- Resultado, color, modalidad
- Elo antes y después con cálculo automático de delta
- Apertura jugada
- Blunders, errores e imprecisiones
- Plataforma (Chess.com, Lichess, OTB)
- Campo PGN para notación algebraica completa
- Gráfica de progreso de Elo con meta en 1500

---

### `finanzas.html` — presupuesto

- **Resumen del mes** — ingresos, gastos, balance y ahorro acumulado
- **Presupuesto por categorías** — barras de alerta (verde / naranja / rojo) con montos mensual y anual
- **Proyección de ingresos** — semanas trabajadas → estimación del año completo
- **Registro de movimientos** — formulario rápido con tipo, descripción, monto, categoría y fecha. Filtros por mes, tipo y categoría
- **Gráficas** — ingresos vs gastos y distribución de macros financieros

---

### `periodo.html` — ciclo menstrual

#### estado actual del ciclo
Anillo SVG con cuatro arcos de colores (uno por fase) y punto animado indicando el día actual. Se configura con:

- Fecha del último período
- Duración del ciclo (21–45 días)
- Duración del período (2–10 días)
- Opción de forzar manualmente la fase percibida

Las cuatro fases y lo que las caracteriza:

| fase | días aprox | descripción |
|------|------------|-------------|
| menstrual | 1–5 | estrógeno y progesterona bajos, más fatiga |
| folicular | 6–13 | estrógeno sube, más energía y concentración |
| ovulación | 14–16 | pico de estrógeno y LH, energía máxima |
| lútea | 17–28 | progesterona sube, puede aparecer SPM |

#### registro del día
- 4 botones de fase percibida
- Selector de flujo: sin flujo / leve / moderado / abundante (solo en fase menstrual)
- 19 síntomas seleccionables: cólicos, dolor de cabeza, náuseas, sensibilidad en senos, fatiga, insomnio, antojos, acné, hinchazón abdominal, lumbalgia, irritabilidad, tristeza, ansiedad aumentada, libido alta, libido baja, manchado, coágulos, sudoración
- 5 métricas: energía, dolor, ánimo, hinchazón, ansiedad
- Notas libres

#### calculadora del ciclo
Predicciones automáticas:

- Próximo período con contador de días (alerta si está atrasado)
- Inicio de fase folicular
- Ventana fértil (inicio → fin)
- Día de ovulación estimado
- Inicio de fase lútea

#### calendario visual
Navega mes a mes con cada día coloreado según su fase calculada. Los días futuros se muestran tenues (predicción). Los días con registro tienen un punto indicador.

---

### `listas.html` — listas flexibles

Sistema de listas completamente personalizables:

- Crear, renombrar, reordenar y eliminar listas
- Entrada rápida con Enter desde la tarjeta o desde el modal de lista completa
- Edición inline de cualquier elemento (clic directo sobre el texto)
- Opción "sin acción por ahora" para tareas en espera

Listas por defecto: temas para investigar · tareas por hacer · películas · podcasts.

---

## sistema de sincronización automática

### cómo funciona

El archivo `github-sync.js` maneja toda la sincronización sin intervención manual. El flujo es:

```
abrir página
    ↓
fetch desde GitHub → reemplaza localStorage → recarga si hubo cambios remotos
    ↓
modificar cualquier dato
    ↓
localStorage inmediato (instantáneo, sin esperar red)
    ↓
800ms de inactividad
    ↓
push automático a GitHub en segundo plano
```

### indicador de estado

En la parte superior de cada página hay una barra con un punto de color:

| indicador | significado |
|-----------|-------------|
| 🟢 verde fijo | sincronizado · hora del último sync |
| 🟡 naranja parpadeando | pendiente · datos sin subir |
| ⚫ gris | sin conexión · usando datos locales |
| 🔵 azul parpadeando | sincronizando… |
| 🔴 rojo | error de sync |

### modo offline

Si no hay conexión los datos se guardan normalmente en localStorage y se marcan como pendientes. En cuanto se recupera la red, se suben automáticamente sin necesidad de hacer nada.

### entre dispositivos

Para usar el tracker en laptop y teléfono con los mismos datos simplemente abre la página — al cargar descarga automáticamente lo más reciente de GitHub. No hay que presionar ningún botón.

### deshacer

El botón **↩ deshacer** en la barra superior revierte al estado anterior al último guardado exitoso, tanto en localStorage como en GitHub.

---

## almacenamiento en GitHub

Cada sección guarda sus datos como archivos JSON dentro de la carpeta `data/` del repositorio:

```
data/
├── diary.json              ← registros diarios (ánimo, energía, frase)
├── tasks.json              ← pendientes del día
├── sleep.json              ← registros de sueño
├── exercise.json           ← sesiones de ejercicio
├── habits_config.json      ← configuración de hábitos
├── habits_data.json        ← registros de hábitos (fecha_nombre: bool)
├── routines.json           ← pasos de rutinas de trabajo
├── study.json              ← sesiones de estudio
├── food.json               ← extras del día (alimentos y macros)
├── food_diet.json          ← dieta base configurada
├── finance.json            ← movimientos financieros
├── finance_budget.json     ← presupuesto por categorías
├── finance_projection.json ← configuración de proyección
├── chess.json              ← partidas de ajedrez
├── annual_habits.json      ← hábitos anuales (heatmap)
├── period.json             ← registros del ciclo menstrual
├── period_config.json      ← configuración del ciclo
├── lists_config.json       ← configuración de listas
├── lists_data.json         ← contenido de las listas
└── cal_events.json         ← eventos del calendario
```

### privacidad

- El repositorio debe ser **privado** — nadie puede ver los datos sin acceso a tu cuenta
- La URL pública (`github.io`) muestra la app vacía, sin datos personales
- El token de GitHub se guarda solo en el localStorage de cada dispositivo y nunca sale de él

---

## configuración inicial

1. Abre `index.html` en el navegador
2. Toca **⚙ config**
3. Ingresa tu token de GitHub (`ghp_...`)
4. El repositorio ya está configurado como `vd159817/mi_tracker`
5. Guarda — desde ese momento la sincronización es automática

### cómo generar el token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Permisos necesarios: **repo** (acceso completo al repositorio)
4. Sin fecha de expiración o con la más larga disponible
5. Copiar y pegar en ⚙ config del tracker

---

## exportar para análisis con IA

Desde el dashboard (`index.html`) hay dos botones:

- **↓ exportar CSV** — descarga un archivo con todos los registros en formato tabular, ideal para pegar directamente en una conversación con una IA. Incluye secciones separadas para: diario, descanso, ejercicio, estudio, ajedrez, finanzas, hábitos anuales, alimentación y ciclo menstrual.
- **↓ exportar JSON** — archivo completo con toda la estructura, ideal para análisis más profundos.

Ambos botones cargan primero los datos más recientes desde GitHub antes de generar el archivo, para asegurar que incluyen registros de todos los dispositivos.

**Ejemplos de análisis posibles:**

- ¿En qué días de la semana tengo más energía?
- ¿Cuándo estudio mejor — por la mañana o por la noche?
- ¿Hay correlación entre mi calidad de sueño y mi concentración?
- ¿En qué fase del ciclo tengo más energía para ejercitarme?
- ¿Qué hábitos tienen mejor racha este mes?
- ¿En qué meses gasto más de mi presupuesto?
- ¿Cuánto he progresado en Elo de ajedrez este año?

---

## uso diario sugerido (5 min antes de dormir)

No es necesario llenar todo. Con solo esto ya tienes datos valiosos:

1. **index.html** — mueve los sliders de ánimo y energía, escribe una frase corta
2. **hoy.html** — marca los hábitos que hiciste hoy
3. Si hubo algo especial — una sesión de estudio, ejercicio, o un gasto — registrarlo en su página

El tracker está diseñado para los días cansados: si solo mueves los sliders y escribes una palabra, ya es un dato útil.

La sincronización es completamente automática — no hay que recordar guardar nada.

---

*Construido en HTML, CSS y JavaScript puro. Sin frameworks, sin suscripciones, sin anuncios.*
