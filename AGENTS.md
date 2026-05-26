## Important rules

* Build modular first. No code files longer than 300 lines of code! Documentation, plans etc. can be as long as needed, but code files must be modular. 
* Think ahead! Do not write code that you know will need to be changed later without planning for that change now. So keep entrypoints stable and isolate logic into smaller modules from the start!
* Do not limit yourself due to the LOC limit! If a task requires more code, split it into multiple files/modules/functions
* Do not add default fallbacks during development phase. Is something fails, let it fail, so we can fix it!
* Do not leavy empty try-catch blocks anywhere!
* Do not reinvent the wheel! Use open source, self-hosted libraries when needed. Ask the user, and help them qualify their selection. 
* Design UI for the end-user, not for the schema! 

## Regla para agentes

Todo agente que trabaje en este repositorio debe mantener una memoria operativa en `MEMORY.md`.

Reglas:

- Si el archivo no existe, el agente debe crearlo.
- Cada tarea relevante debe dejar una entrada breve con fecha, autor/agente, archivos tocados y decisiones importantes.
- La memoria debe registrar solo informacion util para futuros agentes: cambios de arquitectura, reglas nuevas, hallazgos no obvios, riesgos y follow-ups.
- No usar `MEMORY.md` como log verboso de cada comando ejecutado.

## MEMORY.md

`MEMORY.md` es una bitacora simple para continuidad entre agentes. Formato sugerido:

```md
## YYYY-MM-DD

- Agente: nombre o identificador
- Tarea: que se hizo
- Archivos: rutas relevantes
- Notas: decisiones, riesgos o siguiente paso
```

## README AVAILABILITY.

Read @README if available.