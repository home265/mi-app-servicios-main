import { NextResponse, NextRequest } from 'next/server';
import {
  createPaginaAmarilla,
  listPaginasAmarillasByFilter,
  CreatePaginaAmarillaDTO,
} from '@/lib/services/paginasAmarillasService';
import {
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import { getUserData } from '@/lib/firebase/authHelpers';

/* ---------- helpers ---------- */

interface GoogleTokenInfo {
  sub: string;          // UID del usuario
  aud: string;          // clientId (appId)
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
      },
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
  request: NextRequest,
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

/* ---------- POST  /api/paginas-amarillas ---------- */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return NextResponse.json({ error: 'Usuario no autenticado.' }, { status: 401 });

  if (authUser.role !== 'prestador' && authUser.role !== 'comercio') {
    return NextResponse.json(
      { error: `Rol '${authUser.role}' no autorizado para esta acción.` },
      { status: 403 },
    );
  }

  const body: CreatePaginaAmarillaDTO = await request.json();

  if (!body.nombrePublico || !body.provincia || !body.localidad) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios.' },
      { status: 400 },
    );
  }
  if (authUser.role === 'comercio' && !body.rubro) {
    return NextResponse.json(
      { error: 'El campo "rubro" es obligatorio para comercios.' },
      { status: 400 },
    );
  }

  await createPaginaAmarilla(authUser.uid, { ...body, creatorRole: authUser.role });

  return NextResponse.json(
    { message: 'Publicación creada exitosamente.' },
    { status: 201 },
  );
}

/* ---------- GET  /api/paginas-amarillas ---------- */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filtros: PaginaAmarillaFiltros = {};

    const getString = (key: string): string | undefined =>
      searchParams.get(key) ?? undefined;

    filtros.provincia = getString('provincia');
    filtros.localidad = getString('localidad');

    const rol = getString('rol');
    if (rol === 'comercio' || rol === 'prestador') filtros.rol = rol as RolPaginaAmarilla;

    if (!filtros.rol || filtros.rol === 'comercio') {
      filtros.rubro = getString('rubro');
      filtros.subRubro = getString('subRubro');
    }
    if (!filtros.rol || filtros.rol === 'prestador') {
      filtros.categoria = getString('categoria');
      filtros.subCategoria = getString('subCategoria');
    }

    const activa = getString('activa');
    if (activa === 'true' || activa === 'false') filtros.activa = activa === 'true';

    const realizaEnvios = getString('realizaEnvios');
    if (realizaEnvios === 'true' || realizaEnvios === 'false') {
      filtros.realizaEnvios = realizaEnvios === 'true';
    }

    filtros.terminoBusqueda = getString('terminoBusqueda');

    const pubs = await listPaginasAmarillasByFilter(filtros);
    return NextResponse.json(pubs, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 });
  }
}
