/* ContactoPopup.tsx – Con botón de cierre y overlay, SIN eliminar notificación original */
import { useState } from 'react';
import Button from '@/app/components/ui/Button'; //
import {
  sendContactRequest,
  // removeNotification, // Ya no se usa aquí directamente
} from '@/lib/services/notificationsService'; //
import { db } from '@/lib/firebase/config'; //
import { doc, setDoc } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  userUid: string;
  userCollection: string;
  providerUid: string;
  providerCollection: string;
  providerName: string;
  notifId: string; // Aunque ya no la usemos para eliminar, la mantenemos por si la necesitas para otra cosa o por consistencia
  onClose: () => void;
}

export default function ContactoPopup({
  userUid,
  userCollection,
  providerUid,
  providerCollection,
  providerName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  notifId, // notifId se sigue recibiendo pero no se usa para eliminar la notificación aquí
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick(via: 'whatsapp' | 'call') {
    setLoading(true);

    // 1. callable contact_request (sólo para estadística)
    await sendContactRequest({
      to: [{ uid: providerUid, collection: providerCollection }],
      from: { uid: userUid, collection: userCollection },
      payload: { description: 'quiere contactar', via },
    });

    // 2. guarda primer clic en /contactPendings/
    const ref = doc(
      db,
      userCollection,
      userUid,
      'contactPendings',
      providerUid,
    );
    await setDoc(
      ref,
      {
        providerId: providerUid,
        providerCollection,
        providerName,
        via,
        firstClickTs: Date.now(),
      },
      { merge: true },
    );

    // 3. YA NO se elimina la notificación original de "job_accept" desde aquí.
    // La línea original era:
    // await removeNotification(
    //   { uid: userUid, collection: userCollection },
    //   notifId,
    // );

    // 4. abre medio real
    if (via === 'whatsapp') {
      window.open(`https://wa.me/${providerUid}`, '_blank');
    } else {
      window.location.href = `tel:${providerUid}`;
    }
    setLoading(false);
    onClose(); // Llama a onClose para cerrar el popup después de la acción
  }

  return (
    // Overlay para el popup
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 anim-fadeIn"> {/* */}
      {/* Contenedor del Popup con estilos de tema */}
      <div className="relative bg-tarjeta p-6 pt-10 rounded-xl shadow-xl max-w-xs w-full text-texto-principal border border-borde-tarjeta anim-zoomIn"> {/* */}
        {/* Botón de Cierre */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-texto-secundario hover:text-texto-principal p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Contenido del Popup */}
        <div className="flex flex-col gap-4">
          <p className="text-center text-lg font-semibold">
            Contactar a <strong className="text-primario">{providerName}</strong>
          </p>
          <p className="text-center text-sm text-texto-secundario mb-2">
            ¿Cómo deseas ponerte en contacto?
          </p>
          <Button fullWidth disabled={loading} onClick={() => handleClick('whatsapp')} variant="primary">
            WhatsApp
          </Button>
          <Button fullWidth variant="outline" disabled={loading} onClick={() => handleClick('call')}>
            Llamar por Teléfono
          </Button>
        </div>
      </div>
    </div>
  );
}