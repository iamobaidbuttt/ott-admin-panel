export const metadata = {
  title: 'OTT Admin Panel',
  description: 'Manage your OTT cookies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

