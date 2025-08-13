// app/pagos/retorno/page.tsx
import { TF_ENABLED } from "@/lib/flags";
import Link from "next/link";


type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

function normalizeStatus(status?: string, collectionStatus?: string): "approved" | "pending" | "rejected" | "unknown" {
  const raw = (status ?? collectionStatus ?? "").toLowerCase();
  if (raw === "success" || raw === "approved") return "approved";
  if (raw === "pending" || raw === "in_process") return "pending";
  if (raw === "failure" || raw === "rejected" || raw === "cancelled") return "rejected";
  return "unknown";
}

export default function PagoRetornoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const statusParam = pickParam(searchParams, "status");
  const collectionStatus = pickParam(searchParams, "collection_status");
  const status = normalizeStatus(statusParam, collectionStatus);

  // IDs útiles para auditoría (pueden o no venir, según el flujo)
  const preferenceId = pickParam(searchParams, "preference_id");
  const paymentId = pickParam(searchParams, "payment_id");
  const merchantOrderId = pickParam(searchParams, "merchant_order_id");

  const statusInfo: Record<
    "approved" | "pending" | "rejected" | "unknown",
    { title: string; desc: string }
  > = {
    approved: {
      title: "¡Pago aprobado!",
      desc: TF_ENABLED
        ? "Registramos tu pago. Si tus datos fiscales están completos, la factura fiscal te llegará por email."
        : "Registramos tu pago. La factura fiscal se emitirá en cuanto activemos TusFacturas.",
    },
    pending: {
      title: "Pago pendiente",
      desc: "Tu pago está en proceso. Te avisaremos cuando se acredite.",
    },
    rejected: {
      title: "Pago rechazado",
      desc: "No pudimos aprobar el pago. Probá con otro medio o intentá nuevamente.",
    },
    unknown: {
      title: "Estado desconocido",
      desc: "No pudimos determinar el estado del pago desde esta página.",
    },
  };

  const { title, desc } = statusInfo[status];

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
        <p className="mb-6 text-gray-600">{desc}</p>

        <div className="space-y-1 text-sm text-gray-500">
          {typeof preferenceId === "string" && (
            <div>
              <span className="font-medium text-gray-700">Preference ID:</span>{" "}
              <span>{preferenceId}</span>
            </div>
          )}
          {typeof paymentId === "string" && (
            <div>
              <span className="font-medium text-gray-700">Payment ID:</span>{" "}
              <span>{paymentId}</span>
            </div>
          )}
          {typeof merchantOrderId === "string" && (
            <div>
              <span className="font-medium text-gray-700">Merchant Order:</span>{" "}
              <span>{merchantOrderId}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver al inicio
          </Link>
          <Link
            href="/paginas-amarillas"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ver mis publicaciones
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Si cerraste esta ventana antes de tiempo, no te preocupes: el estado real del pago se confirma por webhook.
        </p>
      </div>
    </main>
  );
}
