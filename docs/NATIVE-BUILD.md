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

No hace falta cuenta de Expo, ni EAS, ni Play Store: el build corre entero en
el runner de GitHub.

**La firma.** Un release (tag `android-v*`) se firma con la clave privada de
Sliabh, guardada en dos secretos del repo: `ANDROID_KEYSTORE_BASE64` (el
keystore en base64) y `ANDROID_KEYSTORE_PASSWORD`, con alias `sliabh`. Sin
esos secretos el release **no se construye**: la clave de la plantilla de Expo
es pública, y cualquiera podría firmar con ella un APK que Android aceptaría
como actualización de Sliabh. El workflow además comprueba que el APK salió
firmado con esa clave. Los builds de PR y de `sliabh-index` usan la clave de
la plantilla si no hay secretos: solo prueban que compila.

Guardá el keystore y su contraseña fuera de GitHub también (un gestor de
contraseñas o Drive privado). **Si se pierden, ningún APK nuevo se va a poder
instalar encima del anterior** y todos van a tener que desinstalar y volver a
instalar. Es la misma clave que va a necesitar Play Store.

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

## iPhone

La app de iPhone es **el mismo código** que la de Android: las mismas
pantallas, el mismo archivo de sesión en disco, la misma cola de subida y la
misma sincronización. Lo único que cambia es cómo el sistema deja grabar con
la pantalla bloqueada.

| | Android | iPhone |
| --- | --- | --- |
| Qué mantiene vivo el GPS | foreground service + notificación | modo de fondo `location` + barra azul arriba |
| Permiso necesario | "Mientras se usa la app" alcanza | **"Siempre"** |
| Si el permiso no alcanza | — | graba igual, con la pantalla encendida (la app la mantiene prendida) y avisa cómo pasar a "Siempre" |
| Instalación | APK directo, sin cuenta | TestFlight o App Store: **requiere Apple Developer Program** |

### El permiso "Siempre"

iOS no tiene foreground service: lo único que deja a una app leer el GPS con
el iPhone bloqueado es el permiso de ubicación **"Siempre"** más el modo de
fondo `location` (`app.json` → plugin `expo-location` →
`isIosBackgroundLocationEnabled`). `expo-location` se niega a arrancar la
grabación en segundo plano sin ese permiso.

La app lo pide en dos pasos, con los diálogos del sistema: primero "Mientras
se usa la app" y enseguida "Cambiar a Permitir siempre". Si el caminante dice
que no, **la caminata no se pierde**: `HikeMode` graba desde la pantalla, la
mantiene prendida (`expo-keep-awake`) y muestra un aviso con un botón que abre
Ajustes → Sliabh → Ubicación.

### Comprobar que compila (sin cuenta, desde GitHub)

**Actions → iOS app → Run workflow.** En una Mac de GitHub se genera `ios/`
desde `app.json`, se instalan los pods y la app se compila completa para el
simulador. También corre solo en cada PR que toca algo nativo. El workflow
falla si desaparecen el modo de fondo `location` o los textos de permiso del
`Info.plist`. El `Sliabh.app` resultante queda adjunto a la corrida y se abre
en el simulador de Xcode.

### Ponerla en un iPhone de verdad

Apple no deja instalar apps fuera de la App Store o TestFlight sin firmarlas,
y para firmar hace falta una cuenta del **Apple Developer Program (USD 99 por
año)**, a nombre tuyo o de una empresa. Con la cuenta:

```bash
npm install -g eas-cli
eas login
# TestFlight: la forma de probarla en tu iPhone y en los de amigos
eas build -p ios --profile production    # EAS crea los certificados solo
eas submit -p ios                        # la sube a App Store Connect
```

En App Store Connect, la build aparece en TestFlight en unos minutos. Los
testers instalan la app TestFlight y abren el link de invitación. Para la
App Store pública, desde la misma build se completa la ficha y se manda a
revisión.

En la ficha de revisión de Apple, explicá el uso de la ubicación en segundo
plano: *"Graba el recorrido de una caminata de montaña mientras el teléfono
está bloqueado en el bolsillo. La grabación la inicia y la detiene el usuario,
y solo corre durante la caminata."* Apple rechaza las apps que piden "Siempre"
sin una razón visible para el usuario.

Para instalar sin TestFlight en iPhones puntuales (ad-hoc), registrá cada uno
con `eas device:create` y usá `eas build -p ios --profile preview`.

### Probarla en el cerro

Mismo protocolo que en Android, con dos diferencias:

1. Cuando pida ubicación, elegí **"Permitir mientras se usa la app"** y en el
   segundo diálogo **"Cambiar a Permitir siempre"**.
2. Mientras graba, arriba a la izquierda tiene que aparecer la **barra azul**
   de ubicación. Si no está, no está grabando en segundo plano.
