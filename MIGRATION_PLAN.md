# MIGRATION PLAN: MOCK DATA TO SUPABASE (ETAPA 1)

## 1. Archivos SQL
- `supabase_schema.sql`: Contiene el DDL de todas las tablas, relaciones, roles y RLS.
- `supabase_seed.sql`: Contiene algunos datos de ejemplo iniciales para insertar. 
Ambos se han creado en la raíz del proyecto. Deberás ejecutar `supabase_seed.sql` en tu dashboard de Supabase (SQL Editor).

## 2. Cliente de Supabase
- `src/lib/supabase.ts`: Inicializa la conexión a Supabase. Requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en tu archivo `.env`.

## 3. Capa de Servicios (`src/services/api.ts`)
Aquí es donde agruparemos todas las llamadas fetch usando el cliente de Supabase. Hemos creado funciones iniciales:
- `teamsService.getAllTeams()`
- `matchesService.getAllMatches()`

## 4. Custom Hooks (`src/hooks/useData.ts`)
Contiene hooks simples de React para facilitar el consumo de los servicios y proveer estados de carga y error:
- `useTeams()`
- `useMatches()`
- `useMatch(id)`

---

## 5. Cambios Mínimos Requeridos por Vista

**IMPORTANTE:** Para mantener la app funcionando durante la migración, NO se eliminará `src/data.ts` inmediatamente. Cada vista cambiará a datos reales de Supabase archivo por archivo.

### Reemplazo de Tipos
Al cambiar la fuente, notarás que los objetos de Supabase traen `match.home_team.name` en lugar de requerir una llamada a `getTeam(match.homeTeamId)`.

### View: `DashboardView.tsx`
- Actualmente importa `MATCHES` de `src/data.ts`.
- **Qué hacer**: Reemplazar la importación estática por `const { matches, loading } = useMatches();`.
- Reemplazar map calls estáticos y pasar un loading state temporal si `loading === true`.

### View: `MatchesView.tsx`
- **Qué hacer**: Usar `const { matches, loading } = useMatches()`.
- Iterar sobre `matches` devueltos por la API en vez de `MATCHES` exportado estáticamente.
- Para sacar el logo y nombre de país: acceder a `match.home_team.name` y `match.home_team.flag_code`.

### View: `MatchDetailView.tsx`
- Importa por ID de `useParams()`.
- **Qué hacer**: Llamar `useMatch(id)`. 
- Mostrar componente de Loading mientras resolvemos. 
- Extraer estadísticas y probablidiades estáticas que por ahora pueden seguir siendo dummy (en Supabase faltan tablas para xG minuto a minuto, por ejemplo), o pueden alimentarse del objeto `match` de la base de datos si añadimos campos JSON adicionales estáticos al seed.

### View: `GroupsView.tsx`
- Utiliza data estática (equipos manuales o `MATCHES` de arrays).
- **Qué hacer**: Traer `teams` utilizando `useTeams()` agrupándolos en frontend por `team.group_name`.

### View: `PredictorView.tsx`
- Usa Firebase Auth y base de datos `db` desde Firestore para guardar predicciones actualmente.
- **Qué hacer Temporalmente**: 
  1. Puedes mantener Auth de Firebase. Cuando el usuario inicie sesión, su `uid` se debe "sincronizar" o asociar al grabar `match_predictions` en Supabase (requeriría pasar el rol RLS por un server Edge function o relajar el RLS para que permita UUIDs como cadena de Firebase). 
  2. Alternativamente, migrar la vista de Login a Supabase Auth. Recomendado migrar a Supabase Auth para poder usar RLS nativo en la tabla `match_predictions`.

## 6. Estrategia "Zero Downtime" de Migración

1. **Fase 1 (Actual)**: Tablas y hooks creados. Nada de la UI cambia aún. Frontend sigue 100% sobre `data.ts`.
2. **Fase 2 (Vista a vista)**: Convertir *una vista a la vez*. Ejemplo: `MatchesView`. Actualizar el import. Probar localmente. Empujar a producción.
3. **Fase 3 (Predicciones/Auth)**: Sincronizar el hook de Firebase a Supabase Auth en `PredictorView.tsx`. Reemplazar las escrituras a firestore por `supabase.from('match_predictions')`.
4. **Fase 4 (Cleanup)**: Eliminar `src/data.ts` y todos los imports huérfanos. Limpiar dependencias de Firebase si se pasó Auth entero a Supabase.
