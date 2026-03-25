<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servicio no disponible - HelpDesk HUV</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3a5f 0%, #2c4370 50%, #3d5583 100%);
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #fff; padding: 20px;
        }
        .container { text-align: center; max-width: 500px; }
        .logo-container { margin-bottom: 30px; }
        .logo {
            width: 100px; height: 100px;
            background: rgba(255,255,255,0.15); border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto; backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .logo svg { width: 50px; height: 50px; color: #fff; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .subtitle { font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 30px; }
        .card {
            background: rgba(255,255,255,0.95); border-radius: 16px;
            padding: 40px 30px; color: #1e3a5f;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .icon-error {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
        }
        .icon-error svg { width: 40px; height: 40px; color: #fff; }
        .card h2 { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #2c4370; }
        .card p { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .code { font-size: 48px; font-weight: 800; color: #e2e8f0; margin-bottom: 8px; }
        .btn-back {
            display: inline-block; margin-top: 4px; padding: 10px 28px;
            background: #2c4370; color: #fff; border: none; border-radius: 8px;
            font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none;
            transition: background 0.2s;
        }
        .btn-back:hover { background: #3d5583; }
        .footer { margin-top: 40px; font-size: 12px; color: rgba(255,255,255,0.5); }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
                </svg>
            </div>
        </div>
        <h1>HelpDesk HUV</h1>
        <p class="subtitle">Hospital Universitario del Valle</p>

        <div class="card">
            <div class="icon-error">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                </svg>
            </div>
            <p class="code">503</p>
            <h2>Servicio no disponible</h2>
            <p>El sistema se encuentra en mantenimiento. Volveremos en breve. Gracias por su paciencia.</p>
            <a href="/" class="btn-back">Reintentar</a>
        </div>

        <p class="footer">&copy; {{ date('Y') }} HelpDesk HUV — Todos los derechos reservados</p>
    </div>
</body>
</html>
