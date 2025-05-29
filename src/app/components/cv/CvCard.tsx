// src/app/components/cv/CvCard.tsx
'use client';
import React, { useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Button from '@/app/components/ui/Button';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import CvModal from './CvModal';
import { useUserStore } from '@/store/userStore';

/* Datos mínimos para la tarjeta */
export interface CvCardData {
  uid: string;
  collection: string;      // p. ej. 'usuarios_generales'
  nombre: string;
  selfieURL: string;
  rubros: string[];
  descripcion: string;
  telefono: string;
}

interface CvCardProps {
  user: CvCardData;        // ← el prestador que se muestra
}

const CvCard: React.FC<CvCardProps> = ({ user }) => {
  const [showCv, setShowCv] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // quién está navegando ahora mismo
  const { currentUser } = useUserStore();

  /* colección del usuario logueado, para las estadísticas de contacto */
  const viewerCollection =
    currentUser?.rol === 'prestador'
      ? 'prestadores'
      : currentUser?.rol === 'comercio'
      ? 'comercios'
      : 'usuarios_generales';

  return (
    <>
      {/* tarjeta CV */}
      <div className="bg-white rounded-2xl shadow p-4 flex space-x-3">
        <Avatar selfieUrl={user.selfieURL} nombre={user.nombre} size={64} />
        <div className="flex-1">
          <h3 className="font-semibold">{user.nombre}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {user.rubros.slice(0, 2).join(', ')}
            {user.rubros.length > 2 && ` +${user.rubros.length - 2}`}
          </p>

          <div className="flex space-x-2 mt-3">
            <Button className="px-3 py-1 text-sm" onClick={() => setShowCv(true)}>
              Ver CV
            </Button>
            <Button
              className="px-3 py-1 text-sm"
              variant="primary"
              onClick={() => setShowContact(true)}
              disabled={!currentUser}           /* opcional */
            >
              Contactar
            </Button>
          </div>
        </div>
      </div>

      {/* modal CV */}
      {showCv && (
        <CvModal
          uid={user.uid}
          collection={user.collection}
          onClose={() => setShowCv(false)}
        />
      )}

      {/* popup de contacto */}
      {showContact && currentUser && (
        <ContactoPopup
          userUid={currentUser.uid}
          userCollection={viewerCollection}
          providerUid={user.uid}
          providerCollection={user.collection}
          providerName={user.nombre}
          notifId=""                /* ← si no tienes un id de notificación, envía cadena vacía */
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
};

export default CvCard;
