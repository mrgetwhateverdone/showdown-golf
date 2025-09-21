import Link from "next/link"

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an error completing your authentication. Please try signing in again.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
