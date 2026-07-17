import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/documents - List all documents with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const isStarred = searchParams.get('isStarred')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (folderId) where.folderId = folderId
    if (type) where.type = type
    if (status) where.status = status
    if (isStarred === 'true') where.isStarred = true
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documents = await db.document.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true, email: true } },
        sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } },
        attachments: true,
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/documents - Create a new document
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, type, status, tags, folderId, userId } = body

    if (!title || !userId) {
      return NextResponse.json({ error: 'Title and userId are required' }, { status: 400 })
    }

    const document = await db.document.create({
      data: {
        title,
        content,
        type: type || 'NOTE',
        status: status || 'DRAFT',
        tags,
        folderId: folderId || null,
        userId,
        versions: {
          create: {
            content: content || '',
            version: 1,
          },
        },
      },
      include: {
        folder: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true, email: true } },
        sharedWith: true,
        attachments: true,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

// PATCH /api/documents - Update a document
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, title, content, type, status, tags, folderId, isStarred, isArchived } = body

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get current document for version tracking
    const current = await db.document.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = tags
    if (folderId !== undefined) updateData.folderId = folderId
    if (isStarred !== undefined) updateData.isStarred = isStarred
    if (isArchived !== undefined) updateData.isArchived = isArchived

    // Increment version if content changed
    if (content !== undefined && content !== current.content) {
      updateData.version = current.version + 1
    }

    const document = await db.document.update({
      where: { id },
      data: updateData,
      include: {
        folder: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true, email: true } },
        sharedWith: true,
        attachments: true,
      },
    })

    // Create version record if content changed
    if (content !== undefined && content !== current.content) {
      await db.documentVersion.create({
        data: {
          content,
          version: current.version + 1,
          documentId: id,
        },
      })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    await db.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
