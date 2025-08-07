// src/app/api/paginas-amarillas/route.ts
import { NextResponse, NextRequest } from 'next/server';
import {
  createPaginaAmarilla,
  listPaginasAmarillasByFilter,
  CreatePaginaAmarillaDTO,
  ListPaginasAmarillasOptions,
} from '@/lib/services/paginasAmarillasService';
import {
  PaginaAmarillaFiltros,
  PlanId, // <--- 1. TIPO IMPORTADO
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import { getUserData } from '@/lib/firebase/authHelpers';

/* ---------- helpers ---------- */
interface GoogleTokenInfo {
  sub: string; // UID del usuario
  aud: string; // clientId (appId)
}

/** Verifica el ID token contra la REST API de Firebase Auth */
async function verifyIdToken(idToken: string): Promise<GoogleTokenInfo | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
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
    type LookupResponse = { users?: { localId: string }[] };
    const data: LookupResponse = await res.json();
    const localId = data.users?.[0]?.localId;
    return localId ? { sub: localId, aud: '' } : null;
  } catch {
    return null;
  }
}

interface AuthenticatedUserProfile {
  uid: string;
  role: RolPaginaAmarilla | 'perfil_incompleto_o_no_encontrado';
}

async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUserProfile | null> {
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  const idToken = authorizationHeader.split('Bearer ')[1] ?? '';
  const decoded = await verifyIdToken(idToken);
  if (!decoded) return null;
  const userProfile = await getUserData(decoded.sub);
  if (!userProfile?.data?.role) {
    return { uid: decoded.sub, role: 'perfil_incompleto_o_no_encontrado' };
  }
  return {
    uid: decoded.sub,
    role: userProfile.data.role as RolPaginaAmarilla,
  };
}

/* ---------- POST /api/paginas-amarillas ---------- */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ... (Esta función no necesita cambios)
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json(
      { error: 'Usuario no autenticado.' },
      { status: 401 }
    );
  }
  if (authUser.role !== 'prestador' && authUser.role !== 'comercio') {
    return NextResponse.json(
      { error: `Rol '${authUser.role}' no autorizado.` },
      { status: 403 }
    );
  }
  const body: CreatePaginaAmarillaDTO = await request.json();
  if (!body.nombrePublico || !body.provincia || !body.localidad) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios.' },
      { status: 400 }
    );
  }
  if (authUser.role === 'comercio' && !body.rubro) {
    return NextResponse.json(
      { error: 'El campo "rubro" es obligatorio para comercios.' },
      { status: 400 }
    );
  }
  await createPaginaAmarilla(authUser.uid, {
    ...body,
    creatorRole: authUser.role,
  });
  return NextResponse.json(
    { message: 'Página creada exitosamente.' },
    { status: 201 }
  );
}

/* ---------- GET /api/paginas-amarillas ---------- */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filtros: PaginaAmarillaFiltros = {};

    const getParam = (key: string): string | undefined =>
      searchParams.get(key) ?? undefined;

    // Lectura de filtros existentes
    filtros.provincia = getParam('provincia');
    filtros.localidad = getParam('localidad');

    const rolParam = getParam('rol');
    if (rolParam === 'comercio' || rolParam === 'prestador') {
      filtros.rol = rolParam as RolPaginaAmarilla;
    }

    if (!filtros.rol || filtros.rol === 'comercio') {
      filtros.rubro = getParam('rubro');
      filtros.subRubro = getParam('subRubro');
    }
    if (!filtros.rol || filtros.rol === 'prestador') {
      filtros.categoria = getParam('categoria');
      filtros.subCategoria = getParam('subCategoria');
    }

    const activaParam = getParam('activa');
    if (activaParam === 'true' || activaParam === 'false') {
      filtros.activa = activaParam === 'true';
    }

    const realizaEnviosParam = getParam('realizaEnvios');
    if (realizaEnviosParam === 'true' || realizaEnviosParam === 'false') {
      filtros.realizaEnvios = realizaEnviosParam === 'true';
    }

    filtros.terminoBusqueda = getParam('terminoBusqueda');
    
    // --- INICIO: LÍNEA AÑADIDA ---
    // 2. Leer el parámetro 'planId' y añadirlo a los filtros si existe.
    filtros.planId = getParam('planId') as PlanId | undefined;
    // --- FIN: LÍNEA AÑADIDA ---

    // Lógica para diferenciar búsquedas
    const tipoBusqueda = getParam('tipo');
    const options: ListPaginasAmarillasOptions = {
      soloSuscritos: tipoBusqueda === 'anuncios',
    };

    const results = await listPaginasAmarillasByFilter(filtros, options);
    
    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: `Error al procesar la solicitud: ${error.message}` },
      { status: 500 }
    );
  }
}