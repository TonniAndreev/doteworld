// Mock Firebase service for demo purposes
// In a real app, this would be replaced with actual Firebase configuration

export const auth = {
  onAuthStateChanged: (callback) => {
    // Mock implementation
    return () => {};
  },
  signInWithEmailAndPassword: async (email, password) => {
    // Mock implementation
    return Promise.resolve();
  },
  signOut: async () => {
    // Mock implementation
    return Promise.resolve();
  },
};

export const firestore = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({
        exists: true,
        data: () => ({}),
      }),
      update: async (data) => {},
      set: async (data) => {},
    }),
  }),
};

export const storage = {
  ref: () => ({
    child: (path) => ({
      put: async (file) => {},
      getDownloadURL: async () => 'https://example.com/image.jpg',
    }),
  }),
};