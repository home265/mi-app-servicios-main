import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { updateUserPin } from '@/lib/firebase/firestore'; // Reutilizamos tu función existente de Firestore.

export async function POST(request: Request) {
  try {
    const { uid, rol, newPin } = await request.json();

    if (!uid || !rol || !newPin) {
      return NextResponse.json({ error: 'Faltan datos para actualizar el PIN.' }, { status: 400 });
    }

    // 1. Hashear el nuevo PIN de forma segura en el servidor.
    const salt = await bcrypt.genSalt(10);
    const newHashedPin = await bcrypt.hash(newPin, salt);

    // 2. Llamar a tu función de Firestore para guardar el nuevo PIN hasheado.
    await updateUserPin(uid, rol, newHashedPin);

    return NextResponse.json({ success: true, message: 'PIN actualizado correctamente.' }, { status: 200 });

  } catch (error) {
    console.error("Error en API /api/auth/update-pin:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado en el servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}