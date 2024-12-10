// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();

/** Helper Functions */
function $(id) {
    return document.getElementById(id);
}

let allMyData = allData() || {}; // Load from local storage or initialize empty object
function allData() {
    return JSON.parse(localStorage.getItem("allData"));
}

function saveData() {
    localStorage.setItem("allData", JSON.stringify(allMyData));
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

function isValid(key) {
    const date = getDateKey(activeDate);
    const tag = $("session-dropdown");

    // Yardımcı Fonksiyonlar
    const isObjectEmpty = (obj) => !obj || Object.keys(obj).length === 0; // Boş obje kontrolü
    const isDataLoad = () => {
        const data = allData();
        return data && !isObjectEmpty(data); // Veri yüklü ve boş değil mi?
    };
    const isDateValid = () => {
        const data = allData();
        return isDataLoad() && data[date] && !isObjectEmpty(data[date]);
    };
    const isTagsValid = () => {
        const data = allData();
        return isDateValid() && data[date]?.tags && !isObjectEmpty(data[date]?.tags);
    };
    const isTagValid = () => {
        const data = allData();
        return isTagsValid() && data[date]?.tags?.[tag];
    };
    const isSessionValid = () => {
        const data = allData();
        return isTagValid() && data[date]?.tags?.[tag]?.sessions && !isObjectEmpty(data[date]?.tags?.[tag]?.sessions);
    };

    // Anahtar Kontrolü
    switch (key) {
        case "data":
            return isDataLoad() ? true : false;
        case "date":
            return isDateValid() ? true : false;
        case "tags":
            return isTagsValid() ? true : false;
        case "tag":
            return isTagValid() ? true : false;
        case "session":
            return isSessionValid() ? true : false;
        default:
            return false; // Geçersiz anahtarlar için
    }
}

function getEventRemovedNode(element) {
    const elem = $(`${element}`);
    elem.replaceWith(elem.cloneNode(true));
    const newElem = $(`${element}`);;
    return newElem;
}

function getDuration(session, isTime, isLast) {
    const now = isLast ? new Date() : new Date(session.end);
    const start = session.start;
    const duration = ((now - new Date(start)) / 1000).toFixed(2);
    const s = Math.floor(duration % 60);
    const m = Math.floor(duration / 60) % 60;
    const h = Math.floor(duration / 3600);

    return isTime ? duration : `${h}h ${m}m ${s}s`;
}

function getCurrentSession(isAll = false) {
    const date = getDateKey(activeDate);
    const tag = $("session-dropdown").value;
    const sessions = allData()[date].tags[tag]?.sessions;
    const lastIndex = Object.keys(sessions).length;
    const currSession = sessions[lastIndex];
    return isAll ? sessions : currSession;
}
function getSessionElapsedTime() {
    const currSession = getCurrentSession();
    $("duration").innerText = getDuration(currSession, false, true);
}
function getTotalElapsedTime(wantValue = true) {
    const sessions = getCurrentSession(true);
    const length = Object.keys(sessions).length;
    let total = 0;
    Object.keys(sessions).forEach((key) => {
        total += parseFloat(sessions[key].duration) || 0;
    });
    const lastSesDuration = parseFloat(getDuration(sessions[length], true, true));
    total += lastSesDuration;
    const s = Math.floor(total % 60);
    const m = Math.floor(total / 60) % 60;
    const h = Math.floor(total / 3600);
    return wantValue ? total : `${h}h ${m}m ${s}s`;
}

function deleteSession(sessionIndex) {
    const date = getDateKey(activeDate);
    const tag = $("session-dropdown").value;
    const tags = allMyData[date].tags
    const tagData = tags[tag];
    if (!tag || !tagData) return;

    sessionIndex = parseInt(sessionIndex, 10); // Convert sessionIndex to decimal if it is not
    delete tagData.sessions[sessionIndex];

    // Re-sort sessions
    const sortedTagData = {};
    Object.keys(tagData.sessions).sort((a, b) => a - b).forEach((key, index) => {
        //if a-b is -(a is smaller, so); a is first, otherwise; b is first. If it is 0, no changes
        sortedTagData[index + 1] = tagData.sessions[key];
    });
    tagData.sessions = sortedTagData;
    saveData();
    loadSessionsSummary(tags);
    renderSessions();
}

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
    $("selected-date").textContent = getDateKey(activeDate);
    loadSessionsTypes();
    if (isValid("data")) loadSessionsSummary(allData()[getDateKey(activeDate)]?.tags);
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

function addSessionType() {
    const modal = $("session-model");
    const dropdown = $("session-dropdown");
    const date = getDateKey(activeDate);
    const tag = $("session-name").value;
    const checkDuration = $("check-duration").value;
    const minDuration = $("min-duration").value;
    const maxDuration = $("max-duration").value;
    if (!tag || !checkDuration || !minDuration || !maxDuration) {
        alert("Please fill all fields");
        return;
    }

    if (!allMyData[date]) {
        allMyData[date] = { tags: {} };
        allMyData[date].date = date;
    }
    allMyData[date].tags[tag] = {
        checkDuration,
        minDuration,
        maxDuration,
        sessions: {}
    };
    dropdown.appendChild(new Option(tag, tag));
    $("text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    modal.classList.add("hidden");
    saveData();
    loadSessionsTypes();
}

/** Load Sessions */
function loadSessionsTypes() {
    const sessionTable = $("session-log-table");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const date = getDateKey(activeDate);
    dropdown.innerHTML = '<option value="0" disabled selected hidden>Select a session</option>';
    const tags = allMyData[date]?.tags || {};

    // Correctly check for existence AND for a valid object with sessionTypes property
    if (allData() && allData()[date] && tags && typeof tags === 'object') {

        // Populate dropdown
        Object.keys(tags).forEach(tag => {
            const option = document.createElement("option");
            option.value = tag;
            option.textContent = tag;
            dropdown.appendChild(option);
            loadSessionsSummary(tags);
        });
        dropdown.classList.remove("hidden");
        txtCntnt.classList.add("hidden");
    } else {
        console.warn(`No sessions found for date: ${date}`);
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
    }
    sessionTable.classList.add('hidden');
}

function loadSessionsSummary(tags) {
    const sessSummaryBody = $("session-summary-body");
    sessSummaryBody.innerHTML = "";
    if (!tags) {
        console.warn("No tag in this date: " + getDateKey(activeDate));
        sessSummaryBody.classList.add("hidden");
        return;
    }
    Object.keys(tags).forEach(tag => {
        const sec = parseFloat(tags[tag].totalTime) || 0;
        const totalSessions = Object.keys(tags[tag].sessions).length;
        sessSummaryBody.innerHTML += `
        <tr>
        <td>${tag}</td>
        <td>${totalSessions}</td>
        <td>${Math.floor(sec / 3600)}h ${Math.floor(sec / 60 % 60)}m ${Math.floor(sec % 60)}s</td>
        </tr >
        `;
    });
    sessSummaryBody.classList.remove("hidden");
}

/** Render Sessions */
function renderSessions() {
    const sessionBody = $("session-log-body");
    const date = getDateKey(activeDate);
    const dateData = allMyData[date];
    const tags = dateData.tags;
    sessionBody.innerHTML = ''; // Clear previous sessions

    if (!allData() || !dateData || !tags) return;
    const tag = $("session-dropdown").value;

    if (tag) {
        if (tags[tag]) {
            const sessions = tags[tag].sessions;

            // Check for sessions property before accessing it
            if (sessions && Object.keys(sessions).length > 0) {
                Object.keys(sessions).forEach((key, index) => {
                    sessionBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${toMyTime(sessions[key].start)}</td>
                            <td>${sessions[key].end ? toMyTime(sessions[key].end) : ''}</td>
                            <td>${getDuration(sessions[key], false, false)}</td>
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
        const tagData = tags[tag];
        if (!tag || !tagData) return;
        const indx = Object.keys(tagData.sessions).length + 1;
        const now = new Date().toISOString();
        tagData.sessions[indx] = { start: now };

        $("indx").textContent = indx;
        $("start-session").classList.add('hidden');
        $("start-time").appendChild(document.createTextNode(toMyTime(now)));
        $("end-session").classList.remove('hidden');
        saveData();
    });

    $("end-session").addEventListener("click", function endSession() {
        const tagData = tags[tag];
        if (!tag || !tagData) return;
        const lastSession = tagData.sessions
        const indx = Object.keys(lastSession).length;
        lastSession[indx].end = new Date().toISOString();
        lastSession[indx].duration = getDuration(lastSession[indx], true, true);

        let total = 0;
        Object.keys(tagData.sessions).forEach((key) => {
            total += parseFloat(tagData.sessions[key].duration) || 0;
        });
        tagData.totalTime = total;

        $("start-session").classList.remove('hidden');
        $("end-time").appendChild(document.createTextNode(toMyTime(lastSession.end)));
        $("duration").textContent = getDuration(lastSession[indx], false, true);
        $("end-session").classList.add('hidden');
        saveData();
        renderSessions();
        loadSessionsSummary(tags);
    });
}

/** EVENT LISTENERS */

/**DomContent loaded kullanmamızın sebebi tüm html ve deferred scripts yüklendikten, ama stylesheetlerden önce documanı durdurur. Yani bizim  */
document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for right-click to show delete option
    $("session-log-body").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        const contextMenu = $("table-body-menu");
        const lastRowMenu = $("last-row-menu");
        if (!targetRow || targetRow.id !== "last-row" && lastRowMenu.classList.contains("hidden")) {
            // Create context menu
            contextMenu.classList.remove("hidden");
            lastRowMenu.classList.add("hidden");
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.left = `${event.pageX}px`;

            // Clear any previous click listeners from the delete button
            // Otherwise, it deletes multiple row (based on how many times clicked/triggered the listener)
            // So, reset button to remove all previous listeners
            // true says subtree and all attributes (sub elements) will be included to clonedNode except event listeners

            const newDeleteButton = getEventRemovedNode("delete-session");

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
            if ($("start-session").classList.contains("hidden") && contextMenu.classList.contains("hidden") && targetRow.id === "last-row") {
                lastRowMenu.classList.remove("hidden");
                lastRowMenu.style.top = `${event.pageY}px`;
                lastRowMenu.style.left = `${event.pageX}px`;
                const sessionTime = getEventRemovedNode("session-elapsed-time");
                const totalTime = getEventRemovedNode("total-elapsed-time");
                sessionTime.addEventListener("change", () => {
                    if (sessionTime.checked) {
                        getSessionElapsedTime();
                        totalTime.checked = false;
                    } else
                        $("duration").innerText = "--- --- ---";
                });
                totalTime.addEventListener("change", (e) => {
                    if (totalTime.checked) {
                        $("duration").innerText = getTotalElapsedTime(false);
                        sessionTime.checked = false;
                    } else
                        $("duration").innerText = "--- --- ---";
                })
                document.addEventListener("click", function removeContextMenu() {
                    if (event.target.id !== "last-row-menu") {
                        lastRowMenu.classList.add("hidden");
                        document.removeEventListener("click", removeContextMenu);
                    }
                });
            }
        }
    });
});

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
$("session-dropdown").addEventListener("change", renderSessions);
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