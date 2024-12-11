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

function isValid(key, isLocal = false) {
    const date = get("date");
    const tag = $("tag-dropdown").value;

    // Yardımcı Fonksiyonlar
    const isDataLoad = () => {
        return isLocal ? !!allData() : !!allMyData;
    };
    const isDateValid = () => {
        const data = isLocal ? allData() : allMyData;
        return isDataLoad() && !!data[date];
    };
    const isTagsValid = () => {
        const data = isLocal ? allData() : allMyData;
        return isDateValid() && !!data[date]?.tags;
    };
    const isTagValid = () => {
        const data = isLocal ? allData() : allMyData;
        return isTagsValid() && !!data[date]?.tags?.[tag];
    };
    const isSessionValid = () => {
        const data = isLocal ? allData() : allMyData;
        return isTagValid() && !!data[date]?.tags?.[tag]?.sessions;
    };

    // Anahtar Kontrolü
    switch (key) {
        case "data":
            return isDataLoad() ? true : false;
        case "dateData":
            return isDateValid() ? true : false;
        case "tags":
            return isTagsValid() ? true : false;
        case "tagData":
            return isTagValid() ? true : false;
        case "sessions":
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
    const start = new Date(session["start"]);
    const duration = ((now - start) / 1000).toFixed(2);

    return isTime ? duration : `${get("h", duration)}h ${get("m", duration)}m ${get("s", duration)}s`;
}
function get(that, num = 0, isLocal = false) {
    const date = getDateKey(activeDate);
    const tag = $("tag-dropdown").value;
    const main = isLocal ? allData() : allMyData;
    let returni;
    switch (that) {
        case "date": returni = date; break;
        case "tag": returni = tag; break;
        case "dateData": returni = main[date]; break;
        case "tags": returni = main[date].tags; break;
        case "tagData": returni = main[date].tags[tag]; break;
        case "sessions": returni = main[date].tags[tag].sessions; break;
        case "tagsCount": returni = Object.keys(get("tags")).length; break;
        case "sessionsCount": returni = Object.keys(get("sessions")).length; break;
        case "lastSession": returni = get("sessions")[get("sessionsCount")]; break;
        case "now": returni = new Date().toISOString(); break;
        case "h": returni = Math.floor(num / 3600); break;
        case "m": returni = Math.floor(num / 60) % 60; break;
        case "s": returni = Math.floor(num) % 60; break;
    }
    return returni;
}

function getSessionElapsedTime() {
    const currSession = get("lastSession");
    $("duration").innerText = getDuration(currSession, false, true);
}

function getTotalElapsedTime(wantValue = true) {
    const sessions = get("sessions");
    const length = get("sessionsCount");
    let total = 0;
    Object.keys(sessions).forEach((key) => {
        total += parseFloat(sessions[key].duration) || 0;
    });
    const lastSesDuration = parseFloat(getDuration(sessions[length], true, true));
    total += lastSesDuration;
    return wantValue ? total : `${get("h", total)}h ${get("m", total)}m ${get("s", total)}s`;
}

function deleteSession(indx) {
    if (!isValid("sessions")) return;
    const tag = get("tagData", true);
    indx = parseInt(indx, 10); // Convert indx to decimal if it is not
    console.log(get("tagData"), indx)
    console.log(get("tags", true), indx)
    delete tag.sessions[indx];

    // Re-sort sessions
    const sortedTagData = {};
    Object.keys(tag.sessions).sort((a, b) => a - b).forEach((key, index) => {
        //if a-b is -(a is smaller, so); a is first, otherwise; b is first. If it is 0, no changes
        sortedTagData[index + 1] = tag.sessions[key];
    });
    tag.sessions = sortedTagData;
    saveData();
    loadTagsTable(get("tags"));
    renderSessions();
}

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
    $("selected-date").textContent = get("date");
    loadTags();
    if (isValid("data")) loadTagsTable(allData()[get("date")]?.tags);
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

function addNewTag() {
    const modal = $("tag-model");
    const dropdown = $("tag-dropdown");
    const date = get("date");
    const tag = $("tag-name").value;
    const tagCheckInt = $("tag-check-interval").value;
    const tagMinTime = $("tag-min-time").value;
    const tagMaxTime = $("tag-max-time").value;
    if (!tag || !tagCheckInt || !tagMinTime || !tagMaxTime) {
        alert("Please fill all fields");
        return;
    }

    if (!isValid("dateData")) {
        allMyData[date] = { tags: {} };
        get("date").date = date;
    }
    if (!isValid("tag")) {
        get("tags")[tag] = {
            tagCheckInt,
            tagMinTime,
            tagMaxTime,
            sessions: {}
        };
    }
    $("text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    dropdown.dataset.lastTag = tag;
    modal.classList.add("hidden");
    saveData();
    loadTags();
}

/** Load Sessions */
function loadTags() {
    const sessionTable = $("session-log-table");
    const dropdown = $("tag-dropdown");
    const txtCntnt = $("text");
    const date = get("date");
    dropdown.innerHTML = '<option value="0" disabled hidden>Select a session</option>';
    const tags = isValid("tags") ? get("tags") : {};

    if (isValid("tags", true) && typeof tags === 'object') {

        // Populate dropdown
        Object.keys(tags).forEach(tag => {
            dropdown.appendChild(new Option(tag, tag));
            loadTagsTable(tags);
        });
        dropdown.classList.remove("hidden");
        txtCntnt.classList.add("hidden");

        const lastTag = dropdown.dataset.lastTag;
        if (lastTag && tags[lastTag])
            dropdown.value = lastTag;
    } else {
        console.warn(`No sessions found for date: ${date}`);
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
    }
    dropdown.options[dropdown.options.length - 1].value;
    sessionTable.classList.add('hidden');
    renderSessions();
}

function loadTagsTable(tags) {
    const tagTableBody = $("tag-table-body");
    tagTableBody.innerHTML = "";
    if (!isValid("tags")) {
        console.warn("No tag in this date: " + get("date"));
        tagTableBody.classList.add("hidden");
        return;
    }
    Object.keys(tags).forEach(tag => {
        const sec = parseFloat(tags[tag].totalTime) || 0;
        const totalTags = Object.keys(tags[tag].sessions).length;
        tagTableBody.innerHTML += `
        <tr>
        <td>${tag}</td>
        <td>${totalTags}</td>
        <td>${get("h", sec)}h ${get("m", sec)}m ${get("s", sec)}s</td>
        </tr >
        `;
    });
    tagTableBody.classList.remove("hidden");
}

/** Render Sessions */
function renderSessions() {
    const sessionBody = $("session-log-body");
    const tags = get("tags");
    sessionBody.innerHTML = ''; // Clear previous sessions

    if (!isValid("data", true) || !isValid("tags")) return;
    if (isValid("tagData")) {
        const sessions = get("sessions");

        // Check for sessions property before accessing it
        if (sessions && get("sessionsCount") > 0) {
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
    } else console.error("Error: Invalid tag or missing session data.");

    // Add event listeners for start and end buttons
    const startButton = getEventRemovedNode("start-session");
    const endButton = getEventRemovedNode("end-session");
    startButton.addEventListener("click", function addNewSession() {
        if (!isValid("tagData")) return;
        const indx = get("sessionsCount") + 1;
        get("sessions")[indx] = { start: get("now") };

        $("indx").textContent = indx;
        $("start-session").classList.add('hidden');
        $("start-time").appendChild(document.createTextNode(toMyTime(get("now"))));
        $("end-session").classList.remove('hidden');
        saveData();
    });

    endButton.addEventListener("click", function endSession() {
        if (!isValid("sessions")) return;
        const tagData = get("tagData");
        const sessions = get("sessions");
        const indx = get("sessionsCount");
        console.log(sessions, indx);
        sessions[indx].end = new Date().toISOString();
        sessions[indx].duration = getDuration(sessions[indx], true, true);

        let total = 0;
        Object.keys(sessions).forEach((key) => {
            total += parseFloat(sessions[key].duration) || 0;
        });
        tagData.totalTime = total;

        $("start-session").classList.remove('hidden');
        $("end-time").appendChild(document.createTextNode(toMyTime(sessions.end)));
        $("duration").textContent = getDuration(sessions[indx], false, true);
        $("end-session").classList.add('hidden');
        saveData();
        renderSessions();
        loadTagsTable(tags);
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
                document.addEventListener("click", function removeContextMenu(event) {
                    lrowMenu = event.target.closest('#last-row-menu');
                    if (lrowMenu && lrowMenu.classList.contains("menu")) return;
                    else {
                        lastRowMenu.classList.add("hidden");
                        document.removeEventListener("click", removeContextMenu);
                    }
                });
            }
        }
    });
});

$("add-tag-btn").addEventListener("click", () => {
    $("tag-name").value = '';
    $("tag-check-interval").value = '';
    $("tag-min-time").value = '';
    $("tag-max-time").value = '';
    $("tag-model").classList.remove("hidden");
});
$("close-model").addEventListener("click", () => $("tag-model").classList.add("hidden"));
$("submit-tag").addEventListener("click", () => {
    $("tag-dropdown").value = $("tag-name").value;
    addNewTag();
});
$("tag-dropdown").addEventListener("change", renderSessions);
$("tag-dropdown").addEventListener("", renderSessions);
$("next-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
});

$("prev-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

$("new-tag-form").addEventListener("submit", function (e) {
    e.preventDefault();
});

/** Initial Rendering */
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());