"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Calculator,
  FileSpreadsheet,
  PieChart,
  DollarSign,
  Percent,
  TrendingUp,
  ClipboardCheck,
} from "lucide-react";
import Image from "next/image";
import accountantImage from "@/../public/accountant.svg";
import { Button } from "@/components/ui/button";
import intuitButton from "@/../public/images/icons/Sign_in_blue_btn_med_default.svg";
import hoverIntuitButton from "@/../public/images/icons/Sign_in_blue_btn_med_hover.svg";

// Animation component for floating icons
const FloatingIcon = ({
  icon: Icon,
  size = 24,
  color = "#0077C5",
  initialPosition = { x: 0, y: 0 },
  animationDuration = 20,
  delay = 0,
}: any) => {
  return (
    <div
      className="absolute opacity-10 transition-all duration-1000"
      style={{
        left: `${initialPosition.x}%`,
        top: `${initialPosition.y}%`,
        animation: `float ${animationDuration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon size={size} color={color} />
    </div>
  );
};

export default function LoginPage({ handleIntuitLogin, isLoading }: any) {
  const [floatingIcons, setFloatingIcons] = useState<
    {
      Icon: React.ComponentType<any>;
      size: number;
      delay: number;
      position: { x: number; y: number };
    }[]
  >([]);

  useEffect(() => {
    // Generate random positions for floating icons
    const icons = [
      { Icon: Calculator, size: 32, delay: 0, position: { x: 15, y: 20 } },
      { Icon: BarChart3, size: 40, delay: 2, position: { x: 80, y: 15 } },
      { Icon: FileSpreadsheet, size: 36, delay: 4, position: { x: 70, y: 70 } },
      { Icon: PieChart, size: 38, delay: 6, position: { x: 20, y: 65 } },
      { Icon: DollarSign, size: 30, delay: 8, position: { x: 40, y: 30 } },
      { Icon: Percent, size: 28, delay: 10, position: { x: 60, y: 40 } },
      { Icon: TrendingUp, size: 34, delay: 12, position: { x: 30, y: 80 } },
      { Icon: ClipboardCheck, size: 32, delay: 14, position: { x: 85, y: 60 } },
    ];
    setFloatingIcons(icons);
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-white to-[#f0f7ff]">
      {/* Left side - Login */}
      <div className="flex w-full items-center justify-center p-8 md:w-1/2">
        <Card className="w-full max-w-md border-none bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-primary">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg">
              Sign in to access your accounting dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <button
              onClick={() => {
                handleIntuitLogin();
              }}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full"></div>
              ) : (
                <Image
                  src={intuitButton}
                  alt="Sign in with Intuit"
                  width={200}
                  height={50}
                  className="w-full h-full object-contain hover:opacity-80"
                  onMouseOver={(e) =>
                    (e.currentTarget.src = hoverIntuitButton.src)
                  }
                  onMouseOut={(e) => (e.currentTarget.src = intuitButton.src)}
                />
              )}
            </button>

            <div className="mt-6 text-left">
              <p className="text-sm text-gray-500">
                Secure login powered by Intuit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Illustration & Animation */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#f0f7ff] p-8 md:w-1/2">
        {/* Floating background icons */}
        {floatingIcons.map((icon, index) => (
          <FloatingIcon
            key={index}
            icon={icon.Icon}
            size={icon.size}
            initialPosition={icon.position}
            delay={icon.delay}
          />
        ))}

        {/* Main accountant illustration */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#0077C5]">
              Accounting Solutions
            </h2>
            <p className="mt-2 text-gray-600">
              Streamline your financial workflow
            </p>
          </div>

          <div className="accountant-illustration relative h-[400px] w-[300px] md:h-[500px] md:w-[400px]">
            <Image
              src={accountantImage}
              alt="Professional Accountant"
              width={400}
              height={500}
              className="accountant-image animate-subtle-float"
            />

            {/* Animated elements around the accountant */}
            <div className="absolute -right-10 top-20 animate-float-slow">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <Calculator className="h-8 w-8 text-[#0077C5]" />
              </div>
            </div>

            <div
              className="absolute -left-10 top-40 animate-float-slow"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <BarChart3 className="h-8 w-8 text-[#0077C5]" />
              </div>
            </div>

            <div
              className="absolute -right-5 bottom-40 animate-float-slow"
              style={{ animationDelay: "2.5s" }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <PieChart className="h-8 w-8 text-[#0077C5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-15px) translateX(10px);
          }
          50% {
            transform: translateY(5px) translateX(-10px);
          }
          75% {
            transform: translateY(-5px) translateX(15px);
          }
        }

        @keyframes subtle-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }

        .animate-subtle-float {
          animation: subtle-float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
