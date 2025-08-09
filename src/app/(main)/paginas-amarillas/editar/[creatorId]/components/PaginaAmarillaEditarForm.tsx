'use client';

import React, { useState, useMemo, forwardRef, InputHTMLAttributes } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CampaignId, PlanId, SerializablePaginaAmarillaData, RolPaginaAmarilla } from '@/types/paginaAmarilla';
import {
  HorariosDeAtencion,
  DIAS_SEMANA_CONFIG_INICIAL,
} from '@/types/horarios';
import { HorarioDia as HorarioDiaAntiguo } from '@/types/horarios_antiguos';
import { UpdatePaginaAmarillaDTO, updatePaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import { uploadFileAndGetURL, deleteFileByUrl } from '@/lib/firebase/storage';
import { useUserStore, UserProfile } from '@/store/userStore';

// UI Components
import Input from '@/app/components/ui/Input';
import Textarea from '@/app/components/ui/Textarea';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';
import Avatar from '@/app/components/common/Avatar';
import SelectorHorariosAtencion from '@/app/components/paginas-amarillas/SelectorHorariosAtencion';
import PaginaAmarillaFormPreview, {
  PaginaAmarillaFormValues,
} from '@/app/components/paginas-amarillas/PaginaAmarillaFormPreview';
import AyudaEditarPublicacionPA from '@/app/components/ayuda-contenido/AyudaEditarPublicacionPA';
import BotonVolver from '@/app/components/common/BotonVolver';
import useHelpContent from '@/lib/hooks/useHelpContent';


// --- Componente Input con Prefijo Refactorizado (sin cambios) ---
interface InputConPrefijoProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  prefijo: string;
  error?: string;
}
const InputConPrefijo = forwardRef<HTMLInputElement, InputConPrefijoProps>(
  ({ id, label, prefijo, error, ...props }, ref) => {
    // ... (código sin cambios)
    return (
      <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
          {label}
        </label>
        <div className="flex items-stretch rounded-md border border-borde-tarjeta focus-within:ring-1 focus-within:ring-primario focus-within:border-primario overflow-hidden">
          <span className="flex items-center whitespace-nowrap bg-tarjeta px-3 text-texto-secundario text-sm border-r border-borde-tarjeta">
            {prefijo}
          </span>
          <input
            id={id}
            ref={ref}
            {...props}
            className="block w-full px-3 py-2 bg-fondo border-0 placeholder-texto-secundario focus:outline-none focus:ring-0 sm:text-sm text-texto-principal"
          />
        </div>
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>
    );
  }
);
InputConPrefijo.displayName = 'InputConPrefijo';


// --- Funciones de utilidad y Schemas Zod (sin cambios) ---
const stripPrefix = (value: string | null | undefined, prefix: string): string => {
  if (!value) return '';
  return value.startsWith(prefix) ? value.substring(prefix.length) : value;
};
const stripPhonePrefix = (value: string | null | undefined): string => {
  if (!value) return '';
  if (value.startsWith('+54')) {
    return value.substring(3);
  }
  return value;
};
function adaptarHorariosAntiguosANuevos(
  horariosAntiguosOActuales?: HorarioDiaAntiguo[] | HorariosDeAtencion | null
): HorariosDeAtencion {
  if (!horariosAntiguosOActuales || horariosAntiguosOActuales.length === 0) {
    return DIAS_SEMANA_CONFIG_INICIAL.map(d => ({ ...d, estado: Array.isArray(d.estado) ? d.estado.map(r => ({ ...r })) : d.estado, }));
  }
  if ('estado' in horariosAntiguosOActuales[0]) {
    const horariosNuevos = horariosAntiguosOActuales as HorariosDeAtencion;
    return DIAS_SEMANA_CONFIG_INICIAL.map(base => {
      const existente = horariosNuevos.find(d => d.diaIndice === base.diaIndice);
      if (existente) {
        const estadoCopiado = Array.isArray(existente.estado) ? existente.estado.map(r => ({ ...r })) : existente.estado;
        return { ...base, ...existente, estado: estadoCopiado };
      }
      return { ...base, estado: 'cerrado' };
    });
  }
  const antiguos = horariosAntiguosOActuales as HorarioDiaAntiguo[];
  return DIAS_SEMANA_CONFIG_INICIAL.map(base => {
    const h = antiguos.find(h => h.diaIndice === base.diaIndice);
    if (h) {
      if (h.es24Horas) return { ...base, estado: 'abierto24h' };
      if (h.habilitado && h.apertura && h.cierre) return { ...base, estado: [{ de: h.apertura, a: h.cierre }] };
    }
    return { ...base, estado: 'cerrado' };
  });
}
const rangoHorarioSchema = z.object({
  de: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
  a: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)'),
});
const estadoHorarioDiaSchema = z.union([ z.literal('cerrado'), z.literal('abierto24h'), z.array(rangoHorarioSchema), ]);
const configuracionDiaSchema = z.object({ diaNombre: z.string(), diaAbreviatura: z.string(), diaIndice: z.number(), estado: estadoHorarioDiaSchema, });
const paginaAmarillaEditarSchema = z.object({
  nombrePublico: z.string().min(3, 'El nombre público es requerido (mín. 3 caracteres)').max(100),
  tituloCard: z.string().max(100).optional().nullable(),
  subtituloCard: z.string().max(150).optional().nullable(),
  descripcion: z.string().max(1000).optional().nullable(),
  imagenFile: z.custom<File>().optional()
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
type FormValuesEditar = z.infer<typeof paginaAmarillaEditarSchema>;


interface PaginaAmarillaEditarFormProps {
  publicacionInicial: SerializablePaginaAmarillaData;
}

const PaginaAmarillaEditarForm: React.FC<PaginaAmarillaEditarFormProps> = ({ publicacionInicial }) => {
  const router = useRouter();
  const currentUser = useUserStore(s => s.currentUser) as UserProfile | null;
  const { creatorRole, creatorId } = publicacionInicial;
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null | undefined>(publicacionInicial.imagenPortadaUrl);
  const [apiError, setApiError] = useState<string | null>(null);
  useHelpContent(<AyudaEditarPublicacionPA />);
  // --- INICIO: LECTURA DE PLAN Y CAMPAÑA ---
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId') as PlanId | null;
  const campaignId = searchParams.get('campaignId') as CampaignId | null;
  // --- FIN: LECTURA DE PLAN Y CAMPAÑA ---

  const defaultValues = useMemo<FormValuesEditar>(() => ({
    nombrePublico: publicacionInicial.nombrePublico || '',
    tituloCard: publicacionInicial.tituloCard || null,
    subtituloCard: publicacionInicial.subtituloCard || null,
    descripcion: publicacionInicial.descripcion || null,
    telefonoContacto: stripPhonePrefix(publicacionInicial.telefonoContacto),
    emailContacto: publicacionInicial.emailContacto || null,
    enlaceWeb: stripPrefix(publicacionInicial.enlaceWeb, 'https://'),
    enlaceInstagram: stripPrefix(publicacionInicial.enlaceInstagram, 'https://instagram.com/'),
    enlaceFacebook: stripPrefix(publicacionInicial.enlaceFacebook, 'https://facebook.com/'),
    direccionVisible: publicacionInicial.direccionVisible || null,
    horarios: adaptarHorariosAntiguosANuevos(publicacionInicial.horarios as HorarioDiaAntiguo[] | HorariosDeAtencion | null),
    realizaEnvios: publicacionInicial.realizaEnvios ?? null,
    imagenFile: undefined,
  }), [publicacionInicial]);

  const { control, handleSubmit, watch, formState: { errors, isDirty, dirtyFields }, setValue } = useForm<FormValuesEditar>({
    resolver: zodResolver(paginaAmarillaEditarSchema),
    defaultValues,
  });

  const formDataForPreview = watch();
  const previewVals: PaginaAmarillaFormValues = useMemo(() => ({
    ...formDataForPreview,
    imagenPortadaUrl: previewImage ?? undefined,
    provincia: publicacionInicial.provincia,
    localidad: publicacionInicial.localidad,
    creatorRole: creatorRole as RolPaginaAmarilla,
    rubro: creatorRole === 'comercio' ? publicacionInicial.rubro : undefined,
    subRubro: creatorRole === 'comercio' ? publicacionInicial.subRubro : undefined,
    categoria: creatorRole === 'prestador' ? publicacionInicial.categoria : undefined,
    subCategoria: creatorRole === 'prestador' ? publicacionInicial.subCategoria : undefined,
    horarios: formDataForPreview.horarios as HorariosDeAtencion | undefined,
  }), [formDataForPreview, previewImage, publicacionInicial, creatorRole]);


  // --- INICIO: LÓGICA ONSUBMIT ACTUALIZADA ---
  const onSubmit: SubmitHandler<FormValuesEditar> = async data => {
    setIsLoading(true);
    setApiError(null);

    if (!currentUser || currentUser.uid !== creatorId) {
      setApiError('No autorizado para editar esta publicación.');
      setIsLoading(false);
      return;
    }

    const payload: UpdatePaginaAmarillaDTO = {};
    let urlViejaParaBorrar: string | undefined | null = null;
    if (creatorRole === 'comercio' && dirtyFields.imagenFile) {
      if (data.imagenFile) {
        try {
          const ts = Date.now();
          const ext = data.imagenFile.name.split('.').pop() || 'jpg';
          const path = `paginas_amarillas_portadas/${currentUser.uid}/logo-${ts}.${ext}`;
          payload.imagenPortadaUrl = await uploadFileAndGetURL(data.imagenFile, path);
          urlViejaParaBorrar = publicacionInicial.imagenPortadaUrl;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          setApiError('Error al subir la imagen.');
          setIsLoading(false);
          return;
        }
      } else { 
        payload.imagenPortadaUrl = null;
        urlViejaParaBorrar = publicacionInicial.imagenPortadaUrl;
      }
    }
    const fieldsToCheck: (keyof FormValuesEditar)[] = [ 'nombrePublico', 'tituloCard', 'subtituloCard', 'descripcion', 'emailContacto', 'direccionVisible', 'realizaEnvios', 'horarios', 'telefonoContacto', 'enlaceWeb', 'enlaceInstagram', 'enlaceFacebook' ];
    fieldsToCheck.forEach(key => {
      if (!dirtyFields[key]) return;
      switch(key) {
        case 'telefonoContacto': payload.telefonoContacto = data.telefonoContacto ? `+54${data.telefonoContacto.replace(/\s/g, '')}` : null; break;
        case 'enlaceWeb': payload.enlaceWeb = data.enlaceWeb ? `https://${data.enlaceWeb}` : null; break;
        case 'enlaceInstagram': payload.enlaceInstagram = data.enlaceInstagram ? `https://instagram.com/${data.enlaceInstagram}` : null; break;
        case 'enlaceFacebook': payload.enlaceFacebook = data.enlaceFacebook ? `https://facebook.com/${data.enlaceFacebook}` : null; break;
        case 'imagenFile': break;
        default: (payload as Record<string, unknown>)[key] = data[key] ?? null;
      }
    });
    
    // Añadimos el nuevo plan y campaña al payload si fueron seleccionados.
    if (planId && campaignId) {
      payload.planId = planId;
      payload.campaignId = campaignId;
    }
    
    // Si no hay cambios en el contenido Y TAMPOCO se está eligiendo un plan, no hacemos nada.
    if (Object.keys(payload).length === 0) {
      setApiError('No se detectaron cambios para actualizar.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Guardamos los cambios de contenido y/o el nuevo plan en la base de datos.
      await updatePaginaAmarilla(creatorId, payload);
      if (urlViejaParaBorrar) {
        try { await deleteFileByUrl(urlViejaParaBorrar); } 
        catch (e) { console.warn('No se pudo eliminar la imagen antigua.', e); }
      }
      
      // 2. Redirigimos a la página de resumen para previsualizar y pagar.
      router.push(`/paginas-amarillas/resumen/${creatorId}`);
      
    } catch (err) {
      const error = err as Error;
      console.error("Error al actualizar la publicación:", error);
      setApiError(error.message || 'Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };
  // --- FIN: LÓGICA ONSUBMIT ACTUALIZADA ---

  if (!currentUser) {
    return <p className="p-4 text-center text-texto-secundario animate-pulse">Cargando datos del usuario...</p>;
  }
  if (currentUser.uid !== creatorId) {
    return <p className="p-4 text-center text-error">No tienes permiso para editar esta publicación.</p>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6 pb-24 lg:pb-6">
      <div className="lg:w-2/3 xl:w-3/5 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-texto-principal text-center">
            Editar Publicación
          </h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-4">
          {/* ... (Todo el contenido del formulario <section>...</section> se mantiene igual) ... */}
          <section className="p-4 rounded-2xl bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold text-texto-principal mb-3 pb-3 border-b border-borde-tarjeta">
              {creatorRole === 'comercio' ? 'Logo del Negocio' : 'Foto de Perfil'}
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Avatar selfieUrl={previewImage ?? undefined} nombre={watch('nombrePublico')} size={100} />
              <div className="flex-grow">
                {creatorRole === 'comercio' ? (
                  <Controller
                    name="imagenFile" control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <label htmlFor="imagenFile" className="block text-sm font-medium text-texto-secundario mb-1">
                          Cambiar Logo (JPG, PNG, WEBP) - Máx 5MB
                        </label>
                        <input
                          id="imagenFile" type="file" accept="image/jpeg,image/png,image/webp"
                          className="block w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primario/20 file:text-primario hover:file:bg-primario/30 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPreviewImage(reader.result as string);
                              reader.readAsDataURL(file);
                            } else {
                              setPreviewImage(publicacionInicial.imagenPortadaUrl);
                            }
                          }}
                        />
                        {fieldState.error && <p className="text-sm text-error mt-1">{fieldState.error.message}</p>}
                        {previewImage && (
                          <button type="button" className="mt-2 text-xs text-error hover:underline" onClick={() => {
                            setValue('imagenFile', undefined, { shouldDirty: true });
                            setPreviewImage(null);
                            field.onChange(null);
                          }}>
                            Quitar imagen actual
                          </button>
                        )}
                      </>
                    )}
                  />
                ) : (
                  <div className="text-sm text-texto-secundario p-3 bg-fondo rounded-lg border border-borde-tarjeta">
                    <p>Tu foto de perfil se usa como imagen de portada y se actualiza desde tu perfil de usuario.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="p-4 rounded-2xl bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold text-texto-principal mb-3 pb-3 border-b border-borde-tarjeta">Información Principal</h2>
            <div className="pt-2 space-y-4">
              <Controller name="nombrePublico" control={control} render={({ field, fieldState }) => (<Input id="nombrePublico" label={creatorRole === 'comercio' ? 'Nombre Público del Comercio*' : 'Tu Nombre Público*'} {...field} value={field.value ?? ''} disabled={creatorRole === 'prestador'} error={fieldState.error?.message} />)} />
              <Controller name="tituloCard" control={control} render={({ field, fieldState }) => (<Input id="tituloCard" label="Título para la Tarjeta (Opcional)" {...field} value={field.value ?? ''} error={fieldState.error?.message} />)} />
              <Controller name="subtituloCard" control={control} render={({ field, fieldState }) => (<Input id="subtituloCard" label="Subtítulo para la Tarjeta (Opcional)" {...field} value={field.value ?? ''} error={fieldState.error?.message} />)} />
              <Controller name="descripcion" control={control} render={({ field, fieldState }) => (<Textarea id="descripcion" spellCheck="true" label="Descripción (Párrafo)" rows={4} {...field} value={field.value ?? ''} error={fieldState.error?.message} />)} />
            </div>
          </section>
          <section className="p-4 rounded-2xl bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold text-texto-principal mb-3 pb-3 border-b border-borde-tarjeta">Información de Contacto</h2>
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-0 pt-2">
              <Controller name="telefonoContacto" control={control} render={({ field, fieldState }) => ( <InputConPrefijo id="telefonoContacto" label="Teléfono de Contacto" type="tel" prefijo="+54" {...field} value={field.value ?? ''} placeholder="2611234567 (sin 0 ni 15)" error={fieldState.error?.message} /> )}/>
              <Controller name="emailContacto" control={control} render={({ field, fieldState }) => ( <Input id="emailContacto" label="Email de Contacto" type="email" {...field} value={field.value ?? ''} placeholder="contacto@ejemplo.com" error={fieldState.error?.message} /> )}/>
              <Controller name="enlaceWeb" control={control} render={({ field, fieldState }) => (<InputConPrefijo id="enlaceWeb" label="Página Web (Opcional)" type="text" prefijo="https://" {...field} value={field.value ?? ''} placeholder="www.ejemplo.com" error={fieldState.error?.message}/>)}/>
              <Controller name="enlaceInstagram" control={control} render={({ field, fieldState }) => (<InputConPrefijo id="enlaceInstagram" label="Instagram (Opcional)" type="text" prefijo="https://instagram.com/" {...field} value={field.value ?? ''} placeholder="tu_usuario" error={fieldState.error?.message}/>)}/>
              <Controller name="enlaceFacebook" control={control} render={({ field, fieldState }) => (<InputConPrefijo id="enlaceFacebook" label="Facebook (Opcional)" type="text" prefijo="https://facebook.com/" {...field} value={field.value ?? ''} placeholder="tu.pagina" error={fieldState.error?.message}/>)}/>
            </div>
          </section>
          <section className="p-4 rounded-2xl bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold text-texto-principal mb-3 pb-3 border-b border-borde-tarjeta">Ubicación (Información Fija)</h2>
            <div className="pt-2">
              <Controller name="direccionVisible" control={control} render={({ field, fieldState }) => (<Input id="direccionVisible" label="Dirección Pública (Opcional)" {...field} value={field.value ?? ''} error={fieldState.error?.message} />)}/>
              <div className="mt-4 space-y-1 text-sm text-texto-secundario bg-fondo p-3 rounded-lg border border-borde-tarjeta">
                <p><strong>Provincia:</strong> {publicacionInicial.provincia}</p>
                <p><strong>Localidad:</strong> {publicacionInicial.localidad}</p>
                {creatorRole === 'comercio' && ( <> <p><strong>Rubro:</strong> {publicacionInicial.rubro ?? 'No especificado'}</p> {publicacionInicial.subRubro && (<p><strong>Sub-Rubro:</strong> {publicacionInicial.subRubro}</p>)} </> )}
                {creatorRole === 'prestador' && ( <> <p><strong>Categoría:</strong> {publicacionInicial.categoria ?? 'No especificada'}</p> {publicacionInicial.subCategoria && (<p><strong>Sub-Categoría:</strong> {publicacionInicial.subCategoria}</p>)} </> )}
              </div>
            </div>
          </section>
          <Controller name="horarios" control={control} render={({ field }) => ( <SelectorHorariosAtencion horariosIniciales={field.value ?? undefined} onChange={field.onChange} /> )}/>
          {errors.horarios && ( <p className="text-sm text-error mt-1 mb-3"> {typeof errors.horarios.message === 'string' ? errors.horarios.message : 'Error en horarios.'} </p> )}
          {creatorRole === 'comercio' && (
            <section className="p-4 rounded-2xl bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
              <h2 className="text-lg font-semibold text-texto-principal mb-3 pb-3 border-b border-borde-tarjeta">Otros Detalles</h2>
              <div className="pt-2">
                <Controller name="realizaEnvios" control={control} render={({ field }) => (<Checkbox id="realizaEnvios" label="¿Realizas envíos?" checked={field.value ?? false} onCheckedChange={field.onChange} containerClassName="mb-4" />)}/>
              </div>
            </section>
          )}

          {apiError && <p className="text-sm text-error bg-error/10 p-3 rounded-md">{apiError}</p>}
          
          {/* --- INICIO: BOTÓN ACTUALIZADO --- */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading || (!isDirty && !planId)} // Se actualiza la lógica disabled
              className="btn-primary"
            >
              {isLoading ? 'Guardando...' : 'Guardar y Previsualizar'}
            </button>
          </div>
          {/* --- FIN: BOTÓN ACTUALIZADO --- */}
        </form>
      </div>
      <div className="lg:w-1/3 xl:w-2/5 mt-8 lg:mt-0">
        <PaginaAmarillaFormPreview formData={previewVals} />
      </div>
      <BotonVolver />
    </div>
  );
};

export default PaginaAmarillaEditarForm;