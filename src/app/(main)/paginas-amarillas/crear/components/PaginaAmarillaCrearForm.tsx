// src/app/(main)/paginas-amarillas/crear/components/PaginaAmarillaCrearForm.tsx
'use client';

import React, { useState, useEffect, forwardRef, InputHTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { RolPaginaAmarilla } from '@/types/paginaAmarilla';
import { DIAS_SEMANA_CONFIG_INICIAL } from '@/types/horarios';
import {
  CreatePaginaAmarillaDTO,
  createPaginaAmarilla,
} from '@/lib/services/paginasAmarillasService';
import { uploadFileAndGetURL } from '@/lib/firebase/storage';
import {
  useUserStore,
  UserProfile as BaseUserProfile,
} from '@/store/userStore';

// UI Components
import Input from '@/app/components/ui/Input';
import Textarea from '@/app/components/ui/Textarea';
import Button from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';
import Avatar from '@/app/components/common/Avatar';
import SelectorHorariosAtencion from '@/app/components/paginas-amarillas/SelectorHorariosAtencion';
import PaginaAmarillaFormPreview, {
  PaginaAmarillaFormValues,
} from '@/app/components/paginas-amarillas/PaginaAmarillaFormPreview';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearPublicacionPA from '@/app/components/ayuda-contenido/AyudaCrearPublicacionPA';

// --- INICIO: NUEVO COMPONENTE INPUT CON PREFIJO (VERSIÓN FINAL) ---
interface InputConPrefijoProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  prefijo: string;
  error?: string;
}
const palette = {
  dark: {
    tarjeta: '#184840',
    resalte: '#EFC71D',
  },
  light: {
    tarjeta: '#184840',
    resalte: '#EFC71D',
  },
};
const InputConPrefijo = forwardRef<HTMLInputElement, InputConPrefijoProps>(
  ({ id, label, prefijo, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
          {label}
        </label>
        {/* El div exterior agrupa todo y maneja el borde y el foco */}
        <div className="flex items-stretch rounded-md border border-gray-300 dark:border-gray-600 focus-within:ring-1 focus-within:ring-primario focus-within:border-primario overflow-hidden">
          {/* El span del prefijo con su propio fondo y borde derecho */}
          <span className="flex items-center whitespace-nowrap bg-gray-100 dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 text-sm border-r border-gray-300 dark:border-gray-600">
            {prefijo}
          </span>
          {/* El input sin borde propio para que se una visualmente */}
          <input
            id={id}
            ref={ref}
            {...props}
            className="block w-full px-3 py-2 bg-fondo border-0 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm text-texto dark:text-texto-dark"
          />
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
InputConPrefijo.displayName = 'InputConPrefijo';
// --- FIN: NUEVO COMPONENTE ---


// Esquemas Zod (sin cambios)
const rangoHorarioSchema = z.object({
  de: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
  a: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
});
const estadoHorarioDiaSchema = z.union([
  z.literal('cerrado'),
  z.literal('abierto24h'),
  z.array(rangoHorarioSchema),
]);
const configuracionDiaSchema = z.object({
  diaNombre: z.string(),
  diaAbreviatura: z.string(),
  diaIndice: z.number(),
  estado: estadoHorarioDiaSchema,
});

// --- Esquema de formulario MODIFICADO para los campos sin prefijo ---
const paginaAmarillaSchema = z.object({
  nombrePublico: z.string().min(3, 'El nombre público es requerido (mín. 3 caracteres)').max(100),
  tituloCard: z.string().max(100).optional().nullable(),
  subtituloCard: z.string().max(150).optional().nullable(),
  descripcion: z.string().max(1000).optional().nullable(),
  imagenFile: z
    .custom<File>()
    .optional()
    .refine(f => !f || (f instanceof File && f.size > 0), 'El archivo de imagen no puede estar vacío si se selecciona.')
    .refine(f => !f || (f instanceof File && f.size < 5 * 1024 * 1024), 'La imagen no debe exceder los 5MB.')
    .refine(f => !f || (f instanceof File && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)), 'Formato de imagen no válido (JPG, PNG, WEBP).'),
  telefonoContacto: z.string().regex(/^\d{7,15}$/, 'Número no válido. Ingresa solo los números, sin el +54, 0 o 15.').optional().or(z.literal('')).nullable(),
  emailContacto: z.string().email('Email no válido').optional().or(z.literal('')).nullable(),
  enlaceWeb: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')).nullable(),
  enlaceInstagram: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')).nullable(),
  enlaceFacebook: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')).nullable(),
  direccionVisible: z.string().max(200).optional().nullable(),
  horarios: z.array(configuracionDiaSchema).optional().nullable(),
  realizaEnvios: z.boolean().optional().nullable(),
});
type FormValues = z.infer<typeof paginaAmarillaSchema>;

// Tipos de perfil extendidos
interface ProvinciaEnLocalidad { id: string; nombre: string; }
interface LocalidadPerfil { id: string; nombre: string; provincia?: ProvinciaEnLocalidad; provinciaNombre?: string; }
interface RubroPerfil { rubro: string; subrubro?: string; }
interface CategoriaPerfil { categoria: string; subcategoria?: string; }
interface UserProfileExtra { nombre?: string; selfieURL?: string; provincia?: string | ProvinciaEnLocalidad; localidad?: LocalidadPerfil; rubro?: RubroPerfil; categoria?: CategoriaPerfil; }
type UserProfile = BaseUserProfile & UserProfileExtra;

const PaginaAmarillaCrearForm: React.FC = () => {
  const router = useRouter();
  const currentUser = useUserStore(s => s.currentUser) as UserProfile | null;
  const originalRole = useUserStore(s => s.originalRole);
  const { resolvedTheme } = useTheme(); // <-- Esta línea
  const P = resolvedTheme === 'dark' ? palette.dark : palette.light;
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(paginaAmarillaSchema),
    defaultValues: {
      nombrePublico: '',
      tituloCard: '',
      subtituloCard: '',
      descripcion: '',
      telefonoContacto: '',
      emailContacto: '',
      enlaceWeb: '',
      enlaceInstagram: '',
      enlaceFacebook: '',
      direccionVisible: '',
      horarios: DIAS_SEMANA_CONFIG_INICIAL.map(dia => ({
        ...dia,
        estado: Array.isArray(dia.estado) ? dia.estado.map(r => ({ ...r })) : dia.estado,
      })),
      realizaEnvios: false,
    },
  });

  const formDataForPreview = watch();

  useEffect(() => {
    if (currentUser && originalRole === 'prestador') {
      setValue('nombrePublico', currentUser.nombre || '');
      setPreviewImage(currentUser.selfieURL);
    }
  }, [currentUser, originalRole, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async data => {
    setIsLoading(true);
    setApiError(null);

    if (!currentUser || (originalRole !== 'prestador' && originalRole !== 'comercio')) {
      setApiError('Usuario no autorizado o rol incorrecto para crear una publicación.');
      setIsLoading(false);
      return;
    }

    const creatorRole = originalRole as RolPaginaAmarilla;
    let finalImageUrl: string | null = null;

    if (creatorRole === 'comercio' && data.imagenFile) {
      try {
        const timestamp = Date.now();
        const fileExt = data.imagenFile.name.split('.').pop() ?? 'jpg';
        const filePath = `paginas_amarillas_portadas/${currentUser.uid}/logo-${timestamp}.${fileExt}`;
        finalImageUrl = await uploadFileAndGetURL(data.imagenFile, filePath);
      } catch (err) {
        console.error('Error subiendo imagen:', err);
        setApiError('Error al subir la imagen. Intenta nuevamente.');
        setIsLoading(false);
        return;
      }
    } else if (creatorRole === 'prestador') {
      finalImageUrl = currentUser.selfieURL || null;
    }

    const provinciaNombre = currentUser.localidad?.provinciaNombre || 'No especificada';
    const localidadNombre = currentUser.localidad?.nombre ?? 'Desconocida';
    const rubroPayload = creatorRole === 'comercio' ? currentUser.rubro?.rubro : undefined;
    const subRubroPayload = creatorRole === 'comercio' ? currentUser.rubro?.subrubro : undefined;
    const categoriaPayload = creatorRole === 'prestador' ? currentUser.categoria?.categoria : undefined;
    const subCategoriaPayload = creatorRole === 'prestador' ? currentUser.categoria?.subcategoria : undefined;
    
    // --- LÓGICA DE GUARDADO MODIFICADA para unir prefijos ---
    const payload: CreatePaginaAmarillaDTO = {
      nombrePublico: data.nombrePublico,
      creatorRole,
      provincia: provinciaNombre,
      localidad: localidadNombre,
      tituloCard: data.tituloCard || null,
      subtituloCard: data.subtituloCard || null,
      descripcion: data.descripcion || null,
      imagenPortadaUrl: finalImageUrl,
      telefonoContacto: data.telefonoContacto ? `+54${data.telefonoContacto.replace(/\s/g, '')}` : null,
      emailContacto: data.emailContacto || null,
      enlaceWeb: data.enlaceWeb ? `https://${data.enlaceWeb}` : null,
      enlaceInstagram: data.enlaceInstagram ? `https://instagram.com/${data.enlaceInstagram}` : null,
      enlaceFacebook: data.enlaceFacebook ? `https://facebook.com/${data.enlaceFacebook}` : null,
      direccionVisible: data.direccionVisible || null,
      horarios: data.horarios ?? null,
      realizaEnvios: creatorRole === 'comercio' ? (data.realizaEnvios ?? false) : null,
      rubro: rubroPayload || null,
      subRubro: subRubroPayload || null,
      categoria: categoriaPayload || null,
      subCategoria: subCategoriaPayload || null,
      activa: true,
    };

    try {
      await createPaginaAmarilla(currentUser.uid, payload);
      const destino = creatorRole === 'comercio' ? '/bienvenida?rol=comercio' : '/bienvenida?rol=prestador';
      router.push(destino);
    } catch (err) {
      console.error('Error al crear la publicación:', err);
      setApiError('No se pudo crear la publicación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || !originalRole) {
    return <p className="p-4 text-center">Cargando datos del usuario...</p>;
  }
  const rolValido = originalRole === 'prestador' || originalRole === 'comercio' ? originalRole : undefined;
  if (rolValido === undefined) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">
          Tu rol de usuario ({originalRole}) no te permite crear publicaciones en Páginas Amarillas.
        </p>
      </div>
    );
  }

  const provinciaDisplay = currentUser.localidad?.provinciaNombre || 'No especificada';
  const localidadDisplay = currentUser.localidad?.nombre || 'No especificada';

  const formValuesForPreview: PaginaAmarillaFormValues = {
    ...formDataForPreview,
    imagenPortadaUrl: previewImage,
    provincia: provinciaDisplay,
    localidad: localidadDisplay,
    creatorRole: rolValido,
    rubro: currentUser.rubro?.rubro,
    subRubro: currentUser.rubro?.subrubro,
    categoria: currentUser.categoria?.categoria,
    subCategoria: currentUser.categoria?.subcategoria,
    horarios: formDataForPreview.horarios || undefined,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6">
      <div className="lg:w-2/3 xl:w-3/5 space-y-6">
  
  {/* --- INICIO DE LA MODIFICACIÓN --- */}
  {/* 1. Contenedor Flexbox para alinear los 3 elementos */}
  <div className="flex items-center justify-between">
    
    {/* 2. Elemento Izquierdo: El Botón de Ayuda */}
    <div>
      <BotonAyuda>
        <AyudaCrearPublicacionPA />
      </BotonAyuda>
    </div>
    
    {/* 3. Elemento Central: El Título */}
    <h1 className="text-2xl font-bold text-texto-principal text-center">
      Crea tu Publicación en Páginas Amarillas
    </h1>
    
    {/* 4. Elemento Derecho: Un espacio invisible que ocupa lo mismo que el botón */}
    <div className="w-12 h-12"></div> {/* Ancho y alto igual al de BotonAyuda */}
    
  </div>
  {/* --- FIN DE LA MODIFICACIÓN --- */}

  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4"> {/* Añadimos margen al form */}
    <section>
      {/* El subtítulo se mantiene limpio, sin el botón */}
      <h2 className="text-lg font-semibold text-texto-principal mb-2">
        {rolValido === 'comercio' ? 'Logo del Negocio' : 'Foto de Perfil'}
      </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar selfieUrl={previewImage} nombre={watch('nombrePublico')} size={100} />
              <div className="flex-grow">
                {rolValido === 'comercio' ? (
                  <Controller
                    name="imagenFile" control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <label htmlFor="imagenFile" className="block text-sm font-medium text-texto-secundario mb-1">
                          Seleccionar Logo (JPG, PNG, WEBP) - Máx 5MB
                        </label>
                        <input
                          id="imagenFile" type="file" accept="image/jpeg,image/png,image/webp"
                          className="block w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primario/10 file:text-primario hover:file:bg-primario/20"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? undefined;
                            field.onChange(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPreviewImage(reader.result as string);
                              reader.readAsDataURL(file);
                            } else { setPreviewImage(undefined); }
                          }}
                        />
                        {fieldState.error && <p className="text-sm text-red-500 mt-1">{fieldState.error.message as string}</p>}
                        {previewImage && (<button type="button" className="mt-2 text-xs text-red-600" onClick={() => { setPreviewImage(undefined); field.onChange(null); }}>Quitar imagen</button>)}
                      </>
                    )}
                  />
                ) : (
                  <div className="text-sm text-texto-secundario p-3 bg-fondo-secundario rounded-md border border-borde-tarjeta">
                    <p>Tu foto de perfil se usará como imagen de portada.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">
              Información Principal
            </h2>
            <Controller name="nombrePublico" control={control} render={({ field }) => (<Input id="nombrePublico" label={rolValido === 'comercio' ? 'Nombre Público del Comercio*' : 'Tu Nombre Público*'} {...field} value={field.value ?? ''} placeholder={rolValido === 'comercio' ? 'Ej: Mi Super Tienda' : 'Ej: Juan Pérez Electricista'} disabled={rolValido === 'prestador'}/>)} />
            {errors.nombrePublico && (<p className="text-sm text-red-500 -mt-3 mb-3">{errors.nombrePublico.message}</p>)}
            <Controller name="tituloCard" control={control} render={({ field }) => (<Input id="tituloCard" label="Título para la Tarjeta (Opcional)" {...field} value={field.value ?? ''} placeholder="Ej: ¡La Mejor Calidad! / Servicios 24hs"/>)} />
            {errors.tituloCard && (<p className="text-sm text-red-500 -mt-3 mb-3">{errors.tituloCard.message}</p>)}
            <Controller name="subtituloCard" control={control} render={({ field }) => (<Input id="subtituloCard" label="Subtítulo para la Tarjeta (Opcional)" {...field} value={field.value ?? ''} placeholder="Ej: Expertos en tecnología / Tu solución en casa"/>)} />
            {errors.subtituloCard && (<p className="text-sm text-red-500 -mt-3 mb-3">{errors.subtituloCard.message}</p>)}
            <Controller name="descripcion" control={control} render={({ field }) => (<Textarea id="descripcion" spellCheck="true" label="Descripción (Párrafo)" {...field} value={field.value ?? ''} placeholder="Describe tus servicios, productos, historia, etc." rows={4}/>)} />
            {errors.descripcion && (<p className="text-sm text-red-500 -mt-3 mb-3">{errors.descripcion.message}</p>)}
          </section>

          {/* --- INICIO: SECCIÓN DE CONTACTO MODIFICADA --- */}
          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">
              Información de Contacto
            </h2>
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-0">
              <Controller
                name="telefonoContacto" control={control}
                render={({ field }) => (
                  <InputConPrefijo
  id="telefonoContacto" label="Teléfono de Contacto" type="tel"
  prefijo="+54 9"
  {...field}
  value={field.value ?? ''}
  placeholder="261 1234567 (sin 0 ni 15)"
/>
                )}
              />
              {errors.telefonoContacto && (<p className="text-sm text-red-500 mt-1 mb-3">{errors.telefonoContacto.message}</p>)}

              <Controller name="emailContacto" control={control} render={({ field }) => (<Input id="emailContacto" label="Email de Contacto" type="email" {...field} value={field.value ?? ''} placeholder="contacto@ejemplo.com"/>)}/>
              {errors.emailContacto && (<p className="text-sm text-red-500 mt-1 mb-3">{errors.emailContacto.message}</p>)}
            
              <Controller name="enlaceWeb" control={control} render={({ field }) => (<InputConPrefijo id="enlaceWeb" label="Página Web (Opcional)" type="text" prefijo="https://" {...field} value={field.value ?? ''} placeholder="www.ejemplo.com"/>)}/>
              {errors.enlaceWeb && (<p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceWeb.message}</p>)}

              <Controller name="enlaceInstagram" control={control} render={({ field }) => (<InputConPrefijo id="enlaceInstagram" label="Instagram (Opcional)" type="text" prefijo="https://instagram.com/" {...field} value={field.value ?? ''} placeholder="tu_usuario"/>)}/>
              {errors.enlaceInstagram && (<p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceInstagram.message}</p>)}

              <Controller name="enlaceFacebook" control={control} render={({ field }) => (<InputConPrefijo id="enlaceFacebook" label="Facebook (Opcional)" type="text" prefijo="https://facebook.com/" {...field} value={field.value ?? ''} placeholder="tu.pagina"/>)}/>
              {errors.enlaceFacebook && (<p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceFacebook.message}</p>)}
            </div>
          </section>
          {/* --- FIN: SECCIÓN DE CONTACTO MODIFICADA --- */}

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">
              Ubicación (Información de tu Perfil)
            </h2>
            <Controller name="direccionVisible" control={control} render={({ field }) => (<Input id="direccionVisible" label="Dirección Pública (Opcional, si quieres mostrarla)" {...field} value={field.value ?? ''} placeholder="Calle Falsa 123, Barrio"/>)}/>
            {errors.direccionVisible && (<p className="text-sm text-red-500 -mt-3 mb-3">{errors.direccionVisible.message}</p>)}
            <div className="mt-2 space-y-1 text-sm text-texto-secundario bg-fondo-secundario p-3 rounded-md border border-borde-tarjeta">
              <p><strong>Provincia:</strong> {provinciaDisplay}</p>
              <p><strong>Localidad:</strong> {localidadDisplay}</p>
              {rolValido === 'comercio' && (<>
                  <p><strong>Rubro:</strong>{' '}{currentUser.rubro?.rubro ?? 'No especificado'}</p>
                  {currentUser.rubro?.subrubro && (<p><strong>Sub-Rubro:</strong> {currentUser.rubro.subrubro}</p>)}
              </>)}
              {rolValido === 'prestador' && (<>
                  <p><strong>Categoría:</strong>{' '}{currentUser.categoria?.categoria ?? 'No especificada'}</p>
                  {currentUser.categoria?.subcategoria && (<p><strong>Sub-Categoría:</strong> {currentUser.categoria.subcategoria}</p>)}
              </>)}
              <p className="text-xs text-texto-placeholder mt-2">Esta información se toma de tu perfil y no es editable aquí.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">
              Horarios de Atención
            </h2>
            <Controller name="horarios" control={control} render={({ field }) => (<SelectorHorariosAtencion horariosIniciales={field.value || undefined} onChange={field.onChange}/>)}/>
            {errors.horarios && (<p className="text-sm text-red-500 mt-1 mb-3">{typeof errors.horarios.message === 'string' ? errors.horarios.message : 'Error en horarios.'}</p>)}
          </section>

          {rolValido === 'comercio' && (
            <section>
              <h2 className="text-lg font-semibold text-texto-principal mb-2">Otros Detalles</h2>
              <Controller name="realizaEnvios" control={control} render={({ field }) => (<Checkbox id="realizaEnvios" label="¿Realizas envíos?" checked={field.value ?? false} onCheckedChange={field.onChange} containerClassName="mb-4"/>)}/>
            </section>
          )}

          {apiError && (<p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{apiError}</p>)}

          <Button
  type="submit"
  isLoading={isLoading}
  disabled={isLoading}
  fullWidth
  className="py-3 !bg-[var(--color-primario)] !text-[var(--color-fondo)] !focus:shadow-none hover:!brightness-90"
>
  {isLoading ? 'Creando Publicación...' : 'Crear Publicación'}
</Button>
        </form>
      </div>

      <div className="lg:w-1/3 xl:w-2/5 mt-8 lg:mt-0">
        <PaginaAmarillaFormPreview formData={formValuesForPreview} />
      </div>
      <button
  onClick={() => router.push('/bienvenida')}
  className="fixed bottom-6 right-4 h-12 w-12 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
  style={{ backgroundColor: P.tarjeta }}
>
  <ChevronLeftIcon className="h-6 w-6" style={{ color: P.resalte }} />
</button>
    </div>
  );
};

export default PaginaAmarillaCrearForm;