import Link from 'next/link'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white">
            <div className="flex w-full max-w-md flex-col items-center justify-center px-4">
                <div className="mb-8 flex flex-col items-center space-y-2 text-center">
                    <h1 className="text-3xl font-bold">👋 Hi, Welcome to finb.ai</h1>
                    <p className="text-muted-foreground">Intelligent financial reporting, reimagined</p>
                </div>

                <div className="w-full space-y-4">
                    <Link
                        href="/no-companies"
                        className="flex h-12 w-full items-center justify-center rounded-md bg-[#3182ce] px-4 py-2 font-medium text-white hover:bg-[#2b6cb0] focus:outline-none"
                    >
                        Sign in with Intuit
                    </Link>

                    <Link
                        href="/no-companies"
                        className="flex h-12 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                        Login with Email
                    </Link>
                </div>

                <div className="mt-auto pt-16 text-center text-sm text-gray-500">
                    <p>
                        By logging in, you agree to our{' '}
                        <Link href="#" className="text-[#3182ce] hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className="text-[#3182ce] hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                    <p className="mt-4">© 2025 finb.ai</p>
                </div>
            </div>
        </div>
    )
}
