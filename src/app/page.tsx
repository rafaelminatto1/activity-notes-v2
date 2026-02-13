"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Sparkles,
  Search,
  FolderTree,
  Moon,
  Smartphone,
  Zap,
  PenLine,
  Share2,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/documents");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col scroll-smooth">
      <Navbar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <AIShowcaseSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

/* ========== NAVBAR ========== */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b bg-background/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-5 w-5" />
          Activity Notes
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Recursos
          </a>
          <a
            href="#ai"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            IA
          </a>
          <a
            href="#how-it-works"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Como funciona
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">
              Começar grátis
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ========== HERO ========== */

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Powered by Gemini AI
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Suas notas, ideias
          <br />e projetos.{" "}
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Com inteligência artificial.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Activity Notes é seu espaço de trabalho completo. Escreva com
          clareza, pense com profundidade e mantenha tudo organizado com
          assistência de IA.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="px-8 text-base" asChild>
            <Link href="/register">
              Começar gratuitamente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="px-8 text-base" asChild>
            <Link href="/login">Já tenho uma conta</Link>
          </Button>
        </div>

        {/* App mockup */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-xl border bg-card shadow-2xl shadow-black/10 overflow-hidden">
            {/* Fake title bar */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground">
                Activity Notes
              </div>
            </div>

            {/* Fake app content */}
            <div className="flex">
              {/* Fake sidebar */}
              <div className="hidden w-52 border-r bg-muted/30 p-4 sm:block">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium">
                    <FileText className="h-3.5 w-3.5" />
                    Meu Projeto
                  </div>
                  {["Anotações", "Ideias", "Tarefas", "Referências"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fake editor */}
              <div className="flex-1 p-6 sm:p-8">
                <div className="space-y-3">
                  <div className="text-2xl font-bold sm:text-3xl">
                    Plano do projeto
                  </div>
                  <div className="h-3 w-4/5 rounded bg-muted" />
                  <div className="h-3 w-3/5 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-purple-500/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Sugestão da IA
                    </div>
                    <div className="mt-1.5 h-3 w-full rounded bg-purple-500/10" />
                    <div className="mt-1 h-3 w-3/4 rounded bg-purple-500/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 blur-2xl" />
        </div>
      </div>
    </section>
  );
}

/* ========== FEATURES ========== */

const features = [
  {
    icon: PenLine,
    title: "Editor poderoso",
    description:
      "Editor rico com comandos de barra, tabelas, blocos de código, checklists e muito mais.",
  },
  {
    icon: FolderTree,
    title: "Organização flexível",
    description:
      "Documentos aninhados, ícones e capas customizáveis. Organize do seu jeito.",
  },
  {
    icon: Search,
    title: "Busca instantânea",
    description:
      "Encontre qualquer nota em segundos. Busca por título e conteúdo com Ctrl+K.",
  },
  {
    icon: Sparkles,
    title: "IA integrada",
    description:
      "Resuma, expanda, traduza, mude o tom e continue escrevendo com Gemini AI.",
  },
  {
    icon: Moon,
    title: "Tema escuro",
    description:
      "Alterne entre tema claro, escuro ou automático com transição suave.",
  },
  {
    icon: Smartphone,
    title: "Responsivo",
    description:
      "Use em qualquer dispositivo. Interface adaptável para desktop, tablet e celular.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
            Recursos
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que você precisa para suas notas
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Um editor completo com ferramentas inteligentes para escrever,
            organizar e compartilhar suas ideias.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== AI SHOWCASE ========== */

function AIShowcaseSection() {
  return (
    <section
      id="ai"
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
              Inteligência Artificial
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Escreva melhor,{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                mais rápido
              </span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A IA do Activity Notes entende o contexto do seu documento e
              ajuda você a escrever com mais clareza e produtividade.
              Disponível diretamente no editor, sem trocar de ferramenta.
            </p>
            <ul className="space-y-3">
              {[
                "Continue escrevendo a partir do seu texto",
                "Resuma, expanda ou simplifique parágrafos",
                "Traduza para 5+ idiomas instantaneamente",
                "Corrija ortografia e mude o tom",
                "Gere ideias e brainstorm criativo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual demo */}
          <div className="relative">
            <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
              <div className="border-b px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Assistente IA
              </div>
              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground max-w-[80%]">
                    Resuma o texto acima em 3 pontos
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="rounded-lg border bg-muted/50 px-3.5 py-2.5 text-sm max-w-[85%] space-y-2">
                    <p className="font-medium text-purple-600 dark:text-purple-400 text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Gemini AI
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>1. Organizar notas de forma hierárquica</li>
                      <li>2. Usar IA para melhorar a escrita</li>
                      <li>3. Compartilhar documentos publicamente</li>
                    </ul>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <div className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                    Inserir no documento
                  </div>
                  <div className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                    Copiar
                  </div>
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== HOW IT WORKS ========== */

const steps = [
  {
    number: "1",
    icon: PenLine,
    title: "Crie sua conta",
    description:
      "Cadastre-se gratuitamente com e-mail ou Google. Em segundos você está pronto.",
  },
  {
    number: "2",
    icon: Zap,
    title: "Escreva e organize",
    description:
      "Use o editor com blocos, comandos de barra e organize em documentos aninhados.",
  },
  {
    number: "3",
    icon: Share2,
    title: "Compartilhe e publique",
    description:
      "Publique páginas com um clique e compartilhe o link com quem quiser.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
            Simples assim
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="mb-1 text-xs font-bold text-primary">
                PASSO {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Connector arrow (hidden on last) */}
              {step.number !== "3" && (
                <div className="absolute top-7 -right-4 hidden sm:block">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== CTA ========== */

function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <div className="rounded-2xl border bg-gradient-to-b from-primary/5 to-transparent p-10 sm:p-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para organizar suas ideias?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Comece gratuitamente e descubra como a IA pode transformar sua
            forma de escrever e organizar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="px-8 text-base" asChild>
              <Link href="/register">
                Começar gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-base" asChild>
              <Link href="/login">Já tenho uma conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========== FOOTER ========== */

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            Activity Notes
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Feito com Next.js, Firebase e Gemini AI
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#ai" className="hover:text-foreground transition-colors">
              IA
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
