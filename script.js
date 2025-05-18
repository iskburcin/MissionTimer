// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();

/** Helper Functions */
function $(selector, isAll = false, from = document) {
    if (isAll) {
        return from.querySelectorAll(selector);
    }
    if (selector.startsWith("#")) {
        return from.getElementById(selector.slice(1));
    }
    return from.querySelector(selector)
}

let allMyData = allData() || {}; // Load from local storage or initialize empty object
function allData() {
    return JSON.parse(localStorage?.getItem("allData"));
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
    return new Date(time).toLocaleTimeString(('tr')).substring(0, 5);
}
const validTimeInput = (val) => {
    return val.replace(/[^0-9]+/g, ""); // doğru regex
};

const setMax = (input) => {
    const type = input.getAttribute("class").charAt(0);
    return type === "h" ? 24 : 60;
};

function throwErr(msg, err, input, invalid = false) {
    if (invalid) {
        input.classList.add("invalid");
        err.classList.remove("hidden");
        err.innerHTML = `<small>${msg}</small>`;
    } else {
        input.classList.remove("invalid");
        err.classList.add("hidden");
        err.innerHTML = "";
    }
}

function validateInput(input, err) {
    const max = setMax(input);
    let val = validTimeInput(input.value.trim());
    if (val.length > 2) val = val.substring(0, 2);
    input.value = val;

    const numVal = parseInt(val, 10);
    const unit = input.getAttribute("class").split("-")[0];

    if (numVal < 0 || numVal > max) {
        const msg = `It can't be more than ${max} ${unit} or less than zero. Try again!`;
        throwErr(msg, err, input, true);
        return false;
    } else {
        throwErr("", err, input, false);
        return true;
    }
}
// Bütün inputları topluca kontrol eder
function validateAllTimeInputs() {
    const timeFields = $(".time-input", true);
    let allValid = true;

    timeFields.forEach(wrapper => {
        const inputs = $("input", true, wrapper);
        const err = $(".error", false, wrapper);

        inputs.forEach(input => {
            const valid = validateInput(input, err);
            if (!valid) allValid = false;
        });
    });

    return allValid;
}

function attachTimeInputListeners() {
    const timeFields = $(".time-input", true);

    timeFields.forEach(wrapper => {
        const inputs = $("input", true, wrapper);
        const err = $(".error", false, wrapper);

        inputs.forEach(input => {
            input.addEventListener("focus", () => {
                if (input.value === "0" || input.value === "00") input.value = "";
            });

            input.addEventListener("blur", () => {
                if (input.value.trim() === "") input.value = "0";
                validateInput(input, err);
            });

            input.addEventListener("keyup", () => {
                validateInput(input, err);
            });
        });
    });
}

function isValid(key, isLocal = false) {
    const date = get("date");
    const tag = $("#tag-dropdown").value;

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

function getEventRemovedNode(element, isReady = false) {
    const elem = isReady ? element : $(`${element}`);
    elem?.replaceWith(elem.cloneNode(true));
    const newElem = $(`${element}`);;
    return newElem;
}

function getDuration(session, isTime, isLast) {
    const now = isLast ? new Date() : new Date(session.end);
    const start = new Date(session["start"]);
    const duration = ((now - start) / 1000).toFixed(2);

    return isTime ? duration : `${get("h", duration)} : ${get("m", duration)}`;
}
function get(that, num = 0, isLocal = false) {
    const date = getDateKey(activeDate);
    const tag = $("#tag-dropdown").value;
    const main = isLocal ? allData() : allMyData;
    let returni;
    switch (that) {
        case "date": returni = date; break;
        case "tag": returni = tag; break;
        case "intervalId": returni = sessionInterval; break;
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
    }
    return returni;
}

function getSessionElapsedTime() {
    const currSession = get("lastSession");
    $("#duration").innerText = getDuration(currSession, false, true);
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
    return wantValue ? total : `${get("h", total)} : ${get("m", total)}`;
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
    let total = 0;
    Object.keys(tag.sessions).forEach((key) => {
        total += parseFloat(tag.sessions[key].duration) || 0;
    });
    tag.sessions = sortedTagData;
    tag.totalTime = total;
    saveData();
    loadTagsTable(get("tags"));
    renderSessions();
}

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
    $("#selected-date").textContent = get("date");
    loadTags();
    if (isValid("data")) loadTagsTable(allData()[get("date")]?.tags);
}

/** Render Calendar */
function renderWeekdays() {
    const container = $("#calendar-weekdays");
    container.innerHTML = weekdays
        .map(day => `<div class='weekday' style='width: calc(100% / 7); display: grid; place-items: center;'>${day}</div>`)
        .join('');
}

function renderCalendar(date) {
    const daysContainer = $("#calendar-days");
    const monthYearLabel = $("#month-year");

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

function addNewTag(isInvalid) {
    if (isInvalid) return
    const modal = $("#tag-model");
    const dropdown = $("#tag-dropdown");
    const date = get("date");
    const tag = $("#tag-name").value;
    const timeFields = $(".time-input", true)
    const hours_mins = {}
    timeFields.forEach(wrapper => {
        const hour = parseInt($(".hour-input", false, wrapper).value) || 0;
        const min = parseInt($(".minute-input", false, wrapper).value) || 0;
        hours_mins[wrapper.getAttribute("id")] = {
            hour: hour,
            min: min,
            totalS: (hour * 60 + min) * 60
        }
    })
    if (!tag) {
        alert("Please fill at least name or check the time you enter");
        return;
    }

    if (!isValid("dateData")) {
        allMyData[date] = { tags: {} };
        get("date").date = date;
    }
    if (!isValid("tag")) {
        get("tags")[tag] = {
            times: hours_mins,
            sessions: {}
        };
    }
    console.log(get("tags")[tag])
    $("#text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    dropdown.dataset.lastTag = tag;
    modal.classList.add("hidden");
    saveData();
    loadTags();
}

/** Load Sessions */
function loadTags() {
    const sessionTable = $("#session-log-table");
    const dropdown = $("#tag-dropdown");
    const txtCntnt = $("#text");
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
        renderSessions();
    } else {
        console.warn(`No sessions found for date: ${date}`);
        dropdown.classList.add("hidden");
        sessionTable.classList.add('hidden');
        txtCntnt.classList.remove("hidden");
    }
}

function loadTagsTable(tags) {
    const tagTableBody = $("#tag-table-body");
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
        <td>${get("h", sec)} : ${get("m", sec)}</td>
        </tr >
        `;
    });
    tagTableBody.classList.remove("hidden");
}

let sessionInterval;
function pushNotif() {
    const tag = get("tagData")
    const sent = {
        break: false,
        sessionMin: false,
        sessionMax: false,
        tagMin: false,
        tagMax: false,
    }
    const tagTimes = tag.times
    const breakTime = tagTimes["break-reminder-time"].totalS || 0;
    const maxSession = tagTimes["session-max-time"].totalS || 0;
    const minSession = tagTimes["session-min-time"].totalS || 0;
    const maxTag = tagTimes["tag-max-time"].totalS || 0;
    const minTag = tagTimes["tag-min-time"].totalS || 0;
    if (sessionInterval) clearInterval(sessionInterval);

    sessionInterval = setInterval(() => {
        console.log("here we are in the interval")
        const elapsed = getDuration(get("lastSession"), true, true)
        if (elapsed > breakTime && !sent.break) {
            notif("Break Time!! ", "Mola Zamanı, çok çalıştın!!");
            sent.break = true
        }
        if (elapsed > minSession && !sent.sessionMin) {
            notif("Minimum Session Time Reminder!! ", "Mola vermediysen şu an tam zamanı :) !!");
            sent.sessionMin = true
        }
        if (getTotalElapsedTime(true) + elapsed > maxSession && !sent.sessionMax) {
            notif("Maximum Session Time Reminder!! ", "Minimumda bile mola vermediysen, bundan sonra durmalısın. Çayınıı koy da gel hadi :) !!");
            sent.sessionMax = true
        }
        if (getTotalElapsedTime(true) + elapsed > minTag && !sent.tagMin) {
            notif("Minimum Tag Time Reminder!! ", "Iste bitti, bu tag için minimum hedefini tamamladın :) !!");
            sent.tagMin = true
        }
        if (elapsed > maxTag && !sent.tagMax) {
            notif("Maximum Tag Time Reminder!! ", "Bu gün kendini aştın!!");
            sent.tagMax = true
        }
    }, 1000)
}

/** Render Sessions */
function renderSessions() {
    const sessionBody = $("#session-log-body");
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
                            <td><textarea class="note-text" id="note-${index + 1}" rows="3" spellcheck="false" >${sessions[key].note || ""}</textarea></td>
                            <td>${toMyTime(sessions[key].start)}</td>
                            <td>${sessions[key].end ? toMyTime(sessions[key].end) : ''}</td>
                            <td>${getDuration(sessions[key], false, false)}</td>
                        </tr>`;
            });
        }
        sessionBody.innerHTML += `
                <tr id="last-row">
                    <td id="indx"></td>
                    <td id="note-area" ><textarea spellcheck="false" class="note-text" id="session-note" rows="3"></textarea></td>
                    <td id="start-time"><button id="start-session">Start</button></td>
                    <td id="end-time"><div style="display:flex;" id="ending-container" class="hidden"><button id="end-session">End</button><button id="cut-session"><span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-scissors" viewBox="0 0 16 16">
  <path d="M3.5 3.5c-.614-.884-.074-1.962.858-2.5L8 7.226 11.642 1c.932.538 1.472 1.616.858 2.5L8.81 8.61l1.556 2.661a2.5 2.5 0 1 1-.794.637L8 9.73l-1.572 2.177a2.5 2.5 0 1 1-.794-.637L7.19 8.61zm2.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0m7 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"/>
</svg></span></button></div></td>
                    <td id="duration">-- : --</td>
                </tr>
                    `;
        $("#session-log-table").classList.remove("hidden");
    } else console.error("Error: Invalid tag or missing session data.");

    // Add event listeners for start and end buttons
    const startButton = getEventRemovedNode("#start-session");
    const endButton = getEventRemovedNode("#end-session");
    const cutButton = getEventRemovedNode("#cut-session");
    startButton.addEventListener("click", () => {
        addNewSession()
        pushNotif()
    })
    function addNewSession() {
        if (!isValid("tagData")) return;
        const indx = get("sessionsCount") + 1;
        get("sessions")[indx] = { start: get("now") };

        $("#indx").textContent = indx;
        $("#start-session").classList.add('hidden');
        $("#start-time").appendChild(document.createTextNode(toMyTime(get("now"))));
        $("#ending-container").classList.remove('hidden');
        saveData();
    };

    endButton.addEventListener("click", endSession);
    function endSession() {
        if (!isValid("sessions")) return;
        const tagData = get("tagData");
        const sessions = get("sessions");
        const indx = get("sessionsCount");

        sessions[indx].end = new Date().toISOString();
        sessions[indx].duration = getDuration(sessions[indx], true, true);
        sessions[indx].note = $("#session-note").value || "";
        let total = 0;
        Object.keys(sessions).forEach((key) => {
            total += parseFloat(sessions[key].duration) || 0;
        });
        tagData.totalTime = total;
        if (sessionInterval) {
            clearInterval(sessionInterval);
            sessionInterval = null;
        }
        $("#start-session").classList.remove('hidden');
        $("#end-time").appendChild(document.createTextNode(toMyTime(sessions.end)));
        $("#duration").textContent = getDuration(sessions[indx], false, true);
        $("#ending-container").classList.add('hidden');
        saveData();
        renderSessions();
        loadTagsTable(tags);
    };

    cutButton.addEventListener("click", () => {
        endSession();
        addNewSession();
        pushNotif()
    })

    const notes = $(".note-text", true);
    notes.forEach((note, key) => (
        note.addEventListener("change", () => {
            const sessions = get("sessions");
            sessions[key + 1].note = note.value;
            saveData();
        })
    ))
}

/** Notification Handler */
const notif = (title, body) => {
    return new Notification(title, {
        body: body
    })
}
function sendNotification() {
    if (Notification.permission === 'granted') {
        pageNotif = notif("Hey welcome", `you granted the notification`)
        console.log("noftification granted: ", pageNotif)
    } else {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                pageNotif = notif("Hey welcome", `you granted the notification`)
            }
        });
    }
}

/** EVENT LISTENERS */

/**DomContent loaded kullanmamızın sebebi tüm html ve deferred scripts yüklendikten, ama stylesheetlerden önce documanı durdurur. Yani bizim  */
document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for right-click to show delete option
    $("#session-log-body").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        const contextMenu = $("#table-body-menu");
        const lastRowMenu = $("#last-row-menu");
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

            const newDeleteButton = getEventRemovedNode("#delete-session");

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
            if ($("#start-session").classList.contains("hidden") && contextMenu.classList.contains("hidden") && targetRow.id === "last-row") {
                lastRowMenu.classList.remove("hidden");
                lastRowMenu.style.top = `${event.pageY}px`;
                lastRowMenu.style.left = `${event.pageX}px`;
                const sessionTime = getEventRemovedNode("#session-elapsed-time");
                const totalTime = getEventRemovedNode("#total-elapsed-time");
                sessionTime.addEventListener("change", () => {
                    if (sessionTime.checked) {
                        getSessionElapsedTime();
                        totalTime.checked = false;
                    } else
                        $("#duration").innerText = "-- : --";
                });
                totalTime.addEventListener("change", (e) => {
                    if (totalTime.checked) {
                        $("#duration").innerText = getTotalElapsedTime(false);
                        sessionTime.checked = false;
                    } else
                        $("#duration").innerText = "-- : --";
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

$("#add-tag-btn").addEventListener("click", () => {
    // timeIsInvalid();
    // $("#tag-name").value = '';
    // $("#tag-check-interval").value = '';
    // $("#tag-min-time").value = '';
    // $("#tag-max-time").value = '';
    $("#tag-model").classList.remove("hidden");
    sendNotification()
});
$("#close-model").addEventListener("click", () => $("#tag-model").classList.add("hidden"));
$("#tag-dropdown").addEventListener("change", renderSessions);
$("#tag-dropdown").addEventListener("", renderSessions);
$("#next-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
});

$("#prev-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

$("#new-tag-form").addEventListener("submit", function (e) {
    e.preventDefault();
});

let count = 0
$("#submit-tag").addEventListener("click", () => {
    if (validateAllTimeInputs()) {
        $("#tag-adding-error").classList.add("hidden")
        $("#tag-dropdown").value = $("#tag-name").value;
        addNewTag();
    } else {
        $("#tag-adding-error").classList.remove("hidden")
        $("#tag-adding-error").innerHTML = `<small>Check time inputs again. Fault count: ${++count} </small>`;
    }
});
/** Initial Rendering */
attachTimeInputListeners();
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());