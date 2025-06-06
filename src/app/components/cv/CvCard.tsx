// src/app/components/cv/CvCard.tsx
'use client';
import React, { useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Button from '@/app/components/ui/Button';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import CvModal from './CvModal';
import { useUserStore } from '@/store/userStore';
import Card from '@/app/components/ui/Card';

/* Datos mínimos para la tarjeta */
export interface CvCardData {
  uid: string;
  collection: string;
  nombre: string;
  selfieURL: string;
  rubros: string[];
  descripcion: string;
  telefono: string;
}

interface CvCardProps {
  user: CvCardData;
  highlightRubro?: string; // <-- 1. AÑADIMOS ESTO para que pueda recibir el rubro
}

const CvCard: React.FC<CvCardProps> = ({ user, highlightRubro }) => { // <-- 2. LO RECIBIMOS AQUÍ
  const [showCv, setShowCv] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const { currentUser } = useUserStore();

  const viewerCollection =
    currentUser?.rol === 'prestador'
      ? 'prestadores'
      : currentUser?.rol === 'comercio'
      ? 'comercios'
      : 'usuarios_generales';

  return (
    <>
      <Card className="flex items-center space-x-4">
        <Avatar selfieUrl={user.selfieURL} nombre={user.nombre} size={64} />
        <div className="flex-1">
          <h3 className="font-semibold">{user.nombre}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {user.rubros.slice(0, 2).join(', ')}
            {user.rubros.length > 2 && ` +${user.rubros.length - 2}`}
          </p>

          <div className="flex space-x-2 mt-3">
            <Button variant="outline" className="px-3 py-1 text-sm" onClick={() => setShowCv(true)}>
              Ver CV
            </Button>
            <Button
              className="px-3 py-1 text-sm"
              variant="primary"
              onClick={() => setShowContact(true)}
              disabled={!currentUser}
            >
              Contactar
            </Button>
          </div>
        </div>
      </Card>

      {/* modal CV */}
      {showCv && (
        <CvModal
          uid={user.uid}
          collection={user.collection}
          onClose={() => setShowCv(false)}
          highlightRubro={highlightRubro} // <-- 3. LO PASAMOS HACIA EL MODAL
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
          notifId=""
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
};

export default CvCard;