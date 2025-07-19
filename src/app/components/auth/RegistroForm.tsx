// src/app/components/auth/RegistroForm.tsx
'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

// Componentes UI & Forms
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Modal from '@/app/components/common/Modal';
import SelectorLocalidad, { LocalidadSeleccionada } from '@/app/components/forms/SelectorLocalidad';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import SelectorRubro, { RubroSeleccionado } from '@/app/components/forms/SelectorRubro';

// JSON Data (No se usan aquí directamente pero los selectores sí)
import categoriasData from '@/data/categorias.json';
import rubrosData from '@/data/rubro.json';


// --- CORRECCIÓN 1: Actualizamos los tipos para que coincidan con la nueva estructura de datos ---
type CategoriaSeleccionadaConMatricula = CategoriaSeleccionada & {
  requiereMatricula?: boolean;
};

type RubroSeleccionadoConMatricula = Omit<RubroSeleccionado, 'subrubro'> & {
  subrubro?: {
    nombre: string;
    requiereMatricula: boolean;
  } | null;
};

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
  seleccionCategoria?: CategoriaSeleccionadaConMatricula | null;
  seleccionRubro?: RubroSeleccionadoConMatricula | null;
  matricula?: string;
  cuilCuit?: string;
  descripcion?: string;
};
// ---

interface RegistroFormProps {
  rol: 'usuario' | 'prestador' | 'comercio';
}

export default function RegistroForm({ rol }: RegistroFormProps) {
  const router = useRouter();

  const [isModalOpen, setModalOpen] = useState(false);
  const matriculaInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    setError,
    setValue,
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
  const seleccionCategoriaValue = watch('seleccionCategoria');
  const seleccionRubroValue = watch('seleccionRubro');

  const isMatriculaRequired =
    (rol === 'prestador' && !!seleccionCategoriaValue?.requiereMatricula) ||
    (rol === 'comercio' && !!seleccionRubroValue?.subrubro?.requiereMatricula);

  const labelMatricula = isMatriculaRequired
    ? 'Matrícula / Certificación (*Obligatorio*)'
    : 'Matrícula / Certificación (Opcional)';
  
  // --- CORRECCIÓN 3: Se combina la ref de react-hook-form con nuestra ref local ---
  const { ref: matriculaRHFRef, ...matriculaRegisterProps } = register('matricula', {
    required: isMatriculaRequired ? 'La matrícula es obligatoria para esta profesión.' : false,
  });
  // ---

  useEffect(() => {
    if (isMatriculaRequired) {
      setModalOpen(true);
    }
  }, [isMatriculaRequired]);

  useEffect(() => {
    if (!isMatriculaRequired) {
      if (watch('matricula')) {
        setValue('matricula', '');
      }
    }
  }, [isMatriculaRequired, setValue, watch]);
  
  const handleModalContinue = () => {
    setModalOpen(false);
    setTimeout(() => {
      matriculaInputRef.current?.focus();
    }, 100);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // --- CORRECCIÓN 2: Se elimina el bloque de validación manual 'formValido' ---
    // La validación ahora se maneja de forma más robusta y declarativa
    // en las 'rules' de los Controller y en el 'register' de cada campo.
    // handleSubmit ya previene el envío si hay errores.

    console.log('Datos del formulario VALIDADOS y listos para pasar a selfie:', data);
    console.log('Registrando como:', rol);

    try {
      sessionStorage.setItem('registroFormData', JSON.stringify(data));
      sessionStorage.setItem('registroFormRol', rol);
      console.log('Datos guardados en sessionStorage.');
    } catch (e) {
      console.error("Error al intentar guardar datos en sessionStorage:", e);
      setError("root.storageError", {
        type: "manual",
        message: "Hubo un problema al preparar tus datos. Intenta de nuevo más tarde."
      });
      return;
    }

    router.push(`/registro/selfie`);
  };

  const labelDescripcion = rol === 'prestador'
    ? "Describe tus Habilidades y Experiencia (máx. 500 caracteres)"
    : rol === 'comercio'
    ? "Describe tu Comercio o Servicio Profesional (máx. 500 caracteres)"
    : "";

  const placeholderDescripcion = rol === 'prestador'
    ? "Ej: Ofrezco servicios de plomería general, destapaciones, instalación de grifería..."
    : rol === 'comercio'
    ? "Ej: Venta de artículos de ferretería, pinturería y materiales de construcción..."
    : "";

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Matrícula Requerida"
      >
        <p className="text-base text-texto-secundario">
          Para la profesión/especialidad que seleccionaste, es obligatorio registrar un número de matrícula válido para poder continuar.
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleModalContinue}>
            Entendido
          </Button>
        </div>
      </Modal>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6" noValidate>
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
            
            <Input 
              id="matriculaPrestador" 
              label={labelMatricula} 
              type="text" 
              placeholder="Ej: MP-12345"
              {...matriculaRegisterProps} // <-- Usamos las props del register
              ref={(e) => { // <-- Combinamos las refs
                matriculaRHFRef(e);
                matriculaInputRef.current = e;
              }}
            />
            {errors.matricula && <p className="text-sm text-error -mt-3 mb-2">{errors.matricula.message}</p>}

            <Input id="cuilCuitPrestador" label="CUIL / CUIT" type="text" placeholder="Ej: 20-12345678-9"
              {...register('cuilCuit', {
                required: rol === 'prestador' ? 'El CUIL/CUIT es obligatorio' : false,
              })} />
            {errors.cuilCuit && <p className="text-sm text-error -mt-3 mb-2">{errors.cuilCuit.message}</p>}

            <div>
              <label htmlFor="descripcionPrestador" className="block text-sm font-medium text-texto-secundario mb-1">
                {labelDescripcion}
              </label>
              <textarea id="descripcionPrestador" rows={4} spellCheck="true"
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
                  // La validación ahora debe tener en cuenta que 'subrubros' es un array de objetos
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

            <Input 
              id="matriculaComercio" 
              label={labelMatricula}
              type="text" 
              placeholder="Ej: MP-12345 (para profesionales)"
              {...matriculaRegisterProps} // <-- Usamos las props del register
              ref={(e) => { // <-- Combinamos las refs
                matriculaRHFRef(e);
                matriculaInputRef.current = e;
              }}
            />
            {errors.matricula && <p className="text-sm text-error -mt-3 mb-2">{errors.matricula.message}</p>}
            
            <Input id="cuilCuitComercio" label="CUIL / CUIT" type="text" placeholder="Ej: 30-12345678-9"
              {...register('cuilCuit', {
                required: rol === 'comercio' ? 'El CUIL/CUIT es obligatorio' : false,
              })} />
            {errors.cuilCuit && <p className="text-sm text-error -mt-3 mb-2">{errors.cuilCuit.message}</p>}

            <div>
              <label htmlFor="descripcionComercio" className="block text-sm font-medium text-texto-secundario mb-1">
                {labelDescripcion}
              </label>
              <textarea id="descripcionComercio" rows={4} spellCheck="true"
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

        {errors.root?.storageError && <p className="text-sm text-error text-center mt-4">{errors.root.storageError.message}</p>}

        <Button type="submit" isLoading={isSubmitting} fullWidth className="mt-8">
          {isSubmitting ? 'Procesando...' : 'Continuar a Verificación'}
        </Button>
      </form>
    </>
  );
}