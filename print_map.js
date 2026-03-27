const utf8Chars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', '¿', '¡'];
const map = {};
for (const char of utf8Chars) {
    const rawBytes = Buffer.from(char, 'utf8').toString('binary');
    map[rawBytes] = char;
}
console.log(JSON.stringify(map, null, 2));
