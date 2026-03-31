import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CalendarDays, Tag } from 'lucide-react'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/blog/posts'
import { brandName, formatPageTitle } from '@/lib/brand'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: formatPageTitle('Artículo no encontrado'),
    }
  }

  return {
    title: `${post.title} | Blog | ${brandName}`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const publishedAt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(
    new Date(post.publishedAt)
  )
  const updatedAt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(
    new Date(post.updatedAt)
  )

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <article className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_320px]">
        <div className="space-y-8">
          <header className="rounded-3xl border bg-card p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Tag className="h-4 w-4" />
              {post.category}
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{post.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                <CalendarDays className="h-4 w-4" />
                Publicado {publishedAt}
              </span>
              <span className="rounded-full border px-3 py-1.5">Actualizado {updatedAt}</span>
              <span className="rounded-full border px-3 py-1.5">{post.readTime}</span>
            </div>
          </header>

          <section className="rounded-3xl border bg-card p-8 shadow-sm">
            <p className="text-lg leading-8">{post.intro}</p>
          </section>

          <div className="space-y-6">
            {post.sections.map((section) => (
              <section key={section.heading} className="rounded-3xl border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.points?.length ? (
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {section.points.map((point) => (
                      <li key={point} className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Relacionados</p>
            <div className="mt-4 space-y-3">
              {post.assetLinks.map((asset) => (
                <Link
                  key={`${asset.kind}-${asset.href}`}
                  href={asset.href}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span>
                    <span className="block text-sm font-medium">{asset.label}</span>
                    <span className="block text-xs text-muted-foreground">{asset.kind}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border bg-gradient-to-br from-muted/50 to-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Punto editorial</p>
            <p className="mt-3 text-lg font-medium leading-7">
              El blog explica. El catalogo vende. El hub entrega.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Usa esta pieza para descubrir el problema y moverte hacia una pagina canónica del activo.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Siguiente paso</p>
            <div className="mt-3 grid gap-3">
              <Link
                href={post.assetLinks[0]?.href ?? '/eventos'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {post.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/blog" className="text-center text-sm font-medium text-primary hover:underline">
                Volver al blog
              </Link>
            </div>
          </section>
        </aside>
      </article>
    </div>
  )
}
