// src/app/components/auth/RegistroForm.tsx
'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

// Componentes UI & Forms
// Se eliminan los imports de los componentes UI genéricos que vamos a reemplazar
// import Input from '@/app/components/ui/Input';
// import Button from '@/app/components/ui/Button';
import Modal from '@/app/components/common/Modal';
import SelectorLocalidad, { LocalidadSeleccionada } from '@/app/components/forms/SelectorLocalidad';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import SelectorRubro, { RubroSeleccionado } from '@/app/components/forms/SelectorRubro';

// JSON Data (sin cambios)
import categoriasData from '@/data/categorias.json';
import rubrosData from '@/data/rubro.json';


// --- Tipos (sin cambios) ---
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
  
  const { ref: matriculaRHFRef, ...matriculaRegisterProps } = register('matricula', {
    required: isMatriculaRequired ? 'La matrícula es obligatoria para esta profesión.' : false,
  });

  // Lógica de hooks y handlers (sin cambios)
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

  // Estilo base para todos los inputs 3D
  const inputClassName = "block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow";

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
          <button onClick={handleModalContinue} className="btn-primary">
            Entendido
          </button>
        </div>
      </Modal>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6" noValidate>
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-texto-secundario mb-2">Nombre</label>
          <input id="nombre" type="text" placeholder="Tu nombre" className={inputClassName} {...register('nombre', { required: 'El nombre es obligatorio' })} />
          {errors.nombre && <p className="text-sm text-error mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-texto-secundario mb-2">Apellido</label>
          <input id="apellido" type="text" placeholder="Tu apellido" className={inputClassName} {...register('apellido', { required: 'El apellido es obligatorio' })} />
          {errors.apellido && <p className="text-sm text-error mt-1">{errors.apellido.message}</p>}
        </div>

        <Controller name="localidad" control={control} rules={{ required: 'La localidad y provincia son obligatorias' }}
          render={({ field, fieldState }) => (
            <SelectorLocalidad id="localidad-selector" label="Localidad y Provincia" placeholder="Ingresa letras y selecciona..."
              onLocalidadSeleccionada={field.onChange} error={fieldState.error?.message} />
          )}
        />
        {errors.localidad && <p className="text-sm text-error -mt-3 mb-2">{errors.localidad.message}</p>}
        
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-texto-secundario mb-2">Email</label>
            <input id="email" type="email" placeholder="tu@email.com" autoComplete="email" className={inputClassName}
            {...register('email', { required: 'El email es obligatorio', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Email inválido' } })} />
            {errors.email && <p className="text-sm text-error mt-1">{errors.email.message}</p>}
        </div>

        <div>
            <label htmlFor="contrasena" className="block text-sm font-medium text-texto-secundario mb-2">Contraseña</label>
            <input id="contrasena" type="password" placeholder="Crea una contraseña segura" autoComplete="new-password" className={inputClassName}
            {...register('contrasena', { required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
            {errors.contrasena && <p className="text-sm text-error mt-1">{errors.contrasena.message}</p>}
        </div>
        
        <div>
            <label htmlFor="repetirContrasena" className="block text-sm font-medium text-texto-secundario mb-2">Repetir Contraseña</label>
            <input id="repetirContrasena" type="password" placeholder="Confirma tu contraseña" autoComplete="new-password" className={inputClassName}
            {...register('repetirContrasena', { required: 'Confirma la contraseña', validate: (value) => value === contrasenaValue || 'Las contraseñas no coinciden' })} />
            {errors.repetirContrasena && <p className="text-sm text-error mt-1">{errors.repetirContrasena.message}</p>}
        </div>

        <div>
            <label htmlFor="pin" className="block text-sm font-medium text-texto-secundario mb-2">PIN de Seguridad (4 dígitos)</label>
            <input id="pin" type="password" placeholder="Crea un PIN numérico" maxLength={4} inputMode="numeric" className={inputClassName}
            {...register('pin', { required: 'El PIN es obligatorio', minLength: { value: 4, message: 'El PIN debe tener 4 dígitos' }, maxLength: { value: 4, message: 'El PIN debe tener 4 dígitos' }, pattern: { value: /^\d{4}$/, message: 'El PIN solo debe contener números' } })} />
            {errors.pin && <p className="text-sm text-error mt-1">{errors.pin.message}</p>}
        </div>

        <div>
            <label htmlFor="repetirPin" className="block text-sm font-medium text-texto-secundario mb-2">Repetir PIN</label>
            <input id="repetirPin" type="password" placeholder="Confirma tu PIN" maxLength={4} inputMode="numeric" className={inputClassName}
            {...register('repetirPin', { required: 'Confirma el PIN', validate: (value) => value === pinValue || 'Los PINs no coinciden' })} />
            {errors.repetirPin && <p className="text-sm text-error mt-1">{errors.repetirPin.message}</p>}
        </div>

        <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-texto-secundario mb-2">Teléfono Celular</label>
            <input id="telefono" type="tel" placeholder="Ej: 2622 123456 (sin 0 ni 15)" autoComplete="tel" className={inputClassName}
            {...register('telefono', { required: 'El teléfono es obligatorio', pattern: { value: /^\d{7,15}$/, message: 'Número de teléfono inválido' } })} />
            {errors.telefono && <p className="text-sm text-error mt-1">{errors.telefono.message}</p>}
        </div>

        {rol === 'prestador' && (
          <>
            <hr className="my-6 border-borde-tarjeta" />
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
            
            <div>
              <label htmlFor="matriculaPrestador" className="block text-sm font-medium text-texto-secundario mb-2">{labelMatricula}</label>
              <input 
                id="matriculaPrestador" 
                type="text" 
                placeholder="Ej: MP-12345"
                className={inputClassName}
                {...matriculaRegisterProps}
                ref={(e) => {
                  matriculaRHFRef(e);
                  matriculaInputRef.current = e;
                }}
              />
              {errors.matricula && <p className="text-sm text-error mt-1">{errors.matricula.message}</p>}
            </div>

            <div>
              <label htmlFor="cuilCuitPrestador" className="block text-sm font-medium text-texto-secundario mb-2">CUIL / CUIT</label>
              <input id="cuilCuitPrestador" type="text" placeholder="Ej: 20-12345678-9" className={inputClassName}
                {...register('cuilCuit', {
                  required: rol === 'prestador' ? 'El CUIL/CUIT es obligatorio' : false,
                })} />
              {errors.cuilCuit && <p className="text-sm text-error mt-1">{errors.cuilCuit.message}</p>}
            </div>

            <div>
              <label htmlFor="descripcionPrestador" className="block text-sm font-medium text-texto-secundario mb-2">
                {labelDescripcion}
              </label>
              <textarea id="descripcionPrestador" rows={4} spellCheck="true"
                placeholder={placeholderDescripcion}
                className={inputClassName} // Se aplica el mismo estilo al textarea
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
            <hr className="my-6 border-borde-tarjeta" />
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
            
            <div>
              <label htmlFor="matriculaComercio" className="block text-sm font-medium text-texto-secundario mb-2">{labelMatricula}</label>
              <input 
                id="matriculaComercio" 
                type="text" 
                placeholder="Ej: MP-12345 (para profesionales)"
                className={inputClassName}
                {...matriculaRegisterProps}
                ref={(e) => {
                  matriculaRHFRef(e);
                  matriculaInputRef.current = e;
                }}
              />
              {errors.matricula && <p className="text-sm text-error mt-1">{errors.matricula.message}</p>}
            </div>
            
            <div>
              <label htmlFor="cuilCuitComercio" className="block text-sm font-medium text-texto-secundario mb-2">CUIL / CUIT</label>
              <input id="cuilCuitComercio" type="text" placeholder="Ej: 30-12345678-9" className={inputClassName}
                {...register('cuilCuit', {
                  required: rol === 'comercio' ? 'El CUIL/CUIT es obligatorio' : false,
                })} />
              {errors.cuilCuit && <p className="text-sm text-error mt-1">{errors.cuilCuit.message}</p>}
            </div>

            <div>
              <label htmlFor="descripcionComercio" className="block text-sm font-medium text-texto-secundario mb-2">
                {labelDescripcion}
              </label>
              <textarea id="descripcionComercio" rows={4} spellCheck="true"
                placeholder={placeholderDescripcion}
                className={inputClassName} // Se aplica el mismo estilo al textarea
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

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Procesando...' : 'Continuar a Verificación'}
          </button>
        </div>
      </form>
    </>
  );
}