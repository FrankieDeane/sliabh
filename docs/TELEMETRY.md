# Cuando algo se rompe, ¿cómo nos enteramos?

Hasta ahora: no nos enterábamos.

Los tres bugs de campo que más importaron —la grabación que se cortaba al
bloquear la pantalla, la que se cortaba con música, el recorrido que no
mostraba el mapa— los encontró **una persona**, caminando del escritorio al
baño y después yendo al club. Eso no escala, y en una montaña no hay nadie que
avise. Un usuario que abre la app, ve una pantalla en blanco y se va no deja
ningún rastro.

## Qué se registra

Un crash va a la tabla `app_errors` de Supabase, con lo mínimo que hace falta
para reproducirlo:

| Campo | Para qué |
| --- | --- |
| `kind` | `error`, `unhandled-rejection`, `render`, `manual` |
| `message`, `stack` | qué se rompió, y dónde |
| `route` | **sólo el pathname** — un query string puede llevar un token de compartir |
| `user_agent` | Chrome Android y Safari iPhone fallan distinto |
| `online` | si pasó sin señal, que es el caso que más cuesta reproducir |
| `user_id` | sólo si hay sesión; puede ser null |

No se guarda ningún nombre, mail ni coordenada. El `route` es el pathname
pelado justamente para que un recorrido compartido no termine en un log.

## Por qué una tabla y no Sentry

Porque el proyecto ya tiene base de datos, las filas nunca salen de ella, y no
hay que dar de alta ni pagar nada. Lo que **no** da es agrupación, alertas ni
seguimiento por release. Si el volumen alguna vez lo justifica, el cliente
escribe todo por una sola función (`reportError`) y se la puede apuntar a otro
lado sin tocar nada más.

## Las tres cosas que lo hacen distinto de tirar un SDK

**Encola sin conexión.** Un crash en un sendero sin señal es el que más vale
tener. Los reportes se escriben en el teléfono primero y suben cuando vuelve la
conexión — la misma forma que un recorrido grabado.

**Nunca interrumpe nada.** Todos los caminos se tragan sus propios errores. Un
reporter que falla mientras reporta convierte un bug en dos.

**Tiene tope y deduplica.** Un loop de render puede tirar cientos de
excepciones por segundo. Sin límite, el primer usuario real que lo pegue
escribiría un millón de filas. El mismo mensaje dentro de un minuto es el
mismo bug; la cola guarda 50 y tira los más viejos.

## Permisos

La tabla es **sólo de escritura** desde el cliente:

- Cualquiera puede reportar, **incluso sin sesión iniciada** — un crash en la
  pantalla de login es justo el que de otro modo no se reporta nunca.
- Nadie puede leer la tabla desde el cliente, ni su propia fila.
- Nadie puede reportar bajo el id de otro.

Verificado contra la base real, en una transacción abortada:

```
anon_can_read: 0      anon_insert_landed: 1      spoof_landed: 0
```

Las filas se ven desde el dashboard de Supabase o con el service role.

## Cómo mirarlo

```sql
-- Lo que más está fallando esta semana
select message, count(*) as veces, max(created_at) as ultima
from app_errors
where created_at > now() - interval '7 days'
group by message
order by veces desc
limit 20;

-- Los que pasaron sin señal, que son los más difíciles de reproducir
select created_at, route, user_agent, message
from app_errors
where online is false
order by created_at desc
limit 50;
```

## Lo que esto no cubre

- **No avisa solo.** Hay que mirar la tabla, o armar un cron. Si te importa
  enterarte rápido, ese es el siguiente paso.
- **Un crash nativo de Android** (no de JavaScript) mata el proceso antes de
  que se pueda escribir nada. Para eso hace falta un SDK nativo.
- **Los stacks del bundle web están minificados.** Para leerlos con nombres
  reales haría falta subir los source maps a algún lado.
