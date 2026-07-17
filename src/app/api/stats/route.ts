import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    const [
      totalDocuments,
      totalFolders,
      starredDocuments,
      sharedDocuments,
      documentsByType,
      recentDocuments,
      documentsByStatus,
    ] = await Promise.all([
      db.document.count(),
      db.folder.count(),
      db.document.count({ where: { isStarred: true } }),
      db.sharedDocument.count(),
      db.document.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      db.document.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          folder: { select: { id: true, name: true, color: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      db.document.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    return NextResponse.json({
      totalDocuments,
      totalFolders,
      starredDocuments,
      sharedDocuments,
      documentsByType,
      documentsByStatus,
      recentDocuments,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
