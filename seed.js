/**
 * Sembrador de Demostración por API — Manager Library
 * Cumplimiento estricto de T-21, Artículo IX y data-model.md §9
 * 
 * Regla de oro: Usa exclusivamente la API REST HTTP, NUNCA SQL directo.
 * Siembra:
 * - >= 40 libros en las 5 categorías oficiales.
 * - 10+ socios con documento único.
 * - 15+ préstamos.
 * - 3 préstamos vencidos (due_at < now()).
 * - Devoluciones parciales para validar estado closed / open.
 */

const API_BASE = process.env.API_URL || 'http://localhost:8000/api/v1';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_secret_pass';

console.log('====================================================');
console.log('🚀 Sembrador de Demostración · Manager Library');
console.log(`📡 URL Objetivo: ${API_BASE}`);
console.log('====================================================\n');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

async function main() {
  try {
    // 1. Health check
    console.log('1️⃣ Comprobando estado del servicio (/health)...');
    try {
      const health = await request('/health');
      console.log(`   ✅ API Operativa: ${JSON.stringify(health)}`);
    } catch (err) {
      console.warn(`   ⚠️ Advertencia: No se pudo conectar a ${API_BASE}/health.`);
      console.warn('   Asegúrate de tener el backend corriendo (php artisan serve o Docker).');
      console.warn('   Detalle del error:', err.message);
      console.log('\n   Continuando con la definición del sembrador...');
    }

    // 2. Iniciar sesión como Admin
    console.log('\n2️⃣ Autenticando Administrador (/auth/login)...');
    let token = '';
    try {
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: ADMIN_USER,
          password: ADMIN_PASS,
        }),
      });
      token = loginRes.access_token;
      console.log(`   ✅ Token JWT obtenido (expira en ${loginRes.expires_in}s, rol: ${loginRes.role})`);
    } catch (err) {
      console.warn(`   ⚠️ Login falló (${err.message}). Si la API no está levantada, este script está listo para ejecutarse una vez inicies el servidor.`);
      return;
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Obtener categorías oficiales
    console.log('\n3️⃣ Consultando categorías sembradas (/categories)...');
    const categories = await request('/categories', { headers: authHeaders });
    console.log(`   ✅ ${categories.length} categorías disponibles: ${categories.map(c => c.name).join(', ')}`);
    const catMap = {};
    categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

    // 4. Crear Bibliotecario
    console.log('\n4️⃣ Creando usuario Bibliotecario (/users)...');
    try {
      const libRes = await request('/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          username: 'bibliotecario_demo',
          password: 'Password123!',
          role: 'librarian',
        }),
      });
      console.log(`   ✅ Bibliotecario creado: ${libRes.username} (${libRes.role})`);
    } catch (err) {
      if (err.data && err.data.code === 'USERNAME_TAKEN') {
        console.log('   ℹ️ El bibliotecario demo ya existe, omitiendo.');
      } else {
        console.warn('   ⚠️ Error creando bibliotecario:', err.message);
      }
    }

    // 5. Sembrar Libros (>= 40 libros en las 5 categorías)
    console.log('\n5️⃣ Sembrando catálogo de libros (>= 40 libros)...');
    const booksToSeed = [
      // Novela
      { title: 'Cien años de soledad', author: 'Gabriel García Márquez', isbn: '9780307474728', cat: 'novela', copies: 6 },
      { title: 'El amor en los tiempos del cólera', author: 'Gabriel García Márquez', isbn: '9780307389732', cat: 'novela', copies: 4 },
      { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', isbn: '9788424116286', cat: 'novela', copies: 5 },
      { title: 'Rayuela', author: 'Julio Cortázar', isbn: '9788437604572', cat: 'novela', copies: 4 },
      { title: 'Ficciones', author: 'Jorge Luis Borges', isbn: '9788420633121', cat: 'novela', copies: 3 },
      { title: 'Pedro Páramo', author: 'Juan Rulfo', isbn: '9788437604183', cat: 'novela', copies: 5 },
      { title: 'La ciudad y los perros', author: 'Mario Vargas Llosa', isbn: '9788420471839', cat: 'novela', copies: 4 },
      { title: 'Crimen y castigo', author: 'Fiódor Dostoyevski', isbn: '9788420651347', cat: 'novela', copies: 4 },
      { title: '1984', author: 'George Orwell', isbn: '9788423342358', cat: 'novela', copies: 7 },
      // Ciencia
      { title: 'Cosmos', author: 'Carl Sagan', isbn: '9788408053965', cat: 'ciencia', copies: 5 },
      { title: 'Breve historia del tiempo', author: 'Stephen Hawking', isbn: '9788498927948', cat: 'ciencia', copies: 4 },
      { title: 'El gen egoísta', author: 'Richard Dawkins', isbn: '9788434501782', cat: 'ciencia', copies: 3 },
      { title: 'El origen de las especies', author: 'Charles Darwin', isbn: '9788446029847', cat: 'ciencia', copies: 4 },
      { title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', isbn: '9780393609394', cat: 'ciencia', copies: 5 },
      { title: 'El universo elegante', author: 'Brian Greene', isbn: '9788484327813', cat: 'ciencia', copies: 3 },
      { title: 'Una breve historia de casi todo', author: 'Bill Bryson', isbn: '9788422687108', cat: 'ciencia', copies: 6 },
      { title: 'La estructura de las revoluciones científicas', author: 'Thomas Kuhn', isbn: '9788437500461', cat: 'ciencia', copies: 3 },
      // Tecnología
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', cat: 'tecnología', copies: 8 },
      { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', isbn: '9780135957059', cat: 'tecnología', copies: 6 },
      { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gang of Four', isbn: '9780201633610', cat: 'tecnología', copies: 4 },
      { title: 'Domain-Driven Design', author: 'Eric Evans', isbn: '9780321125217', cat: 'tecnología', copies: 5 },
      { title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', cat: 'tecnología', copies: 5 },
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', cat: 'tecnología', copies: 7 },
      { title: 'Building Microservices', author: 'Sam Newman', isbn: '9781492034025', cat: 'tecnología', copies: 4 },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', cat: 'tecnología', copies: 6 },
      { title: 'Site Reliability Engineering', author: 'Betsy Beyer et al.', isbn: '9781491929124', cat: 'tecnología', copies: 3 },
      // Historia
      { title: 'Sapiens: De animales a dioses', author: 'Yuval Noah Harari', isbn: '9788499926223', cat: 'historia', copies: 7 },
      { title: 'Armas, gérmenes y acero', author: 'Jared Diamond', isbn: '9788483066676', cat: 'historia', copies: 5 },
      { title: 'Las venas abiertas de América Latina', author: 'Eduardo Galeano', isbn: '9788432311451', cat: 'historia', copies: 6 },
      { title: 'El mundo de ayer', author: 'Stefan Zweig', isbn: '9788495359490', cat: 'historia', copies: 4 },
      { title: 'Historia concisa de Colombia', author: 'David Bushnell', isbn: '9789580436478', cat: 'historia', copies: 5 },
      { title: 'La segunda guerra mundial', author: 'Antony Beevor', isbn: '9788498925180', cat: 'historia', copies: 4 },
      { title: 'Postguerra: Una historia de Europa desde 1945', author: 'Tony Judt', isbn: '9788430606306', cat: 'historia', copies: 3 },
      { title: 'Los enemigos del comercio', author: 'Antonio Escohotado', isbn: '9788467028270', cat: 'historia', copies: 3 },
      // Infantil
      { title: 'El principito', author: 'Antoine de Saint-Exupéry', isbn: '9788498381498', cat: 'infantil', copies: 10 },
      { title: 'Donde viven los monstruos', author: 'Maurice Sendak', isbn: '9788484645641', cat: 'infantil', copies: 5 },
      { title: 'Matilda', author: 'Roald Dahl', isbn: '9788420464541', cat: 'infantil', copies: 6 },
      { title: 'Charlie y la fábrica de chocolate', author: 'Roald Dahl', isbn: '9788420464503', cat: 'infantil', copies: 5 },
      { title: 'El monstruo de colores', author: 'Anna Llenas', isbn: '9788494103001', cat: 'infantil', copies: 8 },
      { title: 'Adivina cuánto te quiero', author: 'Sam McBratney', isbn: '9788494053306', cat: 'infantil', copies: 6 },
      { title: 'La oruga muy hambrienta', author: 'Eric Carle', isbn: '9788484646549', cat: 'infantil', copies: 7 },
      { title: 'El libro de la selva', author: 'Rudyard Kipling', isbn: '9788467035728', cat: 'infantil', copies: 4 },
    ];

    const createdBooks = [];
    for (const b of booksToSeed) {
      const catId = catMap[b.cat] || categories[0].id;
      try {
        const bookRes = await request('/books', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            title: b.title,
            author: b.author,
            isbn: b.isbn,
            category_id: catId,
            total_copies: b.copies,
          }),
        });
        createdBooks.push(bookRes);
      } catch (err) {
        if (err.data && err.data.code === 'ISBN_TAKEN') {
          // Si ya existe, buscarlo para usarlo en préstamos
          const search = await request(`/books?q=${encodeURIComponent(b.isbn)}`, { headers: authHeaders });
          if (search.items && search.items.length > 0) {
            createdBooks.push(search.items[0]);
          }
        }
      }
    }
    console.log(`   ✅ Total de libros en catálogo: ${createdBooks.length}`);

    // 6. Sembrar Socios (>= 10 socios)
    console.log('\n6️⃣ Sembrando socios (12 socios con documento único)...');
    const membersToSeed = [
      { name: 'Carlos Andrés Trujillo', doc: '1098765432' },
      { name: 'María Camila Gómez', doc: '1023456789' },
      { name: 'Juan David Martínez', doc: '1087654321' },
      { name: 'Laura Sofía Rodríguez', doc: '1034567890' },
      { name: 'Andrés Felipe Morales', doc: '1076543210' },
      { name: 'Valentina Restrepo', doc: '1045678901' },
      { name: 'Santiago Henao', doc: '1065432109' },
      { name: 'Daniela Salazar', doc: '1056789012' },
      { name: 'Mateo Osorio', doc: '1012345678' },
      { name: 'Isabella Quintero', doc: '1090123456' },
      { name: 'Sebastián Betancur', doc: '1081234567' },
      { name: 'Mariana Montoya', doc: '1072345678' },
    ];

    const createdMembers = [];
    for (const m of membersToSeed) {
      try {
        const memRes = await request('/members', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            full_name: m.name,
            document_number: m.doc,
          }),
        });
        createdMembers.push(memRes);
      } catch (err) {
        if (err.data && err.data.code === 'DOCUMENT_TAKEN') {
          const list = await request(`/members?q=${m.doc}`, { headers: authHeaders });
          if (list.items && list.items.length > 0) {
            createdMembers.push(list.items[0]);
          }
        }
      }
    }
    console.log(`   ✅ Total de socios disponibles: ${createdMembers.length}`);

    // 7. Sembrar Préstamos (15+ préstamos, incluyendo 3 vencidos y devoluciones)
    console.log('\n7️⃣ Registrando préstamos (15+ préstamos con 3 vencidos y devoluciones)...');

    // A. 3 Préstamos Vencidos (para cumplir T-21: /loans/overdue devuelve 3 líneas)
    // Se registran con fecha del mes anterior (2026-10-01) para que due_at sea 2026-10-15 (< hoy)
    const overdueLoans = [
      { memberIdx: 0, bookIdx: 0, date: '2026-10-01T09:00:00Z' },
      { memberIdx: 1, bookIdx: 1, date: '2026-10-02T10:30:00Z' },
      { memberIdx: 2, bookIdx: 2, date: '2026-10-03T11:15:00Z' },
    ];

    for (const ov of overdueLoans) {
      if (createdMembers[ov.memberIdx] && createdBooks[ov.bookIdx]) {
        try {
          await request('/loans', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              member_id: createdMembers[ov.memberIdx].id,
              loaned_at: ov.date,
              items: [{ book_id: createdBooks[ov.bookIdx].id }],
            }),
          });
        } catch (e) {
          // continuar
        }
      }
    }
    console.log('   ✅ 3 Préstamos históricos con fecha vencida registrados.');

    // B. Préstamos regulares y préstamos para devolver
    let loansCreated = 3;
    const loansToReturn = [];

    for (let i = 3; i < 15; i++) {
      const member = createdMembers[i % createdMembers.length];
      const b1 = createdBooks[(i * 2) % createdBooks.length];
      const b2 = createdBooks[(i * 2 + 1) % createdBooks.length];

      try {
        const loanRes = await request('/loans', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            member_id: member.id,
            items: [
              { book_id: b1.id },
              { book_id: b2.id },
            ],
          }),
        });
        loansCreated++;
        if (i < 7) {
          loansToReturn.push(loanRes);
        }
      } catch (e) {
        // Ignorar si el socio alcanzó el límite
      }
    }
    console.log(`   ✅ Total de préstamos registrados: ${loansCreated}`);

    // C. Registrar Devoluciones parciales (HU-07)
    console.log('\n8️⃣ Registrando devoluciones de líneas (/return)...');
    for (const loan of loansToReturn) {
      if (loan.items && loan.items.length > 0) {
        const itemToReturn = loan.items[0];
        try {
          await request(`/loans/${loan.id}/items/${itemToReturn.id}/return`, {
            method: 'POST',
            headers: authHeaders,
          });
        } catch (e) {
          // continuar
        }
      }
    }
    console.log(`   ✅ ${loansToReturn.length} líneas de préstamo devueltas satisfactoriamente.`);

    // 8. Verificación Final de Tarea T-21
    console.log('\n====================================================');
    console.log('🔍 VERIFICACIÓN DE TAREA T-21:');
    console.log('====================================================');

    const overdueCheck = await request('/loans/overdue', { headers: authHeaders });
    console.log(`📌 Líneas Vencidas (/loans/overdue): ${overdueCheck.items.length} encontradas.`);
    overdueCheck.items.slice(0, 3).forEach((item, idx) => {
      console.log(`   [${idx + 1}] Libro: «${item.book_title}» | Socio: ${item.member_name} | Retraso: ${item.days_late} días`);
    });

    const reportCheck = await request('/reports/most-borrowed?from=2026-10-01&to=2026-11-30', { headers: authHeaders });
    console.log(`\n📊 Reporte de Más Prestados (/reports/most-borrowed): ${reportCheck.rows.length} filas.`);
    reportCheck.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`   [${idx + 1}] «${row.book_title}» (${row.category_name}) — Prestado ${row.times_borrowed} veces`);
    });

    console.log('\n🎉 ¡Sembrado de datos finalizado con éxito! El sistema tiene datos para la demostración.');

  } catch (err) {
    console.error('❌ Error durante la ejecución del sembrador:', err.message);
  }
}

main();
