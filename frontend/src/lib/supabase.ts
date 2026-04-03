// FAKE SUPABASE CLIENT (Express Backend Adapter)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class PostgrestQueryBuilder {
  constructor(table) {
    this.table = table;
    this.method = 'GET';
    this.params = new URLSearchParams();
    this.body = null;
    this.isSingle = false;
  }

  select(columns = '*') {
    this.method = 'GET';
    this.params.append('select', columns);
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.body = data;
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  in(column, values) {
    this.params.append(column, `in.(${values.join(',')})`);
    return this;
  }

  order(column, options = { ascending: true }) {
    this.params.append('order', `${column}.${options.ascending ? 'asc' : 'desc'}`);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve, reject) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        // our session format stores it as json usually depending on how we handle it
        try {
           const parsed = JSON.parse(token);
           if (parsed?.access_token) headers['Authorization'] = `Bearer ${parsed.access_token}`;
        } catch(e) {
           headers['Authorization'] = `Bearer ${token}`; // Fallback
        }
      }

      const options = { method: this.method, headers };
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

export const supabase = {
  from: (table) => new PostgrestQueryBuilder(table),
  
  auth: {
    async signUp({ email, password, options }) {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/v1/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: options?.data?.name, role: options?.data?.role })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async signInWithPassword({ email, password }) {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/v1/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        localStorage.setItem('supabase.auth.token', data.session.access_token);
        return { data: { user: data.user, session: data.session }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async signOut() {
      localStorage.removeItem('supabase.auth.token');
      return { error: null };
    },
    async getUser() {
       // get current user via /me
       const token = localStorage.getItem('supabase.auth.token');
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
    onAuthStateChange(callback) {
      // Mock this so components don't crash
      setTimeout(() => callback('INITIAL_SESSION', null), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  
  storage: {
    from: (bucket) => ({
      async upload(path, file, options) {
        try {
          const form = new FormData();
          form.append('file', file);
          const token = localStorage.getItem('supabase.auth.token');
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
      getPublicUrl(path) {
        return { data: { publicUrl: `${BACKEND_URL}/storage/v1/object/public/${bucket}/${path}` } };
      },
      async remove(paths) {
        return { data: true, error: null }; // Mock stub
      }
    })
  }
};

export const uploadFile = async (file, bucket, path) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket, path) => {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const deleteFile = async (bucket, path) => {
  return supabase.storage.from(bucket).remove([path]);
};