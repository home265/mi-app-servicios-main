// src/app/components/cv/CvCard.tsx
'use client';
import React, { useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Button from '@/app/components/ui/Button';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import CvModal from './CvModal';
import { useUserStore } from '@/store/userStore';
import Card from '@/app/components/ui/Card';
import { type CvDocument } from '@/lib/services/cvService';

interface CvCardProps {
  cv: CvDocument;
  highlightRubro?: string;
}

const CvCard: React.FC<CvCardProps> = ({ cv, highlightRubro }) => {
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
        <Avatar selfieUrl={cv.selfieURL} nombre={cv.nombreCompleto} size={64} />
        <div className="flex-1">
          <h3 className="font-semibold text-texto-principal">{cv.nombreCompleto}</h3>
          <p className="text-sm text-texto-secundario line-clamp-2">
            {cv.rubros.slice(0, 2).join(', ')}
            {cv.rubros.length > 2 && ` +${cv.rubros.length - 2}`}
          </p>

          <div className="flex space-x-2 mt-3">
            <Button
              className="px-3 py-1 text-sm !bg-primario !text-fondo border-none !focus:shadow-none hover:!brightness-90"
              onClick={() => setShowCv(true)}
            >
              Ver CV
            </Button>
            <Button
              className="px-3 py-1 text-sm !bg-primario !text-fondo border-none !focus:shadow-none hover:!brightness-90"
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
          uid={cv.uid}
          onClose={() => setShowCv(false)}
          highlightRubro={highlightRubro}
        />
      )}

      {/* popup de contacto */}
      {showContact && currentUser && (
        <ContactoPopup
          userUid={currentUser.uid}
          userCollection={viewerCollection}
          providerUid={cv.uid}
          providerCollection="usuarios_generales"
          providerName={cv.nombreCompleto}
          notifId=""
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
};

export default CvCard;