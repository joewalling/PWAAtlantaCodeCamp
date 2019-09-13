const API_URL = 'https://dispatcherpwaapi.azurewebsites.net/api/dispatches';

var offlineNotification = document.getElementById('offline');

// Show an offline notification if the user is offline
function showIndicator() {
    console.log('offline');
    offlineNotification.className = 'showOfflineNotification';
  }
  
  // Hide the offline notification when the user comes back online
  function hideIndicator() {
      console.log('online');
    offlineNotification.className = 'hideOfflineNotification';
}

if (navigator.onLine) {
    hideIndicator();
} else {
    showIndicator();
}
  
// Update the online status icon based on connectivity
window.addEventListener('online',  hideIndicator);
window.addEventListener('offline', showIndicator);



window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB.");
}

const DB_NAME = 'DispatchesDb';
const DB_VERSION = 1; 
const DB_STORE_NAME = 'dispatches';

let db;
let dbReq = indexedDB.open(DB_NAME, DB_VERSION);
dbReq.onupgradeneeded = function (event) {
    console.log('onupgradeneeded');
    db = event.target.result;

    db.createObjectStore(DB_STORE_NAME, { keyPath: "id" });
}
dbReq.onsuccess = function (event) {
    console.log('onsuccess');
    db = event.target.result;

    getDispatchesFromDb();
}
dbReq.onerror = function (event) {
    alert('error opening database ' + event.target.errorCode);
}

function getObjectStore(storeName, mode) {
    var tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

function addDispatchToDb(dispatch) {
    console.log("addDispatchToDb arguments: ", arguments);
    if (dispatchExists(dispatch)) {
        return;
    }
    currentDispatches.push(dispatch);
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.add(dispatch);
    req.onsuccess = function (evt) {
        console.log("Insertion in DB successful");
    };
    req.onerror = function () {
        console.error("addDispatchToDb error", this.error);
    };

}

function deleteDispatchFromDb(id, callback) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    let req = store.get(id);
    req.onsuccess = function (evt) {
        var record = evt.target.result;
        console.log("record:", record);
        if (typeof record == 'undefined') {
            console.log('No matching record found');
            return;
        }
        req = store.delete(id);
        req.onsuccess = function (evt) {
            console.log("evt:", evt);
            console.log("evt.target:", evt.target);
            console.log("evt.target.result:", evt.target.result);
            console.log("delete successful");

            callback && callback();
        };
        req.onerror = function (evt) {
            console.error("deleteDispatchFromDb:", evt.target.errorCode);
        };
    };
    req.onerror = function (evt) {
        console.error("deleteDispatchFromDb:", evt.target.errorCode);
    };
}

function markDeliveredInDb(id, callback) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    let req = store.get(id);

    req.onsuccess = function (evt) {
        var record = evt.target.result;
        console.log("record:", record);
        if (typeof record == 'undefined') {
            console.log('No matching record found');
            return;
        }
        record.isDelivered = true;
        req = store.put(record);
        req.onsuccess = function(evt) {
            callback && callback();
        };
        req.onerror = function (evt) {
            console.error("markDeliveredInDb:", evt.target.errorCode);
        };
    };
    req.onerror = function (evt) {
        console.error("markDeliveredInDb:", evt.target.errorCode);
    };
}

function dispatchExists(dispatch) {
    const maxId = currentDispatches.map(d => d.id).reduce((acc, cur) => Math.max(acc, cur), 0);
    return dispatch.id <= maxId;
}

let currentDispatches;
function getDispatchesFromDb() {
    var store = getObjectStore(DB_STORE_NAME, 'readonly');
    store.getAll().onsuccess = function(e) {
        currentDispatches = e.target.result;
        console.log(currentDispatches);
        updateData(() => {
            console.log(currentDispatches.filter(d => !d.isDelivered));
            let currentDispatch = getFirstUndeliveredDispatch();
            if (currentDispatch) {
                showData(currentDispatch);
            } else {
                showNoDispatches();
            }
        });
    };
}


function getDispatches() {
    return fetch(API_URL)
        .then((response) => {
            return response.json();
        })
        .catch(() => {
            return null;
        });
}

function getFirstUndeliveredDispatch() {
    return currentDispatches.find(d => !d.isDelivered);
}

function updateData(callback) {
    getDispatches()
        .then((dispatches) => {
            if (dispatches) {
                dispatches.map((dispatch) => {
                    addDispatchToDb(dispatch);
                });
            }
        })
        .then(callback);
}

function showData(dispatch) {
    const noDispatchesDiv = document.getElementById('nodispatches');
    if (noDispatchesDiv) {
        noDispatchesDiv.setAttribute('hidden', true);
    }
    const infoDiv = document.getElementById('info');
    infoDiv.removeAttribute('hidden');

    showProperty('dispatch_date', dispatch.deliveryDate);
    showProperty('dispatch_customer', dispatch.customer);
    showProperty('dispatch_ismultipleloads', dispatch.isMultipleLoads ? 'Yes' : 'No');
    showProperty('dispatch_pickup', dispatch.loadAt);
    showProperty('dispatch_quantity', dispatch.quantity + ' ' + dispatch.uom);
    showProperty('dispatch_pickupnote', dispatch.pickupNote);
    showProperty('dispatch_deliverto', dispatch.deliverTo);
    showProperty('dispatch_route', '');
    showProperty('dispatch_deliverynote', dispatch.deliveryNote);
}

function showNoDispatches() {
    const noDispatchesDiv = document.getElementById('nodispatches');
    noDispatchesDiv.removeAttribute('hidden');
    const infoDiv = document.getElementById('info');
    infoDiv.setAttribute('hidden', true);
    const headerDiv = document.getElementById('header');
    headerDiv.innerHTML = 'There are no new dispatches';
}

function showProperty(elementId, propertyValue) {
    let span = document.getElementById(elementId);
    if (span) {
        span.innerHTML = propertyValue;
    }
}

function deliver() {
    let currentDispatch = getFirstUndeliveredDispatch();
    if (currentDispatch) {
        markDeliveredInDb(currentDispatch.id, () => {
            location.href = '/';
        });
    }
}


