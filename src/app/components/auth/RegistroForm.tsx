// src/app/components/auth/RegistroForm.tsx
'use client';

import {
  useForm,
  SubmitHandler,
  Controller
} from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import SelectorLocalidad, { LocalidadSeleccionada } from '@/app/components/forms/SelectorLocalidad';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import SelectorRubro, { RubroSeleccionado } from '@/app/components/forms/SelectorRubro';

// JSON Data (para validaciones en cliente de subcategoría/subrubro)
import categoriasData from '@/data/categorias.json';
import rubrosData from '@/data/rubro.json';

type FormValues = {
  nombre: string;
  apellido: string;
  localidad: LocalidadSeleccionada | null;
  email: string;
  contrasena: string;
  repetirContrasena: string;
  pin: string;
  repetirPin: string;
  telefono: string;
  // Campos específicos de rol
  seleccionCategoria?: CategoriaSeleccionada | null;
  seleccionRubro?: RubroSeleccionado | null;
  matricula?: string;
  cuilCuit?: string;
  descripcion?: string; // Un solo campo de descripción, se usará para prestador o comercio
};

interface RegistroFormProps {
  rol: 'usuario' | 'prestador' | 'comercio'; // Tipado más estricto para rol
}

export default function RegistroForm({ rol }: RegistroFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    setError,
    // clearErrors, // Podrías usarlo si necesitas limpiar errores manualmente
  } = useForm<FormValues>({
    defaultValues: {
      nombre: '',
      apellido: '',
      localidad: null,
      email: '',
      contrasena: '',
      repetirContrasena: '',
      pin: '',
      repetirPin: '',
      telefono: '',
      seleccionCategoria: null,
      seleccionRubro: null,
      matricula: '',
      cuilCuit: '',
      descripcion: '',
    },
  });

  const contrasenaValue = watch('contrasena');
  const pinValue = watch('pin');

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    let formValido = true;

    // ----- INICIO DE VALIDACIONES MANUALES ADICIONALES (PRE-SUBMIT) -----
    // Aunque react-hook-form maneja las validaciones de 'rules',
    // podemos tener chequeos extra aquí si la lógica es muy compleja o
    // para asegurar que los datos de los selectores personalizados son correctos.

    if (!data.localidad) {
        // La 'rule' en el Controller debería haber seteado 'errors.localidad'
        // Si aún así queremos forzar un error o verificarlo aquí:
        // setError('localidad', { type: 'manual', message: 'La localidad es obligatoria (manual check).' });
        // formValido = false;
    }

    if (rol === 'prestador') {
      const categoriaData = data.seleccionCategoria;
      if (!categoriaData?.categoria) {
        setError('seleccionCategoria', { type: 'manual', message: 'La categoría es obligatoria para prestadores.' });
        formValido = false;
      } else {
        const categoriaActual = categoriasData.categorias.find(c => c.nombre === categoriaData.categoria);
        if (categoriaActual && categoriaActual.subcategorias.length > 0 && !categoriaData.subcategoria) {
          setError('seleccionCategoria', { type: 'manual', message: 'La subcategoría es obligatoria para la categoría seleccionada.' });
          formValido = false;
        }
      }
      if (!data.cuilCuit && !errors.cuilCuit) { // Si no hay error de 'required' de react-hook-form
        setError('cuilCuit', { type: 'manual', message: 'El CUIL/CUIT es obligatorio para prestadores.' });
        formValido = false;
      }
      if (!data.descripcion && !errors.descripcion) { // Si no hay error de 'required' de react-hook-form
        setError('descripcion', { type: 'manual', message: 'La descripción de servicios es obligatoria para prestadores.' });
        formValido = false;
      }
    }

    if (rol === 'comercio') {
      const rubroData = data.seleccionRubro;
      if (!rubroData?.rubro) {
        setError('seleccionRubro', { type: 'manual', message: 'El rubro es obligatorio para comercios/profesionales.' });
        formValido = false;
      } else {
        const rubroActual = rubrosData.rubros.find(r => r.nombre === rubroData.rubro);
        if (rubroActual && rubroActual.subrubros.length > 0 && !rubroData.subrubro) {
          setError('seleccionRubro', { type: 'manual', message: 'La especialidad/subrubro es obligatorio para el rubro seleccionado.' });
          formValido = false;
        }
      }
      if (!data.cuilCuit && !errors.cuilCuit) {
        setError('cuilCuit', { type: 'manual', message: 'El CUIL/CUIT es obligatorio para comercios/profesionales.' });
        formValido = false;
      }
      if (!data.descripcion && !errors.descripcion) {
        setError('descripcion', { type: 'manual', message: 'La descripción del comercio/servicio es obligatoria.' });
        formValido = false;
      }
    }

    // Comprobar si hay errores de validación de react-hook-form
    // o si nuestras validaciones manuales encontraron algo.
    if (!formValido || Object.keys(errors).length > 0) {
      // Si alguna validación manual falló, detenemos.
      // Object.keys(errors).length > 0 verifica si react-hook-form encontró errores.
      // handleSubmit ya previene la ejecución de onSubmit si hay errores de 'rules'.
      // Este bloque es más para nuestras validaciones manuales con setError.
      console.error("Errores de validación en el formulario. Datos no enviados:", errors);
      if (!formValido) return; // Detener si nuestras validaciones manuales fallaron
      // Si solo hay errores de react-hook-form, handleSubmit ya no nos habría llamado,
      // pero este log ayuda a depurar si algo inesperado ocurre.
    }
    // ----- FIN DE VALIDACIONES MANUALES ADICIONALES -----


    console.log('Datos del formulario VALIDADOS y listos para pasar a selfie:', data);
    console.log('Registrando como:', rol);

    // --- Guardar datos en sessionStorage ANTES de redirigir ---
    try {
      sessionStorage.setItem('registroFormData', JSON.stringify(data));
      sessionStorage.setItem('registroFormRol', rol); // Guardamos el rol también
      console.log('Datos guardados en sessionStorage.');
    } catch (e) {
      console.error("Error al intentar guardar datos en sessionStorage:", e);
      setError("root.storageError", {
        type: "manual",
        message: "Hubo un problema al preparar tus datos. Intenta de nuevo más tarde."
      });
      return; // No redirigir si no se pudieron guardar los datos
    }

    // Redirigir a la pantalla de selfie
    // Ya no necesitamos pasar el rol como query param porque lo guardamos en sessionStorage
    router.push(`/registro/selfie`);
  };


  // Labels y placeholders dinámicos para el campo de descripción
  const labelDescripcion = rol === 'prestador'
    ? "Describe tus Habilidades y Experiencia (máx. 500 caracteres)"
    : rol === 'comercio'
    ? "Describe tu Comercio o Servicio Profesional (máx. 500 caracteres)"
    : ""; // No se muestra para rol 'usuario'

  const placeholderDescripcion = rol === 'prestador'
    ? "Ej: Ofrezco servicios de plomería general, destapaciones, instalación de grifería..."
    : rol === 'comercio'
    ? "Ej: Venta de artículos de ferretería, pinturería y materiales de construcción..."
    : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
      {/* --- CAMPOS COMUNES --- */}
      <Input id="nombre" label="Nombre" type="text" placeholder="Tu nombre" {...register('nombre', { required: 'El nombre es obligatorio' })} />
      {errors.nombre && <p className="text-sm text-error -mt-3 mb-2">{errors.nombre.message}</p>}

      <Input id="apellido" label="Apellido" type="text" placeholder="Tu apellido" {...register('apellido', { required: 'El apellido es obligatorio' })} />
      {errors.apellido && <p className="text-sm text-error -mt-3 mb-2">{errors.apellido.message}</p>}

      <Controller name="localidad" control={control} rules={{ required: 'La localidad y provincia son obligatorias' }}
        render={({ field, fieldState }) => (
          <SelectorLocalidad id="localidad-selector" label="Localidad y Provincia" placeholder="Ingresa letras y selecciona..."
            onLocalidadSeleccionada={field.onChange} error={fieldState.error?.message} />
        )}
      />
      {/* El error de localidad ya se pasa al componente SelectorLocalidad,
          pero un error global se puede mostrar aquí si es necesario. */}
      {errors.localidad && <p className="text-sm text-error -mt-3 mb-2">{errors.localidad.message}</p>}


      <Input id="email" label="Email" type="email" placeholder="tu@email.com" autoComplete="email"
        {...register('email', { required: 'El email es obligatorio', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Email inválido' } })} />
      {errors.email && <p className="text-sm text-error -mt-3 mb-2">{errors.email.message}</p>}

      <Input id="contrasena" label="Contraseña" type="password" placeholder="Crea una contraseña segura" autoComplete="new-password"
        {...register('contrasena', { required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
      {errors.contrasena && <p className="text-sm text-error -mt-3 mb-2">{errors.contrasena.message}</p>}

      <Input id="repetirContrasena" label="Repetir Contraseña" type="password" placeholder="Confirma tu contraseña" autoComplete="new-password"
        {...register('repetirContrasena', { required: 'Confirma la contraseña', validate: (value) => value === contrasenaValue || 'Las contraseñas no coinciden' })} />
      {errors.repetirContrasena && <p className="text-sm text-error -mt-3 mb-2">{errors.repetirContrasena.message}</p>}

      <Input id="pin" label="PIN de Seguridad (4 dígitos)" type="password" placeholder="Crea un PIN numérico" maxLength={4} inputMode="numeric"
        {...register('pin', { required: 'El PIN es obligatorio', minLength: { value: 4, message: 'El PIN debe tener 4 dígitos' }, maxLength: { value: 4, message: 'El PIN debe tener 4 dígitos' }, pattern: { value: /^\d{4}$/, message: 'El PIN solo debe contener números' } })} />
      {errors.pin && <p className="text-sm text-error -mt-3 mb-2">{errors.pin.message}</p>}

      <Input id="repetirPin" label="Repetir PIN" type="password" placeholder="Confirma tu PIN" maxLength={4} inputMode="numeric"
        {...register('repetirPin', { required: 'Confirma el PIN', validate: (value) => value === pinValue || 'Los PINs no coinciden' })} />
      {errors.repetirPin && <p className="text-sm text-error -mt-3 mb-2">{errors.repetirPin.message}</p>}

      <Input id="telefono" label="Teléfono Celular" type="tel" placeholder="Ej: 2622 123456 (sin 0 ni 15)" autoComplete="tel"
        {...register('telefono', { required: 'El teléfono es obligatorio', pattern: { value: /^\d{7,15}$/, message: 'Número de teléfono inválido' } })} />
      {errors.telefono && <p className="text-sm text-error -mt-3 mb-2">{errors.telefono.message}</p>}


      {/* --- CAMPOS ESPECÍFICOS DEL ROL --- */}
      {rol === 'prestador' && (
        <>
          <hr className="my-6 border-gray-300 dark:border-gray-700" />
          <h2 className="text-lg font-semibold text-primario mb-3">
            Información de Prestador de Servicios
          </h2>
          <Controller name="seleccionCategoria" control={control}
            rules={{
              validate: (value) => {
                if (!value?.categoria) return 'La categoría es obligatoria.';
                const categoriaActual = categoriasData.categorias.find(c => c.nombre === value.categoria);
                if (categoriaActual && categoriaActual.subcategorias.length > 0 && !value.subcategoria) {
                  return 'La subcategoría es obligatoria para esta categoría.';
                }
                return true;
              }
            }}
            render={({ field, fieldState }) => (
              <SelectorCategoria idCategoria="categoria-servicio" idSubcategoria="subcategoria-servicio"
                onCategoriaChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          {errors.seleccionCategoria && <p className="text-sm text-error -mt-3 mb-2">{errors.seleccionCategoria.message}</p>}

          <Input id="matriculaPrestador" label="Matrícula / Certificación (Opcional)" type="text" placeholder="Ej: MP-12345" {...register('matricula')} />

          <Input id="cuilCuitPrestador" label="CUIL / CUIT" type="text" placeholder="Ej: 20-12345678-9"
            {...register('cuilCuit', {
              required: rol === 'prestador' ? 'El CUIL/CUIT es obligatorio' : false,
              // pattern: { value: /^\d{2}-\d{8}-\d{1}$/, message: 'Formato de CUIL/CUIT inválido' }
            })} />
          {errors.cuilCuit && <p className="text-sm text-error -mt-3 mb-2">{errors.cuilCuit.message}</p>}

          <div>
            <label htmlFor="descripcionPrestador" className="block text-sm font-medium text-texto-secundario mb-1">
              {labelDescripcion}
            </label>
            <textarea id="descripcionPrestador" rows={4}
              placeholder={placeholderDescripcion}
              className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark"
              maxLength={500}
              {...register('descripcion', {
                required: rol === 'prestador' ? 'La descripción de tus servicios es obligatoria' : false,
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              })} />
          </div>
          {errors.descripcion && <p className="text-sm text-error mt-1">{errors.descripcion.message}</p>}
        </>
      )}

      {rol === 'comercio' && (
        <>
          <hr className="my-6 border-gray-300 dark:border-gray-700" />
          <h2 className="text-lg font-semibold text-primario mb-3">
            Información de Comercio/Profesional
          </h2>
          <Controller name="seleccionRubro" control={control}
            rules={{
              validate: (value) => {
                if (!value?.rubro) return 'El rubro es obligatorio.';
                const rubroActual = rubrosData.rubros.find(r => r.nombre === value.rubro);
                if (rubroActual && rubroActual.subrubros.length > 0 && !value.subrubro) {
                  return 'La especialidad/subrubro es obligatorio.';
                }
                return true;
              }
            }}
            render={({ field, fieldState }) => (
              <SelectorRubro idRubro="rubro-comercio" idSubrubro="subrubro-comercio"
                onRubroChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          {errors.seleccionRubro && <p className="text-sm text-error -mt-3 mb-2">{errors.seleccionRubro.message}</p>}

          <Input id="matriculaComercio" label="Matrícula Profesional (Opcional)" type="text" placeholder="Ej: MP-12345 (para profesionales)" {...register('matricula')} />
          
          <Input id="cuilCuitComercio" label="CUIL / CUIT" type="text" placeholder="Ej: 30-12345678-9"
            {...register('cuilCuit', {
              required: rol === 'comercio' ? 'El CUIL/CUIT es obligatorio' : false,
            })} />
          {errors.cuilCuit && <p className="text-sm text-error -mt-3 mb-2">{errors.cuilCuit.message}</p>}

          <div>
            <label htmlFor="descripcionComercio" className="block text-sm font-medium text-texto-secundario mb-1">
              {labelDescripcion}
            </label>
            <textarea id="descripcionComercio" rows={4}
              placeholder={placeholderDescripcion}
              className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark"
              maxLength={500}
              {...register('descripcion', {
                required: rol === 'comercio' ? 'La descripción es obligatoria' : false,
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              })} />
          </div>
          {errors.descripcion && <p className="text-sm text-error mt-1">{errors.descripcion.message}</p>}
        </>
      )}

      {/* Mensaje de error global del formulario, por ejemplo, para errores de sessionStorage */}
      {errors.root?.storageError && <p className="text-sm text-error text-center mt-4">{errors.root.storageError.message}</p>}


      <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-8">
        {isSubmitting ? 'Procesando...' : 'Continuar a Verificación'}
      </Button>
    </form>
  );
}