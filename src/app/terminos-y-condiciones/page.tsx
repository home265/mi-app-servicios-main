// src/app/(legal)/terminos-y-condiciones/page.tsx

const TerminosYCondicionesPage = () => {
  return (
    <div className="bg-fondo text-texto-principal min-h-screen p-8">
      <div className="max-w-4xl mx-auto leading-relaxed">
        <h1 className="text-3xl font-bold text-primario mb-4">Términos y Condiciones de CODYS</h1>
        <p className="text-sm text-texto-secundario mb-8">Última actualización: 8 de julio de 2025</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">1. Aceptación de los Términos</h2>
        <p className="mb-4">
          Al descargar, registrarse o utilizar la aplicación móvil <strong>CODYS</strong> (en adelante, <strong>la App</strong>), usted (en adelante, <strong>el Usuario</strong>) acepta y se compromete a cumplir los presentes Términos y Condiciones. Si no está de acuerdo con estos términos, no utilice la App.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">2. Descripción del Servicio</h2>
        <p className="mb-4">
          CODYS es una <strong>plataforma de intermediación tecnológica</strong> que tiene como único objetivo conectar a Usuarios que buscan servicios (<strong>Clientes</strong>) con personas que ofrecen dichos servicios (<strong>Prestadores</strong> o <strong>Comercios</strong>).
        </p>
        <p className="mb-4 p-4 border border-borde-tarjeta rounded-lg bg-tarjeta">
          <strong>CODYS NO es parte de la relación contractual o acuerdo</strong> que pueda surgir entre Clientes y Prestadores. No prestamos los servicios publicados, no empleamos a los Prestadores y no garantizamos la ejecución o calidad de los trabajos.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">3. Responsabilidad del Contenido y las Interacciones</h2>
        <p className="mb-4">
          Usted es el <strong>único y exclusivo responsable</strong> de la información que publica en su perfil (nombre, foto, descripción, etc.) y en las reseñas que realiza. Al publicar contenido, usted declara que es verídico y que posee los derechos sobre el mismo.
        </p>
        <ul className="list-disc list-inside mb-4 ml-4 space-y-2">
          <li><strong>Reseñas y Opiniones:</strong> Las reseñas son opiniones personales de los Usuarios y no representan la opinión de CODYS. No nos hacemos responsables por la veracidad o el contenido de las mismas.</li>
          <li><strong>Conducta del Usuario:</strong> Está estrictamente prohibido publicar contenido ilegal, difamatorio, odioso, obsceno, o que infrinja derechos de terceros. Nos reservamos el derecho de eliminar cualquier contenido y/o suspender cuentas que violen estas normas, sin previo aviso.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">4. Exclusión de Responsabilidad</h2>
        <p className="mb-4">
          Dado que nuestra función es meramente la de ser un nexo, usted entiende y acepta que CODYS <strong>NO es responsable por:</strong>
        </p>
        <ul className="list-disc list-inside mb-4 ml-4 space-y-2">
          <li><strong>Transacciones y Pagos:</strong> Todas las transacciones, acuerdos y pagos se realizan <strong>por fuera de la App</strong> y son de exclusiva responsabilidad de las partes involucradas. No intervenimos ni procesamos pagos.</li>
          <li><strong>Calidad del Servicio:</strong> No garantizamos la calidad, seguridad, legalidad o idoneidad de los servicios ofrecidos por los Prestadores.</li>
          <li><strong>Daños y Perjuicios:</strong> No seremos responsables por ningún daño directo, indirecto, incidental o consecuente que pueda surgir de la contratación o ejecución de un servicio, o de cualquier interacción entre Usuarios.</li>
          <li><strong>Veracidad de la Información:</strong> Aunque requerimos datos como nombre y foto, no podemos garantizar la identidad o la veracidad de la información de cada Usuario.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2">5. Obligaciones del Usuario</h2>
        <p className="mb-4">
          El Usuario se compromete a utilizar la App de buena fe, a proporcionar información veraz y a no utilizarla para fines ilícitos. El Usuario es responsable de tomar sus propias precauciones al contactar o contratar a otro Usuario de la plataforma.
        </p>
        
        <h3 className="text-xl font-semibold mt-4 mb-2 text-secundario">5.1. Obligación de Calificar</h3>
        <p className="mb-4">
          Las calificaciones son una parte fundamental de la comunidad de CODYS para mantener la confianza y la transparencia. Como condición para el uso de la plataforma, si un Usuario (actuando como Cliente o Prestador) acumula <strong>dos (2) o más servicios finalizados sin haber emitido la calificación</strong> correspondiente a la otra parte, su capacidad para solicitar nuevos servicios o aceptar nuevos trabajos será <strong>suspendida temporalmente</strong>.
        </p>
        <p className="mb-4">
          Para reactivar dichas funcionalidades, el Usuario deberá calificar al menos una de sus transacciones pendientes.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">6. Ley Aplicable y Jurisdicción</h2>
        <p className="mb-4">
          Estos Términos y Condiciones se regirán por las leyes de la República Argentina. Para cualquier disputa que surja en relación con la App, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad de Tunuyán, Mendoza, renunciando a cualquier otro fuero que pudiera corresponder.
        </p>
      </div>
    </div>
  );
};

export default TerminosYCondicionesPage;