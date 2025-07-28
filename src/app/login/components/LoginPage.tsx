import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import intuitButton from '../../../../public/buttons/Sign_in_with_Intuit_SVG/Sign_in_blue_btn_tall_default.svg';
import hoverIntuitButton from '../../../../public/buttons/Sign_in_with_Intuit_SVG/Sign_in_blue_btn_tall_hover.svg';

export const LoginPage = ({ handleIntuitLogin, isLoading }: any) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white relative">
      <div className="flex w-full max-w-max flex-col items-center justify-center px-4">
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">👋 Hi, Welcome to finb.ai</h1>
          <p className="text-muted-foreground">Intelligent financial reporting, reimagined</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleIntuitLogin}
            disabled={isLoading}
            className={`relative group ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            {isLoading ? (
              <div className="relative w-[201px] h-[48px] bg-[#3182ce] rounded-md flex items-center justify-center transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-white text-sm font-medium">Connecting...</span>
                </div>
              </div>
            ) : (
              <>
                <Image src={intuitButton} alt="Sign in with Intuit" className="group-hover:opacity-0" priority />
                <Image
                  src={hoverIntuitButton}
                  alt="Sign in with Intuit"
                  className="absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                  priority
                />
              </>
            )}
          </button>
        </div>
        <div className="mt-auto pt-16 text-center text-sm w-full text-gray-500 absolute bottom-16">
          <p>
            By logging in, you agree to our{' '}
            <Link href="/terms" className="text-[#3182ce] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#3182ce] hover:underline">
              Privacy Policy
            </Link>
          </p>
          <p className="mt-4">© 2025 finb.ai</p>
        </div>
      </div>
    </div>
  );
};
