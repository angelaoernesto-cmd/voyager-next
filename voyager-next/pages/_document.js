import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta name="application-name" content="Voyager AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Voyager" />
        <meta name="description" content="Planifica tu viaje con inteligencia artificial" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1A1714" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" href="/icon-192.png" />

        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />

        <style>{`
          html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #1A1714; }
          input, select, textarea { font-size: 16px !important; }
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          ::-webkit-scrollbar { width: 0; height: 0; }
          #root, #__next { height: 100%; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
          @keyframes slideIn { from { transform:translateY(100%); } to { transform:translateY(0); } }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
