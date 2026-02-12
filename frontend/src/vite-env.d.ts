/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string
        "ios-src"?: string
        alt?: string
        ar?: boolean | string
        "ar-modes"?: string
        "ar-scale"?: string
        "ar-placement"?: string
        "camera-controls"?: boolean | string
        "touch-action"?: string
        "disable-zoom"?: boolean | string
        "auto-rotate"?: boolean | string
        "rotation-per-second"?: string
        onLoad?: () => void
        onError?: () => void
        slot?: string
      },
      HTMLElement
    >
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string
        ar?: boolean
        "ar-modes"?: string
        "camera-controls"?: boolean
        alt?: string
        "environment-image"?: string
        "shadow-intensity"?: string
        style?: React.CSSProperties
      },
      HTMLElement
    >
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
