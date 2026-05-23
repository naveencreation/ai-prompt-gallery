import React from 'react'
import { cn } from '@/lib/utils'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageContainerProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
}

export default function PageContainer({
  children,
  breadcrumbs,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('w-full mx-auto space-y-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <span className="text-foreground">{item.label}</span>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      {children}
    </div>
  )
}
