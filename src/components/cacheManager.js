// utils/cacheManager.js

const MAX_CACHE_ITEMS = 5; 

const PROTECTED_KEYS = [
    'authToken', 
    'studentSession'
];

export const smartCacheSet = (key, data) => {
    try {
        let queue = JSON.parse(sessionStorage.getItem('cache_queue') || '[]');

        if (!queue.includes(key)) {
            queue.push(key);
        }

        if (queue.length > MAX_CACHE_ITEMS) {
            const oldestKey = queue.shift(); 
            sessionStorage.removeItem(oldestKey); 
        }

        sessionStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem('cache_queue', JSON.stringify(queue));

    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn("Browser memory full! Flushing non-critical cache.");
            
            // 1. BACKUP: Temporarily hold critical data in a local object
            const backup = {};
            PROTECTED_KEYS.forEach(protectedKey => {
                const value = sessionStorage.getItem(protectedKey);
                if (value !== null) {
                    backup[protectedKey] = value;
                }
            });

            // 2. NUKE: Clear the bloated session storage
            sessionStorage.clear(); 
            
            // 3. RESTORE: Put the critical login data right back
            Object.keys(backup).forEach(protectedKey => {
                sessionStorage.setItem(protectedKey, backup[protectedKey]);
            });

            // 4. RE-TRY: Try saving just this one new piece of data again
            try {
                sessionStorage.setItem(key, JSON.stringify(data)); 
                sessionStorage.setItem('cache_queue', JSON.stringify([key]));
            } catch (retryError) {
                console.error("Data is too large to cache even after flushing!", retryError);
            }
            
        } else {
            console.error("Caching error:", e);
        }
    }
};

export const smartCacheGet = (key) => {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};