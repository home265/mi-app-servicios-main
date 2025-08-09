import { NextResponse, NextRequest } from 'next/server';

// --- 1. CORRECCIÓN: La interfaz ahora espera 'campaignId' ---
interface RequestBody {
  cardId: string;
  campaignId: 'mensual' | 'trimestral' | 'semestral' | 'anual';
}

// Exportamos la función POST que manejará las peticiones.
export async function POST(request: NextRequest) {
  try {
    // 2. Leer y validar el cuerpo de la petición.
    const body = (await request.json()) as RequestBody;
    // --- 3. CORRECCIÓN: Se lee 'campaignId' en lugar de 'plan' ---
    const { cardId, campaignId } = body;

    if (
      !cardId ||
      typeof cardId !== 'string' ||
      !['mensual', 'trimestral', 'semestral', 'anual'].includes(campaignId)
    ) {
      return NextResponse.json(
        { error: 'Los campos "cardId" (string) y "campaignId" (mensual|trimestral|semestral|anual) son requeridos.' },
        { status: 400 }
      );
    }

    // 4. Obtener la URL de la Cloud Function desde las variables de entorno.
    const functionUrl = process.env.ON_SUBSCRIPTION_PAYMENT_FUNCTION_URL;

    if (!functionUrl) {
      console.error('La variable de entorno ON_SUBSCRIPTION_PAYMENT_FUNCTION_URL no está configurada.');
      throw new Error('Error de configuración del servidor.');
    }

    // 5. Llamar a la Cloud Function como un proxy.
    const functionResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // --- 6. CORRECCIÓN: Se envía 'campaignId' al backend final ---
      body: JSON.stringify({ cardId, campaignId }),
    });

    // 7. Devolver la respuesta de la Cloud Function al cliente.
    const responseData = await functionResponse.json();
    
    if (!functionResponse.ok) {
        return NextResponse.json(responseData, { status: functionResponse.status });
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (err) {
    const error = err as Error;
    console.error('Error en el proxy de onSubscriptionPayment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la suscripción.' },
      { status: 500 }
    );
  }
}