import React from 'react';

/**
 * Official Zetoco Brand Logo Component
 * Renders the official ribbon Z logo mark or full horizontal brand lockup.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'} [size='md'] - Visual size preset
 * @param {boolean} [showText=true] - Whether to show the "Zetoco" wordmark
 * @param {boolean} [symbolOnly=false] - When true, only displays the vibrant ribbon Z mark
 * @param {string} [className=''] - Additional container classes
 * @param {string} [imageClassName=''] - Additional image element classes
 */
export default function ZetocoLogo({
  size = 'md',
  showText = true,
  symbolOnly = false,
  className = '',
  imageClassName = '',
  ...props
}) {
  // Sizing definitions for symbol-only
  const symbolSizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
  };

  // Sizing definitions for full horizontal lockup
  const lockupSizes = {
    xs: 'h-4 w-auto',
    sm: 'h-5 w-auto',
    md: 'h-7 w-auto',
    lg: 'h-9 w-auto',
    xl: 'h-11 w-auto',
    '2xl': 'h-14 w-auto',
  };

  if (symbolOnly || !showText) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        {...props}
      >
        <img
          src="/zetoco-icon.png"
          alt="Zetoco"
          className={`${symbolSizes[size] || symbolSizes.md} object-contain select-none transition-transform ${imageClassName}`}
          loading="eager"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center shrink-0 ${className}`}
      {...props}
    >
      <img
        src="/zetoco-logo.png"
        alt="Zetoco"
        className={`${lockupSizes[size] || lockupSizes.md} object-contain select-none ${imageClassName}`}
        loading="eager"
        draggable={false}
      />
    </div>
  );
}

export function ZetocoIcon({ size = 'md', className = '', ...props }) {
  return <ZetocoLogo size={size} symbolOnly={true} className={className} {...props} />;
}
