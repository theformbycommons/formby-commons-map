
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';

interface TownPreviewImageProps {
  townName: string;
  storageBucketName?: string;
}

const FALLBACK_PLACEHOLDER_URL = 'https://placehold.co/400x250.png';
const CUSTOM_PAINTED_PLACEHOLDER_FILENAME = 'painted_town_preview_placeholder.png';

export default function TownPreviewImage({ townName, storageBucketName }: TownPreviewImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActualPlaceholder, setIsActualPlaceholder] = useState(false);

  useEffect(() => {
    if (!storageBucketName) {
      console.warn("TownPreviewImage: storageBucketName is not provided. Falling back to external placeholder.");
      setImageUrl(FALLBACK_PLACEHOLDER_URL);
      setIsActualPlaceholder(true);
      setIsLoading(false);
      return;
    }

    const storage = getStorage();
    const formattedTownName = townName.toLowerCase().replace(/\s+/g, '-');

    const potentialPaths = [
      `town-images/${formattedTownName}.png`,
      `town-images/${formattedTownName}.jpg`,
      `town-images/${CUSTOM_PAINTED_PLACEHOLDER_FILENAME}`, // Your custom placeholder
    ];

    let foundImage = false;

    const tryGetUrl = async (index: number) => {
      if (index >= potentialPaths.length) {
        // All attempts failed, use external fallback placeholder
        setImageUrl(FALLBACK_PLACEHOLDER_URL);
        setIsActualPlaceholder(true);
        setIsLoading(false);
        return;
      }

      const path = potentialPaths[index];
      const sRef = storageRef(storage, `gs://${storageBucketName}/${path}`);

      try {
        const url = await getDownloadURL(sRef);
        setImageUrl(url);
        setIsActualPlaceholder(path.includes(CUSTOM_PAINTED_PLACEHOLDER_FILENAME) || path === FALLBACK_PLACEHOLDER_URL);
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
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    tryGetUrl(0);

  }, [townName, storageBucketName]);

  if (isLoading) {
    return <Skeleton className="w-full h-48 rounded-t-md" data-ai-hint="loading preview" />;
  }

  if (!imageUrl) {
    // Fallback if something went wrong and imageUrl is still null
    return <Skeleton className="w-full h-48 rounded-t-md bg-muted" data-ai-hint="error preview" />;
  }
  
  const altText = isActualPlaceholder ? `Placeholder preview for ${townName}` : `Preview image for ${townName}`;
  const aiHint = isActualPlaceholder ? "town placeholder" : `${townName} preview`;

  return (
    <Image
      src={imageUrl}
      alt={altText}
      width={400}
      height={250}
      className="object-cover w-full h-48 rounded-t-md" // Ensure dimensions are controlled by className too
      data-ai-hint={aiHint}
      priority={!isActualPlaceholder} // Only prioritize actual town images
    />
  );
}
