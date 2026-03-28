export type BlogAssetKind = 'eventos' | 'academia'

export type BlogAssetLink = {
  label: string
  href: string
  kind: BlogAssetKind
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
  intro: string
  sections: BlogSection[]
  ctaLabel: string
}
