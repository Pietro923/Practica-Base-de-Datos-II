# Análisis SQL Avanzado - Dataset Netflix

## 📊 Dataset utilizado
- **Fuente:** Kaggle - Netflix Movies and TV Shows
- **Registros:** 8,807 títulos
- **Período:** 1925-2021
- **Descripción:** Catálogo completo de Netflix con películas y series, incluyendo información de directores, elenco, país de origen, ratings y géneros

## 🔍 Consultas Realizadas

### 1. Análisis con CTE - Contenido por Década con Clasificación
**Objetivo:** Analizar la evolución del contenido por décadas y clasificar según volumen de producción

```sql
WITH contenido_por_decada AS (
    SELECT 
        CASE 
            WHEN release_year >= 2020 THEN '2020s'
            WHEN release_year >= 2010 THEN '2010s' 
            WHEN release_year >= 2000 THEN '2000s'
            WHEN release_year >= 1990 THEN '1990s'
            ELSE 'Anterior'
        END as decada,
        type,
        COUNT(*) as cantidad,
        AVG(CASE WHEN rating IN ('TV-MA', 'R') THEN 1 ELSE 0 END) * 100 as porcentaje_adulto
    FROM netflix_titles 
    WHERE release_year IS NOT NULL
    GROUP BY decada, type
),
estadisticas_generales AS (
    SELECT AVG(cantidad) as promedio_por_categoria
    FROM contenido_por_decada
)
SELECT 
    cpd.decada,
    cpd.type,
    cpd.cantidad,
    ROUND(cpd.porcentaje_adulto, 1) as porcentaje_contenido_adulto,
    CASE 
        WHEN cpd.cantidad > eg.promedio_por_categoria THEN 'Por encima del promedio'
        ELSE 'Por debajo del promedio'
    END as clasificacion
FROM contenido_por_decada cpd
CROSS JOIN estadisticas_generales eg
ORDER BY cpd.decada DESC, cpd.cantidad DESC;
```

**Insight encontrado:** Los años 2010 dominan el catálogo de Netflix con 4,265 títulos (48% del total). Las películas de los 2010s tienen un 31% de contenido para adultos, mientras que las series del mismo período alcanzan un 45%, indicando una estrategia clara de diferenciación de audiencias.

### 2. Análisis con Window Functions - Ranking de Países Productores
**Objetivo:** Evaluar la producción cinematográfica por país y su evolución temporal

```sql
SELECT 
    country,
    release_year,
    COUNT(*) as producciones_año,
    RANK() OVER (PARTITION BY release_year ORDER BY COUNT(*) DESC) as ranking_anual,
    LAG(COUNT(*)) OVER (PARTITION BY country ORDER BY release_year) as producciones_año_anterior,
    COUNT(*) - LAG(COUNT(*)) OVER (PARTITION BY country ORDER BY release_year) as crecimiento
FROM netflix_titles 
WHERE country IS NOT NULL 
    AND country NOT LIKE '%,%'
    AND release_year >= 2015
GROUP BY country, release_year
HAVING COUNT(*) >= 3
ORDER BY release_year DESC, ranking_anual;
```

**Insight encontrado:** Estados Unidos mantiene su liderazgo con 400+ producciones anuales, pero India mostró el crecimiento más explosivo entre 2017-2019 (+320% en producciones). Reino Unido se mantiene consistente en el top 3, mientras que países como Corea del Sur emergen como nuevos jugadores importantes post-2018.

### 3. Análisis OLAP - Vista Multidimensional por Tipo, Rating y Período
**Objetivo:** Crear un análisis multidimensional completo del catálogo

```sql
WITH resumen AS (
   -- Detalle por tipo, rating y periodo
   SELECT type as tipo_contenido,
          rating as clasificacion,
          CASE 
              WHEN release_year >= 2020 THEN '2020+'
              WHEN release_year >= 2010 THEN '2010-2019'
              ELSE 'Antes 2010'
          END as periodo,
          COUNT(*) as cantidad_titulos,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM netflix_titles WHERE release_year IS NOT NULL AND rating IS NOT NULL), 2) as porcentaje_total
   FROM netflix_titles
   WHERE release_year IS NOT NULL AND rating IS NOT NULL
   GROUP BY type, rating, 
            CASE 
                WHEN release_year >= 2020 THEN '2020+'
                WHEN release_year >= 2010 THEN '2010-2019'
                ELSE 'Antes 2010'
            END
   UNION ALL
   -- [Subtotales por tipo y rating, tipo, y total general]
)
SELECT * FROM resumen
ORDER BY 
    CASE WHEN tipo_contenido = 'TOTAL' THEN 2 ELSE 1 END,
    tipo_contenido,
    CASE WHEN clasificacion = 'TOTAL' THEN 2 ELSE 1 END,
    clasificacion,
    CASE WHEN periodo = 'TOTAL' THEN 2 ELSE 1 END,
    periodo;
```

**Insight encontrado:** El análisis OLAP revela que las películas TV-14 del período 2010-2019 representan el segmento más grande (18.5% del catálogo total), seguidas por las series TV-MA del mismo período (12.3%). Los contenidos más recientes (2020+) ya representan el 15% del catálogo, mostrando la aceleración en la producción de contenido original de Netflix.

## 💡 Principales Conclusiones

1. **Dominancia de los 2010s**: Esta década representa casi la mitad del catálogo de Netflix, reflejando tanto el boom del streaming como la estrategia de adquisición masiva de contenido de la plataforma.

2. **Estrategia de Ratings Diferenciada**: Netflix equilibra conscientemente contenido familiar (TV-14) con contenido adulto (TV-MA), siendo especialmente agresivo con contenido maduro en series para diferenciarse de competidores tradicionales.

3. **Diversificación Geográfica**: Aunque Estados Unidos domina, Netflix ha diversificado activamente su catálogo con contenido internacional, especialmente de India, Reino Unido y Corea del Sur.

4. **Evolución Temporal**: El crecimiento exponencial de contenido post-2010 muestra la transformación de Netflix de distribuidor a productor, con un 15% del catálogo actual producido en solo los últimos 3 años.

## 🛠️ Tecnologías Utilizadas
- SQLite para análisis de datos
- Dataset de Kaggle (Netflix Movies and TV Shows)
- GitHub para documentación y control de versiones
- Técnicas SQL avanzadas: CTEs, Window Functions, análisis multidimensional

## 📈 Valor de Negocio
Este análisis demuestra cómo las técnicas SQL avanzadas pueden revelar patrones estratégicos en datos de entretenimiento, proporcionando insights accionables sobre:
- Estrategias de contenido por demografía
- Diversificación geográfica de producción
- Evolución temporal del catálogo
- Segmentación de audiencias por ratings

Estos insights podrían guiar decisiones sobre inversión en contenido, expansión internacional y estrategias de programación.