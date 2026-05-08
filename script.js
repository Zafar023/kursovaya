/* ============================ script.js ============================ */

/*
  ╔══════════════════════════════════════════════════════════╗
  ║  TO-DO LIST — Логика приложения                          ║
  ║  Файл: script.js                                         ║
  ║                                                          ║
  ║  КАК РАБОТАЕТ ХРАНЕНИЕ ДАННЫХ:                           ║
  ║  • Все пользователи хранятся в localStorage              ║
  ║    под ключом "todo-users" в виде объекта:               ║
  ║    { "username": { password, email, ... } }              ║
  ║  • Задачи каждого пользователя хранятся отдельно:        ║
  ║    ключ = "todo-tasks-username"                          ║
  ║  • Текущий пользователь = "todo-current-user"           ║
  ║  • JSONBin используется как резервное облако             ║
  ║    (если localStorage пустой после первого входа)        ║
  ╚══════════════════════════════════════════════════════════╝
*/


/* ══════════════════════════════════════════════════════════
   1. КОНФИГУРАЦИЯ JSONBIN (облачный бэкап)
   Получить на https://jsonbin.io → API Keys
   ══════════════════════════════════════════════════════════ */
var BIN_ID  = "69fb8cc7250b1311c312a27b";  // ID вашей корзины на JSONBin
var API_KEY = "$2a$10$xQUEmG8jt5Dg9SMwsrpTq.43AEC0aMrSXHaZm0hcPI2NBSybYzALG"; // X-Master-Key
var API_URL = "https://api.jsonbin.io/v3/b/" + BIN_ID;  // URL API
var HEADERS = {
    "Content-Type": "application/json",
    "X-Master-Key":  API_KEY
};


/* ══════════════════════════════════════════════════════════
   2. КЛЮЧИ LOCALSTORAGE
   ══════════════════════════════════════════════════════════ */
var STORAGE_USERS_KEY        = "todo-users";           // Объект всех пользователей
var STORAGE_CURRENT_USER_KEY = "todo-current-user";    // Логин текущего пользователя
var STORAGE_TASKS_PREFIX     = "todo-tasks-";          // Префикс + username = ключ задач


/* ══════════════════════════════════════════════════════════
   3. EMAILJS — для отправки письма о сбросе пароля
   Зарегистрируйтесь на https://emailjs.com и вставьте свои ID
   ══════════════════════════════════════════════════════════ */
var EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
var EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
var EMAILJS_USER_ID     = "YOUR_EMAILJS_USER_ID";


/* ══════════════════════════════════════════════════════════
   4. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
   ══════════════════════════════════════════════════════════ */
var currentUser = "";  // Логин авторизованного пользователя
var tasks = [];         // Массив задач текущего пользователя


/* ══════════════════════════════════════════════════════════
   5. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ СТРАНИЦЫ (DOM)
   getElementById / querySelector — находим элементы по id/классу
   ══════════════════════════════════════════════════════════ */

/* Форма добавления задачи */
var taskInput     = document.getElementById("taskInput");
var priorityInput = document.getElementById("priority");
var deadlineInput = document.getElementById("deadline");
var tagInput      = document.getElementById("tag");
var addTaskBtn    = document.getElementById("addTaskBtn");

/* Список и счётчик задач */
var taskList          = document.getElementById("taskList");
var taskCount         = document.getElementById("taskCount");
var clearCompletedBtn = document.getElementById("clearCompleted");
var clearArchiveBtn   = document.getElementById("clearArchiveBtn");

/* Заголовок страницы */
var pageTitle    = document.getElementById("pageTitle");
var pageSubtitle = document.getElementById("pageSubtitle");

/* Гамбургер и sidebar */
var hamburger   = document.getElementById("hamburger");
var sidebar     = document.getElementById("sidebar");
var overlay     = document.getElementById("overlay");
var sidebarClose = document.getElementById("sidebarClose");

/* Экраны авторизации */
var authScreen       = document.getElementById("authScreen");
var authLoginForm    = document.getElementById("authLoginForm");
var authRegisterForm = document.getElementById("authRegisterForm");
var authRecoverForm  = document.getElementById("authRecoverForm");
var authMessage      = document.getElementById("authMessage");

/* Поля форм авторизации */
var loginUsername    = document.getElementById("loginUsername");
var loginPassword    = document.getElementById("loginPassword");
var registerUsername = document.getElementById("registerUsername");
var registerEmail    = document.getElementById("registerEmail");
var registerPassword = document.getElementById("registerPassword");
var recoverUsername  = document.getElementById("recoverUsername");
var recoverEmail     = document.getElementById("recoverEmail");

/* Кнопки авторизации */
var forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
var backToLogin       = document.getElementById("backToLogin");
var switchToRegister  = document.getElementById("switchToRegister");
var switchToLogin     = document.getElementById("switchToLogin");
var logoutBtn         = document.getElementById("logoutBtn");

/* Профиль */
var profileInfo         = document.getElementById("profileInfo");
var totalTasksCount     = document.getElementById("totalTasksCount");
var completedTasksCount = document.getElementById("completedTasksCount");
var todayTasksCount     = document.getElementById("todayTasksCount");
var pendingTasksCount   = document.getElementById("pendingTasksCount");
var reportTable         = document.getElementById("reportTable");
var reportChart         = document.getElementById("reportChart");

/* Кнопки экспорта */
var exportWordBtn  = document.getElementById("exportWordBtn");
var exportExcelBtn = document.getElementById("exportExcelBtn");
var exportPptBtn   = document.getElementById("exportPptBtn");

/* Основной контейнер приложения */
var appContainer = document.getElementById("appContainer");


/* ══════════════════════════════════════════════════════════
   6. ДАННЫЕ РАЗДЕЛОВ МЕНЮ
   Заголовки и подзаголовки для каждого раздела.
   Используются в navigateTo() при переключении.
   ══════════════════════════════════════════════════════════ */
var sectionData = {
    incoming: { title: "Входящие",           subtitle: "Все активные задачи" },
    today:    { title: "Сегодня",             subtitle: "Задачи на сегодняшний день" },
    plans:    { title: "Планы",               subtitle: "Задачи на будущее" },
    calendar: { title: "Календарь",           subtitle: "Задачи по датам" },
    projects: { title: "Проекты",             subtitle: "Задачи по тегам и проектам" },
    archive:  { title: "Архив",               subtitle: "Выполненные задачи" },
    profile:  { title: "Профиль",             subtitle: "Отчёты и экспорт задач" }
};


/* ══════════════════════════════════════════════════════════
   7. ЦВЕТА ПРИОРИТЕТОВ
   Используются для бейджиков и диаграммы
   ══════════════════════════════════════════════════════════ */
var priorityColors = {
    "Высокий": "#ff6b6b",
    "Средний": "#ffa94d",
    "Низкий":  "#5b8dee"
};


/* ══════════════════════════════════════════════════════════
   8. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ══════════════════════════════════════════════════════════ */

/**
 * Создаёт HTML-бейджик с цветом
 * @param {string} text  — текст бейджика
 * @param {string} color — цвет (hex), по умолчанию синий
 * @returns {string}     — HTML строка
 */
function badge(text, color) {
    color = color || "#5b8dee";
    return "<span style='" +
        "background:" + color + "20;" +      // Полупрозрачный фон
        "color:" + color + ";" +
        "padding:2px 9px;" +
        "border-radius:20px;" +
        "font-size:0.74rem;" +
        "font-weight:700;" +
        "display:inline-block;" +
        "margin-right:4px;" +
        "'>" + text + "</span>";
}

/**
 * Форматирует дату из YYYY-MM-DD в ДД.ММ.ГГГГ
 * @param {string} str — дата в ISO формате
 * @returns {string}   — дата в русском формате
 */
function formatDate(str) {
    if (!str) return "";
    var p = str.split("-");
    return p[2] + "." + p[1] + "." + p[0];
}

/**
 * Создаёт HTML пустой карточки (когда задач нет)
 * @param {string} iconSrc — путь к PNG иконке
 * @param {string} title   — заголовок
 * @param {string} desc    — описание
 * @returns {string}       — HTML строка
 */
function emptyCard(iconSrc, title, desc) {
    return "<div class='empty-card'>" +
        "<img src='" + iconSrc + "' class='empty-icon' alt=''>" +
        "<h3>" + title + "</h3>" +
        "<p>" + desc + "</p>" +
        "</div>";
}

/**
 * Создаёт HTML строки задачи для групповых разделов
 * (Сегодня, Планы, Календарь, Проекты, Архив)
 * @param {Object} task — объект задачи
 * @returns {string}    — HTML строка
 */
function taskRow(task) {
    var color  = priorityColors[task.priority] || "#5b8dee";
    var strike = task.completed
        ? "text-decoration:line-through; color:#8492a6;"
        : "";
    return "<div class='group-task" + (task.completed ? " completed" : "") + "'>" +
        "<span class='task-text' style='" + strike + "'>" + task.text + "</span>" +
        "<span class='task-date'>" +
            badge("★ " + task.priority, color) +
            (task.deadline ? badge("📅 " + formatDate(task.deadline)) : "") +
        "</span>" +
        "</div>";
}

/**
 * Скачивает файл на компьютер пользователя
 * @param {string} filename — имя файла при скачивании
 * @param {string} content  — содержимое файла
 * @param {string} mimeType — MIME тип (application/msword и т.д.)
 */
function downloadFile(filename, content, mimeType) {
    // Добавляем BOM (Byte Order Mark) для корректного отображения кириллицы
    var blob = new Blob(["\ufeff", content], { type: mimeType + ";charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Освобождаем память
    URL.revokeObjectURL(link.href);
}


/* ══════════════════════════════════════════════════════════
   9. ГАМБУРГЕР МЕНЮ (мобильные устройства)
   ══════════════════════════════════════════════════════════ */

/**
 * Открывает/закрывает боковое меню на мобильных.
 * Также активирует overlay (затемнение фона).
 */
function toggleSidebar() {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
}

/**
 * Закрывает боковое меню
 */
function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
}

// Клик по гамбургеру
hamburger.addEventListener("click", toggleSidebar);

// Клик по кнопке "X" внутри sidebar
if (sidebarClose) {
    sidebarClose.addEventListener("click", closeSidebar);
}

// Клик по overlay — закрывает меню
overlay.addEventListener("click", closeSidebar);

// Закрытие меню клавишей Escape
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeSidebar();
});


/* ══════════════════════════════════════════════════════════
   10. НАВИГАЦИЯ ПО РАЗДЕЛАМ
   ══════════════════════════════════════════════════════════ */

/**
 * Переключает видимый раздел приложения.
 * Скрывает все [data-page], показывает нужный.
 * Обновляет активный пункт меню и заголовок страницы.
 * @param {string} section — имя раздела (incoming, today, plans...)
 */
function navigateTo(section) {

    // Скрываем все разделы
    document.querySelectorAll("[data-page]").forEach(function(el) {
        el.style.display = "none";
    });

    // Показываем нужный раздел
    var page = document.querySelector("[data-page='" + section + "']");
    if (page) page.style.display = "block";

    // Снимаем active у всех пунктов меню
    document.querySelectorAll(".sidebar li").forEach(function(li) {
        li.classList.remove("active");
    });

    // Ставим active нужному пункту
    var menuItem = document.querySelector(".sidebar li[data-section='" + section + "']");
    if (menuItem) menuItem.classList.add("active");

    // Обновляем заголовок страницы
    if (sectionData[section]) {
        pageTitle.textContent    = sectionData[section].title;
        pageSubtitle.textContent = sectionData[section].subtitle;
    }

    // Закрываем мобильное меню
    closeSidebar();

    // Обновляем содержимое раздела
    if (section === "today")    renderToday();
    if (section === "plans")    renderPlans();
    if (section === "calendar") renderCalendar();
    if (section === "projects") renderProjects();
    if (section === "archive")  renderArchive();
    if (section === "profile")  renderProfile();
}

// Вешаем обработчики кликов на пункты меню
document.querySelectorAll(".sidebar li").forEach(function(li) {
    li.addEventListener("click", function() {
        var section = li.getAttribute("data-section");
        if (section) navigateTo(section);
    });
});


/* ══════════════════════════════════════════════════════════
   11. РАЗДЕЛ «ВХОДЯЩИЕ» — отрисовка активных задач
   ══════════════════════════════════════════════════════════ */

/**
 * Перерисовывает список активных (невыполненных) задач.
 * Вызывается при добавлении, удалении или выполнении задачи.
 */
function renderTasks() {
    taskList.innerHTML = "";

    // Фильтруем: только невыполненные
    var active = tasks.filter(function(t) { return !t.completed; });

    if (active.length === 0) {
        // Пустое состояние
        taskList.innerHTML = "<li style='padding:18px 20px; color:#8492a6; font-weight:700;" +
            "background:white; border-radius:16px; box-shadow:0 4px 20px rgba(91,141,238,0.10);" +
            "display:flex; align-items:center; gap:10px;'>" +
            "<img src=\"zadacha.png\" style='width:24px; opacity:0.4;'>" +
            "Задач пока нет. Добавьте первую!</li>";
        taskCount.textContent = "Всего задач: 0";
        return;
    }

    // Проходим по всем задачам, рисуем только невыполненные
    tasks.forEach(function(task, index) {
        if (task.completed) return;

        var li = document.createElement("li");
        li.className = "task-item";

        // Цвет по приоритету
        var color = priorityColors[task.priority] || "#5b8dee";

        // Бейджики метаданных
        var meta = badge("★ " + task.priority, color);
        if (task.deadline) meta += badge("📅 " + formatDate(task.deadline));
        if (task.tag)      meta += badge("🏷 " + task.tag);

        // Блок с текстом задачи
        var info = document.createElement("div");
        info.className = "task-info";
        info.innerHTML =
            "<strong>" + task.text + "</strong>" +
            "<div class='task-meta'>" + meta + "</div>";

        // Блок кнопок
        var actions = document.createElement("div");
        actions.className = "task-actions";

        /* ─── Кнопка «Готово» (galochka.png) ─── */
        var completeBtn = document.createElement("button");
        completeBtn.className = "complete-btn";
        completeBtn.title     = "Отметить выполненной";
        completeBtn.innerHTML = "<img src='galochka.png' alt='✓'> Готово";

        // Используем замыкание (IIFE), чтобы зафиксировать индекс i
        (function(i) {
            completeBtn.addEventListener("click", async function() {
                tasks[i].completed = true;   // Помечаем как выполненную
                await saveTasks();           // Сохраняем в localStorage
                renderTasks();               // Перерисовываем список
            });
        })(index);

        /* ─── Кнопка «Удалить» (krestiq.png) ─── */
        var deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.title     = "Удалить задачу";
        deleteBtn.innerHTML = "<img src='krestiq.png' alt='×'> Удалить";

        (function(i) {
            deleteBtn.addEventListener("click", async function() {
                tasks.splice(i, 1);  // Удаляем из массива по индексу
                await saveTasks();
                renderTasks();
            });
        })(index);

        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);
        li.appendChild(info);
        li.appendChild(actions);
        taskList.appendChild(li);
    });

    // Обновляем счётчик
    var cnt = tasks.filter(function(t) { return !t.completed; }).length;
    taskCount.textContent = "Всего задач: " + cnt;
}


/* ══════════════════════════════════════════════════════════
   12. РАЗДЕЛ «СЕГОДНЯ»
   Показывает задачи с дедлайном = сегодня
   ══════════════════════════════════════════════════════════ */
function renderToday() {
    var container = document.getElementById("todayList");
    container.innerHTML = "";

    // Сегодняшняя дата в формате YYYY-MM-DD
    var today = new Date().toISOString().split("T")[0];

    var list = tasks.filter(function(t) {
        return t.deadline === today && !t.completed;
    });

    if (list.length === 0) {
        container.innerHTML = emptyCard(
            "kalendar.png",
            "На сегодня задач нет",
            "Добавьте задачу с дедлайном на сегодня во «Входящих»"
        );
        return;
    }

    var card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML =
        "<div class='group-title'>" +
        "<img src='kalendar.png' class='group-icon' alt=''>Сегодня — " +
        formatDate(today) + " (" + list.length + " задач)</div>";

    list.forEach(function(t) { card.innerHTML += taskRow(t); });
    container.appendChild(card);
}


/* ══════════════════════════════════════════════════════════
   13. РАЗДЕЛ «ПЛАНЫ»
   Задачи с будущей датой, сгруппированные по дням
   ══════════════════════════════════════════════════════════ */
function renderPlans() {
    var container = document.getElementById("plansList");
    container.innerHTML = "";

    var today = new Date().toISOString().split("T")[0];

    var list = tasks.filter(function(t) {
        // Только задачи с датой строго больше сегодня и невыполненные
        return t.deadline && t.deadline > today && !t.completed;
    });

    if (list.length === 0) {
        container.innerHTML = emptyCard(
            "Pisat.png",
            "Планов пока нет",
            "Добавьте задачу с будущей датой во «Входящих»"
        );
        return;
    }

    // Сортируем по дате (ближайшие — первые)
    list.sort(function(a, b) { return a.deadline.localeCompare(b.deadline); });

    // Группируем по дате
    var groups = {};
    list.forEach(function(t) {
        if (!groups[t.deadline]) groups[t.deadline] = [];
        groups[t.deadline].push(t);
    });

    Object.keys(groups).forEach(function(date) {
        var card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML =
            "<div class='group-title'>" +
            "<img src='Pisat.png' class='group-icon' alt=''>📅 " +
            formatDate(date) + " — " + groups[date].length + " задач</div>";
        groups[date].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* ══════════════════════════════════════════════════════════
   14. РАЗДЕЛ «КАЛЕНДАРЬ»
   Все задачи с датами, сгруппированные по дням
   ══════════════════════════════════════════════════════════ */
function renderCalendar() {
    var container = document.getElementById("calendarList");
    container.innerHTML = "";

    var list = tasks.filter(function(t) { return t.deadline; });

    if (list.length === 0) {
        container.innerHTML = emptyCard(
            "kalendar.png",
            "Нет задач с датами",
            "Добавьте задачи с дедлайнами во «Входящих»"
        );
        return;
    }

    list.sort(function(a, b) { return a.deadline.localeCompare(b.deadline); });

    var groups = {};
    list.forEach(function(t) {
        if (!groups[t.deadline]) groups[t.deadline] = [];
        groups[t.deadline].push(t);
    });

    Object.keys(groups).forEach(function(date) {
        var card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML =
            "<div class='group-title'>" +
            "<img src='kalendar.png' class='group-icon' alt=''>🗓 " +
            formatDate(date) + " — " + groups[date].length + " задач</div>";
        groups[date].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* ══════════════════════════════════════════════════════════
   15. РАЗДЕЛ «ПРОЕКТЫ»
   Задачи с тегом, сгруппированные по тегу
   ══════════════════════════════════════════════════════════ */
function renderProjects() {
    var container = document.getElementById("projectsList");
    container.innerHTML = "";

    var list = tasks.filter(function(t) { return t.tag && !t.completed; });

    if (list.length === 0) {
        container.innerHTML = emptyCard(
            "proeckt.png",
            "Проектов пока нет",
            "Добавьте задачу с тегом (Учёба, Работа, Личное) во «Входящих»"
        );
        return;
    }

    var groups = {};
    list.forEach(function(t) {
        if (!groups[t.tag]) groups[t.tag] = [];
        groups[t.tag].push(t);
    });

    Object.keys(groups).forEach(function(tag) {
        var card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML =
            "<div class='group-title'>" +
            "<img src='proeckt.png' class='group-icon' alt=''>🏷 " +
            tag + " — " + groups[tag].length + " задач</div>";
        groups[tag].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* ══════════════════════════════════════════════════════════
   16. РАЗДЕЛ «АРХИВ»
   Все выполненные задачи
   ══════════════════════════════════════════════════════════ */
function renderArchive() {
    var container = document.getElementById("archiveList");
    container.innerHTML = "";

    var done = tasks.filter(function(t) { return t.completed; });

    if (done.length === 0) {
        container.innerHTML = emptyCard(
            "arhiv.png",
            "Архив пуст",
            "Выполните задачу нажав «Готово» — она появится здесь"
        );
        return;
    }

    var card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML =
        "<div class='group-title'>" +
        "<img src='arhiv.png' class='group-icon' alt=''>✅ Выполнено: " +
        done.length + " задач</div>";
    done.forEach(function(t) { card.innerHTML += taskRow(t); });
    container.appendChild(card);
}


/* ══════════════════════════════════════════════════════════
   17. РАЗДЕЛ «ПРОФИЛЬ»
   Статистика + таблица + диаграмма
   ══════════════════════════════════════════════════════════ */

/**
 * Отрисовывает профиль: статистику, таблицу и диаграмму.
 * Вызывается при переходе в раздел «Профиль».
 */
function renderProfile() {
    // Получаем данные текущего пользователя
    var users = getUsers();
    var user  = users[currentUser] || {};

    // Показываем имя и email
    profileInfo.textContent =
        "Пользователь: " + currentUser + " | " +
        "Email: " + (user.email || "не указан");

    // Считаем статистику
    var total     = tasks.length;
    var completed = tasks.filter(function(t) { return t.completed; }).length;
    var todayDate = new Date().toISOString().split("T")[0];
    var todayCount= tasks.filter(function(t) {
        return t.deadline === todayDate && !t.completed;
    }).length;
    var pending   = tasks.filter(function(t) { return !t.completed; }).length;

    // Обновляем числа на карточках
    totalTasksCount.textContent     = total;
    completedTasksCount.textContent = completed;
    todayTasksCount.textContent     = todayCount;
    pendingTasksCount.textContent   = pending;

    renderReportTable();
    renderReportChart();
}

/**
 * Рисует таблицу задач в разделе «Профиль»
 */
function renderReportTable() {
    if (!reportTable) return;

    var html =
        "<table class='report-table'>" +
        "<thead><tr>" +
        "<th>Задача</th>" +
        "<th>Приоритет</th>" +
        "<th>Дата</th>" +
        "<th>Тег</th>" +
        "<th>Статус</th>" +
        "</tr></thead><tbody>";

    if (tasks.length === 0) {
        html += "<tr><td colspan='5' style='text-align:center; padding:20px;'>Задач нет</td></tr>";
    } else {
        tasks.forEach(function(t) {
            html += "<tr>" +
                "<td>" + t.text + "</td>" +
                "<td>" + t.priority + "</td>" +
                "<td>" + (t.deadline ? formatDate(t.deadline) : "—") + "</td>" +
                "<td>" + (t.tag || "—") + "</td>" +
                "<td style='color:" + (t.completed ? "#51cf66" : "#5b8dee") + "; font-weight:700;'>" +
                    (t.completed ? "✅ Выполнено" : "🔵 Открыто") +
                "</td>" +
                "</tr>";
        });
    }

    html += "</tbody></table>";
    reportTable.innerHTML = html;
}

/**
 * Рисует столбчатую диаграмму приоритетов
 */
function renderReportChart() {
    if (!reportChart) return;

    // Считаем задачи по каждому приоритету
    var counts = { "Высокий": 0, "Средний": 0, "Низкий": 0 };
    tasks.forEach(function(t) {
        if (counts[t.priority] !== undefined) counts[t.priority]++;
    });

    var maxCount = Math.max(counts["Высокий"], counts["Средний"], counts["Низкий"], 1);
    reportChart.innerHTML = "";

    var colors = {
        "Высокий": "#ff6b6b",
        "Средний": "#ffa94d",
        "Низкий":  "#5b8dee"
    };

    Object.keys(counts).forEach(function(priority) {
        var bar = document.createElement("div");
        bar.className = "chart-bar";

        // Высота столбика пропорциональна количеству задач
        var height = Math.round((counts[priority] / maxCount) * 180) + 20;

        bar.innerHTML =
            "<div class='chart-value'>" + counts[priority] + "</div>" +
            "<span style='height:" + height + "px; background:" + colors[priority] + "'></span>" +
            "<div class='chart-label'>" + priority + "</div>";

        reportChart.appendChild(bar);
    });
}


/* ══════════════════════════════════════════════════════════
   18. ЭКСПОРТ ОТЧЁТОВ
   ══════════════════════════════════════════════════════════ */

/**
 * Главная функция экспорта — вызывает нужный формат
 * @param {string} format — "word" | "excel" | "ppt"
 */
function exportReport(format) {
    if (tasks.length === 0) {
        alert("Нет задач для экспорта!");
        return;
    }

    var title   = "Отчёт по задачам пользователя " + currentUser;
    var summary = "Всего задач: " + tasks.length + "\n" +
                  "Выполнено: " + tasks.filter(function(t) { return t.completed; }).length + "\n" +
                  "Открыто: "  + tasks.filter(function(t) { return !t.completed; }).length;

    if (format === "word") {
        exportToWord(title, summary);
    } else if (format === "excel") {
        exportToExcel(title);
    } else if (format === "ppt") {
        exportToPowerPoint(title);
    }
}

/**
 * Экспорт в Word (.doc)
 * Создаём HTML-файл с расширением .doc — Word открывает его корректно
 */
function exportToWord(title, summary) {
    var rows = tasks.map(function(t) {
        return "<tr>" +
            "<td style='padding:8px 12px'>" + t.text + "</td>" +
            "<td style='padding:8px 12px'>" + t.priority + "</td>" +
            "<td style='padding:8px 12px'>" + (t.deadline ? formatDate(t.deadline) : "—") + "</td>" +
            "<td style='padding:8px 12px'>" + (t.tag || "—") + "</td>" +
            "<td style='padding:8px 12px'>" + (t.completed ? "Выполнено" : "Открыто") + "</td>" +
            "</tr>";
    }).join("");

    var table =
        "<table border='1' style='border-collapse:collapse; width:100%; font-family:Arial;'>" +
        "<thead style='background:#eef2ff;'>" +
        "<tr><th style='padding:10px 12px'>Задача</th>" +
        "<th style='padding:10px 12px'>Приоритет</th>" +
        "<th style='padding:10px 12px'>Дата</th>" +
        "<th style='padding:10px 12px'>Тег</th>" +
        "<th style='padding:10px 12px'>Статус</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table>";

    var date = new Date().toLocaleDateString("ru-RU");
    var html =
        "<html><head><meta charset='utf-8'><title>" + title + "</title></head>" +
        "<body style='font-family:Arial; padding:30px;'>" +
        "<h1 style='color:#1e2a3a'>" + title + "</h1>" +
        "<p style='color:#8492a6'>Дата формирования: " + date + "</p>" +
        "<p style='margin:16px 0'>" + summary.replace(/\n/g, "<br>") + "</p>" +
        table +
        "</body></html>";

    downloadFile("task_report.doc", html, "application/msword");
}

/**
 * Экспорт в Excel (.xlsx) через библиотеку SheetJS (XLSX)
 * Библиотека подключена в index.html через CDN
 */
function exportToExcel(title) {
    // Проверяем, загружена ли библиотека
    if (typeof XLSX === "undefined") {
        alert("Ошибка: библиотека XLSX не загружена. Проверьте интернет-соединение.");
        return;
    }

    var date = new Date().toLocaleDateString("ru-RU");

    // Создаём двумерный массив (как таблица: строки и колонки)
    var data = [
        /* Заголовок отчёта */
        ["Отчёт по задачам"],
        [],   // Пустая строка
        ["Пользователь:", currentUser],
        ["Дата формирования:", date],
        ["Всего задач:", tasks.length],
        ["Выполнено:", tasks.filter(function(t) { return t.completed; }).length],
        ["Открыто:", tasks.filter(function(t) { return !t.completed; }).length],
        [],   // Пустая строка
        /* Заголовки столбцов таблицы */
        ["Задача", "Приоритет", "Дедлайн", "Тег", "Статус"]
    ];

    // Добавляем каждую задачу как строку
    tasks.forEach(function(t) {
        data.push([
            t.text,
            t.priority,
            t.deadline ? formatDate(t.deadline) : "",
            t.tag || "",
            t.completed ? "Выполнено" : "Открыто"
        ]);
    });

    // Создаём лист и книгу Excel
    var ws = XLSX.utils.aoa_to_sheet(data);  // aoa = Array Of Arrays
    var wb = XLSX.utils.book_new();           // Новая книга
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");  // Добавляем лист

    // Устанавливаем ширину колонок
    ws["!cols"] = [
        { wch: 35 },  // Задача
        { wch: 12 },  // Приоритет
        { wch: 14 },  // Дата
        { wch: 15 },  // Тег
        { wch: 12 }   // Статус
    ];

    // Скачиваем файл
    XLSX.writeFile(wb, "task_report.xlsx");
}

/**
 * Экспорт в PowerPoint (.pptx) через библиотеку PptxGenJS
 * Библиотека подключена в index.html через CDN
 */
function exportToPowerPoint(title) {
    // Проверяем, загружена ли библиотека
    if (typeof PptxGenJS === "undefined") {
        alert("Функция экспорта в PowerPoint временно недоступна. Используйте экспорт в Excel или Word.");
        return;
    }

    var pres = new PptxGenJS();  // Создаём презентацию

    // Устанавливаем размер слайда (стандарт 16:9)
    pres.layout = "LAYOUT_WIDE";

    var completed = tasks.filter(function(t) { return t.completed; }).length;
    var pending   = tasks.filter(function(t) { return !t.completed; }).length;
    var percent   = tasks.length > 0
        ? Math.round((completed / tasks.length) * 100) + "%"
        : "0%";

    /* ── Слайд 1: Титульный ── */
    var slide1 = pres.addSlide();
    slide1.background = { color: "1e2a3a" };

    slide1.addText(title, {
        x: 0.5, y: 2.2, w: 9, h: 1.2,
        fontSize: 36, bold: true, color: "ffffff", align: "center"
    });
    slide1.addText("Автоматически сгенерированный отчёт", {
        x: 0.5, y: 3.6, w: 9, h: 0.7,
        fontSize: 18, color: "8492a6", align: "center"
    });
    slide1.addText(new Date().toLocaleDateString("ru-RU"), {
        x: 0.5, y: 4.4, w: 9, h: 0.5,
        fontSize: 14, color: "5b8dee", align: "center"
    });

    /* ── Слайд 2: Статистика ── */
    var slide2 = pres.addSlide();
    slide2.background = { color: "eef2ff" };

    slide2.addText("📊 Статистика", {
        x: 0.5, y: 0.4, w: 9, h: 0.7,
        fontSize: 26, bold: true, color: "1e2a3a"
    });

    // Таблица статистики
    var statsData = [
        [
            { text: "Параметр",         options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } },
            { text: "Значение",         options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } }
        ],
        ["Всего задач",     tasks.length.toString()],
        ["Выполнено",       completed.toString()],
        ["Открыто",         pending.toString()],
        ["% выполнения",    percent]
    ];

    slide2.addTable(statsData, {
        x: 1.5, y: 1.4, w: 7, h: 2.5,
        border: { pt: 1, color: "dde5f2" },
        fontSize: 16,
        align: "center"
    });

    /* ── Слайд 3: Список задач ── */
    var slide3 = pres.addSlide();
    slide3.background = { color: "ffffff" };

    slide3.addText("📋 Список задач", {
        x: 0.5, y: 0.4, w: 9, h: 0.7,
        fontSize: 26, bold: true, color: "1e2a3a"
    });

    // Заголовки таблицы задач
    var tableData = [[
        { text: "№",         options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } },
        { text: "Задача",    options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } },
        { text: "Приоритет", options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } },
        { text: "Статус",    options: { bold: true, color: "ffffff", fill: { color: "5b8dee" } } }
    ]];

    // Берём первые 12 задач (слайд ограничен по высоте)
    tasks.slice(0, 12).forEach(function(t, i) {
        tableData.push([
            (i + 1).toString(),
            t.text.length > 30 ? t.text.substring(0, 28) + "…" : t.text,
            t.priority,
            t.completed ? "✅ Выполнено" : "🔵 Открыто"
        ]);
    });

    slide3.addTable(tableData, {
        x: 0.5, y: 1.3, w: 9, h: 4.5,
        border: { pt: 1, color: "dde5f2" },
        fontSize: 13,
        autoPage: true   // Автоматически переносит на новый слайд если не влезает
    });

    // Сохраняем файл
    pres.writeFile({ fileName: "task_report.pptx" });
}

/**
 * Инициализация кнопок экспорта в профиле
 */
function initProfileButtons() {
    if (exportWordBtn)  exportWordBtn.addEventListener("click",  function() { exportReport("word"); });
    if (exportExcelBtn) exportExcelBtn.addEventListener("click", function() { exportReport("excel"); });
    if (exportPptBtn)   exportPptBtn.addEventListener("click",   function() { exportReport("ppt"); });
}


/* ══════════════════════════════════════════════════════════
   19. СИСТЕМА АВТОРИЗАЦИИ
   Данные хранятся в localStorage в виде JSON-объекта:
   {
     "username1": { password, email, resetCode, resetExpires, tempPassword },
     "username2": { ... }
   }
   ══════════════════════════════════════════════════════════ */

/**
 * Возвращает объект всех пользователей из localStorage.
 * Если нет — возвращает пустой объект {}.
 */
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
    } catch (e) {
        return {};
    }
}

/**
 * Сохраняет объект пользователей в localStorage
 * @param {Object} users — объект всех пользователей
 */
function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

/**
 * Читает логин текущего пользователя из localStorage
 * @returns {string} — логин или пустая строка
 */
function getCurrentUser() {
    return localStorage.getItem(STORAGE_CURRENT_USER_KEY) || "";
}

/**
 * Устанавливает текущего пользователя в localStorage и в переменную
 * @param {string} username — логин
 */
function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, username);
}

/**
 * Очищает текущего пользователя (выход из аккаунта)
 */
function clearCurrentUser() {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    currentUser = "";
}

/**
 * Показывает экран авторизации, скрывает приложение
 * @param {string} mode — "login" | "register" | "recover"
 */
function showAuth(mode) {
    authScreen.style.display   = "flex";
    appContainer.style.display = "none";
    authMessage.innerHTML      = "";

    // Показываем нужную форму, скрываем остальные
    authLoginForm.style.display   = (mode === "login")    ? "grid" : "none";
    authRegisterForm.style.display= (mode === "register") ? "grid" : "none";
    authRecoverForm.style.display = (mode === "recover")  ? "grid" : "none";

    // Подсвечиваем активную вкладку
    switchToLogin.classList.toggle("active",    mode === "login");
    switchToRegister.classList.toggle("active", mode === "register");
}

/**
 * Показывает приложение, скрывает экран авторизации
 */
function showApp() {
    authScreen.style.display   = "none";
    appContainer.style.display = "flex";
    loadTasks();  // Загружаем задачи пользователя
}

/**
 * Выводит сообщение об ошибке на экране авторизации
 * @param {string} text — текст ошибки (может содержать HTML)
 */
function authError(text) {
    authMessage.innerHTML = text;
}

/**
 * Генерирует случайную строку (для кода восстановления пароля)
 * @param {number} length — длина строки
 * @returns {string}
 */
function generateRandomString(length) {
    var chars  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Отправляет письмо для сброса пароля.
 * Если EmailJS настроен — отправляет автоматически,
 * иначе открывает ссылку mailto: для ручной отправки.
 */
function sendResetEmail(username, email, code, newPassword) {
    var subject = "Сброс пароля — Планировщик задач";
    var body =
        "Здравствуйте, " + username + "!\n\n" +
        "Вы запросили восстановление пароля.\n" +
        "Код подтверждения: " + code + "\n" +
        "Новый пароль: " + newPassword + "\n\n" +
        "Он действителен в течение 2 минут.\n" +
        "Если вы не запрашивали — проигнорируйте это письмо.";

    if (window.emailjs && EMAILJS_SERVICE_ID !== "YOUR_EMAILJS_SERVICE_ID") {
        // Отправка через EmailJS (если настроен)
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email:       email,
            to_name:        username,
            message_subject: subject,
            message_body:   body
        }, EMAILJS_USER_ID).then(function() {
            authError("✅ Письмо отправлено. Проверьте почту.");
        }, function(error) {
            console.error("EmailJS error:", error);
            authError("❌ Не удалось отправить автоматически. Попробуйте ниже:");
            showMailtoLink(email, subject, body);
        });
    } else {
        // Фолбэк: показываем ссылку mailto:
        authError("Автоматическая отправка не настроена. Нажмите ниже:");
        showMailtoLink(email, subject, body);
    }
}

/**
 * Показывает ссылку mailto: для ручной отправки
 */
function showMailtoLink(email, subject, body) {
    var mailto =
        "mailto:" + encodeURIComponent(email) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    authMessage.innerHTML +=
        "<br><a href='" + mailto + "' target='_blank' style='color:#5b8dee'>📧 Отправить письмо вручную</a>";
}

/**
 * Обработчик формы «Восстановить пароль».
 * Генерирует новый пароль и сохраняет его в данных пользователя.
 */
function requestPasswordReset() {
    var username = recoverUsername.value.trim();
    var email    = recoverEmail.value.trim();

    if (!username || !email) {
        authError("Введите логин и email.");
        return;
    }

    var users = getUsers();

    // Проверяем, существует ли пользователь с таким логином и email
    if (!users[username] || users[username].email !== email) {
        authError("Пользователь с таким логином и email не найден.");
        return;
    }

    var code        = generateRandomString(6).toUpperCase();
    var newPassword = generateRandomString(10);
    var expires     = Date.now() + 2 * 60 * 1000;  // Истекает через 2 минуты

    // Сохраняем временный пароль и код
    users[username].resetCode    = code;
    users[username].resetExpires = expires;
    users[username].password     = newPassword;  // Сразу меняем пароль
    saveUsers(users);

    sendResetEmail(username, email, code, newPassword);

    // Через 2 минуты сбрасываем код (сам пароль уже сменился)
    setTimeout(function() {
        var stored = getUsers();
        if (stored[username] && stored[username].resetCode === code) {
            stored[username].resetCode    = "";
            stored[username].resetExpires = 0;
            saveUsers(stored);
        }
    }, 2 * 60 * 1000);
}

/**
 * Регистрация нового пользователя.
 * Проверяет уникальность логина и сохраняет в localStorage.
 */
function registerUser() {
    var username = registerUsername.value.trim();
    var email    = registerEmail.value.trim();
    var password = registerPassword.value.trim();

    if (!username || !email || !password) {
        authError("Заполните все поля: логин, email и пароль.");
        return;
    }

    // Валидация email
    if (!email.includes("@") || !email.includes(".")) {
        authError("Введите корректный email адрес.");
        return;
    }

    // Минимальная длина пароля
    if (password.length < 4) {
        authError("Пароль должен быть не менее 4 символов.");
        return;
    }

    var users = getUsers();

    if (users[username]) {
        authError("Пользователь с таким логином уже существует.");
        return;
    }

    // Сохраняем нового пользователя
    users[username] = {
        password:     password,
        email:        email,
        resetCode:    "",
        resetExpires: 0,
        tempPassword: ""
    };
    saveUsers(users);

    // Входим сразу после регистрации
    setCurrentUser(username);
    authLoginForm.reset();
    authRegisterForm.reset();
    showApp();
}

/**
 * Вход в существующий аккаунт.
 * Проверяет логин и пароль в localStorage.
 */
function loginUser() {
    var username = loginUsername.value.trim();
    var password = loginPassword.value.trim();

    if (!username || !password) {
        authError("Введите логин и пароль.");
        return;
    }

    var users = getUsers();

    // Проверяем существование пользователя и правильность пароля
    if (!users[username] || users[username].password !== password) {
        authError("Неверный логин или пароль.");
        return;
    }

    // Успешный вход
    setCurrentUser(username);
    authLoginForm.reset();
    showApp();
}

/**
 * Инициализация авторизации при загрузке страницы.
 * Если пользователь уже входил — сразу открываем приложение.
 */
function initAuth() {
    currentUser = getCurrentUser();
    if (currentUser) {
        showApp();   // Уже авторизован
    } else {
        showAuth("login");  // Показываем форму входа
    }
}


/* ══════════════════════════════════════════════════════════
   20. ХРАНЕНИЕ ЗАДАЧ
   Каждый пользователь имеет свой ключ в localStorage:
   "todo-tasks-username" → JSON массив задач
   ══════════════════════════════════════════════════════════ */

/**
 * Загружает задачи текущего пользователя.
 * Сначала проверяет localStorage, потом JSONBin (резерв).
 */
async function loadTasks() {
    if (!currentUser) return;

    // Пробуем localStorage (быстро, не требует сети)
    var stored = localStorage.getItem(STORAGE_TASKS_PREFIX + currentUser);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            tasks = [];
        }
        renderTasks();
        return;
    }

    // Задач нет локально — пробуем JSONBin (только при первом входе)
    taskList.innerHTML =
        "<li style='padding:16px 18px; color:#8492a6; font-weight:700;" +
        "display:flex; align-items:center; gap:8px;'>" +
        "<img src='logo.png' style='width:20px; opacity:0.5; animation:spin 1s linear infinite;'>" +
        "Загрузка задач...</li>";

    try {
        var res  = await fetch(API_URL, { headers: HEADERS });
        var data = await res.json();
        // Берём только задачи текущего пользователя (по полю user)
        var allTasks = data.record || [];
        tasks = allTasks.filter(function(t) {
            return !t.init && t.user === currentUser;
        });
    } catch (e) {
        // Нет сети или JSONBin недоступен — начинаем с пустого списка
        tasks = [];
        console.warn("Не удалось загрузить из JSONBin:", e.message);
    }

    renderTasks();
}

/**
 * Сохраняет задачи текущего пользователя в localStorage.
 * async для совместимости с await в кнопках (ожидание сохранения).
 */
async function saveTasks() {
    if (!currentUser) return;
    localStorage.setItem(
        STORAGE_TASKS_PREFIX + currentUser,
        JSON.stringify(tasks)
    );
}


/* ══════════════════════════════════════════════════════════
   21. ДОБАВЛЕНИЕ НОВОЙ ЗАДАЧИ
   ══════════════════════════════════════════════════════════ */

/**
 * Читает значения из формы, создаёт объект задачи,
 * добавляет в массив tasks и сохраняет.
 */
async function addTask() {
    var text = taskInput.value.trim();
    if (!text) {
        alert("Введите текст задачи!");
        return;
    }

    // Создаём объект новой задачи
    var newTask = {
        text:      text,
        priority:  priorityInput.value,          // "Низкий" | "Средний" | "Высокий"
        deadline:  deadlineInput.value,           // YYYY-MM-DD или ""
        tag:       tagInput.value.trim(),         // Тег проекта
        completed: false,                         // Статус: не выполнена
        user:      currentUser,                   // Кому принадлежит задача
        createdAt: new Date().toISOString()       // Дата создания
    };

    tasks.push(newTask);   // Добавляем в массив
    await saveTasks();      // Сохраняем в localStorage

    // Очищаем поля формы
    taskInput.value     = "";
    deadlineInput.value = "";
    tagInput.value      = "";

    renderTasks();  // Перерисовываем список
}

// Клик по кнопке «Добавить»
addTaskBtn.addEventListener("click", addTask);

// Нажатие Enter в поле задачи
taskInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") addTask();
});


/* ══════════════════════════════════════════════════════════
   22. УДАЛЕНИЕ ВЫПОЛНЕННЫХ ЗАДАЧ (кнопка в «Входящих»)
   ══════════════════════════════════════════════════════════ */
clearCompletedBtn.addEventListener("click", async function() {
    var count = tasks.filter(function(t) { return t.completed; }).length;

    if (count === 0) {
        alert("Нет выполненных задач!");
        return;
    }
    if (!confirm("Удалить " + count + " выполненных задач?")) return;

    // Оставляем только невыполненные
    tasks = tasks.filter(function(t) { return !t.completed; });
    await saveTasks();
    renderTasks();
});


/* ══════════════════════════════════════════════════════════
   23. ОЧИСТКА АРХИВА
   ══════════════════════════════════════════════════════════ */
clearArchiveBtn.addEventListener("click", async function() {
    var done = tasks.filter(function(t) { return t.completed; });

    if (done.length === 0) {
        alert("Архив уже пуст!");
        return;
    }
    if (!confirm("Удалить все " + done.length + " задач из архива навсегда?")) return;

    tasks = tasks.filter(function(t) { return !t.completed; });
    await saveTasks();
    renderArchive();   // Обновляем вид архива
    alert("✅ Архив очищен!");
});


/* ══════════════════════════════════════════════════════════
   24. ОБРАБОТЧИКИ АВТОРИЗАЦИИ
   ══════════════════════════════════════════════════════════ */

// Переключение вкладок
switchToRegister.addEventListener("click", function() { showAuth("register"); });
switchToLogin.addEventListener("click",    function() { showAuth("login"); });

// Отправка форм
authLoginForm.addEventListener("submit", function(e) {
    e.preventDefault();    // Отменяем стандартную отправку формы
    loginUser();
});

authRegisterForm.addEventListener("submit", function(e) {
    e.preventDefault();
    registerUser();
});

authRecoverForm.addEventListener("submit", function(e) {
    e.preventDefault();
    requestPasswordReset();
});

// «Забыли пароль?» → показываем форму восстановления
forgotPasswordBtn.addEventListener("click", function() {
    authMessage.innerHTML = "";
    showAuth("recover");
});

// «Вернуться к входу»
backToLogin.addEventListener("click", function() {
    showAuth("login");
});

// Кнопка «Выйти» — очищает текущего пользователя и показывает авторизацию
logoutBtn.addEventListener("click", function() {
    if (confirm("Выйти из аккаунта?")) {
        clearCurrentUser();
        tasks = [];            // Очищаем задачи из памяти
        showAuth("login");
    }
});


/* ══════════════════════════════════════════════════════════
   25. ЗАПУСК ПРИЛОЖЕНИЯ
   Вызывается при загрузке страницы (после всего HTML и скриптов)
   ══════════════════════════════════════════════════════════ */
initProfileButtons();  // Вешаем обработчики на кнопки экспорта
initAuth();            // Проверяем, авторизован ли пользователь