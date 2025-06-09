
'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';

interface TownBannerImageProps {
  townName: string;
  storageBucketName?: string; // Made optional for robustness
}

const EXTERNAL_GREEN_PLACEHOLDER_URL = 'https://placehold.co/800x400/90EE90.png';
const USER_GREEN_PLACEHOLDER_FILENAME = 'green_town_placeholder.png';

export default function TownBannerImage({ townName, storageBucketName }: TownBannerImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActualPlaceholder, setIsActualPlaceholder] = useState(false);

  useEffect(() => {
    if (!storageBucketName) {
      console.warn("TownBannerImage: storageBucketName is not provided. Falling back to external placeholder.");
      setImageUrl(EXTERNAL_GREEN_PLACEHOLDER_URL);
      setIsActualPlaceholder(true);
      setIsLoading(false);
      return;
    }

    const storage = getStorage();
    const formattedTownName = townName.toLowerCase().replace(/\s+/g, '-');

    const potentialPaths = [
      `town-images/${formattedTownName}.png`,
      `town-images/${formattedTownName}.jpg`,
      `town-images/${USER_GREEN_PLACEHOLDER_FILENAME}`,
    ];

    let foundImage = false;

    const tryGetUrl = async (index: number) => {
      if (index >= potentialPaths.length) {
        // All attempts failed, use external placeholder
        setImageUrl(EXTERNAL_GREEN_PLACEHOLDER_URL);
        setIsActualPlaceholder(true);
        setIsLoading(false);
        return;
      }

      const path = potentialPaths[index];
      const sRef = storageRef(storage, `gs://${storageBucketName}/${path}`);

      try {
        const url = await getDownloadURL(sRef);
        setImageUrl(url);
        setIsActualPlaceholder(path.includes(USER_GREEN_PLACEHOLDER_FILENAME));
        foundImage = true;
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          // console.log(`Image not found at ${path}, trying next.`);
          await tryGetUrl(index + 1);
        } else {
          console.error(`Error fetching image from ${path}:`, error);
          await tryGetUrl(index + 1); // Try next on other errors too
        }
      } finally {
        if (foundImage || index >= potentialPaths.length -1 && !foundImage) {
          // if foundImage, or if it's the last attempt (which means it will set external placeholder if all failed)
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    tryGetUrl(0);

  }, [townName, storageBucketName]);

  if (isLoading) {
    return <Skeleton className="w-full h-full absolute inset-0" data-ai-hint="loading banner" />;
  }

  if (!imageUrl) {
    // This case should ideally be covered by the external placeholder in useEffect,
    // but as a final fallback.
    return <Skeleton className="w-full h-full absolute inset-0 bg-green-200" data-ai-hint="fallback green banner" />;
  }
  
  const altText = isActualPlaceholder ? `Placeholder banner for ${townName}` : `Banner image for ${townName}`;
  const aiHint = isActualPlaceholder ? "green background" : `${townName} landscape`;

  return (
    <Image
      src={imageUrl}
      alt={altText}
      layout="fill"
      objectFit="cover"
      className={isActualPlaceholder ? "z-0" : "opacity-20 z-0"}
      priority={!isActualPlaceholder}
      data-ai-hint={aiHint}
    />
  );
}
