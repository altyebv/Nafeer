import './globals.css';

export const metadata = {
  title: 'نفير — معاً نبني ',
  description: 'منصة المساهمين لبناء بشير — تطبيق التعلم للطلاب السودانيين',
  openGraph: {
    title: 'نفير',
    description: 'انضم لبناء أفضل تجربة تعليمية للطالب السوداني',
    locale: 'ar_SD',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Runs before first paint — avoids theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nafeer-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-arabic antialiased">
        {children}
      </body>
    </html>
  );
}
