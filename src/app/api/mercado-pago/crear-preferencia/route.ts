import { NextRequest, NextResponse } from 'next/server';
import { PLANES } from '@/lib/constants/planes';
import { CAMPANAS } from '@/lib/constants/campanas';

type CreatePrefRequest = {
  planId: string;
  campaignId: string;
  creatorId: string;
  payerEmail?: string; // opcional: precargar email del pagador
};

type PreferenceResponse = {
  id: string;
};

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isCreatePrefRequest(x: unknown): x is CreatePrefRequest {
  if (!isObject(x)) return false;
  const hasBase =
    typeof x.planId === 'string' &&
    typeof x.campaignId === 'string' &&
    typeof x.creatorId === 'string';
  if (!hasBase) return false;
  if ('payerEmail' in x && typeof (x as { payerEmail?: unknown }).payerEmail !== 'string') {
    return false;
  }
  return true;
}

function isPreferenceResponse(x: unknown): x is PreferenceResponse {
  return isObject(x) && typeof x.id === 'string';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;

  if (!appUrl || !mpAccessToken) {
    return NextResponse.json(
      { error: 'Faltan variables de entorno requeridas.' },
      { status: 500 }
    );
  }

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body inválido: no es JSON.' },
      { status: 400 }
    );
  }

  if (!isCreatePrefRequest(bodyUnknown)) {
    return NextResponse.json(
      { error: 'Body inválido: faltan planId, campaignId o creatorId.' },
      { status: 400 }
    );
  }

  const { planId, campaignId, creatorId, payerEmail } = bodyUnknown;

  const plan = PLANES.find((p) => p.id === planId);
  const camp = CAMPANAS.find((c) => c.id === campaignId);

  if (!plan || !camp) {
    return NextResponse.json(
      { error: 'Plan o campaña inválidos.' },
      { status: 400 }
    );
  }

  const finalPrice = plan.priceARS * camp.months * (1 - camp.discount);

  // Incluye creatorId y campaignId para poder resolver campaña en el webhook
  const external_reference = `${creatorId}|${campaignId}`;

  const payload: Record<string, unknown> = {
    items: [
      {
        id: external_reference, // requerido por tipos del SDK/REST moderno
        title: `Plan ${plan.name} - ${camp.name}`,
        quantity: 1,
        unit_price: Number(finalPrice.toFixed(2)),
        currency_id: 'ARS',
      },
    ],
    external_reference,
    back_urls: {
      success: `${appUrl}/pagos/retorno?status=success`,
      failure: `${appUrl}/pagos/retorno?status=failure`,
      pending: `${appUrl}/pagos/retorno?status=pending`,
    },
    auto_return: 'approved' as const,
    notification_url: 'https://us-central1-mi-app-servicios-3326e.cloudfunctions.net/mercadoPagoWebhook',
    statement_descriptor: 'MI-APP',
    // NUEVO: metadata útil para conciliaciones
    metadata: { uid: creatorId, campaignId, planId },
  };

  // NUEVO: si hay payerEmail, lo enviamos
  if (payerEmail) {
    (payload as { payer: { email: string } }).payer = { email: payerEmail };
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!mpRes.ok) {
    const errorText = await mpRes.text();
    return NextResponse.json(
      { error: `MercadoPago error ${mpRes.status}: ${errorText}` },
      { status: 502 }
    );
  }

  const dataUnknown: unknown = await mpRes.json();
  if (!isPreferenceResponse(dataUnknown)) {
    return NextResponse.json(
      { error: 'Respuesta de MercadoPago inesperada (sin id).' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    id: dataUnknown.id,
    external_reference,
  });
}
