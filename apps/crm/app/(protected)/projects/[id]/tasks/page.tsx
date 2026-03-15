import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { TaskBoard } from '@/components/projects/TaskBoard'

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [projectRes, tasksRes] = await Promise.all([
    crmGetServer<Record<string, unknown>>(`projects/${id}`),
    crmGetServer<Array<Record<string, unknown>>>(`projects/${id}/tasks`),
  ])
  const project = projectRes?.data
  const tasks = tasksRes?.data ?? []

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Tâches — {project.title as string}
        </Heading>
        <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Projet
        </Link>
      </div>
      <TaskBoard projectId={id} initialTasks={tasks} />
    </div>
  )
}
