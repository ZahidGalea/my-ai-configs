---
name: meta-ads-campaign-control
description: Use when managing, creating, reconciling, or documenting Meta Ads campaigns for this lead-generation monorepo. Applies to any work involving campaigns, adsets, creatives, ads, image uploads, page/pixel inventory, or the per-brand YAML state files under meta-ads-management/<brand>/state.yml.
---

# Meta Ads Campaign Control

## Propósito

Crear y operar campañas Meta Ads para este monorepo. Mantiene el estado remoto de Meta sincronizado con el `state.yml` del brand, sin exponer secretos ni generar gasto accidental.

## Lectura obligatoria antes de actuar

1. **Identificar el brand** con el que se va a trabajar. Si no está claro, preguntarlo antes de cualquier acción.
2. **Leer `meta-ads-management/<brand>/state.yml`** — IDs existentes, hashes de imágenes, operaciones anteriores.
3. **Leer `meta-ads-management/docs/graph-api-playbook.md`** — referencia completa: qué usa CLI vs Graph API, flujo paso a paso, errores conocidos, convenciones de nombres. **Esta es la fuente de verdad operativa.**
4. **Leer `brands/<brand>/angles/*-copies.yml`** del ángulo a trabajar — copy (body, title, description), landing URL, CTA.

## Regla principal: CLI + Graph API

El CLI cubre campañas y ads. Para adsets y creatives DCO siempre se usa la **Graph API directa**. El playbook documenta exactamente qué requiere cada operación.

Ejecutar el CLI siempre desde la carpeta del brand:

```bash
cd meta-ads-management/<brand>
uv run --project .. meta --output json ads campaign list --limit 100
```

Leer el token sin exponerlo:

```bash
TOKEN=$(grep '^ACCESS_TOKEN=' .env | cut -d'=' -f2)
AD_ACCOUNT=$(grep '^AD_ACCOUNT_ID=' .env | cut -d'=' -f2)
```

## Estructura de archivos por brand

```
meta-ads-management/
├── <brand>/
│   ├── .env         ← ACCESS_TOKEN, AD_ACCOUNT_ID
│   └── state.yml    ← estado de recursos remotos
└── docs/
    └── graph-api-playbook.md
```

Si el brand no tiene carpeta aún, crearla y pedir al usuario que añada el `.env` con su token y `AD_ACCOUNT_ID` antes de continuar.

## Workflow

### 1. Cargar estado
- Leer `<brand>/state.yml` completo.
- Confirmar que el `AD_ACCOUNT_ID` del brand corresponde al brand correcto — **nunca mezclar cuentas entre brands**.
- Verificar `git status` para no sobreescribir cambios del usuario.

### 2. Reconciliar inventario remoto
Antes de crear recursos, listar lo que existe en Meta:

```bash
cd meta-ads-management/<brand>
uv run --project .. meta --output json ads campaign list --limit 100
uv run --project .. meta --output json ads adset list --limit 100
uv run --project .. meta --output json ads ad list --limit 100
```

Comparar con `state.yml` y actualizarlo si hay diferencias.

### 3. Crear recursos en orden estricto

```
Campaña (CLI) → Adset (Graph API) → Imágenes (Graph API) → Creative (Graph API o CLI) → Ad (CLI)
```

Prerrequisitos antes de crear:
- `PAGE_ID` confirmado en `state.yml`
- `landing_url` del ángulo confirmada en el copies YAML
- Copy (body, title, description, CTA) leído del copies YAML
- Si es creative DCO: hashes de imágenes subidos antes de crear el creative

### 4. Siempre PAUSED
Crear todo con `status=PAUSED` o `--status paused`. No activar nada sin confirmación explícita del usuario.

### 5. Escribir `state.yml` tras cada operación
Registrar inmediatamente tras cada recurso creado:
- ID devuelto, nombre, status, parent IDs, fecha
- Para creatives DCO: hashes con ratio y path de imagen
- En `operations`: acción, resultado, resource_id, nota

Nunca guardar tokens, valores del `.env` ni URLs con `access_token`.

## Estructura del state.yml

```yaml
generated_at: "YYYY-MM-DD"
brand: "<brand>"
source: "meta-ads-management/<brand>/.env"
notes: []

ad_accounts:
  - id: "act_XXXXXXXXX"
    name: "Nombre cuenta"
    brand: "<brand>"
    account_spending_limit: "30000"  # centavos

pages:
  - id: "XXXXXXXXX"
    brand: "<brand>"
    note: ""

campaigns:
  - id: "..."
    name: "[BRAND]_[ANGLE]_LEADS_[YYYYMMDD]"
    effective_status: "PAUSED"
    objective: "OUTCOME_LEADS"
    daily_budget: "1500"
    angle: "GTP-P0-012"
    brand: "<brand>"
    created_at: "YYYY-MM-DD"

adsets:
  - id: "..."
    name: "[ANGLE]_[MERCADO]_[AUDIENCIA]_DCO"
    campaign_id: "..."
    is_dynamic_creative: true
    targeting_countries: ["ES"]
    promoted_object_page_id: "..."
    dsa_beneficiary: "<brand display name>"
    dsa_payor: "<brand display name>"
    created_at: "YYYY-MM-DD"

creatives:
  - id: "..."
    name: "[CREATIVE_ID]_3-ratios"
    type: "asset_feed_spec_dco"
    page_id: "..."
    angle: "..."
    brand: "<brand>"
    created_at: "YYYY-MM-DD"
    images:
      - ratio: "1x1"
        hash: "..."
        path: "creatives-images/out/<brand>/..."
      - ratio: "4x5"
        hash: "..."
        path: "creatives-images/out/<brand>/..."
      - ratio: "9x16"
        hash: "..."
        path: "creatives-images/out/<brand>/..."
    body: "..."
    title: "..."
    description: "..."
    link_url: "..."
    call_to_action: "SIGN_UP"

ads:
  - id: "..."
    name: "..."
    adset_id: "..."
    campaign_id: "..."
    creative_id: "..."
    effective_status: "PAUSED"
    created_at: "YYYY-MM-DD"

operations:
  - at: "YYYY-MM-DD"
    action: "campaign.create"
    status: "succeeded"
    resource_id: "..."
```

## Seguridad

- No exponer tokens, `.env` ni URLs con `access_token`.
- No borrar recursos sin confirmación explícita con verificación de IDs.
- No activar ads si faltan: page_id válido, landing_url verificada, creative validado, compliance del ángulo revisada.
- Para campañas de finanzas/trading: respetar siempre los `compliance_notes` del copies YAML.

## Respuesta final

Reportar siempre:
- Recursos creados o modificados con sus IDs
- Qué cambió en `<brand>/state.yml`
- Bloqueadores pendientes (page en Business Portfolio, pixel, compliance, app en Dev Mode)
- Comando de verificación o URL de Ads Manager para preview
