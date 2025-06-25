import UnAuthorizedPage from '../unauthorized-page'

export default function Unauthorized() {
  return (
    <main className='absolute z-[99999] top-0 left-0 w-full bg-backgroundPaper min-h-screen flex items-center justify-center'>
      <UnAuthorizedPage />
    </main>
  )
}
