# API Smoke Tests

Copy-paste `curl` recipes for every route. Run against `http://localhost:3000` during local dev.

---

## Public routes

### GET /api/images — Gallery (paginated)

```bash
curl -s "http://localhost:3000/api/images" | jq .
```

With tag filter:
```bash
curl -s "http://localhost:3000/api/images?tag=cyberpunk" | jq .
```

With cursor:
```bash
curl -s "http://localhost:3000/api/images?cursor=eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTAxIiwiaWQiOiIxIn0" | jq .
```

### GET /api/images/:id — Single image

```bash
curl -s "http://localhost:3000/api/images/my-image-slug" | jq .
```

### GET /api/search — Full-text search

```bash
curl -s "http://localhost:3000/api/search?q=cyberpunk+cat" | jq .
```

### POST /api/like/:id — Add like (rate-limited)

```bash
curl -s -X POST "http://localhost:3000/api/like/img-1" | jq .
```

---

## Admin routes

### POST /api/admin/auth — Login

```bash
curl -s -X POST "http://localhost:3000/api/admin/auth" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}' | jq .
```

### DELETE /api/admin/auth — Logout

```bash
curl -s -X DELETE "http://localhost:3000/api/admin/auth" | jq .
```

### POST /api/admin/upload-signature — Signed upload URL

Requires admin session cookie.

```bash
curl -s -X POST "http://localhost:3000/api/admin/upload-signature" \
  -H "Content-Type: application/json" \
  -d '{"path":"uploads/my-image.webp"}' \
  -b "sb-access-token=<token>" | jq .
```

### POST /api/images — Create image

Requires admin session.

```bash
curl -s -X POST "http://localhost:3000/api/images" \
  -H "Content-Type: application/json" \
  -d '{
    "image": {
      "slug": "my-image",
      "storage_key": "uploads/my-image.webp",
      "storage_provider": "supabase",
      "image_url": "https://<project>.supabase.co/storage/v1/object/public/images/my-image.webp",
      "width": 1024,
      "height": 1024,
      "prompt": "A cyberpunk cat in neon Tokyo",
      "is_published": true
    },
    "tags": ["cyberpunk", "cat", "neon"]
  }' \
  -b "sb-access-token=<token>" | jq .
```

### PUT /api/images/:id — Update image

```bash
curl -s -X PUT "http://localhost:3000/api/images/my-image" \
  -H "Content-Type: application/json" \
  -d '{"image":{"prompt":"Updated prompt"},"tags":["new-tag"]}' \
  -b "sb-access-token=<token>" | jq .
```

### DELETE /api/images/:id — Delete image

```bash
curl -s -X DELETE "http://localhost:3000/api/images/my-image" \
  -b "sb-access-token=<token>" | jq .
```

---

## Ops routes

### POST /api/revalidate — On-demand revalidation

```bash
curl -s -X POST "http://localhost:3000/api/revalidate" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<REVALIDATE_SECRET>","tag":"gallery"}' | jq .
```

### GET /api/health — Health check

```bash
curl -s "http://localhost:3000/api/health" | jq .
```

---

## Expected status codes

| Route | Public | Auth | Rate Limit | Happy | Error |
|---|---|---|---|---|---|
| `GET /api/images` | Yes | No | No | `200` | `400` |
| `GET /api/images/:id` | Yes | No | No | `200` | `404` |
| `GET /api/search` | Yes | No | No | `200` | `400` |
| `POST /api/like/:id` | Yes | No | Yes | `200` | `429` |
| `POST /api/admin/auth` | No | No | No | `200` | `401` |
| `POST /api/admin/upload-signature` | No | Admin | No | `200` | `401` |
| `POST /api/images` | No | Admin | Yes | `201` | `401/429/400` |
| `PUT /api/images/:id` | No | Admin | Yes | `200` | `401/429/400` |
| `DELETE /api/images/:id` | No | Admin | Yes | `200` | `401/429` |
| `POST /api/revalidate` | No | Secret | No | `200` | `401/400` |
| `GET /api/health` | Yes | No | No | `200` | `500` |
