export type BlogAssetKind = 'eventos' | 'academia'

export type BlogAssetLink = {
  label: string
  href: string
  kind: BlogAssetKind
}

export type BlogMetric = {
  label: string
  value: string
  note?: string
}

export type BlogFigure = {
  src: string
  alt: string
  caption: string
}

export type BlogResourceLink = {
  label: string
  href: string
  description?: string
}

export type BlogSection = {
  heading: string
  paragraphs: string[]
  points?: string[]
}

export type BlogPost = {
  slug: string
  title: string
  description: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  readTime: string
  category: string
  featured?: boolean
  tags: string[]
  canonicalFocus: BlogAssetKind[]
  assetLinks: BlogAssetLink[]
  resources?: BlogResourceLink[]
  stats?: BlogMetric[]
  figures?: BlogFigure[]
  intro: string
  sections: BlogSection[]
  ctaLabel: string
  ctaLink?: string
}
