'use client';
import React, { useEffect, useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';                // ⬅️ NUEVO
import { doc, getDoc, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { Review } from '@/lib/services/reviewsService';

/* ------------------------------------------------------------------ */
interface ResenaCardProps {
  review: Review;
}
/* ------------------------------------------------------------------ */

const ResenaCard: React.FC<ResenaCardProps> = ({ review }) => {
  const [authorData, setAuthorData] = useState<DocumentData | null>(null);

  /* ---------- carga autor ---------- */
  useEffect(() => {
    async function fetchAuthor() {
      const snap = await getDoc(
        doc(db, review.authorCollection, review.authorId)
      );
      if (snap.exists()) setAuthorData(snap.data());
    }
    fetchAuthor();
  }, [review.authorCollection, review.authorId]);

  if (!authorData) return null;

  const fullName = `${authorData.nombre} ${authorData.apellido}`;
  const selfieUrl = authorData.selfieURL as string;
  const date =
    review.timestamp instanceof Timestamp
      ? review.timestamp.toDate()
      : new Date();

  /* ---------------------------------------------------------------- */

  return (
    <Card className="flex space-x-3">                     {/* ⬅️ usa Card */}
      <Avatar selfieUrl={selfieUrl} nombre={fullName} size={48} />

      <div className="flex-1">
        {/* estrellas */}
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((i) =>
            i <= review.rating ? (
              <StarSolid key={i} className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarOutline key={i} className="h-5 w-5 text-gray-300" />
            )
          )}
        </div>

        {/* comentario */}
        <p className="mt-1 text-[var(--color-texto-principal)]">
          {review.comment}
        </p>

        {/* fecha */}
        <p className="mt-1 text-xs text-[var(--color-texto-secundario)]">
          {date.toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
};

export default ResenaCard;
