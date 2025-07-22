/* ContactoPopup.tsx – Corregido para no crear notificaciones fantasma */
import { useState } from 'react';
import Button from '@/app/components/ui/Button';
// Se elimina la importación de sendContactRequest que ya no se utiliza
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  userUid: string;
  userCollection: string;
  providerUid: string;
  providerCollection: string;
  providerName: string;
  notifId: string; // ID de la notificación 'job_accept' que se guardará
  onClose: () => void;
}

export default function ContactoPopup({
  userUid,
  userCollection,
  providerUid,
  providerCollection,
  providerName,
  notifId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick(via: 'whatsapp' | 'call') {
    setLoading(true);

    // Se elimina la llamada a sendContactRequest que generaba la notificación fantasma.

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
        originalNotifId: notifId, // <-- Guarda la ID de la notificación original
      },
      { merge: true },
    );

    // 3. YA NO se elimina la notificación original de "job_accept" desde aquí.

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 anim-fadeIn">
      {/* Contenedor del Popup con estilos de tema */}
      <div className="relative bg-gray-800 p-6 pt-10 rounded-xl shadow-xl max-w-xs w-full text-texto-principal border border-borde-tarjeta anim-zoomIn">
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
          {/* --- BOTONES CORREGIDOS --- */}
          <Button
            fullWidth
            disabled={loading}
            onClick={() => handleClick('whatsapp')}
            className="!bg-[var(--color-primario)] !text-[var(--color-fondo)] border-none !focus:shadow-none hover:!brightness-90"
          >
            WhatsApp
          </Button>
          <Button
            fullWidth
            disabled={loading}
            onClick={() => handleClick('call')}
            className="!bg-[var(--color-primario)] !text-[var(--color-fondo)] border-none !focus:shadow-none hover:!brightness-90"
          >
            Llamar por Teléfono
          </Button>
        </div>
      </div>
    </div>
  );
}