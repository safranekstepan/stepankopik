import Image from 'next/image'

export default function EvisionsLogo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/evisions-logo.svg"
      alt="evisions"
      width={120}
      height={32}
      className={className}
      priority
    />
  )
}
