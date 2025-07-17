// public/firebase-messaging-sw.js

// Importamos las herramientas de Firebase que necesita el ayudante
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Configuración de tu proyecto Firebase (se mantiene como está para desarrollo)
const firebaseConfig = {
  apiKey: "AIzaSyBxEzDQzubXFrhasDGup59e-QC-tlXFJtY",
  authDomain: "mi-app-servicios-3326e.firebaseapp.com",
  projectId: "mi-app-servicios-3326e",
  storageBucket: "mi-app-servicios-3326e.firebasestorage.app", 
  messagingSenderId: "908591275641",
  appId: "1:908591275641:web:fd2a49195b79e30086fea8"
};

// El ayudante inicializa Firebase con tu configuración
if (firebase.apps.length === 0) { // Evitar reinicializar si ya lo está (importante para SW)
  firebase.initializeApp(firebaseConfig);
}

// Preparamos al ayudante para recibir mensajes
const messaging = firebase.messaging();

// Esto es lo que hace el ayudante cuando llega un mensaje y la app está cerrada o en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);

  const notificationTitle = payload.notification?.title || "Nueva Notificación";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes un nuevo mensaje.",
    icon: payload.notification?.icon || '/logo1.png', // Ícono que se mostrará
    
    // --- MODIFICACIÓN CLAVE ---
    // Se adjunta el objeto 'data' del payload a la notificación.
    // Esto es esencial para que el evento 'notificationclick' pueda leer
    // la URL de destino ('click_action') que envías desde el backend.
    data: payload.data
  };

  // El ayudante muestra la notificación con el título y las opciones dinámicas.
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar el clic en la notificación para abrir la URL correcta
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación

  // --- CORRECCIÓN DE ERROR ---
  // Se lee la URL de destino ('click_action') desde 'event.notification.data'.
  // Se elimina la referencia a la variable 'payload', que causaba el error
  // 'ReferenceError: payload is not defined' porque no existe en este contexto.
  const clickAction = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Verifica si alguna ventana de la app ya está abierta con esa URL
      for (const client of windowClients) {
        if (client.url === clickAction && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventanas abiertas con esa URL, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});