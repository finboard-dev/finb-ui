export const NeuralNetworkLoader = () => {
  return (
    <div className="flex items-center justify-center py-6 w-full">
      <div className="loading-container relative w-64 h-16">
        {/* Nodes */}
        <div
          className="absolute top-4 left-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="absolute top-12 left-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="absolute top-1 left-16 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"
          style={{ animationDelay: "300ms" }}
        ></div>
        <div
          className="absolute top-7 left-16 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"
          style={{ animationDelay: "450ms" }}
        ></div>
        <div
          className="absolute top-14 left-16 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"
          style={{ animationDelay: "600ms" }}
        ></div>
        <div
          className="absolute top-2 left-32 w-3 h-3 bg-blue-600 rounded-full animate-pulse"
          style={{ animationDelay: "750ms" }}
        ></div>
        <div
          className="absolute top-9 left-32 w-3 h-3 bg-blue-600 rounded-full animate-pulse"
          style={{ animationDelay: "900ms" }}
        ></div>
        <div
          className="absolute top-4 left-48 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"
          style={{ animationDelay: "1050ms" }}
        ></div>
        <div
          className="absolute top-12 left-48 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"
          style={{ animationDelay: "1200ms" }}
        ></div>
        <div
          className="absolute top-7 left-60 w-3 h-3 bg-purple-600 rounded-full animate-pulse"
          style={{ animationDelay: "1350ms" }}
        ></div>

        {/* SVG Lines connecting nodes with pulsing animation */}
        <svg className="absolute top-0 left-0 w-full h-full z-0">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* First layer to second */}
          <line
            x1="4"
            y1="7"
            x2="16"
            y2="3"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
          />
          <line
            x1="4"
            y1="7"
            x2="16"
            y2="9"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "100ms" }}
          />
          <line
            x1="4"
            y1="7"
            x2="16"
            y2="14"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "200ms" }}
          />
          <line
            x1="4"
            y1="13"
            x2="16"
            y2="3"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "300ms" }}
          />
          <line
            x1="4"
            y1="13"
            x2="16"
            y2="9"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "400ms" }}
          />
          <line
            x1="4"
            y1="13"
            x2="16"
            y2="14"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "500ms" }}
          />

          {/* Second layer to third */}
          <line
            x1="18"
            y1="3"
            x2="32"
            y2="4"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "600ms" }}
          />
          <line
            x1="18"
            y1="3"
            x2="32"
            y2="10"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "700ms" }}
          />
          <line
            x1="18"
            y1="9"
            x2="32"
            y2="4"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "800ms" }}
          />
          <line
            x1="18"
            y1="9"
            x2="32"
            y2="10"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "900ms" }}
          />
          <line
            x1="18"
            y1="14"
            x2="32"
            y2="4"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1000ms" }}
          />
          <line
            x1="18"
            y1="14"
            x2="32"
            y2="10"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1100ms" }}
          />

          {/* Third layer to fourth */}
          <line
            x1="34"
            y1="4"
            x2="48"
            y2="6"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1200ms" }}
          />
          <line
            x1="34"
            y1="4"
            x2="48"
            y2="13"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1300ms" }}
          />
          <line
            x1="34"
            y1="10"
            x2="48"
            y2="6"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1400ms" }}
          />
          <line
            x1="34"
            y1="10"
            x2="48"
            y2="13"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1500ms" }}
          />

          {/* Fourth layer to fifth */}
          <line
            x1="50"
            y1="6"
            x2="60"
            y2="9"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1600ms" }}
          />
          <line
            x1="50"
            y1="13"
            x2="60"
            y2="9"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="line-animation"
            style={{ animationDelay: "1700ms" }}
          />
        </svg>

        {/* Pulse animation behind neural network */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full bg-indigo-600/10 animate-ping"
            style={{ animationDuration: "3s" }}
          ></div>
          <div
            className="absolute w-12 h-12 rounded-full bg-purple-600/20 animate-ping"
            style={{ animationDuration: "3s", animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute w-8 h-8 rounded-full bg-blue-600/30 animate-ping"
            style={{ animationDuration: "3s", animationDelay: "1s" }}
          ></div>
        </div>

        {/* Text below the network */}
        <div className="absolute -bottom-6 left-0 right-0 text-center text-sm font-medium text-indigo-700">
          Thinking...
        </div>
      </div>
    </div>
  );
};

// Floating Particles Animation Component
export const CompactParticlesLoader = () => {
  return (
    <div className="relative w-10 h-10">
      {/* Main pulsing circle in the middle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-sm shadow-purple-500/30 flex items-center justify-center z-10">
        <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
        </div>
      </div>

      {/* Orbiting particles - smaller and faster for compact design */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-indigo-200/60 animate-spin"
        style={{ animationDuration: "2s" }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"></div>
      </div>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-purple-200/60 animate-spin"
        style={{ animationDuration: "3s", animationDirection: "reverse" }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full shadow-sm shadow-purple-500/50"></div>
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/50"></div>
      </div>

      {/* Light rays from the center - shorter for compact design */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-pulse"></div>
        <div
          className="w-6 h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rotate-45 absolute animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="w-6 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent -rotate-45 absolute animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
};

export default CompactParticlesLoader;
