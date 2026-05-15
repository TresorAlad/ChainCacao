'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { LocationMapProps } from './LocationMap'

export const LocationMap = dynamic(
  () => import('./LocationMap').then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-500 border border-[var(--color-border)]"
        style={{ height: 280 }}
      >
        Chargement de la carte…
      </div>
    ),
  }
) as ComponentType<LocationMapProps>
