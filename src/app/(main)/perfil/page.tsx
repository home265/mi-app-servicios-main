// src/app/(main)/perfil/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { toast } from 'react-hot-toast';

// Importamos tus componentes de UI reutilizables
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

// Importamos iconos
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User, Mail, Phone, MapPin, Building, Wrench, ChevronLeft } from 'lucide-react';
import BotonVolver from '@/app/components/common/BotonVolver';

// Componente para mostrar una fila de datos
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-borde-tarjeta/50 last:border-b-0">
      <div className="flex-shrink-0 text-primario">{icon}</div>
      <div>
        <p className="text-xs text-texto-secundario">{label}</p>
        <p className="font-medium text-texto-principal">{value}</p>
      </div>
    </div>
  );
};

export default function PerfilPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useUserStore();

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primario"></div>
      </div>
    );
  }

  if (!currentUser) {
    // Si no hay usuario, redirigir al login después de un momento
    if (typeof window !== 'undefined') {
        router.replace('/login');
        toast.error("Debes iniciar sesión para ver tu perfil.");
    }
    return null; // O un mensaje de "Redirigiendo..."
  }
  
  const fullName = `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();

  // ---- MODIFICADO: Se crea una variable para formatear la ubicación correctamente ----
  const locationString = currentUser.localidad
    ? `${currentUser.localidad.nombre}, ${currentUser.localidad.provinciaNombre}`
    : 'No especificada';

  return (
    <div className="min-h-screen bg-fondo py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-lg space-y-6">

        {/* --- Tarjeta Principal con la Info del Perfil --- */}
        <Card className="anim-zoomIn">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar selfieUrl={currentUser.selfieURL} nombre={fullName} size={120} />
            <div>
              <h1 className="text-2xl font-bold text-texto-principal">{fullName}</h1>
              <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full bg-primario/20 text-primario uppercase tracking-wider">
                {currentUser.rol}
              </span>
            </div>
          </div>
          
          <div className="mt-8">
            <InfoRow icon={<Mail size={20} />} label="Email" value={currentUser.email} />
            <InfoRow icon={<Phone size={20} />} label="Teléfono" value={currentUser.telefono} />
            {/* ---- MODIFICADO: Se usa la nueva variable 'locationString' ---- */}
            <InfoRow icon={<MapPin size={20} />} label="Ubicación" value={locationString} />

            {/* --- Datos específicos por rol --- */}
            {currentUser.rol === 'comercio' && (
              <InfoRow icon={<Building size={20} />} label="Nombre del Comercio" value={currentUser.nombreComercio} />
            )}
          </div>
        </Card>

        {/* --- Tarjeta de Acciones --- */}
        <Card className="anim-fadeIn">
            <p className="text-xs text-texto-secundario text-center mb-4">
              Para cerrar sesión o dar de baja tu cuenta, ve a la sección de Ajustes.
            </p>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => router.push('/ajustes')}
            >
              <Wrench size={16} className="mr-2" />
              Ir a Ajustes de la Cuenta
            </Button>
        </Card>

        {/* --- Nota Legal --- */}
        <div className="text-center text-xs text-texto-secundario/80 px-4 anim-fadeIn">
            <p>
                Para corregir o actualizar tus datos, por favor contacta a <a href="mailto:contacto@andescode.tech" className="text-primario hover:underline">contacto@andescode.tech</a>, 
                ya que la información está protegida para garantizar la seguridad en la plataforma.
            </p>
        </div>
      </div>

      <BotonVolver href="/bienvenida" />
    </div>
  );
}