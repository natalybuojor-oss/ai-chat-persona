
# AI Persona Chat - Инструкция по настройке

Это руководство поможет вам шаг за шагом настроить и запустить приложение AI Persona Chat. Процесс включает в себя настройку Google Таблицы для управления доступом, создание Google Apps Script в качестве безопасного сервера и подключение его к React-приложению.

## Архитектура
- **Frontend**: React-приложение, которое вы видите и с которым взаимодействуете.
- **Backend**: Google Apps Script, который выступает в роли посредника между вашим приложением и Gemini API. Это необходимо, чтобы безопасно хранить ваш API-ключ.
- **База данных**: Google Таблица, используемая для хранения списка email-адресов, которым разрешен доступ (хотя в текущей версии приложения доступ не ограничен, функционал для рассылки приглашений есть).

---

### Шаг 1: Настройка Google Таблицы

1.  **Создайте новую Google Таблицу**: Перейдите на [sheets.google.com](https://sheets.google.com) и создайте пустую таблицу.
2.  **Настройте столбцы**:
    -   В ячейке **A1** напишите `Email`.
    -   В ячейке **B1** напишите `Invited`.
    -   (Опционально) Можете добавить несколько email-адресов в столбец A, начиная с A2.
3.  **Скопируйте ID таблицы**:
    -   URL-адрес вашей таблицы будет выглядеть примерно так: `https://docs.google.com/spreadsheets/d/1KUMcPkc1oKu0zzvOR1XaRwqO51idAhb4rR542dr8eNg/edit`
    -   **ID таблицы** - это длинная строка символов между `.../d/` и `/edit...`.
    -   В примере выше ID это: `1KUMcPkc1oKu0zzvOR1XaRwqO51idAhb4rR542dr8eNg`.
    -   **Скопируйте и сохраните этот ID**, он понадобится на следующем шаге.

---

### Шаг 2: Настройка Google Apps Script

Это самый важный шаг. Скрипт будет выполнять роль вашего сервера.

1.  **Создайте новый проект**: Перейдите на [script.google.com](https://script.google.com) и нажмите "**Новый проект**".
2.  **Вставьте код**:
    -   Удалите все содержимое из файла `Code.gs`.
    -   Скопируйте и вставьте в него следующий код. Этот код специально адаптирован для полной совместимости со средой Google.
        ```javascript
        // ==== НАСТРОЙКА ====
        // Вставьте сюда ТОЛЬКО ID вашей Google Таблицы из Шага 1
        var SPREADSHEET_ID = 'ВАШ_ID_ТАБЛИЦЫ_ЗДЕСЬ'; 
        // ==== КОНЕЦ НАСТРОЙКИ ====

        /**
         * Эта функция обрабатывает POST-запросы от вашего React-приложения.
         * Она выступает в роли безопасного посредника к Gemini API.
         */
        function doPost(e) {
          // Проверка: Убедимся, что скрипт был вызван через POST-запрос, а не запущен вручную
          if (!e || !e.postData || !e.postData.contents) {
            var manualRunError = "Эта функция (doPost) должна вызываться через HTTP POST запрос от веб-приложения. Её нельзя запускать вручную из редактора.";
            Logger.log(manualRunError);
            return ContentService.createTextOutput(JSON.stringify({ error: manualRunError }))
              .setMimeType(ContentService.MimeType.JSON);
          }

          try {
            var payload = JSON.parse(e.postData.contents);
            var userMessage = payload.message;
            var systemInstruction = payload.systemInstruction;
            
            var scriptProperties = PropertiesService.getScriptProperties();
            var primaryApiKey = scriptProperties.getProperty('GEMINI_API_KEY');
            var secondaryApiKey = scriptProperties.getProperty('GEMINI_API_KEY1');
            
            if (!primaryApiKey && !secondaryApiKey) {
              throw new Error("API Key (GEMINI_API_KEY или GEMINI_API_KEY1) не найден в Свойствах скрипта. Убедитесь, что вы добавили хотя бы один.");
            }

            var geminiPayload = {
              "contents": [{"parts": [{"text": userMessage}]}],
              "systemInstruction": {"parts": [{"text": systemInstruction}]}
            };

            // --- Новая логика с автоматическим переключением ключей ---

            var response;

            // Сначала пытаемся использовать основной ключ
            if (primaryApiKey) {
              response = makeGeminiRequest(primaryApiKey, geminiPayload);
            }

            // Если основной ключ исчерпал лимит (ошибка 429) или его не было, пробуем второй
            if ((!response || response.getResponseCode() === 429) && secondaryApiKey) {
              if (response) {
                 Logger.log('Основной ключ (GEMINI_API_KEY) исчерпал лимит. Переключаюсь на запасной (GEMINI_API_KEY1).');
              }
              response = makeGeminiRequest(secondaryApiKey, geminiPayload);
            }
            
            // Если ответа так и нет, значит ключи отсутствуют.
            if (!response) {
               throw new Error("Не удалось выполнить запрос. Проверьте наличие и правильность API ключей.");
            }
            
            // --- Конец новой логики ---

            var responseBody = response.getContentText();
            var responseCode = response.getResponseCode();
            
            if (responseCode >= 400) {
               Logger.log('Ошибка от Gemini API. Статус: ' + responseCode + '. Ответ: ' + responseBody);
               var errorDetail = responseBody;
               try {
                 var errorResponse = JSON.parse(responseBody);
                 if (errorResponse && errorResponse.error && errorResponse.error.message) {
                   errorDetail = errorResponse.error.message;
                 }
               } catch (parseError) {
                 Logger.log('Не удалось распарсить тело ошибки от Gemini как JSON: ' + parseError);
               }
               return ContentService.createTextOutput(JSON.stringify({ 
                   error: 'Ошибка от Gemini API (статус ' + responseCode + '). Детали: ' + errorDetail 
               })).setMimeType(ContentService.MimeType.JSON);
            }

            return ContentService.createTextOutput(responseBody).setMimeType(ContentService.MimeType.JSON);

          } catch (error) {
            Logger.log('Критическая ошибка в скрипте: ' + error.toString());
            var errorMessage = error.message || error.toString() || 'Произошла неизвестная ошибка на сервере.';
            return ContentService.createTextOutput(JSON.stringify({ error: errorMessage }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        /**
         * Вспомогательная функция для выполнения запроса к Gemini API
         * @param {string} apiKey - Ключ API для использования
         * @param {object} payload - Тело запроса для Gemini
         * @returns {HTTPResponse} - Ответ от сервера
         */
        function makeGeminiRequest(apiKey, payload) {
            var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
            var options = {
              'method': 'post',
              'contentType': 'application/json',
              'payload': JSON.stringify(payload),
              'muteHttpExceptions': true
            };
            return UrlFetchApp.fetch(geminiUrl, options);
        }

        // Функции ниже нужны для отправки приглашений из меню в Google Таблице.
        // Они не влияют на работу основного чата.
        function onOpen() {
          SpreadsheetApp.getUi()
              .createMenu('Управление доступом')
              .addItem('Отправить приглашения', 'sendInvitations')
              .addToUi();
        }

        function sendInvitations() {
          var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
          var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2); // A2:B...
          var data = dataRange.getValues();
          var ui = SpreadsheetApp.getUi();

          var webAppUrl = ScriptApp.getService().getUrl();
          if (!webAppUrl) {
            ui.alert('Сначала разверните проект как веб-приложение (Развертывание -> Новое развертывание).');
            return;
          }

          for (var i = 0; i < data.length; i++) {
            var email = data[i][0];
            var status = data[i][1];
            
            if (email && status !== 'YES') {
              var subject = 'Приглашение в AI Persona Chat';
              var body = 'Здравствуйте!\n\nВам открыт доступ к приложению AI Persona Chat.\n\nПерейдите по ссылке, чтобы начать: ' + webAppUrl + '\n';
              
              try {
                MailApp.sendEmail(email, subject, body);
                sheet.getRange(i + 2, 2).setValue('YES');
              } catch (e) {
                Logger.log('Failed to send email to ' + email + ': ' + e.message);
                sheet.getRange(i + 2, 2).setValue('ERROR'); 
              }
            }
          }
          ui.alert('Готово', 'Проверка и отправка приглашений завершены.', ui.ButtonSet.OK);
        }
        ```
3.  **Укажите ID таблицы**: Замените `'ВАШ_ID_ТАБЛИЦЫ_ЗДЕСЬ'` на ID, который вы скопировали на Шаге 1.
4.  **Добавьте ваши Gemini API ключи**:
    -   Слева в меню нажмите на иконку шестеренки ("Настройки проекта").
    -   Прокрутите вниз до раздела "**Свойства скрипта**" (Script Properties).
    -   Нажмите "**Добавить свойство скрипта**" (Add script property).
    -   В поле "**Свойство**" (Property) введите `GEMINI_API_KEY`. В поле "**Значение**" (Value) вставьте ваш основной ключ.
    -   Снова нажмите "Добавить свойство скрипта". В поле "Свойство" введите `GEMINI_API_KEY1`. В поле "Значение" вставьте ваш запасной ключ.
    -   Нажмите "**Сохранить свойства скрипта**". У вас должны быть оба ключа, чтобы новая логика работала.
5.  **Сохраните проект**: Нажмите на иконку дискеты ("Сохранить проект").

---

### Шаг 3: Развертывание Веб-Приложения (Критически важный шаг!)

1.  В правом верхнем углу редактора скриптов нажмите синюю кнопку **"Развертывание" (Deploy)**.
2.  Выберите **"Новое развертывание" (New deployment)**.
3.  Нажмите на иконку шестеренки рядом с "Выберите тип" и выберите **"Веб-приложение" (Web app)**.
4.  В появившемся окне настройте следующие параметры:
    -   **Описание**: Можете оставить пустым или написать, например, `Persona Chat v3`.
    -   **Выполнять как**: Выберите **"Я" (Me)**.
    -   **Кто имеет доступ**: **ОЧЕНЬ ВАЖНО!** Выберите **"Все" (Anyone)**. Если вы выберете "Только я" или "Все в домене...", приложение не будет работать.
5.  Нажмите **"Развернуть" (Deploy)**.
6.  Google попросит вас предоставить разрешения. Нажмите **"Предоставить доступ" (Authorize access)**, выберите свой аккаунт Google. Вы можете увидеть предупреждение "Google не проверял это приложение" - это нормально. Нажмите "**Дополнительные настройки**" (Advanced) и затем "**Перейти к... (небезопасно)**" (Go to ... (unsafe)). Разрешите доступ.
7.  **Скопируйте URL веб-приложения**: После успешного развертывания появится окно с URL. **Это тот URL, который вам нужен**. Скопируйте его. Он должен заканчиваться на `/exec`.

---

### Шаг 4: Настройка Frontend-приложения

1.  Откройте файл `services/geminiService.ts` в редакторе.
2.  Найдите строку:
    ```typescript
    const GOOGLE_SCRIPT_URL: string = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    ```
3.  **Замените** `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` на URL веб-приложения, который вы скопировали на предыдущем шаге. Убедитесь, что URL находится внутри кавычек.
4.  Сохраните файл.

**Важно:** Если вы меняли код скрипта (как сейчас), вам нужно **повторно развернуть** его, чтобы изменения применились. Для этого зайдите в **Развертывание -> Управление развертываниями**, выберите ваше развертывание, нажмите на иконку карандаша ("Изменить"), выберите **"Новая версия"** в выпадающем списке и нажмите **"Развернуть"**.

---

### Устранение неполадок

-   **Ошибка "Ошибка конфигурации..."**: Вы не заменили URL в `geminiService.ts` или вставили неправильный URL (например, ссылку на редактирование скрипта вместо URL веб-приложения).
-   **Ошибка "Сетевая ошибка... (CORS)"**: Скорее всего, на Шаге 3 вы выбрали неправильную настройку "Кто имеет доступ". Убедитесь, что стоит **"Все" (Anyone)**.
-   **Ошибка "Ошибка на стороне сервера..."**: Проблема внутри вашего Google Apps Script.
    1.  Откройте ваш проект в [script.google.com](https://script.google.com).
    2.  В левом меню нажмите на иконку "Выполнения" (Executions).
    3.  Найдите последние неудачные (со статусом "Ошибка") выполнения `doPost` и посмотрите логи, чтобы понять причину ошибки (например, "API Key не найден" или ошибка в запросе к Gemini API).
-   **Ошибка `Cannot read properties of undefined (reading 'postData')` в логах выполнения**: Эта ошибка возникает, если вы пытаетесь запустить функцию `doPost` вручную, нажав кнопку "▶ Выполнить" в редакторе скриптов. **Это ожидаемое поведение.** Функция `doPost` предназначена для приема данных только от вашего веб-приложения, а не для ручного запуска. **Единственный способ проверить ее работу — через запущенное чат-приложение.**
