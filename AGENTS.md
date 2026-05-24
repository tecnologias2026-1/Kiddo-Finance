# Kiddo Finance

Vanilla HTML/CSS/JS financial education app for children with a PHP + MySQL backend.

## Run the app

1. Place folder under `C:\xampp\htdocs\kiddo-finance`
2. Start Apache + MySQL from XAMPP Control Panel
3. Open `http://localhost/kiddo-finance/`

## Architecture

- **Frontend**: Single entry point `js/app.js` drives all pages via `DOMContentLoaded`.
- **Backend**: PHP API in `api/` directory. MySQL database `kiddo_finance`.
- **Auth**: Real registration/login with `password_hash()`/`password_verify()`. Sessions via PHP cookies.
- **All data in MySQL**: Tables — `usuarios`, `perfiles`, `movimientos`, `metas`.
- **Currency**: COP (Colombian Peso) via `Intl.NumberFormat('es-CO', { currency: 'COP', minimumFractionDigits: 0 })`.

## Pages

| Page | Path | Purpose |
|------|------|---------|
| Landing | `index.html` | Marketing page, nav to login/register |
| Register | `register.html` | Real registration (username, email, password) |
| Login | `login.html` | Real login |
| Dashboard | `dashboard.html` | Balance, recent movements, goals summary |
| Profiles | `perfil.html` | Create/edit/select child profiles per user |
| Movements | `movimientos.html` | Record income/expense |
| Goals | `metas.html` | Savings goals with modal |
| History | `historial.html` | Full transaction list with filter tabs |
| Achievements | `logros.html` | 5 badges, progress tracking |

## API endpoints (`/kiddo-finance/api/`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `register.php` | No | Create user account |
| POST | `login.php` | No | Login (PHP session) |
| POST | `logout.php` | Yes | Destroy session |
| GET | `perfiles.php` | Yes | List profiles |
| POST | `perfiles.php` | Yes | Create profile |
| PUT | `perfiles.php` | Yes | Update profile |
| DELETE | `perfiles.php?id=X` | Yes | Delete profile |
| GET | `movimientos.php?perfil_id=X` | Yes | List movements |
| POST | `movimientos.php` | Yes | Create movement |
| GET | `metas.php?perfil_id=X` | Yes | List goals |
| POST | `metas.php` | Yes | Create goal |
| PUT | `metas.php` | Yes | Update goal progress |
| DELETE | `metas.php?id=X` | Yes | Delete goal |
| GET | `dashboard.php?perfil_id=X` | Yes | Balance + recent + goals summary |
| GET | `logros.php?perfil_id=X` | Yes | Achievement status |

All endpoints return JSON: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "..." }`.

## Key patterns

- **Profile system**: Multiple child profiles per user account. Data is scoped to the active profile via `perfil_id` in the DB.
- **Data cache**: On page load, all data for the active profile is fetched from the API into an in-memory cache. Writes go to API then refresh the cache.
- **Event-driven UI**: Three event types (`perfil`, `movimiento`, `meta`). Subscribe with `on('event', cb)`, trigger with `emit('event')`. Every page re-renders fully on any data change.
- **Sidebar**: Collapsible; state persisted in `localStorage` under key `sidebar-collapsed`. Mobile: expands as overlay.
- **Toast notifications**: Rendered in a `#toast-container` div (auto-created if missing).
- **Auth redirect**: If any API call returns 401, the user is redirected to `login.html`.

## Database (`kiddo_finance`)

- `usuarios` — id, username, email, password (bcrypt), created_at
- `perfiles` — id, usuario_id (FK), nombre, edad (1-17), created_at
- `movimientos` — id, perfil_id (FK), tipo (ingreso/gasto), monto, descripcion, categoria, fecha
- `metas` — id, perfil_id (FK), nombre, monto_target, ahorrado, fecha_limite, categoria, created_at

## Schema

See `sql/schema.sql` to recreate the database.

## Figma prototypes

Stored in `figma/` — three subdirectories for desktop, tablet, and phone layouts.

## Constraints

- Do not add npm packages, build tools, or a backend framework. PHP files stay in `api/`.
- Do not change DB structure without updating the API and frontend cache mapping.
- Login/register are now real — do not stub them.

## Deploy to InfinityFree

1. **`api/url.php`** — cambiar `$api_base` de `'/kiddo-finance/api'` a `'/api'`
2. **`api/config.php`** — poner credenciales MySQL que da InfinityFree (host, user, password)
3. **Exportar BD** desde phpMyAdmin local → Importar en phpMyAdmin de InfinityFree
4. **Subir archivos** por FTP a `htdocs/` (sin subcarpeta `kiddo-finance/`)
5. Abrir `tudominio.infinityfreeapp.com`
