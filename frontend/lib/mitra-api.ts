
import api from './api';

export const getMitraPublicProfile = async (slug: string) => {
  try {
    const response = await api.get(`/auth/public-profile/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mitra public profile:', error);
    throw error;
  }
};

export const getEventsByMitra = async (mitraSlug: string) => {
  try {
    const response = await api.get(`/events/partner/${mitraSlug}`);
    return response.data.data; // The events are in the 'data' property
  } catch (error) {
    console.error('Error fetching events by mitra:', error);
    throw error;
  }
};
