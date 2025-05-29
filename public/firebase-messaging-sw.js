// public/firebase-messaging-sw.js

// Importamos las herramientas de Firebase que necesita el ayudante
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Configuración de tu proyecto Firebase (con tus datos)
const firebaseConfig = {
  apiKey: "AIzaSyBxEzDQzubXFrhasDGup59e-QC-tlXFJtY",
  authDomain: "mi-app-servicios-3326e.firebaseapp.com",
  projectId: "mi-app-servicios-3326e",
  storageBucket: "mi-app-servicios-3326e.firebasestorage.app", 
  messagingSenderId: "908591275641",
  appId: "1:908591275641:web:fd2a49195b79e30086fea8"
  // measurementId: "TU_MEASUREMENT_ID" // Opcional, si lo usas, agrégalo
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

  // Asegúrate que el payload tiene la estructura esperada
  const notificationTitle = payload.notification?.title || "Nueva Notificación";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes un nuevo mensaje.",
    icon: payload.notification?.icon || '/logo_notificacion.png', // Ten un logo en public/logo_notificacion.png
    // Puedes agregar 'data' para manejar el click_action
    // data: payload.data || { click_action: '/' } // Ejemplo
  };

  // El ayudante muestra la notificación
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Opcional: Manejar el clic en la notificación (si quieres que abra una URL específica)
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación

  let clickAction = '/'; // URL por defecto al hacer clic

  // Si envías 'click_action' en el payload.data desde tu función de backend:
  if (event.notification.data && event.notification.data.click_action) {
    clickAction = event.notification.data.click_action;
  }
  // O si lo envías en payload.fcmOptions.link o payload.notification.click_action (webpush config)
  else if (payload.fcmOptions?.link) { // Chequea si esto está disponible directamente en event.notification
     clickAction = payload.fcmOptions.link;
  }
  // Es más común tenerlo en event.notification.data

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Verifica si alguna ventana de la app ya está abierta con esa URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // Compara la URL base, puede que necesites ajustar esto si usas rutas con parámetros
        if (client.url.startsWith(self.location.origin + clickAction) && 'focus' in client) {
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