//Creating variable to hold db connection
let db;

// Creating db and setting it to v1.
const request = indexedDB.open('budget_tracker' || 1);


//this event will fire if the db versions changes.
request.onupgradeneeded = function (event) {

    //storing the reference to the db in a variable
    const db = event.target.result;

    //If no objectStore then we must create one, setting it to autoincrement primary key 
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('FinanceStore', { autoIncrement: true });
    }
};


//Upon successful request
request.onsuccess = function (event) {
    db = event.target.result;

    // Check if app is online before reading from db, if yes run ckdb function to send all local db data to API
    if (navigator.onLine) {
        checkDB();
    }
};


//If error occurs log error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};


//This function will fire only if user tried to submit new transaction offline
const saveRecord = (record) => {
    // Create a transaction on the FinanceStore db with read and write access
    const transaction = db.transaction(['FinanceStore'], 'readwrite');

    // Accessing the FinanceStore object store
    const store = transaction.objectStore('FinanceStore');

    // Add record to your store
    store.add(record);
};

//This function will be executed when check the data base and upload everything that was done while offline. 
function checkDB() {
    // Open a transaction on your FinanceStore db
    let transaction = db.transaction(['FinanceStore'], 'readwrite');

    // access your FinanceStore object
    const store = transaction.objectStore('FinanceStore');

    // Get all records from store and set to a variable
    const getAll = store.getAll();

    // If the request was successful
    getAll.onsuccess = function () {
        // If there are items in the store, we need to bulk add them when we are back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // If our returned response is not empty
                    if (res.length !== 0) {
                        // Open another transaction to FinanceStore with the ability to read and write
                        transaction = db.transaction(['FinanceStore'], 'readwrite');

                        // Assign the current store to a variable
                        const currentStore = transaction.objectStore('FinanceStore');

                        // Clear existing entries because our bulk add was successful
                        currentStore.clear();

                        alert('All saved transactions has been submitted!');
                    }
                })
                .catch (err => {
                    console.log(err);
                });
        }
    };
};


// Listen for app coming back online
window.addEventListener('online', checkDB);
