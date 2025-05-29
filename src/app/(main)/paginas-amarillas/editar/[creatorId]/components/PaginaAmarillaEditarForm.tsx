// src/app/(main)/paginas-amarillas/editar/[creatorId]/components/PaginaAmarillaEditarForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import {
  HorariosDeAtencion,
  DIAS_SEMANA_CONFIG_INICIAL,
} from '@/types/horarios';
import { HorarioDia as HorarioDiaAntiguo } from '@/types/horarios_antiguos';
import { db } from '@/lib/firebase/config';
import { UpdatePaginaAmarillaDTO } from '@/lib/services/paginasAmarillasService';
import { uploadFileAndGetURL, deleteFileByUrl } from '@/lib/firebase/storage';
import { useUserStore, UserProfile } from '@/store/userStore';

import Input from '@/app/components/ui/Input';
import Textarea from '@/app/components/ui/Textarea';
import Button from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';
import Avatar from '@/app/components/common/Avatar';
import SelectorHorariosAtencion from '@/app/components/paginas-amarillas/SelectorHorariosAtencion';
import PaginaAmarillaFormPreview, {
  PaginaAmarillaFormValues,
} from '@/app/components/paginas-amarillas/PaginaAmarillaFormPreview';

// Adaptar formatos antiguos de horarios al nuevo
function adaptarHorariosAntiguosANuevos(
  horariosAntiguosOActuales?: HorarioDiaAntiguo[] | HorariosDeAtencion | null
): HorariosDeAtencion {
  if (!horariosAntiguosOActuales || horariosAntiguosOActuales.length === 0) {
    return DIAS_SEMANA_CONFIG_INICIAL.map(d => ({
      ...d,
      estado: Array.isArray(d.estado) ? d.estado.map(r => ({ ...r })) : d.estado,
    }));
  }
  const primerDia = (horariosAntiguosOActuales as never)[0];
  if (primerDia && 'estado' in primerDia) {
    return DIAS_SEMANA_CONFIG_INICIAL.map(base => {
      const existente = (horariosAntiguosOActuales as HorariosDeAtencion).find(
        d => d.diaIndice === base.diaIndice
      );
      if (existente) {
        const estadoCopiado = Array.isArray(existente.estado)
          ? existente.estado.map(r => ({ ...r }))
          : existente.estado;
        return { ...base, ...existente, estado: estadoCopiado };
      }
      return { ...base, estado: 'cerrado' };
    });
  }
  // Convertir desde HorarioDiaAntiguo[]
  const antiguos = horariosAntiguosOActuales as HorarioDiaAntiguo[];
  return DIAS_SEMANA_CONFIG_INICIAL.map(base => {
    const h = antiguos.find(h => h.diaIndice === base.diaIndice);
    if (h) {
      if (h.es24Horas) {
        return { ...base, estado: 'abierto24h' };
      }
      if (h.habilitado && h.apertura && h.cierre) {
        return { ...base, estado: [{ de: h.apertura, a: h.cierre }] };
      }
    }
    return { ...base, estado: 'cerrado' };
  });
}

// Schemas Zod para validación
const rangoHorarioSchema = z
  .object({
    de: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido').or(z.literal('')),
    a: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido').or(z.literal('')),
  })
  .refine(
    r => (r.de === '' && r.a === '') || (r.de !== '' && r.a !== ''),
    { message: "Ambos campos 'de' y 'a' deben estar completos o vacíos." }
  );
const estadoHorarioDiaSchema = z.union([
  z.literal('cerrado'),
  z.literal('abierto24h'),
  z
    .array(rangoHorarioSchema)
    .refine(arr => arr.every(r => (r.de === '' && r.a === '') || (r.de !== '' && r.a !== '')), {
      message: 'Todos los turnos deben estar completos o vacíos.',
    }),
]);
const configuracionDiaSchemaLocal = z.object({
  diaNombre: z.string(),
  diaAbreviatura: z.string(),
  diaIndice: z.number(),
  estado: estadoHorarioDiaSchema,
});
const paginaAmarillaEditarSchema = z.object({
  nombrePublico: z.string().min(3).max(100),
  tituloCard: z.string().max(100).nullable().optional(),
  subtituloCard: z.string().max(150).nullable().optional(),
  descripcion: z.string().max(1000).nullable().optional(),
  imagenFile: z
    .custom<File>()
    .optional()
    .refine(f => !f || (f instanceof File && f.size > 0), 'Archivo no puede estar vacío.')
    .refine(f => !f || (f instanceof File && f.size < 5 * 1024 * 1024), 'Máx 5MB.')
    .refine(
      f => !f || (f instanceof File && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)),
      'Formato inválido.'
    ),
  telefonoContacto: z.string().regex(/^[+]?[0-9\s\-()]{7,20}$/).or(z.literal('')).nullable().optional(),
  emailContacto: z.string().email('Email inválido').or(z.literal('')).nullable().optional(),
  enlaceWeb: z.string().url('URL inválida').or(z.literal('')).nullable().optional(),
  enlaceInstagram: z.string().url('URL inválida').or(z.literal('')).nullable().optional(),
  enlaceFacebook: z.string().url('URL inválida').or(z.literal('')).nullable().optional(),
  direccionVisible: z.string().max(200).nullable().optional(),
  horarios: z.array(configuracionDiaSchemaLocal).optional().nullable(),
  realizaEnvios: z.boolean().nullable().optional(),
});

type FormValuesEditar = z.infer<typeof paginaAmarillaEditarSchema>;

interface PaginaAmarillaEditarFormProps {
  publicacionInicial: SerializablePaginaAmarillaData;
}

const PaginaAmarillaEditarForm: React.FC<PaginaAmarillaEditarFormProps> = ({ publicacionInicial }) => {
  const router = useRouter();
  const currentUser = useUserStore(s => s.currentUser) as UserProfile | null;

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null | undefined>(
    publicacionInicial.imagenPortadaUrl
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const defaultValues = useMemo<FormValuesEditar>(() => ({
    nombrePublico: publicacionInicial.nombrePublico || '',
    tituloCard: publicacionInicial.tituloCard || null,
    subtituloCard: publicacionInicial.subtituloCard || null,
    descripcion: publicacionInicial.descripcion || null,
    telefonoContacto: publicacionInicial.telefonoContacto || null,
    emailContacto: publicacionInicial.emailContacto || null,
    enlaceWeb: publicacionInicial.enlaceWeb || null,
    enlaceInstagram: publicacionInicial.enlaceInstagram || null,
    enlaceFacebook: publicacionInicial.enlaceFacebook || null,
    direccionVisible: publicacionInicial.direccionVisible || null,
    horarios: adaptarHorariosAntiguosANuevos(
      publicacionInicial.horarios as HorarioDiaAntiguo[] | HorariosDeAtencion | null
    ),
    realizaEnvios: publicacionInicial.realizaEnvios ?? null,
    imagenFile: undefined,
  }), [publicacionInicial]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValuesEditar>({
    resolver: zodResolver(paginaAmarillaEditarSchema),
    defaultValues,
  });

  const formDataForPreview = watch();

  const onSubmit: SubmitHandler<FormValuesEditar> = async data => {
    setIsLoading(true);
    setApiError(null);

    const fbUser = getAuth().currentUser;
    if (!fbUser || fbUser.uid !== publicacionInicial.creatorId) {
      setApiError('No autorizado para editar esta publicación.');
      setIsLoading(false);
      return;
    }

    const payload: UpdatePaginaAmarillaDTO = {};
    let urlVieja: string | undefined | null;

    if (data.imagenFile) {
      try {
        const ts = Date.now();
        const ext = data.imagenFile.name.split('.').pop() || 'jpg';
        const path = `paginas_amarillas_portadas/${fbUser.uid}/logo-${ts}.${ext}`;
        const nuevaUrl = await uploadFileAndGetURL(data.imagenFile, path);
        payload.imagenPortadaUrl = nuevaUrl;
        urlVieja = publicacionInicial.imagenPortadaUrl;
      } catch (err) {
        console.error(err);
        setApiError('Error al subir la imagen.');
        setIsLoading(false);
        return;
      }
    }

    for (const key of Object.keys(data) as Array<keyof FormValuesEditar>) {
      if (key === 'imagenFile') continue;
      if (!dirtyFields[key]) continue;
      const val = data[key] === '' ? undefined : data[key];
      (payload as Record<string, unknown>)[key] = val;
    }

    const defaultHorarios = adaptarHorariosAntiguosANuevos(
      publicacionInicial.horarios as HorarioDiaAntiguo[] | HorariosDeAtencion | null
    );
    if (JSON.stringify(data.horarios) !== JSON.stringify(defaultHorarios)) {
      payload.horarios = data.horarios ?? null;
    }

    if (Object.keys(payload).length === 0) {
      setApiError('No se detectaron cambios para actualizar.');
      setIsLoading(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'paginas_amarillas', publicacionInicial.creatorId), payload);
      if (urlVieja) {
        try {
          await deleteFileByUrl(urlVieja);
        } catch (e) {
          console.warn('No se pudo eliminar la imagen antigua.', e);
        }
      }
      router.push(`/bienvenida?rol=${currentUser?.rol || ''}&source=pa-edit&status=success`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setApiError('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <p className="p-4 text-center">Cargando datos del usuario...</p>;
  }
  if (currentUser.uid !== publicacionInicial.creatorId) {
    return <p className="p-4 text-center text-red-600">No tienes permiso para editar esta publicación.</p>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const previewVals: PaginaAmarillaFormValues = useMemo(
    () => ({
      ...formDataForPreview,
      imagenPortadaUrl: previewImage ?? undefined,
      provincia: publicacionInicial.provincia,
      localidad: publicacionInicial.localidad,
      creatorRole: publicacionInicial.creatorRole,
      rubro: publicacionInicial.creatorRole === 'comercio' ? publicacionInicial.rubro : undefined,
      subRubro: publicacionInicial.creatorRole === 'comercio' ? publicacionInicial.subRubro : undefined,
      categoria: publicacionInicial.creatorRole === 'prestador' ? publicacionInicial.categoria : undefined,
      subCategoria: publicacionInicial.creatorRole === 'prestador' ? publicacionInicial.subCategoria : undefined,
      horarios: formDataForPreview.horarios as HorariosDeAtencion | undefined,
    }),
    [formDataForPreview, previewImage, publicacionInicial]
  );

  function setValue(_arg0: string, _undefined: undefined, _arg2: { shouldDirty: boolean; }) {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6">
      <div className="lg:w-2/3 xl:w-3/5 space-y-6">
        <h1 className="text-2xl font-bold text-texto-principal">Editar Publicación en Páginas Amarillas</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Logo del Negocio</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar selfieUrl={previewImage ?? undefined} nombre={watch('nombrePublico')} size={100} />
              <div className="flex-grow">
                <Controller
                  name="imagenFile"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <label htmlFor="imagenFile" className="block text-sm font-medium text-texto-secundario mb-1">
                        Cambiar Logo (JPG, PNG, WEBP) - Máx 5MB
                      </label>
                      <input
                        id="imagenFile"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="block w-full text-sm text-texto-secundario file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primario/10 file:text-primario hover:file:bg-primario/20"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file); // Informa a react-hook-form sobre el archivo
                            const reader = new FileReader();
                            reader.onloadend = () => setPreviewImage(reader.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            field.onChange(undefined); // Si no se selecciona archivo
                          }
                        }}
                      />
                      {previewImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="mt-2 text-xs text-red-600"
                          onClick={() => {
                            setValue('imagenFile', undefined, { shouldDirty: true });
                            setPreviewImage(null);
                            field.onChange(null);
                          }}
                        >
                          Quitar imagen actual
                        </Button>
                      )}
                      {fieldState.error && <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Información Principal</h2>
            <Controller name="nombrePublico" control={control} render={({ field }) => (<Input id="nombrePublico" label="Nombre Público*" {...field} value={field.value ?? ''} />)} />
            {errors.nombrePublico && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.nombrePublico.message}</p>}
            <Controller name="tituloCard" control={control} render={({ field }) => (<Input id="tituloCard" label="Título (Opcional)" {...field} value={field.value ?? ''} />)} />
            {errors.tituloCard && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.tituloCard.message}</p>}
            <Controller name="subtituloCard" control={control} render={({ field }) => (<Input id="subtituloCard" label="Subtítulo (Opcional)" {...field} value={field.value ?? ''} />)} />
            {errors.subtituloCard && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.subtituloCard.message}</p>}
            <Controller name="descripcion" control={control} render={({ field }) => (<Textarea id="descripcion" label="Descripción" rows={4} {...field} value={field.value ?? ''} />)} />
            {errors.descripcion && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.descripcion.message}</p>}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Información de Contacto</h2>
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-0">
              <Controller name="telefonoContacto" control={control} render={({ field }) => (<Input id="telefonoContacto" label="Teléfono" type="tel" {...field} value={field.value ?? ''} />)} />
              {errors.telefonoContacto && <p className="text-sm text-red-500 mt-1 mb-3">{errors.telefonoContacto.message}</p>}
              <Controller name="emailContacto" control={control} render={({ field }) => (<Input id="emailContacto" label="Email" type="email" {...field} value={field.value ?? ''} />)} />
              {errors.emailContacto && <p className="text-sm text-red-500 mt-1 mb-3">{errors.emailContacto.message}</p>}
              <Controller name="enlaceWeb" control={control} render={({ field }) => (<Input id="enlaceWeb" label="Página Web" type="url" {...field} value={field.value ?? ''} />)} />
              {errors.enlaceWeb && <p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceWeb.message}</p>}
              <Controller name="enlaceInstagram" control={control} render={({ field }) => (<Input id="enlaceInstagram" label="Instagram" type="url" {...field} value={field.value ?? ''} />)} />
              {errors.enlaceInstagram && <p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceInstagram.message}</p>}
              <Controller name="enlaceFacebook" control={control} render={({ field }) => (<Input id="enlaceFacebook" label="Facebook" type="url" {...field} value={field.value ?? ''} />)} />
              {errors.enlaceFacebook && <p className="text-sm text-red-500 mt-1 mb-3">{errors.enlaceFacebook.message}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Ubicación (Información Fija)</h2>
            <Controller name="direccionVisible" control={control} render={({ field }) => (<Input id="direccionVisible" label="Dirección Pública (Opcional)" {...field} value={field.value ?? ''} />)} />
            {errors.direccionVisible && <p className="text-sm text-red-500 -mt-3 mb-3">{errors.direccionVisible.message}</p>}
            <div className="mt-2 space-y-1 text-sm text-texto-secundario bg-fondo-secundario p-3 rounded-md border border-borde-tarjeta">
              <p><strong>Provincia:</strong> {publicacionInicial.provincia}</p>
              <p><strong>Localidad:</strong> {publicacionInicial.localidad}</p>
              <p><strong>Rol:</strong> {publicacionInicial.creatorRole}</p>
              {publicacionInicial.creatorRole === 'comercio' && (
                <>
                  <p><strong>Rubro:</strong> {publicacionInicial.rubro ?? 'No especificado'}</p>
                  {publicacionInicial.subRubro && (<p><strong>Sub-Rubro:</strong> {publicacionInicial.subRubro}</p>)}
                </>
              )}
              {publicacionInicial.creatorRole === 'prestador' && (
                <>
                  <p><strong>Categoría:</strong> {publicacionInicial.categoria ?? 'No especificada'}</p>
                  {publicacionInicial.subCategoria && (<p><strong>Sub-Categoría:</strong> {publicacionInicial.subCategoria}</p>)}
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Horarios de Atención</h2>
            <Controller
              name="horarios"
              control={control}
              render={({ field }) => (
                <SelectorHorariosAtencion
                  horariosIniciales={field.value ?? undefined}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.horarios && (
              <p className="text-sm text-red-500 mt-1 mb-3">
                {typeof errors.horarios.message === 'string' ? errors.horarios.message : 'Error en horarios.'}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-texto-principal mb-2">Otros Detalles</h2>
            <Controller name="realizaEnvios" control={control} render={({ field }) => (<Checkbox id="realizaEnvios" label="¿Realizas envíos?" checked={field.value ?? false} onCheckedChange={field.onChange} containerClassName="mb-4" />)} />
          </section>

          {apiError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{apiError}</p>}
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !isDirty} fullWidth className="py-3">
            {isLoading ? 'Actualizando Publicación...' : 'Guardar Cambios'}
          </Button>
        </form>
      </div>
      <div className="lg:w-1/3 xl:w-2/5 mt-8 lg:mt-0">
        <PaginaAmarillaFormPreview formData={previewVals} />
      </div>
    </div>
  );
};

export default PaginaAmarillaEditarForm;