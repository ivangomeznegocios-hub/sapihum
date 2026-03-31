import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Sparkles } from 'lucide-react'
import { getBlogPosts, getFeaturedBlogPosts } from '@/lib/blog/posts'
import { getPublicCatalogDescription } from '@/lib/events/public'
import { formatPageTitle } from '@/lib/brand'

export const metadata: Metadata = {
  title: formatPageTitle('Blog'),
  description:
    'Articulos editoriales que conectan eventos, cursos y formaciones con una arquitectura comercial pensada para posicionar y convertir.',
}

export default function BlogPage() {
  const posts = getBlogPosts()
  const featuredPosts = getFeaturedBlogPosts()

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-muted/30 p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Contenido editorial
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Blog para posicionar eventos, cursos y formaciones como activos comerciales
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                El blog atrae, explica y deriva a las paginas canónicas del catálogo.
                La venta vive en el activo; la narrativa vive aquí.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/eventos"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CalendarDays className="h-4 w-4" />
                  Explorar eventos
                </Link>
                <Link
                  href="/cursos"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver cursos
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">Principio editorial</p>
              <p className="mt-3 text-lg font-medium leading-7">
                {getPublicCatalogDescription('eventos')}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Cada articulo termina en una accion clara hacia el catalogo, no en una lectura sin salida.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Destacados
            </div>
            <div className="grid gap-4">
              {featuredPosts.map((post) => (
                <article key={post.slug} className="rounded-3xl border bg-card p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(post.publishedAt))}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">{post.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      Leer articulo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Que encontraras aqui</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {posts.length} articulos editoriales conectados con el catalogo publico.
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-medium">Eventos</p>
                  <p className="mt-1 text-muted-foreground">Paginas canónicas para captar demanda y convertir.</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-medium">Cursos</p>
                  <p className="mt-1 text-muted-foreground">Landing pages con promesa, temario y acceso privado.</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-medium">Formaciones</p>
                  <p className="mt-1 text-muted-foreground">Experiencias educativas con estructura, promesa y acceso claro.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Articulos recientes</h2>
              <div className="mt-4 space-y-4">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block rounded-2xl border px-4 py-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
