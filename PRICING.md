| Features                  | Starter                | Growth                 | Scale                  |
| :------------------------ | :--------------------- | :--------------------- | :--------------------- |
| **Precio Mensual**        | **$49**                | **$99**                | **$349**               |
| **Transaction Fee**       | **5%** (+ Stripe fees) | **2%** (+ Stripe fees) | **0%** (+ Stripe fees) |
| **Usuarios / Alumnos**    | **Ilimitados**         | **Ilimitados**         | **Ilimitados**         |
| **Cursos**                | Ilimitados             | Ilimitados             | Ilimitados             |
| **Generación con IA**     | Estándar               | **Ilimitada** ⚡       | **Ilimitada** ⚡       |
| **Almacenamiento**        | 15 GB                  | 100 GB                 | **2 TB**               |
| **Dominio Personalizado** | Incluido               | Incluido               | Incluido               |

Arquitectura de Pagos (High-Level Overview)
Para implementar esto correctamente usando Stripe Connect, necesitas separar dos flujos de dinero distintos: el pago del Tenant hacia ti (SaaS) y el pago del alumno al Tenant (Ventas).

Aquí te explico cómo funciona la "fontanería" financiera:

1. La Cuenta "Padre" (Platform Account)
   Esta es tu cuenta de Stripe de Learnbase LLC. Aquí es donde llega el dinero de las suscripciones mensuales ($49, $99, $349) y donde "caen" las comisiones que le cobras a los tenants.

2. El Flujo de Suscripción (SaaS Billing)
   Cuando un Tenant se registra en Learnbase:

Creas un Customer en tu cuenta Stripe Padre.

Usas Stripe Billing para suscribirlo a un Product (Starter, Growth o Scale).

Resultado: El Tenant paga $49/mes. Ese dinero va 100% a tu cuenta (menos el fee de procesamiento de Stripe).

3. El Flujo de Ventas (Stripe Connect - Direct Charges)
   Este es el flujo crítico. Cuando un Tenant configura su academia, debe hacer el "Onboarding" de Stripe Connect (rellenar sus datos bancarios). Al hacer una venta de un curso, recomendamos usar Direct Charges. Esto significa que el Tenant es el "Merchant of Record" (el responsable legal de la venta), lo cual te protege a ti de devoluciones (chargebacks) por cursos malos.

Ejemplo de una transacción en Plan Starter ($49/mes + 5% comisión):

Un alumno compra un curso de $100 USD.

El Frontend (React): Envía la orden al backend.

El Backend (Elysia):

Identifica que el Tenant está en plan Starter.

Calcula tu comisión: $100 \* 0.05 = $5.00.

Crea un PaymentIntent en Stripe indicando:

amount: 10000 (100.00 USD)

currency: usd

stripe_account: {ID_DEL_TENANT} (Para que el dinero vaya a él)

application_fee_amount: 500 (Los $5.00 USD que son para ti)

La Distribución (Automática por Stripe):

Stripe: Se cobra su fee de procesamiento (ej. $2.90 + $0.30) del total.

Learnbase: Recibes tus $5.00 limpios en tu cuenta Padre.

Tenant: Recibe el resto ($100 - $3.20 (Stripe) - $5.00 (Tú) = $91.80).

4. Lógica de Cambio de Plan (Upgrade)
   El backend debe ser la fuente de la verdad.

Si el Tenant sube a Scale ($349):

Stripe Billing actualiza su suscripción mensual.

Tu base de datos actualiza el campo commission_rate de ese tenant a 0.

La próxima vez que venda un curso, el application_fee_amount que envíes a Stripe será 0.
