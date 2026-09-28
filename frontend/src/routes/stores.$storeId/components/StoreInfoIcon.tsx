export type StoreInfoIconName =
  | 'gacha'
  | 'kuji'
  | 'payment'
  | 'parking'
  | 'elevator'
  | 'restroom'
  | 'accessibility'
  | 'lounge'
  | 'airConditioner'
  | 'capsuleBin'
  | 'clock'
  | 'phone'
  | 'instagram'
  | 'updated'
  | 'randomBox'
  | 'selectGacha'
  | 'facility';

export interface StoreInfoIconProps {
  name: StoreInfoIconName;
}

export function getStoreFacilityIconName(facility: string): StoreInfoIconName {
  const normalizedFacility = facility.replaceAll(' ', '').toLowerCase();

  if (normalizedFacility.includes('주차')) return 'parking';
  if (
    normalizedFacility.includes('엘리베이터') ||
    normalizedFacility.includes('승강기')
  ) {
    return 'elevator';
  }
  if (normalizedFacility.includes('화장실')) return 'restroom';
  if (
    normalizedFacility.includes('휠체어') ||
    normalizedFacility.includes('장애인')
  ) {
    return 'accessibility';
  }
  if (
    normalizedFacility.includes('휴게') ||
    normalizedFacility.includes('좌석')
  ) {
    return 'lounge';
  }
  if (
    normalizedFacility.includes('에어컨') ||
    normalizedFacility.includes('냉방') ||
    normalizedFacility.includes('냉난방')
  ) {
    return 'airConditioner';
  }
  if (
    normalizedFacility.includes('캡슐수거') ||
    (normalizedFacility.includes('캡슐') && normalizedFacility.includes('수거'))
  ) {
    return 'capsuleBin';
  }

  return 'facility';
}

export function StoreInfoIcon({ name }: StoreInfoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {name === 'gacha' && (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v9" />
        </>
      )}
      {name === 'kuji' && (
        <>
          <path d="M4 5.5h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5v-4Z" />
          <path d="M12 7.5v9" strokeDasharray="2 2" />
        </>
      )}
      {name === 'payment' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M7 15h4" />
        </>
      )}
      {name === 'parking' && (
        <>
          <path d="M5 16v-4.2l1.7-4.1A2 2 0 0 1 8.6 6h6.8a2 2 0 0 1 1.9 1.7l1.7 4.1V16" />
          <path d="M4 13h16v4H4zM6.5 17v2M17.5 17v2M7 13h.01M17 13h.01" />
        </>
      )}
      {name === 'elevator' && (
        <>
          <rect x="5" y="3" width="14" height="18" rx="1.5" />
          <path d="M12 3v18M8.5 8 7 6.5 5.5 8M18.5 16 17 17.5 15.5 16" />
        </>
      )}
      {name === 'restroom' && (
        <>
          <circle cx="8" cy="5" r="1.5" />
          <circle cx="16" cy="5" r="1.5" />
          <path d="M8 8v5m0 0-2.5 6M8 13l2.5 6M16 8l-2.5 7h5L16 8Zm0 7v4" />
        </>
      )}
      {name === 'accessibility' && (
        <>
          <circle cx="10" cy="4.5" r="1.5" />
          <path d="m10 7 .5 5h4l3 5M10.5 9H7.8a5 5 0 1 0 5.1 6M13 19a5 5 0 0 1-4 2" />
        </>
      )}
      {name === 'lounge' && (
        <>
          <path d="M6 12h12a2 2 0 0 1 2 2v4H4v-4a2 2 0 0 1 2-2Z" />
          <path d="M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 18v2M18 18v2" />
        </>
      )}
      {name === 'airConditioner' && (
        <>
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
          <path d="m9.5 5.5 2.5 2.2 2.5-2.2M9.5 18.5l2.5-2.2 2.5 2.2" />
        </>
      )}
      {name === 'capsuleBin' && (
        <>
          <path d="M6 8h12l-1 13H7L6 8ZM5 8h14M9 4h6l1 4H8l1-4Z" />
          <path d="M10 12.5a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0v-2ZM10 13.5h4" />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </>
      )}
      {name === 'phone' && (
        <path d="M7.2 3.5 10 7.7 8.1 9.5a15.4 15.4 0 0 0 6.4 6.4l1.8-1.9 4.2 2.8-.8 3a2 2 0 0 1-2 1.5C10 20.5 3.5 14 2.7 6.3a2 2 0 0 1 1.5-2l3-.8Z" />
      )}
      {name === 'instagram' && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </>
      )}
      {name === 'updated' && (
        <>
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 5v6h-6" />
        </>
      )}
      {name === 'randomBox' && (
        <>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 8v9l8 4 8-4V8M12 12v9" />
          <path d="M10 7.5h4" />
        </>
      )}
      {name === 'selectGacha' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m12 7 1.3 2.7 3 .4-2.2 2.1.6 3-2.7-1.4-2.7 1.4.6-3-2.2-2.1 3-.4L12 7Z" />
        </>
      )}
      {name === 'facility' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.6 2.6L16.5 9" />
        </>
      )}
    </svg>
  );
}
