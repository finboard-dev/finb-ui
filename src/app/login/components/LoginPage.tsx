import Link from "next/link"
import Image from "next/image"
import intuitButton from "../../../../public/buttons/Sign_in_with_Intuit_SVG/Sign_in_blue_btn_tall_default.svg"
import hoverIntuitButton from "../../../../public/buttons/Sign_in_with_Intuit_SVG/Sign_in_blue_btn_tall_hover.svg"

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
                        className="cursor-pointer relative group"
                    >
                        {isLoading ? (
                            <div className="h-12 flex items-center justify-center rounded-md bg-[#3182ce] text-white">
                                Loading...
                            </div>
                        ) : (
                            <>
                                <Image
                                    src={intuitButton}
                                    alt="Sign in with Intuit"
                                    className="group-hover:opacity-0"
                                    priority
                                />
                                <Image
                                    src={hoverIntuitButton}
                                    alt="Sign in with Intuit"
                                    className="absolute top-0 left-0 opacity-0 group-hover:opacity-100"
                                    priority
                                />
                            </>
                        )}
                    </button>
                    {/*<Link*/}
                    {/*    href="/login-email"*/}
                    {/*    className="flex h-12 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"*/}
                    {/*>*/}
                    {/*    Login with Email*/}
                    {/*</Link>*/}
                </div>
                <div className="mt-auto pt-16 text-center text-sm w-full text-gray-500 absolute bottom-16">
                    <p>
                        By logging in, you agree to our{" "}
                        <Link href="/terms" className="text-[#3182ce] hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-[#3182ce] hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                    <p className="mt-4">© 2025 finb.ai</p>
                </div>
            </div>
        </div>
    )
}