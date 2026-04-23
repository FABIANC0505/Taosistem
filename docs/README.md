# Documentacion de Migracion y Trabajo

Este directorio centraliza la documentacion nueva del proyecto mientras se completa la migracion hacia Next.js.

## Objetivo

- Entender el estado real del sistema antes de cambiar codigo.
- Documentar cada cambio realizado y para que sirve.
- Priorizar correcciones que permitan que el sistema funcione de forma estable.
- Dejar una base clara para aprendizaje, mantenimiento y futuras decisiones tecnicas.

## Estructura

- `ANALISIS_SISTEMA.md`: analisis funcional y tecnico del proyecto, expectativas de stakeholder, riesgos y plan por fases.
- `cambios/`: un README por modificacion para explicar que se hizo, por que se hizo y que impacto tiene.

## Forma de trabajo acordada

1. Analizar el sistema actual.
2. Detectar bloqueos funcionales y tecnicos.
3. Hacer cambios pequenos y verificables.
4. Registrar cada modificacion en `docs/cambios/`.
5. Volver a validar el sistema despues de cada ajuste importante.

## Estado actual resumido

Hoy el repositorio tiene tres frentes:

- `backend/`: API en Python/FastAPI.
- `frontend/`: frontend anterior en React/Vite.
- `taosistem/`: nueva migracion a Next.js.

La migracion a Next.js existe, pero todavia no reemplaza completamente al sistema anterior y actualmente presenta errores de compilacion y configuracion.
