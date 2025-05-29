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

/* ⬇️  En Next 15, `params` es una Promesa */
interface RouteContext {
  params: Promise<{ creatorId: string }>;
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
    return uid ? { sub: uid, aud: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '' } : null;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUserProfile | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyIdToken(idToken);
  if (!decodedToken?.sub) return null;
  try {
    const userProfileData = await getUserData(decodedToken.sub);
    if (!userProfileData?.data?.role) {
      return { uid: decodedToken.sub, role: 'perfil_incompleto_o_no_encontrado' };
    }
    return { uid: decodedToken.sub, role: userProfileData.data.role as RolPaginaAmarilla };
  } catch {
    return null;
  }
}

/* ------------------------------   PUT   ---------------------------------- */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const creatorId = pathParts[pathParts.length - 1];

  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  if (authUser.uid !== creatorId) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  try {
    const body = (await request.json()) as UpdatePaginaAmarillaDTO;
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar (cuerpo vacío).' }, { status: 400 });
    }

    const dataToUpdate: {
      [K in keyof UpdatePaginaAmarillaDTO]?: UpdatePaginaAmarillaDTO[K] | null;
    } = {};
    let hasChanges = false;

    for (const key of Object.keys(body) as Array<keyof UpdatePaginaAmarillaDTO>) {
      const value = body[key];
      if (value !== undefined) {
        (dataToUpdate as Record<string, unknown>)[key] = value;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return NextResponse.json({ message: 'No se detectaron cambios para actualizar.' }, { status: 200 });
    }

    const docRef = doc(db, 'paginas_amarillas', creatorId);
    await updateDoc(docRef, dataToUpdate);
    return NextResponse.json({ message: 'Publicación actualizada.' }, { status: 200 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error desconocido.';
    return NextResponse.json({ error: `Error interno: ${errMsg}` }, { status: 500 });
  }
}

/* ------------------------------   GET   ---------------------------------- */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { creatorId } = await params;
  const logPrefix = `[API GET /paginas-amarillas/${creatorId}]`;

  if (!db) {
    console.error(`${logPrefix} Firestore no inicializado.`);
    return NextResponse.json({ error: 'Firestore no inicializado.' }, { status: 500 });
  }

  try {
    const docSnap = await getDoc(doc(db, 'paginas_amarillas', creatorId));
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }

    return NextResponse.json(docSnap.data() as PaginaAmarillaData);
  } catch (error) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

/* -----------------------------   DELETE  --------------------------------- */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { creatorId } = await params;
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || authUser.uid !== creatorId) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: authUser ? 403 : 401 });
  }
  try {
    const docRef = doc(db, 'paginas_amarillas', creatorId);
    await deleteDoc(docRef);
    return NextResponse.json({ message: 'Eliminado correctamente.' });
  } catch {
    return NextResponse.json({ error: 'Error interno al borrar.' }, { status: 500 });
  }
}
