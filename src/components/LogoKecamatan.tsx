import React, { useState } from 'react';

export const LOGO_DRIVE_ID = '1atRSFEFUkkEK9OcxyfmkQZqMur0iS411';
export const LOGO_PRIMARY_URL = `https://lh3.googleusercontent.com/d/${LOGO_DRIVE_ID}`;
export const LOGO_THUMBNAIL_URL = `https://drive.google.com/thumbnail?id=${LOGO_DRIVE_ID}&sz=w500`;

interface LogoKecamatanProps {
  className?: string;
  imgClassName?: string;
  size?: number;
  alt?: string;
}

export const LogoKecamatan: React.FC<LogoKecamatanProps> = ({
  className = '',
  imgClassName = '',
  size = 80,
  alt = 'Lambang Kabupaten Ponorogo - Kecamatan Pulung',
}) => {
  const [srcIndex, setSrcIndex] = useState<number>(0);
  const sources = [LOGO_PRIMARY_URL, LOGO_THUMBNAIL_URL];

  const handleError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setSrcIndex(sources.length); // trigger SVG fallback
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size * 1.15 }}
    >
      {srcIndex < sources.length ? (
        <img
          src={sources[srcIndex]}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={handleError}
          className={`w-full h-full object-contain filter drop-shadow-xs ${imgClassName}`}
        />
      ) : (
        /* Crisp Vector Fallback if offline / external network blocked */
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 5 L88 22 V65 C88 92 50 115 50 115 C50 115 12 92 12 65 V22 Z"
            fill="#064e3b"
            stroke="#042f2e"
            strokeWidth="3"
          />
          <path
            d="M50 10 L83 25 V63 C83 87 50 108 50 108 C50 108 17 87 17 63 V25 Z"
            fill="#f8fafc"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          <path
            d="M50 20 L58 32 H70 L60 40 L64 52 L50 44 L36 52 L40 40 L30 32 H42 Z"
            fill="#ca8a04"
          />
          <polygon
            points="50,22 53,29 60,30 55,35 56,42 50,38 44,42 45,35 40,30 47,29"
            fill="#f59e0b"
            stroke="#78350f"
            strokeWidth="0.5"
          />
          <circle cx="50" cy="62" r="18" fill="#14532d" />
          <path
            d="M50 48 V76 M46 54 L54 54 M47 72 L53 72"
            stroke="#fef08a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="62" r="6" fill="#facc15" />
          <path
            d="M20 90 Q50 98 80 90 L82 99 Q50 108 18 99 Z"
            fill="#ca8a04"
            stroke="#78350f"
            strokeWidth="1"
          />
          <text
            x="50"
            y="97"
            textAnchor="middle"
            fontSize="6"
            fontWeight="900"
            fill="#1e293b"
            fontFamily="sans-serif"
            letterSpacing="0.5"
          >
            PONOROGO
          </text>
        </svg>
      )}
    </div>
  );
};
