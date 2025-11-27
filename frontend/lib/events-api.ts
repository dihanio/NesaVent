import api from './api';

// Get all events
export const getAllEvents = async (params?: {
  kategori?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await api.get('/events', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event');
  }
};

// Get event by ID
export const getEventById = async (id: string) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil detail event');
  }
};

// Get events by partner ID
export const getEventsByPartnerId = async (partnerId: string, params?: {
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await api.get(`/events/partner/${partnerId}`, { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil data event partner');
  }
};

// Create new event
export const createEvent = async (eventData: any) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal membuat event');
  }
};

// Update event
export const updateEvent = async (id: string, eventData: any) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal mengupdate event');
  }
};

// Delete event
export const deleteEvent = async (id: string) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus event');
  }
};