/* eslint-disable @typescript-eslint/no-explicit-any */
/* NotificacionCard.tsx — botón “Aceptar” outline claro en ambos temas */
'use client';

import { useState, useMemo } from 'react';
import Image        from 'next/image';
import { useTheme } from 'next-themes';
import {
  CheckCircleIcon, TrashIcon,
  ChevronDownIcon, ChevronUpIcon,
} from '@heroicons/react/24/solid';
import { NotificationDoc as Notification } from '@/lib/services/notificationsService';
import { DocumentData, Timestamp } from 'firebase/firestore';

/*── util fecha dd/mm hh:mm ───────────────*/
const fmtDate = (ts?: unknown) => {
  if (!ts) return '';
  const d =
    ts instanceof Timestamp ? ts.toDate()
      : typeof ts === 'number' ? new Date(ts)
      : new Date(ts as string);
  return d.toLocaleString('es-AR',{
    day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',
  });
};
/*── Title-Case ───────────────────────────*/
const toTitleCase = (s:string)=>
  s.toLowerCase().split(' ').filter(Boolean)
   .map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

/*──────── props ────────*/
interface Props{
  data:Notification;
  viewerMode:'user'|'provider';
  onPrimary:()=>void|Promise<void>;
  onSecondary?:()=>void|Promise<void>;
  onAvatarClick?:()=>void;
}
/*──────────────────────*/
export default function NotificacionCard({
  data,viewerMode,onPrimary,onSecondary,onAvatarClick,
}:Props){

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDark = useTheme().resolvedTheme==='dark';

  /*── paleta ─────────────────────────*/
  const C = useMemo(()=>({
    cardBg : '#184840',
    cardBrd: '#2F5854',
    txt    : '#F9F3D9',
    subTxt : '#F9F3D9',
    /* aceptar = outline claro */
    accBg  : 'transparent',         // sin relleno
    accTxt : '#F9F3D9',
    accBrd : '#F9F3D9',
    /* eliminar */
    delBg  : '#DC2626',
    delTxt : '#F9F3D9',
  }),[]);

  /* remitente + avatar */
  const { payload,type } = data;
  const senderName = toTitleCase(
    ((payload as DocumentData)?.senderName ?? 'Usuario') as string,
  );
  const avatar =
    ((payload as DocumentData)?.avatarUrl ||
     (payload as DocumentData)?.providerAvatar ||
     (payload as DocumentData)?.senderAvatarUrl ||
     '/logo1.png') as string;

  /* descripción + toggle */
  const full       = (payload as DocumentData)?.description ?? '';
  const needsTrunc = full.length > 100;
  const preview    = needsTrunc ? full.slice(0,100) : full;
  const [expanded,setExpanded] = useState(false);

  /* botones */
  const cfg={
    job_request         :{p:viewerMode==='provider'?'Aceptar':undefined, s:'Eliminar'},
    job_accept          :{p:viewerMode==='user'    ?'Contactar':undefined, s:'Eliminar'},
    contact_followup    :{p:viewerMode==='user'    ?'Sí, acordamos':undefined, s:viewerMode==='user'?'No, aún no':'Eliminar'},
    agreement_confirmed :{p:viewerMode==='provider'?'Calificar usuario':undefined, s:undefined},
    rating_request      :{p:viewerMode==='user'    ?'Calificar prestador':undefined, s:'Eliminar'},
  } as const;
  const {p:primary,s:secondary}=cfg[type as keyof typeof cfg] ?? {p:undefined,s:undefined};
  const hasSec = !!(secondary && onSecondary);

  /* fecha-hora */
  const dateStr = fmtDate(
    (data as any)?.createdAt ?? (payload as any)?.timestamp
  );

  /*── render ─────────────────────────*/
  return (
    <article
      className="relative flex gap-3 rounded-xl p-4 shadow-md w-full max-w-[380px]"
      style={{backgroundColor:C.cardBg,border:`1px solid ${C.cardBrd}`}}
    >
      {dateStr && (
        <span className="absolute top-[10px] right-3 text-[10px]" style={{color:C.subTxt,opacity:.9}}>
          {dateStr}
        </span>
      )}

      {/* avatar */}
      <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden">
        {onAvatarClick
          ? <button onClick={onAvatarClick} className="w-full h-full focus:outline-none">
              <Image src={avatar} alt="" fill sizes="48px" className="object-cover"/>
            </button>
          : <Image src={avatar} alt="" fill sizes="48px" className="object-cover"/>}
      </div>

      {/* texto + acciones */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-none mb-[2px]" style={{color:C.txt}}>
          {senderName}
        </p>

        <span className="text-[13px]" style={{color:C.subTxt}}>
          {expanded || !needsTrunc ? full : preview}
          {needsTrunc && (
            <>
              {!expanded && '… '}
              <button
                onClick={()=>setExpanded(!expanded)}
                className="inline-flex items-center gap-[1px] text-[11px] font-medium ml-[2px]"
                style={{color:C.txt}}
              >
                {expanded
                  ? <>ver menos <ChevronUpIcon className="w-3 h-3"/></>
                  : <>ver más  <ChevronDownIcon className="w-3 h-3"/></>}
              </button>
            </>
          )}
        </span>

        {(primary || hasSec) && (
          <div className={`mt-3 grid gap-2 ${primary&&hasSec?'grid-cols-2':'grid-cols-1'}`}>
            {primary && (
              <button
                onClick={onPrimary}
                className="flex items-center justify-center gap-1 px-3 py-[6px] rounded-md text-[13px] font-medium w-full"
                style={{
                  backgroundColor:C.accBg,
                  color:C.accTxt,
                  border:`1px solid ${C.accBrd}`,
                }}
              >
                <CheckCircleIcon className="w-4 h-4"/> {primary}
              </button>
            )}
            {hasSec && (
              <button
                onClick={onSecondary}
                className="flex items-center justify-center gap-1 px-3 py-[6px] rounded-md text-[13px] font-medium w-full"
                style={{backgroundColor:C.delBg,color:C.delTxt}}
              >
                <TrashIcon className="w-4 h-4"/> {secondary}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
