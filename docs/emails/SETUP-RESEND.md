# Configurar Resend + emails de Sliabh (paso a paso)

Todo lo del código ya está listo. Estos pasos son los que van **fuera del código**
(cuenta de Resend + panel de Supabase). Una sola vez.

## 1. Crear la cuenta de Resend

1. Entrá a **https://resend.com** y registrate (gratis, 3.000 emails/mes).
2. En el panel, andá a **Domains → Add Domain** y agregá tu dominio de envío
   (por ejemplo `sliabh.app`). Seguí las instrucciones para agregar los registros
   DNS (SPF/DKIM) en tu proveedor de dominio.
   - ¿No tenés dominio propio todavía? Podés empezar probando con el remitente de
     prueba `onboarding@resend.dev`, pero solo llega a tu propio correo. Para
     usuarios reales necesitás dominio verificado.
3. Andá a **API Keys → Create API Key**, copiá la clave (empieza con `re_...`).
   **Guardala; no la compartas por chat abierto.**

## 2. Conectar Resend como SMTP en Supabase (para los códigos)

Esto hace que los emails de **código de verificación** y **recuperar contraseña**
salgan por Resend y se puedan editar.

1. Supabase → **Project Settings → Authentication → SMTP Settings**.
2. Activá **Enable Custom SMTP** y completá con los datos de Resend:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: tu **API key** (`re_...`)
   - Sender email: tu remitente verificado (ej. `hola@sliabh.app`)
   - Sender name: `Sliabh`
3. Guardá.

## 3. Pegar las plantillas bilingües

Supabase → **Authentication → Emails → Templates**:

- **Confirm sign up** → pegá el contenido de `confirm-signup.html`.
- **Reset password** → pegá el contenido de `reset-password.html`.

Y en **Authentication → Providers → Email**: dejá **Confirm email = ON** (así se
pide el código al registrarse).

## 4. Emails de bienvenida y despedida (Edge Function)

La función ya está escrita en `supabase/functions/send-account-email/`. Para
activarla:

1. Cargá los secretos (desde tu compu con la CLI de Supabase, o en el panel
   **Edge Functions → Secrets**):
   ```
   supabase secrets set RESEND_API_KEY=re_tu_clave
   supabase secrets set EMAIL_FROM="Sliabh <hola@sliabh.app>"
   ```
2. Desplegá la función:
   ```
   supabase functions deploy send-account-email
   ```
   (O decime cuando tengas la API key y la despliego yo por vos.)

- La **bienvenida** se dispara sola desde la app al verificar el código.
- La **despedida** se dispara cuando el usuario elimina su cuenta (requiere el
  botón de "eliminar cuenta" — ver nota del equipo).

## 5. Probar

1. Registrate con un email nuevo → debería llegar el **código** (revisá spam la
   primera vez).
2. Ingresá el código → entrás a la app y llega el **email de bienvenida**.
