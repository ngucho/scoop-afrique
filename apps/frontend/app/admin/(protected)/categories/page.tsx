import { redirect } from 'next/navigation'
import { Heading, Card, CardContent } from 'scoop'
import { IconTag } from '@tabler/icons-react'
import { fetchCategories } from '@/lib/admin/fetchers'
import { getAdminSession } from '@/lib/admin/session'
import { hasMinRole } from '@/lib/admin/rbac'
import { CategoryActions } from './CategoryActions'
import { CategoryForm } from './CategoryForm'

export default async function AdminCategoriesPage() {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/admin/login')

  const categories = await fetchCategories()
  const canModify = hasMinRole(adminSession.role, 'manager')

  return (
    <div className="space-y-6">
      <div>
        <Heading as="h1" level="h2">
          Catégories
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
          {!canModify && ' (lecture seule)'}
        </p>
      </div>

      {/* Create form: manager+ only */}
      {canModify && <CategoryForm />}

      {/* Categories list */}
      {categories.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Description
                </th>
                {canModify && (
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cat.slug}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {cat.description ?? '—'}
                  </td>
                  {canModify && (
                    <td className="px-4 py-3 text-right">
                      <CategoryActions categoryId={cat.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <IconTag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {canModify ? 'Aucune catégorie. Créez la première.' : 'Aucune catégorie.'}
          </p>
        </div>
      )}
    </div>
  )
}
