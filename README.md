# CarteraCobro

Sistema de gestion de cartera de cobro con visualizacion de recibos, solicitudes y adjuntos.

## Stack

| Capa | Tecnologia |
|------|-----------|
| **Framework** | [Astro](https://astro.build) 6 (server-rendered) |
| **UI** | [React](https://react.dev) 19 + [Tailwind CSS](https://tailwindcss.com) 4 |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org) |
| **Base de datos** | [MySQL](https://www.mysql.com) (principal) + [SQL Server](https://www.microsoft.com/sql-server) (lectura) |
| **Almacenamiento** | [MinIO](https://min.io) (S3-compatible) para imagenes de recibos |
| **Autenticacion** | Sesiones via cookies + bcryptjs |
| **PDF** | jsPDF + jspdf-autotable |
| **Planillas** | SheetJS (xlsx) |
| **Notificaciones** | SweetAlert2 |
| **Dashboard** | react-date-range para filtros por fecha |

## Entorno

Copiar `.env.example` a `.env` y configurar:

```
DB_HOST=          # MySQL host
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=db_

AWS_ENDPOINT=     # MinIO endpoint
AWS_BUCKET=       # MinIO bucket
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

## Scripts

```bash
npm run dev      # Iniciar dev server
npm run build    # Build de produccion
npm run preview  # Preview del build
```
