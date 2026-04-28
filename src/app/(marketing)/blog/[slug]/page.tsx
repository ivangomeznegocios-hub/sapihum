import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen, CalendarDays, Download, Tag } from 'lucide-react'
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
      title: formatPageTitle('Articulo no encontrado'),
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

          {post.stats?.length ? (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {post.stats.map((metric) => (
                <div key={`${metric.label}-${metric.value}`} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{metric.value}</p>
                  {metric.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.note}</p> : null}
                </div>
              ))}
            </section>
          ) : null}

          {post.figures?.length ? (
            <section className="rounded-3xl border bg-card p-8 shadow-sm">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resumen visual</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Indicadores clave del estudio</h2>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {post.figures.map((figure) => (
                  <figure key={figure.src} className="overflow-hidden rounded-2xl border bg-background">
                    <div className="relative aspect-[16/9] bg-white">
                      <Image
                        src={figure.src}
                        alt={figure.alt}
                        fill
                        sizes="(min-width: 1024px) 40rem, (min-width: 768px) 50vw, 100vw"
                        className="object-contain p-2"
                      />
                    </div>
                    <figcaption className="border-t px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {figure.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

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

          {post.resources?.length ? (
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Recursos</p>
              <div className="mt-4 space-y-3">
                {post.resources.map((resource) => {
                  const isPdf = resource.href.toLowerCase().endsWith('.pdf')

                  return (
                    <Link
                      key={resource.href}
                      href={resource.href}
                      download={isPdf ? '' : undefined}
                      className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <span>
                        <span className="block text-sm font-medium">{resource.label}</span>
                        {resource.description ? (
                          <span className="block text-xs text-muted-foreground">{resource.description}</span>
                        ) : null}
                      </span>
                      {isPdf ? <Download className="h-4 w-4 text-muted-foreground" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border bg-gradient-to-br from-muted/50 to-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Continúa tu aprendizaje</p>
            <p className="mt-3 text-lg font-medium leading-7">
              La formación continua y el bienestar personal son la base de una buena práctica.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Si estas ideas resuenan con tu momento actual, te invitamos a explorar opciones de desarrollo profesional diseñadas específicamente para acompañarte.
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
                href={post.ctaLink ?? post.assetLinks[0]?.href ?? '/eventos'}
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
