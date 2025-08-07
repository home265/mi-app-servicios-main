// src/app/api/paginas-amarillas/[creatorId]/route.ts


import { NextResponse, type NextRequest } from 'next/server';
import type { UpdatePaginaAmarillaDTO } from '@/lib/services/paginasAmarillasService';
import type { PaginaAmarillaData, RolPaginaAmarilla } from '@/types/paginaAmarilla';
import { getUserData } from '@/lib/firebase/authHelpers';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface GoogleIdTokenLookupResponse {
  users?: Array<{ localId: string }>;
}
interface DecodedIdToken {
  sub: string;
  aud: string;
}
interface AuthenticatedUserProfile {
  uid: string;
  role: RolPaginaAmarilla | 'perfil_incompleto_o_no_encontrado';
}

async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleIdTokenLookupResponse;
    const uid = data.users?.[0]?.localId;
    return uid ? { sub: uid, aud: '' } : null;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserProfile | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const idToken = authHeader.split('Bearer ')[1];
  const decoded = await verifyIdToken(idToken);
  if (!decoded?.sub) return null;
  const profile = await getUserData(decoded.sub);
  if (!profile?.data?.role) {
    return { uid: decoded.sub, role: 'perfil_incompleto_o_no_encontrado' };
  }
  return {
    uid: decoded.sub,
    role: profile.data.role as RolPaginaAmarilla,
  };
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const creatorId = url.pathname.split('/').pop() ?? '';
  const authUser = await getAuthenticatedUser(request);

  if (!authUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }
  if (authUser.uid !== creatorId) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as UpdatePaginaAmarillaDTO;
    const keys = Object.keys(body) as Array<keyof UpdatePaginaAmarillaDTO>;
    if (keys.length === 0) {
      return NextResponse.json(
        { error: 'Nada que actualizar (cuerpo vacío).' },
        { status: 400 }
      );
    }

    // Usamos un Record<string, unknown> para poder asignar null, string, boolean, etc.
    const updates: Record<string, unknown> = {};
    for (const key of keys) {
      const value = body[key];
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No se detectaron cambios para actualizar.' },
        { status: 200 }
      );
    }

    const docRef = doc(db, 'paginas_amarillas', creatorId);
    // Casteamos a UpdatePaginaAmarillaDTO para que updateDoc acepte sólo esos campos
    await updateDoc(docRef, updates as UpdatePaginaAmarillaDTO);
    return NextResponse.json(
      { message: 'Publicación actualizada.' },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno.';
    return NextResponse.json(
      { error: `Error interno: ${msg}` },
      { status: 500 }
    );
  }
}

// ... el GET y DELETE quedan igual que antes ...


/** GET /api/paginas-amarillas/[creatorId] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
): Promise<NextResponse> {
  const { creatorId } = await params;
  try {
    const docSnap = await getDoc(doc(db, 'paginas_amarillas', creatorId));
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }
    return NextResponse.json(docSnap.data() as PaginaAmarillaData, { status: 200 });
  } catch (err) {
    console.error('GET /paginas-amarillas/[creatorId] error:', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

/** DELETE /api/paginas-amarillas/[creatorId] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
): Promise<NextResponse> {
  const { creatorId } = await params;
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }
  if (authUser.uid !== creatorId) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }
  try {
    await deleteDoc(doc(db, 'paginas_amarillas', creatorId));
    return NextResponse.json({ message: 'Eliminado correctamente.' }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno.';
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 });
  }
}
