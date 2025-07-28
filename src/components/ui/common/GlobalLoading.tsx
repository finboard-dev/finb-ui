import { Card, CardContent } from '@/components/ui/card';
import FinBoardLoadingImg from '@/../public/FinBoardloading.svg';
import Image from 'next/image';

const LoadingAnimation = ({ message }: { message: string }) => {
  return (
    <>
      {/*
        This <style> block is updated for a gentler "wave" effect.
        - Animation is slower and calmer (3 seconds).
        - The wave expands further before fading (scale(2.5)).
        - A standard 'ease' timing function creates a more natural motion.
      */}
      <style>
        {`
          @keyframes wave {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          .animate-wave-custom {
            animation: wave 3s cubic-bezier(0.25, 0.1, 0.25, 1.0) infinite;
          }
        `}
      </style>

      <Card className="flex min-h-screen items-center justify-center border-none bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Animated Wave 1: Using a thinner 1px border for a subtle look. */}
            <div className="animate-wave-custom absolute inline-flex h-full w-full rounded-full border border-gray-300"></div>

            {/* Animated Wave 2: Delayed by 1.5s to create a soft ripple. */}
            <div
              className="animate-wave-custom absolute inline-flex h-full w-full rounded-full border border-gray-300"
              style={{ animationDelay: '1.5s' }}
            ></div>

            {/* SVG Logo */}
            <Image src={FinBoardLoadingImg} alt="FinBoard Loading" />
          </div>
          <p className="text-sm text-gray-500"></p>
        </CardContent>
      </Card>
    </>
  );
};

export default LoadingAnimation;
