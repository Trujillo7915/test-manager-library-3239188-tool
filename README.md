# test-manager-library-3239188-tool

> **Prueba técnica SDD · Ficha ADSO 3239188**  
> Utilidades: sembrador de datos de demostración y prueba de carga por API.

Este repositorio provee las herramientas automatizadas para poblar la biblioteca con datos de prueba realistas y evaluar los requisitos no funcionales del sistema.

---

## 1. Cumplimiento de la Constitución y del Spec

* **Artículo IX & data-model.md §9:** El sembrador de datos de demostración usa la **API REST HTTP**, **nunca SQL directo**.
* **Tarea T-21:**
  * Siembra al menos **40 libros** distribuidos en las 5 categorías oficiales.
  * Siembra al menos **10 socios** con número de documento único.
  * Registra al menos **15 préstamos** con líneas asociadas.
  * Genera **3 préstamos vencidos**, verificando que `/loans/overdue` devuelva al menos 3 registros.
  * Registra devoluciones para comprobar el estado `closed` y la reposición de ejemplares.
  * Verifica que el reporte `/reports/most-borrowed` contenga filas agrupadas.
* **Requisito No Funcional RNF-1:** Script de prueba de carga y medición de latencia para verificar que las búsquedas de libros respondan en menos de 300 ms.

---

## 2. Requisitos Previos

* Node.js v18+ (utiliza la API nativa `fetch`, por lo que **no requiere instalar dependencias adicionales** con `npm install`).

---

## 3. Uso del Sembrador (Seed)

1. Asegúrate de que el backend (`api`) esté levantado y escuchando peticiones en `http://localhost:8000/api/v1`.
2. Ejecutar el sembrador de demostración:
   ```bash
   node seed.js
   # o con npm:
   npm run seed
   ```

3. El script realizará:
   * Login como administrador.
   * Obtención del token JWT.
   * Creación del bibliotecario de demostración.
   * Creación de 42 libros con ISBN de 13 dígitos.
   * Creación de 12 socios.
   * Registro de préstamos y devoluciones.
   * Verificación automática de `/loans/overdue` y `/reports/most-borrowed`.

---

## 4. Prueba de Rendimiento / Carga (RNF-1)

Para medir los tiempos de respuesta de la búsqueda de catálogo:
```bash
node load-test.js
# o con npm:
npm run load-test
```
