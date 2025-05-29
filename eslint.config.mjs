import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Aunque next/typescript ya debería cargar el plugin @typescript-eslint,
// si alguna vez necesitas referenciarlo directamente (ej. para el parser),
// importar tseslint es la forma moderna. Para este cambio específico, puede no ser
// estrictamente necesario, pero es buena práctica tenerlo si planeas más personalizaciones.
// import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // Si tus configuraciones extendidas son .js y tu package.json tiene "type": "module"
  // podrías necesitar resolverlas explícitamente, aunque FlatCompat intenta manejar esto.
});

const eslintConfig = [
  // Mantienes tus configuraciones base de Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Añades un nuevo objeto de configuración para personalizar reglas.
  // Este objeto se aplicará después de los extendidos.
  {
    // Opcional: puedes especificar `files` si quieres que esta configuración
    // de regla se aplique solo a ciertos archivos, aunque `next/typescript`
    // ya debería estar configurado para archivos .ts y .tsx.
    // files: ["**/*.ts", "**/*.tsx"],

    // El plugin '@typescript-eslint' ya debería estar registrado por `next/typescript`.
    // Si no fuera así, tendrías que añadirlo aquí:
    // plugins: {
    //   '@typescript-eslint': tseslint.plugin,
    // },
    // languageOptions: { // Para configurar el parser si no lo hicieran los extends
    //   parser: tseslint.parser,
    //   parserOptions: {
    //     project: true, // o './tsconfig.json'
    //   }
    // },

    rules: {
      // Sobrescribes o defines las opciones para la regla @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': [
        'warn', // O 'error' si prefieres que sea un error en lugar de una advertencia
        {
          args: 'after-used', // Opción común: no chequear argumentos antes del último usado
          argsIgnorePattern: '^_', // Ignorar argumentos de función no usados que empiecen con _
          varsIgnorePattern: '^_',  // Ignorar variables no usadas que empiecen con _
          caughtErrors: 'all', // Opción común: chequear todos los errores capturados
          caughtErrorsIgnorePattern: '^_', // Ignorar errores capturados no usados que empiecen con _
          destructuredArrayIgnorePattern: '^_', // Ignorar elementos de array desestructurados no usados que empiecen con _
          ignoreRestSiblings: true, // Muy útil: no advertir sobre "hermanos" de un rest spread no usados
        },
      ],
      // Aquí puedes añadir o modificar otras reglas si lo necesitas
    },
  }
];

export default eslintConfig;