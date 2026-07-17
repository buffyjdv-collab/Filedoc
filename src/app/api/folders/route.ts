import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/folders - List all folders
export async function GET() {
  try {
    const folders = await db.folder.findMany({
      include: {
        children: true,
        documents: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, color, icon, parentId, userId } = body

    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 })
    }

    const folder = await db.folder.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
        icon: icon || 'folder',
        parentId: parentId || null,
        userId,
      },
      include: {
        children: true,
        documents: true,
      },
    })
    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
