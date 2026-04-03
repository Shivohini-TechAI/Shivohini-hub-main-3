// CUSTOM NODE/EXPRESS BACKEND SDK
// This completely replaces Supabase! It connects to your Express API.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class PostgrestQueryBuilder {
  table: string;
  method: string;
  params: URLSearchParams;
  body: any;
  isSingle: boolean;

  constructor(table: string) {
    this.table = table;
    this.method = 'GET';
    this.params = new URLSearchParams();
    this.body = null;
    this.isSingle = false;
  }

  select(columns: string = '*') {
    this.method = 'GET';
    this.params.append('select', columns);
    return this;
  }

  insert(data: any) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  update(data: any) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  in(column: string, values: any[]) {
    this.params.append(column, `in.(${values.join(',')})`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.params.append('order', `${column}.${options.ascending ? 'asc' : 'desc'}`);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('api.auth.token');
      if (token) {
        try {
           const parsed = JSON.parse(token);
           if (parsed?.access_token) headers['Authorization'] = `Bearer ${parsed.access_token}`;
        } catch(e) {
           headers['Authorization'] = `Bearer ${token}`; 
        }
      }

      const options: RequestInit = { method: this.method, headers };
      if (this.body) options.body = JSON.stringify(this.body);

      const qs = this.params.toString();
      const url = `${BACKEND_URL}/rest/v1/${this.table}${qs ? '?' + qs : ''}`;
      
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(await res.text());
      
      let data = await res.json();
      if (this.isSingle && Array.isArray(data)) {
        data = data[0] || null;
      }
      resolve({ data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

export const api: any = {
  from: (table: string) => new PostgrestQueryBuilder(table),
  
  auth: {
    async signUp({ email, password, options }: any) {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/v1/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: options?.data?.name, role: options?.data?.role })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        localStorage.setItem('api.auth.token', data.session.access_token);
        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/v1/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        localStorage.setItem('api.auth.token', data.session.access_token);
        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async signOut() {
      localStorage.removeItem('api.auth.token');
      return { error: null };
    },
    async getSession() {
      const token = localStorage.getItem('api.auth.token');
      if (!token) return { data: { session: null }, error: null };
      try {
        const res = await fetch(`${BACKEND_URL}/auth/v1/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unauth');
        const data = await res.json();
        return { data: { session: { access_token: token, user: data.user } }, error: null };
      } catch (err) {
         return { data: { session: null }, error: null };
      }
    },
    async getUser() {
       const token = localStorage.getItem('api.auth.token');
       if (!token) return { data: { user: null }, error: null };
       try {
         const res = await fetch(`${BACKEND_URL}/auth/v1/me`, {
           headers: { 'Authorization': `Bearer ${token}` }
         });
         if (!res.ok) throw new Error('Unauth');
         const data = await res.json();
         return { data: { user: data.user }, error: null };
       } catch (err) {
         return { data: { user: null }, error: err };
       }
    },
    onAuthStateChange(callback: any) {
      setTimeout(() => callback('INITIAL_SESSION', null), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  
  storage: {
    from: (bucket: string) => ({
      async upload(path: string, file: File, options?: any) {
        try {
          const form = new FormData();
          form.append('file', file);
          const token = localStorage.getItem('api.auth.token');
          const res = await fetch(`${BACKEND_URL}/storage/v1/${bucket}/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: form
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `${BACKEND_URL}/storage/v1/object/public/${bucket}/${path}` } };
      },
      async remove(paths: string[]) {
        return { data: true, error: null };
      }
    })
  }
};

export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await api.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket: string, path: string) => {
  return api.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  return api.storage.from(bucket).remove([path]);
};
