import './globals.css';

export const metadata = {
  title: 'نفير — معاً نبني بشير',
  description: 'منصة المساهمين لبناء بشير — تطبيق التعلم للطلاب السودانيين',
  openGraph: {
    title: 'نفير',
    description: 'انضم لبناء أفضل تجربة تعليمية للطالب السوداني',
    locale: 'ar_SD',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic bg-ink-950 text-ink-100 antialiased">
        {children}
      </body>
    </html>
  );
}
