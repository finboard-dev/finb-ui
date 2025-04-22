import { Button } from "@/components/ui/button";

const SignInWithQuickBooksBtn = ({ onClick }: any) => {
  return (
    <Button
      variant="ghost"
      onClick={() => onClick()}
      className="w-full h-12 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      aria-label="Sign in with Intuit"
    ></Button>
  );
};

export default SignInWithQuickBooksBtn;
