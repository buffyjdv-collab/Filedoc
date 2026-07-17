'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, FileText, Star, Search, Plus, MoreHorizontal,
  Briefcase, User, FolderKanban, Archive, File, Presentation,
  Table, Image as ImageIcon, FileCode, ChevronRight, Trash2, Edit3,
  Share2, Download, Clock, Tag, LayoutGrid, List, Filter,
  Database, Cloud, Zap, ChevronDown, X, Check, ArrowRight,
  BookOpen, TrendingUp, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

// Types
interface Folder {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  isPublic: boolean
  parentId?: string
  children?: Folder[]
  documents?: Document[]
  user: { id: string; name: string; email: string }
  _count?: { documents: number; children: number }
  createdAt: string
  updatedAt: string
}

interface Document {
  id: string
  title: string
  content?: string
  type: string
  status: string
  tags?: string
  isStarred: boolean
  isArchived: boolean
  version: number
  folder?: { id: string; name: string; color: string }
  user: { id: string; name: string; email: string }
  sharedWith?: { user: { id: string; name: string; email: string }; permission: string }[]
  attachments?: { id: string; name: string; mimeType: string; size: number }[]
  _count?: { versions: number }
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalDocuments: number
  totalFolders: number
  starredDocuments: number
  sharedDocuments: number
  documentsByType: { type: string; _count: { type: number } }[]
  documentsByStatus: { status: string; _count: { status: number } }[]
  recentDocuments: Document[]
}

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  NOTE: <FileText className="w-5 h-5" />,
  DOCUMENT: <File className="w-5 h-5" />,
  SPREADSHEET: <Table className="w-5 h-5" />,
  PRESENTATION: <Presentation className="w-5 h-5" />,
  IMAGE: <ImageIcon className="w-5 h-5" />,
  PDF: <FileCode className="w-5 h-5" />,
  OTHER: <FileText className="w-5 h-5" />,
}

const DOC_TYPE_COLORS: Record<string, string> = {
  NOTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DOCUMENT: 'bg-blue-50 text-blue-700 border-blue-200',
  SPREADSHEET: 'bg-amber-50 text-amber-700 border-amber-200',
  PRESENTATION: 'bg-rose-50 text-rose-700 border-rose-200',
  IMAGE: 'bg-purple-50 text-purple-700 border-purple-200',
  PDF: 'bg-red-50 text-red-700 border-red-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  PUBLISHED: { label: 'Published', className: 'bg-green-100 text-green-800 border-green-300' },
  ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-800 border-gray-300' },
}

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  folder: <FolderOpen className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  'folder-kanban': <FolderKanban className="w-5 h-5" />,
  archive: <Archive className="w-5 h-5" />,
}

export default function Home() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('all')
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isSeeded, setIsSeeded] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', content: '', type: 'NOTE', folderId: '', tags: '' })
  const [newFolder, setNewFolder] = useState({ name: '', description: '', color: '#6366f1', icon: 'folder' })

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, foldersRes, statsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/folders'),
        fetch('/api/stats'),
      ])

      if (docsRes.ok) setDocuments(await docsRes.json())
      if (foldersRes.ok) setFolders(await foldersRes.json())
      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats(s)
        if (s.totalDocuments > 0) setIsSeeded(true)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        toast({ title: 'Database seeded!', description: 'Sample data has been loaded.' })
        await fetchData()
        setIsSeeded(true)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to seed database.', variant: 'destructive' })
    }
  }

  const handleCreateDoc = async () => {
    try {
      const userId = folders[0]?.userId || 'demo'
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDoc, userId }),
      })
      if (res.ok) {
        toast({ title: 'Document created!', description: `"${newDoc.title}" has been created.` })
        setShowNewDocDialog(false)
        setNewDoc({ title: '', content: '', type: 'NOTE', folderId: '', tags: '' })
        await fetchData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create document.', variant: 'destructive' })
    }
  }

  const handleCreateFolder = async () => {
    try {
      const userId = folders[0]?.userId || 'demo'
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFolder, userId }),
      })
      if (res.ok) {
        toast({ title: 'Folder created!', description: `"${newFolder.name}" has been created.` })
        setShowNewFolderDialog(false)
        setNewFolder({ name: '', description: '', color: '#6366f1', icon: 'folder' })
        await fetchData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create folder.', variant: 'destructive' })
    }
  }

  const handleToggleStar = async (doc: Document) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, isStarred: !doc.isStarred }),
      })
      if (res.ok) {
        toast({ title: doc.isStarred ? 'Unstarred' : 'Starred', description: `"${doc.title}" ${doc.isStarred ? 'removed from' : 'added to'} favorites.` })
        await fetchData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update document.', variant: 'destructive' })
    }
  }

  const handleDeleteDoc = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: `"${doc.title}" has been deleted.` })
        setSelectedDoc(null)
        await fetchData()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete document.', variant: 'destructive' })
    }
  }

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedFolder && doc.folderId !== selectedFolder) return false
    if (activeTab === 'starred' && !doc.isStarred) return false
    if (activeTab === 'archived' && !doc.isArchived) return false
    if (activeTab !== 'archived' && doc.isArchived) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.tags?.toLowerCase().includes(q) ||
        doc.content?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatRelativeDate = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(date)
  }

  // Show seed prompt if no data
  if (!loading && !isSeeded && documents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Filedoc
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>NeonDB + Vercel</span>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Welcome to Filedoc</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Your document management system powered by NeonDB and Vercel.
              Seed the database with sample data to get started, or create your own documents from scratch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleSeed}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Seed Sample Data
              </Button>
              <Button
                onClick={() => setShowNewDocDialog(true)}
                size="lg"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                <span>Vercel Deploy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>NeonDB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Serverless</span>
              </div>
            </div>
          </motion.div>
        </main>

        {/* New Document Dialog */}
        <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="Document title..."
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newDoc.type} onValueChange={(v) => setNewDoc({ ...newDoc, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="SPREADSHEET">Spreadsheet</SelectItem>
                    <SelectItem value="PRESENTATION">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  placeholder="Document content..."
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateDoc} className="w-full" disabled={!newDoc.title}>
                Create Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Filedoc
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 w-64 h-9"
                />
              </div>
              <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-1" /> New Doc
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <FolderOpen className="w-4 h-4 mr-1" /> New Folder
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
          {/* Mobile search */}
          <div className="sm:hidden pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Documents</p>
                      <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Folders</p>
                      <p className="text-2xl font-bold">{stats.totalFolders}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Starred</p>
                      <p className="text-2xl font-bold">{stats.starredDocuments}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Shared</p>
                      <p className="text-2xl font-bold">{stats.sharedDocuments}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-rose-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Folders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <ScrollArea className="max-h-80">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedFolder === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-muted'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      All Documents
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedFolder === folder.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ color: folder.color }}>
                          {FOLDER_ICONS[folder.icon] || <FolderOpen className="w-4 h-4" />}
                        </div>
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {folder.documents?.length || 0}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Stats */}
                {stats && stats.documentsByType.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">By Type</p>
                    <div className="space-y-2">
                      {stats.documentsByType.map((item) => (
                        <div key={item.type} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {DOC_TYPE_ICONS[item.type]}
                            <span className="capitalize">{item.type.toLowerCase()}</span>
                          </div>
                          <span className="font-medium">{item._count.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="starred">
                    <Star className="w-3.5 h-3.5 mr-1" /> Starred
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="w-3.5 h-3.5 mr-1" /> Archived
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Document Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-3 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search query.' : 'Create your first document to get started.'}
                  </p>
                  <Button onClick={() => setShowNewDocDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create Document
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredDocs.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card
                        className="cursor-pointer shadow-sm hover:shadow-md transition-all group border"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${DOC_TYPE_COLORS[doc.type] || DOC_TYPE_COLORS.OTHER}`}>
                              {DOC_TYPE_ICONS[doc.type] || DOC_TYPE_ICONS.OTHER}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStar(doc) }}
                                className="p-1 rounded-md hover:bg-muted transition-colors"
                              >
                                <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {doc.content?.substring(0, 100) || 'No content'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_BADGES[doc.status]?.className || ''}`}>
                                {STATUS_BADGES[doc.status]?.label || doc.status}
                              </Badge>
                              {doc.folder && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doc.folder.color }} />
                                  {doc.folder.name}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {formatRelativeDate(doc.updatedAt)}
                            </span>
                          </div>
                          {doc.tags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tags.split(',').slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* List View */
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${DOC_TYPE_COLORS[doc.type] || DOC_TYPE_COLORS.OTHER}`}>
                          {DOC_TYPE_ICONS[doc.type] || DOC_TYPE_ICONS.OTHER}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm group-hover:text-indigo-600 transition-colors truncate">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.content?.substring(0, 80) || 'No content'}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                          {doc.folder && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: doc.folder.color }} />
                              {doc.folder.name}
                            </span>
                          )}
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_BADGES[doc.status]?.className || ''}`}>
                            {STATUS_BADGES[doc.status]?.label || doc.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            {formatRelativeDate(doc.updatedAt)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStar(doc) }}
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                          >
                            <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span>Filedoc</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>NeonDB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              <span>Vercel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Serverless</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${DOC_TYPE_COLORS[selectedDoc.type] || DOC_TYPE_COLORS.OTHER}`}>
                      {DOC_TYPE_ICONS[selectedDoc.type] || DOC_TYPE_ICONS.OTHER}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedDoc.title}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_BADGES[selectedDoc.status]?.className || ''}`}>
                          {STATUS_BADGES[selectedDoc.status]?.label || selectedDoc.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{selectedDoc.type.toLowerCase()}</span>
                        <span className="text-xs text-muted-foreground">v{selectedDoc.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleToggleStar(selectedDoc)}>
                      <Star className={`w-4 h-4 ${selectedDoc.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteDoc(selectedDoc)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="flex-1 -mx-6 px-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(selectedDoc.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Author:</span>
                    <span>{selectedDoc.user.name || selectedDoc.user.email}</span>
                  </div>
                  {selectedDoc.folder && (
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Folder:</span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedDoc.folder.color }} />
                        {selectedDoc.folder.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Shared:</span>
                    <span>{selectedDoc.sharedWith?.length || 0} people</span>
                  </div>
                </div>

                {selectedDoc.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    {selectedDoc.tags.split(',').map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator className="mb-4" />

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedDoc.content || 'No content'}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                placeholder="Document title..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={newDoc.type} onValueChange={(v) => setNewDoc({ ...newDoc, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="SPREADSHEET">Spreadsheet</SelectItem>
                    <SelectItem value="PRESENTATION">Presentation</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Folder</Label>
                <Select value={newDoc.folderId} onValueChange={(v) => setNewDoc({ ...newDoc, folderId: v })}>
                  <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={newDoc.tags}
                onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                placeholder="e.g. planning, draft, review"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                placeholder="Document content..."
                rows={5}
              />
            </div>
            <Button onClick={handleCreateDoc} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" disabled={!newDoc.title}>
              Create Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                placeholder="Folder name..."
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newFolder.description}
                onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                placeholder="Optional description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newFolder.color}
                    onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <span className="text-sm text-muted-foreground">{newFolder.color}</span>
                </div>
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={newFolder.icon} onValueChange={(v) => setNewFolder({ ...newFolder, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">Folder</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="briefcase">Briefcase</SelectItem>
                    <SelectItem value="folder-kanban">Kanban</SelectItem>
                    <SelectItem value="archive">Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateFolder} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" disabled={!newFolder.name}>
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
