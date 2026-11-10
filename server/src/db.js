import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { generateUUID } from './utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for local fallback persistence
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'vault-store.json');

// Memory store structure
let memoryStore = {
  users: [],
  accounts: [],
  transactions: [],
  ledgerEntries: [],
  auditLogs: [],
  kycApplications: [],
  systemSettings: []
};

// Check if data file exists and load it
function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryStore = { ...memoryStore, ...parsed };
    }
  } catch (err) {
    console.warn('[DB] Could not load storage from disk, using fresh in-memory state:', err.message);
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save state to disk:', err.message);
  }
}

loadFromDisk();

// Helper matching functions
function matchesWhere(item, where = {}) {
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (typeof val === 'object' && val !== null) {
      if (val.in && Array.isArray(val.in)) {
        if (!val.in.includes(item[key])) return false;
      } else if (val.not !== undefined) {
        if (item[key] === val.not) return false;
      }
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

/**
 * Embedded Model Repository Factory
 */
function createModelRepo(tableName) {
  return {
    async findUnique({ where, include = {} }) {
      const items = memoryStore[tableName] || [];
      const item = items.find(i => matchesWhere(i, where));
      if (!item) return null;
      return hydrateRelations(tableName, item, include);
    },

    async findFirst({ where, orderBy, include = {} }) {
      let items = [...(memoryStore[tableName] || [])];
      if (where) {
        items = items.filter(i => matchesWhere(i, where));
      }
      if (orderBy) {
        applyOrderBy(items, orderBy);
      }
      const item = items[0] || null;
      if (!item) return null;
      return hydrateRelations(tableName, item, include);
    },

    async findMany({ where, orderBy, take, skip, include = {} } = {}) {
      let items = [...(memoryStore[tableName] || [])];
      if (where) {
        items = items.filter(i => matchesWhere(i, where));
      }
      if (orderBy) {
        applyOrderBy(items, orderBy);
      }
      if (typeof skip === 'number') {
        items = items.slice(skip);
      }
      if (typeof take === 'number') {
        items = items.slice(0, take);
      }
      return items.map(item => hydrateRelations(tableName, item, include));
    },

    async count({ where } = {}) {
      let items = memoryStore[tableName] || [];
      if (where) {
        items = items.filter(i => matchesWhere(i, where));
      }
      return items.length;
    },

    async create({ data, include = {} }) {
      const items = memoryStore[tableName] || [];
      const now = new Date();
      const newItem = {
        id: data.id || generateUUID(),
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now
      };
      // auto-increment sequenceNumber if ledgerEntries
      if (tableName === 'ledgerEntries' && typeof newItem.sequenceNumber !== 'number') {
        const maxSeq = items.reduce((max, e) => Math.max(max, e.sequenceNumber || 0), 0);
        newItem.sequenceNumber = maxSeq + 1;
      }
      items.push(newItem);
      memoryStore[tableName] = items;
      saveToDisk();
      return hydrateRelations(tableName, newItem, include);
    },

    async update({ where, data, include = {} }) {
      const items = memoryStore[tableName] || [];
      const index = items.findIndex(i => matchesWhere(i, where));
      if (index === -1) {
        throw new Error(`Record to update not found in ${tableName}`);
      }
      const updated = {
        ...items[index],
        ...data,
        updatedAt: new Date()
      };
      items[index] = updated;
      memoryStore[tableName] = items;
      saveToDisk();
      return hydrateRelations(tableName, updated, include);
    },

    async delete({ where }) {
      const items = memoryStore[tableName] || [];
      const index = items.findIndex(i => matchesWhere(i, where));
      if (index === -1) {
        throw new Error(`Record to delete not found in ${tableName}`);
      }
      const deleted = items.splice(index, 1)[0];
      saveToDisk();
      return deleted;
    },

    async deleteMany({ where } = {}) {
      let items = memoryStore[tableName] || [];
      const initialCount = items.length;
      if (where) {
        items = items.filter(i => !matchesWhere(i, where));
      } else {
        items = [];
      }
      memoryStore[tableName] = items;
      saveToDisk();
      return { count: initialCount - items.length };
    }
  };
}

function applyOrderBy(items, orderBy) {
  for (const [key, dir] of Object.entries(orderBy)) {
    items.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (va instanceof Date) va = va.getTime();
      if (vb instanceof Date) vb = vb.getTime();
      if (dir === 'desc') {
        return va < vb ? 1 : va > vb ? -1 : 0;
      }
      return va > vb ? 1 : va < vb ? -1 : 0;
    });
  }
}

function hydrateRelations(tableName, item, include = {}) {
  const result = { ...item };
  if (tableName === 'users') {
    if (include.accounts) {
      result.accounts = (memoryStore.accounts || []).filter(a => a.userId === item.id);
    }
    if (include.kycApplication) {
      result.kycApplication = (memoryStore.kycApplications || []).find(k => k.userId === item.id) || null;
    }
  } else if (tableName === 'accounts') {
    if (include.user) {
      result.user = (memoryStore.users || []).find(u => u.id === item.userId) || null;
    }
    if (include.ledgerEntries) {
      result.ledgerEntries = (memoryStore.ledgerEntries || []).filter(l => l.accountId === item.id);
    }
  } else if (tableName === 'transactions') {
    if (include.ledgerEntries) {
      result.ledgerEntries = (memoryStore.ledgerEntries || []).filter(l => l.transactionId === item.id);
    }
  } else if (tableName === 'kycApplications') {
    if (include.user) {
      result.user = (memoryStore.users || []).find(u => u.id === item.userId) || null;
    }
  }
  return result;
}

/**
 * Universal Database Client matching Prisma API
 */
export const db = {
  user: createModelRepo('users'),
  account: createModelRepo('accounts'),
  transaction: createModelRepo('transactions'),
  ledgerEntry: createModelRepo('ledgerEntries'),
  auditLog: createModelRepo('auditLogs'),
  kycApplication: createModelRepo('kycApplications'),
  systemSetting: createModelRepo('systemSettings'),

  /**
   * Atomic Transaction execution
   */
  async $transaction(fn) {
    // Snapshot state before transaction
    const snapshot = JSON.stringify(memoryStore);
    try {
      const result = await fn(this);
      saveToDisk();
      return result;
    } catch (err) {
      // Rollback on any failure
      memoryStore = JSON.parse(snapshot);
      throw err;
    }
  },

  /**
   * Raw store inspection for tamper simulation and testing
   */
  _getRawEntries() {
    return memoryStore.ledgerEntries;
  },

  _tamperWithEntry(index, newAmount) {
    if (memoryStore.ledgerEntries[index]) {
      memoryStore.ledgerEntries[index].amount = newAmount;
      saveToDisk();
      return true;
    }
    return false;
  },

  _resetStore() {
    memoryStore = {
      users: [],
      accounts: [],
      transactions: [],
      ledgerEntries: [],
      auditLogs: [],
      kycApplications: [],
      systemSettings: []
    };
    saveToDisk();
  }
};
