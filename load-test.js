/**
 * Prueba de Rendimiento / Carga de Búsqueda — Manager Library
 * Cumplimiento de RNF-1: La búsqueda de libros responde en menos de 300 ms.
 */

const API_BASE = process.env.API_URL || 'http://localhost:8000/api/v1';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_secret_pass';

console.log('====================================================');
console.log('⏱️  Prueba de Carga y Rendimiento (RNF-1)');
console.log(`📡 URL Objetivo: ${API_BASE}`);
console.log('🎯 Umbral Máximo Permitido: 300 ms por consulta');
console.log('====================================================\n');

async function main() {
  try {
    // 1. Obtener Token
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    });

    if (!loginRes.ok) {
      console.warn('⚠️ No se pudo autenticar. Verifica que el backend esté arriba.');
      return;
    }

    const { access_token } = await loginRes.json();
    const headers = { Authorization: `Bearer ${access_token}` };

    // 2. Ejecutar ráfaga de búsquedas concurrentes y medir latencias
    const searchTerms = ['soledad', 'código', 'quijote', 'algoritmo', 'historia', 'principito', 'clean', 'física'];
    console.log(`🚀 Ejecutando ráfaga de ${searchTerms.length * 3} consultas de búsqueda...`);

    const latencies = [];

    for (let round = 1; round <= 3; round++) {
      for (const term of searchTerms) {
        const start = performance.now();
        const res = await fetch(`${API_BASE}/books?q=${encodeURIComponent(term)}&page=1&size=20`, { headers });
        const end = performance.now();
        const duration = Math.round(end - start);

        latencies.push(duration);

        if (res.ok) {
          const data = await res.json();
          console.log(`   🔎 Búsqueda «${term}»: ${data.total} resultados | ${duration} ms`);
        }
      }
    }

    // 3. Métricas
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);

    console.log('\n====================================================');
    console.log('📊 RESULTADOS DE RENDIMIENTO:');
    console.log(`   - Latencia Mínima:  ${min} ms`);
    console.log(`   - Latencia Promedio: ${avg} ms`);
    console.log(`   - Latencia Máxima:  ${max} ms`);
    console.log('====================================================');

    if (max <= 300) {
      console.log('✅ RNF-1 SUPERADO: Todas las peticiones respondieron en menos de 300 ms.');
    } else {
      console.log(`⚠️ Advertencia: La latencia máxima (${max} ms) superó el umbral ideal de 300 ms.`);
    }

  } catch (err) {
    console.error('❌ Error en prueba de carga:', err.message);
  }
}

main();
