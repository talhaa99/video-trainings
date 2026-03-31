import { redirect } from 'next/navigation'
import { listEmployeesPaginated } from '../../../../lib/admin/phase2a-service'
import EmployeesManager from './employees-manager'

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

export default async function EmployeesPage({ searchParams }) {
  const query = `${searchParams?.q ?? ''}`.trim()
  const requestedPageRaw = Number(searchParams?.page ?? 1)
  const requestedPageSizeRaw = Number(searchParams?.pageSize ?? 10)
  const requestedPage = Number.isFinite(requestedPageRaw) && requestedPageRaw > 0 ? Math.floor(requestedPageRaw) : 1
  const requestedPageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSizeRaw) ? requestedPageSizeRaw : 10

  const result = await listEmployeesPaginated({
    search: query,
    page: requestedPage,
    pageSize: requestedPageSize,
  })

  if (result.page !== requestedPage || result.pageSize !== requestedPageSize) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (result.page > 1) params.set('page', String(result.page))
    if (result.pageSize !== 10) params.set('pageSize', String(result.pageSize))
    const target = params.toString() ? `/admin/employees?${params.toString()}` : '/admin/employees'
    redirect(target)
  }

  return (
    <EmployeesManager
      employees={result.rows}
      query={query}
      page={result.page}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
    />
  )
}
