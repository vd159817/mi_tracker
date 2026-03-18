# mi tracker personal

Una aplicación web personal construida en HTML puro, sin frameworks ni suscripciones. Diseñada para registrar la vida cotidiana en 5 minutos antes de dormir — flexible, ligera y completamente privada.

---

## filosofía del proyecto

Este tracker nació como alternativa al bullet journal en papel y a apps como Notion que se traban en teléfono. La idea central es:

- **Mínima fricción** — si estás cansada, solo registra lo que puedas. No todos los campos son obligatorios.
- **Datos propios** — todo se guarda en tu cuenta de GitHub, nadie más puede verlo.
- **Análisis con IA** — los datos estructurados permiten exportarlos y pedirle a una IA análisis de patrones, correlaciones y tendencias a lo largo del tiempo.
- **Sin internet obligatorio** — funciona offline con localStorage, y sincroniza cuando hay conexión.

---

## estructura de archivos

```
mi_tracker/
├── index.html              ← dashboard principal (punto de entrada)
├── hoy.html                ← registro diario completo
├── higiene.html            ← rutinas de higiene (mañana, noche, semanal, mensual)
├── alimentacion.html       ← dieta base + extras del día + macros
├── estudio.html            ← sesiones de estudio con línea de tiempo visual
├── registros.html          ← hábitos anuales (heatmap) + ajedrez
├── finanzas.html           ← presupuesto anual + movimientos + proyección
├── planeacion.html         ← línea de la década + calendario anual + mallas
├── planeacion_anual.html   ← tabla mensual 2026 + progreso de objetivos anuales
├── malla_psic.html         ← malla curricular psicología UAS + calculadora promedio
├── malla_software.html     ← malla desarrollo de software (pendiente)
├── listas.html             ← listas flexibles (temas, tareas, películas, podcasts)
├── .gitignore              ← excluye datos personales del repo público
└── README.md               ← este archivo
```

---

## páginas y qué registran

### `index.html` — dashboard
- Fecha y día de la semana
- Sliders Likert de ánimo (depresión→enojo), energía (agotado→flujo) y reactividad
- Frase diaria / journaling con etiqueta
- Gráfica del último mes (ánimo + energía + reactividad)
- Contador de racha de días con frase escrita
- Pendientes del día con prioridad (urgente / importante / normal)
- Navegación a todas las secciones
- Botones de exportar CSV y JSON

### `hoy.html` — registro diario completo
- Checklist de hábitos del día (configurable, filtrado por día de semana, agrupado por categoría)
- Rutinas de trabajo (pasos editables en formato paso 1 › paso 2)
- Descanso: hora de dormir/despertar, horas totales, siesta, calidad, conciliación, despertares, sensación al despertar
- Sueños: tipo (pesadilla / estresante / normal / bueno) + texto libre
- Observaciones del descanso
- Ejercicio: semana del año, tren muscular, ejercicios con series/reps, disciplinas con tiempo, RIR, peso adicional, checks de técnica/comida/sueño
- Gráficas mensuales de descanso y ejercicio

### `higiene.html` — rutinas de higiene
- Tabs: mañana / noche / semanal / mensual / armario / historial
- Checklist dinámico con barra de progreso por tab
- Todo editable desde botón "editar" (secciones, pasos, prioridad)
- Historial de días completados

### `alimentacion.html` — nutrición
- Dieta base precargada (editable) con checklist diario
- Cálculo automático de calorías y macros al marcar alimentos
- Barras de progreso vs metas (1500 kcal, 80g prot, 188g carb, 50g grasa)
- Campo de extras del día (alimentos fuera de la dieta)
- Gráficas semanales de calorías y macronutrientes

### `estudio.html` — sesiones de estudio
- Contexto: autodidacta (azul) / universidad (morado) / ambos
- Campo de materia o libro
- Tipo de sesión: lectura, notas, audiolibro, anki, clase, tareas (combinables)
- Métricas Likert: calidad, dificultad, concentración, interrupciones
- Slider de páginas (0–120)
- Línea de tiempo visual (6am–2am) con segmentos de color por contexto
- Observaciones
- Gráfica profesional del mes con 5 variables + estadísticas acumuladas

### `registros.html` — hábitos y ajedrez
- **Hábitos anuales**: heatmap tipo GitHub para todo el año, un renglón por hábito. Botón "hoy" para marcar sin buscar el cuadrito. Para hábitos a eliminar (ej. Coca-Cola): ciclo de 3 estados (sin registrar / no lo hice ✓ / lo hice ✗)
- **Chess**: resultado, color, modalidad, elo antes/después, apertura, blunders/errores/imprecisiones, plataforma, campo PGN para notación algebraica. Gráfica de progreso de elo con meta en 1500.

### `finanzas.html` — presupuesto
- Resumen del mes: ingresos, gastos, balance, ahorro acumulado
- Presupuesto por categorías (mensual / anual) con barras de alerta
- Proyección de ingresos: semanas trabajadas → estimación del año completo
- Registro de movimientos con filtros
- Gráficas de ingresos vs gastos y distribución de macros financieros

### `planeacion.html` — planeación mayor
- Línea de tiempo de la década (2026–2036) con 5 carriles
- Ventanas emergentes con lista de diplomados planeados (psicología y software)
- Calendario anual navegable con eventos de colores personalizables
- Links a mallas curriculares

### `planeacion_anual.html` — tabla 2026
- Panel "lo que toca este mes" con barras de progreso del mes
- Tabla anual completa 12×12 (meses × categorías) editable
- Todas las tareas tachables al completarse
- Barras de progreso anuales para psicología, software, inglés y listas de lectura (A/B/C/D)
- Editor de páginas por libro (oculto detrás de botón)

### `malla_psic.html` — psicología UAS
- 43 materias organizadas por semestre (18 cursadas con calificaciones reales)
- Calculadora de promedio ponderado por créditos con 3 escenarios (A/B/C)
- Proyección de fecha de egreso desde el 6 de septiembre 2023
- Campos editables: calificación, horas, dificultad, fechas inicio/fin por materia

### `malla_software.html`
- Placeholder listo para cuando inicie la carrera

### `listas.html` — listas flexibles
- Listas colapsables: temas para investigar, tareas por hacer, películas, podcasts
- Entrada rápida con Enter desde cualquier lista
- Vista completa con opción de marcar tareas como "sin acción por ahora"
- Administrador de listas: crear, renombrar, reordenar, eliminar

---

## cómo funciona el almacenamiento

### localStorage
Todos los datos se guardan primero en el navegador local. Funciona sin internet.

### GitHub (sincronización)
Si configuras un token de GitHub (⚙ config), cada registro se sube automáticamente al repositorio como archivos JSON en la carpeta `data/`. Esto permite:
- Sincronización entre dispositivos (laptop, tablet, teléfono)
- Respaldo permanente de los datos
- Exportación para análisis

### Privacidad
- El repositorio es **privado** — nadie puede ver tus datos sin tu contraseña
- La URL pública (`github.io`) muestra la app vacía, sin ningún dato personal
- El token de GitHub nunca sale de tu dispositivo

---

## exportar para análisis con IA

Desde el dashboard (index.html) hay dos botones:

- **↓ exportar CSV** — archivo con todos los registros en formato tabular, ideal para pegar directamente en una conversación con una IA
- **↓ exportar JSON** — archivo completo con toda la estructura, ideal para análisis más profundos

El CSV incluye secciones separadas para: diario, descanso, ejercicio, estudio, ajedrez, finanzas y hábitos anuales.

**Ejemplos de análisis posibles:**
- ¿En qué días de la semana tengo más energía?
- ¿Cuándo estudio mejor — por la mañana o por la noche?
- ¿Hay correlación entre mi calidad de sueño y mi concentración?
- ¿En qué meses gasto más de mi presupuesto?
- ¿Cuánto he progresado en elo de ajedrez este año?
- ¿Qué hábitos tienen mejor racha?

---

## configuración inicial

1. Abre `index.html` en el navegador
2. Toca **⚙ config**
3. Ingresa tu token de GitHub (`ghp_...`)
4. El repositorio ya está configurado como `vd159817/mi_tracker`
5. Guarda — desde ese momento todo se sincroniza automáticamente

---

## uso diario sugerido (5 min antes de dormir)

No es necesario llenar todo. Con solo esto ya tienes datos valiosos:

1. **index.html** — mueve los sliders de ánimo y energía, escribe una frase corta, toca guardar
2. **hoy.html** — marca los hábitos que hiciste hoy con un toque
3. Si hubo algo especial — una sesión de estudio, ejercicio, o un gasto — registrarlo en su página

El tracker está diseñado para los días cansados: si solo mueves los sliders y escribes una palabra, ya es un dato útil.

---

*Construido en HTML, CSS y JavaScript puro. Sin frameworks, sin suscripciones, sin anuncios.*
