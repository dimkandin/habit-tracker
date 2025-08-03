const fs = require('fs');
const path = require('path');

// Читаем данные из файлов
const daylioData = fs.readFileSync('../import_for_habit/daylio_export_2025_08_03.csv', 'utf8');
const habitTrackerData = fs.readFileSync('../import_for_habit/20230208_20250803_Habit.csv', 'utf8');
const wayOfLifeData = fs.readFileSync('../import_for_habit/Way of Life (03.08.2025).csv', 'utf8');

// Создаем объект с данными для импорта
const importData = {
  daylio: daylioData,
  habitTracker: habitTrackerData,
  wayOfLife: wayOfLifeData
};

// Сохраняем данные в JSON файл для удобного импорта
fs.writeFileSync('import_data.json', JSON.stringify(importData, null, 2));

console.log('✅ Данные подготовлены для импорта!');
console.log('');
console.log('📋 Инструкции по импорту:');
console.log('');
console.log('1. Откройте приложение: https://dimkandin.github.io/habit-tracker');
console.log('2. Нажмите кнопку 🗄️ (Database) в заголовке');
console.log('3. Выберите источник данных:');
console.log('   - Daylio для настроения');
console.log('   - Habit Tracker для привычек');
console.log('   - Way of Life для привычек');
console.log('4. Скопируйте содержимое соответствующего файла:');
console.log('   - daylio_export_2025_08_03.csv для настроения');
console.log('   - 20230208_20250803_Habit.csv для привычек');
console.log('   - Way of Life (03.08.2025).csv для привычек');
console.log('5. Вставьте данные в текстовое поле');
console.log('6. Нажмите "Импортировать"');
console.log('');
console.log('📊 Ожидаемые результаты:');
console.log('- Daylio: 1 привычка настроения с историей');
console.log('- Habit Tracker: несколько привычек с бинарными значениями');
console.log('- Way of Life: несколько привычек с цветовой системой');
console.log('');
console.log('🎯 После импорта вы сможете:');
console.log('- Видеть всю историю привычек');
console.log('- Отслеживать прогресс и серии');
console.log('- Использовать единый трекер для всех привычек'); 