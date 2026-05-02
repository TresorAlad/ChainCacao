import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  alt?: string
  /** Connexion / inscription : évite le flash du logo */
  priority?: boolean
}

/**
 * Logo du projet : photographie cabosse (`frontend/public/icon.png`).
 * `object-cover` + `object-center` pour un rendu net même en petit format.
 */
export function BrandLogo({
  className = '',
  alt = 'ChainCacao — cacao',
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/icon.png"
      alt={alt}
      width={512}
      height={512}
      sizes="(max-width: 768px) 48px, 80px"
      priority={priority}
      className={`object-cover object-center shrink-0 ${className}`}
    />
  )
}
