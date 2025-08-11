import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuración ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const archivoEntrada = path.join(__dirname, 'localidades.json');
const archivoSalida = path.join(__dirname, 'localidades_limpio_y_final.json');

// Lista de nombres a estandarizar para Mendoza
const seccionesMendoza = [
    "sección primera", "sección segunda", "sección tercera",
    "sección cuarta", "sección quinta", "sección sexta",
    "sección séptima", "sección octava", "sección novena", "sección décima"
];

console.log('Iniciando limpieza y simplificación profunda del JSON...');

try {
    const dataOriginal = fs.readFileSync(archivoEntrada, 'utf8');
    const jsonCompleto = JSON.parse(dataOriginal);

    if (!jsonCompleto.localidades) {
        throw new Error("El archivo JSON original no tiene la propiedad 'localidades'.");
    }

    // 1. Mapeamos cada localidad a un nuevo formato simplificado y limpio
    const localidadesLimpias = jsonCompleto.localidades.map(loc => {
        let nombreFinal = loc.nombre;

        // 2. Lógica para limpiar los datos: Estandarizar secciones de Mendoza
        const nombreNormalizado = loc.nombre.toLowerCase();
        if (loc.provincia.nombre === 'Mendoza' && seccionesMendoza.includes(nombreNormalizado)) {
            nombreFinal = 'Mendoza Ciudad';
        }

        // 3. Creamos el nuevo objeto con solo los campos que nos interesan
        return {
            nombre: nombreFinal,
            provincia: loc.provincia.nombre // Guardamos solo el string del nombre de la provincia
        };
    });

    // 4. MUY IMPORTANTE: Envolvemos nuestro nuevo arreglo en la estructura original
    const resultadoFinalConEstructura = {
        localidades: localidadesLimpias
    };

    // 5. Guardamos el resultado en el nuevo archivo
    fs.writeFileSync(archivoSalida, JSON.stringify(resultadoFinalConEstructura, null, 2));

    console.log(`✅ ¡Éxito! Se ha creado el archivo "${path.basename(archivoSalida)}" con ${localidadesLimpias.length} localidades limpias y estandarizadas.`);

} catch (error) {
    console.error('❌ Ha ocurrido un error durante el proceso:', error.message);
}