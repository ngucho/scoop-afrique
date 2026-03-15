'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Label } from 'scoop'

const COLUMNS = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
  { id: 'blocked', label: 'Bloqué' },
]

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  due_date?: string
}

export function TaskBoard({
  projectId,
  initialTasks,
}: {
  projectId: string
  initialTasks: Array<Record<string, unknown>>
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      description: t.description as string,
      status: t.status as string,
      priority: t.priority as string,
      due_date: t.due_date as string,
    }))
  )
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  async function addTask() {
    if (!newTitle.trim()) return
    const res = await fetch(`/api/crm/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Tâche créée')
    setTasks((prev) => [
      ...prev,
      {
        id: json.data.id,
        title: json.data.title,
        status: 'todo',
        priority: 'normal',
      },
    ])
    setNewTitle('')
    setShowForm(false)
    router.refresh()
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const res = await fetch(`/api/crm/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
      return
    }
    toast.success('Statut mis à jour')
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    )
    router.refresh()
  }

  const tasksByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id)
      return acc
    },
    {} as Record<string, Task[]>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {showForm ? (
          <div className="flex gap-2 items-end">
            <div>
              <Label htmlFor="new_task">Nouvelle tâche</Label>
              <Input
                id="new_task"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre de la tâche"
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
            </div>
            <Button onClick={addTask}>Ajouter</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowForm(true)}>+ Tâche</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            data-column={col.id}
            className="rounded-lg border border-border bg-muted/20 p-3 min-h-[200px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData('taskId')
              const task = tasks.find((t) => t.id === taskId)
              if (task && task.status !== col.id) updateTaskStatus(taskId, col.id)
            }}
          >
            <h3 className="font-medium text-sm mb-3">{col.label}</h3>
            <div className="space-y-2">
              {tasksByStatus[col.id]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(status) => updateTaskStatus(task.id, status)}
                  columns={COLUMNS}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
  columns,
}: {
  task: Task
  onStatusChange: (status: string) => void
  columns: Array<{ id: string; label: string }>
}) {
  return (
    <div
      className="rounded-md border border-border bg-background p-3 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <p className="font-medium">{task.title}</p>
      {task.due_date && (
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(task.due_date).toLocaleDateString('fr-FR')}
        </p>
      )}
      <select
        className="mt-2 w-full text-xs rounded border border-input bg-background px-2 py-1"
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        {columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}
