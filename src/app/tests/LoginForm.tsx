"use client";

import type { NextPage } from 'next';
import { useState } from 'react';
import Head from "next/head";

const EmailLogin: NextPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Implement email login logic here
        console.log('Logging in with email:', email);

        // After authentication logic
        // router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
            <Head>
                <title>Login with Email - finb.ai</title>
                <meta name="description" content="Login to finb.ai with your email" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                    <h1 className="text-2xl font-semibold text-center mb-6">Login to finb.ai</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-finb-blue"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-finb-blue"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-finb-blue focus:ring-finb-blue border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="text-finb-blue hover:underline">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-finb-blue text-white py-3 px-6 rounded text-base font-medium transition-colors hover:bg-finb-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => window.open('/')}
                            className="text-finb-blue hover:underline text-sm font-medium"
                        >
                            Back to login options
                        </button>
                    </div>
                </div>
            </main>

            <footer className="w-full h-16 flex justify-center items-center text-sm text-gray-500">
                <p>© 2025 finb.ai</p>
            </footer>
        </div>
    );
};

export default EmailLogin;