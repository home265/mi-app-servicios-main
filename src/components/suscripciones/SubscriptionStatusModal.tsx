'use client';

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';

export default function SubscriptionStatusModal() {
  const { subscriptionModal, setSubscriptionModal } = useUserStore();
  const router = useRouter();

  const handleClose = () => {
    setSubscriptionModal({ isOpen: false });
  };

  const handleRenew = () => {
    // Redirige al usuario al inicio del flujo de pago
    router.push('/paginas-amarillas/planes');
    handleClose();
  };

  // Determina el contenido del modal según el estado
  let title = '';
  let content: React.ReactNode = null;

  if (subscriptionModal.status === 'expired') {
    title = 'Tu Suscripción ha Expirado';
    content = (
      <>
        <p className="text-base text-texto-secundario">
          Tu publicación ya no está visible. Para reactivarla y volver a aparecer en la guía, necesitas renovar tu plan.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button onClick={() => router.push('/login')} className="btn-secondary w-full">
            Cerrar Sesión
          </button>
          <button onClick={handleRenew} className="btn-primary w-full">
            Renovar Ahora
          </button>
        </div>
      </>
    );
  } else if (subscriptionModal.status === 'warning') {
    title = 'Aviso de Vencimiento';
    content = (
      <>
        <p className="text-base text-texto-secundario">
          {`Tu suscripción está a punto de expirar en ${
            subscriptionModal.daysLeft || ''
          } días. ¡No te olvides de renovarla para no perder visibilidad!`}
        </p>
        <div className="mt-5 flex justify-end">
          <button onClick={handleClose} className="btn-primary">
            Entendido
          </button>
        </div>
      </>
    );
  }

  // El modal no se renderiza si no está abierto o no tiene un estado válido
  if (!subscriptionModal.isOpen || !subscriptionModal.status) {
    return null;
  }

  return (
    <Modal
      isOpen={subscriptionModal.isOpen}
      // Para el modal de expiración, no permitimos cerrarlo haciendo clic fuera
      onClose={subscriptionModal.status === 'expired' ? () => {} : handleClose}
      title={title}
    >
      {content}
    </Modal>
  );
}