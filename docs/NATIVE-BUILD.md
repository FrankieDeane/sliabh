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

**Nada.** Ni cuenta, ni tarjeta, ni instalar herramientas. El build sale de
GitHub, que ya tenés.

## Cómo se construye — desde GitHub, sin instalar nada

Andá a **Actions → Android APK → Run workflow**. Pones una nota (opcional) y
listo. A los ~20 minutos el APK queda colgado de esa corrida, en "Artifacts".

No hace falta cuenta de Expo, ni EAS, ni secretos, ni Play Store: el build
corre entero en el runner de GitHub. Se firma con el keystore que trae la
plantilla de Expo, que es **el mismo en cada build**, así que cada APK nuevo se
instala encima del anterior en vez de ser rechazado como si fuera otra app.

Ese keystore es público y está perfecto para un teléfono tuyo. **No** sirve
para Play Store: eso necesita un keystore privado propio, que es para lo que
está el perfil `production` de `eas.json`, más abajo.

### Para tener un link permanente

Un tag `android-v*` además publica un **Release** de GitHub con el APK
adjunto, que se puede abrir directo desde el teléfono sin pasar por Actions ni
descomprimir un zip:

```bash
git tag android-v1 && git push origin android-v1
```

### Para instalarlo en el teléfono

1. Abrí el link del APK desde el teléfono (Chrome → Descargas).
2. Tocalo. Android va a pedir permiso para "instalar apps desconocidas" — se
   lo das a Chrome una vez.
3. Se instala al lado de la PWA; son dos cosas distintas y pueden convivir.

### Si algún día querés publicar en Play Store

Ahí sí entra EAS, con `eas.json` ya configurado:

```bash
npm i -g eas-cli && eas login
eas build:configure
eas build -p android --profile production
```

Necesita una cuenta Expo (gratis) y la cuenta de Google Play Developer (pago
único de USD 25).

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
- `.github/workflows/android.yml` — el build completo desde GitHub, con un
  chequeo que falla si los permisos de background location o del foreground
  service desaparecen del manifest. Sin ese chequeo, perder la grabación con
  pantalla apagada sería un build verde.
- `eas.json` — los tres perfiles, para el día que vaya a Play Store.
- `assets/icon.png`, `adaptive-icon.png`, `splash.png` — no existían y el
  prebuild fallaba por eso; el logo queda centrado dentro de la zona segura
  para que Android no lo recorte con la máscara circular.
- `src/services/backgroundCapability.ts` — el build nativo se declara
  `guaranteed`, y por eso la pantalla de caminata dice "podés guardar el
  teléfono" en vez del aviso del navegador.

## Mientras tanto, en la PWA

La web no se queda sin nada: cada navegador recibe **su** máximo y **su**
instrucción, medido en el dispositivo y no supuesto por el nombre del
navegador. Está en `src/services/backgroundCapability.web.ts` y documentado en
[`OFFLINE.md`](./OFFLINE.md).
