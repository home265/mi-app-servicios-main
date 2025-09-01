// lib/services/mercadoPagoService.ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN!;
if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN');

const mp = new MercadoPagoConfig({ accessToken });

type CreatePrefArgs = {
  title: string;
  quantity: number;
  unit_price: number;             // ARS
  external_reference: string;     // ej: uid del usuario
  notification_url: string;
  back_urls?: { success: string; failure: string; pending: string };
  itemId?: string;                // opcional: si querés controlar el ID del item
  metadata?: Record<string, unknown>; // opcional: para adjuntar info (p.ej., perfil fiscal)
  payerEmail?: string;            // opcional: para precargar email del pagador
};

export async function createPreference({
  title,
  quantity,
  unit_price,
  external_reference,
  back_urls,
  notification_url,
  itemId,
  metadata,
  payerEmail,
}: CreatePrefArgs): Promise<string> {
  const pref = new Preference(mp);

  const res = await pref.create({
    body: {
      items: [
        {
          id: itemId ?? external_reference, // <-- REQUERIDO POR EL TIPO Items
          title,
          quantity,
          unit_price,
          currency_id: 'ARS',
        },
      ],
      external_reference,
      back_urls,
      auto_return: 'approved',
      notification_url,
      statement_descriptor: 'MI-APP',
      ...(metadata ? { metadata } : {}),
      ...(payerEmail ? { payer: { email: payerEmail } } : {}),
    },
  });

  if (typeof res.id !== 'string') {
    throw new Error('Mercado Pago respondió sin id de preferencia');
  }
  return res.id;
}

export async function getPayment(paymentId: string | number) {
  const payment = new Payment(mp);
  const res = await payment.get({ id: String(paymentId) });
  return res; // tipado por el SDK (PaymentResponse)
}
