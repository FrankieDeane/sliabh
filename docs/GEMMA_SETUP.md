# Configuración de Gemma (IA local) — Sliabh

La IA de Sliabh funciona **sin conexión** usando un modelo local servido por
[Ollama](https://ollama.com). En desarrollo usamos **Gemma** como base.

## A. Desarrollo local (ahora)

```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh        # Linux / macOS
# Windows: https://ollama.com/download

# 2. Verificar
ollama --version

# 3. Descargar el modelo (el código usa gemma3:4b por defecto)
ollama pull gemma3:4b        # ~3.3 GB — buen equilibrio offline
# Alternativa más ligera (8 GB RAM):
ollama pull gemma2:2b

# 4. Probar
ollama run gemma3:4b "¿Qué necesito para el Circuito W en Torres del Paine?"

# 5. Verificar el endpoint HTTP que usa la app
curl http://localhost:11434/api/tags
```

### Conexión desde la app

| Plataforma            | baseUrl                    |
|-----------------------|----------------------------|
| Web (navegador)       | `http://localhost:11434`   |
| Emulador Android      | `http://10.0.2.2:11434`    |
| Dispositivo físico    | `http://<IP-de-tu-PC>:11434` |

El modelo por defecto está en `src/ai/OllamaProvider.ts` (`DEFAULT_MODEL = 'gemma3:4b'`).
La URL se puede cambiar vía el store de ajustes (`ollamaUrl`).

> **CORS (web):** si el navegador bloquea las peticiones, arranca Ollama con
> `OLLAMA_ORIGINS=* ollama serve`.

## B. Integración móvil on-device (después)

Gemma de mayor tamaño es demasiado pesada para el primer release on-device.
Plan de migración, manteniendo Gemma como línea base de desarrollo:

- **Opción 1 — llama.cpp / GGUF** vía `llama.rn` (JSI, sin servidor).
  Usar `gemma-2b` o `gemma-3-4b` cuantizado a `q4_k_m`.
- **Opción 2 — LiteRT + MediaPipe Tasks** para Gemma 2B en Android/iOS.

`AIService` ya abstrae el proveedor: basta con llamar a `setAIProvider(...)`
con la implementación on-device cuando esté lista. `OllamaProvider` se mantiene
para desarrollo.
