/* ContactoPopup.tsx – Refactorizado para usar el componente Modal y estilos centralizados */
import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import Modal from '@/components/common/Modal'; // Se importa el Modal genérico

// Nota: Ya no se necesita XMarkIcon porque el Modal lo gestiona.
// Nota: Ya no se necesita el componente Button de ui, se usarán botones estándar con clases.

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

  // La lógica interna del componente no se modifica, ya que funciona correctamente.
  async function handleClick(via: 'whatsapp' | 'call') {
    setLoading(true);

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
        originalNotifId: notifId,
      },
      { merge: true },
    );

    if (via === 'whatsapp') {
      window.open(`https://wa.me/${providerUid}`, '_blank');
    } else {
      window.location.href = `tel:${providerUid}`;
    }
    setLoading(false);
    onClose();
  }

  // Se refactoriza el JSX para usar el componente Modal.
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Contactar a ${providerName}`}
    >
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-center text-sm text-texto-secundario mb-2">
          ¿Cómo deseas ponerte en contacto?
        </p>

        {/* Botones de acción refactorizados. 
          Se eliminan las clases con "!" y se usa la clase ".btn-primary" centralizada.
          Se usa un <button> estándar para asegurar la aplicación directa de las clases globales.
        */}
        <button
          disabled={loading}
          onClick={() => handleClick('whatsapp')}
          className="btn-primary w-full"
        >
          {loading ? 'Procesando...' : 'WhatsApp'}
        </button>

        <button
          disabled={loading}
          onClick={() => handleClick('call')}
          className="btn-primary w-full"
        >
          {loading ? 'Procesando...' : 'Llamar por Teléfono'}
        </button>
      </div>
    </Modal>
  );
}