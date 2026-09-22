# El build nativo — grabar desde el bolsillo, como Google Fit

Esto existe por una razón concreta: **ningún navegador permite grabar GPS con
la pantalla bloqueada.** Ni Chrome, ni Safari, ni Firefox, ni Samsung Internet,
en ningún teléfono. No es una limitación de Sliabh ni una API que falte
implementar — es el modelo de seguridad de la web, y es igual para Strava,
Komoot o cualquier otra web app.

Google Fit puede porque **no es una web**: es una app nativa que corre un
*foreground service*. Esa notificación permanente que ves mientras camina es,
literalmente, lo que le compra al proceso el derecho a seguir leyendo el GPS
con la pantalla apagada. La web no tiene equivalente.

Ese servicio ya está escrito en este repo (`src/services/backgroundTrack.ts`).
Lo único que falta es empaquetarlo. Este documento es cómo.

## Lo que cambia

| | PWA (hoy, sliabh online) | Build nativo |
| --- | --- | --- |
| Pantalla encendida, app adelante | graba | graba |
| Pantalla bloqueada | **puede cortarse** | **graba** |
| Escuchando música | **puede cortarse** | **graba** |
| Otra app adelante (WhatsApp, cámara) | **puede cortarse** | **graba** |
| Instalación | entrar a la web | instalar un APK o bajarla de Play |
| Actualizaciones | inmediatas, al recargar | nuevo build, o OTA con `expo-updates` |

El resto del producto es el mismo código: la sesión en disco, la cola de
subida, la sincronización entre dispositivos y compartir no se tocan. El
servicio nativo escribe en **el mismo archivo** que ya usa la PWA.

## Qué hace falta de tu lado

1. **Una cuenta Expo** (gratis para empezar): https://expo.dev/signup
2. Nada más para el APK de prueba. Google firma con una clave que EAS genera y
   guarda; no hay que comprar ni configurar nada.
3. Sólo si después querés publicar en Play Store: cuenta de Google Play
   Developer, pago único de USD 25.

## Los comandos

```bash
npm i -g eas-cli
eas login
eas build:configure          # enlaza el repo con tu cuenta (crea el projectId)
eas build -p android --profile preview
```

El build corre en los servidores de Expo (~15–25 min) y termina en una URL con
el `.apk`. Se abre esa URL desde el teléfono, se instala y listo.

## La prueba que hay que hacer sí o sí

El código nativo **nunca se ejecutó en un teléfono real**. Acá no hay
emulador, así que estos cuatro puntos son verificación de campo, no míos:

- [ ] Al iniciar la caminata, Android pide ubicación. Elegir **"Permitir
      siempre"** (si se elige "Sólo mientras se usa la app", la pantalla lo
      avisa en vez de fallar callada).
- [ ] Aparece la notificación permanente **"Sliabh — grabando"**.
- [ ] Bloquear la pantalla, caminar 5 minutos, desbloquear: **la línea siguió**
      y no hay aviso de minutos perdidos.
- [ ] Poner música, caminar, volver a la app: **sigue grabando y la música no
      se cortó**.

Si alguno falla, el que importa es el primero: nueve de cada diez veces es el
permiso en "Sólo mientras se usa la app".

## Lo que ya está hecho en el repo

- `src/services/backgroundTrack.ts` — la tarea de `expo-task-manager` y el
  arranque del foreground service.
- `app.json` — `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`,
  `FOREGROUND_SERVICE_LOCATION`, `WAKE_LOCK`, y el plugin de `expo-location`
  con los textos de permiso en castellano.
- `eas.json` — los tres perfiles (`preview` para el APK de prueba,
  `development`, `production` para Play).
- `src/services/backgroundCapability.ts` — el build nativo se declara
  `guaranteed`, y por eso la pantalla de caminata dice "podés guardar el
  teléfono" en vez del aviso del navegador.

## Mientras tanto, en la PWA

La web no se queda sin nada: cada navegador recibe **su** máximo y **su**
instrucción, medido en el dispositivo y no supuesto por el nombre del
navegador. Está en `src/services/backgroundCapability.web.ts` y documentado en
[`OFFLINE.md`](./OFFLINE.md).
