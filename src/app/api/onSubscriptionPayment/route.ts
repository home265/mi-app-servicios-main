import { NextResponse, NextRequest } from 'next/server';

// Define la estructura esperada en el cuerpo de la petición.
interface RequestBody {
  cardId: string;
  plan: 'mensual' | 'trimestral' | 'semestral' | 'anual';
}

// Exportamos la función POST que manejará las peticiones.
export async function POST(request: NextRequest) {
  try {
    // 1. Leer y validar el cuerpo de la petición.
    const body = (await request.json()) as RequestBody;
    const { cardId, plan } = body;

    if (
      !cardId ||
      typeof cardId !== 'string' ||
      !['mensual', 'trimestral', 'semestral', 'anual'].includes(plan)
    ) {
      return NextResponse.json(
        { error: 'Los campos "cardId" (string) y "plan" (mensual|trimestral|semestral|anual) son requeridos.' },
        { status: 400 }
      );
    }

    // 2. Obtener la URL de la Cloud Function desde las variables de entorno.
    const functionUrl = process.env.ON_SUBSCRIPTION_PAYMENT_FUNCTION_URL;

    if (!functionUrl) {
      console.error('La variable de entorno ON_SUBSCRIPTION_PAYMENT_FUNCTION_URL no está configurada.');
      throw new Error('Error de configuración del servidor.');
    }

    // 3. Llamar a la Cloud Function como un proxy.
    const functionResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardId, plan }),
    });

    // 4. Devolver la respuesta de la Cloud Function al cliente.
    const responseData = await functionResponse.json();
    
    // Si la función de Firebase devolvió un error, lo reenviamos.
    if (!functionResponse.ok) {
        return NextResponse.json(responseData, { status: functionResponse.status });
    }

    // Si todo fue exitoso, reenviamos la respuesta de éxito.
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