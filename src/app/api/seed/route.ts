import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/seed - Seed the database with sample data
export async function POST() {
  try {
    // Check if data already exists
    const existingUser = await db.user.findFirst()
    if (existingUser) {
      return NextResponse.json({ message: 'Database already seeded', userId: existingUser.id })
    }

    // Create a demo user
    const user = await db.user.create({
      data: {
        email: 'demo@filedoc.app',
        name: 'Demo User',
        avatar: null,
        role: 'ADMIN',
      },
    })

    // Create folders
    const personalFolder = await db.folder.create({
      data: {
        name: 'Personal',
        description: 'Personal documents and notes',
        color: '#10b981',
        icon: 'user',
        userId: user.id,
      },
    })

    const workFolder = await db.folder.create({
      data: {
        name: 'Work',
        description: 'Work-related documents',
        color: '#6366f1',
        icon: 'briefcase',
        userId: user.id,
      },
    })

    const projectsFolder = await db.folder.create({
      data: {
        name: 'Projects',
        description: 'Project documentation',
        color: '#f59e0b',
        icon: 'folder-kanban',
        parentId: workFolder.id,
        userId: user.id,
      },
    })

    const archiveFolder = await db.folder.create({
      data: {
        name: 'Archive',
        description: 'Archived documents',
        color: '#6b7280',
        icon: 'archive',
        userId: user.id,
      },
    })

    // Create sample documents
    const documents = await Promise.all([
      db.document.create({
        data: {
          title: 'Project Roadmap 2026',
          content: '# Project Roadmap 2026\n\n## Q1 Goals\n- Launch v2.0 of the platform\n- Implement real-time collaboration\n- Add AI-powered search\n\n## Q2 Goals\n- Mobile app beta release\n- Integration with third-party services\n- Performance optimization\n\n## Q3 Goals\n- Enterprise features\n- Advanced analytics dashboard\n- API v3 release\n\n## Q4 Goals\n- International expansion\n- Compliance certifications\n- Year-end review',
          type: 'DOCUMENT',
          status: 'PUBLISHED',
          tags: 'roadmap,planning,2026',
          isStarred: true,
          folderId: projectsFolder.id,
          userId: user.id,
          versions: { create: { content: '# Project Roadmap 2026\n\n## Q1 Goals\n- Launch v2.0', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Meeting Notes - Sprint Review',
          content: '## Sprint Review - Week 28\n\n**Date**: July 15, 2026\n**Attendees**: Team Alpha\n\n### Completed\n- User authentication flow\n- Dashboard redesign\n- API optimization\n\n### In Progress\n- File upload feature\n- Notification system\n\n### Blockers\n- Third-party API integration pending approval\n\n### Action Items\n1. Follow up on API approval - @lead\n2. Design review for file upload - @design\n3. Update sprint board',
          type: 'NOTE',
          status: 'PUBLISHED',
          tags: 'meeting,sprint,review',
          isStarred: false,
          folderId: workFolder.id,
          userId: user.id,
          versions: { create: { content: '## Sprint Review - Week 28', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'API Documentation',
          content: '# API Documentation\n\n## Base URL\n`https://api.filedoc.app/v2`\n\n## Authentication\nAll requests require a Bearer token in the Authorization header.\n\n```\nAuthorization: Bearer <token>\n```\n\n## Endpoints\n\n### GET /documents\nRetrieve all documents for the authenticated user.\n\n### POST /documents\nCreate a new document.\n\n### GET /documents/:id\nRetrieve a specific document.\n\n### PATCH /documents/:id\nUpdate a document.\n\n### DELETE /documents/:id\nDelete a document.',
          type: 'DOCUMENT',
          status: 'PUBLISHED',
          tags: 'api,documentation,reference',
          isStarred: true,
          folderId: projectsFolder.id,
          userId: user.id,
          versions: { create: { content: '# API Documentation', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Weekly Standup Template',
          content: '# Weekly Standup\n\n**Name**: \n**Date**: \n\n## What I did last week\n- \n\n## What I am doing this week\n- \n\n## Blockers / Help needed\n- ',
          type: 'DOCUMENT',
          status: 'DRAFT',
          tags: 'template,standup',
          isStarred: false,
          folderId: workFolder.id,
          userId: user.id,
          versions: { create: { content: '# Weekly Standup Template', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Personal Goals',
          content: '# Personal Goals 2026\n\n## Health & Fitness\n- Run a marathon\n- Maintain daily meditation practice\n- Cook healthy meals 5x per week\n\n## Learning\n- Complete Rust programming course\n- Read 24 books\n- Learn watercolor painting\n\n## Career\n- Get promoted to Senior Engineer\n- Speak at 2 conferences\n- Mentor 3 junior developers\n\n## Finance\n- Save 30% of income\n- Start investment portfolio\n- Pay off student loans',
          type: 'NOTE',
          status: 'PUBLISHED',
          tags: 'goals,personal,2026',
          isStarred: true,
          folderId: personalFolder.id,
          userId: user.id,
          versions: { create: { content: '# Personal Goals 2026', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Budget Spreadsheet Q3',
          content: 'Budget tracking for Q3 2026. Categories include: Engineering, Marketing, Operations, and Sales.',
          type: 'SPREADSHEET',
          status: 'DRAFT',
          tags: 'budget,finance,q3',
          isStarred: false,
          folderId: workFolder.id,
          userId: user.id,
          versions: { create: { content: 'Budget tracking for Q3 2026', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Product Launch Presentation',
          content: 'Slide deck for the upcoming product launch event. Covering features, timeline, and go-to-market strategy.',
          type: 'PRESENTATION',
          status: 'DRAFT',
          tags: 'presentation,launch,product',
          isStarred: false,
          folderId: projectsFolder.id,
          userId: user.id,
          versions: { create: { content: 'Slide deck for the upcoming product launch', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Architecture Design Doc',
          content: '# System Architecture\n\n## Overview\nThe Filedoc platform follows a microservices architecture deployed on Vercel with NeonDB as the primary database.\n\n## Components\n1. **Frontend**: Next.js 16 with App Router\n2. **API Layer**: Serverless API routes\n3. **Database**: NeonDB (Serverless PostgreSQL)\n4. **Storage**: Vercel Blob\n5. **Auth**: NextAuth.js\n\n## Data Flow\nClient → API Routes → Prisma → NeonDB\n\n## Deployment\nAll services are deployed on Vercel with automatic CI/CD via GitHub integration.',
          type: 'DOCUMENT',
          status: 'PUBLISHED',
          tags: 'architecture,design,technical',
          isStarred: true,
          folderId: projectsFolder.id,
          userId: user.id,
          versions: { create: { content: '# System Architecture', version: 1 } },
        },
      }),
      db.document.create({
        data: {
          title: 'Old Project Notes',
          content: 'Legacy project notes from 2025. Archived for reference.',
          type: 'NOTE',
          status: 'ARCHIVED',
          tags: 'archive,legacy',
          isStarred: false,
          isArchived: true,
          folderId: archiveFolder.id,
          userId: user.id,
          versions: { create: { content: 'Legacy project notes from 2025', version: 1 } },
        },
      }),
    ])

    // Share some documents
    await db.sharedDocument.create({
      data: {
        documentId: documents[0].id,
        userId: user.id,
        permission: 'EDIT',
      },
    })

    await db.sharedDocument.create({
      data: {
        documentId: documents[2].id,
        userId: user.id,
        permission: 'VIEW',
      },
    })

    return NextResponse.json({
      message: 'Database seeded successfully',
      userId: user.id,
      stats: {
        folders: 4,
        documents: documents.length,
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
