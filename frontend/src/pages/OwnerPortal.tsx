import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock, Trophy, Zap, Tag, Plus, X } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useSave } from '../context/useSave'
import { useOwnerProfile } from '../hooks/useOwnerProfile'
import type { Horse as HorseType, PendingHorseName, RaceEntryWithRace } from '../types/database'

// ─── Sortable name row ───────────────────────────────────────────────────────

interface SortableNameRowProps {
  item: PendingHorseName
  linkedHorseName?: string
}

function SortableNameRow({ item, linkedHorseName }: SortableNameRowProps) {
  const locked = item.horse_id != null

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: locked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        locked
          ? 'border-border/40 bg-muted/30 text-muted-foreground'
          : 'border-border bg-card'
      }`}
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className={`flex-shrink-0 ${
          locked
            ? 'cursor-not-allowed text-muted-foreground/40'
            : 'cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'
        }`}
        aria-label="Drag to reorder"
        tabIndex={locked ? -1 : 0}
      >
        {locked ? <Lock size={14} /> : <GripVertical size={16} />}
      </button>

      {/* name content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`font-medium ${locked ? 'line-through' : ''}`}>
            {item.name}
          </span>
          {item.name_jp && (
            <span className="text-sm text-muted-foreground">{item.name_jp}</span>
          )}
        </div>
        {locked && linkedHorseName && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Assigned to {linkedHorseName}
          </p>
        )}
      </div>

      {/* status badge */}
      <span
        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          locked
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {locked ? 'Assigned' : 'Available'}
      </span>
    </div>
  )
}

// ─── Grade badge ─────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  G1: 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400',
  G2: 'bg-purple-400/20 text-purple-600 dark:text-purple-400',
  G3: 'bg-blue-400/20 text-blue-600 dark:text-blue-400',
  OP: 'bg-green-400/20 text-green-600 dark:text-green-400',
  'Pre-Open': 'bg-muted text-muted-foreground',
  Maiden: 'bg-muted text-muted-foreground',
}

function GradeBadge({ grade }: { grade?: string }) {
  if (!grade) return null
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
        GRADE_COLORS[grade] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {grade}
    </span>
  )
}

function finishLabel(pos?: number) {
  if (pos == null) return '—'
  if (pos === 1) return '🥇 1st'
  if (pos === 2) return '🥈 2nd'
  if (pos === 3) return '🥉 3rd'
  return `${pos}th`
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OwnerPortal() {
  const navigate = useNavigate()
  const { activeSaveId } = useSave()
  const { owner, isOwner, loading: ownerLoading } = useOwnerProfile()

  const [horses, setHorses] = useState<HorseType[]>([])
  const [names, setNames] = useState<PendingHorseName[]>([])
  const [entries, setEntries] = useState<RaceEntryWithRace[]>([])
  const [horseMap, setHorseMap] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Add-name form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNameJp, setNewNameJp] = useState('')
  const [addingName, setAddingName] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Fetch data ─────────────────────────────────────────────────────────────

useEffect(() => {
  if (!owner?.id || !activeSaveId) return
  if (horses.length > 0 || names.length > 0) return

  async function fetchData() {
    setDataLoading(true)

    const { data: horseData } = await supabase
      .from('horses')
      .select('*')
      .eq('save_id', activeSaveId)
      .eq('owner_id', owner?.id)
      .order('name')

    const ownedHorses = horseData ?? []
    setHorses(ownedHorses)

    const map: Record<string, string> = {}
    for (const h of ownedHorses) {
      map[h.id] = h.name ?? h.name_jp ?? h.id
    }
    setHorseMap(map)

    const { data: nameData } = await supabase
      .from('pending_horse_names')
      .select('*')
      .eq('save_id', activeSaveId)
      .eq('owner_id', owner.id)
      .order('sort_order', { ascending: true, nullsFirst: false })

    setNames(nameData ?? [])

    if (ownedHorses.length > 0) {
      const horseIds = ownedHorses.map((h) => h.id)
      const { data: entryData } = await supabase
        .from('race_entries')
        .select('*, races(*)')
        .eq('save_id', activeSaveId)
        .in('horse_id', horseIds)
        .order('race_year', { ascending: false })

      setEntries((entryData as RaceEntryWithRace[]) ?? [])
    }

    setDataLoading(false)
  }

  fetchData()
}, [owner?.id, activeSaveId])

  // ── Add name ───────────────────────────────────────────────────────────────

  async function handleAddName() {
    if (!owner || !activeSaveId || !newName.trim()) return
    setAddingName(true)
    setAddError(null)

    const unlocked = names.filter((n) => n.horse_id == null)
    const nextOrder = unlocked.length + 1

    const { data, error } = await supabase
      .from('pending_horse_names')
      .insert({
        owner_id: owner.id,
        save_id: activeSaveId,
        name: newName.trim(),
        name_jp: newNameJp.trim() || null,
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error || !data) {
      setAddError('Failed to save name. Please try again.')
    } else {
      setNames((prev) => [...prev, data as PendingHorseName])
      setNewName('')
      setNewNameJp('')
      setShowAddForm(false)
    }

    setAddingName(false)
  }

  // ── Drag end ───────────────────────────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Only reorder unlocked names
    const unlocked = names.filter((n) => n.horse_id == null)
    const locked = names.filter((n) => n.horse_id != null)

    const oldIndex = unlocked.findIndex((n) => n.id === active.id)
    const newIndex = unlocked.findIndex((n) => n.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(unlocked, oldIndex, newIndex).map((n, i) => ({
      ...n,
      sort_order: i + 1,
    }))

    // Optimistic update — locked rows appended at the end
    setNames([...reordered, ...locked])

    // Persist to Supabase
    setSaving(true)
    const upserts = reordered.map((n) => ({
      id: n.id,
      owner_id: n.owner_id,
      save_id: n.save_id,
      name: n.name,
      name_jp: n.name_jp ?? null,
      sort_order: n.sort_order,
      horse_id: n.horse_id ?? null,
    }))

    await supabase.from('pending_horse_names').upsert(upserts)
    setSaving(false)
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────

  if (ownerLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (!isOwner || !owner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">
          This portal is for registered owners only.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-sm underline underline-offset-4"
        >
          Go home
        </button>
      </div>
    )
  }

  const unlockedNames = names.filter((n) => n.horse_id == null)
  const lockedNames = names.filter((n) => n.horse_id != null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* ── Owner header ─────────────────────────────────────────────────── */}
      <div className="mb-10 flex items-center gap-4">
        {/* Silks color swatch */}
        <div
          className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-border shadow-sm"
          style={{ backgroundColor: owner.silks_color ?? '#6b7280' }}
          aria-hidden
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {owner.display_name}
          </h1>
          {owner.display_name_jp && (
            <p className="text-sm text-muted-foreground">{owner.display_name_jp}</p>
          )}
        </div>
      </div>

      {dataLoading ? (
        <p className="text-sm text-muted-foreground">Loading your stable…</p>
      ) : (
        <div className="space-y-10">
          {/* ── My Horses ──────────────────────────────────────────────────── */}
          <section>
            <SectionHeader icon={<Zap size={16} />} title="My Horses" />

            {horses.length === 0 ? (
              <EmptyState>No horses assigned to you in this save yet.</EmptyState>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {horses.map((horse) => (
                  <button
                    key={horse.id}
                    onClick={() => navigate(`/horses/${horse.id}`)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {horse.name ?? horse.name_jp ?? '(unnamed)'}
                      </p>
                      {horse.name && horse.name_jp && (
                        <p className="truncate text-xs text-muted-foreground">
                          {horse.name_jp}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {horse.birth_year}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── My Names ───────────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <SectionHeader icon={<Tag size={16} />} title="My Names" inline />
              <div className="flex items-center gap-3">
              {saving && (
                <span className="text-xs text-muted-foreground">Saving…</span>
              )}
                <button
                  onClick={() => {
                    setShowAddForm((v) => !v)
                    setAddError(null)
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  {showAddForm ? <X size={12} /> : <Plus size={12} />}
                  {showAddForm ? 'Cancel' : 'Add name'}
                </button>
              </div>
            </div>

            {/* Add-name form */}
            {showAddForm && (
              <div className="mb-4 rounded-lg border border-border bg-card p-4">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
                      placeholder="e.g. Thunderstrike"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Japanese name <span className="text-muted-foreground/60">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newNameJp}
                      onChange={(e) => setNewNameJp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
                      placeholder="e.g. サンダーストライク"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {addError && (
                    <p className="text-xs text-destructive">{addError}</p>
                  )}
                  <button
                    onClick={handleAddName}
                    disabled={addingName || !newName.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
                  >
                    {addingName ? 'Saving…' : 'Save name'}
                  </button>
                </div>
              </div>
            )}

            <p className="mb-4 text-sm text-muted-foreground">
              Drag to rank the names you'd like used for your next horses.
              Assigned names are locked.
            </p>

            {names.length === 0 ? (
              <EmptyState>No name submissions yet.</EmptyState>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={unlockedNames.map((n) => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {unlockedNames.map((item) => (
                      <SortableNameRow key={item.id} item={item} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Locked names rendered outside DndContext */}
            {lockedNames.length > 0 && (
              <div className="mt-2 space-y-2">
                {lockedNames.map((item) => (
                  <SortableNameRow
                    key={item.id}
                    item={item}
                    linkedHorseName={
                      item.horse_id ? horseMap[item.horse_id] : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Race Results ───────────────────────────────────────────────── */}
          <section>
            <SectionHeader icon={<Trophy size={16} />} title="Race Results" />

            {entries.length === 0 ? (
              <EmptyState>No race results recorded yet.</EmptyState>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Race
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Horse
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Year
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Finish
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => {
                      const horse = horses.find((h) => h.id === entry.horse_id)
                      return (
                        <tr key={entry.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <GradeBadge grade={entry.races.grade} />
                              <span className="font-medium">
                                {entry.races.name}
                              </span>
                            </div>
                            {entry.races.name_jp && (
                              <p className="text-xs text-muted-foreground">
                                {entry.races.name_jp}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() =>
                                navigate(`/horses/${entry.horse_id}`)
                              }
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {horse?.name ?? horse?.name_jp ?? '—'}
                            </button>
                          </td>
                          <td className="px-4 py-2 text-right text-muted-foreground">
                            {entry.race_year}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {finishLabel(entry.finish_position)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  inline,
}: {
  icon: React.ReactNode
  title: string
  inline?: boolean
}) {
  return (
    <h2
      className={`flex items-center gap-2 text-base font-semibold ${
        inline ? '' : 'mb-3'
      }`}
    >
      <span className="text-muted-foreground">{icon}</span>
      {title}
    </h2>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}