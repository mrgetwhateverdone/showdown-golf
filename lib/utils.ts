type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean } | ClassValue[]

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input))
    } else if (typeof input === "object" && !Array.isArray(input)) {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    } else if (Array.isArray(input)) {
      const nested = clsx(...input)
      if (nested) classes.push(nested)
    }
  }

  return classes.join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs)
}

export function cva(base: string, config?: { variants?: any; defaultVariants?: any }) {
  return (props?: any) => {
    if (!config || !props) return base

    let classes = base

    if (config.variants && props) {
      Object.keys(config.variants).forEach((key) => {
        if (props[key] && config.variants[key][props[key]]) {
          classes += " " + config.variants[key][props[key]]
        }
      })
    }

    return classes
  }
}

export type VariantProps<T extends (...args: any) => any> = {
  [K in keyof Parameters<T>[0]]?: Parameters<T>[0][K]
}
