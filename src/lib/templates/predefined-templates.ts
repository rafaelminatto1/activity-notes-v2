/**
 * Predefined templates for Activity Notes v2
 * Based on common productivity tools (Notion, Evernote, etc.)
 */

export const PREDEFINED_TEMPLATES = [
  {
    id: "system-meeting-notes",
    name: "Anotações de Reunião",
    description: "Estrutura completa para pauta, participantes, notas e ações.",
    icon: "👥",
    color: "#3b82f6", // Blue
    category: "Trabalho",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "📅 Reunião: [Assunto]" }] },
        { type: "paragraph", content: [{ type: "text", text: "Data: ", marks: [{ type: "bold" }] }, { type: "text", text: "17 de fevereiro de 2026" }] },
        { type: "paragraph", content: [{ type: "text", text: "Participantes: ", marks: [{ type: "bold" }] }, { type: "text", text: "@Nome" }] },
        { type: "horizontalRule" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🎯 Pauta" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📝 Notas" }] },
        { type: "paragraph", content: [{ type: "text", text: "Escreva aqui os pontos discutidos..." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "✅ Ações / Próximos Passos" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Tarefa pendente" }] }] }
        ]}
      ]
    }
  },
  {
    id: "system-todo-list",
    name: "Lista de Tarefas",
    description: "Organize seu dia com prioridades e checklists.",
    icon: "✅",
    color: "#10b981", // Emerald
    category: "Produtividade",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "🚀 Tarefas de Hoje" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🔥 Alta Prioridade" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Tarefa urgente 1" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📅 Para Depois" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Tarefa secundária" }] }] }
        ]}
      ]
    }
  },
  {
    id: "system-project-plan",
    name: "Plano de Projeto",
    description: "Visão geral, cronograma e entregas de um novo projeto.",
    icon: "🚀",
    color: "#f59e0b", // Amber
    category: "Gestão",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "🏗️ Projeto: [Nome]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📋 Visão Geral" }] },
        { type: "paragraph", content: [{ type: "text", text: "Objetivo do projeto e contexto..." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🚩 Marcos (Milestones)" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "M1: Pesquisa (Prazo: DD/MM)" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "M2: MVP (Prazo: DD/MM)" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🔗 Recursos Úteis" }] }
      ]
    }
  },
  {
    id: "system-brainstorming",
    name: "Brainstorming",
    description: "Espaço livre para capturar ideias sem julgamento.",
    icon: "💡",
    color: "#ef4444", // Red
    category: "Criatividade",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "💡 Ideia: [Título]" }] },
        { type: "paragraph", content: [{ type: "text", text: "Qual problema estamos tentando resolver?", marks: [{ type: "italic" }] }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🧠 Tempestade de Ideias" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ideia maluca 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ideia promissora 2" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "💎 Melhores Conceitos" }] }
      ]
    }
  },
  {
    id: "system-journal",
    name: "Diário / Journal",
    description: "Reflexões diárias, gratidão e aprendizados.",
    icon: "📓",
    color: "#8b5cf6", // Violet
    category: "Pessoal",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "📓 Reflexões: [Data]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🙏 Gratidão" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Hoje sou grato por..." }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "💭 O que aprendi hoje?" }] },
        { type: "paragraph", content: [{ type: "text", text: "Relate seus aprendizados e desafios..." }] }
      ]
    }
  },
  {
    id: "system-weekly-report",
    name: "Relatório Semanal",
    description: "Sumário de progresso, bloqueios e plano para próxima semana.",
    icon: "📊",
    color: "#ec4899", // Pink
    category: "Trabalho",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "📊 Status Semanal: Semana [N]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "✅ Realizado" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Concluído X" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🚧 Bloqueios / Desafios" }] },
        { type: "paragraph", content: [{ type: "text", text: "Liste o que impediu o progresso..." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "⏭️ Próxima Semana" }] }
      ]
    }
  },
  {
    id: "system-technical-doc",
    name: "Documentação Técnica",
    description: "Estrutura para APIs, arquitetura ou guias de desenvolvedor.",
    icon: "💻",
    color: "#475569", // Slate
    category: "Desenvolvimento",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "💻 Documentação: [Sistema]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📖 Visão Geral" }] },
        { type: "paragraph", content: [{ type: "text", text: "Explicação técnica e arquitetura..." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🛠️ Instalação" }] },
        { type: "codeBlock", attrs: { language: "bash" }, content: [{ type: "text", text: "npm install\nnpm run dev" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📡 API Endpoints" }] }
      ]
    }
  },
  {
    id: "system-study-plan",
    name: "Plano de Estudo",
    description: "Tópicos a aprender, recursos e progresso.",
    icon: "📚",
    color: "#6366f1", // Indigo
    category: "Educação",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "📚 Estudo: [Matéria]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📖 Tópicos para Aprender" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Tópico 1" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🔗 Recursos" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Link para vídeo/artigo" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "📝 Notas de Estudo" }] }
      ]
    }
  },
  {
    id: "system-sprint-retro",
    name: "Retrospectiva de Sprint",
    description: "O que funcionou, o que não funcionou e melhorias.",
    icon: "🔄",
    color: "#06b6d4", // Cyan
    category: "Agile",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "🔄 Retrospectiva: Sprint [N]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🟢 O que foi bem?" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ponto positivo 1" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🔴 O que poderia ser melhor?" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Dificuldade encontrada" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🚀 Ações de Melhoria" }] }
      ]
    }
  },
  {
    id: "system-minute-of-meeting",
    name: "Ata de Reunião Simples",
    description: "Formato direto para reuniões rápidas e decisões.",
    icon: "📝",
    color: "#14b8a6", // Teal
    category: "Trabalho",
    isPublic: true,
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "📝 Ata: [Assunto]" }] },
        { type: "paragraph", content: [{ type: "text", text: "Presentes: [Nomes]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "✅ Decisões" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Decisão Tomada 1" }] }] }
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "🏃 Ações Imediatas" }] }
      ]
    }
  }
];
