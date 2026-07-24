# Plantillas de email de Sliabh (bilingües ES/EN)

Estas plantillas cubren todo el ciclo de la cuenta. Son **bilingües**: primero el
mensaje en español y debajo el mismo en inglés, en un solo correo.

> ⚠️ Para poder **editar las plantillas de Supabase** y que se envíen de forma
> confiable, hay que configurar **SMTP propio** (por ejemplo Resend). El email por
> defecto de Supabase no permite editar los textos y está limitado a pocos correos
> por hora. Ver la sección "Configuración" abajo.

## Qué es cada archivo

| Archivo | Para qué | Dónde se usa |
|---|---|---|
| `confirm-signup.html` | Código de verificación al **crear cuenta** (opt-in / bienvenida) | Supabase → Authentication → Emails → **Confirm sign up** |
| `reset-password.html` | Código de 6 dígitos para **recuperar contraseña** | Supabase → Authentication → Emails → **Reset password** |
| `welcome.html` | Email de **bienvenida** tras verificar (opcional, refuerzo) | Enviado por Edge Function / webhook al confirmarse la cuenta |
| `goodbye.html` | Email de **despedida** ("te vamos a extrañar") al darse de baja | Enviado por Edge Function al opt-out / borrado de cuenta |

## Variables de plantilla (Supabase)

Las plantillas de `confirm-signup.html` y `reset-password.html` usan el token de
Supabase para el **código de 6 dígitos**:

- `{{ .Token }}` → el código de 6 dígitos (ESTO es lo que hace que sea por código y
  no por link).
- `{{ .Email }}` → correo del destinatario.

`welcome.html` y `goodbye.html` no son de Supabase: las envía una función propia,
así que las variables (nombre, etc.) se reemplazan desde ahí.

## Configuración (una sola vez)

1. **Crear proveedor de email** (recomendado: [Resend](https://resend.com), gratis
   hasta 3.000/mes). Verificar el dominio de envío.
2. **Supabase → Project Settings → Authentication → SMTP Settings** → activar
   "Custom SMTP" y pegar los datos del proveedor.
3. **Supabase → Authentication → Emails → Templates** → pegar el contenido de
   `confirm-signup.html` en "Confirm sign up" y `reset-password.html` en
   "Reset password".
4. **Authentication → Providers → Email** → asegurarse de que "Confirm email" esté
   **activado** (así se pide el código al registrarse).
5. (Opcional) Desplegar la Edge Function de `welcome`/`goodbye` para los correos de
   bienvenida y despedida.
6. Desplegar `supabase/functions/delete-account` y setear el secret
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → `service_role`) — la
   necesita para poder borrar la cuenta con `auth.admin.deleteUser`. Sin esto,
   el botón "Eliminar cuenta" del header web falla. El botón ya está
   conectado: envía el goodbye y borra la cuenta (cascadea a perfil, aportes,
   reportes y caminatas).
