import { redirect } from 'next/navigation'

export default async function InductionTokenPage({ params }) {
  redirect(`/?assignment=${params.token}`)
}
