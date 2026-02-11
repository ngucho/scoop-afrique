'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Avatar } from '../atoms/Avatar'
import { AuthorName } from '../atoms/AuthorName'

export interface AuthorBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  href?: string
  avatarSrc?: string | null
  role?: string
}

const AuthorBlock = React.forwardRef<HTMLDivElement, AuthorBlockProps>(
  ({ className, name, href, avatarSrc, role, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-3', className)}
      {...props}
    >
      <Avatar src={avatarSrc ?? undefined} alt={name} size="default" />
      <div className="flex flex-col gap-0.5">
        <AuthorName href={href}>{name}</AuthorName>
        {role ? (
          <span className="text-xs text-muted-foreground">{role}</span>
        ) : null}
      </div>
    </div>
  )
)
AuthorBlock.displayName = 'AuthorBlock'

export { AuthorBlock }
