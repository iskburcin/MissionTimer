// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();

/** Helper Functions */
function $(id) {
    return document.getElementById(id);
}

let sessionTypesByDate = loadSessionData() || {}; // Load from local storage or initialize empty object
function loadSessionData() {
    return JSON.parse(localStorage.getItem("sessionTypesByDate"));
}

function saveSessionData() {
    localStorage.setItem("sessionTypesByDate", JSON.stringify(sessionTypesByDate));
}

function formatDate(date) {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function getDateKey(date) {
    return date.toDateString();
}

function toMyTime(time) {
    return new Date(time).toLocaleTimeString(('en-US'));
}

/** Render Calendar */
function renderWeekdays() {
    const container = $("calendar-weekdays");
    container.innerHTML = weekdays
        .map(day => `<div class='weekday' style='width: calc(100% / 7); display: grid; place-items: center;'>${day}</div>`)
        .join('');
}

function renderCalendar(date) {
    const daysContainer = $("calendar-days");
    const monthYearLabel = $("month-year");

    daysContainer.innerHTML = "";
    monthYearLabel.textContent = formatDate(date);

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayIndex = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;

    for (let i = 0; i < firstDayIndex; i++) {
        daysContainer.appendChild(document.createElement("div"));
    }
    /** Add actual days */
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        dayDiv.className = "day";

        if (day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
            dayDiv.classList.add("current-day");
        }

        // Seçili günü vurgula
        if (day === date.getDate()) {
            dayDiv.classList.add("selected-day");
        }

        dayDiv.addEventListener("click", () => selectDate(day));
        daysContainer.appendChild(dayDiv);
    }
}

/** SESSION SİDE */

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
    $("selected-date").textContent = getDateKey(activeDate);
    loadSessionsTypes();
    loadSessionsSummary(loadSessionData()[getDateKey(activeDate)]?.sessionTypes);
}

function addSessionType() {
    const modal = $("session-model");
    const dropdown = $("session-dropdown");
    const sessionDateKey = getDateKey(activeDate);
    const sessionName = $("session-name").value;
    const checkDuration = $("check-duration").value;
    const minDuration = $("min-duration").value;
    const maxDuration = $("max-duration").value;
    if (!sessionName || !checkDuration || !minDuration || !maxDuration) {
        alert("Please fill all fields");
        return;
    }

    if (!sessionTypesByDate[sessionDateKey]) {
        sessionTypesByDate[sessionDateKey] = { sessionTypes: {} };
        sessionTypesByDate[sessionDateKey].sessionDateKey = sessionDateKey;
    }
    sessionTypesByDate[sessionDateKey].sessionTypes[sessionName] = {
        checkDuration,
        minDuration,
        maxDuration,
        sessions: {}
    };
    dropdown.appendChild(new Option(sessionName, sessionName));
    $("text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    modal.classList.add("hidden");
    saveSessionData();
    loadSessionsTypes();
}

/**
 * Render Sessions
*/
function loadSessionsTypes() {
    const sessionTable = $("session-log-table");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const sessionDateKey = getDateKey(activeDate);
    dropdown.innerHTML = '<option value="" disabled selected hidden>Select a session</option>';
    const sessionData = sessionTypesByDate[sessionDateKey]?.sessionTypes || {};

    // Correctly check for existence AND for a valid object with sessionTypes property
    if (loadSessionData() && loadSessionData()[sessionDateKey] && sessionData && typeof sessionData === 'object') {

        // Populate dropdown
        Object.keys(sessionData).forEach(sessionType => {
            const option = document.createElement("option");
            option.value = sessionType;
            option.textContent = sessionType;
            dropdown.appendChild(option);
            loadSessionsSummary(sessionData);
        });
        dropdown.classList.remove("hidden");
        txtCntnt.classList.add("hidden");
    } else {
        console.warn(`No sessions found for date: ${sessionDateKey}`);
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
    }
    sessionTable.classList.add('hidden');
}

function loadSessionsSummary(sessionData) {
    const sessSummaryBody = $("session-summary-body");
    sessSummaryBody.innerHTML = "";
    if (!sessionData) {
        console.warn("No session in this date: " + getDateKey(activeDate));
        sessSummaryBody.classList.add("hidden");
        return;
    }
    Object.keys(sessionData).forEach(session => {
        const sec = parseFloat(sessionData[session].totalTime) || 0;
        const totalSessions = Object.keys(sessionData[session].sessions).length;
        sessSummaryBody.innerHTML += `
        <tr>
        <td>${session}</td>
        <td>${totalSessions}</td>
        <td>${Math.floor(sec / 60 / 60)}h ${Math.floor(sec / 60 % 60)}m ${Math.floor(sec % 60)}s</td>
        </tr >
        `;
    });
    sessSummaryBody.classList.remove("hidden");
}

$("session-dropdown").addEventListener("change", renderSessions);
function renderSessions() {
    const sessionBody = $("session-log-body");
    const sessionDateKey = getDateKey(activeDate);
    const dateData = sessionTypesByDate[sessionDateKey];
    sessionBody.innerHTML = ''; // Clear previous sessions

    if (!loadSessionData() || !dateData || !dateData.sessionTypes) return;
    const selectedSession = $("session-dropdown").value;
    const sessions = dateData.sessionTypes;

    if (selectedSession) {
        if (sessions[selectedSession]) {
            const sessionData = sessions[selectedSession].sessions;

            // Check for sessions property before accessing it
            if (sessionData && Object.keys(sessionData).length > 0) {
                Object.keys(sessionData).forEach((key, index) => {
                    const session = sessionData
                    sessionBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${toMyTime(session[key].start)}</td>
                            <td>${session[key].end ? toMyTime(session[key].end) : ''}</td>
                            <td>${getDuration(session[key], false, false)}</td>
                        </tr>`;
                });
            }
            sessionBody.innerHTML += `
                <tr id="last-row">
                    <td id="indx"></td>
                    <td id="start-time"><button id="start-session">Start</button></td>
                    <td id="end-time"><button id="end-session" class="hidden">End</button></td>
                    <td id="duration">-- -- --  <button id="toggler" class="hidden"><i class="fa-sharp fa-solid fa-eye"></i></button></td>
                </tr>
                    `;
            $("session-log-table").classList.remove("hidden");
        } else {
            console.error("Error: Invalid session type or missing session data.");
        }
    } else {
        console.log("Waiting for user to select a session type.");
    }

    // Add event listeners for start and end buttons
    $("start-session").addEventListener("click", function addNewSession() {
        const sessionData = sessions[selectedSession];
        if (!selectedSession || !sessionData) return;
        const indx = Object.keys(sessionData.sessions).length + 1;
        const now = new Date().toISOString();
        sessionData.sessions[indx] = { start: now };

        $("indx").textContent = indx;
        $("start-session").classList.add('hidden');
        $("start-time").appendChild(document.createTextNode(toMyTime(now)));
        $("end-session").classList.remove('hidden');
        saveSessionData();
    });

    $("end-session").addEventListener("click", function endSession() {
        const sessionData = sessions[selectedSession];
        if (!selectedSession || !sessionData) return;
        const lastSession = sessionData.sessions
        const indx = Object.keys(lastSession).length;
        lastSession[indx].end = new Date().toISOString();
        lastSession[indx].duration = getDuration(lastSession[indx], true, true);

        let total = 0;
        Object.keys(sessionData.sessions).forEach((key) => {
            total += parseFloat(sessionData.sessions[key].duration) || 0;
        });
        sessionData.totalTime = total;

        $("start-session").classList.remove('hidden');
        $("end-time").appendChild(document.createTextNode(toMyTime(lastSession.end)));
        $("duration").textContent = getDuration(lastSession[indx], false, true);
        $("end-session").classList.add('hidden');
        saveSessionData();
        renderSessions();
        loadSessionsSummary(sessions);
    });
}
function getDuration(session, isTime, isLast) {
    const now = isLast ? new Date() : new Date(session.end);
    const start = session.start;
    const duration = ((now - new Date(start)) / 1000).toFixed(2);
    const s = Math.floor(duration % 60);
    const m = Math.floor(s / 60 % 60);
    const h = Math.floor(m / 60 / 60);

    return isTime ? duration : `${h}h ${m}m ${s}s`;
}

function deleteSession(sessionIndex) {
    const sessionDateKey = getDateKey(activeDate);
    const selectedSession = $("session-dropdown").value;
    const sessions = sessionTypesByDate[sessionDateKey].sessionTypes
    const sessionData = sessions[selectedSession];
    if (!selectedSession || !sessionData) return;

    sessionIndex = parseInt(sessionIndex, 10); // Convert sessionIndex to decimal if it is not
    delete sessionData.sessions[sessionIndex];

    // Re-sort sessions
    const sortedSessions = {};
    Object.keys(sessionData.sessions).sort((a, b) => a - b).forEach((key, index) => {
        //if a-b is -(a is smaller, so); a is first, otherwise; b is first. If it is 0, no changes
        sortedSessions[index + 1] = sessionData.sessions[key];
    });
    sessionData.sessions = sortedSessions;
    saveSessionData();
    loadSessionsSummary(sessions);
    renderSessions();
}

/**DomContent loaded kullanmamızın sebebi tüm html ve deferred scripts yüklendikten, ama stylesheetlerden önce documanı durdurur. Yani bizim  */
document.addEventListener("DOMContentLoaded", function () {
    const contextMenu = $("table-body-menu");
    // Add event listener for right-click to show delete option
    $("session-log-body").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        const lastRowMenu = $("last-row-menu");
        if (!targetRow || targetRow.id !== "last-row" && lastRowMenu.classList.contains("hidden")) {
            // Create context menu
            contextMenu.classList.remove("hidden");
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.left = `${event.pageX}px`;

            // Clear any previous click listeners from the delete button
            // Otherwise, it deletes multiple row (based on how many times clicked/triggered the listener)
            // So, reset button to remove all previous listeners
            // true says subtree and all attributes (sub elements) will be included to clonedNode except event listeners
            const deleteButton = $("delete-session");
            //yani cloneNode ile eventler dışında oluşturduğum yeni butonu aynı butonla yer değiştiriyorum
            deleteButton.replaceWith(deleteButton.cloneNode(true)); // Resets
            const newDeleteButton = $("delete-session");

            // Add event listener to new delete option
            newDeleteButton.addEventListener("click", function () {
                const sessionIndex = targetRow.querySelector("td").textContent.trim();
                deleteSession(sessionIndex);
                contextMenu.classList.add("hidden");
                targetRow.remove();
            });

            // Remove context menu on click outside
            document.addEventListener("click", function () {
                contextMenu.classList.add("hidden");
            });
        } else {
            if ($("start-session").classList.contains("hidden") && contextMenu.classList.contains("hidden")) {
                lastRowMenu.style.display = "block"
                lastRowMenu.style.top = `${event.pageY}px`;
                lastRowMenu.style.left = `${event.pageX}px`;

                document.addEventListener("click", function removeContextMenu() {
                    lastRowMenu.style.display = "none";
                    document.removeEventListener("click", removeContextMenu);
                });
            }
        }
    });
});
/** EVENT LISTENERS */
$("add-session-type-btn").addEventListener("click", () => {
    $("session-name").value = '';
    $("check-duration").value = '';
    $("min-duration").value = '';
    $("max-duration").value = '';
    $("session-model").classList.remove("hidden");
});
$("close-model").addEventListener("click", () => $("session-model").classList.add("hidden"));
$("submit-session").addEventListener("click", () => {
    $("session-dropdown").value = $("session-name").value;
    addSessionType();
});

$("next-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
});

$("prev-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

$("new-session-form").addEventListener("submit", function (e) {
    e.preventDefault();
});

/** Initial Rendering */
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());