import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, getDoc, addDoc, orderBy, limit } from "firebase/firestore";

/**
 * Templates API route handler
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const builtin = searchParams.get("builtin") === "true";

  const db = getFirestore();

  try {
    if (builtin) {
      // Return built-in templates
      const builtInTemplates = [
        {
          id: "blank",
          name: "Em Branco",
          description: "Uma nota em branco para começar",
          icon: "FileText",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "" }],
              },
            ],
          },
          category: "basic",
          isBuiltin: true,
        },
        {
          id: "meeting",
          name: "Reunião",
          description: "Template para reuniões com participantes e notas",
          icon: "Users",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Reunião" }],
              },
              {
                type: "paragraph",
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Participantes" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "Participante 1" }] },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Pauta" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "Item da pauta" }] },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Notas" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Ações" }],
              },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "Ação a ser realizada" }] },
                    ],
                  },
                ],
              },
            ],
          },
          category: "meeting",
          isBuiltin: true,
        },
        {
          id: "daily",
          name: "Diário",
          description: "Template para anotações diárias",
          icon: "Calendar",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Diário - {data}" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Foco Principal" }],
              },
              {
                type: "callout",
                attrs: { type: "info" },
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "O que é mais importante hoje?" }] },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Tarefas" }],
              },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "Tarefa importante" }] },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Notas" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Reflexão" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Como foi o dia? O que aprendeu?" }],
              },
            ],
          },
          category: "productivity",
          isBuiltin: true,
        },
        {
          id: "project-brief",
          name: "Brief de Projeto",
          description: "Template para iniciar um novo projeto",
          icon: "FolderOpen",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Brief do Projeto" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Visão Geral" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Descreva o propósito do projeto..." }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Objetivos" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "Objetivo 1" }] },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Escopo" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "O que está dentro e fora do projeto?" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Cronograma" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Datas e marcos importantes" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Equipe" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Membros da equipe e papéis" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Recursos" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Recursos necessários" }],
              },
            ],
          },
          category: "project",
          isBuiltin: true,
        },
        {
          id: "prd",
          name: "PRD - Requisitos do Produto",
          description: "Template para Product Requirements Document",
          icon: "FileCode",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Product Requirements Document" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Resumo Executivo" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Breve descrição do produto..." }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Problema a Ser Resolvido" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Que problema este produto resolve?" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Público-Alvo" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Persona 1" }] }],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Funcionalidades" }],
              },
              {
                type: "heading",
                attrs: { level: 3 },
                content: [{ type: "text", text: "MVP" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Funcionalidade essencial" }] }],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Métricas de Sucesso" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Como vamos medir o sucesso?" }],
              },
            ],
          },
          category: "product",
          isBuiltin: true,
        },
        {
          id: "sprint",
          name: "Sprint Planning",
          description: "Template para planejamento de sprint",
          icon: "Zap",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Sprint {número}" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Objetivo da Sprint" }],
              },
              {
                type: "callout",
                attrs: { type: "info" },
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Qual é o objetivo principal desta sprint?" }] },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "User Stories" }],
              },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "[US-001] Como usuário, quero fazer algo..." }] },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Riscos e Bloqueios" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Identifique possíveis impedimentos" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Ritmo da Equipe" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Quantos story points está a equipe conseguindo completar?" }],
              },
            ],
          },
          category: "agile",
          isBuiltin: true,
        },
        {
          id: "product-spec",
          name: "Especificação Técnica",
          description: "Template para especificações técnicas",
          icon: "Cpu",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Especificação Técnica" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Descrição" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Descrição detalhada do componente/sistema..." }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Requisitos Técnicos" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Requisito técnico 1" }] }],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Arquitetura" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Descrição da arquitetura proposta" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "API Endpoints" }],
              },
              {
                type: "codeBlock",
                attrs: { language: "typescript" },
                content: [{ type: "text", text: "// Definição da API\nGET /api/resource\nPOST /api/resource" }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Considerações de Segurança" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Notas sobre segurança e autenticação" }],
              },
            ],
          },
          category: "technical",
          isBuiltin: true,
        },
      ];

      return NextResponse.json({ data: builtInTemplates });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Get user's custom templates
    const templatesQuery = query(
      collection(db, "templates"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(templatesQuery);
    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, name, description, icon, content, category } = body;

  if (!userId || !name || !content) {
    return NextResponse.json(
      { error: "Bad Request", message: "userId, name e content são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getFirestore();

  try {
    const docRef = await addDoc(collection(db, "templates"), {
      userId,
      name,
      description: description || "",
      icon: icon || "FileText",
      content,
      category: category || "custom",
      isBuiltin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdDoc = await getDoc(docRef);
    return NextResponse.json({
      data: { id: docRef.id, ...createdDoc.data() },
    });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
