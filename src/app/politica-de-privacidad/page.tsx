// src/app/(legal)/politica-de-privacidad/page.tsx

const PoliticaDePrivacidadPage = () => {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto', lineHeight: '1.6', color: 'inherit' }}>
        <h1>Política de Privacidad de CODYS</h1>
        <p>Última actualización: 8 de julio de 2025</p>
  
        <h2>1. Responsable del Tratamiento de Datos</h2>
        <p>
          <strong>CODYS</strong>, con domicilio en Tunuyán, Mendoza, es el responsable de la base de datos y del tratamiento de los datos personales de sus usuarios.
        </p>
  
        <h2>2. ¿Qué datos personales recolectamos?</h2>
        <p>Recolectamos los siguientes datos con el fin de operar la plataforma:</p>
        <ul>
          <li><strong>Datos de Perfil:</strong> Nombre, apellido, email, teléfono, fotografía (selfie), localidad y provincia.</li>
          <li><strong>Datos de Cuenta:</strong> Rol (usuario, prestador, comercio), fecha de registro, y un identificador único (UID).</li>
          <li><strong>Datos de Verificación (para Prestadores/Comercios):</strong> CUIT/CUIL, descripción del servicio/negocio, rubro/categoría y matrícula (si aplica).</li>
          <li><strong>Contenido Generado por el Usuario:</strong> Las reseñas, comentarios y valoraciones que usted publica en la plataforma. Estos datos, junto a su nombre y foto, serán públicos dentro de la App.</li>
          <li><strong>Datos de Seguridad:</strong> Su PIN de acceso se almacena de forma segura y cifrada.</li>
        </ul>
  
        <h2>3. Finalidad del Tratamiento de Datos</h2>
        <p>Sus datos son utilizados para:</p>
        <ul>
          <li>Permitirle crear y gestionar su cuenta.</li>
          <li><strong>Hacer visible su perfil y/o servicios a otros usuarios para facilitar el contacto.</strong></li>
          <li>Mostrar reseñas y valoraciones para construir una comunidad confiable.</li>
          <li>Verificar la identidad de los usuarios para mayor seguridad.</li>
          <li>Contactarlo para notificaciones importantes sobre el servicio.</li>
        </ul>
        
        <h2>4. ¿Con quién compartimos tus datos?</h2>
        <p>
          Su información de perfil (nombre, foto, descripción, reseñas) es compartida con otros usuarios dentro de la App para cumplir con el propósito de la misma. <strong>No vendemos ni alquilamos sus datos personales a terceros con fines de marketing.</strong>
        </p>
        <p>
          Para verificar la identidad de los usuarios, aumentar la seguridad de nuestra comunidad y cumplir con normativas vigentes, es posible que consultemos o compartamos ciertos datos (como el número de DNI) con los servicios ofrecidos por el <strong>Registro Nacional de las Personas (RENAPER)</strong> de la República Argentina. Esta acción se realiza con el único fin de validar la identidad del usuario.
        </p>
  
        <h2>5. Derechos del Titular de los Datos</h2>
        <p>
          Usted tiene derecho a solicitar el <strong>Acceso, Rectificación y Supresión</strong> de sus datos personales. Puede acceder y rectificar la mayoría de sus datos desde la sección &quot;Perfil&quot; de la App. Para la supresión de su cuenta, contáctenos a <strong>soporte@andescode.tech</strong>.
        </p>
        
        <h2>6. Leyenda Obligatoria</h2>
        <p>
          <strong>
            &quot;El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.&quot;
          </strong>
        </p>
      </div>
    );
  };
  
  export default PoliticaDePrivacidadPage;