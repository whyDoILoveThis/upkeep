import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  push as fbPush,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  type DatabaseReference,
  type DataSnapshot,
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

function getFirebaseApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

type WrappedRef = {
  get: () => Promise<DataSnapshot>;
  set: (data: unknown) => Promise<void>;
  push: () => WrappedRef;
  update: (data: Record<string, unknown>) => Promise<void>;
  remove: () => Promise<void>;
  key: string | null;
  orderByChild: (child: string) => {
    equalTo: (value: string | number | boolean | null) => {
      get: () => Promise<DataSnapshot>;
    };
  };
};

/**
 * Returns a wrapper that matches the firebase-admin Database API
 * so all existing route code works without changes.
 */
function wrapRef(r: DatabaseReference): WrappedRef {
  return {
    get: () => get(r),
    set: (data: unknown) => set(r, data),
    push: () => wrapRef(fbPush(r)),
    update: (data: Record<string, unknown>) => update(r, data),
    remove: () => remove(r),
    key: r.key,
    orderByChild: (child: string) => ({
      equalTo: (value: string | number | boolean | null) => ({
        get: () => get(query(r, orderByChild(child), equalTo(value))),
      }),
    }),
  };
}

export function getDb() {
  const app = getFirebaseApp();
  const database = getDatabase(app);
  return {
    ref: (path: string) => wrapRef(dbRef(database, path)),
  };
}
