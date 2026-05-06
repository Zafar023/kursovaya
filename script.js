/* ============================ script.js ============================ */

/* =========================================================
   JSONBIN API — облачное хранилище задач
========================================================= */
var BIN_ID  = "69fb8cc7250b1311c312a27b";
var API_KEY = "$2a$10$xQUEmG8jt5Dg9SMwsrpTq.43AEC0aMrSXHaZm0hcPI2NBSybYzALG";
var API_URL = "https://api.jsonbin.io/v3/b/" + BIN_ID;
var HEADERS = {
    "Content-Type": "application/json",
    "X-Master-Key": API_KEY
};

/* =========================================================
   ЭЛЕМЕНТЫ СТРАНИЦЫ
========================================================= */
var taskInput         = document.getElementById("taskInput");
var priorityInput     = document.getElementById("priority");
var deadlineInput     = document.getElementById("deadline");
var tagInput          = document.getElementById("tag");
var addTaskBtn        = document.getElementById("addTaskBtn");
var taskList          = document.getElementById("taskList");
var taskCount         = document.getElementById("taskCount");
var clearCompletedBtn = document.getElementById("clearCompleted");
var clearArchiveBtn   = document.getElementById("clearArchiveBtn");
var pageTitle         = document.getElementById("pageTitle");
var pageSubtitle      = document.getElementById("pageSubtitle");
var hamburger         = document.getElementById("hamburger");
var sidebar           = document.getElementById("sidebar");
var overlay           = document.getElementById("overlay");

var authScreen        = document.getElementById("authScreen");
var authLoginForm     = document.getElementById("authLoginForm");
var authRegisterForm  = document.getElementById("authRegisterForm");
var authRecoverForm   = document.getElementById("authRecoverForm");
var loginUsername     = document.getElementById("loginUsername");
var loginPassword     = document.getElementById("loginPassword");
var registerUsername  = document.getElementById("registerUsername");
var registerEmail     = document.getElementById("registerEmail");
var registerPassword  = document.getElementById("registerPassword");
var recoverUsername   = document.getElementById("recoverUsername");
var recoverEmail      = document.getElementById("recoverEmail");
var forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
var backToLogin       = document.getElementById("backToLogin");
var authMessage       = document.getElementById("authMessage");
var switchToRegister  = document.getElementById("switchToRegister");
var switchToLogin     = document.getElementById("switchToLogin");
var logoutBtn         = document.getElementById("logoutBtn");
var exportWordBtn     = document.getElementById("exportWordBtn");
var exportExcelBtn    = document.getElementById("exportExcelBtn");
var exportPptBtn      = document.getElementById("exportPptBtn");
var profileInfo       = document.getElementById("profileInfo");
var totalTasksCount   = document.getElementById("totalTasksCount");
var completedTasksCount = document.getElementById("completedTasksCount");
var todayTasksCount   = document.getElementById("todayTasksCount");
var pendingTasksCount = document.getElementById("pendingTasksCount");
var reportTable       = document.getElementById("reportTable");
var reportChart       = document.getElementById("reportChart");
var appContainer      = document.querySelector(".app");

var STORAGE_USERS_KEY       = "todo-users";
var STORAGE_CURRENT_USER_KEY= "todo-current-user";
var STORAGE_TASKS_PREFIX    = "todo-tasks-";
var EMAILJS_SERVICE_ID      = "YOUR_EMAILJS_SERVICE_ID";
var EMAILJS_TEMPLATE_ID     = "YOUR_EMAILJS_TEMPLATE_ID";
var EMAILJS_USER_ID         = "YOUR_EMAILJS_USER_ID";
var currentUser             = "";

/* =========================================================
   МАССИВ ЗАДАЧ
========================================================= */
var tasks = [];

/* =========================================================
   ДАННЫЕ РАЗДЕЛОВ МЕНЮ
========================================================= */
var sectionData = {
    incoming: { title: "Планировщик задач", subtitle: "Добавляйте, выполняйте и удаляйте задачи" },
    today:    { title: "Сегодня",           subtitle: "Задачи на сегодняшний день" },
    plans:    { title: "Планы",             subtitle: "Задачи на будущее" },
    calendar: { title: "Календарь",         subtitle: "Задачи по датам" },
    projects: { title: "Проекты",           subtitle: "Задачи по тегам и проектам" },
    archive:  { title: "Архив",             subtitle: "Выполненные задачи" },
    profile:  { title: "Профиль",           subtitle: "Отчёты и экспорт задач" }
};

/* =========================================================
   ЦВЕТА ПРИОРИТЕТОВ
========================================================= */
var priorityColors = {
    "Высокий": "#ff6b6b",
    "Средний":  "#ffa94d",
    "Низкий":   "#5b8dee"
};

/* Создаёт HTML бейджика */
function badge(text, color) {
    color = color || "#5b8dee";
    return "<span style='background:" + color + "20; color:" + color + "; padding:2px 9px; border-radius:20px; font-size:0.74rem; font-weight:700; display:inline-block; margin-right:4px;'>" + text + "</span>";
}

/* Форматирует дату YYYY-MM-DD → ДД.ММ.ГГГГ */
function formatDate(str) {
    if (!str) return "";
    var p = str.split("-");
    return p[2] + "." + p[1] + "." + p[0];
}

/* Пустая карточка с PNG иконкой */
function emptyCard(iconSrc, title, desc) {
    return "<div class='empty-card'><img src='" + iconSrc + "' class='empty-icon' alt=''><h3>" + title + "</h3><p>" + desc + "</p></div>";
}

/* Строка задачи для групповых разделов */
function taskRow(task) {
    var color  = priorityColors[task.priority] || "#5b8dee";
    var strike = task.completed ? "text-decoration:line-through; color:#8492a6;" : "";
    return "<div class='group-task" + (task.completed ? " completed" : "") + "'>" +
        "<span class='task-text' style='" + strike + "'>" + task.text + "</span>" +
        "<span class='task-date'>" +
            badge("★ " + task.priority, color) +
            (task.deadline ? badge("📅 " + formatDate(task.deadline)) : "") +
        "</span>" +
        "</div>";
}

/* =========================================================
   ГАМБУРГЕР МЕНЮ
========================================================= */
hamburger.addEventListener("click", function() {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
});

overlay.addEventListener("click", function() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
});

/* =========================================================
   НАВИГАЦИЯ ПО РАЗДЕЛАМ
========================================================= */
function navigateTo(section) {

    /* Скрываем все разделы */
    document.querySelectorAll("[data-page]").forEach(function(el) {
        el.style.display = "none";
    });

    /* Показываем нужный */
    var page = document.querySelector("[data-page='" + section + "']");
    if (page) page.style.display = "block";

    /* Убираем active у всех пунктов меню */
    document.querySelectorAll(".sidebar li").forEach(function(li) {
        li.classList.remove("active");
    });

    /* Добавляем active нужному */
    var menuItem = document.querySelector(".sidebar li[data-section='" + section + "']");
    if (menuItem) menuItem.classList.add("active");

    /* Меняем заголовок */
    if (sectionData[section]) {
        pageTitle.textContent    = sectionData[section].title;
        pageSubtitle.textContent = sectionData[section].subtitle;
    }

    /* Закрываем меню на телефоне */
    sidebar.classList.remove("open");
    overlay.classList.remove("active");

    /* Обновляем содержимое раздела */
    if (section === "today")    renderToday();
    if (section === "plans")    renderPlans();
    if (section === "calendar") renderCalendar();
    if (section === "projects") renderProjects();
    if (section === "archive")  renderArchive();
    if (section === "profile")  renderProfile();
}

/* Вешаем клики на пункты меню */
document.querySelectorAll(".sidebar li").forEach(function(li) {
    li.addEventListener("click", function() {
        var section = li.getAttribute("data-section");
        if (section) navigateTo(section);
    });
});


/* =========================================================
   ВХОДЯЩИЕ — отрисовка активных задач
========================================================= */
function renderTasks() {
    taskList.innerHTML = "";

    /* Только невыполненные */
    var active = tasks.filter(function(t) { return !t.completed; });

    if (active.length === 0) {
        taskList.innerHTML = "<li style='padding:16px 18px; color:#8492a6; font-weight:700; background:white; border-radius:16px; box-shadow:0 4px 20px rgba(91,141,238,0.10); display:flex; align-items:center; gap:10px;'><img src=\"zadacha.png\" style='width:24px; opacity:0.4;'>Задач пока нет. Добавьте первую!</li>";
        taskCount.textContent = "Всего задач: 0";
        return;
    }

    tasks.forEach(function(task, index) {
        if (task.completed) return;

        var li = document.createElement("li");
        li.className = "task-item";

        var color = priorityColors[task.priority] || "#5b8dee";
        var meta  = badge("★ " + task.priority, color);
        if (task.deadline) meta += badge("📅 " + formatDate(task.deadline));
        if (task.tag)      meta += badge("🏷 " + task.tag);

        var info = document.createElement("div");
        info.className = "task-info";
        info.innerHTML = "<strong>" + task.text + "</strong>" +
                         "<div class='task-meta' style='margin-top:5px;'>" + meta + "</div>";

        var actions = document.createElement("div");
        actions.className = "task-actions";

        /* -----------------------------------------------
           КНОПКА ВЫПОЛНИТЬ — galochka.png
        ----------------------------------------------- */
        var completeBtn = document.createElement("button");
        completeBtn.className = "complete-btn";
        completeBtn.title     = "Отметить выполненной";
        completeBtn.innerHTML = "<img src='galochka.png' alt='✓'> Готово";

        (function(i) {
            completeBtn.addEventListener("click", async function() {
                /*
                    Задача переходит в архив:
                    completed = true
                    Она исчезнет из Входящих
                    и появится в Архиве
                */
                tasks[i].completed = true;
                await saveTasks();
                renderTasks();
            });
        })(index);

        /* -----------------------------------------------
           КНОПКА УДАЛИТЬ — krestiq.png
        ----------------------------------------------- */
        var deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.title     = "Удалить задачу";
        deleteBtn.innerHTML = "<img src='krestiq.png' alt='×'> Удалить";

        (function(i) {
            deleteBtn.addEventListener("click", async function() {
                /* Полностью удаляем задачу из массива */
                tasks.splice(i, 1);
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

    var activeCount = tasks.filter(function(t) { return !t.completed; }).length;
    taskCount.textContent = "Всего задач: " + activeCount;
}


/* =========================================================
   СЕГОДНЯ — задачи с дедлайном = сегодня
========================================================= */
function renderToday() {
    var container = document.getElementById("todayList");
    container.innerHTML = "";

    /* Сегодняшняя дата в формате YYYY-MM-DD */
    var today = new Date().toISOString().split("T")[0];

    var list = tasks.filter(function(t) {
        return t.deadline === today && !t.completed;
    });

    if (list.length === 0) {
        container.innerHTML = emptyCard("kalendar.png", "На сегодня задач нет",
            "Добавьте задачу с дедлайном на сегодня во «Входящих»");
        return;
    }

    var card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = "<div class='group-title'><img src='kalendar.png' class='group-icon' alt=''>Сегодня — " + formatDate(today) + " (" + list.length + " задач)</div>";
    list.forEach(function(t) { card.innerHTML += taskRow(t); });
    container.appendChild(card);
}


/* =========================================================
   ПЛАНЫ — задачи с будущей датой
========================================================= */
function renderPlans() {
    var container = document.getElementById("plansList");
    container.innerHTML = "";

    var today = new Date().toISOString().split("T")[0];
    var list  = tasks.filter(function(t) {
        return t.deadline && t.deadline > today && !t.completed;
    });

    if (list.length === 0) {
        container.innerHTML = emptyCard("Pisat.png", "Планов пока нет",
            "Добавьте задачу с будущей датой во «Входящих»");
        return;
    }

    list.sort(function(a, b) { return a.deadline.localeCompare(b.deadline); });

    /* Группируем по дате */
    var groups = {};
    list.forEach(function(t) {
        if (!groups[t.deadline]) groups[t.deadline] = [];
        groups[t.deadline].push(t);
    });

    Object.keys(groups).forEach(function(date) {
        var card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML = "<div class='group-title'><img src='Pisat.png' class='group-icon' alt=''>📅 " +
                         formatDate(date) + " — " + groups[date].length + " задач</div>";
        groups[date].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* =========================================================
   КАЛЕНДАРЬ — все задачи с датами по дням
========================================================= */
function renderCalendar() {
    var container = document.getElementById("calendarList");
    container.innerHTML = "";

    var list = tasks.filter(function(t) { return t.deadline; });

    if (list.length === 0) {
        container.innerHTML = emptyCard("kalendar.png", "Нет задач с датами",
            "Добавьте задачи с дедлайнами во «Входящих»");
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
        card.innerHTML = "<div class='group-title'><img src='kalendar.png' class='group-icon' alt=''>🗓 " +
                         formatDate(date) + " — " + groups[date].length + " задач</div>";
        groups[date].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* =========================================================
   ПРОЕКТЫ — задачи сгруппированные по тегу
========================================================= */
function renderProjects() {
    var container = document.getElementById("projectsList");
    container.innerHTML = "";

    var list = tasks.filter(function(t) { return t.tag && !t.completed; });

    if (list.length === 0) {
        container.innerHTML = emptyCard("proeckt.png", "Проектов пока нет",
            "Добавьте задачу с тегом (Учёба, Работа, Личное) во «Входящих»");
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
        card.innerHTML = "<div class='group-title'><img src='proeckt.png' class='group-icon' alt=''>🏷 " +
                         tag + " — " + groups[tag].length + " задач</div>";
        groups[tag].forEach(function(t) { card.innerHTML += taskRow(t); });
        container.appendChild(card);
    });
}


/* =========================================================
   АРХИВ — все выполненные задачи
========================================================= */
function renderArchive() {
    var container = document.getElementById("archiveList");
    container.innerHTML = "";

    var done = tasks.filter(function(t) { return t.completed; });

    if (done.length === 0) {
        container.innerHTML = emptyCard("arhiv.png", "Архив пуст",
            "Выполните задачу нажав «Готово» — она появится здесь");
        return;
    }

    var card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = "<div class='group-title'><img src='arhiv.png' class='group-icon' alt=''>✅ Выполнено: " +
                     done.length + " задач</div>";
    done.forEach(function(t) { card.innerHTML += taskRow(t); });
    container.appendChild(card);
}

function renderProfile() {
    var users = getUsers();
    var user = users[currentUser] || {};
    profileInfo.textContent = "Пользователь: " + currentUser + ". Email: " + (user.email || "не указан") + ".";

    var total = tasks.length;
    var completed = tasks.filter(function(t) { return t.completed; }).length;
    var todayDate = new Date().toISOString().split("T")[0];
    var todayCount = tasks.filter(function(t) { return t.deadline === todayDate && !t.completed; }).length;
    var pending = tasks.filter(function(t) { return !t.completed; }).length;

    totalTasksCount.textContent = total;
    completedTasksCount.textContent = completed;
    todayTasksCount.textContent = todayCount;
    pendingTasksCount.textContent = pending;

    renderReportTable();
    renderReportChart();
}

function renderReportTable() {
    if (!reportTable) return;

    var html = "<table class='report-table'>" +
        "<thead><tr><th>Задача</th><th>Приоритет</th><th>Дата</th><th>Тег</th><th>Статус</th></tr></thead>" +
        "<tbody>";

    if (tasks.length === 0) {
        html += "<tr><td colspan='5' style='text-align:center; padding:18px;'>Задач нет</td></tr>";
    } else {
        tasks.forEach(function(t) {
            html += "<tr>" +
                "<td>" + t.text + "</td>" +
                "<td>" + t.priority + "</td>" +
                "<td>" + (t.deadline ? formatDate(t.deadline) : "—") + "</td>" +
                "<td>" + (t.tag || "—") + "</td>" +
                "<td>" + (t.completed ? "Выполнено" : "Открыто") + "</td>" +
                "</tr>";
        });
    }

    html += "</tbody></table>";
    reportTable.innerHTML = html;
}

function renderReportChart() {
    if (!reportChart) return;
    var counts = {
        Высокий: 0,
        Средний: 0,
        Низкий: 0
    };

    tasks.forEach(function(t) {
        if (counts[t.priority] !== undefined) counts[t.priority]++;
    });

    var maxCount = Math.max(counts.Высокий, counts.Средний, counts.Низкий, 1);
    reportChart.innerHTML = "";

    Object.keys(counts).forEach(function(priority) {
        var bar = document.createElement("div");
        bar.className = "chart-bar";
        var height = Math.round((counts[priority] / maxCount) * 180) + 40;
        bar.innerHTML = "<span style='height:" + height + "px; background:" + (priority === 'Высокий' ? '#ff6b6b' : priority === 'Средний' ? '#ffa94d' : '#5b8dee') + "'></span>" +
                        "<div class='chart-value'>" + counts[priority] + "</div>" +
                        "<div class='chart-label'>" + priority + "</div>";
        reportChart.appendChild(bar);
    });
}

function downloadFile(filename, content, mimeType) {
    var blob = new Blob(["\ufeff", content], { type: mimeType });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportReport(format) {
    var title = "Отчёт по задачам пользователя " + currentUser;
    var summary = "Всего задач: " + tasks.length + "\n" +
                  "Выполнено: " + tasks.filter(function(t) { return t.completed; }).length + "\n" +
                  "Открыто: " + tasks.filter(function(t) { return !t.completed; }).length + "\n";

    var rows = tasks.map(function(t) {
        return "<tr>" +
            "<td>" + t.text + "</td>" +
            "<td>" + t.priority + "</td>" +
            "<td>" + (t.deadline ? formatDate(t.deadline) : "—") + "</td>" +
            "<td>" + (t.tag || "—") + "</td>" +
            "<td>" + (t.completed ? "Выполнено" : "Открыто") + "</td>" +
            "</tr>";
    }).join("");

    var table = "<table border='1' style='border-collapse:collapse; width:100%;'>" +
                "<thead><tr><th>Задача</th><th>Приоритет</th><th>Дата</th><th>Тег</th><th>Статус</th></tr></thead>" +
                "<tbody>" + rows + "</tbody></table>";

    var html = "<html><head><meta charset='utf-8'><title>" + title + "</title></head><body>" +
               "<h1>" + title + "</h1>" +
               "<p>" + summary.replace(/\n/g, "<br>") + "</p>" +
               table + "</body></html>";

    if (format === "word") {
        downloadFile("task_report.doc", html, "application/msword");
    } else if (format === "excel") {
        downloadFile("task_report.xls", html, "application/vnd.ms-excel");
    } else if (format === "ppt") {
        downloadFile("task_report.ppt", html, "application/vnd.ms-powerpoint");
    }
}

function initProfileButtons() {
    if (exportWordBtn) exportWordBtn.addEventListener("click", function() { exportReport("word"); });
    if (exportExcelBtn) exportExcelBtn.addEventListener("click", function() { exportReport("excel"); });
    if (exportPptBtn) exportPptBtn.addEventListener("click", function() { exportReport("ppt"); });
}


/* =========================================================
   АВТОРИЗАЦИЯ И ХРАНЕНИЕ ПОЛЬЗОВАТЕЛЕЙ
========================================================= */
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem(STORAGE_CURRENT_USER_KEY) || "";
}

function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, username);
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    currentUser = "";
}

function showAuth(mode) {
    authScreen.style.display = "flex";
    appContainer.style.display = "none";
    authMessage.innerHTML = "";
    authLoginForm.style.display = mode === "login" ? "grid" : "none";
    authRegisterForm.style.display = mode === "register" ? "grid" : "none";
    authRecoverForm.style.display = mode === "recover" ? "grid" : "none";
    switchToLogin.classList.toggle("active", mode === "login");
    switchToRegister.classList.toggle("active", mode === "register");
}

function showApp() {
    authScreen.style.display = "none";
    appContainer.style.display = "flex";
    loadTasks();
}

function authError(text) {
    authMessage.innerHTML = text;
}

function generateRandomString(length) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var result = "";
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function sendResetEmail(username, email, code, newPassword) {
    var subject = "Сброс пароля для планировщика задач";
    var body = "Здравствуйте, " + username + "!\n\n" +
               "Вы запросили восстановление пароля.\n" +
               "Код подтверждения: " + code + "\n" +
               "Новый пароль: " + newPassword + "\n\n" +
               "Он действителен в течение 2 минут.\n" +
               "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.\n";

    if (window.emailjs && EMAILJS_SERVICE_ID !== "YOUR_EMAILJS_SERVICE_ID") {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            to_name: username,
            message_subject: subject,
            message_body: body
        }, EMAILJS_USER_ID).then(function() {
            authError("Письмо с новым паролем отправлено. Проверьте почту.");
        }, function(error) {
            console.error(error);
            authError("Не удалось отправить почту автоматически. Проверьте email или настройте EmailJS.");
        });
    } else {
        var mailto = "mailto:" + encodeURIComponent(email) +
                     "?subject=" + encodeURIComponent(subject) +
                     "&body=" + encodeURIComponent(body);
        authError("Автоматическая отправка email не настроена. Нажмите на ссылку ниже и отправьте письмо вручную:<br><a href=\"" + mailto + "\" target=\"_blank\">Отправить письмо</a>");
    }
}

function requestPasswordReset() {
    var username = recoverUsername.value.trim();
    var email = recoverEmail.value.trim();
    if (!username || !email) { authError("Введите логин и email."); return; }

    var users = getUsers();
    if (!users[username] || users[username].email !== email) {
        authError("Пользователь с таким логином и email не найден.");
        return;
    }

    var code = generateRandomString(6).toUpperCase();
    var newPassword = generateRandomString(10);
    var expires = Date.now() + 2 * 60 * 1000;

    users[username].resetCode = code;
    users[username].resetExpires = expires;
    users[username].tempPassword = newPassword;
    saveUsers(users);

    sendResetEmail(username, email, code, newPassword);

    setTimeout(function() {
        var storedUsers = getUsers();
        if (storedUsers[username] && storedUsers[username].resetCode === code) {
            storedUsers[username].resetCode = "";
            storedUsers[username].resetExpires = 0;
            storedUsers[username].tempPassword = "";
            saveUsers(storedUsers);
        }
    }, 2 * 60 * 1000);
}

function registerUser() {
    var username = registerUsername.value.trim();
    var email = registerEmail.value.trim();
    var password = registerPassword.value.trim();
    if (!username || !email || !password) { authError("Введите логин, email и пароль."); return; }

    var users = getUsers();
    if (users[username]) { authError("Пользователь уже существует."); return; }

    users[username] = {
        password: password,
        email: email,
        resetCode: "",
        resetExpires: 0,
        tempPassword: ""
    };
    saveUsers(users);
    setCurrentUser(username);
    authLoginForm.reset();
    authRegisterForm.reset();
    showApp();
}

function loginUser() {
    var username = loginUsername.value.trim();
    var password = loginPassword.value.trim();
    if (!username || !password) { authError("Введите логин и пароль."); return; }

    var users = getUsers();
    if (!users[username] || users[username].password !== password) {
        authError("Неверный логин или пароль.");
        return;
    }

    setCurrentUser(username);
    authLoginForm.reset();
    authRegisterForm.reset();
    showApp();
}

function initAuth() {
    currentUser = getCurrentUser();
    if (currentUser) {
        showApp();
    } else {
        showAuth("login");
    }
}


/* =========================================================
   ХРАНЕНИЕ ЗАДАЧ ПО ПОЛЬЗОВАТЕЛЮ
========================================================= */
async function loadTasks() {
    if (!currentUser) return;

    var stored = localStorage.getItem(STORAGE_TASKS_PREFIX + currentUser);
    if (stored) {
        tasks = JSON.parse(stored);
        renderTasks();
        return;
    }

    taskList.innerHTML = "<li style='padding:16px 18px; color:#8492a6; font-weight:700; display:flex; align-items:center; gap:8px;'><img src=\"logo.png\" style='width:20px; opacity:0.5; animation: spin 1s linear infinite;'>Загрузка задач...</li>";
    try {
        var res  = await fetch(API_URL, { headers: HEADERS });
        var data = await res.json();
        tasks = (data.record || []).filter(function(t) { return !t.init && t.user === currentUser; });
    } catch(e) {
        tasks = [];
        console.log("Ошибка загрузки:", e);
    }
    renderTasks();
}

async function saveTasks() {
    if (!currentUser) return;
    localStorage.setItem(STORAGE_TASKS_PREFIX + currentUser, JSON.stringify(tasks));
}


/* =========================================================
   ДОБАВЛЕНИЕ ЗАДАЧИ
========================================================= */
async function addTask() {
    var text = taskInput.value.trim();
    if (!text) { alert("Введите задачу!"); return; }

    tasks.push({
        text:      text,
        priority:  priorityInput.value,
        deadline:  deadlineInput.value,
        tag:       tagInput.value.trim(),
        completed: false,
        user:      currentUser,
        createdAt: new Date().toISOString()
    });

    await saveTasks();

    taskInput.value     = "";
    deadlineInput.value = "";
    tagInput.value      = "";

    renderTasks();
}

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") addTask();
});


/* =========================================================
   УДАЛИТЬ ВЫПОЛНЕННЫЕ (Входящие)
   
   Удаляет из массива tasks все completed:true
   и сохраняет в localStorage
========================================================= */
clearCompletedBtn.addEventListener("click", async function() {
    var count = tasks.filter(function(t) { return t.completed; }).length;
    if (count === 0) { alert("Нет выполненных задач!"); return; }
    if (!confirm("Удалить " + count + " выполненных задач?")) return;

    tasks = tasks.filter(function(t) { return !t.completed; });
    await saveTasks();
    renderTasks();
});


/* =========================================================
   ОЧИСТИТЬ АРХИВ — krestiq.png кнопка в разделе Архив
   
   Полностью удаляет все выполненные задачи из localStorage
========================================================= */
clearArchiveBtn.addEventListener("click", async function() {
    var done = tasks.filter(function(t) { return t.completed; });
    if (done.length === 0) { alert("Архив уже пуст!"); return; }
    if (!confirm("Удалить все " + done.length + " задач из архива навсегда?")) return;

    /* Оставляем только невыполненные */
    tasks = tasks.filter(function(t) { return !t.completed; });
    await saveTasks();

    /* Обновляем вид архива */
    renderArchive();
    alert("Архив очищен!");
});


/* =========================================================
   ЗАПУСК — инициализация авторизации
========================================================= */

switchToRegister.addEventListener("click", function() { showAuth("register"); });
switchToLogin.addEventListener("click", function() { showAuth("login"); });

authLoginForm.addEventListener("submit", function(e) {
    e.preventDefault();
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

forgotPasswordBtn.addEventListener("click", function() {
    authMessage.innerHTML = "";
    authLoginForm.style.display = "none";
    authRegisterForm.style.display = "none";
    authRecoverForm.style.display = "grid";
});

backToLogin.addEventListener("click", function() {
    showAuth("login");
});

logoutBtn.addEventListener("click", function() {
    if (confirm("Выйти из аккаунта?")) {
        clearCurrentUser();
        showAuth("login");
    }
});

initProfileButtons();
initAuth();