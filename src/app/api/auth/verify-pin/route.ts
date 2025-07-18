import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { pin, hashedPin } = await request.json();

    if (!pin || !hashedPin) {
      return NextResponse.json({ error: 'Faltan datos para la verificación.' }, { status: 400 });
    }

    // Compara el PIN ingresado con el hash guardado de forma segura en el servidor.
    const isMatch = await bcrypt.compare(pin, hashedPin);

    // Devuelve si la comparación fue exitosa o no.
    return NextResponse.json({ isMatch: isMatch }, { status: 200 });

  } catch (error) {
    console.error("Error en API /api/auth/verify-pin:", error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor al verificar el PIN.' }, { status: 500 });
  }
}