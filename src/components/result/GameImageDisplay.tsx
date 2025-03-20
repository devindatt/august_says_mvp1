
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { GameImage as GameImageType } from '@/utils/contentProcessing/types';
import { Skeleton } from '@/components/ui/skeleton';

interface GameImageProps {
  imagePath: string;
  altText?: string;
  isDefault?: boolean;
  isLocalImage?: boolean;
}

export const GameImage: React.FC<GameImageProps> = ({ 
  imagePath, 
  altText = "Game visualization",
  isDefault = false,
  isLocalImage = false
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        
        if (isLocalImage) {
          // For locally uploaded images, prepend with slash to reference from public folder
          setImageUrl(`/${imagePath}`);
        } else {
          // Get public URL for the image from Supabase storage
          const { data } = await supabase.storage
            .from('game_images')
            .getPublicUrl(imagePath);
          
          if (data?.publicUrl) {
            setImageUrl(data.publicUrl);
          } else {
            throw new Error('No public URL returned');
          }
        }
      } catch (err: any) {
        console.error('Error fetching game image:', err);
        setError(err.message || 'Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    if (imagePath) {
      fetchImage();
    }
  }, [imagePath, isLocalImage]);

  if (isLoading) {
    return (
      <Skeleton className="w-full h-40 bg-white/5 rounded-lg" />
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full p-4 bg-white/5 border border-red-400/20 rounded-lg">
        <p className="text-red-400">Unable to load game image: {error || 'Image not found'}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 mb-6"
    >
      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full object-cover"
          loading="lazy"
        />
      </div>
      {altText && altText !== "Game visualization" && (
        <p className="text-sm text-white/60 mt-2 italic">{altText}</p>
      )}
    </motion.div>
  );
};

interface GameImageDisplayProps {
  images: GameImageType[];
  defaultImages?: GameImageType[];
  useLocalImages?: boolean;
}

export const GameImageDisplay: React.FC<GameImageDisplayProps> = ({ 
  images, 
  defaultImages = [],
  useLocalImages = false
}) => {
  // Combine default images with provided images if there are no provided images
  const displayImages = images.length > 0 ? images : defaultImages;
  
  if (!displayImages || displayImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 my-6">
      <h4 className="text-lg font-medium text-white/90">Game Visualizations</h4>
      <div className="space-y-8">
        {displayImages.map((image, index) => (
          <GameImage 
            key={index} 
            imagePath={image.path} 
            altText={image.caption} 
            isDefault={images.length === 0}
            isLocalImage={useLocalImages}
          />
        ))}
      </div>
    </div>
  );
};
